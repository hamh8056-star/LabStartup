"use client"

import { Suspense } from "react"
import { Canvas } from "@react-three/fiber"
import { Float, OrbitControls, Sphere, TorusKnot } from "@react-three/drei"

function SceneContent() {
  return (
    <>
      <Float speed={2} rotationIntensity={0.4} floatIntensity={0.6}>
        <TorusKnot args={[1, 0.3, 256, 32]}>
          <meshPhysicalMaterial
            color="#6366f1"
            roughness={0.1}
            metalness={0.3}
            transmission={0.6}
            thickness={0.3}
          />
        </TorusKnot>
      </Float>
      <Float speed={1.5} position={[2.5, 1.2, -1]}>
        <Sphere args={[0.6, 64, 64]}>
          <meshStandardMaterial color="#22c55e" wireframe />
        </Sphere>
      </Float>
      <Float speed={1.2} position={[-2.2, -0.6, 0.5]}>
        <Sphere args={[0.4, 32, 32]}>
          <meshStandardMaterial color="#f97316" emissive="#fb923c" />
        </Sphere>
      </Float>
      <directionalLight position={[5, 5, 5]} intensity={1.2} />
      <ambientLight intensity={0.4} />
    </>
  )
}

export function VirtualLabScene() {
  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-zinc-900 via-slate-900 to-violet-900 shadow-2xl">
      <Canvas camera={{ position: [3, 2, 6], fov: 60 }}>
        <color attach="background" args={["#09090b"]} />
        <Suspense fallback={null}>
          <SceneContent />
        </Suspense>
        <OrbitControls enablePan={false} enableZoom autoRotate />
      </Canvas>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
      <div className="absolute bottom-6 left-6 flex flex-col gap-2 text-sm text-white/90">
        <span className="text-xs uppercase tracking-[0.4rem] text-white/60">
          3D Immersion
        </span>
        <h3 className="text-2xl font-semibold">Laboratoire virtuel</h3>
        <p className="max-w-xs text-sm text-white/70">
          Manipulez instruments, configurez vos expériences et suivez les
          résultats en temps réel avec une précision scientifique.
        </p>
      </div>
    </div>
  )
}

