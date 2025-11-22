<p align="center">
  <img src="./public/globe.svg" alt="Taalimia" width="120" />
</p>

# Taalimia — Plateforme de laboratoires virtuels

Taalimia est une application Next.js moderne qui combine simulations 3D immersives, collaboration temps réel, analytics pédagogiques et intelligence artificielle pour révolutionner l'enseignement scientifique.

## 🧩 Stack technique

- **Framework** : Next.js 16 (App Router, Server Components)
- **UI** : Tailwind CSS 4, Shadcn UI, thèmes clair/sombre
- **3D** : React Three Fiber + Drei
- **Auth** : NextAuth.js (Credentials + MongoDB Adapter)
- **Base de données** : MongoDB (driver officiel, sans Mongoose)
- **Formulaires** : React Hook Form + Zod
- **Feedback UX** : Sonner, animations Tailwind

## 🚀 Fonctionnalités clés

- Landing page premium présentant les 12 piliers pédagogiques (simulations, IA, collaboration…)
- Espace d’authentification personnalisé (inscription/connexion) avec rôles `student`, `teacher`, `admin`
- Tableau de bord enseignant : statistiques, recommandations IA, certifications, collaborations, ressources
- Modules dédiés aux simulations 3D, laboratoires virtuels, ressources pédagogiques et collaborations
- APIs REST (`/api/*`) fournissant données d’exemple pour simulations, analytics, évaluations, communauté…
- Intégration MongoDB avec seed automatique des contenus de base
- Middleware de protection des routes (`/dashboard`, `/teacher`, `/student`, `/admin`)
- Pages publiques sur les ressources et la communauté scientifique

## 📂 Structure principale

```
src/
  app/
    auth/            # Pages d'authentification (login/register)
    dashboard/       # Expérience enseignant avec sous-sections
    api/             # Routes API (simulations, collaborations, IA, etc.)
    community/       # Présentation de la communauté Taalimia
    resources/       # Bibliothèque pédagogique publique
  components/
    auth/            # Formulaires et carte d'auth
    dashboard/       # Widgets de tableau de bord
    landing/         # Sections marketing
    three/           # Scène 3D immersive
    ui/              # Composants Shadcn UI
  lib/
    data/            # Seeds et helpers simulant le back-office
    env.ts           # Validation Zod des variables d'env
    mongodb.ts       # Connexion MongoDB (sans Mongoose)
    auth.ts          # Configuration NextAuth
```

## ⚙️ Pré-requis

- Node.js 18+
- Base MongoDB accessible (locale ou Atlas)
- Variables d’environnement configurées (voir `.env.example`)

## ▶️ Démarrage rapide

```bash
cp env.example .env.local   # Renseignez votre URI MongoDB + NEXTAUTH_SECRET
npm install
npm run dev
```

Rendez-vous sur `http://localhost:3000` pour découvrir l’expérience complète.

### Script de création d'admin

```bash
# crée ou met à jour un compte administrateur (valeurs par défaut univ-setif.dz)
npm run create:admin

# personnaliser email/mot de passe
npm run create:admin -- --email direction@univ-setif.dz --password "MonPass#2025"
```

## ✅ Tests à réaliser

- Inscription via `/auth/register` puis connexion `/auth/login`
- Accès au tableau de bord `/dashboard` (protégé par middleware NextAuth)
- Consultation des pages publiques `/resources` et `/community`
- Vérification des APIs (ex. `GET /api/simulations`)

### Comptes de démonstration

| Rôle      | Email                      | Mot de passe        |
|-----------|---------------------------|---------------------|
| Admin     | `admin@univ-setif.dz`     | `Taalimia#2025`   |
| Enseignant| `enseignant@univ-setif.dz`| `Taalimia#2025`   |
| Étudiant  | `etudiant@univ-setif.dz`  | `Taalimia#2025`   |

## 📌 Prochaines pistes d’évolution

- Ajout d’une véritable persistance en temps réel (Pusher, WebRTC…)
- Implémentation du mode VR et des simulations 3D avancées
- Génération automatique de certificats PDF/Badge
- Intégration LMS (Moodle, Classroom) via LTI

---

Made with ❤️ pour l’enseignement scientifique immersif.
