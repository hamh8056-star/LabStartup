"use client"

import { Suspense, useState } from "react"
import { useRouter } from "next/navigation"
import { Canvas } from "@react-three/fiber"
import { OrbitControls, PerspectiveCamera, ContactShadows } from "@react-three/drei"
import { ArrowLeft, Maximize2, Minimize2, RotateCcw, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { VirtualLab } from "@/lib/data/seed"
import { PhysicsLab } from "@/components/three/labs/physics-lab"
import { ChemistryLab } from "@/components/three/labs/chemistry-lab"
import { ProfessionalBiologyLab } from "@/components/three/labs/professional-biology-lab"

type VirtualLabVRViewProps = {
  lab: VirtualLab
}

export function VirtualLabVRView({ lab }: VirtualLabVRViewProps) {
  const router = useRouter()
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showControls, setShowControls] = useState(true)

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  const renderLabContent = () => {
    const commonProps = {
      discipline: lab.discipline,
    }

    switch (lab.discipline) {
      case "physique":
        return <PhysicsLab {...commonProps} />
      case "chimie":
        return <ChemistryLab {...commonProps} />
      case "biologie":
        return <ProfessionalBiologyLab {...commonProps} />
      default:
        return <PhysicsLab {...commonProps} />
    }
  }

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black">
      <Canvas shadows>
        <PerspectiveCamera makeDefault position={[0, 1.6, 5]} fov={75} />
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 10, 5]} intensity={1.2} castShadow />
        <directionalLight position={[-10, 5, -5]} intensity={0.4} />
        <pointLight position={[0, 8, 0]} intensity={0.8} />
        <ContactShadows opacity={0.4} scale={10} blur={2} far={4.5} />
        <Suspense fallback={null}>{renderLabContent()}</Suspense>
        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={2}
          maxDistance={20}
          minPolarAngle={0}
          maxPolarAngle={Math.PI / 2}
        />
      </Canvas>

      {/* UI Overlay */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Top Bar */}
        <div className="absolute top-0 left-0 right-0 bg-black/60 backdrop-blur-sm border-b border-white/10 p-4 pointer-events-auto">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.back()}
                className="text-white hover:bg-white/20"
              >
                <ArrowLeft className="size-5" />
              </Button>
              <div>
                <h1 className="text-xl font-semibold text-white">{lab.name}</h1>
                <p className="text-sm text-white/70">{lab.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowControls(!showControls)}
                className="text-white hover:bg-white/20"
              >
                <Settings className="size-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleFullscreen}
                className="text-white hover:bg-white/20"
              >
                {isFullscreen ? <Minimize2 className="size-5" /> : <Maximize2 className="size-5" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Controls Panel */}
        {showControls && (
          <div className="absolute bottom-4 left-4 right-4 max-w-md bg-black/60 backdrop-blur-sm border border-white/10 rounded-xl p-4 pointer-events-auto">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Contrôles</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.location.reload()}
                className="text-white/70 hover:text-white hover:bg-white/20 h-8"
              >
                <RotateCcw className="size-4 mr-2" />
                Réinitialiser
              </Button>
            </div>
            <div className="space-y-2 text-xs text-white/80">
              <p>• <kbd className="px-1.5 py-0.5 bg-white/20 rounded">Souris</kbd> : Rotation de la vue</p>
              <p>• <kbd className="px-1.5 py-0.5 bg-white/20 rounded">Molette</kbd> : Zoom</p>
              <p>• <kbd className="px-1.5 py-0.5 bg-white/20 rounded">Clic</kbd> : Sélectionner un instrument</p>
              <p>• <kbd className="px-1.5 py-0.5 bg-white/20 rounded">Glisser</kbd> : Manipuler un instrument</p>
            </div>
          </div>
        )}

        {/* Instrument Info Panel */}
        <div className="absolute top-20 right-4 max-w-xs bg-black/60 backdrop-blur-sm border border-white/10 rounded-xl p-4 pointer-events-auto">
          <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-2">Instruments disponibles</h3>
          <div className="space-y-2 text-xs text-white/70">
            {lab.features.map((feature, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}

