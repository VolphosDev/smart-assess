import { test, expect } from '@playwright/test';

test.describe('Flujo de Autenticación (Escenario 1)', () => {
  
  test('CP-01-01: Inicio de Sesión Válido (Rol: Alumno)', async ({ page }) => {
    // Interceptar la llamada de login
    await page.route('**/api/auth/login', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: '100',
            email: 'alumno@colegio.edu',
            role: 'student',
            name: 'Carlos Alumno',
            token: 'mocked-jwt-token-student'
          }
        })
      });
    });

    // Interceptar la carga del dashboard del alumno para evitar llamadas al backend real y el consecuente 403
    await page.route('**/api/cursos/estudiante/100', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([])
      });
    });

    await page.route('**/api/intentos/mis-intentos/100', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([])
      });
    });

    await page.route('**/api/rendimiento/mapa-calor/100', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([])
      });
    });

    // Ir a la página de login
    await page.goto('/');

    // Llenar campos
    await page.fill('input[id="email"]', 'alumno@colegio.edu');
    await page.fill('input[id="password"]', 'Password123');

    // Click en enviar
    await page.click('button[type="submit"]');

    // Verificar redirección a /app
    await expect(page).toHaveURL(/\/app/);
    await expect(page.locator('text=Salir').first()).toBeVisible();

    // Verificar localStorage
    const token = await page.evaluate(() => localStorage.getItem('token'));
    const userStr = await page.evaluate(() => localStorage.getItem('user'));
    
    expect(token).toBe('mocked-jwt-token-student');
    expect(userStr).toContain('Carlos Alumno');
    expect(userStr).toContain('student');
  });

  test('CP-01-02: Inicio de Sesión Inválido (Credenciales incorrectas)', async ({ page }) => {
    // Interceptar login fallido (401)
    await page.route('**/api/auth/login', async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'Correo o contraseña incorrectos'
        })
      });
    });

    await page.goto('/');

    await page.fill('input[id="email"]', 'alumno@colegio.edu');
    await page.fill('input[id="password"]', 'WrongPassword');
    await page.click('button[type="submit"]');

    // Comprobar mensaje de error
    const errorAlert = page.locator('div.text-destructive');
    await expect(errorAlert).toBeVisible();
    await expect(errorAlert).toHaveText(/Correo o contraseña incorrectos/);
  });

  test('CP-01-05: Bloqueo de Cuenta por Fuerza Bruta', async ({ page }) => {
    // Interceptar login bloqueado (403)
    await page.route('**/api/auth/login', async (route) => {
      await route.fulfill({
        status: 403,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'La cuenta se encuentra bloqueada. Contacte al administrador.'
        })
      });
    });

    await page.goto('/');

    await page.fill('input[id="email"]', 'bloqueado@colegio.edu');
    await page.fill('input[id="password"]', 'WrongPass5');
    await page.click('button[type="submit"]');

    // Comprobar que se muestra el mensaje de cuenta bloqueada
    const errorAlert = page.locator('div.text-destructive');
    await expect(errorAlert).toBeVisible();
    await expect(errorAlert).toHaveText(/La cuenta se encuentra bloqueada/);
  });

  test('CP-01-07: Primer Acceso - Redirección a Setup de Contraseña', async ({ page }) => {
    // Interceptar login con requiere password setup
    await page.route('**/api/auth/login', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: '101',
            email: 'nuevo@colegio.edu',
            role: 'student',
            name: 'Nuevo Alumno',
            token: 'temporary-token',
            requiresPasswordSetup: true
          }
        })
      });
    });

    await page.goto('/');

    await page.fill('input[id="email"]', 'nuevo@colegio.edu');
    await page.fill('input[id="password"]', 'Temporal123');
    await page.click('button[type="submit"]');

    // Verificar redirección a /setup-password con query param email
    await expect(page).toHaveURL(/\/setup-password\?email=nuevo%40colegio\.edu/);
    await expect(page.locator('text=Guardar y Entrar').first()).toBeVisible();

    // Verificar que NO se grabó el token en localStorage para forzar cambio seguro
    const token = await page.evaluate(() => localStorage.getItem('token'));
    expect(token).toBeNull();
  });

});
