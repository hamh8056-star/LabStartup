export type CollaborationMember = {
  id: string
  name: string
  role: "student" | "teacher"
  status: "online" | "offline" | "in-sim"
  approved?: boolean
}

export type CollaborationJoinRequest = {
  id: string
  userId: string
  userName: string
  userRole: "student" | "teacher"
  requestedAt: string
}

export type CollaborationChatMessage = {
  id: string
  authorId: string
  authorName: string
  role: "teacher" | "student" | "assistant"
  message: string
  timestamp: string
}

export type CollaborationScreenShare = {
  id: string
  ownerId: string
  ownerName: string
  type: "simulation" | "tableau" | "resultats"
  title: string
  url: string
  active: boolean
}

export type CollaborationBreakoutGroup = {
  id: string
  name: string
  participants: CollaborationMember["id"][]
  active: boolean
  voiceChannel: boolean
}

export type CollaborationRoom = {
  id: string
  title: string
  simulationId: string
  active: boolean
  startedAt: string
  ownerId?: string
  members: CollaborationMember[]
  pendingRequests?: CollaborationJoinRequest[]
  notes: string[]
  chatLog: CollaborationChatMessage[]
  screenShares: CollaborationScreenShare[]
  breakoutGroups: CollaborationBreakoutGroup[]
}

export function getSampleRooms(): CollaborationRoom[] {
  return [
    {
      id: "room-quantum-01",
      title: "Physique quantique — Groupe A",
      simulationId: "sim-quantum-diffraction",
      active: true,
      startedAt: new Date(Date.now() - 25 * 60_000).toISOString(),
      members: [
        { id: "u1", name: "Nora", role: "teacher", status: "in-sim" },
        { id: "u2", name: "Adam", role: "student", status: "online" },
        { id: "u3", name: "Mei", role: "student", status: "in-sim" },
        { id: "u7", name: "Lina", role: "student", status: "online" },
      ],
      notes: [
        "Configurer le laser à 532 nm",
        "Comparer le motif selon le nombre de fentes",
      ],
      chatLog: [
        {
          id: "msg-1",
          authorId: "u1",
          authorName: "Nora",
          role: "teacher",
          message: "N'oubliez pas d'activer le capteur photonique avant la mesure.",
          timestamp: new Date(Date.now() - 12 * 60_000).toISOString(),
        },
        {
          id: "msg-2",
          authorId: "u3",
          authorName: "Mei",
          role: "student",
          message: "J'obtiens une intensité maximale à x = 2,4 cm, est-ce correct ?",
          timestamp: new Date(Date.now() - 8 * 60_000).toISOString(),
        },
        {
          id: "msg-3",
          authorId: "assistant",
          authorName: "Assistant IA",
          role: "assistant",
          message: "Suggestion : réduire la distance écran à 1,2 m pour visualiser plus de franges.",
          timestamp: new Date(Date.now() - 6 * 60_000).toISOString(),
        },
      ],
      screenShares: [
        {
          id: "share-1",
          ownerId: "u2",
          ownerName: "Adam",
          type: "resultats",
          title: "Graphique intensité vs position",
          url: "/screenshots/diffraction-graph.png",
          active: true,
        },
        {
          id: "share-2",
          ownerId: "u1",
          ownerName: "Nora",
          type: "simulation",
          title: "Configuration des fentes",
          url: "/screenshots/setup-laser.png",
          active: false,
        },
      ],
      breakoutGroups: [
        {
          id: "group-1",
          name: "Binôme A",
          participants: ["u2", "u3"],
          active: true,
          voiceChannel: true,
        },
        {
          id: "group-2",
          name: "Observateurs",
          participants: ["u7"],
          active: false,
          voiceChannel: false,
        },
      ],
    },
    {
      id: "room-bio-02",
      title: "Cellules animales — Promotion 2026",
      simulationId: "sim-bio-cell",
      active: false,
      startedAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
      members: [
        { id: "u4", name: "Léa", role: "teacher", status: "offline" },
        { id: "u5", name: "Yanis", role: "student", status: "offline" },
        { id: "u6", name: "Sara", role: "student", status: "offline" },
      ],
      notes: ["Analyser la mitochondrie avec le tuteur IA"],
      chatLog: [
        {
          id: "msg-4",
          authorId: "u4",
          authorName: "Léa",
          role: "teacher",
          message: "Pensez à annoter vos observations dans le carnet partagé.",
          timestamp: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
        },
      ],
      screenShares: [],
      breakoutGroups: [],
    },
  ]
}


