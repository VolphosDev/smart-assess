import { AriaSvg } from "@/components/Aria";
import { cn } from "@/lib/utils";

interface AriaAcompanaProps {
    className?: string;
}

export function AriaAcompana({ className }: AriaAcompanaProps) {
    return (
        <span
            aria-hidden
            className={cn(
                "shrink-0 grid place-items-center rounded-full bg-primary/5 border border-primary/10 w-9 h-9 overflow-hidden",
                className
            )}
        >
            <AriaSvg estado="idle" recorte="cara" className="w-7 h-7 translate-y-0.5 opacity-80" />
        </span>
    );
}
