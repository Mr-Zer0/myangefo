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
  breadcrumb_en: string[];
  breadcrumb_mm: string[];
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
  sr_pcode?: string;
  district_pcode?: string;
  township_pcode?: string;
  town_pcode?: string;
  village_tract_pcode?: string;
  latitude?: number;
  longitude?: number;
  local_name_en?: string | null;
  local_name_mm?: string | null;
}

export interface BreadcrumbLink {
  type: ResultType;
  pcode: string;
}

export interface DetailResult extends SearchResult {
  breadcrumb_links: BreadcrumbLink[];
  latitude?: number;
  longitude?: number;
  local_name_en?: string | null;
  local_name_mm?: string | null;
}

export interface ChildGroup {
  type: ResultType;
  items: SearchResult[];
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

export const TYPE_ORDER: ResultType[] = [
  "state_region",
  "district",
  "township",
  "town",
  "ward",
  "village_tract",
  "village",
];

interface NamePair {
  en: string;
  mm: string;
}

// Lookup maps: pcode -> { en, mm }
let lookups: {
  stateRegion: Map<string, NamePair>;
  district: Map<string, NamePair>;
  township: Map<string, NamePair>;
  town: Map<string, NamePair>;
  villageTract: Map<string, NamePair>;
} | null = null;

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

  // Build lookup maps
  const stateRegion = new Map<string, NamePair>();
  const district = new Map<string, NamePair>();
  const township = new Map<string, NamePair>();
  const town = new Map<string, NamePair>();
  const villageTract = new Map<string, NamePair>();

  for (const { data, type } of loaded) {
    for (const entry of data) {
      const pair: NamePair = { en: entry.name_en, mm: entry.name_mm };
      switch (type) {
        case "state_region": stateRegion.set(entry.pcode, pair); break;
        case "district": district.set(entry.pcode, pair); break;
        case "township": township.set(entry.pcode, pair); break;
        case "town": town.set(entry.pcode, pair); break;
        case "village_tract": villageTract.set(entry.pcode, pair); break;
      }
    }
  }

  lookups = { stateRegion, district, township, town, villageTract };
  return loaded;
}

function buildBreadcrumb(entry: RawEntry, type: ResultType): { en: string[]; mm: string[] } {
  if (!lookups) return { en: [], mm: [] };

  const en: string[] = [];
  const mm: string[] = [];

  const push = (map: Map<string, NamePair>, pcode?: string) => {
    if (!pcode) return;
    const pair = map.get(pcode);
    if (pair) {
      en.push(pair.en);
      mm.push(pair.mm);
    }
  };

  if (type !== "state_region") push(lookups.stateRegion, entry.sr_pcode);
  if (type !== "state_region" && type !== "district") push(lookups.district, entry.district_pcode);
  if (type !== "state_region" && type !== "district" && type !== "township") push(lookups.township, entry.township_pcode);
  if (type === "ward") push(lookups.town, entry.town_pcode);
  if (type === "village") push(lookups.villageTract, entry.village_tract_pcode);

  // Append self
  en.push(entry.name_en);
  mm.push(entry.name_mm);

  return { en, mm };
}

export async function search(query: string, limit?: number): Promise<SearchResult[]> {
  if (!query || query.trim().length === 0) return [];

  const q = query.toLowerCase().trim();
  const all = await loadAll();
  const results: SearchResult[] = [];

  for (const { data, type } of all) {
    if (limit && results.length >= limit) break;

    for (const entry of data) {
      if (limit && results.length >= limit) break;

      if (
        entry.name_en?.toLowerCase().includes(q) ||
        entry.name_mm?.includes(query.trim())
      ) {
        const bc = buildBreadcrumb(entry, type);
        results.push({
          pcode: entry.pcode,
          name_en: entry.name_en,
          name_mm: entry.name_mm,
          type,
          breadcrumb_en: bc.en,
          breadcrumb_mm: bc.mm,
        });
      }
    }
  }

  return results;
}

export function detectLang(query: string): "en" | "mm" {
  return /[\u1000-\u109F]/.test(query) ? "mm" : "en";
}

export function groupByType(results: SearchResult[]): Map<ResultType, SearchResult[]> {
  const grouped = new Map<ResultType, SearchResult[]>();
  for (const type of TYPE_ORDER) {
    const items = results.filter((r) => r.type === type);
    if (items.length > 0) {
      grouped.set(type, items);
    }
  }
  return grouped;
}

function buildBreadcrumbLinks(entry: RawEntry, type: ResultType): BreadcrumbLink[] {
  const links: BreadcrumbLink[] = [];

  if (type !== "state_region" && entry.sr_pcode)
    links.push({ type: "state_region", pcode: entry.sr_pcode });
  if (type !== "state_region" && type !== "district" && entry.district_pcode)
    links.push({ type: "district", pcode: entry.district_pcode });
  if (type !== "state_region" && type !== "district" && type !== "township" && entry.township_pcode)
    links.push({ type: "township", pcode: entry.township_pcode });
  if (type === "ward" && entry.town_pcode)
    links.push({ type: "town", pcode: entry.town_pcode });
  if (type === "village" && entry.village_tract_pcode)
    links.push({ type: "village_tract", pcode: entry.village_tract_pcode });

  // Self
  links.push({ type, pcode: entry.pcode });

  return links;
}

export async function getDetail(type: ResultType, pcode: string): Promise<DetailResult | null> {
  const all = await loadAll();
  const dataset = all.find((d) => d.type === type);
  if (!dataset) return null;

  const entry = dataset.data.find((e) => e.pcode === pcode);
  if (!entry) return null;

  const bc = buildBreadcrumb(entry, type);
  const bcLinks = buildBreadcrumbLinks(entry, type);

  return {
    pcode: entry.pcode,
    name_en: entry.name_en,
    name_mm: entry.name_mm,
    type,
    breadcrumb_en: bc.en,
    breadcrumb_mm: bc.mm,
    breadcrumb_links: bcLinks,
    latitude: entry.latitude,
    longitude: entry.longitude,
    local_name_en: entry.local_name_en,
    local_name_mm: entry.local_name_mm,
  };
}

const childConfig: Partial<Record<ResultType, { childType: ResultType; parentField: keyof RawEntry }[]>> = {
  state_region: [{ childType: "district", parentField: "sr_pcode" }],
  district: [{ childType: "township", parentField: "district_pcode" }],
  township: [
    { childType: "town", parentField: "township_pcode" },
    { childType: "village_tract", parentField: "township_pcode" },
  ],
  town: [{ childType: "ward", parentField: "town_pcode" }],
  village_tract: [{ childType: "village", parentField: "village_tract_pcode" }],
};

export async function getChildren(type: ResultType, pcode: string): Promise<ChildGroup[]> {
  const config = childConfig[type];
  if (!config) return [];

  const all = await loadAll();
  const groups: ChildGroup[] = [];

  for (const { childType, parentField } of config) {
    const dataset = all.find((d) => d.type === childType);
    if (!dataset) continue;

    const items: SearchResult[] = [];
    for (const entry of dataset.data) {
      if (entry[parentField] === pcode) {
        const bc = buildBreadcrumb(entry, childType);
        items.push({
          pcode: entry.pcode,
          name_en: entry.name_en,
          name_mm: entry.name_mm,
          type: childType,
          breadcrumb_en: bc.en,
          breadcrumb_mm: bc.mm,
        });
      }
    }

    if (items.length > 0) {
      groups.push({ type: childType, items });
    }
  }

  return groups;
}
