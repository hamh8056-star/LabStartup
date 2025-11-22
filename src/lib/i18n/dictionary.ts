export type SupportedLocale = "fr" | "en" | "ar"

export type DictionarySection = Record<string, string>

export type LayoutDictionary = {
  workspaceTitle: string
  workspaceHome: string
  workspaceLogin: string
  landingBrand: string
  navHome: string
  navFeatures: string
  navDashboard: string
  navResources: string
  navCommunity: string
  navLogin: string
  navRegister: string
}

export type DashboardSidebarDictionary = {
  overview: string
  simulations: string
  labs: string
  pedagogy: string
  evaluations: string
  certifications: string
  resources: string
  collaboration: string
  accessibility: string
  administration: string
  assistant: string
  security: string
  analytics: string
  creator: string
  community: string
  roleAdmin: string
  roleTeacher: string
  roleStudent: string
  defaultUser: string
  creationModeTitle: string
  creationModeDescription: string
}

export type DashboardMainDictionary = {
  roleConfig: {
    admin: { title: string; subtitle: string }
    teacher: { title: string; subtitle: string }
    student: { title: string; subtitle: string }
  }
  statCards: {
    simulationsAvailable: string
    activeClasses: string
    certificationsIssued: string
    averageEngagement: string
    trendSimulations: string
    trendClasses: string
    trendCertifications: string
    trendEngagement: string
  }
  analytics: {
    title: string
    averageSuccessRate: string
    activeAccounts: string
    simulationsAvailable: string
    resourcesIntegrated: string
    vrReady: string
    vrDescription: string
  }
  aiRecommendations: {
    title: string
    badge: string
  }
  collaborations: {
    title: string
    live: string
    scheduled: string
    participants: string
    simulation: string
    manageRooms: string
  }
  evaluations: {
    title: string
    preQuiz: string
    postQuiz: string
    completed: string
    badge: string
    inProgress: string
  }
  resources: {
    title: string
    subtitle: string
    elements: string
    exploreLibrary: string
  }
  creator: {
    title: string
    description: string
    feature1: string
    feature2: string
    feature3: string
    openCreator: string
  }
  topbar: {
    searchPlaceholder: string
    calendarTooltip: string
    notificationsTooltip: string
  }
  timeline: {
    title: string
    completionRate: string
    averageScore: string
  }
}

export type DashboardDictionary = {
  sidebar: DashboardSidebarDictionary
  main: DashboardMainDictionary
}

export type AuthDictionary = {
  login: {
    title: string
    description: string
    emailLabel: string
    emailPlaceholder: string
    passwordLabel: string
    passwordPlaceholder: string
    passwordDescription: string
    submitButton: string
    submittingButton: string
    continueWithGmail: string
    forgotPassword: string
    requestTeacherAccess: string
    invalidEmail: string
    invalidPassword: string
    unexpectedError: string
    invalidCredentials: string
    loginSuccess: string
    loginSuccessDescription: string
    welcomeMessage: string
    welcomeDescription: string
    credentialsPrefilled: string
    accountReady: string
  }
  card: {
    platformName: string
    immersiveSimulations: string
    immersiveSimulationsDesc: string
    intelligentGuidance: string
    intelligentGuidanceDesc: string
    enhancedSecurity: string
    enhancedSecurityDesc: string
    learnDifferently: string
    discoverPlatform: string
  }
}

export type LandingDictionary = {
  hero: {
    badge: string
    title: string
    description: string
    startFree: string
    exploreInnovations: string
    simulations: string
    institutions: string
    certifications: string
  }
  features: {
    badge: string
    title: string
    description: string
    items: {
      interactive3D: { title: string; description: string }
      virtualLabs: { title: string; description: string }
      teacherStudent: { title: string; description: string }
      realtimeCollab: { title: string; description: string }
      aiEducation: { title: string; description: string }
      evaluation: { title: string; description: string }
      resources: { title: string; description: string }
      accessibility: { title: string; description: string }
      security: { title: string; description: string }
      analytics: { title: string; description: string }
      editor: { title: string; description: string }
      community: { title: string; description: string }
    }
  }
  cta: {
    badge: string
    title: string
    description: string
    viewDashboard: string
    signIn: string
    premiumBadge: string
    premiumTitle: string
    premiumFeatures: string[]
  }
  footer: {
    copyright: string
    privacy: string
    terms: string
    accessibility: string
  }
}

export type Dictionary = {
  common: DictionarySection
  accessibility: DictionarySection
  assistant: DictionarySection
  layout: LayoutDictionary
  dashboard: DashboardDictionary
  auth: AuthDictionary
  landing: LandingDictionary
}

export const dictionaries: Record<SupportedLocale, Dictionary> = {
  fr: {
    common: {
      languageLabel: "Langue",
      offline: "Mode hors ligne",
      online: "Connecté",
      vrReady: "Prêt pour la VR",
    },
    accessibility: {
      title: "Accessibilité et compatibilité",
      subtitle: "Garantir une expérience universelle sur tous les appareils et toutes les plateformes.",
      compatibilityHeading: "Compatibilité multiplateforme",
      compatibilityDescription: "Taalimia s'adapte automatiquement aux écrans PC, tablettes, mobiles et supporte les casques VR via WebXR.",
      offlineHeading: "Fonctionnement hors ligne",
      offlineDescription: "Activez l'installation en mode application pour accéder aux simulations et ressources même sans connexion stable.",
      lmsHeading: "Intégration LMS",
      lmsDescription: "Synchronisez vos cours et résultats avec Moodle, Google Classroom ou via export SCORM/xAPI.",
      languageHeading: "Multilinguisme",
      languageDescription: "Basculez instantanément entre plusieurs langues : français, anglais, arabe.",
    },
    assistant: {
      welcome: "Bonjour ! Comment puis-je vous aider aujourd'hui ?",
    },
    layout: {
      workspaceTitle: "Espace Taalimia",
      workspaceHome: "Retour accueil",
      workspaceLogin: "Connexion",
      landingBrand: "Taalimia",
      navHome: "Accueil",
      navFeatures: "Fonctionnalités",
      navDashboard: "Tableau de bord",
      navResources: "Ressources",
      navCommunity: "Communauté",
      navLogin: "Connexion",
      navRegister: "Créer un compte",
    },
    dashboard: {
      sidebar: {
        overview: "Aperçu",
        simulations: "Simulations",
        labs: "Laboratoires",
        pedagogy: "Pédagogie",
        evaluations: "Évaluations",
        certifications: "Certifications",
        resources: "Ressources",
        collaboration: "Collaboration",
        accessibility: "Accessibilité",
        administration: "Administration",
        assistant: "Assistant IA",
        security: "Sécurité",
        analytics: "Analytics",
        creator: "Éditeur d'expériences",
        community: "Communauté",
        roleAdmin: "Administrateur",
        roleTeacher: "Enseignant",
        roleStudent: "Étudiant",
        defaultUser: "Utilisateur connecté",
        creationModeTitle: "Mode création activé",
        creationModeDescription: "Accédez à l'éditeur d'expériences pour publier vos propres simulations.",
      },
      main: {
        roleConfig: {
          admin: {
            title: "Tableau de bord administrateur",
            subtitle: "Surveillez les usages, gérez les accès et facilitez les initiatives pédagogiques.",
          },
          teacher: {
            title: "Tableau de bord enseignant",
            subtitle: "Supervisez les expériences, collaborez en direct et pilotez vos parcours scientifiques.",
          },
          student: {
            title: "Espace apprenant",
            subtitle: "Retrouvez vos simulations assignées, vos collaborations et vos certifications obtenues.",
          },
        },
        statCards: {
          simulationsAvailable: "Simulations disponibles",
          activeClasses: "Classes actives cette semaine",
          certificationsIssued: "Certifications délivrées",
          averageEngagement: "Engagement moyen",
          trendSimulations: "+18%",
          trendClasses: "+6 groupes",
          trendCertifications: "+240 vs mois précédent",
          trendEngagement: "+12% de temps actif",
        },
        analytics: {
          title: "Vue analytique",
          averageSuccessRate: "Taux de réussite moyen :",
          activeAccounts: "comptes actifs connectés cette semaine.",
          simulationsAvailable: "simulations disponibles et enrichies par l'éditeur d'expériences.",
          resourcesIntegrated: "ressources pédagogiques intégrées (guides, vidéos, quiz).",
          vrReady: "Mode VR prêt",
          vrDescription:
            "Toutes les simulations 3D sont compatibles casques VR et tablettes, avec options d'accessibilité et sous-titres multilingues.",
        },
        aiRecommendations: {
          title: "Recommandations IA",
          badge: "Tuteur virtuel",
        },
        collaborations: {
          title: "Collaborations actives",
          live: "En direct",
          scheduled: "Planifié",
          participants: "participants",
          simulation: "Simulation",
          manageRooms: "Gérer les salles",
        },
        evaluations: {
          title: "Évaluations & badges",
          preQuiz: "Pré-quiz",
          postQuiz: "Post-quiz",
          completed: "% complété",
          badge: "Badge",
          inProgress: "En cours",
        },
        resources: {
          title: "Ressources pédagogiques",
          subtitle: "Guides interactifs, fiches et vidéos pour chaque simulation.",
          elements: "éléments",
          exploreLibrary: "Explorer la bibliothèque",
        },
        creator: {
          title: "Éditeur d'expériences",
          description:
            "Assemblez des simulations en glisser-déposer, ajoutez vos propres composants, substances ou scénarios et publiez-les pour vos classes.",
          feature1: "Bibliothèque d'assets 3D et de capteurs virtuels",
          feature2: "Validation automatique des consignes de sécurité",
          feature3: "Prévisualisation VR instantanée",
          openCreator: "Ouvrir le mode création",
        },
        topbar: {
          searchPlaceholder: "Rechercher une expérience, un étudiant, un badge...",
          calendarTooltip: "Calendrier pédagogique",
          notificationsTooltip: "Notifications",
        },
        timeline: {
          title: "Progression des performances",
          completionRate: "Taux de complétion",
          averageScore: "Score moyen",
        },
      },
    },
    auth: {
      login: {
        title: "Connexion sécurisée",
        description: "Retrouvez vos simulations, vos classes et vos tableaux de bord analytiques.",
        emailLabel: "Email professionnel",
        emailPlaceholder: "enseignant@univ-setif.dz",
        passwordLabel: "Mot de passe",
        passwordPlaceholder: "••••••••",
        passwordDescription: "Minimum 6 caractères, lettres et chiffres recommandés.",
        submitButton: "Se connecter",
        submittingButton: "Connexion en cours...",
        continueWithGmail: "Continuer avec Gmail",
        forgotPassword: "Mot de passe oublié ?",
        requestTeacherAccess: "Demander un accès enseignant",
        invalidEmail: "Adresse email invalide",
        invalidPassword: "Le mot de passe doit comporter au moins 6 caractères",
        unexpectedError: "Une erreur inattendue est survenue. Réessayez dans quelques instants.",
        invalidCredentials: "Les identifiants fournis sont invalides.",
        loginSuccess: "Connexion réussie",
        loginSuccessDescription: "Bienvenue dans votre espace laboratoire.",
        welcomeMessage: "Bienvenue !",
        welcomeDescription: "Votre compte est prêt, connectez-vous pour accéder aux laboratoires.",
        credentialsPrefilled: "Identifiants préremplis",
        accountReady: "Compte {account} prêt à l'usage.",
      },
      card: {
        platformName: "Plateforme Taalimia",
        immersiveSimulations: "Simulations immersives",
        immersiveSimulationsDesc: "Manipulation d'instruments virtuels, mode VR et réactions en temps réel.",
        intelligentGuidance: "Guidage intelligent",
        intelligentGuidanceDesc: "IA éducative, recommandations et tutoriels interactifs reliés aux programmes.",
        enhancedSecurity: "Sécurité renforcée",
        enhancedSecurityDesc: "Authentification NextAuth, rôles dédiés et sauvegarde automatique des parcours.",
        learnDifferently: "Apprendre autrement",
        discoverPlatform: "Découvrir la plateforme",
      },
    },
    landing: {
      hero: {
        badge: "Next-Gen STEM",
        title: "La plateforme de laboratoires virtuels qui révolutionne l'enseignement scientifique.",
        description:
          "Simulations 3D interactives, collaboration temps réel, évaluation intelligente et tableaux de bord analytiques réunis dans une seule expérience immersive, accessible sur navigateur, tablette ou casque VR.",
        startFree: "Commencer gratuitement",
        exploreInnovations: "Explorer les innovations",
        simulations: "Simulations",
        institutions: "Établissements",
        certifications: "Certifications délivrées",
      },
      features: {
        badge: "Expériences immersives",
        title: "Une suite complète pour réinventer les laboratoires scientifiques.",
        description:
          "De la préparation théorique à la certification, Taalimia fusionne simulations immersives, collaboration sociale et analytics pour un apprentissage scientifique engageant.",
        items: {
          interactive3D: {
            title: "Simulations 3D interactives",
            description:
              "Physique, chimie, biologie, électronique… Recréez des manipulations réalistes avec instruments virtuels et réactions en temps réel.",
          },
          virtualLabs: {
            title: "Laboratoires virtuels complets",
            description:
              "Environnements modulaires avec gestion des risques, mode libre et expériences alignées sur les programmes officiels.",
          },
          teacherStudent: {
            title: "Mode enseignant / étudiant",
            description:
              "Gestion des classes, suivi de progression, commentaires contextualisés et corrections guidées.",
          },
          realtimeCollab: {
            title: "Collaboration en temps réel",
            description:
              "Groupes synchrones avec chat audio/texte, partage d'écran et mode classe virtuelle multi-appareils.",
          },
          aiEducation: {
            title: "IA éducative intégrée",
            description:
              "Tuteur virtuel, recommandations intelligentes et analyse des erreurs pour un coaching individualisé.",
          },
          evaluation: {
            title: "Évaluation & certifications",
            description:
              "Quiz adaptatifs, barèmes automatiques, badges d'accomplissement et certificats personnalisés.",
          },
          resources: {
            title: "Ressources pédagogiques",
            description:
              "Guides interactifs, vidéos, fiches de laboratoire et exercices corrigés intégrés directement aux parcours.",
          },
          accessibility: {
            title: "Accessibilité & compatibilité",
            description:
              "Disponible sur navigateur, tablette ou casque VR, multilingue et connectée aux plateformes LMS.",
          },
          security: {
            title: "Sécurité & conformité",
            description:
              "Authentification sécurisée, rôles avancés, sauvegardes automatiques et compatibilité LMS.",
          },
          analytics: {
            title: "Tableaux de bord analytiques",
            description:
              "Suivi des performances, temps passé, rapports exportables et insights actionnables.",
          },
          editor: {
            title: "Éditeur d'expériences",
            description:
              "Concepteur visuel pour créer, personnaliser et partager de nouvelles simulations en quelques minutes.",
          },
          community: {
            title: "Communauté & partage",
            description:
              "Forum intégré, publication de projets étudiants, classements et concours pour animer votre réseau scientifique.",
          },
        },
      },
      cta: {
        badge: "Sécurité & conformité",
        title: "Rejoignez l'avant-garde des laboratoires virtuels.",
        description:
          "Compatible avec Moodle, Google Classroom, authentification SSO et sauvegardes automatiques. Une solution prête pour les établissements innovants.",
        viewDashboard: "Voir un tableau de bord exemple",
        signIn: "Se connecter",
        premiumBadge: "Assistance premium",
        premiumTitle: "Onboarding dédié, formation enseignants et support 24/7 pour vos équipes pédagogiques.",
        premiumFeatures: [
          "+ Accès anticipé aux nouvelles simulations",
          "+ Communauté internationale d'experts",
          "+ Certificats vérifiables en un clic",
        ],
      },
      footer: {
        copyright: "Tous droits réservés.",
        privacy: "Confidentialité",
        terms: "Conditions générales",
        accessibility: "Accessibilité",
      },
    },
  },
  en: {
    common: {
      languageLabel: "Language",
      offline: "Offline mode",
      online: "Online",
      vrReady: "VR ready",
    },
    accessibility: {
      title: "Accessibility & compatibility",
      subtitle: "Deliver a seamless experience across every device and learning platform.",
      compatibilityHeading: "Cross-device compatibility",
      compatibilityDescription: "Taalimia automatically adapts to desktops, tablets, phones and supports VR headsets through WebXR.",
      offlineHeading: "Offline experience",
      offlineDescription: "Install the app mode to access simulations and resources even without a stable connection.",
      lmsHeading: "LMS integration",
      lmsDescription: "Sync your classes and grades with Moodle, Google Classroom or export SCORM/xAPI packages.",
      languageHeading: "Multilingual support",
      languageDescription: "Switch instantly between French, English and Arabic interfaces.",
    },
    assistant: {
      welcome: "Hello! How can I help you today?",
    },
    layout: {
      workspaceTitle: "Taalimia Workspace",
      workspaceHome: "Back to home",
      workspaceLogin: "Sign in",
      landingBrand: "Taalimia",
      navHome: "Home",
      navFeatures: "Features",
      navDashboard: "Dashboard",
      navResources: "Resources",
      navCommunity: "Community",
      navLogin: "Sign in",
      navRegister: "Create account",
    },
    dashboard: {
      sidebar: {
        overview: "Overview",
        simulations: "Simulations",
        labs: "Labs",
        pedagogy: "Teaching",
        evaluations: "Assessments",
        certifications: "Certifications",
        resources: "Resources",
        collaboration: "Collaboration",
        accessibility: "Accessibility",
        administration: "Administration",
        assistant: "AI Assistant",
        security: "Security",
        analytics: "Analytics",
        creator: "Experience Builder",
        community: "Community",
        roleAdmin: "Administrator",
        roleTeacher: "Teacher",
        roleStudent: "Student",
        defaultUser: "Signed-in user",
        creationModeTitle: "Creation mode enabled",
        creationModeDescription: "Open the experience builder to publish your own simulations.",
      },
      main: {
        roleConfig: {
          admin: {
            title: "Administrator dashboard",
            subtitle: "Monitor usage, manage access and facilitate educational initiatives.",
          },
          teacher: {
            title: "Teacher dashboard",
            subtitle: "Supervise experiences, collaborate in real-time and pilot your scientific courses.",
          },
          student: {
            title: "Learner space",
            subtitle: "Find your assigned simulations, collaborations and earned certifications.",
          },
        },
        statCards: {
          simulationsAvailable: "Available simulations",
          activeClasses: "Active classes this week",
          certificationsIssued: "Certifications issued",
          averageEngagement: "Average engagement",
          trendSimulations: "+18%",
          trendClasses: "+6 groups",
          trendCertifications: "+240 vs previous month",
          trendEngagement: "+12% active time",
        },
        analytics: {
          title: "Analytical view",
          averageSuccessRate: "Average success rate:",
          activeAccounts: "active accounts connected this week.",
          simulationsAvailable: "simulations available and enriched by the experience editor.",
          resourcesIntegrated: "educational resources integrated (guides, videos, quizzes).",
          vrReady: "VR mode ready",
          vrDescription:
            "All 3D simulations are compatible with VR headsets and tablets, with accessibility options and multilingual subtitles.",
        },
        aiRecommendations: {
          title: "AI Recommendations",
          badge: "Virtual tutor",
        },
        collaborations: {
          title: "Active collaborations",
          live: "Live",
          scheduled: "Scheduled",
          participants: "participants",
          simulation: "Simulation",
          manageRooms: "Manage rooms",
        },
        evaluations: {
          title: "Assessments & badges",
          preQuiz: "Pre-quiz",
          postQuiz: "Post-quiz",
          completed: "% completed",
          badge: "Badge",
          inProgress: "In progress",
        },
        resources: {
          title: "Educational resources",
          subtitle: "Interactive guides, sheets and videos for each simulation.",
          elements: "elements",
          exploreLibrary: "Explore library",
        },
        creator: {
          title: "Experience editor",
          description:
            "Assemble simulations with drag-and-drop, add your own components, substances or scenarios and publish them for your classes.",
          feature1: "Library of 3D assets and virtual sensors",
          feature2: "Automatic validation of safety instructions",
          feature3: "Instant VR preview",
          openCreator: "Open creation mode",
        },
        topbar: {
          searchPlaceholder: "Search for an experience, student, badge...",
          calendarTooltip: "Educational calendar",
          notificationsTooltip: "Notifications",
        },
        timeline: {
          title: "Performance progression",
          completionRate: "Completion rate",
          averageScore: "Average score",
        },
      },
    },
    auth: {
      login: {
        title: "Secure login",
        description: "Access your simulations, classes and analytics dashboards.",
        emailLabel: "Professional email",
        emailPlaceholder: "teacher@univ-setif.dz",
        passwordLabel: "Password",
        passwordPlaceholder: "••••••••",
        passwordDescription: "Minimum 6 characters, letters and numbers recommended.",
        submitButton: "Sign in",
        submittingButton: "Signing in...",
        continueWithGmail: "Continue with Gmail",
        forgotPassword: "Forgot password?",
        requestTeacherAccess: "Request teacher access",
        invalidEmail: "Invalid email address",
        invalidPassword: "Password must be at least 6 characters",
        unexpectedError: "An unexpected error occurred. Please try again in a few moments.",
        invalidCredentials: "The provided credentials are invalid.",
        loginSuccess: "Login successful",
        loginSuccessDescription: "Welcome to your laboratory space.",
        welcomeMessage: "Welcome!",
        welcomeDescription: "Your account is ready, sign in to access the laboratories.",
        credentialsPrefilled: "Credentials prefilled",
        accountReady: "{account} account ready to use.",
      },
      card: {
        platformName: "Taalimia Platform",
        immersiveSimulations: "Immersive simulations",
        immersiveSimulationsDesc: "Virtual instrument manipulation, VR mode and real-time reactions.",
        intelligentGuidance: "Intelligent guidance",
        intelligentGuidanceDesc: "Educational AI, recommendations and interactive tutorials linked to curricula.",
        enhancedSecurity: "Enhanced security",
        enhancedSecurityDesc: "NextAuth authentication, dedicated roles and automatic path saving.",
        learnDifferently: "Learn differently",
        discoverPlatform: "Discover the platform",
      },
    },
    landing: {
      hero: {
        badge: "Next-Gen STEM",
        title: "The virtual laboratory platform revolutionizing scientific education.",
        description:
          "Interactive 3D simulations, real-time collaboration, intelligent assessment and analytical dashboards combined in a single immersive experience, accessible on browser, tablet or VR headset.",
        startFree: "Start for free",
        exploreInnovations: "Explore innovations",
        simulations: "Simulations",
        institutions: "Institutions",
        certifications: "Certifications issued",
      },
      features: {
        badge: "Immersive experiences",
        title: "A complete suite to reinvent scientific laboratories.",
        description:
          "From theoretical preparation to certification, Taalimia merges immersive simulations, social collaboration and analytics for engaging scientific learning.",
        items: {
          interactive3D: {
            title: "Interactive 3D simulations",
            description:
              "Physics, chemistry, biology, electronics… Recreate realistic manipulations with virtual instruments and real-time reactions.",
          },
          virtualLabs: {
            title: "Complete virtual laboratories",
            description:
              "Modular environments with risk management, free mode and experiences aligned with official curricula.",
          },
          teacherStudent: {
            title: "Teacher / student mode",
            description:
              "Class management, progress tracking, contextual comments and guided corrections.",
          },
          realtimeCollab: {
            title: "Real-time collaboration",
            description:
              "Synchronous groups with audio/text chat, screen sharing and multi-device virtual classroom mode.",
          },
          aiEducation: {
            title: "Integrated educational AI",
            description:
              "Virtual tutor, intelligent recommendations and error analysis for individualized coaching.",
          },
          evaluation: {
            title: "Assessment & certifications",
            description:
              "Adaptive quizzes, automatic grading, achievement badges and personalized certificates.",
          },
          resources: {
            title: "Educational resources",
            description:
              "Interactive guides, videos, lab sheets and corrected exercises integrated directly into courses.",
          },
          accessibility: {
            title: "Accessibility & compatibility",
            description:
              "Available on browser, tablet or VR headset, multilingual and connected to LMS platforms.",
          },
          security: {
            title: "Security & compliance",
            description:
              "Secure authentication, advanced roles, automatic backups and LMS compatibility.",
          },
          analytics: {
            title: "Analytical dashboards",
            description:
              "Performance tracking, time spent, exportable reports and actionable insights.",
          },
          editor: {
            title: "Experience editor",
            description:
              "Visual designer to create, customize and share new simulations in minutes.",
          },
          community: {
            title: "Community & sharing",
            description:
              "Integrated forum, student project publishing, rankings and competitions to animate your scientific network.",
          },
        },
      },
      cta: {
        badge: "Security & compliance",
        title: "Join the forefront of virtual laboratories.",
        description:
          "Compatible with Moodle, Google Classroom, SSO authentication and automatic backups. A solution ready for innovative institutions.",
        viewDashboard: "View example dashboard",
        signIn: "Sign in",
        premiumBadge: "Premium support",
        premiumTitle: "Dedicated onboarding, teacher training and 24/7 support for your educational teams.",
        premiumFeatures: [
          "+ Early access to new simulations",
          "+ International community of experts",
          "+ Verifiable certificates with one click",
        ],
      },
      footer: {
        copyright: "All rights reserved.",
        privacy: "Privacy",
        terms: "Terms",
        accessibility: "Accessibility",
      },
    },
  },
  ar: {
    common: {
      languageLabel: "اللغة",
      offline: "وضع دون اتصال",
      online: "متصل",
      vrReady: "جاهز للواقع الافتراضي",
    },
    accessibility: {
      title: "إمكانية الوصول والتوافق",
      subtitle: "تجربة تعليمية سلسة على جميع الأجهزة والمنصات.",
      compatibilityHeading: "التوافق متعدد الأجهزة",
      compatibilityDescription: "يتكيف Taalimia تلقائيًا مع الحاسوب، الجهاز اللوحي، الهاتف ويدعم نظارات الواقع الافتراضي عبر WebXR.",
      offlineHeading: "العمل دون اتصال",
      offlineDescription: "قم بتثبيت التطبيق للاستفادة من المحاكاة والموارد حتى بدون اتصال مستقر.",
      lmsHeading: "تكامل مع منصات LMS",
      lmsDescription: "زامن الدروس والدرجات مع Moodle أو Google Classroom أو صدّر ملفات SCORM/xAPI.",
      languageHeading: "دعم متعدد اللغات",
      languageDescription: "بدّل فورًا بين الواجهة بالفرنسية، الإنجليزية أو العربية.",
    },
    assistant: {
      welcome: "مرحبًا! كيف يمكنني مساعدتك اليوم؟",
    },
    layout: {
      workspaceTitle: "مساحة Taalimia",
      workspaceHome: "العودة إلى الصفحة الرئيسية",
      workspaceLogin: "تسجيل الدخول",
      landingBrand: "Taalimia",
      navHome: "الصفحة الرئيسية",
      navFeatures: "الميزات",
      navDashboard: "لوحة التحكم",
      navResources: "الموارد",
      navCommunity: "المجتمع",
      navLogin: "تسجيل الدخول",
      navRegister: "إنشاء حساب",
    },
    dashboard: {
      sidebar: {
        overview: "نظرة عامة",
        simulations: "المحاكاة",
        labs: "المختبرات",
        pedagogy: "التربية",
        evaluations: "التقييمات",
        certifications: "الشهادات",
        resources: "الموارد",
        collaboration: "التعاون",
        accessibility: "إمكانية الوصول",
        administration: "الإدارة",
        assistant: "المساعد الذكي",
        security: "الأمان",
        analytics: "التحليلات",
        creator: "منشئ التجارب",
        community: "المجتمع",
        roleAdmin: "مسؤول",
        roleTeacher: "معلم",
        roleStudent: "طالب",
        defaultUser: "مستخدم متصل",
        creationModeTitle: "وضع الإنشاء مفعّل",
        creationModeDescription: "الوصول إلى محرر التجارب لنشر محاكاة خاصة بكم.",
      },
      main: {
        roleConfig: {
          admin: {
            title: "لوحة تحكم المسؤول",
            subtitle: "راقب الاستخدامات، أدر الوصول ويسّر المبادرات التعليمية.",
          },
          teacher: {
            title: "لوحة تحكم المعلم",
            subtitle: "راقب التجارب، تعاون مباشرة ووجّه مساراتك العلمية.",
          },
          student: {
            title: "مساحة المتعلم",
            subtitle: "استرجع محاكاةك المخصصة، تعاوناتك وشهاداتك المحصل عليها.",
          },
        },
        statCards: {
          simulationsAvailable: "المحاكاة المتاحة",
          activeClasses: "الفصول النشطة هذا الأسبوع",
          certificationsIssued: "الشهادات الصادرة",
          averageEngagement: "الانخراط المتوسط",
          trendSimulations: "+18%",
          trendClasses: "+6 مجموعات",
          trendCertifications: "+240 مقابل الشهر السابق",
          trendEngagement: "+12% وقت نشط",
        },
        analytics: {
          title: "نظرة تحليلية",
          averageSuccessRate: "معدل النجاح المتوسط :",
          activeAccounts: "حسابات نشطة متصلة هذا الأسبوع.",
          simulationsAvailable: "محاكاة متاحة ومثراة بواسطة محرر التجارب.",
          resourcesIntegrated: "موارد تعليمية مدمجة (أدلة، فيديوهات، اختبارات).",
          vrReady: "وضع الواقع الافتراضي جاهز",
          vrDescription:
            "جميع المحاكاة ثلاثية الأبعاد متوافقة مع نظارات الواقع الافتراضي والأجهزة اللوحية، مع خيارات إمكانية الوصول وترجمات متعددة اللغات.",
        },
        aiRecommendations: {
          title: "توصيات الذكاء الاصطناعي",
          badge: "معلم افتراضي",
        },
        collaborations: {
          title: "تعاونات نشطة",
          live: "مباشر",
          scheduled: "مجدول",
          participants: "مشاركين",
          simulation: "المحاكاة",
          manageRooms: "إدارة القاعات",
        },
        evaluations: {
          title: "التقييمات والشارات",
          preQuiz: "اختبار قبل",
          postQuiz: "اختبار بعد",
          completed: "% مكتمل",
          badge: "شارة",
          inProgress: "قيد التنفيذ",
        },
        resources: {
          title: "الموارد التعليمية",
          subtitle: "أدلة تفاعلية، أوراق وفيديوهات لكل محاكاة.",
          elements: "عناصر",
          exploreLibrary: "استكشف المكتبة",
        },
        creator: {
          title: "محرر التجارب",
          description:
            "اجمع المحاكاة بالسحب والإفلات، أضف مكوناتك الخاصة، المواد أو السيناريوهات ونشرها لفصولك.",
          feature1: "مكتبة أصول ثلاثية الأبعاد وأجهزة استشعار افتراضية",
          feature2: "التحقق التلقائي من تعليمات السلامة",
          feature3: "معاينة الواقع الافتراضي الفورية",
          openCreator: "فتح وضع الإنشاء",
        },
        topbar: {
          searchPlaceholder: "ابحث عن تجربة، طالب، شارة...",
          calendarTooltip: "التقويم التعليمي",
          notificationsTooltip: "الإشعارات",
        },
        timeline: {
          title: "تطور الأداء",
          completionRate: "معدل الإتمام",
          averageScore: "النتيجة المتوسطة",
        },
      },
    },
    auth: {
      login: {
        title: "تسجيل الدخول الآمن",
        description: "استرجع محاكاةك وفصولك ولوحات التحليل الخاصة بك.",
        emailLabel: "البريد الإلكتروني المهني",
        emailPlaceholder: "enseignant@univ-setif.dz",
        passwordLabel: "كلمة المرور",
        passwordPlaceholder: "••••••••",
        passwordDescription: "الحد الأدنى 6 أحرف، يُنصح بالأحرف والأرقام.",
        submitButton: "تسجيل الدخول",
        submittingButton: "جارٍ تسجيل الدخول...",
        continueWithGmail: "المتابعة مع Gmail",
        forgotPassword: "نسيت كلمة المرور؟",
        requestTeacherAccess: "طلب وصول المعلم",
        invalidEmail: "عنوان بريد إلكتروني غير صالح",
        invalidPassword: "يجب أن تحتوي كلمة المرور على 6 أحرف على الأقل",
        unexpectedError: "حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى بعد لحظات قليلة.",
        invalidCredentials: "بيانات الاعتماد المقدمة غير صالحة.",
        loginSuccess: "تم تسجيل الدخول بنجاح",
        loginSuccessDescription: "مرحبًا بك في مساحة المختبر الخاصة بك.",
        welcomeMessage: "مرحبًا!",
        welcomeDescription: "حسابك جاهز، سجّل الدخول للوصول إلى المختبرات.",
        credentialsPrefilled: "تم ملء بيانات الاعتماد مسبقًا",
        accountReady: "حساب {account} جاهز للاستخدام.",
      },
      card: {
        platformName: "منصة Taalimia",
        immersiveSimulations: "محاكاة غامرة",
        immersiveSimulationsDesc: "التعامل مع الأدوات الافتراضية، وضع الواقع الافتراضي والتفاعلات في الوقت الفعلي.",
        intelligentGuidance: "إرشاد ذكي",
        intelligentGuidanceDesc: "ذكاء اصطناعي تعليمي، توصيات ودروس تفاعلية مرتبطة بالمناهج.",
        enhancedSecurity: "أمان محسّن",
        enhancedSecurityDesc: "مصادقة NextAuth، أدوار مخصصة وحفظ تلقائي للمسارات.",
        learnDifferently: "تعلم بشكل مختلف",
        discoverPlatform: "اكتشف المنصة",
      },
    },
    landing: {
      hero: {
        badge: "STEM الجيل القادم",
        title: "منصة المختبرات الافتراضية التي تحدث ثورة في التعليم العلمي.",
        description:
          "محاكاة ثلاثية الأبعاد تفاعلية، تعاون في الوقت الفعلي، تقييم ذكي ولوحات تحليلية مجمعة في تجربة غامرة واحدة، متاحة على المتصفح، الجهاز اللوحي أو نظارة الواقع الافتراضي.",
        startFree: "ابدأ مجانًا",
        exploreInnovations: "استكشف الابتكارات",
        simulations: "المحاكاة",
        institutions: "المؤسسات",
        certifications: "الشهادات الصادرة",
      },
      features: {
        badge: "تجارب غامرة",
        title: "مجموعة كاملة لإعادة اختراع المختبرات العلمية.",
        description:
          "من التحضير النظري إلى الشهادة، Taalimia تدمج المحاكاة الغامرة، التعاون الاجتماعي والتحليلات من أجل تعلم علمي جذاب.",
        items: {
          interactive3D: {
            title: "محاكاة ثلاثية الأبعاد تفاعلية",
            description:
              "الفيزياء، الكيمياء، الأحياء، الإلكترونيات… أعد إنشاء التلاعبات الواقعية مع أدوات افتراضية وردود فعل في الوقت الفعلي.",
          },
          virtualLabs: {
            title: "مختبرات افتراضية كاملة",
            description:
              "بيئات معيارية مع إدارة المخاطر، وضع حر وتجارب متوافقة مع المناهج الرسمية.",
          },
          teacherStudent: {
            title: "وضع المعلم / الطالب",
            description:
              "إدارة الفصول، متابعة التقدم، تعليقات سياقية وتصحيحات موجهة.",
          },
          realtimeCollab: {
            title: "تعاون في الوقت الفعلي",
            description:
              "مجموعات متزامنة مع دردشة صوتية/نصية، مشاركة الشاشة ووضع الفصل الافتراضي متعدد الأجهزة.",
          },
          aiEducation: {
            title: "ذكاء اصطناعي تعليمي مدمج",
            description:
              "معلم افتراضي، توصيات ذكية وتحليل الأخطاء من أجل تدريب فردي.",
          },
          evaluation: {
            title: "التقييم والشهادات",
            description:
              "اختبارات تكيفية، معايير تلقائية، شارات الإنجاز وشهادات مخصصة.",
          },
          resources: {
            title: "الموارد التعليمية",
            description:
              "أدلة تفاعلية، فيديوهات، أوراق المختبر وتمارين مصححة مدمجة مباشرة في المسارات.",
          },
          accessibility: {
            title: "إمكانية الوصول والتوافق",
            description:
              "متاحة على المتصفح، الجهاز اللوحي أو نظارة الواقع الافتراضي، متعددة اللغات ومتصلة بمنصات LMS.",
          },
          security: {
            title: "الأمان والامتثال",
            description:
              "مصادقة آمنة، أدوار متقدمة، نسخ احتياطية تلقائية وتوافق LMS.",
          },
          analytics: {
            title: "لوحات تحليلية",
            description:
              "متابعة الأداء، الوقت المستغرق، تقارير قابلة للتصدير ورؤى قابلة للتنفيذ.",
          },
          editor: {
            title: "محرر التجارب",
            description:
              "مصمم مرئي لإنشاء وتخصيص ومشاركة محاكاة جديدة في دقائق.",
          },
          community: {
            title: "المجتمع والمشاركة",
            description:
              "منتدى مدمج، نشر مشاريع الطلاب، التصنيفات والمسابقات لتحريك شبكتك العلمية.",
          },
        },
      },
      cta: {
        badge: "الأمان والامتثال",
        title: "انضم إلى طليعة المختبرات الافتراضية.",
        description:
          "متوافق مع Moodle، Google Classroom، مصادقة SSO ونسخ احتياطية تلقائية. حل جاهز للمؤسسات المبتكرة.",
        viewDashboard: "عرض لوحة تحكم مثال",
        signIn: "تسجيل الدخول",
        premiumBadge: "دعم متميز",
        premiumTitle: "إدماج مخصص، تدريب المعلمين ودعم 24/7 لفرقك التعليمية.",
        premiumFeatures: [
          "+ وصول مبكر للمحاكاة الجديدة",
          "+ مجتمع دولي من الخبراء",
          "+ شهادات قابلة للتحقق بنقرة واحدة",
        ],
      },
      footer: {
        copyright: "جميع الحقوق محفوظة.",
        privacy: "الخصوصية",
        terms: "الشروط",
        accessibility: "إمكانية الوصول",
      },
    },
  },
}

export const getDictionary = (locale: SupportedLocale): Dictionary => dictionaries[locale]
