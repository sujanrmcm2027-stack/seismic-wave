import { useState, useEffect } from "react";
import { CheckSquare, Square, Printer, AlertTriangle } from "lucide-react";
import { useCrisisMode } from "@/hooks/useCrisisMode";

type ChecklistItem = {
  id: string;
  category: string;
  label: string;
  description: string;
};

const ITEMS_EN: ChecklistItem[] = [
  { id: "water", category: "Essentials", label: "Water (3 Days)", description: "1 gallon per person, per day." },
  { id: "food", category: "Essentials", label: "Dry Foods (Chura, Wai Wai, Biscuits)", description: "Non-perishable, easy-to-prepare items." },
  { id: "torch", category: "Essentials", label: "Torchlight & Extra Batteries", description: "Avoid candles due to gas leak risks after a quake." },
  { id: "firstaid", category: "Health", label: "Basic First Aid Kit", description: "Bandages, antiseptics, pain relievers, and personal medications." },
  { id: "whistle", category: "Safety", label: "Emergency Whistle", description: "To signal for help if trapped." },
  { id: "docs", category: "Important", label: "Copies of Citizenship/Passports", description: "Stored in a waterproof bag." },
  { id: "cash", category: "Important", label: "Emergency Cash", description: "Small bills, as ATMs may be down." },
  { id: "clothes", category: "Comfort", label: "Sturdy Shoes & Warm Clothes", description: "For safe evacuation over debris." },
];

const ITEMS_NE: ChecklistItem[] = [
  { id: "water", category: "Essentials", label: "पानी (३ दिनको लागि)", description: "प्रति व्यक्ति, प्रति दिन लगभग ४ लिटर।" },
  { id: "food", category: "Essentials", label: "सुख्खा खानेकुरा (चिउरा, चाउचाउ, बिस्कुट)", description: "नबिग्रिने र पकाउन नपर्ने खानेकुरा।" },
  { id: "torch", category: "Essentials", label: "टर्चलाइट र अतिरिक्त ब्याट्रीहरू", description: "भूकम्पपछि ग्यास चुहावट हुन सक्ने भएकाले मैनबत्ती प्रयोग नगर्नुहोस्।" },
  { id: "firstaid", category: "Health", label: "प्राथमिक उपचार बक्स", description: "ब्यान्डेज, एन्टिसेप्टिक, दुखाइ कम गर्ने औषधि र व्यक्तिगत औषधिहरू।" },
  { id: "whistle", category: "Safety", label: "आपतकालीन सिट्ठी", description: "फसेको खण्डमा उद्धारको लागि संकेत दिन।" },
  { id: "docs", category: "Important", label: "नागरिकता/पासपोर्टको प्रतिलिपि", description: "पानी नपस्ने झोलामा सुरक्षित राख्नुहोस्।" },
  { id: "cash", category: "Important", label: "आपतकालीन नगद", description: "साना नोटहरू राख्नुहोस्, किनकि एटीएम नचल्न सक्छ।" },
  { id: "clothes", category: "Comfort", label: "बलियो जुत्ता र न्यानो कपडा", description: "भत्किएको भग्नावशेषमा सुरक्षित हिँड्नको लागि।" },
];

const uiText = {
  en: {
    printHeader: "My Emergency Go-Bag Plan",
    printSub: "Preparedness checklist for family safety. Keep this near your emergency kit.",
    checklistTitle: "72-Hour \"Go-Bag\" Checklist",
    checklistDesc: "Track your emergency survival kit items. Your progress is saved automatically.",
    readiness: "Readiness",
    categoryMap: (c: string) => c,
    printContactsTitle: "Emergency Contacts",
    famContact: "Family Contact:",
    meetingPoint: "Meeting Point:",
    police: "Nepal Police:",
    fire: "Fire Brigade:",
    ambulance: "Ambulance:",
    printBtn: "Download / Print My Plan"
  },
  ne: {
    printHeader: "मेरो आपतकालीन झोला योजना",
    printSub: "परिवारको सुरक्षाका लागि पूर्वतयारी चेकलिस्ट। यसलाई आफ्नो आपतकालीन झोलासँगै राख्नुहोस्।",
    checklistTitle: "७२-घण्टे आपतकालीन झोला चेकलिस्ट",
    checklistDesc: "आफ्नो आपतकालीन झोलाका सामानहरू ट्र्याक गर्नुहोस्। तपाईंको प्रगति आफै सुरक्षित हुन्छ।",
    readiness: "तयारी",
    categoryMap: (c: string) => {
      const map: Record<string, string> = {
        "Essentials": "अत्यावश्यक",
        "Health": "स्वास्थ्य",
        "Safety": "सुरक्षा",
        "Important": "महत्त्वपूर्ण",
        "Comfort": "आराम"
      };
      return map[c] || c;
    },
    printContactsTitle: "आपतकालीन सम्पर्कहरू",
    famContact: "पारिवारिक सम्पर्क:",
    meetingPoint: "भेट्ने सुरक्षित स्थान:",
    police: "नेपाल प्रहरी:",
    fire: "दमकल:",
    ambulance: "एम्बुलेन्स:",
    printBtn: "मेरो योजना डाउनलोड / प्रिन्ट गर्नुहोस्"
  }
} as const;

export function PreparednessChecklist() {
  const { lang } = useCrisisMode();
  const ITEMS = lang === "ne" ? ITEMS_NE : ITEMS_EN;
  const t = uiText[lang];
  
  const [checkedItems, setCheckedItems] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("gobag_checklist");
    if (saved) setCheckedItems(JSON.parse(saved));
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("gobag_checklist", JSON.stringify(checkedItems));
    }
  }, [checkedItems, isLoaded]);

  const toggleItem = (id: string) => {
    setCheckedItems((prev) => 
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const progress = Math.round((checkedItems.length / ITEMS.length) * 100);

  const categories = Array.from(new Set(ITEMS.map(i => i.category)));

  const handlePrint = () => {
    window.print();
  };

  if (!isLoaded) return null;

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden gobag-container print:border-none print:shadow-none">
      
      {/* Print-only Header */}
      <div className="hidden print:block text-black p-8 pb-4">
        <h1 className="text-3xl font-serif font-bold border-b-2 border-black pb-2 mb-4">{t.printHeader}</h1>
        <p className="text-sm">{t.printSub}</p>
      </div>

      <div className="bg-surface/60 border-b border-border p-5 md:p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:bg-transparent print:border-none print:p-8 print:pt-0">
        <div>
          <h2 className="font-serif text-2xl font-bold text-foreground flex items-center gap-2 print:hidden">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            {t.checklistTitle}
          </h2>
          <p className="text-sm text-muted-foreground mt-1 print:hidden">
            {t.checklistDesc}
          </p>
        </div>
        
        <div className="w-full md:w-48 shrink-0 print:hidden">
          <div className="flex justify-between text-xs font-semibold mb-1 text-foreground">
            <span>{t.readiness}</span>
            <span className={progress === 100 ? "text-emerald-500" : ""}>{progress}%</span>
          </div>
          <div className="h-2.5 w-full bg-background rounded-full overflow-hidden border border-border">
            <div 
              className={`h-full transition-all duration-500 ${progress === 100 ? "bg-emerald-500" : "bg-primary"}`} 
              style={{ width: `${progress}%` }} 
            />
          </div>
        </div>
      </div>

      <div className="p-5 md:p-6 print:p-8">
        <div className="grid md:grid-cols-2 print:grid-cols-2 gap-6 md:gap-8">
          {categories.map((category) => (
            <div key={category} className="space-y-3 break-inside-avoid">
              <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-primary border-b border-border pb-1 print:text-black print:border-black">
                {t.categoryMap(category)}
              </h3>
              <div className="space-y-2">
                {ITEMS.filter(i => i.category === category).map((item) => (
                  <label 
                    key={item.id} 
                    className="flex items-start gap-3 p-2 -ml-2 rounded hover:bg-surface/50 cursor-pointer transition-colors group print:hover:bg-transparent"
                  >
                    <input 
                      type="checkbox" 
                      className="sr-only"
                      checked={checkedItems.includes(item.id)}
                      onChange={() => toggleItem(item.id)}
                    />
                    <div className="mt-0.5 text-primary shrink-0 print:text-black">
                      {checkedItems.includes(item.id) 
                        ? <CheckSquare className="w-5 h-5" />
                        : <Square className="w-5 h-5 opacity-40 group-hover:opacity-100 transition-opacity" />
                      }
                    </div>
                    <div>
                      <div className={`text-sm font-semibold transition-colors print:text-black ${checkedItems.includes(item.id) ? "text-muted-foreground line-through print:no-underline print:text-black" : "text-foreground"}`}>
                        {item.label}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5 print:text-gray-600">
                        {item.description}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Print-only Emergency Contacts */}
        <div className="hidden print:block mt-6 pt-6 border-t-2 border-black">
          <h3 className="font-serif text-xl font-bold mb-4 text-black">{t.printContactsTitle}</h3>
          <div className="grid grid-cols-2 gap-6 text-sm text-black">
            <div className="border border-black p-4 rounded">
              <strong>{t.famContact}</strong>
              <div className="border-b border-dashed border-gray-400 mt-4 mb-2 h-4"></div>
              <div className="border-b border-dashed border-gray-400 mb-2 h-4"></div>
            </div>
            <div className="border border-black p-4 rounded">
              <strong>{t.meetingPoint}</strong>
              <div className="border-b border-dashed border-gray-400 mt-4 mb-2 h-4"></div>
              <div className="border-b border-dashed border-gray-400 mb-2 h-4"></div>
            </div>
            <div className="leading-relaxed">
              <strong>{t.police}</strong> 100<br/>
              <strong>{t.fire}</strong> 101<br/>
              <strong>{t.ambulance}</strong> 102
            </div>
            <div className="leading-relaxed">
              <strong>DEOC (MoHA):</strong> 1234<br/>
              <strong>APF Disaster Management:</strong> 1114<br/>
              <strong>NRCS Emergency Center:</strong> 1130
            </div>
          </div>
        </div>
      </div>

      <div className="bg-surface/30 p-4 border-t border-border flex justify-end print:hidden">
        <button 
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 transition-colors"
        >
          <Printer className="w-4 h-4" /> {t.printBtn}
        </button>
      </div>
    </div>
  );
}
