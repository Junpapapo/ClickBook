import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/shared/ThemeContext";
import { useLang } from "@/shared/LanguageContext";

export default function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const { t } = useLang();

  return (
    <button
      onClick={toggle}
      title={theme === "dark" ? t("themeToggleLight") : t("themeToggleDark")}
      className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-surface-800 rounded-lg transition-colors"
    >
      {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
    </button>
  );
}
