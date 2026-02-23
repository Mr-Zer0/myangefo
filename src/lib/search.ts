import type { Database } from "sql.js";
import { getDb } from "./db";

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

export const TYPE_ORDER: ResultType[] = [
  "state_region",
  "district",
  "township",
  "town",
  "ward",
  "village_tract",
  "village",
];

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

// --- Table name for the "village_tract" type is "village_tract" in DB ---

const tableForType: Record<ResultType, string> = {
  state_region: "state_region",
  district: "district",
  township: "township",
  town: "town",
  ward: "ward",
  village_tract: "village_tract",
  village: "village",
};

// --- Breadcrumb resolution via JOINs ---

interface BreadcrumbRow {
  sr_pcode?: string;
  sr_en?: string;
  sr_mm?: string;
  dist_pcode?: string;
  dist_en?: string;
  dist_mm?: string;
  ts_pcode?: string;
  ts_en?: string;
  ts_mm?: string;
  town_pcode?: string;
  town_en?: string;
  town_mm?: string;
  vt_pcode?: string;
  vt_en?: string;
  vt_mm?: string;
}

const breadcrumbQueries: Record<ResultType, string> = {
  state_region: `
    SELECT t.pcode, t.name_en, t.name_mm
    FROM state_region t WHERE t.pcode = ?`,
  district: `
    SELECT t.pcode, t.name_en, t.name_mm,
      sr.pcode AS sr_pcode, sr.name_en AS sr_en, sr.name_mm AS sr_mm
    FROM district t
    JOIN state_region sr ON sr.pcode = t.sr_pcode
    WHERE t.pcode = ?`,
  township: `
    SELECT t.pcode, t.name_en, t.name_mm,
      sr.pcode AS sr_pcode, sr.name_en AS sr_en, sr.name_mm AS sr_mm,
      d.pcode AS dist_pcode, d.name_en AS dist_en, d.name_mm AS dist_mm
    FROM township t
    JOIN state_region sr ON sr.pcode = t.sr_pcode
    JOIN district d ON d.pcode = t.district_pcode
    WHERE t.pcode = ?`,
  town: `
    SELECT t.pcode, t.name_en, t.name_mm, t.latitude, t.longitude,
      sr.pcode AS sr_pcode, sr.name_en AS sr_en, sr.name_mm AS sr_mm,
      d.pcode AS dist_pcode, d.name_en AS dist_en, d.name_mm AS dist_mm,
      ts.pcode AS ts_pcode, ts.name_en AS ts_en, ts.name_mm AS ts_mm
    FROM town t
    JOIN state_region sr ON sr.pcode = t.sr_pcode
    JOIN district d ON d.pcode = t.district_pcode
    JOIN township ts ON ts.pcode = t.township_pcode
    WHERE t.pcode = ?`,
  ward: `
    SELECT t.pcode, t.name_en, t.name_mm,
      sr.pcode AS sr_pcode, sr.name_en AS sr_en, sr.name_mm AS sr_mm,
      d.pcode AS dist_pcode, d.name_en AS dist_en, d.name_mm AS dist_mm,
      ts.pcode AS ts_pcode, ts.name_en AS ts_en, ts.name_mm AS ts_mm,
      tw.pcode AS town_pcode, tw.name_en AS town_en, tw.name_mm AS town_mm
    FROM ward t
    JOIN state_region sr ON sr.pcode = t.sr_pcode
    JOIN district d ON d.pcode = t.district_pcode
    JOIN township ts ON ts.pcode = t.township_pcode
    JOIN town tw ON tw.pcode = t.town_pcode
    WHERE t.pcode = ?`,
  village_tract: `
    SELECT t.pcode, t.name_en, t.name_mm,
      sr.pcode AS sr_pcode, sr.name_en AS sr_en, sr.name_mm AS sr_mm,
      d.pcode AS dist_pcode, d.name_en AS dist_en, d.name_mm AS dist_mm,
      ts.pcode AS ts_pcode, ts.name_en AS ts_en, ts.name_mm AS ts_mm
    FROM village_tract t
    JOIN state_region sr ON sr.pcode = t.sr_pcode
    JOIN district d ON d.pcode = t.district_pcode
    JOIN township ts ON ts.pcode = t.township_pcode
    WHERE t.pcode = ?`,
  village: `
    SELECT t.pcode, t.name_en, t.name_mm, t.latitude, t.longitude,
      t.local_name_en, t.local_name_mm,
      sr.pcode AS sr_pcode, sr.name_en AS sr_en, sr.name_mm AS sr_mm,
      d.pcode AS dist_pcode, d.name_en AS dist_en, d.name_mm AS dist_mm,
      ts.pcode AS ts_pcode, ts.name_en AS ts_en, ts.name_mm AS ts_mm,
      vt.pcode AS vt_pcode, vt.name_en AS vt_en, vt.name_mm AS vt_mm
    FROM village t
    JOIN state_region sr ON sr.pcode = t.sr_pcode
    JOIN district d ON d.pcode = t.district_pcode
    JOIN township ts ON ts.pcode = t.township_pcode
    JOIN village_tract vt ON vt.pcode = t.village_tract_pcode
    WHERE t.pcode = ?`,
};

function rowToObj(columns: string[], values: unknown[]): Record<string, unknown> {
  const obj: Record<string, unknown> = {};
  for (let i = 0; i < columns.length; i++) {
    obj[columns[i]] = values[i];
  }
  return obj;
}

function buildBreadcrumbFromRow(
  row: BreadcrumbRow,
  selfEn: string,
  selfMm: string,
  type: ResultType
): { en: string[]; mm: string[] } {
  const en: string[] = [];
  const mm: string[] = [];

  if (type !== "state_region" && row.sr_en) {
    en.push(row.sr_en);
    mm.push(row.sr_mm!);
  }
  if (type !== "state_region" && type !== "district" && row.dist_en) {
    en.push(row.dist_en);
    mm.push(row.dist_mm!);
  }
  if (
    type !== "state_region" &&
    type !== "district" &&
    type !== "township" &&
    row.ts_en
  ) {
    en.push(row.ts_en);
    mm.push(row.ts_mm!);
  }
  if (type === "ward" && row.town_en) {
    en.push(row.town_en);
    mm.push(row.town_mm!);
  }
  if (type === "village" && row.vt_en) {
    en.push(row.vt_en);
    mm.push(row.vt_mm!);
  }

  en.push(selfEn);
  mm.push(selfMm);

  return { en, mm };
}

function buildBreadcrumbLinks(row: BreadcrumbRow, type: ResultType, selfPcode: string): BreadcrumbLink[] {
  const links: BreadcrumbLink[] = [];

  if (type !== "state_region" && row.sr_pcode)
    links.push({ type: "state_region", pcode: row.sr_pcode });
  if (type !== "state_region" && type !== "district" && row.dist_pcode)
    links.push({ type: "district", pcode: row.dist_pcode });
  if (type !== "state_region" && type !== "district" && type !== "township" && row.ts_pcode)
    links.push({ type: "township", pcode: row.ts_pcode });
  if (type === "ward" && row.town_pcode)
    links.push({ type: "town", pcode: row.town_pcode });
  if (type === "village" && row.vt_pcode)
    links.push({ type: "village_tract", pcode: row.vt_pcode });

  links.push({ type, pcode: selfPcode });

  return links;
}

// --- Search ---

export async function search(query: string, limit?: number): Promise<SearchResult[]> {
  if (!query || query.trim().length === 0) return [];

  const db = await getDb();
  const q = query.trim();
  const lang = detectLang(q);
  const maxResults = limit ?? 50;

  const results: SearchResult[] = [];

  if (lang === "en") {
    // FTS4 prefix match for English
    const escaped = q.replace(/"/g, '""');
    const stmt = db.prepare(
      `SELECT name_en, name_mm, pcode, type FROM fts_places WHERE name_en MATCH ? LIMIT ?`
    );
    stmt.bind([`"${escaped}"*`, maxResults]);

    while (stmt.step()) {
      const vals = stmt.get();
      const [name_en, name_mm, pcode, type] = vals as [string, string, string, string];
      const bc = await resolveBreadcrumb(db, pcode, type as ResultType);
      results.push({
        pcode,
        name_en,
        name_mm,
        type: type as ResultType,
        breadcrumb_en: bc.en,
        breadcrumb_mm: bc.mm,
      });
    }
    stmt.free();
  } else {
    // Myanmar: LIKE search across all tables in type order
    for (const type of TYPE_ORDER) {
      if (results.length >= maxResults) break;
      const table = tableForType[type];
      const remaining = maxResults - results.length;
      const stmt = db.prepare(
        `SELECT pcode, name_en, name_mm FROM ${table} WHERE name_mm LIKE ? LIMIT ?`
      );
      stmt.bind([`%${q}%`, remaining]);

      while (stmt.step()) {
        const vals = stmt.get();
        const [pcode, name_en, name_mm] = vals as [string, string, string];
        const bc = await resolveBreadcrumb(db, pcode, type);
        results.push({
          pcode,
          name_en,
          name_mm,
          type,
          breadcrumb_en: bc.en,
          breadcrumb_mm: bc.mm,
        });
      }
      stmt.free();
    }
  }

  // Sort by type priority
  results.sort(
    (a, b) => TYPE_ORDER.indexOf(a.type) - TYPE_ORDER.indexOf(b.type)
  );

  return results;
}

async function resolveBreadcrumb(
  db: Database,
  pcode: string,
  type: ResultType
): Promise<{ en: string[]; mm: string[] }> {
  const sql = breadcrumbQueries[type];
  const stmt = db.prepare(sql);
  stmt.bind([pcode]);

  if (stmt.step()) {
    const cols = stmt.getColumnNames();
    const vals = stmt.get();
    const row = rowToObj(cols, vals) as Record<string, string>;
    stmt.free();
    return buildBreadcrumbFromRow(
      row as unknown as BreadcrumbRow,
      row.name_en,
      row.name_mm,
      type
    );
  }

  stmt.free();
  return { en: [], mm: [] };
}

// --- Detail ---

export async function getDetail(type: ResultType, pcode: string): Promise<DetailResult | null> {
  const db = await getDb();
  const sql = breadcrumbQueries[type];
  const stmt = db.prepare(sql);
  stmt.bind([pcode]);

  if (!stmt.step()) {
    stmt.free();
    return null;
  }

  const cols = stmt.getColumnNames();
  const vals = stmt.get();
  stmt.free();
  const row = rowToObj(cols, vals) as Record<string, unknown>;

  const bc = buildBreadcrumbFromRow(
    row as unknown as BreadcrumbRow,
    row.name_en as string,
    row.name_mm as string,
    type
  );
  const bcLinks = buildBreadcrumbLinks(row as unknown as BreadcrumbRow, type, pcode);

  return {
    pcode,
    name_en: row.name_en as string,
    name_mm: row.name_mm as string,
    type,
    breadcrumb_en: bc.en,
    breadcrumb_mm: bc.mm,
    breadcrumb_links: bcLinks,
    latitude: row.latitude as number | undefined,
    longitude: row.longitude as number | undefined,
    local_name_en: row.local_name_en as string | null | undefined,
    local_name_mm: row.local_name_mm as string | null | undefined,
  };
}

// --- Children ---

const childConfig: Partial<
  Record<ResultType, { childType: ResultType; parentField: string }[]>
> = {
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

  const db = await getDb();
  const groups: ChildGroup[] = [];

  for (const { childType, parentField } of config) {
    const table = tableForType[childType];
    const stmt = db.prepare(
      `SELECT pcode, name_en, name_mm FROM ${table} WHERE ${parentField} = ? ORDER BY name_en`
    );
    stmt.bind([pcode]);

    const items: SearchResult[] = [];
    while (stmt.step()) {
      const vals = stmt.get();
      const [childPcode, name_en, name_mm] = vals as [string, string, string];
      const bc = await resolveBreadcrumb(db, childPcode, childType);
      items.push({
        pcode: childPcode,
        name_en,
        name_mm,
        type: childType,
        breadcrumb_en: bc.en,
        breadcrumb_mm: bc.mm,
      });
    }
    stmt.free();

    if (items.length > 0) {
      groups.push({ type: childType, items });
    }
  }

  return groups;
}
