import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Suspense, lazy } from "react";
import { Loader2 } from "lucide-react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import ProtectedRoute from "./components/ProtectedRoute";
import { ThemeProvider } from "./components/ThemeProvider";

// Estas dos son la primera pantalla que ve cualquiera: se cargan de inmediato, sin trocear,
// porque partirlas solo agregaría un salto de red antes del login.
import Index from "./pages/Index.tsx";
import SetupPassword from "./pages/SetupPassword";

/**
 * El resto se carga bajo demanda.
 *
 * Antes, App.tsx importaba las 17 páginas de forma estática: el navegador de un alumno
 * descargaba y parseaba el panel de administración, el de docente, el VideoTutor y
 * recharts entero antes de poder pintar su propio dashboard — 1.77 MB en un solo archivo.
 * En un celular de gama media con datos móviles eso es medio minuto mirando una pantalla
 * en blanco. Con React.lazy, cada rol descarga solo lo suyo.
 */
const AppLayout = lazy(() => import("./components/AppLayout"));
const TeacherLayout = lazy(() => import("./components/TeacherLayout"));
const AdminLayout = lazy(() => import("./components/AdminLayout"));

const Dashboard = lazy(() => import("./pages/Dashboard"));
const Practice = lazy(() => import("./pages/Practice"));
const HistoryPage = lazy(() => import("./pages/HistoryPage"));
const Course = lazy(() => import("./pages/Course"));
const EvalModeSelect = lazy(() => import("./pages/EvalModeSelect"));
const AvatarTutor = lazy(() => import("./pages/AvatarTutor"));
const VideoTutor = lazy(() => import("./pages/VideoTutor"));
const AdaptivePractice = lazy(() => import("./pages/AdaptivePractice"));
const KnowledgeMap = lazy(() => import("./pages/KnowledgeMap"));

const TeacherDashboard = lazy(() => import("./pages/teacher/TeacherDashboard"));
const TeacherCourse = lazy(() => import("./pages/teacher/TeacherCourse"));
const TeacherWeek = lazy(() => import("./pages/teacher/TeacherWeek"));
const CourseStudentsManager = lazy(() => import("./pages/teacher/CourseStudentsManager"));
const ValidacionJuez = lazy(() => import("./pages/teacher/ValidacionJuez"));

const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const MetricasIA = lazy(() => import("./pages/admin/MetricasIA"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Evita que cada navegación entre pantallas dispare de nuevo las mismas consultas:
      // en un celular con conexión lenta, cada refetch innecesario es medio segundo de
      // spinner y batería gastada.
      staleTime: 60_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

/** Pantalla intermedia mientras se descarga el trozo de la ruta. */
function CargandoRuta() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
      <span className="text-sm font-semibold text-muted-foreground">Cargando…</span>
    </div>
  );
}

const App = () => (
  <ThemeProvider>
    <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Suspense fallback={<CargandoRuta />}>
          <Routes>
            {/* Ruta pública: login y configuración de contraseña */}
            <Route path="/" element={<Index />} />
            <Route path="/setup-password" element={<SetupPassword />} />

            {/* Rutas protegidas para STUDENT */}
            <Route element={<ProtectedRoute allowedRoles={["STUDENT"]} />}>
              <Route path="/app" element={<AppLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="practica" element={<Practice />} />
                <Route path="curso/:courseId" element={<Course />} />
                <Route path="curso/:courseId/semana/:semanaId" element={<EvalModeSelect />} />
                <Route path="curso/:courseId/semana/:semanaId/evaluacion/:mode" element={<Practice />} />
                <Route path="curso/:courseId/semana/:semanaId/evaluacion/avatar" element={<AvatarTutor />} />
                <Route path="curso/:courseId/semana/:semanaId/evaluacion/video" element={<VideoTutor />} />
                <Route path="curso/:courseId/semana/:semanaId/evaluacion/adaptativa" element={<AdaptivePractice />} />
                <Route path="mapa-conocimiento" element={<KnowledgeMap />} />
                <Route path="historial" element={<HistoryPage />} />
              </Route>
            </Route>

            {/* Rutas protegidas para TEACHER */}
            <Route element={<ProtectedRoute allowedRoles={["TEACHER"]} />}>
              <Route path="/docente" element={<TeacherLayout />}>
                <Route index element={<TeacherDashboard />} />
                <Route path="curso/:courseId" element={<TeacherCourse />} />
                <Route path="curso/:courseId/semana/:semanaId" element={<TeacherWeek />} />
                <Route path="validacion-juez" element={<ValidacionJuez />} />
                <Route path="curso/:courseId/alumnos" element={<CourseStudentsManager />} />
              </Route>
            </Route>

            {/* Rutas protegidas para ADMIN */}
            <Route element={<ProtectedRoute allowedRoles={["ADMIN"]} />}>
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="metricas-ia" element={<MetricasIA />} />
              </Route>
            </Route>

            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
