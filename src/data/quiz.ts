export type Question = {
  q: string;
  options: string[];
  answer: number;
  category: "Knowledge" | "Emergency Planning" | "Emergency Supplies" | "Family Communication" | "Evacuation Awareness";
  explanation?: string;
};

export const QUESTIONS: Question[] = [
  { category: "Knowledge", q: "What does the Richter scale measure?", options: ["Wind speed and direction", "Earthquake magnitude (energy released)", "Flood intensity", "Volcanic ash density"], answer: 1 },
  { category: "Knowledge", q: "Which plate boundary causes most Nepali earthquakes?", options: ["Pacific Ring of Fire", "Mid-Atlantic Ridge", "Indian–Eurasian collision (Main Himalayan Thrust)", "San Andreas Fault"], answer: 2 },
  { category: "Knowledge", q: "The 2015 Gorkha earthquake had a magnitude of:", options: ["M6.4", "M7.8", "M8.5", "M5.9"], answer: 1 },
  { category: "Knowledge", q: "Soft sediment basins like Kathmandu Valley:", options: ["Reduce shaking", "Amplify seismic waves", "Have no effect", "Eliminate aftershocks"], answer: 1 },
  { category: "Emergency Planning", q: "The recommended immediate action during shaking is:", options: ["Run outside immediately", "Stand in a doorway", "Drop, Cover, Hold On", "Use the elevator"], answer: 2 },
  { category: "Emergency Planning", q: "How often should families practice earthquake drills?", options: ["Once in a lifetime", "Every 5 years", "At least twice a year", "Only after an earthquake"], answer: 2 },
  { category: "Emergency Planning", q: "Do you have an identified safe meeting point outside your home?", options: ["Yes, everyone knows it", "Vaguely discussed", "No", "Not applicable"], answer: 0 },
  { category: "Emergency Planning", q: "Has your building been assessed against NBC 2020?", options: ["Yes, certified compliant", "Built post-2015 but not certified", "Pre-2015, unassessed", "Don't know"], answer: 0 },
  { category: "Emergency Supplies", q: "Recommended water storage per person per day:", options: ["0.5 L", "1 L", "3 L", "10 L"], answer: 2 },
  { category: "Emergency Supplies", q: "How many hours of supplies should a household stock?", options: ["12 hours", "24 hours", "72 hours", "1 week"], answer: 2 },
  { category: "Emergency Supplies", q: "A complete kit should include:", options: ["Only water and food", "Water, food, first aid, torch, radio, documents, cash", "Just a phone charger", "Tools and weapons"], answer: 1 },
  { category: "Emergency Supplies", q: "Where should your emergency kit be stored?", options: ["Top floor closet", "Locked basement", "Near the main exit, easily reachable", "In the car only"], answer: 2 },
  { category: "Family Communication", q: "Best out-of-area contact method when local networks fail:", options: ["Voice call", "SMS / data to an out-of-region contact", "Letter", "Wait for someone to call you"], answer: 1 },
  { category: "Family Communication", q: "Every family member should know:", options: ["Only the parents' numbers", "An out-of-area contact and meeting point", "Just the home address", "Nothing — adults handle it"], answer: 1 },
  { category: "Family Communication", q: "How often should you review the family plan?", options: ["Never", "Every 5 years", "Annually or after major life changes", "Only after disasters"], answer: 2 },
  { category: "Evacuation Awareness", q: "If outdoors during shaking, you should:", options: ["Run to the nearest building", "Stay close to walls", "Move to open ground away from buildings and power lines", "Lie flat on a road"], answer: 2 },
  { category: "Evacuation Awareness", q: "Elevators during/after a quake are:", options: ["Safe to use", "Faster than stairs", "Never to be used", "Fine if cleared by guard"], answer: 2 },
  { category: "Evacuation Awareness", q: "If you smell gas after a quake you should:", options: ["Light a match to check", "Open windows, shut off the valve, leave and call authorities", "Ignore it", "Continue cooking"], answer: 1 },
  { category: "Evacuation Awareness", q: "When can you re-enter a visibly damaged building?", options: ["Right after shaking stops", "Within 1 hour", "Only after authorities or an engineer clear it", "Never"], answer: 2 },
  { category: "Knowledge", q: "Aftershocks typically:", options: ["Never happen", "Only happen once", "Can continue for days, weeks, or months", "Are stronger than the mainshock"], answer: 2 },
];
