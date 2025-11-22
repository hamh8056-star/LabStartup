export type LabExperience = {
  id: string
  title: string
  level: "collège" | "lycée" | "université"
  duration: number
  mode: "guidé" | "libre"
  programReference: string
  objectives: string[]
  safetyNotes: string[]
}

export type LabFreeMode = {
  description: string
  recommendedTools: string[]
  resetChecklist: string[]
}

export type LabDetail = {
  id: string
  safetyInstructions: string[]
  emergencyProcedures: string[]
  experiences: LabExperience[]
  freeMode: LabFreeMode
}

const LAB_DETAILS: Record<string, LabDetail> = {
  "lab-physique": {
    id: "lab-physique",
    safetyInstructions: [
      "Vérifier la calibration des capteurs avant chaque expérience.",
      "Limiter la vitesse de rotation des gyroscopes virtuels à 3000 tr/min.",
      "Activer le mode anti-collision pour les expériences mécaniques.",
    ],
    emergencyProcedures: [
      "Couper l'alimentation des lasers virtuels en cas de surcharge optique.",
      "Réinitialiser le champ magnétique si les valeurs dépassent 3 teslas.",
    ],
    experiences: [
      {
        id: "phy-oscillations",
        title: "Oscillations amorties",
        level: "lycée",
        duration: 40,
        mode: "guidé",
        programReference: "Terminale - Spécialité Physique-Chimie",
        objectives: [
          "Modéliser un oscillateur amorti dans différents milieux.",
          "Comparer les courbes théoriques avec les mesures virtuelles.",
          "Établir un rapport expérimental complet.",
        ],
        safetyNotes: [
          "Limiter l'amplitude initiale à 30 cm.",
          "Recalibrer les capteurs de position avant chaque série de mesures.",
        ],
      },
      {
        id: "phy-interference",
        title: "Interférences lumineuses",
        level: "université",
        duration: 35,
        mode: "guidé",
        programReference: "Licence Physique L2 - Optique",
        objectives: [
          "Observer les franges d'interférence en fonction de la longueur d'onde.",
          "Quantifier l'écart angulaire entre maxima et minima.",
          "Configurer un dispositif multi-fentes virtuel.",
        ],
        safetyNotes: [
          "Activer l'atténuateur laser avant calibration.",
          "Éviter l'utilisation de longueurs d'onde inférieures à 400 nm.",
        ],
      },
    ],
    freeMode: {
      description:
        "Créer vos propres expériences de mécanique, optique ou thermodynamique. Personnalisez les paramètres physiques et enregistrez vos protocoles.",
      recommendedTools: [
        "Tableau blanc collaboratif",
        "Capteurs inertiels",
        "Caméra haute vitesse virtuelle",
      ],
      resetChecklist: [
        "Réinitialiser les valeurs des champs électriques et magnétiques.",
        "Purger les mesures enregistrées dans le tableau de bord.",
        "Restaurer les paramètres par défaut des instruments.",
      ],
    },
  },
  "lab-chimie": {
    id: "lab-chimie",
    safetyInstructions: [
      "Activer les détecteurs virtuels de fumées pour chaque réaction.",
      "Respecter les limites de concentration des réactifs (max 2 mol/L).",
      "Assigner un responsable sécurité pour chaque séance.",
    ],
    emergencyProcedures: [
      "Utiliser la douche virtuelle de sécurité en cas de projection.",
      "Neutraliser immédiatement les réactions exothermiques incontrôlées.",
    ],
    experiences: [
      {
        id: "chimie-titrage",
        title: "Titrage acide-base",
        level: "lycée",
        duration: 30,
        mode: "guidé",
        programReference: "Terminale - Spécialité Physique-Chimie",
        objectives: [
          "Déterminer la concentration d'une solution inconnue.",
          "Exploiter une courbe de titrage conductimétrique.",
          "Valider les résultats avec l'assistant IA.",
        ],
        safetyNotes: [
          "Utiliser les gants virtuels ignifugés.",
          "Neutraliser les acides forts avec des bases diluées avant stockage.",
        ],
      },
      {
        id: "chimie-polymeres",
        title: "Synthèse de polymères biodégradables",
        level: "université",
        duration: 50,
        mode: "guidé",
        programReference: "Licence Chimie L3 - Chimie Organique",
        objectives: [
          "Simuler une polymérisation par ouverture de cycle.",
          "Analyser les propriétés mécaniques des polymères obtenus.",
          "Évaluer l'impact environnemental via le module IA.",
        ],
        safetyNotes: [
          "Utiliser les hottes virtuelles lors de la manipulation de solvants.",
          "Activer les capteurs de température automatique.",
        ],
      },
    ],
    freeMode: {
      description:
        "Combinez vos propres réactifs, configurez la cinétique réactionnelle et testez des protocoles innovants en toute sécurité.",
      recommendedTools: ["Hotte virtuelle", "Analyseur spectrométrique", "Tableur de suivi IA"],
      resetChecklist: [
        "Éteindre les plaques chauffantes virtuelles.",
        "Neutraliser l'ensemble des mélanges avant suppression.",
        "Réinitialiser les stocks de réactifs virtuels.",
      ],
    },
  },
  "lab-bio": {
    id: "lab-bio",
    safetyInstructions: [
      "Nettoyer les instruments virtuels avant chaque observation.",
      "Limiter la durée d'exposition lumineuse des cellules sensibles.",
      "Utiliser le mode accessibilité pour les manipulations sensibles.",
    ],
    emergencyProcedures: [
      "Activer le protocole de quarantaine en cas de contamination.",
      "Lancer la stérilisation automatique des échantillons.",
    ],
    experiences: [
      {
        id: "bio-microscopie",
        title: "Observation d'une cellule eucaryote",
        level: "collège",
        duration: 25,
        mode: "guidé",
        programReference: "Cycle 4 - Sciences de la vie",
        objectives: [
          "Identifier les organites principaux.",
          "Configurer un microscope virtuel multi-échelles.",
          "Annoter des observations dans le carnet numérique.",
        ],
        safetyNotes: [
          "Utiliser les gants virtuels lors des manipulations.",
          "Désactiver la lumière UV après observation.",
        ],
      },
      {
        id: "bio-genetique",
        title: "Expression d'un gène rapporteur",
        level: "université",
        duration: 45,
        mode: "guidé",
        programReference: "Licence Biologie L3 - Génétique",
        objectives: [
          "Simuler la transfection d'une cellule.",
          "Mesurer l'expression via fluorescence virtuelle.",
          "Analyser les résultats avec l'assistant IA.",
        ],
        safetyNotes: [
          "Activer le mode confinement virtuel niveau 2.",
          "Stériliser le matériel avant réinitialisation.",
        ],
      },
    ],
    freeMode: {
      description:
        "Créez vos observations personnalisées, injectez vos scénarios biologiques et collaborez en temps réel avec les enseignants.",
      recommendedTools: ["Hologramme 3D", "Tableau d'annotation collaboratif", "Assistant IA"],
      resetChecklist: [
        "Purger les cultures virtuelles actives.",
        "Recharger les kits de colorants numériques.",
        "Sauvegarder les observations avant réinitialisation.",
      ],
    },
  },
  "lab-informatique": {
    id: "lab-informatique",
    safetyInstructions: [
      "Limiter la charge des serveurs virtuels à 75%.",
      "Utiliser des environnements isolés pour les simulations critiques.",
      "Activer le mode supervision pour les classes débutantes.",
    ],
    emergencyProcedures: [
      "Relancer les conteneurs en cas de blocage du GPU partagé.",
      "Sauvegarder les projets sur le cloud institutionnel.",
    ],
    experiences: [
      {
        id: "info-reseau",
        title: "Déploiement d'un réseau sécurisé",
        level: "université",
        duration: 60,
        mode: "guidé",
        programReference: "Licence Informatique L3 - Réseaux",
        objectives: [
          "Configurer un réseau virtuel avec VLAN et pare-feu.",
          "Analyser le trafic via les outils intégrés.",
          "Automatiser le déploiement avec des scripts.",
        ],
        safetyNotes: [
          "Activer le mode lecture seule pour les étudiants novices.",
          "Vérifier les règles de pare-feu avant l'exécution.",
        ],
      },
      {
        id: "info-algo",
        title: "Optimisation d'un algorithme multi-agents",
        level: "lycée",
        duration: 35,
        mode: "guidé",
        programReference: "Terminale NSI - Algorithmique",
        objectives: [
          "Comprendre les stratégies de recherche heuristique.",
          "Déboguer un algorithme existant dans un environnement virtuel.",
          "Comparer les métriques de performance.",
        ],
        safetyNotes: [
          "Limiter l'accès mémoire partagé pour les expériences intensives.",
          "Activer les logs automatiques en cas d'erreur.",
        ],
      },
    ],
    freeMode: {
      description:
        "Montez vos propres environnements de développement, injectez des datasets, testez des architectures et déployez des microservices pédagogiques.",
      recommendedTools: ["Tableau Kanban virtuel", "Monitor temps réel", "Assistant IA code"],
      resetChecklist: [
        "Arrêter les conteneurs virtuels inutilisés.",
        "Purger les volumes de données temporaires.",
        "Vérifier les quotas de ressources attribuées.",
      ],
    },
  },
}

export function getLabDetail(labId: string): LabDetail | null {
  return LAB_DETAILS[labId] ?? null
}






