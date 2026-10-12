// What the checklist tracks. Same list as the web version.
// main / alt: how many per week (or day) on a main and on an alt; 0 hides it.
// daily: true resets at the daily reset even inside a weekly section.
// stepper: show − / + instead of boxes. subOnly: only with a subscription.
window.CHECKLIST = {
  sections: [
    { id: "today", group: "Daily",  icon: "today",  name: "PvE", tag: "quests and energy" },
    { id: "abyss", group: "Daily",  icon: "abyss",  name: "PvP", tag: "siege and corridors" },
    { id: "extra", group: "Daily",  icon: "extra",  name: "Optional Extras", tag: "bosses and supplies", startClosed: true },
    { id: "pve",   group: "Weekly", icon: "runs",   name: "PvE", tag: "dungeons and quests" },
    { id: "pvp",   group: "Weekly", icon: "quests", name: "PvP", tag: "battlefield and quests" },
    { id: "craft", group: "Weekly", icon: "craft",  name: "Crafting & Shopping", tag: "crafts and energy" },
  ],
  dailySections: ["today", "abyss", "extra"],
  tasks: [
    { sec: "today", id: "duty", name: "Duty Quests", main: 5, alt: 0, stepper: true },
    { sec: "today", id: "en_dun", name: "Spend dungeon energy", lvl: 22, main: 1, alt: 1, label: "Spent",
      note: (s) => "+15 every 3 hours (120 a day) · caps at " + (s.sub ? "840" : "560") },
    { sec: "today", id: "en_night", name: "Spend Nightmare tickets", note: "+2 a day · caps at 14", lvl: 45, main: 1, alt: 1, label: "Spent" },
    { sec: "today", id: "en_shugo", name: "Spend Shugo Festival tickets", lvl: 13, main: 1, alt: 0, label: "Spent",
      note: (s) => "+2 a day · caps at " + (s.sub ? "21" : "14") },
    { sec: "abyss", id: "siege", name: "Check for an Artifact Siege", note: "No fixed schedule, so look each day", main: 1, alt: 0, label: "Checked", daily: true },
    { sec: "abyss", id: "corr", name: "Check Abyss Corridors", note: "Depends on how many your faction holds (0–3)", main: 1, alt: 1, label: "Checked", daily: true },
    { sec: "extra", id: "wb", name: "World Bosses", main: 1, alt: 0 },
    { sec: "extra", id: "supply", name: "Supply Request", main: 1, alt: 0 },
    { sec: "pve", id: "ddun", name: "Daily Dungeon", note: "14 runs to spread across the week", main: 14, alt: 0 },
    { sec: "pve", id: "asc", name: "Ascension Trial", main: 3, alt: 3, stepper: true },
    { sec: "pve", id: "pve", name: "PvE weekly quests", note: "Command Merchant · Main City", main: 12, alt: 0 },
    { sec: "pvp", id: "bg", name: "Battlefield", main: 3, alt: 3, stepper: true },
    { sec: "pvp", id: "pvp", name: "PvP weekly quests", note: "Command Merchant · Abyss", main: 20, alt: 0 },
    { sec: "craft", id: "morph", name: "Substance Morph / Odyle Craft (per character)", main: 4, alt: 4, stepper: true },
    { sec: "craft", id: "morph_srv", name: "Substance Morph / Odyle Craft (per server)", note: "Separate 16 a week · best done on your main", main: 16, alt: 0 },
    { sec: "craft", id: "odyle", name: "Odyle Energy (per character)", note: "Subscriber Shop · 40 energy each · 100,000 Kina", main: 4, alt: 4, subOnly: true, stepper: true },
    { sec: "craft", id: "odyle_srv", name: "Odyle Energy (per server)", note: "Subscriber Shop · separate 16 a week · best bought on your main", main: 16, alt: 0, subOnly: true },
  ],
};
