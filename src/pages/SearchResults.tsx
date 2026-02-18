import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Search, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import {
  search,
  groupByType,
  getTypeLabel,
  type SearchResult,
  type ResultType,
} from "@/lib/search";

function SearchResults() {
  const { t, i18n } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const q = searchParams.get("q") ?? "";

  const [query, setQuery] = useState(q);
  const [results, setResults] = useState<Map<ResultType, SearchResult[]>>(
    new Map()
  );
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  const lang = i18n.language;

  // Full search for results page
  useEffect(() => {
    if (!q || q.trim().length < 2) {
      setResults(new Map());
      setTotalCount(0);
      return;
    }
    setLoading(true);
    search(q).then((found) => {
      setResults(groupByType(found));
      setTotalCount(found.length);
      setLoading(false);
    });
  }, [q]);

  // Autocomplete suggestions
  const doSuggest = useCallback(async (value: string) => {
    if (value.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    const found = await search(value, 10);
    setSuggestions(found);
    setShowSuggestions(found.length > 0);
  }, []);

  const handleInputChange = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSuggest(value), 300);
  };

  const submitSearch = (value: string) => {
    setShowSuggestions(false);
    navigate(`/search?q=${encodeURIComponent(value.trim())}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      submitSearch(query);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="min-h-svh w-full">
      {/* Search header */}
      <div className="sticky top-0 z-20 border-b bg-background px-6 py-4">
        <div className="mx-auto flex max-w-4xl items-center gap-4">
          <h1
            className="cursor-pointer text-2xl font-bold"
            onClick={() => navigate("/")}
          >
            {t("app.title")}
          </h1>

          <div ref={containerRef} className="relative flex-1">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              value={query}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              placeholder={t("search.placeholder")}
              className="h-11 rounded-full border pl-11 pr-4 shadow-sm focus-visible:shadow-md focus-visible:ring-0 focus-visible:border-primary"
            />

            {showSuggestions && (
              <div className="absolute top-full left-0 z-10 mt-1 w-full overflow-hidden rounded-xl border bg-popover shadow-lg">
                <ul className="max-h-72 overflow-y-auto py-1">
                  {suggestions.map((r) => (
                    <li
                      key={`${r.type}-${r.pcode}`}
                      className="flex cursor-pointer items-center gap-3 px-4 py-2 hover:bg-accent"
                      onClick={() => {
                        const name =
                          lang === "mm" ? r.name_mm : r.name_en;
                        setQuery(name);
                        submitSearch(name);
                      }}
                    >
                      <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      <span className="truncate text-sm">
                        {lang === "mm" ? r.name_mm : r.name_en}
                      </span>
                      <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                        {getTypeLabel(r.type, lang)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="mx-auto max-w-4xl px-6 py-6">
        {loading && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>{t("search.loading")}</span>
          </div>
        )}

        {!loading && q && totalCount === 0 && (
          <p className="text-muted-foreground">{t("search.noResults")}</p>
        )}

        {!loading && totalCount > 0 && (
          <p className="mb-6 text-sm text-muted-foreground">
            {t("search.resultCount", { count: totalCount })}
          </p>
        )}

        {!loading &&
          Array.from(results.entries()).map(([type, items]) => (
            <div key={type} className="mb-8">
              <h2 className="mb-3 border-b pb-2 text-lg font-semibold">
                {getTypeLabel(type, lang)}
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ({items.length})
                </span>
              </h2>
              <ul className="space-y-1">
                {items.map((r) => (
                  <li
                    key={r.pcode}
                    className="flex cursor-pointer items-baseline gap-3 rounded-lg px-3 py-2.5 hover:bg-accent"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">
                        {lang === "mm" ? r.name_mm : r.name_en}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {lang === "mm" ? r.name_en : r.name_mm}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {r.pcode}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
      </div>
    </div>
  );
}

export default SearchResults;
