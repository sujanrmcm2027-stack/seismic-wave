* ==============================================================================
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
