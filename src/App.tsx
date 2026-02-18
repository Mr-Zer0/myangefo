import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { search, getTypeLabel, detectLang, type SearchResult } from "@/lib/search";

function App() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  const doSearch = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setResults([]);
      setShowResults(false);
      return;
    }
    const found = await search(q, 10);
    setResults(found);
    setShowResults(found.length > 0);
  }, []);

  const handleChange = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(value), 300);
  };

  const submitSearch = () => {
    if (query.trim().length < 2) return;
    setShowResults(false);
    navigate(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") submitSearch();
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const lang = detectLang(query);

  return (
    <div className="flex min-h-svh w-full items-center justify-center px-6">
      <div className="flex w-full max-w-3xl flex-col items-center gap-8">
        <h1 className="text-5xl font-bold">{t("app.title")}</h1>

        <div ref={containerRef} className="relative w-full">
          <Search className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            value={query}
            onChange={(e) => handleChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => results.length > 0 && setShowResults(true)}
            placeholder={t("search.placeholder")}
            className="h-14 rounded-full border-2 pl-14 pr-6 text-lg shadow-md transition-shadow focus-visible:shadow-lg focus-visible:ring-0 focus-visible:border-primary hover:shadow-lg"
          />

          {showResults && (
            <div className="absolute top-full left-0 z-10 mt-2 w-full overflow-hidden rounded-xl border bg-popover shadow-lg">
              <ul className="max-h-96 overflow-y-auto py-2">
                {results.map((r) => (
                  <li
                    key={`${r.type}-${r.pcode}`}
                    className="flex cursor-pointer items-center gap-3 px-5 py-3 hover:bg-accent"
                    onClick={() => {
                      const name = lang === "mm" ? r.name_mm : r.name_en;
                      setQuery(name);
                      setShowResults(false);
                      navigate(`/search?q=${encodeURIComponent(name)}`);
                    }}
                  >
                    <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-muted-foreground">
                        {(lang === "mm" ? r.breadcrumb_mm : r.breadcrumb_en).join(" / ")}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
                      {getTypeLabel(r.type, lang)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <Button onClick={submitSearch}>{t("search.button")}</Button>
          <Button variant="outline">{t("search.advanced")}</Button>
        </div>
      </div>
    </div>
  );
}

export default App;
