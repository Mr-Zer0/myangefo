import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Loader2, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Doughnut } from "react-chartjs-2";
import {
  getDetail,
  getChildren,
  getDemography,
  getEconomy,
  getTypeLabel,
  type DetailResult,
  type ChildGroup,
  type DemographyData,
  type EconomyData,
  type ResultType,
} from "@/lib/search";
import mmSvg from "@/assets/mm.svg";
import { LanguageSwitch } from "@/components/LanguageSwitch";

ChartJS.register(ArcElement, Tooltip, Legend);

function DetailPage() {
  const { t, i18n } = useTranslation();
  const { type, pcode } = useParams<{ type: string; pcode: string }>();
  const navigate = useNavigate();

  const [detail, setDetail] = useState<DetailResult | null>(null);
  const [children, setChildren] = useState<ChildGroup[]>([]);
  const [demography, setDemography] = useState<DemographyData | null>(null);
  const [economy, setEconomy] = useState<EconomyData | null>(null);
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
      getDemography(pcode),
      getEconomy(pcode),
    ]).then(([d, c, demo, econ]) => {
      if (!d) {
        setNotFound(true);
      } else {
        setDetail(d);
        setChildren(c);
        setDemography(demo);
        setEconomy(econ);
      }
      setLoading(false);
    });
  }, [type, pcode]);

  if (loading) {
    return (
      <div className="min-h-svh w-full px-6">
        <div className="mx-auto max-w-3xl pt-10">
          <div className="flex items-center justify-between">
            <h1
              className="cursor-pointer text-3xl font-bold"
              onClick={() => navigate("/")}
            >
              {t("app.title")}
            </h1>
            <LanguageSwitch />
          </div>
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
          <div className="flex items-center justify-between">
            <h1
              className="cursor-pointer text-3xl font-bold"
              onClick={() => navigate("/")}
            >
              {t("app.title")}
            </h1>
            <LanguageSwitch />
          </div>
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
        <div className="flex items-center justify-between">
          <h1
            className="cursor-pointer text-3xl font-bold"
            onClick={() => navigate("/")}
          >
            {t("app.title")}
          </h1>
          <LanguageSwitch />
        </div>

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

        {/* Population & Demographics */}
        {demography && (
          <div className="mt-6 rounded-xl border bg-card p-6">
            <h3 className="mb-4 text-lg font-semibold">
              {t("detail.population")}
              {demography.census_year != null && (
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ({t("detail.censusYear")}: {demography.census_year})
                </span>
              )}
            </h3>

            {/* Population doughnut chart + legend */}
            {(() => {
              const male = demography.population_male ?? 0;
              const female = demography.population_female ?? 0;
              const total = demography.population_total ?? male + female;
              const malePct = total > 0 ? (male / total) * 100 : 50;

              return (
                <div className="mb-6 flex flex-col items-center gap-6 sm:flex-row sm:justify-center">
                  <div className="shrink-0" style={{ width: 320 }}>
                    <Doughnut
                      data={{
                        labels: [t("detail.male"), t("detail.female")],
                        datasets: [{
                          data: [male, female],
                          backgroundColor: ["#3b82f6", "#ec4899"],
                          borderWidth: 0,
                        }],
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: true,
                        cutout: "50%",
                        plugins: {
                          legend: { display: false },
                          tooltip: {
                            callbacks: {
                              label: (ctx) => {
                                const val = ctx.parsed;
                                const pct = total > 0 ? ((val / total) * 100).toFixed(1) : "0.0";
                                return `${ctx.label}: ${val.toLocaleString()} (${pct}%)`;
                              },
                            },
                          },
                        },
                      }}
                    />
                  </div>

                  {/* Legend */}
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      <span className="inline-block h-3 w-3 rounded-full bg-blue-500" />
                      <div>
                        <p className="text-sm text-muted-foreground">{t("detail.male")}</p>
                        <p className="text-lg font-bold">
                          {male.toLocaleString()}
                          <span className="ml-1 text-sm font-normal text-muted-foreground">
                            ({malePct.toFixed(1)}%)
                          </span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="inline-block h-3 w-3 rounded-full bg-pink-500" />
                      <div>
                        <p className="text-sm text-muted-foreground">{t("detail.female")}</p>
                        <p className="text-lg font-bold">
                          {female.toLocaleString()}
                          <span className="ml-1 text-sm font-normal text-muted-foreground">
                            ({(100 - malePct).toFixed(1)}%)
                          </span>
                        </p>
                      </div>
                    </div>
                    <div className="border-t pt-2">
                      <p className="text-sm text-muted-foreground">{t("detail.total")}</p>
                      <p className="text-xl font-bold">{total.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Demographic stats grid */}
            <h4 className="mb-3 text-sm font-semibold text-muted-foreground">
              {t("detail.demographicStats")}
            </h4>
            <div className="mb-6 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
              {[
                { label: t("detail.households"), value: demography.num_households?.toLocaleString() },
                { label: t("detail.avgHouseholdSize"), value: demography.avg_household_size?.toFixed(1) },
                { label: t("detail.sexRatio"), value: demography.sex_ratio?.toFixed(1) },
                { label: t("detail.density"), value: demography.population_density?.toFixed(1) },
                { label: t("detail.urbanPct"), value: demography.urban_population_pct != null ? `${demography.urban_population_pct.toFixed(1)}%` : null },
                { label: t("detail.growthRate"), value: demography.annual_growth_rate != null ? `${demography.annual_growth_rate.toFixed(2)}%` : null },
                { label: t("detail.fertilityRate"), value: demography.total_fertility_rate?.toFixed(2) },
                { label: t("detail.birthRate"), value: demography.crude_birth_rate?.toFixed(1) },
                { label: t("detail.deathRate"), value: demography.crude_death_rate?.toFixed(1) },
                { label: t("detail.lifeExpectancy"), value: demography.life_expectancy_total?.toFixed(1) },
                { label: t("detail.lifeExpectancyMale"), value: demography.life_expectancy_male?.toFixed(1) },
                { label: t("detail.lifeExpectancyFemale"), value: demography.life_expectancy_female?.toFixed(1) },
              ]
                .filter((s) => s.value != null)
                .map((s) => (
                  <div key={s.label} className="rounded-lg border px-3 py-2">
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                    <p className="font-semibold">{s.value}</p>
                  </div>
                ))}
            </div>

            {/* Admin units (for state_region level) */}
            {(demography.num_districts != null || demography.num_townships != null) && (
              <>
                <h4 className="mb-3 text-sm font-semibold text-muted-foreground">
                  {t("detail.adminUnits")}
                </h4>
                <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
                  {[
                    { label: t("detail.districts"), value: demography.num_districts },
                    { label: t("detail.townships"), value: demography.num_townships },
                    { label: t("detail.wards"), value: demography.num_wards },
                    { label: t("detail.villageTracts"), value: demography.num_village_tracts },
                    { label: t("detail.villages"), value: demography.num_villages },
                  ]
                    .filter((s) => s.value != null)
                    .map((s) => (
                      <div key={s.label} className="rounded-lg border px-3 py-2">
                        <p className="text-xs text-muted-foreground">{s.label}</p>
                        <p className="font-semibold">{s.value?.toLocaleString()}</p>
                      </div>
                    ))}
                </div>
              </>
            )}

            {/* Religion breakdown */}
            {demography.population_by_religion && (() => {
              const entries = Object.entries(demography.population_by_religion)
                .sort((a, b) => b[1] - a[1]);
              const total = entries.reduce((sum, [, v]) => sum + v, 0);
              const colors = ["#f59e0b", "#3b82f6", "#10b981", "#8b5cf6", "#ef4444", "#6b7280"];

              return (
                <>
                  <h4 className="mt-6 mb-3 text-sm font-semibold text-muted-foreground">
                    {t("detail.religion")}
                  </h4>
                  <div className="flex flex-col items-center gap-4">
                    <div style={{ width: 320 }}>
                      <Doughnut
                        data={{
                          labels: entries.map(([name]) => name),
                          datasets: [{
                            data: entries.map(([, v]) => v),
                            backgroundColor: entries.map((_, i) => colors[i % colors.length]),
                            borderWidth: 0,
                          }],
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: true,
                          cutout: "50%",
                          plugins: {
                            legend: { display: false },
                            tooltip: {
                              callbacks: {
                                label: (ctx) => {
                                  const val = ctx.parsed;
                                  const pct = total > 0 ? ((val / total) * 100).toFixed(1) : "0.0";
                                  return `${ctx.label}: ${val.toLocaleString()} (${pct}%)`;
                                },
                              },
                            },
                          },
                        }}
                      />
                    </div>
                    <div className="flex flex-wrap justify-center gap-x-4 gap-y-2">
                      {entries.map(([name, value], i) => (
                        <div key={name} className="flex items-center gap-2">
                          <span
                            className="inline-block h-3 w-3 shrink-0 rounded-full"
                            style={{ backgroundColor: colors[i % colors.length] }}
                          />
                          <span className="text-sm">
                            {name}
                            <span className="ml-1 text-xs text-muted-foreground">
                              ({(total > 0 ? (value / total) * 100 : 0).toFixed(1)}%)
                            </span>
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        )}

        {/* Employment & Activity Status */}
        {economy?.population_by_activity_status && (() => {
          const raw = economy.population_by_activity_status;
          // Only show "- Total" entries, strip the suffix for display
          const entries = Object.entries(raw)
            .filter(([k]) => k.endsWith(" - Total"))
            .map(([k, v]) => [k.replace(" - Total", ""), v] as [string, number])
            .sort((a, b) => b[1] - a[1]);
          if (entries.length === 0) return null;

          const total = entries.reduce((sum, [, v]) => sum + v, 0);
          const colors = [
            "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444",
            "#06b6d4", "#f97316", "#ec4899", "#14b8a6", "#a855f7",
            "#64748b", "#84cc16",
          ];

          return (
            <div className="mt-6 rounded-xl border bg-card p-6">
              <h3 className="mb-4 text-lg font-semibold">
                {t("detail.activityStatus")}
              </h3>
              <div className="flex flex-col items-center gap-4">
                <div style={{ width: 320 }}>
                  <Doughnut
                    data={{
                      labels: entries.map(([name]) => name),
                      datasets: [{
                        data: entries.map(([, v]) => v),
                        backgroundColor: entries.map((_, i) => colors[i % colors.length]),
                        borderWidth: 0,
                      }],
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: true,
                      cutout: "50%",
                      plugins: {
                        legend: { display: false },
                        tooltip: {
                          callbacks: {
                            label: (ctx) => {
                              const val = ctx.parsed;
                              const pct = total > 0 ? ((val / total) * 100).toFixed(1) : "0.0";
                              return `${ctx.label}: ${val.toLocaleString()} (${pct}%)`;
                            },
                          },
                        },
                      },
                    }}
                  />
                </div>
                <div className="flex flex-wrap justify-center gap-x-4 gap-y-2">
                  {entries.map(([name, value], i) => (
                    <div key={name} className="flex items-center gap-2">
                      <span
                        className="inline-block h-3 w-3 shrink-0 rounded-full"
                        style={{ backgroundColor: colors[i % colors.length] }}
                      />
                      <span className="text-sm">
                        {name}
                        <span className="ml-1 text-xs text-muted-foreground">
                          ({(total > 0 ? (value / total) * 100 : 0).toFixed(1)}%)
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })()}

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
        {/* Data credit */}
        <p className="mt-10 text-center text-xs text-muted-foreground">
          {t("detail.dataCredit")}{" "}
          <a
            href="https://themimu.info"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            MIMU
          </a>
        </p>
      </div>
    </div>
  );
}

export default DetailPage;
