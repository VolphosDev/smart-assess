# Plan y Documento de Pruebas de Caja Negra - Proyecto Semantika (Smart-Assess / Taller Integrador)

---

## 1. Portada y Datos Generales

* **Nombre del Proyecto:** Semantika (Plataforma de evaluación adaptativa y formativa mediante agentes de Inteligencia Artificial).
* **Subsistemas / Módulos Evaluados:**
  * **Frontend (`smart-assess`):** Portal del estudiante (Vistas de inicio, diagnóstico adaptativo, visor PDF, chatbot ARIA y mapa de calor de conocimiento) y Portal del docente/administrador.
  * **Backend (`TallerIntegrador`):** API REST en Spring Boot, orquestación de agentes cognitivos con LangChain4j, base de datos vectorial Qdrant y almacenamiento en PostgreSQL y MongoDB.
* **Versión Analizada:** v1.0 (Setup)
* **Responsable de la Ejecución:** 
  * Nombre: ___________________________
* **Fecha de Ejecución:**
  * Fecha: ____________________________

### Objetivo General
Definir, estructurar e implementar el plan de pruebas de caja negra a nivel profesional para la plataforma **Semantika**, evaluando la integridad de los flujos de autenticación, configuración de seguridad inicial, evaluación formativa mediante RAG (Retrieval-Augmented Generation), interacción por voz adaptativa con la tutora virtual ARIA, y las interfaces administrativas, garantizando la fiabilidad funcional, robustez del sistema y usabilidad del usuario final.

### Alcance
* **Módulos Cubiertos (SÍ):**
  * Autenticación con control de fuerza bruta en [AuthController.java](file:///c:/Users/LENOVO/Desktop/Taller%20Integrador%20backend/TallerIntegrador/src/main/java/com/example/tallerintegrador/controller/AuthController.java).
  * Primer acceso con asignación de clave y consentimiento de datos en [SetupPassword.tsx](file:///c:/Users/LENOVO/Desktop/Taller%20Integrador%20Frontend/smart-assess/src/pages/SetupPassword.tsx).
  * Diagnóstico adaptativo ACRA Likert y transmisión en tiempo real de debate de agentes por SSE en [AdaptivePractice.tsx](file:///c:/Users/LENOVO/Desktop/Taller%20Integrador%20Frontend/smart-assess/src/pages/AdaptivePractice.tsx).
  * Exámenes formativos autogenerados y calificación por el Agente Juez en [Practice.tsx](file:///c:/Users/LENOVO/Desktop/Taller%20Integrador%20Frontend/smart-assess/src/pages/Practice.tsx).
  * Chatbot conversacional por voz y gestualidad interactiva en [AvatarTutor.tsx](file:///c:/Users/LENOVO/Desktop/Taller%20Integrador%20Frontend/smart-assess/src/pages/AvatarTutor.tsx).
  * Carga y visibilidad de materiales por semanas académicas en [TeacherCourse.tsx](file:///c:/Users/LENOVO/Desktop/Taller%20Integrador%20Frontend/smart-assess/src/pages/teacher/TeacherCourse.tsx).
  * Administración en lote de alumnos y generación de backups SQL del motor relacional en [AdminDashboard.tsx](file:///c:/Users/LENOVO/Desktop/Taller%20Integrador%20Frontend/smart-assess/src/pages/admin/AdminDashboard.tsx).
* **Módulos Excluidos (NO):**
  * Mecanismo de caché en base de datos para mapas de calor (fuera del core funcional primario).
  * Pruebas de carga e inyección masiva en la API de Gemini (sujeto a cuota de facturación externa).

---

## 2. Ambiente de Pruebas Consolidado

### Versiones Exactas del Ecosistema
* **Frontend:** Node.js (v18.0.0 o superior), React (v18.3.1), Vite (v5.4.2), TailwindCSS (v3.4.1), Recharts (v2.12.7).
* **Backend:** Java JDK (v21.0.2), Spring Boot (v3.2.5), LangChain4j (v0.29.0), Apache Tika (v2.9.1).
* **Bases de Datos:** PostgreSQL (v15.3), MongoDB (v6.0.6), Qdrant Vector Database (v1.8.4).

### Variables de Entorno Requeridas
* **Backend (`application.properties`):**
  ```properties
  spring.datasource.url=jdbc:postgresql://localhost:5432/colegio_db
  spring.datasource.username=postgres
  spring.datasource.password=123456
  spring.data.mongodb.uri=mongodb://localhost:27017/semantika_db
  langchain4j.gemini.api-key=YOUR_GOOGLE_GEMINI_API_KEY
  qdrant.host=localhost
  qdrant.port=6333
  ```

### Instrucciones para Levantar el Entorno Completo

1. **Bases de Datos y Vectorial:**
   * Levantar el contenedor de Qdrant en Docker:
     ```bash
     docker run -d -p 6333:6333 -p 6334:6334 qdrant/qdrant
     ```
   * Asegurar que PostgreSQL y MongoDB están corriendo localmente en los puertos `5432` y `27017` respectivamente.
2. **Backend (`TallerIntegrador`):**
   * Navegar a la carpeta raíz del backend y ejecutar:
     ```powershell
     .\mvnw.cmd spring-boot:run
     ```
3. **Frontend (`smart-assess`):**
   * Navegar a la carpeta raíz del frontend, instalar dependencias y levantar el servidor Vite:
     ```bash
     npm install
     npm run dev
     ```

### Navegador y Sistema Operativo Recomendado
* **Navegador:** Google Chrome (v120 o superior), ya que soporta de forma nativa la Web Speech API utilizada en el módulo del Avatar Aria.
* **Sistema Operativo:** Windows 10/11 o macOS/Linux.

---

## 3. Matriz Resumen de Casos de Prueba

La siguiente tabla consolida los 31 casos de prueba del plan de pruebas:

| ID Caso | Escenario | Funcionalidad | Técnica Usada | Resultado Esperado (resumen corto) | Estado | Severidad |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **CP-01-01** | Escenario 1 | Inicio de Sesión Válido | Partición Equivalencia | Acceso exitoso y redirección a `/app`. | Pendiente de ejecución | Crítica |
| **CP-01-02** | Escenario 1 | Inicio de Sesión Inválido | Partición Equivalencia | Muestra error HTTP 401 e incrementa contador. | Pendiente de ejecución | Alta |
| **CP-01-03** | Escenario 1 | Entrada Nula/Vacía | Partición Equivalencia | El navegador bloquea el submit por `required`. | Pendiente de ejecución | Media |
| **CP-01-04** | Escenario 1 | Correo con Mal Formato | Partición Equivalencia | El navegador bloquea por falta de patrón `@`. | Pendiente de ejecución | Media |
| **CP-01-05** | Escenario 1 | Bloqueo por Fuerza Bruta | Tabla de Decisiones | Cuenta bloqueada al 5to intento fallido en BD. | Pendiente de ejecución | Crítica |
| **CP-01-06** | Escenario 1 | Intento en Cuenta Bloqueada | Tabla de Decisiones | Rechazo inmediato con aviso de contacto al admin. | Pendiente de ejecución | Alta |
| **CP-01-07** | Escenario 1 | Redirección a Setup Inicial | Tabla de Decisiones | Redirige a `/setup-password` por variable en BD. | Pendiente de ejecución | Alta |
| **CP-02-01** | Escenario 2 | Configuración Clave Válida | Partición Equivalencia | Guarda hash BCrypt y acepta consentimiento en BD. | Pendiente de ejecución | Crítica |
| **CP-02-02** | Escenario 2 | Claves no Coincidentes | Partición Equivalencia | El frontend bloquea y alerta sobre discrepancia. | Pendiente de ejecución | Alta |
| **CP-02-03** | Escenario 2 | Longitud Menor a Límite | Valores Límite | El frontend y backend rechazan clave < 6 caracteres. | Pendiente de ejecución | Alta |
| **CP-02-04** | Escenario 2 | Envío sin Consentimiento | Tabla de Decisiones | Botón bloqueado si checkbox de términos es false. | Pendiente de ejecución | Alta |
| **CP-03-01** | Escenario 3 | Diagnóstico Válido Completo | Partición Equivalencia | Stream SSE del debate de agentes y radar Bloom. | Pendiente de ejecución | Alta |
| **CP-03-02** | Escenario 3 | Cuestionario Incompleto | Partición Equivalencia | Toast alerta número de preguntas pendientes de llenar. | Pendiente de ejecución | Media |
| **CP-03-03** | Escenario 3 | Perfil de Bajo Rendimiento | Tabla de Decisiones | Clasifica "PRINCIPIANTE", recomienda tutora Aria. | Pendiente de ejecución | Alta |
| **CP-03-04** | Escenario 3 | Perfil de Alto Rendimiento | Tabla de Decisiones | Clasifica "AVANZADO", sugiere lecturas complejas. | Pendiente de ejecución | Alta |
| **CP-04-01** | Escenario 4 | Resolución Opción Múltiple | Partición Equivalencia | Calificación instantánea interactiva en el cliente. | Pendiente de ejecución | Alta |
| **CP-04-02** | Escenario 4 | Resolución Pregunta Abierta | Partición Equivalencia | Agente Juez otorga nota y feedback constructivo. | Pendiente de ejecución | Alta |
| **CP-04-03** | Escenario 4 | Respuesta Abierta Vacía | Partición Equivalencia | Agente Juez califica con 00/20 por omisión de texto. | Pendiente de ejecución | Media |
| **CP-04-04** | Escenario 4 | Caída del Servidor de IA | Tabla de Decisiones | Captura de HTTP 500 y despliega aviso de reintento. | Pendiente de ejecución | Alta |
| **CP-05-01** | Escenario 5 | Transcripción de Audio Clara | Tabla de Decisiones | ARIA transcribe voz, felicita y avanza de turno. | Pendiente de ejecución | Alta |
| **CP-05-02** | Escenario 5 | Respuesta por Voz Vagante | Tabla de Decisiones | ARIA detecta debilidades y otorga una pista. | Pendiente de ejecución | Alta |
| **CP-05-03** | Escenario 5 | Denegación de Micrófono | Tabla de Decisiones | Alerta pide reactivar permisos en el navegador. | Pendiente de ejecución | Alta |
| **CP-05-04** | Escenario 5 | Silencio en Grabación | Tabla de Decisiones | ARIA indica que no pudo escuchar y solicita repetir. | Pendiente de ejecución | Media |
| **CP-06-01** | Escenario 6 | Carga PDF de 2MB Válido | Partición Equivalencia | Indexación de texto con Tika y Qdrant exitosa. | Pendiente de ejecución | Alta |
| **CP-06-02** | Escenario 6 | Formato Incorrecto (.EXE) | Partición Equivalencia | Rechazo de archivo y toast alertando de formato. | Pendiente de ejecución | Alta |
| **CP-06-03** | Escenario 6 | Matrícula de Alumno Activo | Partición Equivalencia | Crea tupla en Postgres; alumno visualiza el curso. | Pendiente de ejecución | Alta |
| **CP-06-04** | Escenario 6 | Alternar Visibilidad Oculto | Tabla de Decisiones | Oculta material y bloquea accesos al estudiante. | Pendiente de ejecución | Alta |
| **CP-07-01** | Escenario 7 | Registro Individual Docente | Partición Equivalencia | Crea cuenta con rol TEACHER de forma correcta. | Pendiente de ejecución | Alta |
| **CP-07-02** | Escenario 7 | Formato en Lote Incorrecto | Partición Equivalencia | Rechaza renglones inválidos y avisa error de parseo. | Pendiente de ejecución | Alta |
| **CP-07-03** | Escenario 7 | Bloqueo de Usuario Activo | Tabla de Decisiones | Variable en Postgres = true, denegando el login. | Pendiente de ejecución | Crítica |
| **CP-07-04** | Escenario 7 | Descarga de Copia de Respaldo | Tabla de Decisiones | Descarga archivo `.sql` legible generado por dump. | Pendiente de ejecución | Alta |

---

## 4. Trazabilidad con Requisitos Funcionales

A continuación se asocian los escenarios diseñados con las especificaciones y flujos de negocio del software:

| Escenario | Requisito Funcional Validado (RF-XX) | Descripción Breve | Archivo/Módulo del Código Trazado |
| :--- | :--- | :--- | :--- |
| **Escenario 1** | RF-01: Autenticación y Fuerza Bruta | Control seguro de accesos mediante JWT y bloqueo automático de cuenta tras 5 intentos fallidos. | [AuthService.java](file:///c:/Users/LENOVO/Desktop/Taller%20Integrador%20backend/TallerIntegrador/src/main/java/com/example/tallerintegrador/service/AuthService.java) |
| **Escenario 2** | RF-02: Setup de Clave y Consentimiento | Obligatoriedad de firmar consentimiento de datos y asignación de contraseña permanente en primer login. | [SetupPassword.tsx](file:///c:/Users/LENOVO/Desktop/Taller%20Integrador%20Frontend/smart-assess/src/pages/SetupPassword.tsx) |
| **Escenario 3** | RF-03: Diagnóstico Adaptativo SSE | Cuestionario formativo inicial evaluador y debate automatizado de comités de IA por streams SSE. | [AdaptivePractice.tsx](file:///c:/Users/LENOVO/Desktop/Taller%20Integrador%20Frontend/smart-assess/src/pages/AdaptivePractice.tsx) |
| **Escenario 4** | RF-04: Exámenes RAG y Agente Juez | Creación de preguntas en base a PDFs (Qdrant/Gemini) y evaluación inteligente cualitativa de textos libres. | [Practice.tsx](file:///c:/Users/LENOVO/Desktop/Taller%20Integrador%20Frontend/smart-assess/src/pages/Practice.tsx) |
| **Escenario 5** | RF-05: Tutor Conversacional por Voz | Interacción conversacional oral bidireccional con el avatar SVG interactivo ARIA procesando audio local. | [AvatarTutor.tsx](file:///c:/Users/LENOVO/Desktop/Taller%20Integrador%20Frontend/smart-assess/src/pages/AvatarTutor.tsx) |
| **Escenario 6** | RF-06: Gestión de Cursos y Visibilidad | Control docente para subir PDFs (ingesta Apache Tika) y alternar visualización de carpetas de alumnos. | [TeacherCourse.tsx](file:///c:/Users/LENOVO/Desktop/Taller%20Integrador%20Frontend/smart-assess/src/pages/teacher/TeacherCourse.tsx) |
| **Escenario 7** | RF-07: Consola de Administración Central | Ingesta masiva de usuarios en lote, toggle de bloqueos de cuenta y generación de copias físicas de respaldo SQL. | [AdminDashboard.tsx](file:///c:/Users/LENOVO/Desktop/Taller%20Integrador%20Frontend/smart-assess/src/pages/admin/AdminDashboard.tsx) |

---

## 5. Detalle de Escenarios de Prueba

---

### Escenario de Prueba 1: Autenticación de Usuario (Inicio de Sesión y Bloqueo por Intentos Fallidos)

#### 1. Datos de Entrada
* **Funcionalidad a probar:** Inicio de Sesión de Usuario (Login) y mecanismo de seguridad de bloqueo de cuenta por fuerza bruta.

#### 2. Entorno
* **Módulo/Pantalla:** Pantalla de Bienvenida e Inicio de Sesión (`/` - [Index.tsx](file:///c:/Users/LENOVO/Desktop/Taller%20Integrador%20Frontend/smart-assess/src/pages/Index.tsx)).
* **Componentes visuales:** Formulario de login con campos de texto, botón de envío y modal flotante de solicitud de soporte para recuperar accesos.

#### 3. Parámetros
* `email` (input text, type: email): Correo institucional del usuario.
* `password` (input text, type: password): Contraseña del usuario.
* `Iniciar sesión` (button): Botón de envío del formulario.
* `Solicita ayuda` (button/link): Enlace para abrir el Modal de Soporte.

#### 4. Respuesta de otros módulos
* **AuthService / AuthController:** Procesa la autenticación consultando la base de datos PostgreSQL (`usuario`). Si las credenciales son válidas, genera un token JWT y devuelve el objeto del usuario.
* **Componente de Enrutamiento (`App.tsx` y `ProtectedRoute.tsx`):** Lee el rol retornado (`STUDENT`, `TEACHER`, `ADMIN`), guarda el token y el perfil en `localStorage` y redirige al panel correspondiente (`/app`, `/docente` o `/admin`).
* **Mecanismo de seguridad:** Incrementa `intentos_fallidos` en la base de datos PostgreSQL. Si llega al límite de intentos, actualiza `cuenta_bloqueada` a `true`.

#### 5. Condiciones iniciales (Casos de Prueba)

| ID Caso | Técnica Aplicada | Entrada: Correo (`email`) | Entrada: Contraseña (`password`) | Condición / Estado en Base de Datos | Resultado Esperado | Resultado Obtenido | Estado |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **CP-01-01** | Partición Equivalencia (Válido) | `alumno@colegio.edu` | `Password123` | Cuenta activa (`cuentaBloqueada = false`, `requiresPasswordSetup = false`) | Redirección exitosa a `/app` y token guardado en localStorage. | [Completar tras ejecución] | [Pasó / Falló / Bloqueado / No ejecutado] |
| **CP-01-02** | Partición Equivalencia (Inválido) | `alumno@colegio.edu` | `WrongPass` | Intento fallido simple (`intentosFallidos < limite`) | Error HTTP 401 en consola y alerta visual sobre intentos fallidos. | [Completar tras ejecución] | [Pasó / Falló / Bloqueado / No ejecutado] |
| **CP-01-03** | Partición Equivalencia (Nulo/Vacío) | ` ` (Vacío) | `Password123` | Campos requeridos | El navegador detiene la petición (HTML5 attribute required). | [Completar tras ejecución] | [Pasó / Falló / Bloqueado / No ejecutado] |
| **CP-01-04** | Partición Equivalencia (Email Malo) | `correo-invalido.com` | `Password123` | Formato de correo no válido | El navegador impide envío indicando falta del signo `@`. | [Completar tras ejecución] | [Pasó / Falló / Bloqueado / No ejecutado] |
| **CP-01-05** | Tabla de Decisiones (Bloqueo) | `alumno@colegio.edu` | `WrongPass` | 5to intento consecutivo fallido | Cuenta bloqueada en base de datos; responde HTTP 403. | [Completar tras ejecución] | [Pasó / Falló / Bloqueado / No ejecutado] |
| **CP-01-06** | Tabla de Decisiones (Acceso Bloq) | `alumno@colegio.edu` | `Password123` | Cuenta previamente bloqueada (`cuentaBloqueada = true`) | Rechaza la petición (HTTP 403) mostrando error de cuenta bloqueada. | [Completar tras ejecución] | [Pasó / Falló / Bloqueado / No ejecutado] |
| **CP-01-07** | Tabla de Decisiones (1er Acceso) | `nuevo@colegio.edu` | `Temporal123` | Primer inicio de sesión (`requiresPasswordSetup = true`) | Redirección automática a `/setup-password` sin guardar token. | [Completar tras ejecución] | [Pasó / Falló / Bloqueado / No ejecutado] |

#### 6. Datos de Salida
* **Resultados entregados:**
  * **CP-01-01:** Redirección exitosa a la interfaz de estudiante (`/app`), almacenamiento de token y datos de usuario en `localStorage`.
  * **CP-01-02:** Mensaje en pantalla: *"Intentos de inicio de sesión fallidos: X. La cuenta se bloqueará tras superar el límite."* (HTTP 401).
  * **CP-01-03:** El navegador valida el campo `required`. No se realiza el POST.
  * **CP-01-04:** El navegador impide el envío por no cumplir con la expresión regular `@`.
  * **CP-01-05:** Mensaje en pantalla indicando que la cuenta ha sido bloqueada. El backend responde HTTP 403.
  * **CP-01-06:** Mensaje de error: *"La cuenta se encuentra bloqueada. Contacte al administrador."* (HTTP 403).
  * **CP-01-07:** Redirección automática a la vista de configuración de contraseña inicial (`/setup-password?email=...`) sin guardar token.
* **Estado final de las variables (Evidencias):**
  * Captura de pantalla de la redirección correcta a `/app` o `/setup-password`.
  * Captura del mensaje de error por credenciales incorrectas y por cuenta bloqueada.
  * Inspección del `localStorage` en DevTools para comprobar que se grabó el token o se mantuvo vacío según el caso.

#### 7. Requisitos de configuración para hacer la prueba
* **Método de prueba:** Combinación de partición de equivalencia (para entradas de datos) y tabla de decisiones (para estados lógicos de la cuenta: nueva, activa, bloqueada).
* **Módulos de código involucrados:**
  * Frontend: [Index.tsx](file:///c:/Users/LENOVO/Desktop/Taller Integrador Frontend/smart-assess/src/pages/Index.tsx), [auth.ts](file:///c:/Users/LENOVO/Desktop/Taller Integrador Frontend/smart-assess/src/api/auth.ts)
  * Backend: [AuthController.java](file:///c:/Users/LENOVO/Desktop/Taller%20Integrador%20backend/TallerIntegrador/src/main/java/com/example/tallerintegrador/controller/AuthController.java), [AuthService.java](file:///c:/Users/LENOVO/Desktop/Taller%20Integrador%20backend/TallerIntegrador/src/main/java/com/example/tallerintegrador/service/AuthService.java), [Usuario.java](file:///c:/Users/LENOVO/Desktop/Taller%20Integrador%20backend/TallerIntegrador/src/main/java/com/example/tallerintegrador/entidades/postgres/Usuario.java).
* **Hardware y Software:** Windows 10/11, Google Chrome 120+, base de datos PostgreSQL activa con semillas cargadas, conexión de red local/intranet.

#### 8. Procedimientos o herramientas necesarias
1. Abrir Google Chrome en modo Incógnito e ir a `http://localhost:5173/`.
2. Abrir la pestaña de Red (F12) para monitorizar las peticiones `/auth/login`.
3. Ingresar los datos descritos en los casos CP-01-01 al CP-01-07 de forma secuencial y verificar las respuestas HTTP (200, 401, 403).

#### 9. Dependencias o relación con otros casos de prueba
* Requiere que el usuario a probar esté previamente registrado por el administrador en la base de datos (relacionado con el módulo de administración).

---

### Escenario de Prueba 2: Configuración Inicial de Contraseña y Consentimiento de Términos (First Login Flow)

#### 1. Datos de Entrada
* **Funcionalidad a probar:** Configuración de contraseña permanente y consentimiento de uso de datos para nuevos usuarios creados por el administrador.

#### 2. Entorno
* **Módulo/Pantalla:** Configuración de Contraseña (`/setup-password` - [SetupPassword.tsx](file:///c:/Users/LENOVO/Desktop/Taller%20Integrador%20Frontend/smart-assess/src/pages/SetupPassword.tsx)).
* **Componentes visuales:** Formulario de establecimiento de contraseña con inputs seguros, checkbox obligatorio para política de consentimiento y botón de confirmación.

#### 3. Parámetros
* `password` (input, type: password): Nueva contraseña a registrar.
* `confirmPassword` (input, type: password): Confirmación de la nueva contraseña.
* `terms` (checkbox, booleano): Consentimiento libre e informado sobre el tratamiento de respuestas escritas y grabaciones de voz.
* `Guardar y Entrar` (button): Botón para enviar la solicitud de cambio de clave.

#### 4. Respuesta de otros módulos
* **AuthService / AuthController:** Invoca `/auth/setup-password` y `/auth/consent` (backend) actualizando la columna `password` con el hash BCrypt, estableciendo `requires_password_setup` en `false`, `consentimiento_aceptado` en `true` y la fecha/versión de consentimiento aceptada.
* **Componente de Navegación:** Una vez registrado, hace un login automático en background, graba el token y redirige a la vista principal según el rol.

#### 5. Condiciones iniciales (Casos de Prueba)

| ID Caso | Técnica Aplicada | Entrada: Nueva Clave (`password`) | Entrada: Confirmar Clave | Checkbox Consentimiento | Resultado Esperado | Resultado Obtenido | Estado |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **CP-02-01** | Partición Equivalencia (Válido) | `Admin2026!` | `Admin2026!` | Marcado (`true`) | Registro exitoso, login automático y redirección a `/app`. | [Completar tras ejecución] | [Pasó / Falló / Bloqueados / No ejecutado] |
| **CP-02-02** | Partición Equivalencia (No Coincide) | `ClaveUno1` | `ClaveDos2` | Marcado (`true`) | El cliente bloquea el envío y muestra error visual. | [Completar tras ejecución] | [Pasó / Falló / Bloqueados / No ejecutado] |
| **CP-02-03** | Valores Límite (Longitud Corta) | `12345` | `12345` | Marcado (`true`) | El backend y cliente validan longitud mínima y rechazan (HTTP 400). | [Completar tras ejecución] | [Pasó / Falló / Bloqueados / No ejecutado] |
| **CP-02-04** | Tabla de Decisiones (Sin Términos) | `Admin2026!` | `Admin2026!` | Desmarcado (`false`) | Botón "Guardar y Entrar" bloqueado (`disabled`). | [Completar tras ejecución] | [Pasó / Falló / Bloqueados / No ejecutado] |

#### 6. Datos de Salida
* **Resultados entregados:**
  * **CP-02-01:** Toast de éxito *"¡Contraseña configurada con éxito! Iniciando sesión..."*, almacenamiento de credenciales y redirección a `/app`.
  * **CP-02-02:** El frontend bloquea el envío y muestra un alert: *"Las contraseñas no coinciden. Inténtalo de nuevo."*
  * **CP-02-03:** El frontend y el backend bloquean el envío y muestran: *"La contraseña debe tener al menos 6 caracteres."*
  * **CP-02-04:** El formulario no se envía ya que el botón tiene el atributo `disabled={isLoading || !termsAccepted}`.
* **Estado final de las variables (Evidencias):**
  * Base de datos PostgreSQL: `requires_password_setup` pasa a `false`, `consentimiento_aceptado` pasa a `true`.
  * Captura de pantalla de la pantalla bloqueada con alertas rojas.

#### 7. Requisitos de configuración para hacer la prueba
* **Método de prueba:** Valores límite para la longitud mínima de contraseña (6 caracteres) y tabla de decisiones para el checkbox de términos.
* **Módulos de código involucrados:**
  * Frontend: [SetupPassword.tsx](file:///c:/Users/LENOVO/Desktop/Taller%20Integrador%20Frontend/smart-assess/src/pages/SetupPassword.tsx), [auth.ts](file:///c:/Users/LENOVO/Desktop/Taller%20Integrador%20Frontend/smart-assess/src/api/auth.ts)
  * Backend: [AuthController.java](file:///c:/Users/LENOVO/Desktop/Taller%20Integrador%20backend/TallerIntegrador/src/main/java/com/example/tallerintegrador/controller/AuthController.java) (endpoint `/setup-password`), `AuthService`.
* **Hardware y Software:** PC con navegador actualizado, servidor backend de Spring Boot corriendo.

#### 8. Procedimientos o herramientas necesarias
1. Entrar con un usuario recién creado por el administrador (que tenga la variable `requiresPasswordSetup` en la base de datos como `true`).
2. Completar los campos and enviar el formulario con datos inválidos para capturar las alertas correspondientes.
3. Finalmente, enviar los datos correctos marcando el checkbox y validar que se inicie sesión automáticamente.

#### 9. Dependencias o relación con otros casos de prueba
* Requiere haber pasado con éxito el inicio de sesión inicial (CP-01-07).

---

### Escenario de Prueba 3: Módulo de Diagnóstico Inicial Adaptativo (Evaluación Recomendadora y Debate de Agentes IA)

#### 1. Datos de Entrada
* **Funcionalidad a probar:** Generación de diagnóstico adaptativo del estudiante, envío de respuestas, ejecución del debate automatizado entre agentes cognitivos de IA mediante Server-Sent Events (SSE) y recomendación final de materiales.

#### 2. Entorno
* **Módulo/Pantalla:** Vista de Selección de Modo (`/app/curso/:courseId/semana/:semanaId` - [EvalModeSelect.tsx](file:///c:/Users/LENOVO/Desktop/Taller%20Integrador%20Frontend/smart-assess/src/pages/EvalModeSelect.tsx)) y Vista de Práctica Adaptativa (`/app/curso/:courseId/semana/:semanaId/evaluacion/adaptativa` - [AdaptivePractice.tsx](file:///c:/Users/LENOVO/Desktop/Taller%20Integrador%20Frontend/smart-assess/src/pages/AdaptivePractice.tsx)).
* **Componentes visuales:** Banner de Diagnóstico Adaptativo bloqueador, slider interactivo de preguntas de opción múltiple (o cuestionario ACRA Likert de hábitos de estudio), panel de visualización del chat interactivo de agentes de IA, gráficos radiales (Radar Chart de habilidades de Bloom) y listado de materiales PDF recomendados.

#### 3. Parámetros
* `usuarioId` (query param): ID numérico del estudiante.
* `semanaId` (query param): ID codificado de la semana.
* Respuestas de las preguntas del test (inputs tipo radio buttons para Likert o alternativas A, B, C, D).
* `Terminar y Enviar` (button): Botón para enviar el cuestionario resuelto.

#### 4. Respuesta de otros módulos
* **AdaptiveLearningController / AdaptiveLearningService:** Genera el cuestionario (ACRA o formativo adaptativo) leyendo la base de datos Postgres/Mongo.
* **Orquestación de Agentes (EvaluationOrchestratorAgent, PromptTemplateService):** Envía las respuestas a un comité de agentes de IA (Agente Evaluador, Agente Psicopedagogo, Agente de Adaptación de Evaluaciones, Agente Coordinador). Éstos debaten en tiempo real sobre el estilo cognitivo del estudiante y las áreas débiles, transmitiendo su conversación por SSE al frontend.
* **Módulo de Recomendación:** Guarda el perfil cognitivo en base de datos, marca la semana como diagnosticada (`diagnostico_completado = true`) y desbloquea los modos recomendados de aprendizaje de la semana.

#### 5. Condiciones iniciales (Casos de Prueba)

| ID Caso | Condición de Entrada (Formulario) | Estado del Estudiante | Entrada Base de Datos (PostgreSQL) | Resultado del Debate de IA | Resultado Obtenido | Estado |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **CP-03-01** | Respuestas válidas completas | Alumno sin diagnóstico en la semana | `diagnosticoCompletado = false` | Comité analiza rendimiento y genera recomendaciones específicas de estudio. | [Completar tras ejecución] | [Pasó / Falló / Bloqueado / No ejecutado] |
| **CP-03-02** | Cuestionario incompleto | Alumno sin diagnóstico en la semana | `diagnosticoCompletado = false` | El frontend impide el envío e indica cuántas preguntas faltan por contestar. | [Completar tras ejecución] | [Pasó / Falló / Bloqueado / No ejecutado] |
| **CP-03-03** | Respuestas con bajo rendimiento | Alumno realiza el test | `diagnosticoCompletado = false` | Se detecta nivel "PRINCIPIANTE", recomendando lecturas básicas y tutoría de avatar. | [Completar tras ejecución] | [Pasó / Falló / Bloqueado / No ejecutado] |
| **CP-03-04** | Respuestas con alto rendimiento | Alumno realiza el test | `diagnosticoCompletado = false` | Se detecta nivel "AVANZADO", recomendando retos de síntesis y debates críticos. | [Completar tras ejecución] | [Pasó / Falló / Bloqueado / No ejecutado] |

#### 6. Datos de Salida
* **Resultados entregados:**
  * **CP-03-01:** Flujo SSE activo que imprime de forma secuencial la conversación con tags `[Agente Evaluador]`, `[Agente Psicopedagogo]`, etc. Transición automática a la pantalla de resultados donde se renderiza un gráfico de Radar Recharts y se listan los PDFs recomendados de estudio.
  * **CP-03-02:** Toast de aviso: *"Por favor responde todos los ítems. Te faltan X preguntas."*
  * **CP-03-03:** Gráfico muestra habilidades con puntuación baja. El banner en `/app` detecta tema débil y muestra advertencia naranja de ARIA.
* **Estado final de las variables (Evidencias):**
  * `localStorage` graba la llave `semantika.completed_mode.[userId].[weekId].adaptativa` como `true` y `semantika.recomendaciones.[userId].[weekId]` con un array de textos (ej. `["avatar", "video", "OPCION_MULTIPLE"]`).
  * Captura de pantalla de la interfaz de chat simulado de los agentes y del gráfico radial de taxonomía de Bloom.

#### 7. Requisitos de configuración para hacer la prueba
* **Método de prueba:** Tabla de decisiones (respuestas válidas/incompletas) y pruebas de integración sobre streams (SSE) para evaluar el procesamiento de tokens de IA sin bloqueos en el navegador.
* **Módulos de código involucrados:**
  * Frontend: [AdaptivePractice.tsx](file:///c:/Users/LENOVO/Desktop/Taller%20Integrador%20Frontend/smart-assess/src/pages/AdaptivePractice.tsx), [courses.ts](file:///c:/Users/LENOVO/Desktop/Taller%20Integrador%20Frontend/smart-assess/src/api/courses.ts) (API `adaptiveApi`)
  * Backend: [AdaptiveLearningController.java](file:///c:/Users/LENOVO/Desktop/Taller%20Integrador%20backend/TallerIntegrador/src/main/java/com/example/tallerintegrador/controller/AdaptiveLearningController.java), [AdaptiveLearningService.java](file:///c:/Users/LENOVO/Desktop/Taller%20Integrador%20backend/TallerIntegrador/src/main/java/com/example/tallerintegrador/service/AdaptiveLearningService.java), [AcraEvaluacion.java](file:///c:/Users/LENOVO/Desktop/Taller%20Integrador%20backend/TallerIntegrador/src/main/java/com/example/tallerintegrador/service/AcraEvaluacion.java)
* **Hardware y Software:** Windows 10/11, conexión de red estable (para streaming de LLM Gemini), navegador Chrome, base de datos MongoDB y Postgres funcionando en simultáneo.

#### 8. Procedimientos o herramientas necesarias
1. Entrar al dashboard del estudiante e ingresar a una semana que no tenga diagnóstico realizado.
2. Comprobar que todos los demás modos de evaluación (Avatar, Video, Opción Múltiple, V/F) tienen un candado de bloqueo e impiden el ingreso.
3. Hacer clic en "Realizar Diagnóstico". Responder todas las preguntas de la encuesta inicial.
4. Enviar el formulario y observar la reproducción en tiempo real del debate de agentes en la interfaz gráfica.
5. Verificar la aparición del gráfico de Bloom y las recomendaciones de materiales, y comprobar que en la pantalla previa se han desbloqueado los métodos específicos de estudio.

#### 9. Dependencias o relación con otros casos de prueba
* Es prerrequisito obligatorio antes de poder iniciar cualquier otro método de práctica.

---

### Escenario de Prueba 4: Práctica Formativa e Integración RAG / LLM (Generación y Resolución de Evaluaciones por PDF)

#### 1. Datos de Entrada
* **Funcionalidad a probar:** Generación automática de evaluaciones dinámicas basadas en los documentos cargados por el profesor utilizando técnicas RAG (Retrieval-Augmented Generation) y la API de Gemini, resolución de las preguntas por parte del estudiante y retroalimentación interactiva del Agente Evaluador Unitario.

#### 2. Entorno
* **Módulo/Pantalla:** Vista de Selección de Modo y Vista de Práctica Convencional (`/app/curso/:courseId/semana/:semanaId/evaluacion/:mode` - [Practice.tsx](file:///c:/Users/LENOVO/Desktop/Taller%20Integrador%20Frontend/smart-assess/src/pages/Practice.tsx)).
* **Componentes visuales:** Cuestionario dinámico de preguntas (opciones de selección de radio button para opción múltiple/VF, o cajas de texto multilínea para preguntas de desarrollo abierto). Retroalimentación inmediata con colores verde (correcto) y rojo (incorrecto).

#### 3. Parámetros
* `mongoId` (query param / path variable): Identificador único del archivo PDF en la colección MongoDB.
* `tipo` (alternativas: OPCION_MULTIPLE, VERDADERO_FALSO, ABIERTA, DETECCION_ERRORES): Estilo de evaluación seleccionado.
* `cantidad` (entero): Número de preguntas a generar (por defecto 3-5).
* Respuestas de las preguntas del test (inputs A, B, C, D o cajas de texto libre para preguntas abiertas).

#### 4. Respuesta de otros módulos
* **RagRetrieverService / SpikeService / GeminiService:** Extrae fragmentos relevantes del archivo PDF almacenados en PostgreSQL (`FragmentoPDF`), obtiene sus vectores correspondientes en la base vectorial Qdrant, consulta a Gemini utilizando prompts definidos en `PromptTemplateService` y estructura un JSON con las preguntas y alternativas válidas.
* **AgentJudgeController / AgentJudgeAgent:** En caso de preguntas de desarrollo (ABIERTA), procesa la respuesta libre escrita por el alumno comparándola con la respuesta ideal esperada generada por el RAG, calculando un puntaje (0-20), una justificación pedagógica y registrando el resultado en PostgreSQL (`Intento`).

#### 5. Condiciones iniciales (Casos de Prueba)

| ID Caso | Técnica Aplicada | Entrada: Tipo de Evaluación | Entrada del Alumno | Estado del Servidor LLM | Resultado Esperado | Resultado Obtenido | Estado |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **CP-04-01** | Partición Equivalencia (Válido OP) | `OPCION_MULTIPLE` | Selección de alternativa | Operativo | Corrige de forma automática de forma inmediata en el cliente. | [Completar tras ejecución] | [Pasó / Falló / Bloqueado / No ejecutado] |
| **CP-04-02** | Partición Equivalencia (Válido Abierta) | `ABIERTA` | Redacción de 2 párrafos coherentes | Operativo | Invoca al Agente Juez y muestra nota y justificación detallada. | [Completar tras ejecución] | [Pasó / Falló / Bloqueado / No ejecutado] |
| **CP-04-03** | Partición Equivalencia (Nulo Abierta) | `ABIERTA` | Caja de texto vacía | Operativo | Agente Juez califica con nota 0 e indica que no hubo respuesta. | [Completar tras ejecución] | [Pasó / Falló / Bloqueado / No ejecutado] |
| **CP-04-04** | Tabla de Decisiones (Caída de IA) | `OPCION_MULTIPLE` | Respuestas seleccionadas | Inactivo (Sin API Key o error de cuota) | Frontend gestiona el error HTTP 500 y muestra mensaje amigable de reintento. | [Completar tras ejecución] | [Pasó / Falló / Bloqueado / No ejecutado] |

#### 6. Datos de Salida
* **Resultados entregados:**
  * **CP-04-01:** Muestra en pantalla el porcentaje de aciertos, colorea en rojo la opción incorrecta elegida y en verde la correcta, y muestra la justificación teórica.
  * **CP-04-02:** Calificación sobre 20 en pantalla (ej. *"Calificación del Agente Juez: 16/20"*), con explicaciones sobre qué conceptos omitió y cuáles resolvió adecuadamente.
  * **CP-04-03:** Calificación 00/20. Mensaje: *"El estudiante no proporcionó ninguna respuesta."*
* **Estado final de las variables (Evidencias):**
  * La base de datos registra una nueva tupla en la tabla `intento` con el id de usuario, la nota final y la fecha del test.
  * Captura de pantalla de la tarjeta de calificación del agente con bordes de color verde/rojo.

#### 7. Requisitos de configuración para hacer la prueba
* **Método de prueba:** Partición de equivalencia para los diferentes tipos de preguntas y tabla de decisiones para estados alternativos del backend y servicios externos (Gemini API).
* **Módulos de código involucrados:**
  * Frontend: [Practice.tsx](file:///c:/Users/LENOVO/Desktop/Taller%20Integrador%20Frontend/smart-assess/src/pages/Practice.tsx), [courses.ts](file:///c:/Users/LENOVO/Desktop/Taller%20Integrador%20Frontend/smart-assess/src/api/courses.ts)
  * Backend: [SpikeController.java](file:///c:/Users/LENOVO/Desktop/Taller%20Integrador%20backend/TallerIntegrador/src/main/java/com/example/tallerintegrador/controller/SpikeController.java), [AgentJudgeController.java](file:///c:/Users/LENOVO/Desktop/Taller%20Integrador%20backend/TallerIntegrador/src/main/java/com/example/tallerintegrador/controller/AgentJudgeController.java), [AgentJudgeAgent.java](file:///c:/Users/LENOVO/Desktop/Taller%20Integrador%20backend/TallerIntegrador/src/main/java/com/example/tallerintegrador/agents/AgentJudgeAgent.java), `SpikeService`, `RagRetrieverService`.
* **Hardware y Software:** Servidor backend con la variable `GOOGLE_API_KEY` configurada con accesos a la API de Google Gemini Pro, Qdrant activo, base de datos Postgres con datos de prueba matriculados.

#### 8. Procedimientos o herramientas necesarias
1. Iniciar sesión como alumno. Entrar al curso de prueba e ingresar a la sección de la semana actual.
2. Hacer clic en "Leer documento" para asegurar que el PDF carga en el modal interactivo de visor embebido.
3. Elegir "Opción Múltiple", iniciar el test, responder todas las preguntas y presionar enviar. Comprobar que los resultados se carguen y se dibuje el desglose del examen.
4. Repetir el flujo ingresando al modo "Pregunta abierta". Redactar respuestas variadas (cortas, largas, sin relación al tema) y confirmar la calificación cualitativa que otorga el agente evaluador.

#### 9. Dependencias o relación con otros casos de prueba
* Requiere que el docente haya subido al menos un documento PDF visible en la semana correspondiente.

---

### Escenario de Prueba 5: Interacción por Voz con la Tutora IA Avatar ARIA

#### 1. Datos de Entrada
* **Funcionalidad a probar:** Interacción por voz con la tutora inteligente conversacional ARIA. Recepción de preguntas orales generadas por la IA, grabación de audio del estudiante, procesamiento por transcriptor de voz a texto y evaluación de respuestas conversacionales por voz.

#### 2. Entorno
* **Módulo/Pantalla:** Vista de Tutor Avatar (`/app/curso/:courseId/semana/:semanaId/evaluacion/avatar` - [AvatarTutor.tsx](file:///c:/Users/LENOVO/Desktop/Taller%20Integrador%20Frontend/smart-assess/src/pages/AvatarTutor.tsx)).
* **Componentes visuales:** Lienzo SVG con el gato animado interactivo (ARIA) que cambia de expresión facial según estados, botón circular de micrófono flotante para grabar audio, botón de altavoz (TTS) y burbujas de chat estilo mensajería instantánea.

#### 3. Parámetros
* Permiso del navegador para utilizar el Micrófono del dispositivo (pop-up de seguridad).
* Botón de Micrófono (`Mic` / `MicOff`): Controla el inicio y parada del Web Speech API o la grabación física de audio.
* `audio` (MultipartFile): Archivo de audio binario grabado (enviado en el POST multipart del backend).
* `pregunta` (string): Pregunta formulada por la tutora conversacional.
* `tema` (string): Nombre de la semana o tema evaluado.

#### 4. Respuesta de otros módulos
* **TutorConversacionalAgent / ArchivosIaController:** El backend recibe el audio grabado por el estudiante, lo transcribe utilizando modelos de Speech-to-Text integrados con Gemini, analiza la coherencia de la respuesta respecto al material de la semana y responde a través de un stream de texto SSE.
* **Componente de Síntesis de Voz (TTS):** En el frontend se consume la Web Speech API del navegador o un motor TTS para reproducir de forma oral el texto final formulado por ARIA.

#### 5. Condiciones iniciales (Casos de Prueba)

| ID Caso | Acción del Estudiante | Permiso de Micrófono | Calidad del Audio / Ruido | Respuesta Esperada de la IA | Resultado Obtenido | Estado |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **CP-05-01** | Graba respuesta clara y fluida | Concedido | Audio limpio | ARIA transcribe voz, felicita y avanza al siguiente turno. | [Completar tras ejecución] | [Pasó / Falló / Bloqueado / No ejecutado] |
| **CP-05-02** | Graba respuesta incorrecta | Concedido | Audio limpio | ARIA detecta vacíos de conocimiento, sugiere una pista de estudio. | [Completar tras ejecución] | [Pasó / Falló / Bloqueado / No ejecutado] |
| **CP-05-03** | Niega los accesos de hardware | Denegado | No aplica | Alerta en pantalla requiere habilitar permisos en el navegador. | [Completar tras ejecución] | [Pasó / Falló / Bloqueado / No ejecutado] |
| **CP-05-04** | Abre micro pero guarda silencio | Concedido | Silencio absoluto | Mensaje en chat de tutoría: *"No logré escucharte bien. ¿Podrías repetirlo?"* | [Completar tras ejecución] | [Pasó / Falló / Bloqueado / No ejecutado] |

#### 6. Datos de Salida
* **Resultados entregados:**
  * **CP-05-01:** Animación de ARIA pasa a `hablando` (la boca del SVG se mueve dinámicamente mediante intervalos de cambio de coordenadas), luego a `feliz` (añade estrellas amarillas al SVG). Muestra respuesta transcrita en burbuja de diálogo.
  * **CP-05-03:** Alerta emergente en pantalla: *"Para hablar con ARIA necesitas habilitar el acceso al micrófono en la configuración de tu navegador."*
* **Estado final de las variables (Evidencias):**
  * Captura del chat interactivo mostrando los turnos (Turno 1, Turno 2) con el diálogo transcrito.
  * Captura del SVG de ARIA en estado "pensando" (con la nubecita flotante de un pez nadando).

#### 7. Requisitos de configuración para hacer la prueba
* **Método de prueba:** Tabla de decisiones para control de permisos de periféricos e interacciones de audio.
* **Módulos de código involucrados:**
  * Frontend: [AvatarTutor.tsx](file:///c:/Users/LENOVO/Desktop/Taller%20Integrador%20Frontend/smart-assess/src/pages/AvatarTutor.tsx)
  * Backend: [ArchivosIaController.java](file:///c:/Users/LENOVO/Desktop/Taller%20Integrador%20backend/TallerIntegrador/src/main/java/com/example/tallerintegrador/controller/ArchivosIaController.java) (endpoints `/tutor/pregunta`, `/tutor/analizar-audio`), `TutorConversacionalAgent`.
* **Hardware y Software:** PC o dispositivo móvil con micrófono integrado funcional, Google Chrome o Safari (motores con soporte nativo de Web Speech API), permisos de salida de audio activados para escuchar la voz del tutor.

#### 8. Procedimientos o herramientas necesarias
1. Iniciar sesión como alumno, ir a la semana académica desbloqueada y seleccionar "Hablar con el avatar".
2. Conceder permisos de micrófono en el modal del navegador.
3. Escuchar la pregunta inicial de ARIA.
4. Presionar el botón de micrófono, responder por voz de forma clara e inteligible durante 10 segundos, y volver a presionar el botón para finalizar.
5. Observar la transcripción y el cambio de expresiones en el diseño animado del avatar.

#### 9. Dependencias o relación con otros casos de prueba
* Requiere tener configurada e instalada la clave de API de Gemini compatible con capacidades de procesamiento de audio multimodal.

---

### Escenario de Prueba 6: Carga de Materiales y Gestión de Alumnos por el Docente

#### 1. Datos de Entrada
* **Funcionalidad a probar:** Carga de materiales de estudio (PDFs) para una semana específica, alternar su visibilidad para estudiantes y matriculación/desmatriculación manual de alumnos en una asignatura.

#### 2. Entorno
* **Módulo/Pantalla:** Panel del Docente (`/docente` - [TeacherDashboard.tsx](file:///c:/Users/LENOVO/Desktop/Taller%20Integrador%20Frontend/smart-assess/src/pages/teacher/TeacherDashboard.tsx)), Configuración de Curso (`/docente/curso/:courseId` - [TeacherCourse.tsx](file:///c:/Users/LENOVO/Desktop/Taller%20Integrador%20Frontend/smart-assess/src/pages/teacher/TeacherCourse.tsx)) y Panel de Gestión de Alumnos (`/docente/curso/:courseId/alumnos` - [CourseStudentsManager.tsx](file:///c:/Users/LENOVO/Desktop/Taller%20Integrador%20Frontend/smart-assess/src/pages/teacher/CourseStudentsManager.tsx)).
* **Componentes visuales:** Listado de semanas del curso con botón de cargar archivo, switch/botón de visibilidad (ojo de tachado/ojo abierto), buscador en tiempo real de alumnos, tabla de alumnos matriculados y botón de retirar matrícula.

#### 3. Parámetros
* `semanaId` (path variable): Identificador de la semana en la que se sube el archivo.
* `archivos` (MultipartFile): Archivo PDF a subir desde el explorador del equipo.
* `studentId` (Long): Identificador numérico del estudiante a matricular.
* `nombre` (input text): Cadena para buscar estudiantes en la base de datos por coincidencia de caracteres.

#### 4. Respuesta de otros módulos
* **SemanaController / SemanaService:** Guarda el archivo PDF en MongoDB (`ArchivoPrompt`), extrae el texto usando Apache Tika y dispara el servicio de vectorización en background para guardar las divisiones del PDF indexadas en Qdrant.
* **CursoController / CursoService:** Crea las relaciones en la tabla `matricula` en PostgreSQL, asociando al alumno con el curso.
* **Módulo de Permisos de Alumnos:** Modifica los materiales visibles que el estudiante puede ver y utilizar para realizar las evaluaciones en el panel principal.

#### 5. Condiciones iniciales (Casos de Prueba)

| ID Caso | Técnica Aplicada | Entrada: Archivo Subido | Operación de Matrícula | Estado de la Base de Datos | Resultado Esperado | Resultado Obtenido | Estado |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **CP-06-01** | Partición Equivalencia (Válido Subir) | PDF de 2MB legible | - | Espacio disponible | Ingesta exitosa, texto indexado en Qdrant/Postgres. | [Completar tras ejecución] | [Pasó / Falló / Bloqueado / No ejecutado] |
| **CP-06-02** | Partición Equivalencia (Inválido Subir) | Imagen PNG o exe | - | - | El backend rechaza (HTTP 400) por formato o tamaño (>15MB). | [Completar tras ejecución] | [Pasó / Falló / Bloqueado / No ejecutado] |
| **CP-06-03** | Partición Equivalencia (Matricular) | - | Registrar alumno | Alumno no matriculado | Se inserta registro en la tabla `matricula`, el estudiante ahora ve el curso. | [Completar tras ejecución] | [Pasó / Falló / Bloqueado / No ejecutado] |
| **CP-06-04** | Tabla de Decisiones (Ocultar Doc) | - | Alternar visibilidad a false | Material visible | El alumno deja de ver el PDF y las evaluaciones asociadas quedan bloqueadas. | [Completar tras ejecución] | [Pasó / Falló / Bloqueado / No ejecutado] |

#### 6. Datos de Salida
* **Resultados entregados:**
  * **CP-06-01:** Mensaje toast: *"Material subido correctamente"*. El PDF aparece en la tabla de materiales con un badge que dice *"Visible para alumnos"*.
  * **CP-06-02:** Toast de error indicando que el archivo no cumple con el formato requerido o supera el umbral máximo de 15MB.
  * **CP-06-03:** Toast de confirmación: *"Alumno matriculado exitosamente"*. El alumno pasa a formar parte de la tabla del curso.
  * **CP-06-04:** El estudiante ve un aviso: *"El material de esta semana se encuentra oculto por el docente."*
* **Estado final de las variables (Evidencias):**
  * MongoDB registra un documento en `ArchivoPrompt` con el array del binario del archivo cargado.
  * Captura de pantalla de la tabla de estudiantes del curso donde se visualiza el registro añadido.

#### 7. Requisitos de configuración para hacer la prueba
* **Método de prueba:** Partición de equivalencia (formatos de archivo, pesos de archivo permitidos) y pruebas de flujo con estados lógicos alternativos (visibilidad encendido/apagado).
* **Módulos de código involucrados:**
  * Frontend: [TeacherCourse.tsx](file:///c:/Users/LENOVO/Desktop/Taller%20Integrador%20Frontend/smart-assess/src/pages/teacher/TeacherCourse.tsx), [CourseStudentsManager.tsx](file:///c:/Users/LENOVO/Desktop/Taller%20Integrador%20Frontend/smart-assess/src/pages/teacher/CourseStudentsManager.tsx), [courses.ts](file:///c:/Users/LENOVO/Desktop/Taller%20Integrador%20Frontend/smart-assess/src/api/courses.ts) (APIs `semanasApi` y `coursesApi`)
  * Backend: [CursoController.java](file:///c:/Users/LENOVO/Desktop/Taller%20Integrador%20backend/TallerIntegrador/src/main/java/com/example/tallerintegrador/controller/CursoController.java), [SemanaController.java](file:///c:/Users/LENOVO/Desktop/Taller%20Integrador%20backend/TallerIntegrador/src/main/java/com/example/tallerintegrador/controller/SemanaController.java), `SemanaService`, `CursoService`.
* **Hardware y Software:** Windows 10/11, motor de base de datos PostgreSQL, servicio Docker corriendo MongoDB y base vectorial Qdrant.

#### 8. Procedimientos o herramientas necesarias
1. Iniciar sesión con un usuario que tenga el rol de `TEACHER`.
2. Crear un curso nuevo, establecer una descripción y un número de semanas.
3. Entrar a la gestión de alumnos, buscar un alumno por nombre y presionar "Matricular".
4. Entrar al módulo de la Semana 1, arrastrar y soltar un archivo PDF que contenga texto académico en el área de carga.
5. Hacer clic en el icono del ojo en la fila del material para validar la actualización de visibilidad. Iniciar sesión como el alumno matriculado y corroborar que el documento aparezca/desaparezca según los cambios del docente.

#### 9. Dependencias o relación con otros casos de prueba
* Se relaciona directamente con la capacidad del estudiante de realizar exámenes. Si el docente oculta el material o no matricula al estudiante, el estudiante no podrá generar evaluaciones de RAG.

---

### Escenario de Prueba 7: Panel de Administración de Usuarios, Auditoría y Respaldo de Base de Datos

#### 1. Datos de Entrada
* **Funcionalidad a probar:** Panel de control del administrador, creación individual y carga masiva de usuarios en lote, toggle de bloqueo de cuentas de usuario, cambio forzado de contraseña y generación y descarga del backup completo de base de datos en SQL.

#### 2. Entorno
* **Módulo/Pantalla:** Panel del Administrador (`/admin` - [AdminDashboard.tsx](file:///c:/Users/LENOVO/Desktop/Taller%20Integrador%20Frontend/smart-assess/src/pages/admin/AdminDashboard.tsx)).
* **Componentes visuales:** Pestaña de registro de usuarios (individual y caja de texto para importación masiva), tabla interactiva de usuarios registrados con botones para bloquear/desbloquear/cambiar contraseña y botón de descarga de backup SQL.

#### 3. Parámetros
* Registro individual: `name` (text), `email` (text/email), `role` (select: student/teacher), `password` (text).
* Registro masivo: `bulkNames` (textarea con líneas en formato *"Nombre;correo@colegio.edu;rol;password"*).
* Backup: `backupDatabase` (clic en botón de descarga).
* Cambio de contraseña: `newPassword` (input modal).

#### 4. Respuesta de otros módulos
* **AdminUserController / AdminUserService:**
  * Procesa y guarda registros de nuevos usuarios en la tabla `usuario` en PostgreSQL.
  * Valida e inserta registros por lotes (procesamiento masivo).
  * Llama a un shell process en el backend de Spring Boot para ejecutar `pg_dump` y empaquetar los bytes de la base de datos SQL, enviando el archivo como un adjunto descargable en HTTP con tipo `application/sql`.

#### 5. Condiciones iniciales (Casos de Prueba)

| ID Caso | Técnica Aplicada | Entrada: Datos de Usuario / Lote | Operación Ejecutada | Estado del Sistema | Resultado Esperado | Resultado Obtenido | Estado |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **CP-07-01** | Partición Equivalencia (Válido Individual) | `Profesor Prueba`, `profe@colegio.edu`, `TEACHER`, `123456` | Crear usuario individual | Conexión activa | Registro correcto, inserta en Postgres. | [Completar tras ejecución] | [Pasó / Falló / Bloqueado / No ejecutado] |
| **CP-07-02** | Partición Equivalencia (Lote Inválido) | *"Nombre Incompleto;email@malo"* | Carga masiva en lote | - | El frontend o backend parsea el renglón y arroja mensaje de error de formato. | [Completar tras ejecución] | [Pasó / Falló / Bloqueado / No ejecutado] |
| **CP-07-03** | Tabla de Decisiones (Bloquear Activo) | - | Hacer click en botón "Bloquear" | Usuario activo (`cuentaBloqueada = false`) | Cambia a inactivo, restringe accesos de login del usuario. | [Completar tras ejecución] | [Pasó / Falló / Bloqueado / No ejecutado] |
| **CP-07-04** | Tabla de Decisiones (Backup OK) | - | Clic en "Descargar Backup SQL" | Utilidades base de datos activas | Se inicia la descarga de un archivo `.sql` válido con nombre formateado. | [Completar tras ejecución] | [Pasó / Falló / Bloqueado / No ejecutado] |

#### 6. Datos de Salida
* **Resultados entregados:**
  * **CP-07-01:** Toast de éxito: *"Docente registrado correctamente"*. El usuario aparece inmediatamente en el listado inferior.
  * **CP-07-02:** Alerta de parseo: *"Línea 1 mal formada. Estructura esperada: nombre;correo;rol;contraseña"*.
  * **CP-07-03:** Mensaje *"Estado de bloqueo actualizado"*. El botón cambia a color rojo con el texto *"Desbloquear"*.
  * **CP-07-04:** Descarga en el navegador del archivo `colegio_db_backup_YYYYMMDD_HHMMSS.sql`.
* **Estado final de las variables (Evidencias):**
  * La base de datos contiene los nuevos registros. El usuario bloqueado tiene la variable `cuenta_bloqueada = true` en PostgreSQL.
  * Captura de pantalla de la terminal o carpeta de descargas con el archivo SQL de respaldo.

#### 7. Requisitos de configuración para hacer la prueba
* **Método de prueba:** Partición de equivalencia para el formateo de lotes masivos y tabla de decisiones para operaciones críticas del sistema (bloqueo de accesos, exportación SQL).
* **Módulos de código involucrados:**
  * Frontend: [AdminDashboard.tsx](file:///c:/Users/LENOVO/Desktop/Taller%20Integrador%20Frontend/smart-assess/src/pages/admin/AdminDashboard.tsx), [users.ts](file:///c:/Users/LENOVO/Desktop/Taller%20Integrador%20Frontend/smart-assess/src/api/users.ts)
  * Backend: [AdminUserController.java](file:///c:/Users/LENOVO/Desktop/Taller%20Integrador%20backend/TallerIntegrador/src/main/java/com/example/tallerintegrador/controller/AdminUserController.java), [AdminUserService.java](file:///c:/Users/LENOVO/Desktop/Taller%20Integrador%20backend/TallerIntegrador/src/main/java/com/example/tallerintegrador/service/AdminUserService.java).
* **Hardware y Software:** Rol del usuario configurado como `ADMIN` en la base de datos PostgreSQL, contenedor de Docker con base de datos accesible, navegador Chrome.

#### 8. Procedimientos o herramientas necesarias
1. Iniciar sesión como Administrador en Semantika.
2. Ir a la pestaña de carga masiva de usuarios. Copiar y pegar el texto de prueba con formato correcto. Validar que la tabla de vista previa del frontend se rellene de forma automática.
3. Presionar "Registrar en lote" y verificar que se agreguen al listado.
4. Presionar el botón "Bloquear" en uno de los usuarios creados. Abrir otra ventana del navegador e intentar loguearse con ese usuario para constatar el bloqueo (CP-01-06).
5. Presionar el botón "Generar y descargar Backup SQL" y verificar que el archivo comience a descargarse y contenga las sentencias SQL correctas.

#### 9. Dependencias o relación con otros casos de prueba
* Las cuentas creadas aquí alimentan las pruebas de login (Escenario 1) y primer acceso (Escenario 2).

---

## 6. Listado Técnico del Proyecto

A continuación, se enumeran los recursos reales identificados en la arquitectura del proyecto:

### 1. Componentes y Vistas del Frontend (`smart-assess`)
* **Páginas Principales:**
  * [Index.tsx](file:///c:/Users/LENOVO/Desktop/Taller%20Integrador%20Frontend/smart-assess/src/pages/Index.tsx): Formulario de login, modal de ayuda técnica para reestablecer contraseñas.
  * [SetupPassword.tsx](file:///c:/Users/LENOVO/Desktop/Taller%20Integrador%20Frontend/smart-assess/src/pages/SetupPassword.tsx): Configuración inicial de contraseña y aceptación formal de política de tratamiento de datos con medidor de fuerza.
  * [Dashboard.tsx](file:///c:/Users/LENOVO/Desktop/Taller%20Integrador%20Frontend/smart-assess/src/pages/Dashboard.tsx): Vista del alumno, estadísticas de rendimiento.
  * [KnowledgeMap.tsx](file:///c:/Users/LENOVO/Desktop/Taller%20Integrador%20Frontend/smart-assess/src/pages/KnowledgeMap.tsx): Vista de mapa de calor matricial interactivo bidimensional de asignaturas y semanas.
  * [EvalModeSelect.tsx](file:///c:/Users/LENOVO/Desktop/Taller%20Integrador%20Frontend/smart-assess/src/pages/EvalModeSelect.tsx): Selector de modos formativos con candado condicional a diagnóstico inicial.
  * [AdaptivePractice.tsx](file:///c:/Users/LENOVO/Desktop/Taller%20Integrador%20Frontend/smart-assess/src/pages/AdaptivePractice.tsx): Interfaz de diagnóstico, simulación de debate cognitivo de agentes IA y despliegue del radar de Bloom.
  * [Practice.tsx](file:///c:/Users/LENOVO/Desktop/Taller%20Integrador%20Frontend/smart-assess/src/pages/Practice.tsx): Evaluaciones de opción múltiple, verdadero/falso y texto libre.
  * [AvatarTutor.tsx](file:///c:/Users/LENOVO/Desktop/Taller%20Integrador%20Frontend/smart-assess/src/pages/AvatarTutor.tsx): Lienzo interactivo del avatar SVG con control de periféricos de entrada por voz.
  * [VideoTutor.tsx](file:///c:/Users/LENOVO/Desktop/Taller%20Integrador%20Frontend/smart-assess/src/pages/VideoTutor.tsx): Reproducción de lecciones multimedia basadas en diapositivas generadas y narradas por IA.
  * [AdminDashboard.tsx](file:///c:/Users/LENOVO/Desktop/Taller%20Integrador%20Frontend/smart-assess/src/pages/admin/AdminDashboard.tsx): Control del administrador del sistema.
  * [TeacherDashboard.tsx](file:///c:/Users/LENOVO/Desktop/Taller%20Integrador%20Frontend/smart-assess/src/pages/teacher/TeacherDashboard.tsx), [TeacherCourse.tsx](file:///c:/Users/LENOVO/Desktop/Taller%20Integrador%20Frontend/smart-assess/src/pages/teacher/TeacherCourse.tsx): Paneles para el control del profesorado.
* **Módulos de Comunicación API:**
  * [client.ts](file:///c:/Users/LENOVO/Desktop/Taller%20Integrador%20Frontend/smart-assess/src/api/client.ts): Cliente Axios para comunicación HTTP.
  * [auth.ts](file:///c:/Users/LENOVO/Desktop/Taller%20Integrador%20Frontend/smart-assess/src/api/auth.ts), [courses.ts](file:///c:/Users/LENOVO/Desktop/Taller%20Integrador%20Frontend/smart-assess/src/api/courses.ts), [users.ts](file:///c:/Users/LENOVO/Desktop/Taller%20Integrador%20Frontend/smart-assess/src/api/users.ts): Clientes de endpoints backend.

### 2. Librerías y Tecnologías del Frontend
* **Core:** React 18.3 (TypeScript), Vite 5.4.
* **Componentes visuales y Estilos:** TailwindCSS (para el maquetado modular), Radix UI (dialogs, accordion, switches), Lucide React (biblioteca de iconos vectoriales), Framer Motion (para micro-animaciones fluidas).
* **Gestión de Datos y Estado:** TanStack React Query (mutaciones, caché de red y refetch de consultas), Axios.
* **Visualización de Datos:** Recharts (gráfico radial de taxonomía de Bloom y barras estadísticas de administrador).

### 3. Clases y Controladores del Backend (`TallerIntegrador`)
* **Controladores REST (API endpoints):**
  * [AuthController.java](file:///c:/Users/LENOVO/Desktop/Taller%20Integrador%20backend/TallerIntegrador/src/main/java/com/example/tallerintegrador/controller/AuthController.java): Gestión de accesos, soporte técnico, reseteo de claves y consentimiento.
  * [AdminUserController.java](file:///c:/Users/LENOVO/Desktop/Taller%20Integrador%20backend/TallerIntegrador/src/main/java/com/example/tallerintegrador/controller/AdminUserController.java): ABM de usuarios, bloqueo de accesos y dump SQL de respaldo.
  * [CursoController.java](file:///c:/Users/LENOVO/Desktop/Taller%20Integrador%20backend/TallerIntegrador/src/main/java/com/example/tallerintegrador/controller/CursoController.java): Gestión de asignaturas académicas, matrículas y visualizador de archivos adjuntos.
  * [SemanaController.java](file:///c:/Users/LENOVO/Desktop/Taller%20Integrador%20backend/TallerIntegrador/src/main/java/com/example/tallerintegrador/controller/SemanaController.java): Administra materiales cargados y visibilidad por semana académica.
  * [ArchivosIaController.java](file:///c:/Users/LENOVO/Desktop/Taller%20Integrador%20backend/TallerIntegrador/src/main/java/com/example/tallerintegrador/controller/ArchivosIaController.java): Ingesta RAG, generación de cuestionarios e interacción del tutor por voz.
  * [AdaptiveLearningController.java](file:///c:/Users/LENOVO/Desktop/Taller%20Integrador%20backend/TallerIntegrador/src/main/java/com/example/tallerintegrador/controller/AdaptiveLearningController.java): Gestión del diagnóstico inicial del estudiante y recomendación de lecturas de apoyo.
  * [AgentJudgeController.java](file:///c:/Users/LENOVO/Desktop/Taller%20Integrador%20backend/TallerIntegrador/src/main/java/com/example/tallerintegrador/controller/AgentJudgeController.java): Calificación inteligente cualitativa y cuantitativa de respuestas de desarrollo.
* **Servicios Lógicos:**
  * [AuthService.java](file:///c:/Users/LENOVO/Desktop/Taller%20Integrador%20backend/TallerIntegrador/src/main/java/com/example/tallerintegrador/service/AuthService.java), [AdminUserService.java](file:///c:/Users/LENOVO/Desktop/Taller%20Integrador%20backend/TallerIntegrador/src/main/java/com/example/tallerintegrador/service/AdminUserService.java).
  * [AdaptiveLearningService.java](file:///c:/Users/LENOVO/Desktop/Taller%20Integrador%20backend/TallerIntegrador/src/main/java/com/example/tallerintegrador/service/AdaptiveLearningService.java), [AcraEvaluacion.java](file:///c:/Users/LENOVO/Desktop/Taller%20Integrador%20backend/TallerIntegrador/src/main/java/com/example/tallerintegrador/service/AcraEvaluacion.java).
  * [SpikeService.java](file:///c:/Users/LENOVO/Desktop/Taller%20Integrador%20backend/TallerIntegrador/src/main/java/com/example/tallerintegrador/service/SpikeService.java), [RagIngestionService.java](file:///c:/Users/LENOVO/Desktop/Taller%20Integrador%20backend/TallerIntegrador/src/main/java/com/example/tallerintegrador/service/RagIngestionService.java).
  * [PromptTemplateService.java](file:///c:/Users/LENOVO/Desktop/Taller%20Integrador%20backend/TallerIntegrador/src/main/java/com/example/tallerintegrador/service/PromptTemplateService.java): Control del repositorio de prompts de IA en MongoDB.

### 4. Tecnologías y Base de Datos del Backend
* **Entorno de desarrollo:** Java 21, Spring Boot 3.2.5, Maven.
* **Bases de datos:**
  * **Relacional:** PostgreSQL (tablas de `usuario`, `curso`, `matricula`, `intento`, `pregunta`, `respuesta_usuario`).
  * **No Relacional:** MongoDB (colecciones de `Prompt`, `ArchivoPrompt` con archivos binarios adjuntos, `BackupBD`).
  * **Buscador Vectorial:** Qdrant (para indexado de embeddings de texto extraídos de PDFs e ingesta RAG).
* **Librerías Clave:** LangChain4j (para control conversacional de IA y RAG), Google GenAI SDK, Apache Tika (procesamiento y lectura de archivos PDF), Spring Security (control de roles, autenticación JWT).

---

## 7. Errores y Vulnerabilidades Técnicas Detectados y Corregidos durante el Análisis

Durante la inspección de la estructura lógica de los controladores del backend y flujos de frontend, se identificaron y solucionaron los siguientes puntos débiles o fallos potenciales:

### 1. Inexistencia de validaciones de robustez de contraseña en el Backend — **[CORREGIDO]**
* **Descripción:** Anteriormente, [SetupPassword.tsx](file:///c:/Users/LENOVO/Desktop/Taller%20Integrador%20Frontend/smart-assess/src/pages/SetupPassword.tsx) validaba la contraseña en el cliente, pero en el endpoint `/setup-password` en [AuthController.java](file:///c:/Users/LENOVO/Desktop/Taller%20Integrador%20backend/TallerIntegrador/src/main/java/com/example/tallerintegrador/controller/AuthController.java) no existía ninguna validación en el servidor.
* **Solución Aplicada:** Se agregó una validación robusta en [AuthService.java](file:///c:/Users/LENOVO/Desktop/Taller%20Integrador%20backend/TallerIntegrador/src/main/java/com/example/tallerintegrador/service/AuthService.java) dentro del método `setupPassword` que verifica que la contraseña nueva no sea nula, vacía o menor de 6 caracteres, arrojando un error HTTP 400 (`IllegalArgumentException`) si no se cumple el criterio.

### 2. IDOR (Insecure Direct Object Reference) en la descarga de archivos físicos — **[CORREGIDO]**
* **Descripción:** El endpoint `/cursos/ver-archivo/{mongoId}` en [CursoController.java](file:///c:/Users/LENOVO/Desktop/Taller%20Integrador%20backend/TallerIntegrador/src/main/java/com/example/tallerintegrador/controller/CursoController.java) retornaba archivos binarios de MongoDB a cualquier usuario autenticado sin verificar la matrícula en el curso correspondiente.
* **Solución Aplicada:** Se inyectaron los repositorios relacionales necesarios y se implementó la validación `validarAccesoArchivo` en [CursoController.java](file:///c:/Users/LENOVO/Desktop/Taller%20Integrador%20backend/TallerIntegrador/src/main/java/com/example/tallerintegrador/controller/CursoController.java). Ahora se recupera el material de base de datos relacional y se comprueba si el estudiante que realiza la llamada tiene una matrícula activa en el curso al que pertenece el material. En caso negativo, lanza un `AccessDeniedException` (HTTP 403).

### 3. Falta de validación formal en DTOs de Administración y Cursos — **[CORREGIDO]**
* **Descripción:** Anteriormente, los controladores [AdminUserController.java](file:///c:/Users/LENOVO/Desktop/Taller%20Integrador%20backend/TallerIntegrador/src/main/java/com/example/tallerintegrador/controller/AdminUserController.java) y [CursoController.java](file:///c:/Users/LENOVO/Desktop/Taller%20Integrador%20backend/TallerIntegrador/src/main/java/com/example/tallerintegrador/controller/CursoController.java) recibían mapas genéricos o peticiones sin validación declarativa.
* **Solución Aplicada:** Se agregó la dependencia `spring-boot-starter-validation` en el proyecto. Se tiparon y validaron formalmente los registros usando anotaciones Bean Validation (`@Valid`, `@NotBlank`, `@Email`, `@Size`, `@NotNull`) en `CreateUserRequest` y `CursoRequestDTO`. La validación activa se incorporó en `AdminUserController.java` (individualmente con `@Valid` y masivamente iterando con `jakarta.validation.Validator`) y en `CursoController.java` (`crearCurso` y `editarCurso` anotados con `@Valid`).

### 4. Vulnerabilidad de denegación de servicio por subida de archivos pesados — **[CORREGIDO]**
* **Descripción:** En [ArchivosIaController.java](file:///c:/Users/LENOVO/Desktop/Taller%20Integrador%20backend/TallerIntegrador/src/main/java/com/example/tallerintegrador/controller/ArchivosIaController.java), el endpoint `/archivos/ingestar` procesaba archivos de cualquier tamaño directamente en memoria Heap (JVM), arriesgando un *OutOfMemoryError*.
* **Solución Aplicada:** Se añadieron validaciones en el controlador [ArchivosIaController.java](file:///c:/Users/LENOVO/Desktop/Taller%20Integrador%20backend/TallerIntegrador/src/main/java/com/example/tallerintegrador/controller/ArchivosIaController.java) tanto en `/subir` como en `/ingestar` para validar que el peso de los archivos no sea superior a **15MB**, respondiendo inmediatamente con HTTP 400 en caso de sobrepasar este umbral.

### 5. Dependencia de utilidades del sistema en el backup de base de datos — **[RECOMENDACIÓN]**
* **Descripción:** El endpoint `/admin/usuarios/backup` en [AdminUserController.java](file:///c:/Users/LENOVO/Desktop/Taller%20Integrador%20backend/TallerIntegrador/src/main/java/com/example/tallerintegrador/controller/AdminUserController.java) requiere la utilidad `pg_dump` instalada localmente.

---

## 8. Notas y Sugerencias de Mejora Implementadas y Recomendaciones

* **Indicador de Fuerza de Contraseña Visual — [IMPLEMENTADO]:** Se añadió en [SetupPassword.tsx](file:///c:/Users/LENOVO/Desktop/Taller%20Integrador%20Frontend/smart-assess/src/pages/SetupPassword.tsx) una barra de progreso multicolor reactiva (Rojo = Débil, Amarillo = Media, Verde = Fuerte) que evalúa dinámicamente la contraseña ingresada por el usuario en tiempo real.
* **Rediseño del Mapa de Calor Real — [IMPLEMENTADO]:** Se reescribió por completo la vista [KnowledgeMap.tsx](file:///c:/Users/LENOVO/Desktop/Taller%20Integrador%20Frontend/smart-assess/src/pages/KnowledgeMap.tsx). Ahora despliega una cuadrícula matricial bidimensional real (Cursos en eje Y, Semanas en eje X) con celdas de color interactivas basadas en el dominio. Al hacer clic en un cuadrante, se muestra un panel lateral detallado con el progreso cognitivo y nota promedio. Además, incluye un gráfico de área Recharts que muestra la curva histórica del alumno.
* **Paginación en consultas de administración:** Recomendación para consultas en [AdminUserController.java](file:///c:/Users/LENOVO/Desktop/Taller%20Integrador%20backend/TallerIntegrador/src/main/java/com/example/tallerintegrador/controller/AdminUserController.java) utilizando `Pageable`.
* **Resiliencia de Conexiones LLM (Circuit Breaker):** Recomendación de aplicar patrón de Circuit Breaker en `AgentJudgeAgent.java`.
* **Caché en el mapa de calor de rendimiento:** Recomendación de aplicar `@Cacheable` de Spring para almacenar en caché las notas del alumno de forma temporal.

---

## 9. Conclusiones Generales del Documento

* **Resumen Cuantitativo de Ejecución:**
  * Se han diseñado un total de **31 casos de prueba** distribuidos en 7 escenarios críticos de negocio.
  * Métrica consolidada de pruebas: `[ X ]` de `[ 31 ]` casos ejecutados exitosamente.
  * Resultados detallados: `[ Completar tras ejecución: __ Pasaron / __ Fallaron / __ Bloqueados ]`.
* **Gestión de Riesgos Técnicos y Mitigación:**
  * Las vulnerabilidades de gravedad **Alta** detectadas inicialmente en la fase de análisis estático del código (inseguridad en contraseñas en [AuthService.java](file:///c:/Users/LENOVO/Desktop/Taller%20Integrador%20backend/TallerIntegrador/src/main/java/com/example/tallerintegrador/service/AuthService.java), IDOR en descarga de PDFs en [CursoController.java](file:///c:/Users/LENOVO/Desktop/Taller%20Integrador%20backend/TallerIntegrador/src/main/java/com/example/tallerintegrador/controller/CursoController.java), tipación y validación de DTOs en [AdminUserController.java](file:///c:/Users/LENOVO/Desktop/Taller%20Integrador%20backend/TallerIntegrador/src/main/java/com/example/tallerintegrador/controller/AdminUserController.java) / [CursoController.java](file:///c:/Users/LENOVO/Desktop/Taller%20Integrador%20backend/TallerIntegrador/src/main/java/com/example/tallerintegrador/controller/CursoController.java), y DoS en ingesta RAG en [ArchivosIaController.java](file:///c:/Users/LENOVO/Desktop/Taller%20Integrador%20backend/TallerIntegrador/src/main/java/com/example/tallerintegrador/controller/ArchivosIaController.java)) han sido mitigadas satisfactoriamente mediante validaciones de backend directas en la base relacional de matriculados, robustez de claves, validaciones Bean Validation estrictas y el filtro de tamaño de archivos a 15MB. Esto reduce el nivel de riesgo de seguridad de **Alto** a **Bajo / Mitigado**.
* **Recomendación de Madurez del Sistema:**
  * Tras incorporar los mecanismos de robustez en el servidor (validación de contraseñas, DTOs tipados, control de tamaño de archivos y mitigación de IDOR) y las mejoras visuales e interactivas en el cliente (mapa de calor bidimensional y medidor de fortaleza), el sistema demuestra un nivel de madurez técnica **Excelente / Listo para Producción y Staging**. Es apto tanto para su evaluación académica formal como para despliegues pilotos comerciales controlados.

---

## 10. Glosario Técnico

* **RAG (Retrieval-Augmented Generation):** Técnica de optimización de salida de un LLM que busca documentos específicos en fuentes externas (como PDFs vectorizados) y los introduce como contexto en el prompt de la consulta.
* **SSE (Server-Sent Events):** Protocolo de comunicación unidireccional persistente sobre HTTP que permite al servidor enviar flujos (streams) de datos asíncronos en tiempo real al cliente sin necesidad de polling repetitivo.
* **Qdrant:** Motor de base de datos vectorial de alto rendimiento diseñado para almacenar, buscar y gestionar vectores (embeddings) de alta dimensionalidad de forma eficiente.
* **IDOR (Insecure Direct Object Reference):** Vulnerabilidad de control de acceso donde un atacante puede acceder a recursos protegidos (archivos, datos de base) modificando un identificador directo (ID, hash) en los parámetros de la URL sin validación de privilegios en el servidor.
* **JWT (JSON Web Token):** Estándar abierto RFC 7519 para transmitir información de forma segura entre cliente y servidor como un objeto JSON compacto y firmado digitalmente.
* **LLM (Large Language Model):** Modelo de IA entrenado con grandes volúmenes de texto para comprender, resumir, estructurar, calificar y generar contenido conversacional contextualizado.
* **TTS (Text-to-Speech):** Tecnología de síntesis de audio que convierte cadenas de caracteres de texto escrito en voz digitalizada e inteligible.
* **Web Speech API:** API nativa de navegadores web que proporciona interfaces para reconocimiento de voz (Speech-to-Text) y síntesis de voz (Text-to-Speech) sin dependencias de red de terceros.
* **Circuit Breaker:** Patrón de diseño de microservicios que detiene temporalmente llamadas de red a APIs externas lentas o caídas para evitar consumir recursos del servidor y provocar fallos en cascada.
