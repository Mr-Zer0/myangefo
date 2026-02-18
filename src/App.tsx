import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

function App() {
  const { t, i18n } = useTranslation();

  return (
    <div className="flex min-h-svh items-center justify-center">
      <div className="flex flex-col items-center gap-6">
        <h1 className="text-4xl font-bold">{t("app.title")}</h1>
        <p className="text-muted-foreground">{t("app.description")}</p>

        <div className="flex gap-2">
          <Button
            variant={i18n.language === "en" ? "default" : "outline"}
            onClick={() => i18n.changeLanguage("en")}
          >
            {t("language.en")}
          </Button>
          <Button
            variant={i18n.language === "mm" ? "default" : "outline"}
            onClick={() => i18n.changeLanguage("mm")}
          >
            {t("language.mm")}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default App;
