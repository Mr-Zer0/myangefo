import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Loader2, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  getDetail,
  getChildren,
  getTypeLabel,
  type DetailResult,
  type ChildGroup,
  type ResultType,
} from "@/lib/search";

function DetailPage() {
  const { t, i18n } = useTranslation();
  const { type, pcode } = useParams<{ type: string; pcode: string }>();
  const navigate = useNavigate();

  const [detail, setDetail] = useState<DetailResult | null>(null);
  const [children, setChildren] = useState<ChildGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const lang = i18n.language === "mm" ? "mm" : "en";

  useEffect(() => {
    if (!type || !pcode) return;

    setLoading(true);
    setNotFound(false);

    Promise.all([
      getDetail(type as ResultType, pcode),
      getChildren(type as ResultType, pcode),
    ]).then(([d, c]) => {
      if (!d) {
        setNotFound(true);
      } else {
        setDetail(d);
        setChildren(c);
      }
      setLoading(false);
    });
  }, [type, pcode]);

  if (loading) {
    return (
      <div className="min-h-svh w-full px-6">
        <div className="mx-auto max-w-3xl pt-10">
          <h1
            className="cursor-pointer text-3xl font-bold"
            onClick={() => navigate("/")}
          >
            {t("app.title")}
          </h1>
          <div className="mt-12 flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>{t("detail.loading")}</span>
          </div>
        </div>
      </div>
    );
  }

  if (notFound || !detail) {
    return (
      <div className="min-h-svh w-full px-6">
        <div className="mx-auto max-w-3xl pt-10">
          <h1
            className="cursor-pointer text-3xl font-bold"
            onClick={() => navigate("/")}
          >
            {t("app.title")}
          </h1>
          <p className="mt-12 text-muted-foreground">{t("detail.notFound")}</p>
        </div>
      </div>
    );
  }

  const breadcrumbNames = lang === "mm" ? detail.breadcrumb_mm : detail.breadcrumb_en;
  const breadcrumbLinks = detail.breadcrumb_links;

  return (
    <div className="min-h-svh w-full px-6">
      <div className="mx-auto max-w-3xl pt-10 pb-16">
        <h1
          className="cursor-pointer text-3xl font-bold"
          onClick={() => navigate("/")}
        >
          {t("app.title")}
        </h1>

        {/* Breadcrumb */}
        <nav className="mt-6 flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
          {breadcrumbNames.map((name, i) => {
            const link = breadcrumbLinks[i];
            const isLast = i === breadcrumbNames.length - 1;
            return (
              <span key={link.pcode} className="flex items-center gap-1">
                {i > 0 && <ChevronRight className="h-3 w-3" />}
                {isLast ? (
                  <span className="text-foreground font-medium">{name}</span>
                ) : (
                  <Link
                    to={`/detail/${link.type}/${link.pcode}`}
                    className="hover:text-foreground hover:underline"
                  >
                    {name}
                  </Link>
                )}
              </span>
            );
          })}
        </nav>

        {/* Heading */}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <h2 className="text-2xl font-bold">
            {detail.name_en}
            {detail.name_mm && (
              <span className="ml-2 text-xl font-normal text-muted-foreground">
                ({detail.name_mm})
              </span>
            )}
          </h2>
          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            {getTypeLabel(detail.type, lang)}
          </span>
        </div>

        {/* Info card */}
        <div className="mt-6 rounded-xl border bg-card p-6">
          <h3 className="mb-4 text-lg font-semibold">{t("detail.info")}</h3>
          <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 text-sm">
            <dt className="text-muted-foreground">{t("detail.pcode")}</dt>
            <dd className="font-mono">{detail.pcode}</dd>

            <dt className="text-muted-foreground">{t("detail.nameEn")}</dt>
            <dd>{detail.name_en}</dd>

            <dt className="text-muted-foreground">{t("detail.nameMm")}</dt>
            <dd>{detail.name_mm}</dd>

            {detail.latitude != null && detail.longitude != null && (
              <>
                <dt className="text-muted-foreground">{t("detail.coordinates")}</dt>
                <dd className="font-mono">
                  {detail.latitude}, {detail.longitude}
                </dd>
              </>
            )}

            {detail.local_name_en && (
              <>
                <dt className="text-muted-foreground">{t("detail.localNameEn")}</dt>
                <dd>{detail.local_name_en}</dd>
              </>
            )}

            {detail.local_name_mm && (
              <>
                <dt className="text-muted-foreground">{t("detail.localNameMm")}</dt>
                <dd>{detail.local_name_mm}</dd>
              </>
            )}
          </dl>
        </div>

        {/* Children */}
        {children.length > 0 && (
          <div className="mt-8">
            <h3 className="mb-4 text-lg font-semibold">{t("detail.children")}</h3>
            {children.map((group) => (
              <div key={group.type} className="mb-6">
                <h4 className="mb-2 border-b pb-2 text-base font-medium">
                  {getTypeLabel(group.type, lang)}
                  <span className="ml-2 text-sm font-normal text-muted-foreground">
                    ({group.items.length})
                  </span>
                </h4>
                <ul className="space-y-1">
                  {group.items.map((item) => (
                    <li
                      key={item.pcode}
                      className="cursor-pointer rounded-lg px-3 py-2.5 hover:bg-accent"
                      onClick={() =>
                        navigate(`/detail/${item.type}/${item.pcode}`)
                      }
                    >
                      <p className="font-medium">
                        {lang === "mm" ? item.name_mm : item.name_en}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default DetailPage;
