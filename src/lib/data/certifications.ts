import { nanoid } from "nanoid"

export type Certification = {
  id: string
  owner: string
  simulationId: string
  score: number
  issuedAt: string
  badge: "explorateur" | "innovateur" | "mentor"
  email?: string
}

export function getSampleCertifications(): Certification[] {
  return [
    {
      id: `CERT-${nanoid(6).toUpperCase()}`,
      owner: "Nora L.",
      simulationId: "sim-quantum-diffraction",
      score: 92,
      issuedAt: new Date().toISOString(),
      badge: "innovateur",
      email: "nora.lefebvre@univ-setif.dz",
    },
    {
      id: `CERT-${nanoid(6).toUpperCase()}`,
      owner: "Amine D.",
      simulationId: "sim-bio-cell",
      score: 87,
      issuedAt: new Date(Date.now() - 86400000).toISOString(),
      badge: "explorateur",
      email: "amine.dahmane@univ-setif.dz",
    },
    {
      id: `CERT-${nanoid(6).toUpperCase()}`,
      owner: "Sofia M.",
      simulationId: "sim-electro-circuit",
      score: 78,
      issuedAt: new Date(Date.now() - 72 * 3600000).toISOString(),
      badge: "mentor",
      email: "sofia.meziani@univ-setif.dz",
    },
    {
      id: `CERT-${nanoid(6).toUpperCase()}`,
      owner: "Hugo P.",
      simulationId: "sim-quantum-diffraction",
      score: 95,
      issuedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
      badge: "innovateur",
      email: "hugo.picard@univ-setif.dz",
    },
  ]
}

