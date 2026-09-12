// Moduli disponibili, con la posizione (in percentuale) di ogni ruolo sul campo.
// x = 0 (sinistra) -> 100 (destra), y = 0 (attacco, in alto) -> 100 (portiere, in basso)
window.FORMATIONS = [
  {
    id: "3-4-3",
    label: "3-4-3",
    slots: [
      { role: "Por", x: 50, y: 92 },
      { role: "Dc", x: 25, y: 72 }, { role: "Dc", x: 50, y: 72 }, { role: "Dc", x: 75, y: 72 },
      { role: "E", x: 12, y: 52 }, { role: "M/C", x: 37, y: 54 }, { role: "M/C", x: 63, y: 54 }, { role: "E", x: 88, y: 52 },
      { role: "W/A", x: 20, y: 20 }, { role: "A/Pc", x: 50, y: 15 }, { role: "W/A", x: 80, y: 20 }
    ]
  },
  {
    id: "3-4-1-2",
    label: "3-4-1-2",
    slots: [
      { role: "Por", x: 50, y: 92 },
      { role: "Dc", x: 25, y: 72 }, { role: "Dc", x: 50, y: 72 }, { role: "Dc", x: 75, y: 72 },
      { role: "E", x: 12, y: 54 }, { role: "M/C", x: 37, y: 56 }, { role: "M/C", x: 63, y: 56 }, { role: "E", x: 88, y: 54 },
      { role: "T", x: 50, y: 36 },
      { role: "A/Pc", x: 35, y: 15 }, { role: "A/Pc", x: 65, y: 15 }
    ]
  },
  {
    id: "3-4-2-1",
    label: "3-4-2-1",
    slots: [
      { role: "Por", x: 50, y: 92 },
      { role: "Dc", x: 25, y: 72 }, { role: "Dc", x: 50, y: 72 }, { role: "Dc", x: 75, y: 72 },
      { role: "E", x: 12, y: 54 }, { role: "M/C", x: 37, y: 56 }, { role: "M/C", x: 63, y: 56 }, { role: "E", x: 88, y: 54 },
      { role: "T/W", x: 30, y: 34 }, { role: "T/W", x: 70, y: 34 },
      { role: "A/Pc", x: 50, y: 14 }
    ]
  },
  {
    id: "3-5-2",
    label: "3-5-2",
    slots: [
      { role: "Por", x: 50, y: 92 },
      { role: "Dc", x: 25, y: 74 }, { role: "Dc", x: 50, y: 74 }, { role: "Dc", x: 75, y: 74 },
      { role: "E/W", x: 8, y: 50 }, { role: "M/C", x: 29, y: 54 }, { role: "M/C", x: 50, y: 56 }, { role: "M/C", x: 71, y: 54 }, { role: "E/W", x: 92, y: 50 },
      { role: "A/Pc", x: 35, y: 16 }, { role: "A/Pc", x: 65, y: 16 }
    ]
  },
  {
    id: "4-4-2",
    label: "4-4-2",
    slots: [
      { role: "Por", x: 50, y: 92 },
      { role: "Dd", x: 12, y: 74 }, { role: "Dc", x: 37, y: 76 }, { role: "Dc", x: 63, y: 76 }, { role: "Ds", x: 88, y: 74 },
      { role: "E/W", x: 12, y: 50 }, { role: "M/C", x: 37, y: 52 }, { role: "M/C", x: 63, y: 52 }, { role: "E/W", x: 88, y: 50 },
      { role: "A/Pc", x: 35, y: 16 }, { role: "A/Pc", x: 65, y: 16 }
    ]
  },
  {
    id: "4-3-3",
    label: "4-3-3",
    slots: [
      { role: "Por", x: 50, y: 92 },
      { role: "Dd", x: 12, y: 74 }, { role: "Dc", x: 37, y: 76 }, { role: "Dc", x: 63, y: 76 }, { role: "Ds", x: 88, y: 74 },
      { role: "M/C", x: 25, y: 52 }, { role: "M", x: 50, y: 50 }, { role: "M/C", x: 75, y: 52 },
      { role: "W/A", x: 15, y: 18 }, { role: "A/Pc", x: 50, y: 14 }, { role: "W/A", x: 85, y: 18 }
    ]
  },
  {
    id: "4-3-1-2",
    label: "4-3-1-2",
    slots: [
      { role: "Por", x: 50, y: 92 },
      { role: "Dd", x: 12, y: 74 }, { role: "Dc", x: 37, y: 76 }, { role: "Dc", x: 63, y: 76 }, { role: "Ds", x: 88, y: 74 },
      { role: "M/C", x: 25, y: 54 }, { role: "M", x: 50, y: 52 }, { role: "M/C", x: 75, y: 54 },
      { role: "T", x: 50, y: 34 },
      { role: "A/Pc", x: 35, y: 15 }, { role: "A/Pc", x: 65, y: 15 }
    ]
  },
  {
    id: "4-3-2-1",
    label: "4-3-2-1",
    slots: [
      { role: "Por", x: 50, y: 92 },
      { role: "Dd", x: 12, y: 74 }, { role: "Dc", x: 37, y: 76 }, { role: "Dc", x: 63, y: 76 }, { role: "Ds", x: 88, y: 74 },
      { role: "M/C", x: 25, y: 54 }, { role: "M", x: 50, y: 52 }, { role: "M/C", x: 75, y: 54 },
      { role: "T/W", x: 30, y: 32 }, { role: "T/W", x: 70, y: 32 },
      { role: "A/Pc", x: 50, y: 14 }
    ]
  },
  {
    id: "4-2-3-1",
    label: "4-2-3-1",
    slots: [
      { role: "Por", x: 50, y: 92 },
      { role: "Dd", x: 12, y: 76 }, { role: "Dc", x: 37, y: 78 }, { role: "Dc", x: 63, y: 78 }, { role: "Ds", x: 88, y: 76 },
      { role: "M", x: 37, y: 58 }, { role: "M", x: 63, y: 58 },
      { role: "T/W", x: 15, y: 36 }, { role: "T", x: 50, y: 38 }, { role: "T/W", x: 85, y: 36 },
      { role: "A/Pc", x: 50, y: 14 }
    ]
  },
  {
    id: "4-4-1-1",
    label: "4-4-1-1",
    slots: [
      { role: "Por", x: 50, y: 92 },
      { role: "Dd", x: 12, y: 76 }, { role: "Dc", x: 37, y: 78 }, { role: "Dc", x: 63, y: 78 }, { role: "Ds", x: 88, y: 76 },
      { role: "E/W", x: 12, y: 54 }, { role: "M/C", x: 37, y: 56 }, { role: "M/C", x: 63, y: 56 }, { role: "E/W", x: 88, y: 54 },
      { role: "T", x: 50, y: 32 },
      { role: "A/Pc", x: 50, y: 14 }
    ]
  },
  {
    id: "4-2-2-2",
    label: "4-2-2-2",
    slots: [
      { role: "Por", x: 50, y: 92 },
      { role: "Dd", x: 12, y: 76 }, { role: "Dc", x: 37, y: 78 }, { role: "Dc", x: 63, y: 78 }, { role: "Ds", x: 88, y: 76 },
      { role: "M", x: 37, y: 56 }, { role: "M", x: 63, y: 56 },
      { role: "W", x: 25, y: 36 }, { role: "T", x: 75, y: 36 },
      { role: "A/Pc", x: 35, y: 15 }, { role: "A/Pc", x: 65, y: 15 }
    ]
  }
];
