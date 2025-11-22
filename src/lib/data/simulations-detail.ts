export type SimulationInstrument = {
  id: string
  label: string
  type: "pipette" | "microscope" | "capteur" | "multimetre" | "laser"
  description: string
}

export type SimulationParameter = {
  id: string
  label: string
  min: number
  max: number
  unit: string
  defaultValue: number
}

export type SimulationStage = {
  id: string
  label: string
  objective: string
  instructions: string[]
}

export type SimulationDetail = {
  id: string
  videoPreview?: string
  environment: {
    gravity: number
    temperature: number
    ambientLight: number
  }
  instruments: SimulationInstrument[]
  parameters: SimulationParameter[]
  stages: SimulationStage[]
  safety: string[]
}

const SIMULATION_DETAILS: Record<string, SimulationDetail> = {
  "sim-quantum-diffraction": {
    id: "sim-quantum-diffraction",
    videoPreview: "/videos/diffraction-preview.mp4",
    environment: {
      gravity: 9.81,
      temperature: 298,
      ambientLight: 0.6,
    },
    instruments: [
      {
        id: "laser-azur",
        label: "Laser azur 405 nm",
        type: "laser",
        description: "Source cohérente permettant de visualiser les franges d'interférence.",
      },
      {
        id: "capteur-photon",
        label: "Capteur photonique haute sensibilité",
        type: "capteur",
        description: "Enregistre le nombre de photons par seconde pour chaque zone de l'écran.",
      },
      {
        id: "multimetre-virtuel",
        label: "Multimètre virtuel",
        type: "multimetre",
        description: "Affiche l'intensité lumineuse et les variations selon les paramètres.",
      },
    ],
    parameters: [
      {
        id: "slitDistance",
        label: "Distance entre fentes",
        min: 0.1,
        max: 2,
        unit: "mm",
        defaultValue: 0.5,
      },
      {
        id: "wavelength",
        label: "Longueur d'onde",
        min: 380,
        max: 700,
        unit: "nm",
        defaultValue: 520,
      },
      {
        id: "screenDistance",
        label: "Distance écran",
        min: 0.5,
        max: 3,
        unit: "m",
        defaultValue: 1.5,
      },
    ],
    stages: [
      {
        id: "stage-setup",
        label: "Configuration du dispositif",
        objective: "Configurer la source lumineuse et les fentes.",
        instructions: [
          "Choisir la longueur d'onde souhaitée.",
          "Positionner l'écran à la distance adéquate.",
          "Aligner le capteur pour enregistrer la figure.",
        ],
      },
      {
        id: "stage-measure",
        label: "Acquisition des données",
        objective: "Mesurer l'intensité lumineuse selon la position.",
        instructions: [
          "Balayer la surface de l'écran avec le capteur photonique.",
          "Enregistrer la variation d'intensité via le tableau de bord.",
        ],
      },
      {
        id: "stage-analysis",
        label: "Analyse",
        objective: "Comparer les résultats avec le modèle théorique.",
        instructions: [
          "Exporter les données sous forme de graphique.",
          "Comparer la position des maxima et minima.",
        ],
      },
    ],
    safety: [
      "Toujours activer l'atténuateur lors de la calibration.",
      "Limiter la puissance du laser à 3 mW pour éviter l'éblouissement.",
    ],
  },
  "sim-bio-cell": {
    id: "sim-bio-cell",
    environment: {
      gravity: 9.81,
      temperature: 295,
      ambientLight: 0.5,
    },
    instruments: [
      {
        id: "microscope-holo",
        label: "Microscope holographique",
        type: "microscope",
        description: "Permet un zoom multi-échelles de la cellule eucaryote.",
      },
      {
        id: "pipette-virtuelle",
        label: "Pipette virtuelle intelligente",
        type: "pipette",
        description: "Injecte des marqueurs fluorescents pour suivre les organites.",
      },
      {
        id: "capteur-temp",
        label: "Capteur de température",
        type: "capteur",
        description: "Garantit la viabilité des structures observées.",
      },
    ],
    parameters: [
      {
        id: "zoom",
        label: "Zoom holographique",
        min: 1,
        max: 4000,
        unit: "x",
        defaultValue: 200,
      },
      {
        id: "markerIntensity",
        label: "Intensité des marqueurs",
        min: 0,
        max: 100,
        unit: "%",
        defaultValue: 40,
      },
    ],
    stages: [
      {
        id: "stage-preparation",
        label: "Préparation de l'échantillon",
        objective: "Charger la cellule et préparer l'observation.",
        instructions: [
          "Déposer la cellule dans la cuve virtuelle.",
          "Activer le capteur de température.",
          "Choisir les marqueurs selon l'organite ciblé.",
        ],
      },
      {
        id: "stage-observation",
        label: "Observation guidée",
        objective: "Explorer les organites et annoter les observations.",
        instructions: [
          "Naviguer avec le joystick holographique.",
          "Utiliser la pipette pour colorer le noyau ou les mitochondries.",
          "Prendre des captures avec le mode annotation.",
        ],
      },
      {
        id: "stage-report",
        label: "Rapport interactif",
        objective: "Compiler les observations et valider les hypothèses.",
        instructions: [
          "Exporter les annotations au format interactif.",
          "Partager avec l'enseignant pour feedback IA.",
        ],
      },
    ],
    safety: [
      "Toujours désactiver la fluorescence avant de quitter la simulation.",
      "Ne pas dépasser 310 K pour préserver l'intégrité des structures.",
    ],
    freeMode: {
      description:
        "Explorez vos propres échantillons, créez des annotations collaboratives et enregistrez des timelapses scientifiques.",
      recommendedTools: ["Pipette intelligente", "Microscope holographique", "Assistant IA"],
      resetChecklist: [
        "Rétablir l'intensité des marqueurs à 0%.",
        "Sauvegarder les observations puis réinitialiser la cuve.",
      ],
    },
  },
}

export function getSimulationDetail(simulationId: string): SimulationDetail | null {
  return SIMULATION_DETAILS[simulationId] ?? null
}


