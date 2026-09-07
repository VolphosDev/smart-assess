import { test, expect } from '@playwright/test';

test.describe('Flujo de Estudiante (e2e/student.spec.ts)', () => {

  test.beforeEach(async ({ page }) => {
    // Interceptar login para que devuelva un estudiante
    await page.route('**/api/auth/login', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: 'u-est-1',
            email: 'alex@colegio.edu',
            role: 'student',
            name: 'Alex Quispe',
            token: 'mocked-jwt-token-student',
            consentimientoAceptado: true // Evita la visualización del modal de consentimiento de datos
          }
        })
      });
    });

    // Interceptar obtención de cursos del estudiante
    await page.route('**/api/cursos/estudiante/u-est-1', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 'bio', name: 'Biología Celular', emoji: '🧬', color: 'lime', teacherId: 'u-prof-1', weeks: 5 }
        ])
      });
    });

    // Interceptar semanas del curso de Biología
    await page.route('**/api/cursos/bio/semanas', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'w-1',
            numSem: 'Semana 1',
            totalPreguntas: 5,
            materiales: [
              { id: 'mat-1', mongoId: 'mongo-pdf-id-123', nombreArchivo: 'Biologia_Celular_Introduccion.pdf', visible: true }
            ]
          }
        ])
      });
    });

    // Interceptar obtención de intentos para estadísticas del dashboard
    await page.route('**/api/intentos/mis-intentos/u-est-1', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([])
      });
    });

    // Interceptar rendimiento mapa de calor del dashboard
    await page.route('**/api/rendimiento/mapa-calor/u-est-1', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([])
      });
    });

    // Interceptar detalles de la semana (usado en EvalModeSelect y Practice)
    await page.route('**/api/semanas/w-1', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'w-1',
          numSem: 'Semana 1',
          totalPreguntas: 5,
          materiales: [
            { id: 'mat-1', mongoId: 'mongo-pdf-id-123', nombreArchivo: 'Biologia_Celular_Introduccion.pdf', visible: true }
          ]
        })
      });
    });

    // Login automático
    await page.goto('/');
    await page.fill('input[id="email"]', 'alex@colegio.edu');
    await page.fill('input[id="password"]', 'student');
    await page.click('button[type="submit"]');

    // Configurar banderas de desarrollo y test en localStorage para saltar bloqueos de flujo formativo y tutoriales
    await page.evaluate(() => {
      localStorage.setItem('semantika.testing_ignorar_bloqueo', 'true');
      localStorage.setItem('semantika.testing_ignorar_recomendados', 'true');
      localStorage.setItem('semantika.testing_ignorar_continuar', 'true');
      localStorage.setItem('semantika.testing_ignorar_obligacion_practicas', 'true');
      localStorage.setItem('semantika.skip_tutorial.u-est-1.OPCION_MULTIPLE', 'true');
    });

    // Verificar que estamos en la vista de estudiante
    await expect(page).toHaveURL(/\/app/);
  });

  test('Navegar Curso, Previsualizar Material y Dar Examen', async ({ page }) => {
    // 1. Navegar al curso "Biología Celular"
    const courseCard = page.locator('h3:has-text("Biología Celular")');
    await expect(courseCard).toBeVisible();
    await courseCard.click();
    await expect(page).toHaveURL(/\/app\/curso\/bio/);

    // 2. Previsualizar archivo PDF
    // Interceptar obtención de contenido del PDF
    await page.route('**/api/cursos/ver-archivo/mongo-pdf-id-123', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/pdf',
        body: Buffer.from('%PDF-1.4 mock content')
      });
    });

    // Hacer click en el nombre del archivo para abrir la previsualización
    const fileLink = page.locator('button:has-text("Biologia_Celular_Introduccion.pdf")');
    await expect(fileLink).toBeVisible();
    await fileLink.click();

    // Comprobar que el modal de previsualización se abre y muestra el título correcto
    const previewHeader = page.locator('h3:has-text("Biologia_Celular_Introduccion.pdf")');
    await expect(previewHeader).toBeVisible();

    // Cerrar modal usando el botón cerrar con el title "Cerrar"
    await page.click('button[title="Cerrar"]');
    await expect(previewHeader).not.toBeVisible();

    // 3. Dar examen de la Semana 1
    // Forzar el fallo de SSE para que use la llamada API normal
    await page.route('**/archivos/stream-tecnica-pdf**', async (route) => {
      await route.fulfill({ status: 500 });
    });

    // Mock del REST fallback para devolver las preguntas estructuradas
    await page.route('**/archivos/una-tecnica-pdf-id**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          preguntas: [
            {
              enunciado: '¿Cuál es la función principal de las mitocondrias?',
              opciones_o_respuesta: [
                'Producción de energía ATP',
                'Síntesis de lípidos',
                'Digestión celular',
                'Almacenamiento de agua'
              ],
              justificacion_pregunta: 'Las mitocondrias son las centrales energéticas celulares que producen ATP.',
              respuesta_correcta: 'Producción de energía ATP'
            }
          ],
          tipo_pregunta: 'OPCION_MULTIPLE',
          nivel_bloom: '2',
          metricas_objetivas: {}
        })
      });
    });

    // Click en evaluar
    await page.click('a:has-text("Evaluarme")');
    await expect(page).toHaveURL(/\/app\/curso\/bio\/semana\/w-1/);

    // Seleccionar modo de evaluación: Examen clásico/opción múltiple
    // Buscamos el botón de modo Opción Múltiple usando selector exacto h3
    await page.click('h3:has-text("Opción múltiple")');

    // Comprobar redirección al visor del test
    await expect(page).toHaveURL(/\/app\/curso\/bio\/semana\/w-1\/evaluacion\/OPCION_MULTIPLE/);

    // Verificar que la pregunta cargó utilizando getByText para mayor resiliencia
    const questionText = page.getByText('¿Cuál es la función principal de las mitocondrias?');
    await expect(questionText).toBeVisible();

    // Interceptar llamada de evaluación de la respuesta por el Juez de IA
    await page.route('**/api/agent-judge/evaluar-respuesta', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          evaluacion: {
            puntaje: 20,
            esCorrecta: true,
            explicacion: 'Excelente. Las mitocondrias producen energía celular en forma de ATP mediante respiración celular.'
          }
        })
      });
    });

    // Seleccionar alternativa correcta usando getByText
    await page.getByText('Producción de energía ATP').click();

    // Click en Enviar Respuesta / Comprobar
    await page.click('button:has-text("Comprobar")');

    // Debe mostrarse la explicación del Tutor IA
    const feedbackBox = page.getByText('Excelente. Las mitocondrias producen energía celular');
    await expect(feedbackBox).toBeVisible();

    // Interceptar llamada para guardar intento
    await page.route('**/api/intentos/guardar', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ id: 999, message: 'Intento guardado' })
      });
    });

    // Finalizar examen usando el texto real del botón obtenido de la accesibilidad "Finalizar y Ver Resultados"
    await page.click('button:has-text("Finalizar y Ver Resultados")');

    // Verificar pantalla de resultados finales y nota obtenida usando el título real "Evaluación Completada"
    const resultTitle = page.getByText('Evaluación Completada');
    await expect(resultTitle).toBeVisible();

    const scoreBadge = page.getByText('20.00');
    await expect(scoreBadge).toBeVisible();
  });

});
