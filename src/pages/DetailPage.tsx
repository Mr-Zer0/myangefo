import { useState, useEffect, useMemo } from "react";
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
import mmSvg from "@/assets/mm.svg";

// Simple seeded RNG from a string so the same pcode always produces the same numbers
function seededRng(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0;
  }
  return () => {
    h = (h ^ (h >>> 16)) * 0x45d9f3b;
    h = (h ^ (h >>> 16)) * 0x45d9f3b;
    h = h ^ (h >>> 16);
    return (h >>> 0) / 0xffffffff;
  };
}

interface AgeGroup {
  range: string;
  male: number;
  female: number;
  total: number;
}

interface PopulationData {
  male: number;
  female: number;
  total: number;
  ageGroups: AgeGroup[];
}

const AGE_RANGES = ["0-14", "15-24", "25-39", "40-54", "55-64", "65+"];

// Rough distribution weights for age groups
const AGE_WEIGHTS = [0.25, 0.18, 0.22, 0.17, 0.10, 0.08];

// Population scale varies by entity type
const populationScale: Record<ResultType, [number, number]> = {
  state_region: [800_000, 8_000_000],
  district: [200_000, 2_000_000],
  township: [50_000, 500_000],
  town: [5_000, 150_000],
  ward: [1_000, 30_000],
  village_tract: [500, 10_000],
  village: [100, 5_000],
};

function generatePopulation(type: ResultType, pcode: string): PopulationData {
  const rng = seededRng(pcode);
  const [min, max] = populationScale[type];
  const total = Math.round(min + rng() * (max - min));

  // Male ratio between 0.46 and 0.52
  const maleRatio = 0.46 + rng() * 0.06;
  const male = Math.round(total * maleRatio);
  const female = total - male;

  const ageGroups: AgeGroup[] = AGE_RANGES.map((range, i) => {
    // Add a little randomness to the weight
    const w = AGE_WEIGHTS[i] * (0.8 + rng() * 0.4);
    const groupTotal = Math.round(total * w);
    const groupMaleRatio = 0.46 + rng() * 0.08;
    const groupMale = Math.round(groupTotal * groupMaleRatio);
    return {
      range,
      male: groupMale,
      female: groupTotal - groupMale,
      total: groupTotal,
    };
  });

  return { male, female, total, ageGroups };
}

function DetailPage() {
  const { t, i18n } = useTranslation();
  const { type, pcode } = useParams<{ type: string; pcode: string }>();
  const navigate = useNavigate();

  const [detail, setDetail] = useState<DetailResult | null>(null);
  const [children, setChildren] = useState<ChildGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const lang = i18n.language === "mm" ? "mm" : "en";

  const population = useMemo(
    () => (detail ? generatePopulation(detail.type, detail.pcode) : null),
    [detail]
  );

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
                <dd>
                  <a
                    href={`https://www.google.com/maps?q=${detail.latitude},${detail.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-primary hover:underline"
                  >
                    {detail.latitude}, {detail.longitude}
                  </a>
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

        {/* Map (dummy) */}
        <div className="mt-6 rounded-xl border bg-card p-6">
          <h3 className="mb-4 text-lg font-semibold">
            {t("detail.map")}
            <span className="ml-2 rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800">
              {t("detail.dummy")}
            </span>
          </h3>
          <div className="flex justify-center rounded-lg bg-muted/50 p-4">
            <img
              src={mmSvg}
              alt="Myanmar map"
              className="h-80 w-auto"
            />
          </div>
        </div>

        {/* Population (dummy) */}
        {population && <div className="mt-6 rounded-xl border bg-card p-6">
          <h3 className="mb-4 text-lg font-semibold">
            {t("detail.population")}
            <span className="ml-2 rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800">
              {t("detail.dummy")}
            </span>
          </h3>

          {/* Summary */}
          <div className="mb-6 grid grid-cols-3 gap-4 text-center">
            <div className="rounded-lg bg-blue-50 p-4">
              <p className="text-2xl font-bold text-blue-700">
                {population.male.toLocaleString()}
              </p>
              <p className="text-sm text-blue-600">{t("detail.male")}</p>
            </div>
            <div className="rounded-lg bg-pink-50 p-4">
              <p className="text-2xl font-bold text-pink-700">
                {population.female.toLocaleString()}
              </p>
              <p className="text-sm text-pink-600">{t("detail.female")}</p>
            </div>
            <div className="rounded-lg bg-gray-50 p-4">
              <p className="text-2xl font-bold text-gray-800">
                {population.total.toLocaleString()}
              </p>
              <p className="text-sm text-gray-600">{t("detail.total")}</p>
            </div>
          </div>

          {/* Age distribution table */}
          <h4 className="mb-3 text-sm font-semibold text-muted-foreground">
            {t("detail.ageRange")}
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 pr-4 font-medium">{t("detail.ageRange")}</th>
                  <th className="pb-2 pr-4 text-right font-medium">{t("detail.male")}</th>
                  <th className="pb-2 pr-4 text-right font-medium">{t("detail.female")}</th>
                  <th className="pb-2 text-right font-medium">{t("detail.total")}</th>
                </tr>
              </thead>
              <tbody>
                {population.ageGroups.map((ag) => (
                  <tr key={ag.range} className="border-b last:border-0">
                    <td className="py-2 pr-4 font-mono">{ag.range}</td>
                    <td className="py-2 pr-4 text-right">{ag.male.toLocaleString()}</td>
                    <td className="py-2 pr-4 text-right">{ag.female.toLocaleString()}</td>
                    <td className="py-2 text-right font-medium">{ag.total.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>}

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
