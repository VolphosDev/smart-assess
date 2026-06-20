import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// ¡IMPORTANTE! Importa tu authApi
import { authApi } from "@/api/auth.ts";

export default function Index() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem("token");
        const userStr = localStorage.getItem("user");
        if (token && userStr) {
            try {
                const user = JSON.parse(userStr);
                const userRole = user.role?.toLowerCase();
                if (userRole === "student") {
                    navigate("/app");
                } else if (userRole === "teacher") {
                    navigate("/docente");
                } else if (userRole === "admin") {
                    navigate("/admin");
                }
            } catch (e) {
                console.error("Error parsing user from localStorage", e);
            }
        }
    }, [navigate]);

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            const response = await authApi.login(email, password);

            console.log("¡Login exitoso!", response.user);

            // 👇 ¡NUEVO! Guardamos el token y el usuario en el navegador
            localStorage.setItem("token", response.user.token);
            // Guardamos el resto de info (id, name, role) convertido a texto
            localStorage.setItem("user", JSON.stringify(response.user));

            // Redirigimos según el rol que nos devolvió tu base de datos
            const userRole = response.user.role.toLowerCase();
            navigate(userRole === "student" ? "/app" : userRole === "teacher" ? "/docente" : "/admin");

        } catch (err: any) {
            setError(err.response?.data?.error || "Correo o contraseña incorrectos");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background bg-mesh grid lg:grid-cols-2">
            {/* Left: brand panel */}
            <div className="hidden lg:flex flex-col justify-between p-12 bg-hero-gradient text-primary-foreground relative overflow-hidden">
                <div className="absolute -right-20 -bottom-20 text-[22rem] opacity-15 select-none leading-none">🎓</div>
                <Link to="/" className="flex items-center gap-2 font-display font-bold text-2xl relative">
          <span className="grid place-items-center w-10 h-10 rounded-2xl bg-background/20 backdrop-blur">
            <Sparkles className="w-5 h-5" />
          </span>
                    Semantika
                </Link>
                <div className="relative space-y-4 max-w-md">
                    <h1 className="font-display text-5xl font-bold leading-tight">
                        Aprende hablando, evalúa con IA.
                    </h1>
                    <p className="opacity-90 text-lg">
                        Plataforma educativa para docentes y alumnos. Practica oralmente, recibe retroalimentación inmediata y sigue tu progreso semana a semana.
                    </p>
                </div>
                <div className="relative text-sm opacity-80">© 2026 Semantika · Educación generativa</div>
            </div>

            {/* Right: login */}
            <div className="flex items-center justify-center p-6 sm:p-10">
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-md"
                >
                    <div className="lg:hidden flex items-center gap-2 font-display font-bold text-2xl mb-8">
            <span className="grid place-items-center w-10 h-10 rounded-2xl bg-primary-gradient text-primary-foreground shadow-glow">
              <Sparkles className="w-5 h-5" />
            </span>
                        Semantika
                    </div>

                    <h2 className="font-display text-3xl font-bold mb-2">Bienvenido de vuelta</h2>
                    <p className="text-muted-foreground mb-6">Ingresa tus credenciales para continuar.</p>

                    {error && (
                        <div className="mb-4 p-3 text-sm text-red-500 bg-red-100 rounded-lg text-center">
                            {error}
                        </div>
                    )}

                    <form onSubmit={submit} className="space-y-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="email">Correo institucional</Label>
                            <Input
                                id="email"
                                type="email"
                                required
                                placeholder="correo@institucion.edu"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="h-12 rounded-2xl"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="password">Contraseña</Label>
                            <Input
                                id="password"
                                type="password"
                                required
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="h-12 rounded-2xl"
                            />
                        </div>
                        <Button
                            type="submit"
                            size="lg"
                            disabled={isLoading}
                            className="w-full h-12 rounded-2xl bg-primary-gradient font-bold shadow-glow mt-2"
                        >
                            {isLoading ? "Iniciando sesión..." : "Iniciar sesión"}
                            {!isLoading && <ArrowRight className="w-4 h-4 ml-1" />}
                        </Button>
                    </form>

                    <p className="text-center text-sm text-muted-foreground mt-6">
                        ¿Aún no tienes cuenta? <a className="font-semibold text-primary hover:underline" href="#">Solicita acceso</a>
                    </p>
                </motion.div>
            </div>
        </div>
    );
}