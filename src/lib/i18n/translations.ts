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
    "infra.source": "Data: navigate.dor.gov.np (DOR Nepal) — Reference data, verify live for latest closures",
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
    "crisisbar.lite_on": "⚡ लाइट मोड सक्रिय",
    "crisisbar.lite_off": "⚡ लाइट मोड",
    "crisisbar.lite_hint": "ढिलो इन्टरनेटमा छिटो खुल्नेछ",
    "crisisbar.lang": "EN",

    // Alert Banner
    "banner.live_advisory": "ताजा जानकारी",
    "banner.critical": "गम्भीर चेतावनी",
    "banner.monitoring": "अनुगमन भइरहेको छ - हाल कुनै गम्भीर चेतावनी छैन।",
    "banner.updated": "अपडेट गरिएको",
    "banner.offline": "अफलाइन",

    // Status indicators
    "status.green": "● भूकम्पीय गतिविधिहरूको अनुगमन भइरहेको छ… पछिल्लो ३ घण्टामा कुनै ठूलो भूकम्प गएको छैन।",
    "status.amber": "⚠ उच्च भूकम्पीय गतिविधि मापन गरिएको छ। सतर्क रहनुहोला।",
    "status.red": "🔴 ठूलो भूकम्प मापन गरिएको छ। सुरक्षित स्थानमा रहनुहोला र आपतकालीन नियमहरूको पालना गर्नुहोला।",
    "status.loading": "● भूकम्प नेटवर्कसँग जोडिँदै छ…",
    "status.source_usgs": "स्रोत: USGS",
    "status.source_nemrc": "स्रोत: NEMRC (वैकल्पिक)",
    "status.source_cache": "स्रोत: क्यास डेटा",

    // Safety Reporter
    "reporter.title": "समुदायको अवस्था रिपोर्ट",
    "reporter.subtitle": "आफ्नो अवस्था तुरुन्तै जानकारी गराउनुहोस् - दर्ता आवश्यक छैन।",
    "reporter.safe": "म सुरक्षित छु",
    "reporter.safe_sub": "I AM SAFE",
    "reporter.help": "मलाई मद्दत चाहिन्छ",
    "reporter.help_sub": "NEED ASSISTANCE",
    "reporter.safe_count": "सुरक्षित भएको जानकारी",
    "reporter.help_count": "सहायता अनुरोध",
    "reporter.note": "यो जानकारी प्रणालीको लागि मात्र हो - आधिकारिक उद्धारको लागि कृपया ११४९ मा सम्पर्क गर्नुहोस्।",
    "reporter.thankyou_safe": "✓ तपाईं सुरक्षित हुनुहुन्छ भन्ने जानकारी प्राप्त भयो। सुरक्षित स्थानमै रहनुहोला।",
    "reporter.thankyou_help": "⚠ तपाईंको सहायता अनुरोध प्राप्त भयो। कृपया तुरुन्तै ११४९ मा पनि सम्पर्क गर्नुहोला।",

    // Infrastructure Status
    "infra.title": "पूर्वाधारको ताजा अवस्था",
    "infra.subtitle": "प्रमुख सडक, विमानस्थल र अस्पतालको अवस्था - प्रत्येक १५ मिनेटमा अपडेट हुन्छ",
    "infra.roads": "सडक",
    "infra.airports": "विमानस्थल",
    "infra.hospitals": "अस्पताल",
    "infra.open": "खुला",
    "infra.partial": "आंशिक",
    "infra.closed": "बन्द",
    "infra.source": "स्रोत: navigate.dor.gov.np (सडक विभाग) — पछिल्लो अवस्थाको लागि आधिकारिक जानकारी जाँच गर्नुहोस्।",
    "infra.beds": "बेड उपलब्ध",

    // Emergency Contacts Bar
    "contacts.title": "आपतकालीन सम्पर्क",
    "contacts.tap": "कल गर्न यहाँ थिच्नुहोस्",
    "contacts.collapse": "लुकाउनुहोस्",
    "contacts.expand": "आपतकालीन सम्पर्क",

    // Homepage
    "home.seismic_monitor": "लाइभ भूकम्प अनुगमन",
    "home.latest_mag": "पछिल्लो म्याग्निच्युड",
    "home.events": "भूकम्पहरू",
    "home.no_quakes": "● भूकम्पीय गतिविधिहरूको अनुगमन भइरहेको छ… पछिल्लो ३ घण्टामा कुनै ठूलो भूकम्प गएको छैन।",
    "home.lite_events_title": "पछिल्ला भूकम्पहरू - नेपाल",
    "home.lite_mag": "म्याग्निच्युड",
    "home.lite_location": "स्थान",
    "home.lite_time": "समय (NPT)",
    "home.lite_depth": "गहिराई",
    "home.lite_no_events": "हालसालै कुनै भूकम्प गएको छैन। प्रणालीद्वारा निरन्तर अनुगमन भइरहेको छ।",
  },
};

export function t(key: string, lang: Lang): string {
  return T[lang][key] ?? T["en"][key] ?? key;
}
