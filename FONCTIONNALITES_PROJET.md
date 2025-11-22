# 📚 Guide des Fonctionnalités - LabStartup (Taalimia)

## 🎯 Vue d'ensemble

**LabStartup (Taalimia)** est une plateforme éducative immersive de laboratoires virtuels 3D pour l'enseignement scientifique. Elle combine des simulations 3D réalistes, la collaboration en temps réel, l'intelligence artificielle pédagogique et des outils d'évaluation pour révolutionner l'apprentissage des sciences.

---

## 🏗️ Architecture Technique

### Stack Technologique
- **Framework** : Next.js 16 (App Router, Server Components)
- **UI** : Tailwind CSS 4, Shadcn UI, thèmes clair/sombre
- **3D** : React Three Fiber + Drei (Three.js)
- **Authentification** : NextAuth.js (Credentials + MongoDB Adapter)
- **Base de données** : MongoDB (driver officiel)
- **Formulaires** : React Hook Form + Zod
- **Internationalisation** : i18n (français/anglais)

---

## 🚀 Fonctionnalités Principales

### 1. 🎨 **Page d'Accueil (Landing Page)**

**Route** : `/`

**Fonctionnalités** :
- Section Hero avec présentation de la plateforme
- Grille de 12 fonctionnalités clés :
  - Simulations 3D interactives
  - Laboratoires virtuels
  - Enseignant/Étudiant
  - Collaboration temps réel
  - IA éducative
  - Évaluations
  - Ressources pédagogiques
  - Accessibilité
  - Sécurité
  - Analytics
  - Éditeur de contenu
  - Communauté
- Appel à l'action (CTA)
- Footer avec liens et informations

---

### 2. 🔐 **Authentification et Gestion des Utilisateurs**

**Routes** : `/auth/login`, `/auth/register`, `/auth/forgot-password`, `/auth/reset-password`

**Fonctionnalités** :
- **Inscription** : Création de compte avec validation
- **Connexion** : Authentification sécurisée
- **Récupération de mot de passe** : Réinitialisation via email
- **Rôles utilisateurs** :
  - 👨‍🎓 **Étudiant** : Accès aux simulations, laboratoires, ressources
  - 👨‍🏫 **Enseignant** : Accès complet + outils pédagogiques
  - 👨‍💼 **Administrateur** : Accès total + gestion système

**Comptes de démonstration** :
- Admin : `admin@univ-setif.dz` / `Taalimia#2025`
- Enseignant : `enseignant@univ-setif.dz` / `Taalimia#2025`
- Étudiant : `etudiant@univ-setif.dz` / `Taalimia#2025`

---

### 3. 📊 **Tableau de Bord Principal**

**Route** : `/dashboard`

**Fonctionnalités** :
- **Vue d'ensemble personnalisée** selon le rôle
- **Statistiques** :
  - Nombre de simulations disponibles
  - Classes actives
  - Certifications obtenues
  - Taux d'engagement
- **Timeline de performance** : Graphique d'évolution
- **Recommandations IA** : Suggestions personnalisées
- **Prochaines sessions** : Collaborations à venir
- **Ressources en vedette** : Contenus recommandés
- **Évaluations récentes** : Quiz et tests

---

### 4. 🧪 **Laboratoires Virtuels 3D**

**Route** : `/dashboard/labs`

**Fonctionnalités** :
- **3 Laboratoires professionnels** :
  
  #### 🧬 **Laboratoire de Biologie**
  - **100+ objets 3D réalistes** (mobilier, verrerie, équipements)
  - **7 instruments interactifs** :
    1. Microscope (magnification, focus, lumière)
    2. Incubateur CO₂ (température, humidité, CO₂)
    3. Centrifugeuse (vitesse, temps, température)
    4. Autoclave (température, pression, temps)
    5. Balance analytique (poids, tare, unité)
    6. pH-mètre (pH, température)
    7. Spectrophotomètre (longueur d'onde, absorbance)
  - **Textures générées par IA** : Sol époxy, murs, bois, métal
  - **4 grandes fenêtres** avec vue extérieure réaliste
  - **Lumière naturelle volumétrique** et reflets environnementaux
  - **Équipements de sécurité** : Hotte aspirante, douche, extincteur
  - **50+ pièces de verrerie** avec solutions colorées
  
  #### ⚛️ **Laboratoire de Physique**
  - **5 instruments interactifs** :
    1. Laser He-Ne (longueur d'onde, puissance)
    2. Oscilloscope (affichage temps réel)
    3. Électroaimant (intensité, champ magnétique)
    4. Pendule (longueur, amplitude, période)
    5. Voltmètre (tension, courant)
  - **Textures IA** : Sol industriel, murs gris
  - **4 fenêtres** avec vue extérieure
  - **Faisceau laser visible** et réactif
  - **Planche optique** avec supports
  - **Mobilier technique** complet
  
  #### 🧪 **Laboratoire de Chimie**
  - **5 instruments interactifs** :
    1. Bec Bunsen (intensité flamme, température)
    2. Burette de titrage (volume, pH avec couleur dynamique)
    3. Agitateur magnétique (vitesse, température)
    4. Hotte aspirante (débit d'air, température)
    5. Thermomètre numérique (température, pression)
  - **Textures IA** : Sol époxy, murs jaunes sécurité
  - **Hotte aspirante 3m** avec vitre et extraction
  - **6 béchers** avec solutions colorées
  - **Système de titrage** avec indicateur pH coloré
  - **Équipements sécurité** complets

**Caractéristiques communes** :
- **Navigation 3D** : Contrôles souris/clavier
- **Instruments interactifs** : Sliders pour paramètres, affichage données temps réel
- **Environnement immersif** : Skybox HDRI, éclairage réaliste
- **Mode collaboration** : Sessions multi-utilisateurs

**Accès** : Cliquer sur "Ouvrir le laboratoire" depuis la liste

---

### 5. ⚛️ **Simulations 3D**

**Route** : `/dashboard/simulations`

**Fonctionnalités** :
- **Bibliothèque de simulations** par discipline :
  - Physique (optique, mécanique, électromagnétisme)
  - Chimie (réactions, équilibres, synthèses)
  - Biologie (cellules, génétique, physiologie)
  - Électronique (circuits, amplificateurs)
  - Informatique (algorithmes, structures de données)
- **Filtres** : Discipline, difficulté, durée
- **Détails** : Objectifs, prérequis, durée estimée
- **Assets 3D** : Modèles, vidéos, documents

---

### 6. 👥 **Collaboration en Temps Réel**

**Route** : `/dashboard/collaboration`

**Fonctionnalités** :
- **Salles de collaboration** :
  - Création de salles pour TP synchrones
  - Gestion des membres (enseignants/étudiants)
  - Statut en ligne/hors ligne/en simulation
- **Chat en temps réel** : Messages texte
- **Partage d'écran** : Simulation, tableau, résultats
- **Groupes de travail** : Breakout rooms
- **Canal vocal** : Communication audio
- **Notes partagées** : Annotations collaboratives
- **Historique** : Logs de sessions

---

### 7. 🤖 **Assistant IA Pédagogique**

**Route** : `/dashboard/assistant`

**Fonctionnalités** :
- **Recommandations personnalisées** :
  - Pour enseignants : Analyse formative, suggestions de ressources
  - Pour étudiants : Prochaines expériences, révisions ciblées
- **Diagnostics** : Analyse des performances
- **Suggestions d'actions** : Prochaines étapes recommandées
- **Niveau de confiance** : Score de pertinence des recommandations

---

### 8. 📝 **Évaluations et Quiz**

**Route** : `/dashboard/evaluations`

**Fonctionnalités** :
- **Quiz pré/post simulation** :
  - Questions à choix multiples
  - Explications détaillées
  - Système de points
- **Suivi des performances** :
  - Score pré-quiz
  - Score post-quiz
  - Taux de complétion
  - Temps moyen
- **Statuts** : En attente, complété, certifié
- **Rubriques** : Critères d'évaluation
- **Historique** : Tentatives précédentes

---

### 9. 🏆 **Certifications**

**Route** : `/dashboard/certifications`

**Fonctionnalités** :
- **Badges** :
  - 🟢 **Explorateur** : Niveau débutant
  - 🟡 **Innovateur** : Niveau intermédiaire
  - 🔴 **Mentor** : Niveau avancé
- **Seuils de score** : Définition par badge
- **Émission automatique** : Après réussite d'évaluation
- **Historique** : Certifications obtenues
- **Export** : PDF/Badge numérique

---

### 10. 📚 **Ressources Pédagogiques**

**Route** : `/dashboard/resources`

**Fonctionnalités** :
- **Types de ressources** :
  - 📄 **Fiches** : Guides pratiques
  - 📖 **Manuels** : Contenus structurés
  - 🎥 **Vidéos** : Démonstrations
  - 🎬 **Animations** : Visualisations interactives
  - ✏️ **Exercices** : Pratique guidée
- **Filtres** : Discipline, niveau (collège/lycée/université), format
- **Pièces jointes** : PDF, modules, datasets, slides, templates
- **Manuels interactifs** :
  - Sections structurées
  - Prérequis
  - Consignes de sécurité
  - Quiz formatifs
- **Vidéos** :
  - Chapitres avec timecodes
  - Sous-titres
  - Téléchargement
- **Exercices** :
  - Difficulté (facile/intermédiaire/avancé)
  - Système de scoring
  - Seuil de réussite

---

### 11. 👨‍🏫 **Espace Enseignant**

**Route** : `/dashboard/teacher`

**Fonctionnalités** :
- **Gestion de classes** :
  - Création de classes
  - Ajout d'étudiants
  - Attribution de simulations
- **Devoirs** :
  - Création d'assignations
  - Dates limites
  - Suivi des soumissions
- **Analytics** :
  - Performance des étudiants
  - Taux de complétion
  - Statistiques par simulation
- **Ressources pédagogiques** : Bibliothèque personnelle

---

### 12. 📊 **Analytics et Statistiques**

**Route** : `/dashboard/analytics`

**Fonctionnalités** :
- **Résumé analytique** :
  - Utilisateurs actifs
  - Simulations complétées
  - Temps moyen par session
  - Taux d'engagement
- **Timeline de performance** : Graphiques d'évolution
- **Export de données** : CSV, JSON
- **Filtres** : Période, discipline, utilisateur

---

### 13. 🛠️ **Créateur de Contenu**

**Route** : `/dashboard/creator`

**Fonctionnalités** :
- **Création d'expériences** :
  - Éditeur de simulations
  - Intégration d'assets 3D
  - Configuration d'instruments
- **Publication** : Mise en ligne de contenus
- **Gestion** : Modification, suppression
- **Statistiques** : Utilisation des créations

---

### 14. 🌐 **Communauté**

**Route** : `/dashboard/community`

**Fonctionnalités** :
- **Projets communautaires** :
  - Partage de simulations
  - Collaboration sur contenus
  - Feedback et évaluations
- **Forum** : Discussions par discipline
- **Ressources partagées** : Bibliothèque communautaire

---

### 15. ♿ **Accessibilité**

**Route** : `/dashboard/accessibility`

**Fonctionnalités** :
- **Paramètres d'accessibilité** :
  - Contraste élevé
  - Taille de police
  - Navigation au clavier
  - Lecteur d'écran
- **Sous-titres** : Pour vidéos
- **Transcriptions** : Pour audio
- **Mode daltonien** : Adaptation des couleurs

---

### 16. 🔒 **Sécurité**

**Route** : `/dashboard/security` (Admin uniquement)

**Fonctionnalités** :
- **Gestion des clés API** :
  - Création, révocation
  - Permissions
- **Logs d'audit** :
  - Historique des actions
  - Connexions
  - Modifications
- **Sauvegardes** :
  - Planification
  - Restauration
- **Surveillance** : Alertes de sécurité

---

### 17. 👨‍💼 **Administration**

**Route** : `/dashboard/admin`

**Fonctionnalités** :
- **Gestion des utilisateurs** :
  - Création, modification, suppression
  - Attribution de rôles
  - Réinitialisation de mots de passe
- **Gestion du contenu** :
  - Modération des ressources
  - Validation des simulations
- **Configuration système** :
  - Paramètres généraux
  - Intégrations LMS
  - Maintenance

---

### 18. 🌍 **Internationalisation (i18n)**

**Fonctionnalités** :
- **Langues supportées** :
  - Français (par défaut)
  - Anglais
- **Sélecteur de langue** : Dans le header
- **Traduction complète** : Interface, contenus

---

### 19. 🎨 **Thèmes**

**Fonctionnalités** :
- **Mode clair** : Interface lumineuse
- **Mode sombre** : Interface sombre
- **Toggle** : Basculement dans le header
- **Persistance** : Préférence sauvegardée

---

## 🔧 Fonctionnalités Techniques

### Base de Données MongoDB

**Collections** :
- `users` : Utilisateurs et authentification
- `labs` : Laboratoires virtuels
- `simulations` : Simulations 3D
- `resources` : Ressources pédagogiques
- `evaluations` : Quiz et évaluations
- `certifications` : Certifications et badges
- `collaborations` : Salles de collaboration
- `analytics` : Données analytiques

### APIs REST

**Routes disponibles** :
- `/api/simulations` : Liste des simulations
- `/api/labs` : Liste des laboratoires
- `/api/resources` : Ressources pédagogiques
- `/api/evaluations` : Évaluations
- `/api/certifications` : Certifications
- `/api/collaborations` : Salles de collaboration
- `/api/ai/recommendations` : Recommandations IA
- `/api/analytics` : Données analytiques
- `/api/auth/*` : Authentification

### Scripts Utilitaires

- `npm run create:user` : Créer un utilisateur admin
- `npm run seed:defaults` : Seed des utilisateurs par défaut
- `npm run clean:labs` : Nettoyer et réinitialiser les laboratoires

---

## 🎮 Utilisation des Laboratoires Virtuels

### Navigation 3D

1. **Souris** :
   - Clic gauche + glisser : Rotation de la caméra
   - Molette : Zoom avant/arrière
   - Clic droit + glisser : Translation

2. **Clavier** :
   - `W/A/S/D` : Déplacement
   - `Espace` : Saut
   - `Shift` : Course

### Interaction avec les Instruments

1. **Sélection** : Cliquer sur un instrument
2. **Paramètres** : Utiliser les sliders dans le panneau
3. **Données** : Observer l'affichage temps réel
4. **Description** : Lire les informations dans le panneau

### Exemple : Microscope

1. Sélectionner le microscope
2. Ajuster la **magnification** (100x à 1000x)
3. Ajuster le **focus** (0 à 100)
4. Ajuster la **lumière** (0 à 100)
5. Observer les **données** affichées (cellules visibles, résolution)

---

## 📈 Statistiques et Métriques

### Pour les Enseignants

- Nombre d'étudiants actifs
- Taux de complétion des simulations
- Performance moyenne par classe
- Temps moyen par session
- Ressources les plus utilisées

### Pour les Étudiants

- Simulations complétées
- Certifications obtenues
- Score moyen aux quiz
- Temps d'engagement
- Progression par discipline

---

## 🔐 Sécurité et Confidentialité

- **Authentification sécurisée** : NextAuth.js avec hash bcrypt
- **Protection des routes** : Middleware Next.js
- **Validation des données** : Zod schemas
- **Logs d'audit** : Traçabilité des actions
- **Sauvegardes** : Planification automatique
- **RGPD** : Conformité données personnelles

---

## 🚀 Déploiement

### Prérequis

- Node.js 18+
- MongoDB (locale ou Atlas)
- Variables d'environnement configurées

### Installation

```bash
npm install
cp .env.example .env.local
# Configurer MONGODB_URI et NEXTAUTH_SECRET
npm run dev
```

### Production

```bash
npm run build
npm start
```

---

## 📞 Support et Documentation

- **Documentation technique** : Code commenté
- **Scripts de maintenance** : Nettoyage, seed
- **Comptes de démonstration** : Tests rapides
- **Logs** : Debugging facilité

---

## 🎯 Prochaines Évolutions

- Mode VR (Réalité Virtuelle)
- Intégration LMS (Moodle, Google Classroom)
- Génération automatique de certificats PDF
- WebRTC pour collaboration temps réel
- Mobile app (React Native)
- Plus de laboratoires (géologie, astronomie, etc.)

---

**Made with ❤️ pour l'enseignement scientifique immersif.**




