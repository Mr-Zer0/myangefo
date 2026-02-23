```mermaid

erDiagram
    state_region {
        TEXT pcode PK
        TEXT name_en
        TEXT name_mm
    }

    district {
        TEXT pcode PK
        TEXT name_en
        TEXT name_mm
        TEXT sr_pcode FK
    }

    township {
        TEXT pcode PK
        TEXT name_en
        TEXT name_mm
        TEXT district_pcode FK
        TEXT sr_pcode FK
    }

    town {
        TEXT pcode PK
        TEXT name_en
        TEXT name_mm
        REAL latitude
        REAL longitude
        TEXT township_pcode FK
        TEXT district_pcode FK
        TEXT sr_pcode FK
    }

    ward {
        TEXT pcode PK
        TEXT name_en
        TEXT name_mm
        TEXT town_pcode FK
        TEXT township_pcode FK
        TEXT district_pcode FK
        TEXT sr_pcode FK
    }

    village_tract {
        TEXT pcode PK
        TEXT name_en
        TEXT name_mm
        TEXT township_pcode FK
        TEXT district_pcode FK
        TEXT sr_pcode FK
    }

    village {
        TEXT pcode PK
        TEXT name_en
        TEXT name_mm
        TEXT local_name_en
        TEXT local_name_mm
        REAL latitude
        REAL longitude
        TEXT village_tract_pcode FK
        TEXT township_pcode FK
        TEXT district_pcode FK
        TEXT sr_pcode FK
    }

    fts_places {
        TEXT name_en
        TEXT name_mm
        TEXT pcode
        TEXT type
    }

    %% ─── MIMU Baseline Data Tables ───────────────────────────────────────────

    %% Stores one row per indicator value per area per year.
    %% Covers UNION, State/Region, and Township levels via area_pcode + area_level.
    baseline_indicator {
        INTEGER id PK
        TEXT area_pcode FK
        TEXT area_level "UNION | state_region | township"
        TEXT sector "Agriculture | Demography | Economy | Education | Environment | Gender | Health | ICT | Nutrition | Peace Building | Protection | Transportation | Climate"
        TEXT sub_sector
        TEXT indicator_name
        TEXT indicator_type
        TEXT unit
        INTEGER data_year "e.g. 2014-2025"
        REAL value
        TEXT source_name
    }

    %% ─── Demography & Administration summary view (denormalised for query speed)
    area_demography {
        TEXT area_pcode PK
        TEXT area_level "state_region | township"
        INTEGER census_year
        INTEGER population_total
        INTEGER population_male
        INTEGER population_female
        REAL sex_ratio
        INTEGER num_households
        REAL avg_household_size
        INTEGER num_female_headed_hh
        REAL pct_female_headed_hh
        REAL population_density
        REAL urban_population_pct
        REAL annual_growth_rate
        REAL total_fertility_rate
        REAL crude_birth_rate
        REAL crude_death_rate
        INTEGER num_villages
        INTEGER num_village_tracts
        INTEGER num_wards
        INTEGER num_townships "state_region level only"
        INTEGER num_districts "state_region level only"
        INTEGER num_housing_units
    }

    %% ─── Health indicators
    area_health {
        TEXT area_pcode PK
        TEXT area_level
        INTEGER data_year
        REAL infant_mortality_rate
        REAL neonatal_mortality_rate
        REAL under_five_mortality_rate
        REAL life_expectancy_at_birth
        INTEGER num_doctors
        INTEGER num_hospitals
        INTEGER num_rural_health_centres
    }

    %% ─── Education indicators
    area_education {
        TEXT area_pcode PK
        TEXT area_level
        INTEGER data_year
        REAL adult_literacy_rate
        REAL primary_enrollment_ratio
        REAL secondary_enrollment_ratio
        REAL girls_to_boys_ratio_primary
        REAL girls_to_boys_ratio_secondary
        INTEGER num_primary_schools
        INTEGER num_middle_schools
        INTEGER num_high_schools
        INTEGER num_monastic_schools
    }

    %% ─── Agriculture indicators
    area_agriculture {
        TEXT area_pcode PK
        TEXT area_level
        INTEGER data_year
        REAL area_sown_paddy_acres
        REAL area_sown_total_acres
        REAL harvested_area_acres
        REAL production_tonnes
        REAL agriculture_share_govt_expenditure
    }

    %% ─── Economy & Livelihood
    area_economy {
        TEXT area_pcode PK
        TEXT area_level
        INTEGER data_year
        REAL labour_force_participation_rate
        REAL employment_to_population_ratio
        REAL wealth_ranking_index
        TEXT wealth_rank "Poor | Middle | Rich"
        REAL share_women_nonagri_wage_employment
    }

    %% ─── Environment & Housing
    area_environment {
        TEXT area_pcode PK
        TEXT area_level
        INTEGER data_year
        INTEGER num_hh_electricity
        INTEGER num_hh_solar
        INTEGER num_hh_kerosene
        INTEGER num_hh_improved_toilet
        INTEGER num_hh_piped_water
        INTEGER num_hh_wood_fuel_cooking
        INTEGER num_natural_disasters
        REAL rainfall_mm "Township level only"
    }

    %% ─── Nutrition
    area_nutrition {
        TEXT area_pcode PK
        TEXT area_level
        INTEGER data_year
        REAL malnutrition_under_one_yr_pct
        REAL malnutrition_under_three_yr_pct
        REAL anaemia_prevalence_women_15_49_pct
        REAL low_birth_weight_pct
        REAL food_energy_deprivation_pct
    }

    %% ─── ICT & Transportation
    area_ict_transport {
        TEXT area_pcode PK
        TEXT area_level
        INTEGER data_year
        INTEGER num_hh_with_computer
        INTEGER num_hh_with_internet
        INTEGER num_internet_users
        INTEGER num_hh_with_radio
        INTEGER num_hh_with_mobile_phone
        REAL road_length_km
        INTEGER num_airports
    }

    %% ─── Protection & Displacement
    area_protection {
        TEXT area_pcode PK
        TEXT area_level
        INTEGER data_year
        REAL birth_registration_pct
        INTEGER num_idp "Internally displaced persons"
        INTEGER num_human_trafficking_victims
        INTEGER num_persons_with_disability
        INTEGER num_battle_events
        INTEGER num_conflict_fatalities
    }

    %% ─────────────────────────────────────────────────────────────────────────
    %% Relationships
    %% ─────────────────────────────────────────────────────────────────────────

    state_region ||--o{ district : "has"
    district ||--o{ township : "has"
    township ||--o{ town : "has"
    township ||--o{ village_tract : "has"
    town ||--o{ ward : "has"
    village_tract ||--o{ village : "has"

    %% baseline_indicator links to any administrative level via area_pcode
    state_region ||--o{ baseline_indicator : "sr_pcode"
    township ||--o{ baseline_indicator : "township_pcode"

    %% Summary/denormalised tables link at state_region or township level
    state_region ||--o{ area_demography : "sr_pcode"
    township ||--o{ area_demography : "township_pcode"

    state_region ||--o{ area_health : "sr_pcode"
    township ||--o{ area_health : "township_pcode"

    state_region ||--o{ area_education : "sr_pcode"
    township ||--o{ area_education : "township_pcode"

    state_region ||--o{ area_agriculture : "sr_pcode"
    township ||--o{ area_agriculture : "township_pcode"

    state_region ||--o{ area_economy : "sr_pcode"
    township ||--o{ area_economy : "township_pcode"

    state_region ||--o{ area_environment : "sr_pcode"
    township ||--o{ area_environment : "township_pcode"

    state_region ||--o{ area_nutrition : "sr_pcode"
    township ||--o{ area_nutrition : "township_pcode"

    state_region ||--o{ area_ict_transport : "sr_pcode"
    township ||--o{ area_ict_transport : "township_pcode"

    state_region ||--o{ area_protection : "sr_pcode"
    township ||--o{ area_protection : "township_pcode"