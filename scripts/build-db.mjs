import Database from "better-sqlite3";
import { readFileSync, copyFileSync, mkdirSync, rmSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const dataDir = resolve(root, "src/data");
const publicDir = resolve(root, "public");

mkdirSync(publicDir, { recursive: true });

const dbPath = resolve(publicDir, "myangefo.db");
rmSync(dbPath, { force: true });
const db = new Database(dbPath);

db.pragma("journal_mode = OFF");
db.pragma("synchronous = OFF");

// --- Create tables ---

db.exec(`
  CREATE TABLE state_region (
    pcode TEXT PRIMARY KEY,
    name_en TEXT NOT NULL,
    name_mm TEXT NOT NULL
  );

  CREATE TABLE district (
    pcode TEXT PRIMARY KEY,
    name_en TEXT NOT NULL,
    name_mm TEXT NOT NULL,
    sr_pcode TEXT NOT NULL
  );

  CREATE TABLE township (
    pcode TEXT PRIMARY KEY,
    name_en TEXT NOT NULL,
    name_mm TEXT NOT NULL,
    district_pcode TEXT NOT NULL,
    sr_pcode TEXT NOT NULL
  );

  CREATE TABLE town (
    pcode TEXT PRIMARY KEY,
    name_en TEXT NOT NULL,
    name_mm TEXT NOT NULL,
    latitude REAL,
    longitude REAL,
    township_pcode TEXT NOT NULL,
    district_pcode TEXT NOT NULL,
    sr_pcode TEXT NOT NULL
  );

  CREATE TABLE ward (
    pcode TEXT PRIMARY KEY,
    name_en TEXT NOT NULL,
    name_mm TEXT NOT NULL,
    town_pcode TEXT NOT NULL,
    township_pcode TEXT NOT NULL,
    district_pcode TEXT NOT NULL,
    sr_pcode TEXT NOT NULL
  );

  CREATE TABLE village_tract (
    pcode TEXT PRIMARY KEY,
    name_en TEXT NOT NULL,
    name_mm TEXT NOT NULL,
    township_pcode TEXT NOT NULL,
    district_pcode TEXT NOT NULL,
    sr_pcode TEXT NOT NULL
  );

  CREATE TABLE village (
    pcode TEXT PRIMARY KEY,
    name_en TEXT NOT NULL,
    name_mm TEXT NOT NULL,
    local_name_en TEXT,
    local_name_mm TEXT,
    latitude REAL,
    longitude REAL,
    village_tract_pcode TEXT NOT NULL,
    township_pcode TEXT NOT NULL,
    district_pcode TEXT NOT NULL,
    sr_pcode TEXT NOT NULL
  );
`);

// --- Create MIMU baseline & area summary tables ---
// Most indicator fields are JSON objects (year→value maps), stored as TEXT.

db.exec(`
  CREATE TABLE baseline_indicator (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    area_pcode TEXT NOT NULL,
    area_level TEXT NOT NULL,
    sector TEXT NOT NULL,
    sub_sector TEXT,
    indicator_name TEXT NOT NULL,
    indicator_type TEXT,
    unit TEXT,
    data_year INTEGER,
    value REAL,
    source_name TEXT
  );

  CREATE TABLE area_demography (
    area_pcode TEXT NOT NULL,
    area_level TEXT NOT NULL,
    census_year INTEGER,
    population_total INTEGER,
    population_male INTEGER,
    population_female INTEGER,
    population_rural INTEGER,
    population_urban INTEGER,
    sex_ratio REAL,
    num_households INTEGER,
    num_households_rural INTEGER,
    num_households_urban INTEGER,
    avg_household_size REAL,
    num_female_headed_hh INTEGER,
    num_male_headed_hh INTEGER,
    pct_female_headed_hh REAL,
    population_density REAL,
    urban_population_pct REAL,
    annual_growth_rate REAL,
    total_fertility_rate REAL,
    crude_birth_rate REAL,
    crude_death_rate REAL,
    age_dependency_ratio REAL,
    child_dependency_ratio REAL,
    total_dependency_ratio REAL,
    life_expectancy_total REAL,
    life_expectancy_male REAL,
    life_expectancy_female REAL,
    num_villages INTEGER,
    num_village_tracts INTEGER,
    num_wards INTEGER,
    num_townships INTEGER,
    num_districts INTEGER,
    num_housing_units INTEGER,
    population_by_age_group TEXT,
    population_by_religion TEXT,
    households_by_size TEXT,
    PRIMARY KEY (area_pcode, area_level)
  );

  CREATE TABLE area_health (
    area_pcode TEXT NOT NULL,
    area_level TEXT NOT NULL,
    infant_mortality_rate TEXT,
    neonatal_mortality_rate TEXT,
    under_five_mortality_rate TEXT,
    infant_deaths TEXT,
    maternal_mortality_ratio TEXT,
    doctors_per_10000 TEXT,
    nurses_per_10000 TEXT,
    hospital_beds_per_10000 TEXT,
    num_hospitals TEXT,
    num_rural_health_centres TEXT,
    antenatal_care_coverage TEXT,
    births_attended_skilled TEXT,
    immunisation_dpt3 TEXT,
    PRIMARY KEY (area_pcode, area_level)
  );

  CREATE TABLE area_education (
    area_pcode TEXT NOT NULL,
    area_level TEXT NOT NULL,
    adult_literacy_rate TEXT,
    adult_literacy_rate_male TEXT,
    adult_literacy_rate_female TEXT,
    primary_enrollment_ratio TEXT,
    girls_to_boys_ratio_primary TEXT,
    girls_to_boys_ratio_secondary TEXT,
    num_primary_schools TEXT,
    num_middle_schools TEXT,
    num_high_schools TEXT,
    num_monastic_schools_primary TEXT,
    num_monastic_schools_middle TEXT,
    num_teachers_primary TEXT,
    num_female_teachers TEXT,
    pct_public_expenditure_gdp TEXT,
    population_by_education_level TEXT,
    PRIMARY KEY (area_pcode, area_level)
  );

  CREATE TABLE area_agriculture (
    area_pcode TEXT NOT NULL,
    area_level TEXT NOT NULL,
    area_sown_by_crop TEXT,
    area_sown_total_acres TEXT,
    harvested_area_acres TEXT,
    production_tonnes TEXT,
    agricultural_land TEXT,
    arable_land_pct TEXT,
    agri_share_govt_expenditure TEXT,
    agri_orientation_index TEXT,
    pct_yield_change TEXT,
    PRIMARY KEY (area_pcode, area_level)
  );

  CREATE TABLE area_economy (
    area_pcode TEXT NOT NULL,
    area_level TEXT NOT NULL,
    labour_force_participation_rate TEXT,
    labour_force_participation_male TEXT,
    labour_force_participation_female TEXT,
    employment_to_population_ratio TEXT,
    share_women_nonagri_wage_employment TEXT,
    wealth_ranking_index TEXT,
    wealth_rank TEXT,
    debt_service_pct_exports TEXT,
    population_by_activity_status TEXT,
    PRIMARY KEY (area_pcode, area_level)
  );

  CREATE TABLE area_environment (
    area_pcode TEXT NOT NULL,
    area_level TEXT NOT NULL,
    num_hh_by_lighting_source TEXT,
    num_hh_by_cooking_fuel TEXT,
    num_hh_by_toilet_type TEXT,
    energy_intensity TEXT,
    num_natural_disasters TEXT,
    rainfall_mm TEXT,
    PRIMARY KEY (area_pcode, area_level)
  );

  CREATE TABLE area_nutrition (
    area_pcode TEXT NOT NULL,
    area_level TEXT NOT NULL,
    malnutrition_under_one_yr TEXT,
    malnutrition_under_three_yr TEXT,
    anaemia_prevalence_women_15_49_pct TEXT,
    low_birth_weight_pct TEXT,
    food_energy_deprivation_pct TEXT,
    children_overweight_pct TEXT,
    children_underweight_pct TEXT,
    PRIMARY KEY (area_pcode, area_level)
  );

  CREATE TABLE area_ict_transport (
    area_pcode TEXT NOT NULL,
    area_level TEXT NOT NULL,
    num_hh_with_computer TEXT,
    num_hh_with_internet TEXT,
    num_internet_users TEXT,
    num_hh_with_radio TEXT,
    num_hh_with_mobile_phone TEXT,
    num_hh_with_tv TEXT,
    fixed_broadband_subs TEXT,
    mobile_cellular_subs TEXT,
    road_length_km TEXT,
    num_airports TEXT,
    passenger_volume_air TEXT,
    hh_by_transport_item TEXT,
    PRIMARY KEY (area_pcode, area_level)
  );

  CREATE TABLE area_gender (
    area_pcode TEXT NOT NULL,
    area_level TEXT NOT NULL,
    gender_inequality_index TEXT,
    gender_development_index TEXT,
    women_in_parliament_pct TEXT,
    women_managerial_positions_pct TEXT,
    gender_pay_gap TEXT,
    PRIMARY KEY (area_pcode, area_level)
  );

  CREATE TABLE area_protection (
    area_pcode TEXT NOT NULL,
    area_level TEXT NOT NULL,
    birth_registration_pct TEXT,
    child_labour_pct TEXT,
    num_idp TEXT,
    num_human_trafficking_victims TEXT,
    num_battle_events TEXT,
    num_conflict_fatalities TEXT,
    population_by_identity_card TEXT,
    population_by_disability TEXT,
    PRIMARY KEY (area_pcode, area_level)
  );
`);

// --- Create indexes ---

db.exec(`
  CREATE INDEX idx_district_sr ON district(sr_pcode);
  CREATE INDEX idx_township_district ON township(district_pcode);
  CREATE INDEX idx_town_township ON town(township_pcode);
  CREATE INDEX idx_ward_town ON ward(town_pcode);
  CREATE INDEX idx_village_tract_township ON village_tract(township_pcode);
  CREATE INDEX idx_village_vt ON village(village_tract_pcode);

  CREATE INDEX idx_baseline_area ON baseline_indicator(area_pcode);
  CREATE INDEX idx_baseline_sector ON baseline_indicator(sector);
  CREATE INDEX idx_baseline_year ON baseline_indicator(data_year);
  CREATE INDEX idx_baseline_area_level ON baseline_indicator(area_level);
`);

// --- Load JSON and insert ---

function loadJson(filename) {
  return JSON.parse(readFileSync(resolve(dataDir, filename), "utf-8"));
}

const tables = [
  {
    name: "state_region",
    file: "state_region.json",
    cols: ["pcode", "name_en", "name_mm"],
  },
  {
    name: "district",
    file: "district.json",
    cols: ["pcode", "name_en", "name_mm", "sr_pcode"],
  },
  {
    name: "township",
    file: "township.json",
    cols: ["pcode", "name_en", "name_mm", "district_pcode", "sr_pcode"],
  },
  {
    name: "town",
    file: "town.json",
    cols: ["pcode", "name_en", "name_mm", "latitude", "longitude", "township_pcode", "district_pcode", "sr_pcode"],
  },
  {
    name: "ward",
    file: "ward.json",
    cols: ["pcode", "name_en", "name_mm", "town_pcode", "township_pcode", "district_pcode", "sr_pcode"],
  },
  {
    name: "village_tract",
    file: "villagetract.json",
    cols: ["pcode", "name_en", "name_mm", "township_pcode", "district_pcode", "sr_pcode"],
  },
  {
    name: "village",
    file: "village.json",
    cols: ["pcode", "name_en", "name_mm", "local_name_en", "local_name_mm", "latitude", "longitude", "village_tract_pcode", "township_pcode", "district_pcode", "sr_pcode"],
  },
];

for (const { name, file, cols } of tables) {
  const data = loadJson(file);
  const placeholders = cols.map(() => "?").join(", ");
  const stmt = db.prepare(
    `INSERT INTO ${name} (${cols.join(", ")}) VALUES (${placeholders})`
  );

  const insertMany = db.transaction((rows) => {
    for (const row of rows) {
      stmt.run(...cols.map((c) => row[c] ?? null));
    }
  });

  insertMany(data);
  console.log(`${name}: inserted ${data.length} rows`);
}

// --- Create FTS4 virtual table (sql.js lacks FTS5) ---

db.exec(`
  CREATE VIRTUAL TABLE fts_places USING fts4(
    name_en,
    name_mm,
    pcode,
    type,
    tokenize=unicode61
  );
`);

const ftsInsert = db.prepare(
  `INSERT INTO fts_places (name_en, name_mm, pcode, type) VALUES (?, ?, ?, ?)`
);

const insertFts = db.transaction(() => {
  for (const { name } of tables) {
    const rows = db.prepare(`SELECT name_en, name_mm, pcode FROM ${name}`).all();
    for (const row of rows) {
      ftsInsert.run(row.name_en, row.name_mm, row.pcode, name);
    }
  }
});

insertFts();
console.log("FTS4 index populated");

// --- Insert area_* JSON data ---
// Fields that are objects/arrays get stored as JSON TEXT; scalars stay as-is.

const areaTables = [
  { name: "area_demography", file: "area_demography.json" },
  { name: "area_health", file: "area_health.json" },
  { name: "area_education", file: "area_education.json" },
  { name: "area_agriculture", file: "area_agriculture.json" },
  { name: "area_economy", file: "area_economy.json" },
  { name: "area_environment", file: "area_environment.json" },
  { name: "area_nutrition", file: "area_nutrition.json" },
  { name: "area_ict_transport", file: "area_ict_transport.json" },
  { name: "area_gender", file: "area_gender.json" },
  { name: "area_protection", file: "area_protection.json" },
];

for (const { name, file } of areaTables) {
  const data = loadJson(file);
  if (data.length === 0) continue;

  // Derive column list from the DB table schema
  const colInfo = db.prepare(`PRAGMA table_info(${name})`).all();
  const cols = colInfo.map((c) => c.name);

  const placeholders = cols.map(() => "?").join(", ");
  const stmt = db.prepare(
    `INSERT INTO ${name} (${cols.join(", ")}) VALUES (${placeholders})`
  );

  const insertMany = db.transaction((rows) => {
    for (const row of rows) {
      const values = cols.map((c) => {
        const v = row[c];
        if (v === undefined || v === null) return null;
        if (typeof v === "object") return JSON.stringify(v);
        return v;
      });
      stmt.run(...values);
    }
  });

  insertMany(data);
  console.log(`${name}: inserted ${data.length} rows`);
}

db.close();

// --- Copy sql-wasm.wasm to public ---

const wasmSrc = resolve(root, "node_modules/sql.js/dist/sql-wasm.wasm");
const wasmDst = resolve(publicDir, "sql-wasm.wasm");
copyFileSync(wasmSrc, wasmDst);
console.log("Copied sql-wasm.wasm to public/");

console.log(`Done! Database written to ${dbPath}`);
