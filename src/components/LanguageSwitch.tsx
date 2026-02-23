import { useTranslation } from "react-i18next";

export function LanguageSwitch() {
  const { i18n } = useTranslation();
  const isEn = i18n.language !== "mm";

  return (
    <button
      onClick={() => i18n.changeLanguage(isEn ? "mm" : "en")}
      className="rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
    >
      {isEn ? "မြန်မာ" : "EN"}
    </button>
  );
}
