import csv
import re
import os
from datetime import datetime
import pandas as pd
import pyreadstat

# Province mapping for highways, airports, and hospitals
PROVINCE_KEYWORDS = {
    1: ["mechi", "dharan", "biratnagar", "chandragadhi", "bdp", "bir", "jhapa", "ilam", "koshi", "koshi hwy", "nh01", "nh02", "nh08"],
    2: ["janakpur", "jkr", "simara", "sif", "birgunj", "madhesh", "bardibas", "nh05"],
    3: ["tribhuvan", "ktm", "kathmandu", "patan", "lalitpur", "bhaktapur", "prithvi", "araniko", "bp hwy", "hetauda", "kodari", "bharatpur", "bhr", "tu teaching", "bagmati", "nh03", "nh04", "nh06", "nh10", "nh42"],
    4: ["pokhara", "pkr", "gandaki", "manipal", "mustang", "kaski", "mugling", "siddhartha", "nh47", "nh09", "nh44"],
    5: ["gautam buddha", "bwa", "nepalgunj", "kep", "butwal", "lumbini", "dang", "tulsipur", "kohalpur", "surkhet", "nh12"],
    6: ["karnali", "karnali rajmarg", "jumla", "jajarkot", "dailekh", "nh13"],
    7: ["dhangadhi", "dhi", "mahakali", "sudurpashchim", "doti", "baitadi", "dadeldhura", "nh14", "nh15"]
}

def detect_province(name_str):
    s = name_str.lower()
    for prov_code, kws in PROVINCE_KEYWORDS.items():
        if any(kw in s for kw in kws):
            return prov_code
    return 3 # Default to Bagmati/Central

def parse_npt_timestamp(ts_str):
    # Formats: "2026-07-19 13:00 NPT" or ISO
    ts_clean = ts_str.replace(" NPT", "").strip()
    try:
        dt = datetime.strptime(ts_clean, "%Y-%m-%d %H:%M")
        return dt.year, dt.month, dt.day, dt.strftime("%Y-%m-%d"), dt.strftime("%H:%M:%S")
    except Exception:
        try:
            dt = datetime.fromisoformat(ts_clean.replace("Z", "+00:00"))
            return dt.year, dt.month, dt.day, dt.strftime("%Y-%m-%d"), dt.strftime("%H:%M:%S")
        except Exception:
            return 2026, 7, 19, "2026-07-19", "12:00:00"

def get_infra_type_code(cat_str):
    c = cat_str.lower().strip()
    if "road" in c:
        return 1 # Road / Highway
    elif "airport" in c:
        return 2 # Airport / Aviation
    elif "hospital" in c:
        return 3 # Hospital / Medical
    return 1

def get_status_code(status_str):
    s = status_str.lower().strip()
    if s == "open" or s == "operational":
        return 1
    elif s == "partial" or s == "one-way" or s == "restricted":
        return 2
    elif s == "closed" or s == "blocked":
        return 3
    return 1

def categorize_reason(detail_str, status_code):
    if not detail_str or detail_str.strip() == "" or "normal" in detail_str.lower() or "reopened" in detail_str.lower():
        if status_code == 1:
            return 0 # Normal Operations / Cleared
    d = detail_str.lower()
    if any(k in d for k in ["landslide", "mudslide", "rockfall", "debris", "pahiro"]):
        return 1 # Landslide / Rockfall
    elif any(k in d for k in ["flood", "flooded", "river", "washout", "washed out", "inundation"]):
        return 2 # Flood / Water Washout
    elif any(k in d for k in ["one-way", "single lane", "reduced lanes", "partial", "narrowed"]):
        return 3 # Lane Restriction / One-Way
    elif any(k in d for k in ["news", "reported issues", "unconfirmed", "inspection"]):
        return 4 # Reported in Media / Verification Pending
    elif any(k in d for k in ["bed", "capacity", "patient"]):
        return 5 # Hospital Capacity / Bed Telemetry
    elif any(k in d for k in ["reopened", "resumed", "clear"]):
        return 0 # Reopened / Operational
    else:
        return 6 # General Obstruction / Infrastructure Risk

def build_infra_spss():
    csv_path = "public/infra_history.csv"
    if not os.path.exists(csv_path):
        csv_path = "infra_history.csv"

    print(f"Reading from {csv_path}...")
    records = []
    row_idx = 0

    with open(csv_path, "r", encoding="utf-8") as f:
        reader = csv.reader(f)
        header = next(reader)
        for r in reader:
            if not r or len(r) < 5:
                continue
            row_idx += 1
            ts_str = r[0]
            cat_str = r[1]
            name_en = r[2]
            name_ne = r[3] if len(r) > 3 else ""
            status_str = r[4] if len(r) > 4 else "open"
            detail_str = r[5] if len(r) > 5 else ""

            year, month, day, date_npt, time_npt = parse_npt_timestamp(ts_str)
            infra_type = get_infra_type_code(cat_str)
            status_code = get_status_code(status_str)
            reason_cat = categorize_reason(detail_str, status_code)
            prov_code = detect_province(name_en + " " + detail_str)
            disrupted_flag = 1 if status_code > 1 else 0

            # Clean open-ended reason string (up to 255 chars for SPSS string variable)
            clean_reason = detail_str.replace("\n", " ").replace("\r", " ").strip()[:250]
            if not clean_reason and status_code == 1:
                clean_reason = "Normal operations"

            records.append({
                "Record_ID": row_idx,
                "Year": year,
                "Month": month,
                "Day": day,
                "Date_NPT": date_npt,
                "Time_NPT": time_npt,
                "Infra_Type": infra_type,
                "Infra_Name": name_en[:60],
                "Name_Nepali": name_ne[:60],
                "Status_Code": status_code,
                "Disrupted": disrupted_flag,
                "Province_Code": prov_code,
                "Reason_Category": reason_cat,
                "Reason_Text": clean_reason, # Open-ended qualitative text string
                "Reason_Length": len(clean_reason)
            })

    print(f"Parsed {len(records)} infrastructure history records.")

    # 1. Output SPSS-Compatible CSV
    spss_headers = [
        "Record_ID", "Year", "Month", "Day", "Date_NPT", "Time_NPT",
        "Infra_Type", "Infra_Name", "Name_Nepali", "Status_Code",
        "Disrupted", "Province_Code", "Reason_Category", "Reason_Text",
        "Reason_Length"
    ]

    out_csv = "public/nepal_infra_spss.csv"
    with open(out_csv, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=spss_headers)
        writer.writeheader()
        for rec in records:
            writer.writerow(rec)

    with open("nepal_infra_spss.csv", "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=spss_headers)
        writer.writeheader()
        for rec in records:
            writer.writerow(rec)

    print(f"Saved SPSS CSV: {out_csv} ({len(records)} rows)")

    # 2. Output SPSS Syntax Script (.sps)
    sps_content = f"""* ==============================================================================
* SPSS SYNTAX: NEPAL ROAD, AIRPORT & INFRASTRUCTURE DISRUPTION CATALOG
* ==============================================================================
* Encoded for Quantitative and Qualitative (Open-Ended Content) Analysis in SPSS.
* Covers 27,900+ 15-minute telemetry logs across roads, airports, and hospitals.
* ============================================================================== .

* Step 1: Read the Clean SPSS CSV File .
GET DATA
  /TYPE=TXT
  /FILE='nepal_infra_spss.csv'
  /DELCASE=LINE
  /DELIMITERS=','
  /QUALIFIER='"'
  /ARRANGEMENT=DELIMITED
  /FIRSTCASE=2
  /VARIABLES=
    Record_ID F8.0
    Year F4.0
    Month F2.0
    Day F2.0
    Date_NPT A10
    Time_NPT A8
    Infra_Type F1.0
    Infra_Name A60
    Name_Nepali A60
    Status_Code F1.0
    Disrupted F1.0
    Province_Code F1.0
    Reason_Category F1.0
    Reason_Text A255
    Reason_Length F4.0 .
CACHE.
EXECUTE.

* Step 2: Assign Descriptive Variable Labels for SPSS .
VARIABLE LABELS
  Record_ID 'Observation Sequential Log Number'
  Year 'Year of Telemetry (NPT)'
  Month 'Month of Telemetry (1-12)'
  Day 'Day of Month (1-31)'
  Date_NPT 'Date in Nepal Standard Time (YYYY-MM-DD)'
  Time_NPT 'Time in Nepal Standard Time (HH:MM:SS)'
  Infra_Type 'Infrastructure Sector (Road, Airport, Hospital)'
  Infra_Name 'Infrastructure Facility Name (English)'
  Name_Nepali 'Infrastructure Facility Name (Nepali)'
  Status_Code 'Operational Status Classification'
  Disrupted 'Disruption Indicator Binary (0=No, 1=Yes)'
  Province_Code 'Federal Province of Nepal'
  Reason_Category 'Categorized Cause of Disruption / Status'
  Reason_Text 'Open-Ended Disruption Description / Qualitative Narrative'
  Reason_Length 'Character Length of Open-Ended Response' .

* Step 3: Define Categorical Value Labels for Analysis .
VALUE LABELS
  Infra_Type
    1 'National Highway / Road'
    2 'Airport / Domestic & International'
    3 'Emergency Hospital / Medical Center'
  /Status_Code
    1 'Open / Fully Operational'
    2 'Partially Blocked / One-Way / Restricted'
    3 'Completely Blocked / Closed'
  /Disrupted
    0 'Normal Operations'
    1 'Disrupted (Partial or Closed)'
  /Province_Code
    1 'Koshi Province'
    2 'Madhesh Province'
    3 'Bagmati Province'
    4 'Gandaki Province'
    5 'Lumbini Province'
    6 'Karnali Province'
    7 'Sudurpashchim Province'
  /Reason_Category
    0 'None / Normal Operations / Cleared'
    1 'Landslide / Mudslide / Rockfall'
    2 'Flood / River Washout / Inundation'
    3 'Lane Restriction / Reduced Lanes'
    4 'Reported in News / Verification Pending'
    5 'Hospital Bed / Capacity Telemetry'
    6 'General Structural / Roadbed Damage' .

* Step 4: Define Measurement Levels .
VARIABLE LEVEL
  Record_ID Reason_Length (SCALE)
  /Status_Code Disrupted (ORDINAL)
  /Year Month Day Infra_Type Province_Code Reason_Category (NOMINAL)
  /Reason_Text (NOMINAL) .

* Step 5: Statistical Crosstabs & Qualitative Content Analysis .
FREQUENCIES VARIABLES=Infra_Type Status_Code Disrupted Province_Code Reason_Category
  /STATISTICS=STDDEV VARIANCE MEAN MEDIAN
  /BARCHART FREQ
  /ORDER=ANALYSIS.

CROSSTABS
  /TABLES=Infra_Type BY Status_Code
  /FORMAT=AVALUE TABLES
  /STATISTICS=CHISQ
  /CELLS=COUNT ROW COLUMN TOTAL .

CROSSTABS
  /TABLES=Province_Code BY Reason_Category
  /FORMAT=AVALUE TABLES
  /STATISTICS=CHISQ
  /CELLS=COUNT ROW COLUMN TOTAL .

* Save Native SPSS .sav File .
SAVE OUTFILE='nepal_infra_master.sav'
  /COMPRESSED.
EXECUTE.
"""

    out_sps = "public/nepal_infra_import.sps"
    with open(out_sps, "w", encoding="utf-8") as f:
        f.write(sps_content)

    with open("nepal_infra_import.sps", "w", encoding="utf-8") as f:
        f.write(sps_content)

    print(f"Saved SPSS Syntax: {out_sps}")

    # 3. Output Native .SAV Binary File via pyreadstat
    try:
        print("Generating native .SAV file via pyreadstat...")
        df = pd.DataFrame(records)

        column_labels = {
            "Record_ID": "Observation Sequential Log Number",
            "Year": "Year of Telemetry (NPT)",
            "Month": "Month of Telemetry",
            "Day": "Day of Month",
            "Date_NPT": "Date in Nepal Standard Time",
            "Time_NPT": "Time in Nepal Standard Time",
            "Infra_Type": "Infrastructure Sector",
            "Infra_Name": "Facility Name (English)",
            "Name_Nepali": "Facility Name (Nepali)",
            "Status_Code": "Operational Status",
            "Disrupted": "Disruption Indicator (0=No, 1=Yes)",
            "Province_Code": "Federal Province",
            "Reason_Category": "Categorized Cause of Disruption",
            "Reason_Text": "Open-Ended Disruption Description (Qualitative)",
            "Reason_Length": "Character Length of Open-Ended Response"
        }

        variable_value_labels = {
            "Infra_Type": {
                1: "National Highway / Road",
                2: "Airport / Domestic & International",
                3: "Emergency Hospital"
            },
            "Status_Code": {
                1: "Open / Fully Operational",
                2: "Partially Blocked / One-Way",
                3: "Completely Blocked / Closed"
            },
            "Disrupted": {
                0: "Normal Operations",
                1: "Disrupted (Partial or Closed)"
            },
            "Province_Code": {
                1: "Koshi Province",
                2: "Madhesh Province",
                3: "Bagmati Province",
                4: "Gandaki Province",
                5: "Lumbini Province",
                6: "Karnali Province",
                7: "Sudurpashchim Province"
            },
            "Reason_Category": {
                0: "None / Normal Operations / Cleared",
                1: "Landslide / Mudslide / Rockfall",
                2: "Flood / River Washout",
                3: "Lane Restriction / Reduced Lanes",
                4: "Reported in News / Pending Verification",
                5: "Hospital Capacity Telemetry",
                6: "General Structural / Roadbed Damage"
            }
        }

        variable_measure = {
            "Record_ID": "scale",
            "Reason_Length": "scale",
            "Status_Code": "ordinal",
            "Disrupted": "ordinal",
            "Infra_Type": "nominal",
            "Province_Code": "nominal",
            "Reason_Category": "nominal",
            "Year": "nominal",
            "Month": "nominal",
            "Day": "nominal"
        }

        pyreadstat.write_sav(
            df,
            "public/nepal_infra_master.sav",
            column_labels=column_labels,
            variable_value_labels=variable_value_labels,
            variable_measure=variable_measure
        )
        pyreadstat.write_sav(
            df,
            "nepal_infra_master.sav",
            column_labels=column_labels,
            variable_value_labels=variable_value_labels,
            variable_measure=variable_measure
        )
        print("Generated native SPSS .SAV binary file: public/nepal_infra_master.sav!")
    except Exception as e:
        print("Error during .sav creation:", e)

if __name__ == "__main__":
    build_infra_spss()
