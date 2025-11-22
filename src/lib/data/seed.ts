export type SimulationDiscipline =
  | "physique"
  | "chimie"
  | "biologie"
  | "electronique"
  | "informatique"

export type Simulation = {
  id: string
  title: string
  discipline: SimulationDiscipline
  description: string
  objectives: string[]
  estimatedDuration: number
  difficulty: "debutant" | "intermediaire" | "avance"
  tags: string[]
  assets: {
    type: "model3d" | "video" | "document"
    url: string
    label: string
  }[]
}

export type VirtualLab = {
  id: string
  name: string
  discipline: SimulationDiscipline
  description: string
  safetyLevel: "faible" | "modere" | "critique"
  icon: string
  features: string[]
}

export type LearningResource = {
  id: string
  title: string
  type: "fiche" | "manuel" | "video" | "animation" | "exercice"
  discipline: SimulationDiscipline
  summary: string
  duration: number
  level: "college" | "lycee" | "universite"
  format: "pdf" | "video" | "interactive" | "html"
  url: string
  tags: string[]
  attachments?: {
    label: string
    type: "pdf" | "module" | "dataset" | "slides" | "template" | "video"
    url: string
  }[]
  manual?: {
    sections: { title: string; content: string }[]
    safety?: string[]
    prerequisites?: string[]
  }
  video?: {
    platform: "youtube" | "vimeo" | "internal"
    aspectRatio?: string
    duration?: number
    chapters?: { title: string; timecode: string }[]
    downloadUrl?: string
    captions?: string[]
  }
  interactive?: {
    objective: string
    steps: { title: string; action: string; hint?: string; expectedResult?: string }[]
    correction?: string[]
  }
  exercise?: {
    difficulty: "facile" | "intermediaire" | "avance"
    scoring: {
      maxPoints: number
      successThreshold: number
    }
  }
}

export type SeedUser = {
  name: string
  email: string
  role: "student" | "teacher" | "admin"
  institution: string
  passwordHash: string
  preferences: {
    disciplines: string[]
    simulationHistory: string[]
    collaborationStyle: "distanciel" | "hybride" | "presentiel"
  }
}

export type GlossaryEntry = {
  id: string
  term: string
  definition: string
  discipline: SimulationDiscipline | "interdisciplinaire"
  tags: string[]
  synonyms: string[]
  relatedResources: string[]
}

export const baseGlossary: GlossaryEntry[] = [
  {
    id: "glossaire-frange-interference",
    term: "Frange d'interférence",
    discipline: "physique",
    definition:
      "Zone d'intensité lumineuse résultant de la superposition de deux ondes cohérentes. Les franges apparaissent selon la différence de phase entre les ondes.",
    tags: ["optique", "diffraction"],
    synonyms: ["maximum d'interférence", "anneau lumineux"],
    relatedResources: ["res-phys-fiche-diffraction", "sim-quantum-diffraction"],
  },
  {
    id: "glossaire-mitochondrie",
    term: "Mitochondrie",
    discipline: "biologie",
    definition:
      "Organite cellulaire responsable de la production d'ATP via la respiration cellulaire. Les mitochondries possèdent leur propre ADN circulaire.",
    tags: ["cellule", "energie"],
    synonyms: ["centrale énergétique"],
    relatedResources: ["res-bio-video-cellule", "sim-bio-cell"],
  },
  {
    id: "glossaire-point-equivalence",
    term: "Point d'équivalence",
    discipline: "chimie",
    definition:
      "Moment du titrage où les quantités de réactifs ont réagi selon les proportions stœchiométriques. Il est repéré par un changement brusque de signal (pH, conductivité...).",
    tags: ["titrage", "stoechiometrie"],
    synonyms: ["équivalence chimique"],
    relatedResources: ["res-chem-exercice-titrage", "sim-electro-circuit"],
  },
  {
    id: "glossaire-complexite-algorithmique",
    term: "Complexité algorithmique",
    discipline: "informatique",
    definition:
      "Mesure de la quantité de ressources (temps, mémoire) requise par un algorithme en fonction de la taille de l'entrée. On distingue complexité asymptotique, moyenne et pire cas.",
    tags: ["algorithmique", "informatique"],
    synonyms: ["analyse de performance", "ordre de grandeur"],
    relatedResources: ["res-info-animation-algorithmes"],
  },
  {
    id: "glossaire-superposition-quantique",
    term: "Superposition quantique",
    discipline: "physique",
    definition:
      "Principe selon lequel un système quantique peut être dans plusieurs états simultanément jusqu'à ce qu'une mesure soit effectuée.",
    tags: ["quantique"],
    synonyms: ["état superposé"],
    relatedResources: ["res-phys-manuel-quantique"],
  },
]

export const baseSimulations: Simulation[] = [
  {
    id: "sim-quantum-diffraction",
    title: "Diffraction Quantique du Photon",
    discipline: "physique",
    description:
      "Explorez la dualité onde-particule grâce à une expérience virtuelle de diffraction à travers des fentes multiples.",
    objectives: [
      "Comprendre l'influence de la longueur d'onde sur la diffraction",
      "Analyser l'impact du nombre de fentes sur le motif obtenu",
      "Observer les interférences constructives et destructives en temps réel",
    ],
    estimatedDuration: 25,
    difficulty: "intermediaire",
    tags: ["3D", "optique", "quantique"],
    assets: [
      {
        type: "model3d",
        url: "/assets/models/diffraction-lab.glb",
        label: "Dispositif de diffraction",
      },
      {
        type: "document",
        url: "/assets/guides/diffraction.pdf",
        label: "Guide pédagogique",
      },
    ],
  },
  {
    id: "sim-bio-cell",
    title: "Exploration d'une Cellule Augmentée",
    discipline: "biologie",
    description:
      "Manipulez un microscope virtuel pour observer l'organisation d'une cellule eucaryote à différentes échelles.",
    objectives: [
      "Identifier les organites d'une cellule en 3D",
      "Comprendre leur rôle dans le métabolisme cellulaire",
      "Simuler des perturbations chimiques et observer les effets",
    ],
    estimatedDuration: 20,
    difficulty: "debutant",
    tags: ["microscope", "cellule", "animation"],
    assets: [
      {
        type: "model3d",
        url: "/assets/models/cellule.glb",
        label: "Cellule immersive",
      },
      {
        type: "video",
        url: "https://videos.taalimia.education/cellule",
        label: "Démonstration guidée",
      },
    ],
  },
  {
    id: "sim-electro-circuit",
    title: "Synthèse d'un Circuit d'Amplification",
    discipline: "electronique",
    description:
      "Construisez et testez un circuit amplificateur audio avec instrumentation virtuelle et retour temps réel.",
    objectives: [
      "Assembler un circuit à partir de composants virtuels",
      "Analyser le signal via un oscilloscope 3D intégré",
      "Évaluer l'impact des composants sur le gain et le bruit",
    ],
    estimatedDuration: 30,
    difficulty: "avance",
    tags: ["circuits", "oscilloscope", "temps-réel"],
    assets: [
      {
        type: "model3d",
        url: "/assets/models/oscilloscope.glb",
        label: "Banc électronique virtuel",
      },
    ],
  },
]

export const baseLabs: VirtualLab[] = [
  {
    id: "lab-bio",
    name: "Laboratoire de Biologie Professionnel",
    discipline: "biologie",
    description:
      "Laboratoire de biologie ultra-réaliste avec 100+ objets 3D, 7 instruments interactifs, textures générées par IA, fenêtres avec vue extérieure et environnement immersif complet.",
    safetyLevel: "modere",
    icon: "dna-off",
    features: [
      "7 instruments interactifs (microscope, incubateur CO₂, centrifugeuse, autoclave, balance, pH-mètre, spectrophotomètre)",
      "100+ objets 3D réalistes (mobilier, verrerie, équipements)",
      "Textures procédurales générées par IA (sol époxy, murs, bois, métal)",
      "4 grandes fenêtres avec vue extérieure et ciel réaliste",
      "Lumière naturelle volumétrique et reflets environnementaux",
      "Hotte aspirante professionnelle et équipements de sécurité complets",
      "50+ pièces de verrerie avec solutions colorées",
      "Mode collaboration et annotations en temps réel",
    ],
  },
  {
    id: "lab-physique",
    name: "Laboratoire de Physique",
    discipline: "physique",
    description:
      "Laboratoire de physique moderne avec textures IA, 5 instruments interactifs (laser, oscilloscope, électroaimant, pendule, voltmètre), 4 fenêtres avec vue extérieure, skybox réaliste et équipements professionnels.",
    safetyLevel: "modere",
    icon: "atom",
    features: [
      "5 instruments interactifs (laser He-Ne, oscilloscope, électroaimant, pendule, voltmètre)",
      "Textures procédurales générées par IA (sol industriel, murs gris)",
      "4 fenêtres avec vue extérieure et ciel réaliste",
      "Planche optique avec supports",
      "Faisceau laser visible et réactif",
      "Affichage oscilloscope temps réel",
      "Mobilier technique (armoires, chaises, tables)",
    ],
  },
  {
    id: "lab-chimie",
    name: "Laboratoire de Chimie",
    discipline: "chimie",
    description:
      "Laboratoire de chimie professionnel avec textures IA, 5 instruments interactifs (bec Bunsen, burette, agitateur, hotte, thermomètre), solutions colorées, 4 fenêtres avec vue extérieure et équipements de sécurité complets.",
    safetyLevel: "critique",
    icon: "flask-round",
    features: [
      "5 instruments interactifs (bec Bunsen, burette titrage, agitateur magnétique, hotte, thermomètre)",
      "Textures procédurales générées par IA (sol époxy, murs jaunes sécurité)",
      "Hotte aspirante 3m avec vitre et extraction",
      "Système de titrage avec indicateur pH coloré (rouge/vert/bleu)",
      "Bec Bunsen avec flamme animée",
      "6 béchers avec solutions colorées",
      "4 fenêtres avec vue extérieure",
      "Équipements sécurité (douche, extincteur, panneaux)",
    ],
  },
]

export const baseResources: LearningResource[] = [
  {
    id: "res-phys-fiche-diffraction",
    title: "Fiche laboratoire : Interférences et diffraction",
    type: "fiche",
    discipline: "physique",
    summary:
      "Une fiche prête à l'emploi pour guider les étudiants lors de l'expérience de diffraction à double fente : objectifs, instrumentation et grille d'observation.",
    duration: 30,
    level: "universite",
    format: "pdf",
    url: "/assets/guides/diffraction.pdf",
    tags: ["optique", "laser", "sécurité"],
    attachments: [
      { label: "Fiche expérimentale (PDF)", type: "pdf", url: "/assets/guides/diffraction.pdf" },
      { label: "Checklist sécurité laser", type: "pdf", url: "/assets/checklists/laser-safety.pdf" },
      { label: "Tableau de mesures (ODS)", type: "dataset", url: "/assets/templates/tableau-diffraction.ods" },
    ],
    manual: {
      prerequisites: ["Notions d'optique ondulatoire", "Utilisation d'un capteur photonique"],
      safety: ["Ne jamais regarder directement le faisceau laser.", "Activer les écrans de protection latéraux."],
      sections: [
        {
          title: "Objectifs pédagogiques",
          content: "Observer les franges d'interférences, mesurer la distance inter-franges et relier les paramètres expérimentaux au modèle théorique.",
        },
        {
          title: "Instrumentation virtuelle",
          content: "Laser azur 405 nm, banc optique ajustable, écran de capture et capteur photonique haute sensibilité intégrés à la simulation.",
        },
        {
          title: "Protocole conseillé",
          content: "1) Configurer la distance fente-écran. 2) Ajuster la longueur d'onde. 3) Enregistrer la courbe d'intensité via le capteur. 4) Exporter les données pour analyse comparative.",
        },
      ],
    },
  },
  {
    id: "res-phys-manuel-quantique",
    title: "Manuel numérique : Dualité onde-particule",
    type: "manuel",
    discipline: "physique",
    summary:
      "Un manuel interactif structuré en chapitres avec quiz formatifs pour appréhender la dualité onde-particule avant la mise en pratique dans le laboratoire virtuel.",
    duration: 60,
    level: "universite",
    format: "html",
    url: "/resources/manuals/dualite-onde-particule",
    tags: ["quantique", "concepts", "préparation"],
    attachments: [
      { label: "Diapositives enseignant", type: "slides", url: "/assets/slides/dualite-onde-particule.pdf" },
      { label: "Banque de questions", type: "module", url: "/assets/question-banks/dualite.json" },
    ],
    manual: {
      prerequisites: ["Bases de mécanique quantique"],
      sections: [
        {
          title: "Chapitre 1 — Historique",
          content: "Des expériences de Young aux premières interprétations quantiques, avec frise chronologique interactive.",
        },
        {
          title: "Chapitre 2 — Modélisation mathématique",
          content: "Rappels sur l'équation de Schrödinger, représentations d'état et probabilité d'observation.",
        },
        {
          title: "Chapitre 3 — Applications pédagogiques",
          content: "Liens vers simulations complémentaires, activités différenciées et quiz formatifs intégrés.",
        },
      ],
    },
  },
  {
    id: "res-bio-video-cellule",
    title: "Vidéo immersive : Visite d'une cellule eucaryote",
    type: "video",
    discipline: "biologie",
    summary:
      "Une capsule vidéo 4K avec chapitrage interactif et sous-titres multilingues pour accompagner la simulation de biologie augmentée.",
    duration: 18,
    level: "lycee",
    format: "video",
    url: "https://videos.taalimia.education/cellule",
    tags: ["cellule", "organites", "microscope"],
    video: {
      platform: "internal",
      aspectRatio: "16:9",
      duration: 1080,
      chapters: [
        { title: "Introduction & contextualisation", timecode: "00:00" },
        { title: "Zoom sur le noyau", timecode: "03:25" },
        { title: "Mitochondries en action", timecode: "08:40" },
        { title: "Synthèse et quiz rapide", timecode: "15:10" },
      ],
      captions: ["/assets/captions/cellule-fr.vtt", "/assets/captions/cellule-en.vtt"],
      downloadUrl: "/assets/videos/cellule-eucaryote.mp4",
    },
    attachments: [{ label: "Fiche de visionnage", type: "pdf", url: "/assets/worksheets/cellule-worksheet.pdf" }],
  },
  {
    id: "res-chem-exercice-titrage",
    title: "Exercice interactif : Titrage acide-base avancé",
    type: "exercice",
    discipline: "chimie",
    summary:
      "Un module interactif guidant l'apprenant pas à pas sur un titrage en milieu virtuel, avec corrections détaillées et notation automatique.",
    duration: 25,
    level: "universite",
    format: "interactive",
    url: "/resources/exercises/titrage-avance",
    tags: ["chimie analytique", "titrage", "acide-base"],
    interactive: {
      objective: "Réaliser un titrage conductimétrique et interpréter la courbe obtenue.",
      steps: [
        {
          title: "Préparation de la burette",
          action: "Rincer et remplir la burette virtuelle avec la solution titrante (NaOH 0,1 mol·L⁻¹).",
          hint: "Utilisez la commande 'Remplir' puis ajustez le zéro.",
          expectedResult: "La burette affiche 0,00 mL au départ et aucune bulle d'air n'est visible.",
        },
        {
          title: "Acquisition des mesures",
          action: "Ajouter progressivement le titrant et enregistrer la conductivité à chaque palier de 0,5 mL.",
          hint: "Activez le mode 'Acquisition automatique' pour remplir le tableau.",
          expectedResult: "Le graphique conductivité-volume présente un minimum net autour de 12,5 mL.",
        },
        {
          title: "Analyse",
          action: "Identifier le volume à l'équivalence et calculer la concentration finale.",
          expectedResult: "Le rapport final doit être consigné dans le carnet de bord scientifique.",
        },
      ],
      correction: [
        "Volume équivalent : 12,4 mL (tolérance ±0,3 mL).",
        "Concentration de l'acide initial : 0,050 mol·L⁻¹.",
        "Comparer avec l'étalon fourni et commenter la précision.",
      ],
    },
    exercise: {
      difficulty: "intermediaire",
      scoring: {
        maxPoints: 100,
        successThreshold: 70,
      },
    },
    attachments: [
      { label: "Tableau de collecte (CSV)", type: "dataset", url: "/assets/templates/titrage-donnees.csv" },
      { label: "Corrigé détaillé", type: "pdf", url: "/assets/solutions/titrage-corrige.pdf" },
    ],
  },
  {
    id: "res-info-animation-algorithmes",
    title: "Animation interactive : Complexité des algorithmes",
    type: "animation",
    discipline: "informatique",
    summary:
      "Une animation manipulable illustrant la complexité temporelle des algorithmes de tri avec comparaisons en temps réel et mini-jeux.",
    duration: 20,
    level: "lycee",
    format: "interactive",
    url: "https://interactive.taalimia.education/tri-complexite",
    tags: ["algorithmique", "complexité", "visualisation"],
    interactive: {
      objective: "Comparer l'efficacité de plusieurs algorithmes et identifier leurs classes de complexité.",
      steps: [
        {
          title: "Manipulation guidée",
          action: "Lancer les algorithmes de tri sur des tableaux de tailles différentes et observer les compteurs d'opérations.",
        },
        {
          title: "Défi chronométré",
          action: "Associer chaque algorithme à sa courbe de complexité (O(n²), O(n log n), etc.).",
          hint: "Attention aux cas meilleur/pire scenario !",
        },
        {
          title: "Synthèse",
          action: "Répondre aux trois questions interactives pour valider la compréhension des classes de complexité.",
        },
      ],
      correction: [
        "Tri par insertion → O(n²)",
        "Tri fusion → O(n log n)",
        "Tri rapide → O(n log n) en moyenne, O(n²) dans le pire cas",
      ],
    },
    attachments: [{ label: "Fiche enseignant : parcours différenciés", type: "pdf", url: "/assets/guides/complexite-enseignant.pdf" }],
  },
]

export const baseUsers: SeedUser[] = [
  {
    name: "Administrateur Taalimia",
    email: "admin@univ-setif.dz",
    role: "admin",
    institution: "Université Ferhat Abbas Sétif 1",
    passwordHash: "$2b$12$FoM15bfXWnqT3fztIzHwSOwkV3n2SzBKqchm82xndgsZwUx.vKUPy",
    preferences: {
      disciplines: ["physique", "chimie", "informatique"],
      simulationHistory: [],
      collaborationStyle: "hybride",
    },
  },
  {
    name: "Pr Karim Benali",
    email: "enseignant@univ-setif.dz",
    role: "teacher",
    institution: "Université Ferhat Abbas Sétif 1",
    passwordHash: "$2b$12$FoM15bfXWnqT3fztIzHwSOwkV3n2SzBKqchm82xndgsZwUx.vKUPy",
    preferences: {
      disciplines: ["physique"],
      simulationHistory: [],
      collaborationStyle: "presentiel",
    },
  },
  {
    name: "Sara Kaci",
    email: "etudiant@univ-setif.dz",
    role: "student",
    institution: "Université Ferhat Abbas Sétif 1",
    passwordHash: "$2b$12$FoM15bfXWnqT3fztIzHwSOwkV3n2SzBKqchm82xndgsZwUx.vKUPy",
    preferences: {
      disciplines: ["biologie"],
      simulationHistory: ["sim-bio-cell"],
      collaborationStyle: "distanciel",
    },
  },
]

