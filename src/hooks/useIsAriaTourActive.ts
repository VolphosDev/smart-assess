import { useState, useEffect } from "react";

export function useIsAriaTourActive(): boolean {
  const [active, setActive] = useState<boolean>(
    () => localStorage.getItem("aria_tour_active") === "true"
  );

  useEffect(() => {
    const handleStorageChange = () => {
      setActive(localStorage.getItem("aria_tour_active") === "true");
    };

    window.addEventListener("aria_tour_change", handleStorageChange);
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("aria_tour_change", handleStorageChange);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  return active;
}

export function useAriaTourStep(): string | null {
  const [stepId, setStepId] = useState<string | null>(
    () => localStorage.getItem("aria_tour_step")
  );

  useEffect(() => {
    const handleStorageChange = () => {
      setStepId(localStorage.getItem("aria_tour_step"));
    };

    window.addEventListener("aria_tour_change", handleStorageChange);
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("aria_tour_change", handleStorageChange);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  return stepId;
}
