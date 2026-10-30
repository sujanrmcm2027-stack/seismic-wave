* ==============================================================================
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
