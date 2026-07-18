import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { authApi } from "@/api/auth";
import { cn } from "@/lib/utils";

export default function SetupPassword() {
    const [searchParams] = useSearchParams();
    const email = searchParams.get("email") || "";
    const navigate = useNavigate();

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [termsAccepted, setTermsAccepted] = useState(false);

    const getPasswordStrength = (pass: string) => {
        if (!pass) return { score: 0, label: "", color: "bg-muted", text: "text-muted-foreground" };
        let score = 0;
        if (pass.length >= 6) score++;
        if (pass.length >= 8) score++;
        if (/[A-Z]/.test(pass)) score++;
        if (/[0-9]/.test(pass)) score++;
        if (/[^A-Za-z0-9]/.test(pass)) score++;

        if (score <= 2) return { score, label: "Débil ⚠️", color: "bg-rose-500", text: "text-rose-500" };
        if (score <= 4) return { score, label: "Media ⚡", color: "bg-amber-500", text: "text-amber-500" };
        return { score, label: "Fuerte 💪", color: "bg-emerald-500", text: "text-emerald-500" };
    };

    const strength = getPasswordStrength(password);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (password !== confirmPassword) {
            setError("Las contraseñas no coinciden. Inténtalo de nuevo.");
            return;
        }

        if (password.length < 6) {
            setError("La contraseña debe tener al menos 6 caracteres.");
            return;
        }

        setIsLoading(true);
        try {
            // Llamamos a un nuevo método en authApi que configuraremos enseguida
            await authApi.setupPassword(email, password);
            toast.success("¡Contraseña configurada con éxito! Iniciando sesión...");
            
            // Iniciar sesión automáticamente después de configurar
            const response = await authApi.login(email, password);
            localStorage.setItem("token", response.user.token);
            localStorage.setItem("user", JSON.stringify(response.user));

            const userRole = response.user.role.toLowerCase();
            navigate(userRole === "student" ? "/app" : userRole === "teacher" ? "/docente" : "/admin");

        } catch (err: any) {
            let errorMsg = "Error al configurar la contraseña.";
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

    if (!email) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
                <p className="text-muted-foreground mb-4">Parámetros inválidos.</p>
                <Button onClick={() => navigate("/")} variant="outline">Volver al inicio</Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background bg-mesh flex items-center justify-center p-6 sm:p-10 relative overflow-hidden">
            <div className="absolute top-10 right-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-10 left-10 w-72 h-72 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
            
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="w-full max-w-md bg-card border border-border/80 p-8 sm:p-10 rounded-xl shadow-lg relative z-10"
            >
                <div className="flex justify-center mb-6">
                    <span className="grid place-items-center w-14 h-14 rounded-full bg-primary/10 text-primary">
                        <ShieldCheck className="w-8 h-8" />
                    </span>
                </div>

                <h2 className="font-display text-2xl font-bold mb-2 tracking-tight text-center">Configura tu contraseña</h2>
                <p className="text-muted-foreground text-sm mb-6 text-center">
                    Hola <span className="font-semibold text-foreground">{email}</span>. Este es tu primer inicio de sesión. Por seguridad, debes establecer tu contraseña permanente.
                </p>

                {error && (
                    <div className="mb-5 p-3.5 text-sm text-destructive bg-destructive/5 border border-destructive/15 rounded-lg text-center font-medium">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1.5 text-left">
                        <Label className="font-semibold text-xs text-foreground/80">Nueva contraseña</Label>
                        <Input
                            type="password"
                            required
                            placeholder="Mínimo 6 caracteres"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="h-11 rounded-lg border-input bg-background/50 focus-visible:ring-primary/30 text-sm"
                        />
                        {password && (
                            <div className="mt-1.5 space-y-1">
                                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                    <div 
                                        className={cn("h-full transition-all duration-300", strength.color)}
                                        style={{ width: `${(strength.score / 5) * 100}%` }}
                                    />
                                </div>
                                <span className={cn("text-[10px] font-bold block text-left", strength.text)}>
                                    Fuerza: {strength.label}
                                </span>
                            </div>
                        )}
                    </div>
                    <div className="space-y-1.5 text-left">
                        <Label className="font-semibold text-xs text-foreground/80">Confirmar contraseña</Label>
                        <Input
                            type="password"
                            required
                            placeholder="Repite la contraseña"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="h-11 rounded-lg border-input bg-background/50 focus-visible:ring-primary/30 text-sm"
                        />
                    </div>
                    <div className="flex items-start gap-2 pt-2">
                        <input 
                            type="checkbox" 
                            id="terms" 
                            checked={termsAccepted}
                            onChange={(e) => setTermsAccepted(e.target.checked)}
                            className="mt-1 w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                            required
                        />
                        <Label htmlFor="terms" className="text-xs text-muted-foreground leading-relaxed select-none cursor-pointer">
                            Doy mi consentimiento libre, previo e informado para que la información recolectada (incluyendo registros de acceso, notas, respuestas escritas y grabaciones de voz) sea tratada de forma confidencial y utilizada con fines de estudio, análisis de rendimiento e investigación académica institucional.
                        </Label>
                    </div>
                    <Button
                        type="submit"
                        disabled={isLoading || !termsAccepted}
                        className="w-full h-11 rounded-lg bg-primary hover:bg-primary/95 text-primary-foreground font-semibold mt-6 shadow-sm transition-all flex items-center justify-center gap-1.5"
                    >
                        {isLoading ? "Guardando..." : "Guardar y Entrar"}
                        {!isLoading && <ArrowRight className="w-4 h-4" />}
                    </Button>
                </form>
            </motion.div>
        </div>
    );
}
