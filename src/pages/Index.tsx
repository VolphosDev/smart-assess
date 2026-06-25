import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight, GraduationCap, Check } from "lucide-react";
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

    // Estados para el Modal de Soporte
    const [showSupportModal, setShowSupportModal] = useState(false);
    const [supportEmail, setSupportEmail] = useState("");
    const [supportReason, setSupportReason] = useState("Olvidé mi contraseña");
    const [supportDescription, setSupportDescription] = useState("");
    const [isSubmittingSupport, setIsSubmittingSupport] = useState(false);
    const [supportSuccess, setSupportSuccess] = useState(false);

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

            // Verificar si el usuario necesita configurar su contraseña
            if (response.user.requiresPasswordSetup) {
                // Redirigir a la pantalla de setup-password, pasando el correo
                navigate(`/setup-password?email=${encodeURIComponent(email)}`);
                return; // Evita guardar el token para forzar que inicie sesión bien después
            }

            // 👇 ¡NUEVO! Guardamos el token y el usuario en el navegador
            localStorage.setItem("token", response.user.token);
            // Guardamos el resto de info (id, name, role) convertido a texto
            localStorage.setItem("user", JSON.stringify(response.user));

            // Redirigimos según el rol que nos devolvió tu base de datos
            const userRole = response.user.role.toLowerCase();
            navigate(userRole === "student" ? "/app" : userRole === "teacher" ? "/docente" : "/admin");

        } catch (err: any) {
            let errorMsg = "Correo o contraseña incorrectos";
            if (err.message) {
                try {
                    const parsed = JSON.parse(err.message);
                    errorMsg = parsed.error || parsed.message || errorMsg;
                } catch {
                    errorMsg = err.message;
                }
            }
            setError(errorMsg);
        } finally {
            setIsLoading(false);
        }
    };

    const submitSupport = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmittingSupport(true);
        try {
            await authApi.soporte(supportEmail, supportReason, supportDescription);
            setSupportSuccess(true);
        } catch (error) {
            console.error("Error al enviar soporte", error);
            // Mostrar error (opcionalmente con toast si lo tuviéramos importado)
        } finally {
            setIsSubmittingSupport(false);
        }
    };

    return (
        <div className="min-h-screen bg-background bg-mesh grid lg:grid-cols-2">
            {/* Left: brand panel */}
            <div className="hidden lg:flex flex-col justify-between p-12 bg-hero-gradient text-primary-foreground relative overflow-hidden">
                {/* Decorative background grid (malla) */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />
                
                <Link to="/" className="flex items-center gap-2.5 font-display font-bold text-2xl relative z-10">
                    <span className="grid place-items-center w-10 h-10 rounded-lg bg-white/10 border border-white/10 backdrop-blur-xs shadow-xs">
                        <Sparkles className="w-5.5 h-5.5 text-white" />
                    </span>
                    <span className="tracking-tight text-white">Semantika</span>
                </Link>
                
                <div className="relative space-y-6 max-w-md z-10 my-auto text-left">
                    <h1 className="font-display text-5xl font-bold leading-tight tracking-tight text-white">
                        Evaluación formativa <br />y adaptativa con IA.
                    </h1>
                    <p className="text-white/80 text-lg font-light leading-relaxed">
                        Plataforma académica integral impulsada por agentes de IA. Genera evaluaciones interactivas y visuales, interactúa con tutores inteligentes en video o conversación, y recibe diagnósticos adaptativos en tiempo real.
                    </p>
                </div>
                
                <div className="relative text-xs text-white/50 z-10 font-mono text-left">
                    © 2026 Semantika · Educación Generativa & Análisis
                </div>
            </div>
 
            {/* Right: login */}
            <div className="flex items-center justify-center p-6 sm:p-10 relative overflow-hidden">
                {/* Subtle background graphics */}
                <div className="absolute top-10 right-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-10 left-10 w-72 h-72 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
                
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="w-full max-w-md bg-card border border-border/80 p-8 sm:p-10 rounded-xl shadow-lg border-border hover:shadow-xl transition-all duration-300 relative z-10"
                >
                    <div className="lg:hidden flex items-center gap-2.5 font-display font-bold text-2xl mb-8">
                        <span className="grid place-items-center w-10 h-10 rounded-lg bg-primary text-primary-foreground shadow-sm">
                            <Sparkles className="w-5.5 h-5.5" />
                        </span>
                        <span className="tracking-tight">Semantika</span>
                    </div>
 
                    <h2 className="font-display text-3xl font-bold mb-2 tracking-tight text-left">Bienvenido de vuelta</h2>
                    <p className="text-muted-foreground text-sm mb-6 text-left">Ingresa tus credenciales para continuar al panel.</p>
 
                    {error && (
                        <div className="mb-5 p-3.5 text-sm text-destructive bg-destructive/5 border border-destructive/15 rounded-lg text-center font-medium">
                            {error}
                        </div>
                    )}
 
                    <form onSubmit={submit} className="space-y-4">
                        <div className="space-y-1.5 text-left">
                            <Label htmlFor="email" className="font-semibold text-xs text-foreground/80">Correo institucional</Label>
                            <Input
                                id="email"
                                type="email"
                                required
                                placeholder="correo@institucion.edu"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="h-11 rounded-lg border border-input bg-background/50 focus-visible:ring-primary/30 transition-all text-sm"
                            />
                        </div>
                        <div className="space-y-1.5 text-left">
                            <Label htmlFor="password" className="font-semibold text-xs text-foreground/80">Contraseña</Label>
                            <Input
                                id="password"
                                type="password"
                                required
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="h-11 rounded-lg border border-input bg-background/50 focus-visible:ring-primary/30 transition-all text-sm"
                            />
                        </div>
                        <Button
                            type="submit"
                            size="lg"
                            disabled={isLoading}
                            className="w-full h-11 rounded-lg bg-primary hover:bg-primary/95 text-primary-foreground font-semibold mt-6 shadow-sm transition-all active:scale-[0.98] flex items-center justify-center gap-1.5"
                        >
                            {isLoading ? "Iniciando sesión..." : "Iniciar sesión"}
                            {!isLoading && <ArrowRight className="w-4 h-4" />}
                        </Button>
                    </form>
 
                    <p className="text-center text-xs text-muted-foreground mt-8">
                        ¿Tienes problemas para ingresar?{" "}
                        <button 
                            type="button"
                            onClick={() => setShowSupportModal(true)}
                            className="font-semibold text-primary hover:underline hover:text-primary/90"
                        >
                            Solicita ayuda
                        </button>
                    </p>
                </motion.div>
            </div>

            {/* MODAL DE SOPORTE */}
            {showSupportModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-card w-full max-w-md p-6 rounded-2xl shadow-xl border border-border relative"
                    >
                        <h3 className="text-xl font-bold mb-4">Solicitar Ayuda</h3>
                        
                        {supportSuccess ? (
                            <div className="text-center py-6">
                                <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Check className="w-6 h-6" />
                                </div>
                                <h4 className="font-semibold text-lg mb-2">¡Solicitud Enviada!</h4>
                                <p className="text-sm text-muted-foreground mb-6">Hemos recibido tu mensaje. Un administrador revisará tu caso pronto.</p>
                                <Button onClick={() => { setShowSupportModal(false); setSupportSuccess(false); }} className="w-full">
                                    Cerrar
                                </Button>
                            </div>
                        ) : (
                            <form onSubmit={submitSupport} className="space-y-4">
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold">Correo institucional que recuerdes</Label>
                                    <Input
                                        type="email"
                                        required
                                        value={supportEmail}
                                        onChange={(e) => setSupportEmail(e.target.value)}
                                        placeholder="correo@institucion.edu"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold">Motivo</Label>
                                    <select
                                        value={supportReason}
                                        onChange={(e) => setSupportReason(e.target.value)}
                                        className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    >
                                        <option value="Olvidé mi contraseña">Olvidé mi contraseña</option>
                                        <option value="Mi cuenta está bloqueada">Mi cuenta está bloqueada</option>
                                        <option value="No puedo acceder a mis cursos">No puedo acceder a mis cursos</option>
                                        <option value="Otro (detallar en descripción)">Otro (detallar en descripción)</option>
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold">Descripción (Opcional)</Label>
                                    <textarea
                                        value={supportDescription}
                                        onChange={(e) => setSupportDescription(e.target.value)}
                                        placeholder="Escribe más detalles aquí..."
                                        className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                                    ></textarea>
                                </div>
                                <div className="flex justify-end gap-2 pt-2">
                                    <Button type="button" variant="ghost" onClick={() => setShowSupportModal(false)}>Cancelar</Button>
                                    <Button type="submit" disabled={isSubmittingSupport}>
                                        {isSubmittingSupport ? "Enviando..." : "Enviar Solicitud"}
                                    </Button>
                                </div>
                            </form>
                        )}
                    </motion.div>
                </div>
            )}
        </div>
    );
}