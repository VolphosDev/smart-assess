import { test, expect } from '@playwright/test';

test.describe('Configuración Inicial de Contraseña (Escenario 2)', () => {

  test('CP-02-01: Configuración de Clave Válida y Consentimiento Exitoso', async ({ page }) => {
    // Interceptar la petición de cambio de clave
    await page.route('**/api/auth/setup-password', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Contraseña configurada con éxito' })
      });
    });

    // Interceptar la llamada de login automático que ocurre justo después
    await page.route('**/api/auth/login', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: '101',
            email: 'nuevo@colegio.edu',
            role: 'student',
            name: 'Nuevo Alumno Activo',
            token: 'mocked-jwt-token-active'
          }
        })
      });
    });

    // Cargar la página pasándole el parámetro de correo
    await page.goto('/setup-password?email=nuevo@colegio.edu');

    // Llenar campos de clave utilizando selectores CSS correctos
    await page.fill('[placeholder="Mínimo 6 caracteres"]', 'Admin2026!');
    await page.fill('[placeholder="Repite la contraseña"]', 'Admin2026!');

    // Marcar checkbox de consentimiento
    await page.check('input[id="terms"]');

    // El botón debe estar habilitado y hacemos click
    const submitBtn = page.locator('button[type="submit"]');
    await expect(submitBtn).toBeEnabled();
    await submitBtn.click();

    // Debe redireccionar al panel del estudiante (/app) tras el login automático exitoso
    await expect(page).toHaveURL(/\/app/);

    // Verificar token guardado en localStorage
    const token = await page.evaluate(() => localStorage.getItem('token'));
    expect(token).toBe('mocked-jwt-token-active');
  });

  test('CP-02-02: Claves No Coincidentes', async ({ page }) => {
    await page.goto('/setup-password?email=nuevo@colegio.edu');

    // Llenar claves distintas
    await page.fill('[placeholder="Mínimo 6 caracteres"]', 'Admin2026!');
    await page.fill('[placeholder="Repite la contraseña"]', 'Diferente2026!');

    // Marcar checkbox
    await page.check('input[id="terms"]');

    // Enviar formulario
    await page.click('button[type="submit"]');

    // Verificar que se muestra el mensaje de error del cliente
    const errorAlert = page.locator('div.text-destructive');
    await expect(errorAlert).toBeVisible();
    await expect(errorAlert).toHaveText(/Las contraseñas no coinciden/);
  });

  test('CP-02-03: Longitud Menor al Límite (Clave Corta)', async ({ page }) => {
    await page.goto('/setup-password?email=nuevo@colegio.edu');

    // Clave muy corta
    await page.fill('[placeholder="Mínimo 6 caracteres"]', '12345');
    await page.fill('[placeholder="Repite la contraseña"]', '12345');

    // Marcar checkbox
    await page.check('input[id="terms"]');

    // Enviar
    await page.click('button[type="submit"]');

    // Verificar alerta de validación
    const errorAlert = page.locator('div.text-destructive');
    await expect(errorAlert).toBeVisible();
    await expect(errorAlert).toHaveText(/La contraseña debe tener al menos 6 caracteres/);
  });

  test('CP-02-04: Envío sin Consentimiento (Botón deshabilitado)', async ({ page }) => {
    await page.goto('/setup-password?email=nuevo@colegio.edu');

    // Llenar claves válidas coincidentes
    await page.fill('[placeholder="Mínimo 6 caracteres"]', 'Admin2026!');
    await page.fill('[placeholder="Repite la contraseña"]', 'Admin2026!');

    // NO marcar el checkbox (termsAccepted = false)
    
    // Verificar que el botón de envío "Guardar y Entrar" esté deshabilitado (disabled)
    const submitBtn = page.locator('button[type="submit"]');
    await expect(submitBtn).toBeDisabled();
  });

});
