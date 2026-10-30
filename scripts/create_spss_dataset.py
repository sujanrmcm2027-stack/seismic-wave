import csv
import re
import os
from datetime import datetime

# Province detection lookup
PROVINCE_KEYWORDS = {
    1: ["koshi", "biratnagar", "dharan", "jhapa", "ilam", "morang", "sunsari", "udayapur", "sankhuwasabha", "taplejung", "bhojpur", "terhathum", "dhankuta", "panchthar"],
    2: ["madhesh", "janakpur", "birgunj", "rautahat", "sarlahi", "dhanusha", "mahottari", "bara", "parsa", "saptari", "siraha"],
    3: ["bagmati", "kathmandu", "lalitpur", "bhaktapur", "gorkha", "dhading", "nuwakot", "rasuwa", "sindhupalchok", "kavre", "dolakha", "makwanpur", "chitwan", "ramechhap", "sindhuli", "kodari", "barpak"],
    4: ["gandaki", "pokhara", "kaski", "mustang", "myagdi", "jomsom", "manang", "lamjung", "tanahun", "syangja", "parbat", "baglung", "nawalpur"],
    5: ["lumbini", "butwal", "rupandehi", "kapilvastu", "dang", "tulsipur", "banke", "nepalgunj", "bardiya", "pyuthan", "rolpa", "arghakhanchi", "gulmi", "palpa", "parasi"],
    6: ["karnali", "birendranagar", "surkhet", "jajarkot", "ramidanda", "jumla", "dailekh", "kalikot", "dolpa", "mugu", "humla", "salyan", "rukum"],
    7: ["sudurpashchim", "dhangadhi", "kailali", "kanchanpur", "bajhang", "chainpur", "doti", "achham", "bajura", "dadeldhura", "baitadi", "darchula"]
}

def detect_province(text, lat, lon):
    text_lower = text.lower()
    for prov_code, keywords in PROVINCE_KEYWORDS.items():
        if any(kw in text_lower for kw in keywords):
            return prov_code
    
    # Coordinates-based fallback for Nepal
    if lon < 81.5:
        return 7 # Sudurpashchim
    elif lon < 83.0:
        return 6 if lat > 28.5 else 5 # Karnali / Lumbini
    elif lon < 84.8:
        return 4 # Gandaki
    elif lon < 86.2:
        return 3 # Bagmati
    elif lon < 87.0:
        return 2 if lat < 27.2 else 3
    else:
        return 1 # Koshi

def get_mag_category(mag):
    if mag < 4.0:
        return 1 # Minor
    elif mag < 5.0:
        return 2 # Light
    elif mag < 6.0:
        return 3 # Moderate
    elif mag < 7.0:
        return 4 # Strong
    else:
        return 5 # Major

def get_depth_class(depth):
    if depth <= 30.0:
        return 1 # Shallow (0-30 km)
    elif depth <= 70.0:
        return 2 # Intermediate (31-70 km)
    else:
        return 3 # Deep (>70 km)

def get_source_code(source_str):
    s = source_str.upper()
    if "NEMRC" in s and "USGS" in s:
        return 3 # Multi-Agency Consensus
    elif "USGS" in s:
        return 1 # USGS Instrumental
    elif "NEMRC" in s:
        return 2 # NEMRC National
    else:
        return 4 # Bulletin / Media / BIPAD

def get_agreement_code(agr_str):
    a = agr_str.upper()
    if "BENCHMARK" in a or "HIGH" in a:
        return 3 # High / Benchmark
    elif "INSTRUMENTAL" in a or "DUAL" in a:
        return 2 # Moderate / Instrumental
    else:
        return 1 # Single Source / Community

def build_spss_dataset():
    input_csv = "public/seismic_tremors_history.csv"
    if not os.path.exists(input_csv):
        input_csv = "seismic_tremors_history.csv"

    print(f"Reading from {input_csv}...")
    records = []
    with open(input_csv, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for r in reader:
            event_id = r.get("Event ID", "").replace(" ", "_").replace("-", "_")
            date_str = r.get("Date (NPT)", "2026-01-01")
            time_str = r.get("Time (NPT)", "12:00:00")
            try:
                dt = datetime.strptime(date_str, "%Y-%m-%d")
                year, month, day = dt.year, dt.month, dt.day
            except Exception:
                year, month, day = 2026, 1, 1

            try:
                mag = float(r.get("Magnitude", 4.0))
            except Exception:
                mag = 4.0

            mag_type = r.get("Mag Type", "ml").strip()

            try:
                depth = float(r.get("Depth (km)", 10.0))
            except Exception:
                depth = 10.0

            epicenter = r.get("Epicenter / District", "").replace('"', '').strip()

            try:
                lat = float(r.get("Latitude", 28.0))
                lon = float(r.get("Longitude", 84.0))
            except Exception:
                lat, lon = 28.0, 84.0

            sources = r.get("Source Agencies", "Unknown").replace('"', '').strip()
            agreement = r.get("Agreement Level", "Single").replace('"', '').strip()
            url = r.get("Verification URL", "").replace('"', '').strip()

            mag_cat = get_mag_category(mag)
            depth_cat = get_depth_class(depth)
            prov_code = detect_province(epicenter, lat, lon)
            source_code = get_source_code(sources)
            agr_code = get_agreement_code(agreement)

            records.append({
                "Event_ID": event_id,
                "Year": year,
                "Month": month,
                "Day": day,
                "Date_NPT": date_str,
                "Time_NPT": time_str,
                "Magnitude": mag,
                "Mag_Category": mag_cat,
                "Mag_Type": mag_type,
                "Depth_km": depth,
                "Depth_Class": depth_cat,
                "Latitude": lat,
                "Longitude": lon,
                "Epicenter": epicenter,
                "Province_Code": prov_code,
                "Source_Code": source_code,
                "Agreement_Code": agr_code,
                "Source_Agency": sources,
                "Agreement_Level": agreement,
                "Verification_URL": url
            })

    # 1. Output SPSS-Compatible CSV
    spss_headers = [
        "Event_ID", "Year", "Month", "Day", "Date_NPT", "Time_NPT",
        "Magnitude", "Mag_Category", "Mag_Type", "Depth_km", "Depth_Class",
        "Latitude", "Longitude", "Epicenter", "Province_Code",
        "Source_Code", "Agreement_Code", "Source_Agency", "Agreement_Level",
        "Verification_URL"
    ]

    out_csv = "public/nepal_seismic_spss.csv"
    with open(out_csv, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=spss_headers)
        writer.writeheader()
        for rec in records:
            writer.writerow(rec)

    with open("nepal_seismic_spss.csv", "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=spss_headers)
        writer.writeheader()
        for rec in records:
            writer.writerow(rec)

    print(f"Generated SPSS CSV with {len(records)} rows: {out_csv}")

    # 2. Output SPSS Syntax Script (.sps)
    sps_content = f"""* ==============================================================================
* SPSS SYNTAX FOR NEPAL SEISMIC INTELLIGENCE MASTER CATALOG
* ==============================================================================
* Auto-generated for SPSS Statistics (IBM SPSS v20-v30+).
* Encoded for automatic variable definition, value labeling, and statistical testing.
* ============================================================================== .

* Step 1: Read the Clean SPSS CSV File .
GET DATA
  /TYPE=TXT
  /FILE='nepal_seismic_spss.csv'
  /DELCASE=LINE
  /DELIMITERS=','
  /QUALIFIER='"'
  /ARRANGEMENT=DELIMITED
  /FIRSTCASE=2
  /VARIABLES=
    Event_ID A32
    Year F4.0
    Month F2.0
    Day F2.0
    Date_NPT A10
    Time_NPT A8
    Magnitude F4.2
    Mag_Category F1.0
    Mag_Type A12
    Depth_km F5.1
    Depth_Class F1.0
    Latitude F8.4
    Longitude F8.4
    Epicenter A80
    Province_Code F1.0
    Source_Code F1.0
    Agreement_Code F1.0
    Source_Agency A50
    Agreement_Level A30
    Verification_URL A150 .
CACHE.
EXECUTE.

* Step 2: Assign Descriptive Variable Labels for SPSS .
VARIABLE LABELS
  Event_ID 'Seismic Event Unique Identifier'
  Year 'Year of Occurrence (NPT)'
  Month 'Month of Occurrence (1-12)'
  Day 'Day of Month (1-31)'
  Date_NPT 'Date in Nepal Standard Time (YYYY-MM-DD)'
  Time_NPT 'Time in Nepal Standard Time (HH:MM:SS)'
  Magnitude 'Earthquake Magnitude'
  Mag_Category 'Magnitude Classification Level'
  Mag_Type 'Magnitude Measurement Scale (Mw, Mb, Ml)'
  Depth_km 'Hypocenter Focal Depth in Kilometers'
  Depth_Class 'Depth Categorization (Shallow, Intermediate, Deep)'
  Latitude 'Epicenter Latitude Coordinate (Degrees North)'
  Longitude 'Epicenter Longitude Coordinate (Degrees East)'
  Epicenter 'Epicenter Geographical Location / District'
  Province_Code 'Federal Province of Nepal'
  Source_Code 'Primary Monitoring Agency Category'
  Agreement_Code 'Multi-Agency Verification Agreement Status'
  Source_Agency 'Observing Agencies (USGS, NEMRC, CENC)'
  Agreement_Level 'Scientific Verification Grade'
  Verification_URL 'Official Agency Bulletin Web Link' .

* Step 3: Define Categorical Value Labels for Analysis .
VALUE LABELS
  Mag_Category
    1 'Minor (< 4.0)'
    2 'Light (4.0 - 4.9)'
    3 'Moderate (5.0 - 5.9)'
    4 'Strong (6.0 - 6.9)'
    5 'Major (>= 7.0)'
  /Depth_Class
    1 'Shallow Focus (0 - 30 km)'
    2 'Intermediate Focus (31 - 70 km)'
    3 'Deep Focus (> 70 km)'
  /Province_Code
    1 'Koshi Province'
    2 'Madhesh Province'
    3 'Bagmati Province'
    4 'Gandaki Province'
    5 'Lumbini Province'
    6 'Karnali Province'
    7 'Sudurpashchim Province'
  /Source_Code
    1 'USGS Instrumental'
    2 'NEMRC National Seismological Centre'
    3 'Multi-Agency Consensus (USGS + NEMRC + CENC)'
    4 'BIPAD / Verified Bulletin'
  /Agreement_Code
    1 'Single Agency'
    2 'Dual Agency Instrumental'
    3 'Multi-Agency Consensus / Benchmark' .

* Step 4: Define Measurement Levels .
VARIABLE LEVEL
  Magnitude Depth_km Latitude Longitude (SCALE)
  /Mag_Category Depth_Class Agreement_Code (ORDINAL)
  /Year Month Day Province_Code Source_Code (NOMINAL) .

* Step 5: Run Automated Baseline Statistical Descriptives & Frequencies .
FREQUENCIES VARIABLES=Mag_Category Depth_Class Province_Code Source_Code Agreement_Code
  /STATISTICS=STDDEV VARIANCE MEAN MEDIAN MODE SKEWNESS
  /BARCHART FREQ
  /ORDER=ANALYSIS.

DESCRIPTIVES VARIABLES=Magnitude Depth_km
  /STATISTICS=MEAN STDDEV MIN MAX KURTOSIS SKEWNESS.

CROSSTABS
  /TABLES=Province_Code BY Mag_Category
  /FORMAT=AVALUE TABLES
  /STATISTICS=CHISQ
  /CELLS=COUNT ROW COLUMN TOTAL .

* Save Native SPSS .sav File .
SAVE OUTFILE='nepal_seismic_master.sav'
  /COMPRESSED.
EXECUTE.
"""

    out_sps = "public/nepal_seismic_import.sps"
    with open(out_sps, "w", encoding="utf-8") as f:
        f.write(sps_content)

    with open("nepal_seismic_import.sps", "w", encoding="utf-8") as f:
        f.write(sps_content)

    print(f"Generated SPSS Syntax script: {out_sps}")

    # 3. Try Direct .SAV File Generation via pyreadstat if available
    try:
        import pandas as pd
        import pyreadstat

        df = pd.DataFrame(records)
        column_labels = {
            "Event_ID": "Seismic Event Unique Identifier",
            "Year": "Year of Occurrence (NPT)",
            "Month": "Month of Occurrence",
            "Day": "Day of Month",
            "Date_NPT": "Date in Nepal Time",
            "Time_NPT": "Time in Nepal Time",
            "Magnitude": "Earthquake Magnitude",
            "Mag_Category": "Magnitude Classification Level",
            "Mag_Type": "Magnitude Scale Type",
            "Depth_km": "Focal Depth (km)",
            "Depth_Class": "Depth Classification",
            "Latitude": "Epicenter Latitude",
            "Longitude": "Epicenter Longitude",
            "Epicenter": "Location / District",
            "Province_Code": "Federal Province of Nepal",
            "Source_Code": "Monitoring Agency Category",
            "Agreement_Code": "Multi-Agency Agreement Status",
            "Source_Agency": "Reporting Agencies",
            "Agreement_Level": "Verification Status",
            "Verification_URL": "Agency Source Bulletin Link"
        }

        variable_value_labels = {
            "Mag_Category": {
                1: "Minor (< 4.0)",
                2: "Light (4.0 - 4.9)",
                3: "Moderate (5.0 - 5.9)",
                4: "Strong (6.0 - 6.9)",
                5: "Major (>= 7.0)"
            },
            "Depth_Class": {
                1: "Shallow (0-30 km)",
                2: "Intermediate (31-70 km)",
                3: "Deep (>70 km)"
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
            "Source_Code": {
                1: "USGS Instrumental",
                2: "NEMRC National Seismological Centre",
                3: "Multi-Agency Consensus",
                4: "BIPAD / Verified Bulletin"
            },
            "Agreement_Code": {
                1: "Single Agency",
                2: "Dual Agency Instrumental",
                3: "Multi-Agency Consensus"
            }
        }

        variable_measure = {
            "Magnitude": "scale",
            "Depth_km": "scale",
            "Latitude": "scale",
            "Longitude": "scale",
            "Mag_Category": "ordinal",
            "Depth_Class": "ordinal",
            "Agreement_Code": "ordinal",
            "Year": "nominal",
            "Month": "nominal",
            "Day": "nominal",
            "Province_Code": "nominal",
            "Source_Code": "nominal"
        }

        pyreadstat.write_sav(
            df,
            "public/nepal_seismic_master.sav",
            column_labels=column_labels,
            variable_value_labels=variable_value_labels,
            variable_measure=variable_measure
        )
        pyreadstat.write_sav(
            df,
            "nepal_seismic_master.sav",
            column_labels=column_labels,
            variable_value_labels=variable_value_labels,
            variable_measure=variable_measure
        )
        print("Generated native SPSS .SAV binary file: public/nepal_seismic_master.sav!")
    except Exception as e:
        print("Note: Native .sav generation through pyreadstat:", e)

if __name__ == "__main__":
    build_spss_dataset()
