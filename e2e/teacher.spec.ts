import { test, expect } from '@playwright/test';

test.describe('Flujo de Docente (e2e/teacher.spec.ts)', () => {

  test.beforeEach(async ({ page }) => {
    // Interceptar login para que devuelva un docente
    await page.route('**/api/auth/login', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: 'u-prof-1',
            email: 'rojas@colegio.edu',
            role: 'teacher',
            name: 'Prof. Rojas',
            token: 'mocked-jwt-token-teacher'
          }
        })
      });
    });

    // Interceptar obtención de cursos del docente
    let coursesList = [
      { id: 'mat-old', name: 'Álgebra Lineal antigua', emoji: '📐', color: 'primary', teacherId: 'u-prof-1', weeks: 4, studentCount: 0 }
    ];

    await page.route('**/api/cursos/docente/u-prof-1', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(coursesList)
      });
    });

    await page.route('**/api/cursos/docente/u-prof-1/rendimiento', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([])
      });
    });

    await page.route('**/api/intentos/todos', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([])
      });
    });

    // Login automático en el frontend
    await page.goto('/');
    await page.fill('input[id="email"]', 'rojas@colegio.edu');
    await page.fill('input[id="password"]', 'teacher');
    await page.click('button[type="submit"]');

    // Verificar que estamos en la vista de docente
    await expect(page).toHaveURL(/\/docente/);
  });

  test('Creación de Curso, Navegación y Subida de Archivo', async ({ page }) => {
    // 1. Crear el curso "Matemáticas Especiales"
    await page.route('**/api/cursos/crear', async (route) => {
      // Modificamos dinámicamente lo que devolverá GET de cursos del docente
      await page.route('**/api/cursos/docente/u-prof-1', async (r) => {
        await r.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            { id: 'mat-special', name: 'Matemáticas Especiales', emoji: '📐', color: 'primary', teacherId: 'u-prof-1', weeks: 8, studentCount: 0 }
          ])
        });
      });

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'mat-special',
          nombre: 'Matemáticas Especiales',
          descripcion: 'Curso de pruebas E2E',
          semanas: 8,
          emoji: '📐',
          color: 'primary'
        })
      });
    });

    // Abrir modal de creación
    await page.click('button:has-text("Crear curso")');

    // Rellenar formulario con selectores CSS correctos
    await page.fill('[placeholder="Ej. Química Orgánica"]', 'Matemáticas Especiales');
    await page.fill('[placeholder="Breve descripción del curso"]', 'Curso de pruebas E2E');
    await page.fill('input[type="number"]', '8');

    // Submit formulario
    await page.click('form button[type="submit"]');

    // Verificar Toast de éxito
    const successToast = page.locator('li:has-text("Curso creado exitosamente")');
    await expect(successToast).toBeVisible();

    // La tarjeta del curso debe estar visible en el dashboard docente
    const courseCard = page.locator('h3:has-text("Matemáticas Especiales")');
    await expect(courseCard).toBeVisible();

    // 2. Entrar al curso para subir material en la Semana 1
    // Interceptar la lista de semanas del nuevo curso
    await page.route('**/api/cursos/mat-special/semanas', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 'w-1', numSem: 'Semana 1', materiales: [], totalPreguntas: 0 },
          { id: 'w-2', numSem: 'Semana 2', materiales: [], totalPreguntas: 0 }
        ])
      });
    });

    // Click en la tarjeta del curso
    await courseCard.click();
    await expect(page).toHaveURL(/\/docente\/curso\/mat-special/);

    // Navegar a la Semana 1
    // Interceptar carga de la semana 1
    await page.route('**/api/semanas/w-1', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'w-1',
          numSem: 'Semana 1',
          totalPreguntas: 0,
          materiales: []
        })
      });
    });

    await page.route('**/api/intentos/semana/w-1', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([])
      });
    });

    // Click en Semana 1 en la lista
    await page.click('a:has-text("Semana 1")');
    await expect(page).toHaveURL(/\/docente\/curso\/mat-special\/semana\/w-1/);

    // 3. Subir archivo
    // Interceptar subida multipart de archivos
    await page.route('**/api/semanas/w-1/archivos', async (route) => {
      // Cambiar respuesta de GET /semanas/w-1 para simular que ya tiene el archivo subido
      await page.route('**/api/semanas/w-1', async (r) => {
        await r.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'w-1',
            numSem: 'Semana 1',
            totalPreguntas: 5,
            materiales: [
              { id: 'mat-1', mongoId: 'mongo-pdf-id-123', nombreArchivo: 'Algebra_Clase1.pdf', visible: true, fechaCarga: new Date().toISOString() }
            ]
          })
        });
      });

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true })
      });
    });

    // Cargar archivo ficticio a través del input de archivo oculto
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.click('button:has-text("Haz clic para subir material")');
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({
      name: 'Algebra_Clase1.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('content pdf ficticio')
    });

    // Verificar Toast de subida exitosa
    const uploadToast = page.locator('li:has-text("Archivos subidos y vinculados correctamente")');
    await expect(uploadToast).toBeVisible();

    // Verificar que el archivo aparece listado en pantalla
    const fileRow = page.locator('p:has-text("Algebra_Clase1.pdf")');
    await expect(fileRow).toBeVisible();
  });

  test('Matriculación de Alumno en el Curso', async ({ page }) => {
    // Definir todos los mocks de red al inicio para evitar condiciones de carrera durante la navegación
    
    // 1. Interceptar semanas del curso
    await page.route('**/api/cursos/mat-old/semanas', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([])
      });
    });

    // 2. Mock de lista de alumnos matriculados en mat-old
    await page.route('**/api/cursos/mat-old/alumnos', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([])
      });
    });

    // 3. Mock de búsqueda de alumnos (con wildcard)
    await page.route('**/api/cursos/estudiantes/buscar**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 'u-est-juan', nombre: 'Juan Alumno', correo: 'juan@colegio.edu' }
        ])
      });
    });

    // 4. Mock de matricular alumno (y actualización del GET de alumnos)
    await page.route('**/api/cursos/mat-old/matricular**', async (route) => {
      await page.route('**/api/cursos/mat-old/alumnos', async (r) => {
        await r.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            { id: 'u-est-juan', nombre: 'Juan Alumno', correo: 'juan@colegio.edu' }
          ])
        });
      });

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true })
      });
    });

    // --- ACCIONES DEL TEST ---

    // 1. Navegar al curso existente "Álgebra Lineal antigua"
    const courseCard = page.locator('h3:has-text("Álgebra Lineal antigua")');
    await expect(courseCard).toBeVisible();
    await courseCard.click();
    await expect(page).toHaveURL(/\/docente\/curso\/mat-old/);

    // 2. Hacer click en "Gestionar clase"
    await page.click('a:has-text("Gestionar clase")');
    await expect(page).toHaveURL(/\/docente\/curso\/mat-old\/alumnos/);

    // 3. Rellenar el input de búsqueda de alumno
    await page.fill('[placeholder="Buscar alumno por nombre..."]', 'Juan');

    // Comprobar que el resultado aparece en la lista de búsqueda
    const searchResultName = page.getByText('Juan Alumno');
    await expect(searchResultName).toBeVisible();

    // 4. Hacer click en Añadir
    await page.click('button:has-text("Añadir")');

    // Verificar Toast de éxito
    const successToast = page.locator('li:has-text("Alumno matriculado exitosamente")');
    await expect(successToast).toBeVisible();

    // Verificar que el alumno ahora aparece listado en la "Lista de clase"
    const studentInList = page.locator('div.flex-1 >> p:has-text("Juan Alumno")');
    await expect(studentInList).toBeVisible();
  });

});
