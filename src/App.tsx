import { Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function App() {
  const { t, i18n } = useTranslation();

  return (
    <div className="flex min-h-svh w-full items-center justify-center px-6">
      <div className="flex w-full max-w-3xl flex-col items-center gap-8">
        <h1 className="text-5xl font-bold">{t("app.title")}</h1>

        <div className="relative w-full max-w-3xl">
          <Search className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder={t("search.placeholder")}
            className="h-14 rounded-full border-2 pl-14 pr-6 text-lg shadow-md transition-shadow focus-visible:shadow-lg focus-visible:ring-0 focus-visible:border-primary hover:shadow-lg"
          />
        </div>

        <div className="flex gap-2">
          <Button
            variant={i18n.language === "en" ? "default" : "outline"}
            size="sm"
            onClick={() => i18n.changeLanguage("en")}
          >
            {t("language.en")}
          </Button>
          <Button
            variant={i18n.language === "mm" ? "default" : "outline"}
            size="sm"
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
