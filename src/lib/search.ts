export type ResultType =
  | "state_region"
  | "district"
  | "township"
  | "town"
  | "ward"
  | "village_tract"
  | "village";

export interface SearchResult {
  pcode: string;
  name_en: string;
  name_mm: string;
  type: ResultType;
}

const typeLabels: Record<ResultType, { en: string; mm: string }> = {
  state_region: { en: "State/Region", mm: "ပြည်နယ်/တိုင်း" },
  district: { en: "District", mm: "ခရိုင်" },
  township: { en: "Township", mm: "မြို့နယ်" },
  town: { en: "Town", mm: "မြို့" },
  ward: { en: "Ward", mm: "ရပ်ကွက်" },
  village_tract: { en: "Village Tract", mm: "ကျေးရွာအုပ်စု" },
  village: { en: "Village", mm: "ကျေးရွာ" },
};

export function getTypeLabel(type: ResultType, lang: string): string {
  return typeLabels[type]?.[lang === "mm" ? "mm" : "en"] ?? type;
}

interface RawEntry {
  pcode: string;
  name_en: string;
  name_mm: string;
}

interface DataSet {
  type: ResultType;
  loader: () => Promise<{ default: RawEntry[] }>;
}

const datasets: DataSet[] = [
  { type: "state_region", loader: () => import("@/data/state_region.json") },
  { type: "district", loader: () => import("@/data/district.json") },
  { type: "township", loader: () => import("@/data/township.json") },
  { type: "town", loader: () => import("@/data/town.json") as Promise<{ default: RawEntry[] }> },
  { type: "ward", loader: () => import("@/data/ward.json") },
  { type: "village_tract", loader: () => import("@/data/villagetract.json") },
  { type: "village", loader: () => import("@/data/village.json") as Promise<{ default: RawEntry[] }> },
];

let cachedData: { data: RawEntry[]; type: ResultType }[] | null = null;

async function loadAll(): Promise<{ data: RawEntry[]; type: ResultType }[]> {
  if (cachedData) return cachedData;
  const loaded = await Promise.all(
    datasets.map(async ({ type, loader }) => {
      const mod = await loader();
      return { data: mod.default, type };
    })
  );
  cachedData = loaded;
  return loaded;
}

export async function search(query: string, limit = 20): Promise<SearchResult[]> {
  if (!query || query.trim().length === 0) return [];

  const q = query.toLowerCase().trim();
  const all = await loadAll();
  const results: SearchResult[] = [];

  for (const { data, type } of all) {
    if (results.length >= limit) break;

    for (const entry of data) {
      if (results.length >= limit) break;

      if (
        entry.name_en?.toLowerCase().includes(q) ||
        entry.name_mm?.includes(query.trim())
      ) {
        results.push({
          pcode: entry.pcode,
          name_en: entry.name_en,
          name_mm: entry.name_mm,
          type,
        });
      }
    }
  }

  return results;
}
