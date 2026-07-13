/**
 * Suraksha — Nepal Earthquake Safety Knowledge Base
 * Comprehensive rule-based chatbot that works on any hosting, no API key needed.
 */

export type ChatTurn = { role: "user" | "assistant"; content: string };

// ─── Knowledge base ─────────────────────────────────────────────────────────

const KB: { patterns: RegExp[]; response: string }[] = [
  // ── DURING EARTHQUAKE ────────────────────────────────────────────────────
  {
    patterns: [
      /shaking|tremor|quake.*now|during.*earthquake|earthquake.*happen|right now|what.*do.*earthquake|ground.*shak/i,
    ],
    response: `**Drop, Cover, and Hold On — right now.**

1. **DROP** to your hands and knees immediately.
2. **COVER** your head and neck under a sturdy table, desk, or against an interior wall — away from windows.
3. **HOLD ON** until shaking stops. Do not run outside while shaking continues.

If no shelter: crouch low, face away from windows, protect your head with your arms.
If outdoors: move away from buildings, trees, and power lines. Drop and stay low.
If in a vehicle: pull over away from overpasses and buildings. Stay inside with seatbelt on.

**After shaking stops:** expect aftershocks. Check yourself for injuries, then others.`,
  },

  // ── FIRST AID ────────────────────────────────────────────────────────────
  {
    patterns: [/first aid|injury|injur|wound|bleed|bleeding|crush|trauma|hurt|medical/i],
    response: `**Basic First Aid for Earthquake Injuries:**

**Bleeding:** Apply firm, direct pressure with a cloth. Do not remove. Elevate the limb if possible.

**Crush injuries:** Do NOT move the person unless there's immediate danger (fire, collapse risk). Call 102 (Ambulance) immediately.

**Head/neck/spine:** Keep the person still. Only move if life is at immediate risk.

**Dust inhalation:** Move to fresh air, cover nose and mouth with a damp cloth.

**Fractures:** Immobilize the limb with whatever is available (stick, rolled cloth). Do not try to straighten it.

**Burns:** Cool with clean running water for 10–20 min. Do not use ice, butter, or toothpaste.

🚑 **Ambulance: 102** | Police: 100 | National Emergency: 1149`,
  },

  // ── TRAPPED ──────────────────────────────────────────────────────────────
  {
    patterns: [/trap|stuck|buried|rubble|collapse|debris|under.*building|building.*fall/i],
    response: `**If you are trapped:**

1. Stay calm and conserve energy and oxygen.
2. **Do not light a match or lighter** — gas leaks may be present.
3. Cover your mouth with fabric to filter dust.
4. Tap on a pipe or wall — 3 taps, pause, repeat. This carries sound farther than shouting.
5. Shout only when you hear rescuers nearby.
6. If your phone works: **Call 1149** (National Emergency) or **100** (Police).

**If someone else is trapped:** Call 1149. Do not attempt structural rescue unless you are trained — secondary collapses are common.`,
  },

  // ── NEAREST SAFE ZONE ────────────────────────────────────────────────────
  {
    patterns: [/safe.?zone|evacuation|open.?space|where.*go|shelter|nearest|assembly/i],
    response: `**Finding Your Nearest Safe Zone:**

Enable **location access** in this portal and the map will show your 5 nearest safe open spaces with exact distances.

**Kathmandu Valley — major open spaces:**
- Tundikhel Ground, Kathmandu (central)
- Ratna Park, Kathmandu
- Patan Durbar Square open area, Lalitpur
- Bode Open Ground, Bhaktapur
- Kirtipur Ground, Kirtipur

**General guidance:** Head to the nearest wide-open ground — parks, sports fields, paddy fields — away from old brick buildings, slopes, and power lines.

**Outside Kathmandu:** Each district has at least one designated provincial safe zone. Contact your local ward office or check the District Disaster Management Committee.`,
  },

  // ── GAS / FIRE ───────────────────────────────────────────────────────────
  {
    patterns: [/gas|smell.*gas|fire|burn|flame|electric|power.?line|wire/i],
    response: `**Gas Leak:**
- Leave immediately — do not switch on/off any lights or use your phone inside.
- Leave the door open as you exit.
- Turn off the main gas valve outside if safe to do so.
- Call Nepal Electricity Authority: 1150 | Fire Brigade: **101**

**Fire:**
- Evacuate immediately. Close doors to slow the fire.
- Call **101** (Fire Brigade).
- Meet at your pre-agreed family assembly point.

**Downed power lines:**
- Stay at least 10 metres away.
- Never touch a downed line or anything it contacts.
- Call Nepal Electricity Authority: **1150**`,
  },

  // ── AFTERSHOCKS ──────────────────────────────────────────────────────────
  {
    patterns: [/aftershock|after.*quake|more.*quake|another.*quake|when.*next/i],
    response: `**Aftershocks are expected** after any significant earthquake — sometimes for days or weeks.

- Stay in open areas away from damaged structures.
- Do NOT re-enter a damaged building, even if it looks stable.
- Each aftershock can cause further collapse of weakened structures.
- Keep emergency supplies accessible.
- Follow official updates from the **National Earthquake Monitoring & Research Centre (NEMRC)**: nemrc.gov.np

I cannot predict when or how strong aftershocks will be — no one can. Stay cautious.`,
  },

  // ── GO BAG / PREPAREDNESS KIT ────────────────────────────────────────────
  {
    patterns: [/go.?bag|emergency kit|supply|supplies|prepare|checklist|72.?hour|survival kit/i],
    response: `**72-Hour Emergency Go-Bag Checklist:**

📦 **Essentials**
- Water: 3 litres per person per day (3-day supply minimum)
- Food: Non-perishable, no cooking needed (biscuits, dried fruit, nuts, canned goods)
- First aid kit with any personal medications (minimum 7-day supply)
- Torch/flashlight + extra batteries or hand-crank
- Battery-powered or hand-crank radio

📄 **Documents (waterproof bag)**
- Copies of ID, citizenship certificate, land documents
- Emergency contact list (written, not just on your phone)
- Some cash in small notes

🛠️ **Tools**
- Whistle (to signal rescuers)
- Dust masks / N95 respirators
- Work gloves and sturdy closed-toe shoes
- Warm clothing and emergency blanket

Store your bag near your exit. Review it every 6 months.`,
  },

  // ── DROP COVER HOLD ON ────────────────────────────────────────────────────
  {
    patterns: [/drop.*cover|cover.*hold|dcho|drill|nepal shakeout|shakeout/i],
    response: `**Drop, Cover, and Hold On (DCHO):**

This is the globally proven response to earthquake shaking:

1. **DROP** to hands and knees (protects against being knocked over)
2. **COVER** your head and neck under a sturdy desk or table, or next to an interior wall
3. **HOLD ON** until shaking completely stops — usually 10–60 seconds

**Nepal ShakeOut:** Nepal participates in the annual ShakeOut drill (usually October). It's a nationwide practice of DCHO — encourage your school, office, and family to participate.

Visit the **Preparedness** page on this portal for a full drill guide and family planning resources.`,
  },

  // ── FAMILY PLAN ──────────────────────────────────────────────────────────
  {
    patterns: [/family plan|emergency plan|contact.*family|family.*contact|meet.*point|assembly.?point|communicate/i],
    response: `**Family Emergency Plan — 5 steps:**

1. **Choose two meeting spots:** one just outside your home, one farther away (a neighbour's house or local school) in case you can't return home.

2. **Designate an out-of-area contact** — it's often easier to call someone far away than to reach family locally when local lines are overloaded.

3. **Write down all emergency numbers** on paper — phone batteries die. Include: Police 100, Fire 101, Ambulance 102, National Emergency 1149.

4. **Know how to shut off** gas, electricity, and water at the main valve in your home.

5. **Practice once a year** — walk through the plan with every household member, including children.`,
  },

  // ── REPORT DAMAGE ────────────────────────────────────────────────────────
  {
    patterns: [/report.*damage|damage.*report|how.*report|ddn|assessment|incident/i],
    response: `**How to Report Earthquake Damage:**

📍 Use the **Damage Assessment** page on this portal to submit a geo-tagged incident report — your location, damage type, and severity are logged directly into the database.

📞 **Official channels:**
- NDRRMA (National Disaster Risk Reduction and Management Authority): 01-4200178
- Local ward office (your municipality)
- Nepal Police: 100

📸 If safe to do so, photograph damage before clearing it — this helps official assessment teams and insurance claims.

Your report helps emergency responders prioritise areas with the most need.`,
  },

  // ── WATER / FOOD SAFETY ──────────────────────────────────────────────────
  {
    patterns: [/water|food|drink|safe.*eat|contaminate|sanitation|hygiene/i],
    response: `**Water & Food Safety After an Earthquake:**

**Water:**
- Do not use tap water until local authorities confirm it is safe (pipes may have cracked and contaminated it).
- Use stored water, sealed bottled water, or boil water for at least 1 minute.
- Purification tablets are helpful if you have them.

**Food:**
- Discard any food that has been in contact with floodwater or debris.
- Use perishable food from the refrigerator first (stays safe about 4 hours after power loss).
- Discard food if you are unsure — do not risk food poisoning on top of earthquake stress.

**Sanitation:**
- Use a designated latrine area away from water sources if sewage lines are broken.
- Wash hands frequently, especially before eating.`,
  },

  // ── MENTAL HEALTH ────────────────────────────────────────────────────────
  {
    patterns: [/stress|trauma|anxiety|fear|scare|scared|panic|mental|emotional|cope|coping|ptsd|nightmare|sleep/i],
    response: `**Coping After an Earthquake — it's normal to feel shaken:**

Anxiety, nightmares, hypervigilance, and grief are all normal responses to a frightening event. This does not mean you are weak.

**Immediate steps:**
- Stay connected with family and community — isolation makes trauma worse.
- Limit news and social media to specific times (constant updates increase anxiety).
- Maintain routine as much as possible — meals, sleep, simple tasks.
- Breathe slowly: 4 counts in, hold 4, out 4. Repeat.

**For children:** Let them talk about what happened. Reassure them they are safe. Keep routines consistent.

**If symptoms persist beyond 2–3 weeks** (flashbacks, inability to function, severe depression): seek professional help. TPO Nepal provides psychosocial support: 01-4460813.`,
  },

  // ── NEPAL EARTHQUAKE HISTORY ─────────────────────────────────────────────
  {
    patterns: [/history|historical|1934|2015|gorkha|past.*earthquake|earthquake.*history|nepal.*quake.*past/i],
    response: `**Major Earthquakes in Nepal:**

📅 **1934 — Bihar-Nepal Earthquake (M8.0)**
One of the deadliest in South Asia. Destroyed much of Kathmandu, Bhaktapur, and Patan. Over 8,500 deaths in Nepal.

📅 **1988 — Udayapur Earthquake (M6.9)**
~1,000 deaths, significant damage in eastern Nepal.

📅 **2015 — Gorkha Earthquake (M7.8) + M7.3 aftershock**
Nearly 9,000 deaths, ~22,000 injuries, over 600,000 homes destroyed. Sindhupalchok, Nuwakot, Rasuwa, and Kathmandu Valley were worst hit. Triggered avalanches on Langtang and Everest.

📅 **2023 — Jajarkot Earthquake (M6.4)**
~153 deaths, over 370 injuries, widespread damage in Karnali Province.

Nepal sits on the boundary of the Indian and Eurasian tectonic plates — one of the most seismically active regions in the world.

Visit the **Historical** page on this portal for the full interactive timeline.`,
  },

  // ── EMERGENCY CONTACTS ────────────────────────────────────────────────────
  {
    patterns: [/emergency.*contact|contact.*emergency|phone.*number|call|helpline|hotline|number.*call/i],
    response: `**Nepal Emergency Contacts:**

| Service | Number |
|---------|--------|
| 🚔 Police | **100** |
| 🚒 Fire Brigade | **101** |
| 🚑 Ambulance | **102** |
| 🆘 National Emergency | **1149** |
| 🏛 NDRRMA | 01-4200178 |
| 🔴 Red Cross Nepal | 01-4270650 |
| ⚡ Nepal Electricity Authority | **1150** |
| 🧠 TPO Nepal (Psychosocial) | 01-4460813 |

Save these on paper — phone batteries die in an emergency.`,
  },

  // ── WHAT IS THIS PORTAL ────────────────────────────────────────────────────
  {
    patterns: [/what.*portal|about.*portal|this.*website|what.*site|who.*built|purpose/i],
    response: `**Nepal Seismic Portal** is a public-interest platform built to reduce earthquake casualties and improve community resilience across Nepal.

**Features:**
- 📡 Live earthquake feed (USGS + NEMRC data)
- 🗺 Safe zone map — 83+ named evacuation grounds across Nepal
- 📊 Historical earthquake timeline
- 📋 Damage assessment & incident reporting
- 📚 Preparedness guides and drills
- 🧪 Test Yourself — earthquake knowledge quiz

**Team:** Sujan Rayamajhi (Project Lead), Pramod Ghimire, Som Prasad Sapkota, Dhan Raj Tamang.

Visit the **About** page for more details.`,
  },

  // ── GREETING ─────────────────────────────────────────────────────────────
  {
    patterns: [/^(hi|hello|hey|namaste|good\s*(morning|afternoon|evening)|howdy|greetings)/i],
    response: `Namaste! 🙏 I'm **Suraksha**, your Nepal earthquake safety assistant.

I can help you with:
- 🆘 What to do **during** an earthquake (Drop, Cover, Hold On)
- 🏥 First aid for common earthquake injuries
- 🗺 Finding your **nearest safe zone**
- 🎒 Emergency **go-bag** checklist
- 📋 **Reporting** damage
- 📞 **Emergency contact** numbers
- 🧠 Earthquake **history** in Nepal

What would you like to know?`,
  },

  // ── THANK YOU ────────────────────────────────────────────────────────────
  {
    patterns: [/thank|thanks|dhanyabad|helpful|great|good.*answer|perfect/i],
    response: `You're welcome! 🙏 Stay safe and prepared.

Is there anything else I can help you with? You can ask about:
- First aid · Safe zones · Emergency contacts
- Go-bag checklist · Family emergency plan
- What to do during shaking · Aftershocks`,
  },
];

// ─── Fallback ────────────────────────────────────────────────────────────────

const FALLBACK = `I'm not sure I understood that — I'm specialised in earthquake safety for Nepal.

Try asking me about:
- **"What do I do during an earthquake?"**
- **"Give me first aid tips"**
- **"Where is my nearest safe zone?"**
- **"Show me emergency contacts"**
- **"Give me a go-bag checklist"**
- **"How do I make a family emergency plan?"**

For life-threatening emergencies, call **1149** (National Emergency) or **100** (Police).`;

// ─── Matching engine ─────────────────────────────────────────────────────────

export function getLocalReply(userText: string): string {
  const input = userText.trim();
  for (const { patterns, response } of KB) {
    if (patterns.some((pattern) => pattern.test(input))) {
      return response;
    }
  }
  return FALLBACK;
}
