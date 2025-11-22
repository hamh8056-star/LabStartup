import { MongoClient, ObjectId } from "mongodb"
import dotenv from "dotenv"

dotenv.config({ path: ".env.local" })

const MONGODB_URI = process.env.MONGODB_URI || process.env.NEXT_PUBLIC_MONGODB_URI

const baseLabs = [
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

async function cleanAndSeedLabs() {
  if (!MONGODB_URI) {
    console.error("❌ MONGODB_URI n'est pas défini dans .env.local")
    process.exit(1)
  }

  console.log("🔌 Connexion à MongoDB...")
  const client = new MongoClient(MONGODB_URI)

  try {
    await client.connect()
    console.log("✅ Connecté à MongoDB")

    const db = client.db("labstartup")
    const labsCollection = db.collection("labs")

    // 1. Supprimer TOUS les laboratoires existants
    console.log("\n🧹 Suppression des laboratoires existants...")
    const deleteResult = await labsCollection.deleteMany({})
    console.log(`✅ ${deleteResult.deletedCount} ancien(s) laboratoire(s) supprimé(s)`)

    // 2. Insérer UNIQUEMENT les 3 laboratoires de base
    console.log("\n📥 Insertion des 3 laboratoires uniques...")
    const labs = baseLabs.map(lab => ({
      ...lab,
      _id: new ObjectId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    }))

    await labsCollection.insertMany(labs)
    console.log(`✅ ${labs.length} laboratoires insérés :`)

    labs.forEach(lab => {
      console.log(`   ✓ ${lab.name} (${lab.discipline})`)
    })

    // 3. Vérification finale
    console.log("\n🔍 Vérification finale...")
    const count = await labsCollection.countDocuments()
    console.log(`📊 Total dans la base : ${count} laboratoire(s)`)

    if (count === 3) {
      console.log("\n✅ ✅ ✅ Base de données nettoyée avec succès !")
      console.log("\n🎉 Vous avez maintenant exactement 3 laboratoires :")
      console.log("   1. Laboratoire de Biologie Professionnel")
      console.log("   2. Laboratoire de Physique")
      console.log("   3. Laboratoire de Chimie")
    } else {
      console.log(`\n⚠️  Attention : ${count} laboratoires trouvés (attendu: 3)`)
    }
  } catch (error) {
    console.error("❌ Erreur:", error)
    process.exit(1)
  } finally {
    await client.close()
    console.log("\n🔌 Déconnecté de MongoDB")
  }
}

cleanAndSeedLabs()

