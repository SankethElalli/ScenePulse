import { Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/theme";

export function ThemeToggle() {
  const { resolved, setTheme } = useTheme();
  const isDark = resolved === "dark";

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="group h-11 w-11 rounded-2xl glass border border-white/10 transition-all duration-200 hover:border-primary/50 hover:text-primary active:scale-90"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? (
        <Moon className="h-5 w-5 transition-transform duration-300 group-hover:-rotate-12" />
      ) : (
        <Sun className="h-5 w-5 transition-transform duration-300 group-hover:rotate-45" />
      )}
    </Button>
  );
}
