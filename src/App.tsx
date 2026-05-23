import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import AppLayout from "./components/AppLayout";
import Dashboard from "./pages/Dashboard";
import Practice from "./pages/Practice";
import HistoryPage from "./pages/HistoryPage";
import Course from "./pages/Course";
import EvalModeSelect from "./pages/EvalModeSelect";
import TeacherLayout from "./components/TeacherLayout";
import TeacherDashboard from "./pages/teacher/TeacherDashboard";
import TeacherCourse from "./pages/teacher/TeacherCourse";
import AdminLayout from "./components/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import TeacherWeek from "./pages/teacher/TeacherWeek";
import CourseStudentsManager from "./pages/teacher/CourseStudentsManager";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/app" element={<AppLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="practica" element={<Practice />} />
              <Route path="curso/:courseId" element={<Course />} />
              <Route path="curso/:courseId/semana/:semanaId" element={<EvalModeSelect />} />
              <Route path="curso/:courseId/semana/:semanaId/evaluacion/:mode" element={<Practice />} />
            <Route path="historial" element={<HistoryPage />} />
          </Route>
            <Route path="/docente" element={<TeacherLayout />}>
            <Route path="/docente/curso/:courseId/alumnos" element={<CourseStudentsManager />} />
            <Route index element={<TeacherDashboard />} />
            <Route path="curso/:courseId" element={<TeacherCourse />} />
            <Route path="curso/:courseId/semana/:semanaId" element={<TeacherWeek />} />
            </Route>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
          </Route>
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
