import { test, expect } from '@playwright/test';

test.describe('Flujo de Administrador (e2e/admin.spec.ts)', () => {

  test.beforeEach(async ({ page }) => {
    // Interceptar login para que devuelva un administrador
    await page.route('**/api/auth/login', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: 'u-admin',
            email: 'admin@colegio.edu',
            role: 'admin',
            name: 'Administrador Principal',
            token: 'mocked-jwt-token-admin'
          }
        })
      });
    });

    // Interceptar obtención de lista de usuarios para el dashboard
    await page.route('**/api/admin/usuarios', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 'u-admin', name: 'Admin', email: 'admin@colegio.edu', rol: 'ADMIN', cuentaBloqueada: false },
          { id: 'u-prof-1', name: 'Prof. Rojas', email: 'rojas@colegio.edu', rol: 'TEACHER', cuentaBloqueada: false },
          { id: 'u-est-1', name: 'Alex Quispe', email: 'alex@colegio.edu', rol: 'STUDENT', cuentaBloqueada: false }
        ])
      });
    });

    // Interceptar analíticas de intentos
    await page.route('**/api/intentos/todos', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 'g1', alumno: 'Alex Quispe', correo: 'alex@colegio.edu', curso: 'Biología Celular', semana: 'Semana 1', tecnica: 'opcion_multiple', nota: 18, fecha: '2026-07-20T12:00:00Z' }
        ])
      });
    });

    // Login automático en el frontend
    await page.goto('/');
    await page.fill('input[id="email"]', 'admin@colegio.edu');
    await page.fill('input[id="password"]', 'admin');
    await page.click('button[type="submit"]');

    // Verificar que estamos en la vista del administrador
    await expect(page).toHaveURL(/\/admin/);
  });

  test('CP-07-01: Registro de un Docente Individual', async ({ page }) => {
    // Interceptar la creación de un nuevo usuario
    await page.route('**/api/admin/usuarios/crear', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'u-prof-new',
          name: 'Prof. Nuevo',
          email: 'prof.nuevo@colegio.edu',
          rol: 'TEACHER',
          cuentaBloqueada: false
        })
      });
    });

    // Rellenar formulario de creación de usuario
    // Seleccionar rol Docente
    await page.click('button:has-text("Docente")');

    await page.fill('[placeholder="Ana Pérez"]', 'Prof. Nuevo');
    await page.fill('[placeholder="ana@gmail.com"]', 'prof.nuevo@colegio.edu');
    await page.fill('[placeholder="Contraseña segura"]', 'Temporal123');

    // Click en Registrar
    await page.click('button:has-text("Registrar")');

    // Verificar Toast de éxito
    const toast = page.locator('li:has-text("Docente registrado correctamente")');
    await expect(toast).toBeVisible();
  });

  test('CP-07-02: Registro de un Alumno Individual', async ({ page }) => {
    // Interceptar la creación de un nuevo usuario alumno
    await page.route('**/api/admin/usuarios/crear', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'u-est-new',
          name: 'Alumno Nuevo',
          email: 'alumno.nuevo@colegio.edu',
          rol: 'STUDENT',
          cuentaBloqueada: false
        })
      });
    });

    // Seleccionar rol Alumno
    await page.click('button:has-text("Alumno")');

    await page.fill('[placeholder="Ana Pérez"]', 'Alumno Nuevo');
    await page.fill('[placeholder="ana@gmail.com"]', 'alumno.nuevo@colegio.edu');
    await page.fill('[placeholder="Contraseña segura"]', 'Temporal123');

    // Click en Registrar
    await page.click('button:has-text("Registrar")');

    // Verificar Toast de éxito
    const toast = page.locator('li:has-text("Alumno registrado correctamente")');
    await expect(toast).toBeVisible();
  });

  test('CP-07-04: Descarga de Reporte Global de Notas (CSV)', async ({ page }) => {
    // Interceptar la descarga del CSV
    const [download] = await Promise.all([
      // Esperar a que inicie la descarga
      page.waitForEvent('download'),
      // Click en el botón de Descargar Notas
      page.click('button:has-text("Descargar Notas")')
    ]);

    // Comprobar que la descarga se completó y tiene formato correcto
    const path = await download.path();
    expect(path).not.toBeNull();
    expect(download.suggestedFilename()).toContain('Reporte_Global_Notas');
  });

});
