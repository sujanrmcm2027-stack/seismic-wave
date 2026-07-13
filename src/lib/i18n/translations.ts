import type { Lang } from "@/hooks/useCrisisMode";

type TranslationMap = Record<string, string>;
type Translations = Record<Lang, TranslationMap>;

export const T: Translations = {
  en: {
    // Crisis Bar
    "crisisbar.live": "LIVE CRISIS DASHBOARD",
    "crisisbar.lite_on": "⚡ LITE MODE ON",
    "crisisbar.lite_off": "⚡ LITE MODE",
    "crisisbar.lite_hint": "Strips heavy JS - faster on slow networks",
    "crisisbar.lang": "NE",

    // Alert Banner
    "banner.live_advisory": "LIVE ADVISORY",
    "banner.critical": "CRITICAL ALERT",
    "banner.monitoring": "Monitoring active - no critical advisories at this time.",
    "banner.updated": "Updated",
    "banner.offline": "OFFLINE",

    // Status indicators
    "status.green": "● Monitoring live fault lines… No major tremors detected in the last 3 hours",
    "status.amber": "⚠ Elevated seismic activity detected. Stay alert.",
    "status.red": "🔴 SIGNIFICANT SEISMIC EVENT DETECTED. Follow emergency protocols.",
    "status.loading": "● Connecting to seismic network…",
    "status.source_usgs": "Source: USGS",
    "status.source_nemrc": "Source: NEMRC (Fallback)",
    "status.source_cache": "Source: Cached data",

    // Safety Reporter
    "reporter.title": "COMMUNITY STATUS REPORT",
    "reporter.subtitle": "Tap to instantly report your status - no registration required.",
    "reporter.safe": "I AM SAFE",
    "reporter.safe_sub": "मैं सुरक्षित छु",
    "reporter.help": "NEED ASSISTANCE",
    "reporter.help_sub": "सहायता चाहिन्छ",
    "reporter.safe_count": "Safe reports",
    "reporter.help_count": "Assistance requests",
    "reporter.note": "Session reports only - for official rescue, call 1149",
    "reporter.thankyou_safe": "✓ Your safe status has been recorded. Stay in a secure location.",
    "reporter.thankyou_help": "⚠ Assistance request noted. Please also call 1149 immediately.",

    // Infrastructure Status
    "infra.title": "LIVE INFRASTRUCTURE STATUS",
    "infra.subtitle": "Critical road, airport & hospital status - updated every 15 min",
    "infra.roads": "ROADS",
    "infra.airports": "AIRPORTS",
    "infra.hospitals": "HOSPITALS",
    "infra.open": "Open",
    "infra.partial": "Partial",
    "infra.closed": "Closed",
    "infra.source": "Data: NDRRMA/Nepal Police API endpoint (mock - update with live feed)",
    "infra.beds": "beds available",

    // Emergency Contacts Bar
    "contacts.title": "EMERGENCY CONTACTS",
    "contacts.tap": "TAP TO CALL",
    "contacts.collapse": "Hide",
    "contacts.expand": "Emergency Contacts",

    // Homepage
    "home.seismic_monitor": "Live Seismic Monitor",
    "home.latest_mag": "Latest Magnitude",
    "home.events": "events",
    "home.no_quakes": "● Monitoring live fault lines… No major tremors detected in the last 3 hours.",
    "home.lite_events_title": "RECENT SEISMIC EVENTS - Nepal",
    "home.lite_mag": "Mag",
    "home.lite_location": "Location",
    "home.lite_time": "Time (NPT)",
    "home.lite_depth": "Depth",
    "home.lite_no_events": "No recent seismic events recorded. System monitoring active.",
  },

  ne: {
    // Crisis Bar
    "crisisbar.live": "लाइभ संकट ड्याशबोर्ड",
    "crisisbar.lite_on": "⚡ लाइट मोड चालू",
    "crisisbar.lite_off": "⚡ लाइट मोड",
    "crisisbar.lite_hint": "ढिलो नेटवर्कमा छिटो लोड हुन्छ",
    "crisisbar.lang": "EN",

    // Alert Banner
    "banner.live_advisory": "लाइभ सूचना",
    "banner.critical": "गम्भीर चेतावनी",
    "banner.monitoring": "अनुगमन सक्रिय - हाल कुनै गम्भीर सूचना छैन।",
    "banner.updated": "अपडेट",
    "banner.offline": "अफलाइन",

    // Status indicators
    "status.green": "● भूकम्प रेखाहरू अनुगमन भइरहेको छ… पछिल्लो ३ घण्टामा कुनै ठूलो भूकम्प छैन",
    "status.amber": "⚠ उच्च भूकम्पीय गतिविधि पत्ता लागेको छ। सतर्क रहनुहोस्।",
    "status.red": "🔴 महत्त्वपूर्ण भूकम्पीय घटना पत्ता लागेको छ। आपतकालीन प्रोटोकल पालना गर्नुहोस्।",
    "status.loading": "● भूकम्प नेटवर्कमा जडान भइरहेको छ…",
    "status.source_usgs": "स्रोत: USGS",
    "status.source_nemrc": "स्रोत: NEMRC (वैकल्पिक)",
    "status.source_cache": "स्रोत: क्यास डेटा",

    // Safety Reporter
    "reporter.title": "सामुदायिक स्थिति रिपोर्ट",
    "reporter.subtitle": "आफ्नो स्थिति तुरुन्तै रिपोर्ट गर्नुहोस् - दर्ता आवश्यक छैन।",
    "reporter.safe": "म सुरक्षित छु",
    "reporter.safe_sub": "I AM SAFE",
    "reporter.help": "सहायता चाहिन्छ",
    "reporter.help_sub": "NEED ASSISTANCE",
    "reporter.safe_count": "सुरक्षित रिपोर्ट",
    "reporter.help_count": "सहायता अनुरोध",
    "reporter.note": "सत्र रिपोर्ट मात्र - आधिकारिक उद्धारका लागि ११४९ मा फोन गर्नुहोस्",
    "reporter.thankyou_safe": "✓ तपाईंको सुरक्षित स्थिति रेकर्ड गरियो। सुरक्षित ठाउँमा रहनुहोस्।",
    "reporter.thankyou_help": "⚠ सहायता अनुरोध नोट गरियो। कृपया तुरुन्तै ११४९ मा पनि फोन गर्नुहोस्।",

    // Infrastructure Status
    "infra.title": "लाइभ पूर्वाधार स्थिति",
    "infra.subtitle": "महत्त्वपूर्ण सडक, विमानस्थल र अस्पताल स्थिति - हरेक १५ मिनेटमा अपडेट",
    "infra.roads": "सडकहरू",
    "infra.airports": "विमानस्थलहरू",
    "infra.hospitals": "अस्पतालहरू",
    "infra.open": "खुला",
    "infra.partial": "आंशिक",
    "infra.closed": "बन्द",
    "infra.source": "डेटा: NDRRMA/नेपाल प्रहरी API (नमूना - लाइभ फिडसँग अपडेट गर्नुहोस्)",
    "infra.beds": "बेड उपलब्ध",

    // Emergency Contacts Bar
    "contacts.title": "आपतकालीन सम्पर्क",
    "contacts.tap": "कल गर्न थिच्नुहोस्",
    "contacts.collapse": "लुकाउनुहोस्",
    "contacts.expand": "आपतकालीन सम्पर्क",

    // Homepage
    "home.seismic_monitor": "लाइभ भूकम्प अनुगमन",
    "home.latest_mag": "पछिल्लो तीव्रता",
    "home.events": "घटनाहरू",
    "home.no_quakes": "● भूकम्प रेखाहरू अनुगमन भइरहेको छ… पछिल्लो ३ घण्टामा कुनै ठूलो भूकम्प छैन।",
    "home.lite_events_title": "पछिल्ला भूकम्प घटनाहरू - नेपाल",
    "home.lite_mag": "तीव्रता",
    "home.lite_location": "स्थान",
    "home.lite_time": "समय (NPT)",
    "home.lite_depth": "गहिराई",
    "home.lite_no_events": "हालैका कुनै भूकम्प घटना छैनन्। प्रणाली अनुगमन सक्रिय छ।",
  },
};

export function t(key: string, lang: Lang): string {
  return T[lang][key] ?? T["en"][key] ?? key;
}
