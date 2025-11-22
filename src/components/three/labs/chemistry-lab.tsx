"use client"

import { useRef, useState, useMemo } from "react"
import { useFrame } from "@react-three/fiber"
import { Box, Cylinder, Text, Html, Sphere } from "@react-three/drei"
import * as THREE from "three"
import { InteractiveInstrument } from "./interactive-instrument"

type ChemistryLabProps = {
  discipline?: string
}

export function ChemistryLab({ discipline = "chimie" }: ChemistryLabProps = {}) {
  const [burnerParams, setBurnerParams] = useState({ temperature: 300, gasFow: 50 })
  const [titratorParams, setTitratorParams] = useState({ volume: 0, concentration: 0.1, pH: 7 })
  const [stirrerParams, setStirrerParams] = useState({ speed: 300, temperature: 25 })
  const [hoodParams, setHoodParams] = useState({ airflow: 100, temperature: 20 })
  const [thermoParams, setThermoParams] = useState({ temperature: 25, pressure: 1 })
  
  const [burnerData, setBurnerData] = useState(0)
  const [titratorData, setTitratorData] = useState(0)
  const [stirrerData, setStirrerData] = useState(0)
  const [hoodData, setHoodData] = useState(0)
  const [thermoData, setThermoData] = useState(0)

  // Texture sol - Époxy chimique résistant
  const floorTexture = useMemo(() => {
    const canvas = document.createElement("canvas")
    canvas.width = 2048
    canvas.height = 2048
    const ctx = canvas.getContext("2d")!
    
    const baseGradient = ctx.createLinearGradient(0, 0, 2048, 2048)
    baseGradient.addColorStop(0, "#d4d4d8")
    baseGradient.addColorStop(0.5, "#c4c4cc")
    baseGradient.addColorStop(1, "#b4b4bc")
    ctx.fillStyle = baseGradient
    ctx.fillRect(0, 0, 2048, 2048)
    
    const tileSize = 136.5
    for (let i = 0; i < 15; i++) {
      for (let j = 0; j < 15; j++) {
        const x = i * tileSize
        const y = j * tileSize
        ctx.fillStyle = `hsl(${0}, ${0}%, ${78 + Math.random() * 4}%)`
        ctx.fillRect(x + 2, y + 2, tileSize - 4, tileSize - 4)
        ctx.fillStyle = "#9ca3af"
        ctx.fillRect(x, y, tileSize, 2)
        ctx.fillRect(x, y, 2, tileSize)
      }
    }
    
    const texture = new THREE.CanvasTexture(canvas)
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.RepeatWrapping
    texture.repeat.set(3, 3)
    return texture
  }, [])

  // Texture murs - Jaune/beige chimie
  const wallTexture = useMemo(() => {
    const canvas = document.createElement("canvas")
    canvas.width = 1024
    canvas.height = 1024
    const ctx = canvas.getContext("2d")!
    
    const baseGradient = ctx.createLinearGradient(0, 0, 1024, 1024)
    baseGradient.addColorStop(0, "#fef3c7")
    baseGradient.addColorStop(0.5, "#fde68a")
    baseGradient.addColorStop(1, "#fcd34d")
    ctx.fillStyle = baseGradient
    ctx.fillRect(0, 0, 1024, 1024)
    
    for (let i = 0; i < 600; i++) {
      ctx.fillStyle = `rgba(${250 + Math.random() * 5}, ${220 + Math.random() * 30}, ${120 + Math.random() * 40}, ${0.1 + Math.random() * 0.2})`
      ctx.fillRect(Math.random() * 1024, Math.random() * 1024, 3 + Math.random() * 5, 2 + Math.random() * 4)
    }
    
    const texture = new THREE.CanvasTexture(canvas)
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.RepeatWrapping
    texture.repeat.set(2, 2)
    return texture
  }, [])

  // Skybox
  const environmentMap = useMemo(() => {
    const canvas = document.createElement("canvas")
    canvas.width = 1024
    canvas.height = 512
    const ctx = canvas.getContext("2d")!
    
    const skyGradient = ctx.createLinearGradient(0, 0, 0, 512)
    skyGradient.addColorStop(0, "#93c5fd")
    skyGradient.addColorStop(0.5, "#bfdbfe")
    skyGradient.addColorStop(1, "#dbeafe")
    ctx.fillStyle = skyGradient
    ctx.fillRect(0, 0, 1024, 512)
    
    for (let i = 0; i < 45; i++) {
      const x = Math.random() * 1024
      const y = Math.random() * 250
      const radius = 20 + Math.random() * 50
      const cloudGradient = ctx.createRadialGradient(x, y, 0, x, y, radius)
      cloudGradient.addColorStop(0, "rgba(255, 255, 255, 0.8)")
      cloudGradient.addColorStop(1, "rgba(255, 255, 255, 0)")
      ctx.fillStyle = cloudGradient
      ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2)
    }
    
    const texture = new THREE.CanvasTexture(canvas)
    texture.mapping = THREE.EquirectangularReflectionMapping
    return texture
  }, [])

  useFrame((state) => {
    setBurnerData(burnerParams.temperature + Math.sin(state.clock.elapsedTime * 3) * 10)
    setTitratorData(titratorParams.pH + Math.sin(state.clock.elapsedTime) * 0.2)
    setStirrerData(stirrerParams.speed * (0.98 + Math.sin(state.clock.elapsedTime * 5) * 0.02))
    setHoodData(hoodParams.airflow + Math.sin(state.clock.elapsedTime * 0.5) * 2)
    setThermoData(thermoParams.temperature + Math.sin(state.clock.elapsedTime * 2) * 0.5)
  })

  return (
    <group>
      {/* Skybox */}
      <mesh>
        <sphereGeometry args={[100, 32, 32]} />
        <meshBasicMaterial map={environmentMap} side={THREE.BackSide} />
      </mesh>

      {/* Sol */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[25, 25]} />
        <meshStandardMaterial
          color="#c4c4cc"
          roughness={0.2}
          metalness={0.1}
          map={floorTexture}
          envMap={environmentMap}
          envMapIntensity={0.3}
        />
      </mesh>

      {/* Murs */}
      <mesh position={[0, 3, -12.5]} receiveShadow>
        <boxGeometry args={[25, 6, 0.3]} />
        <meshStandardMaterial color="#fde68a" roughness={0.5} map={wallTexture} envMap={environmentMap} envMapIntensity={0.2} />
      </mesh>
      <mesh position={[-12.5, 3, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <boxGeometry args={[25, 6, 0.3]} />
        <meshStandardMaterial color="#fde68a" roughness={0.5} map={wallTexture} envMap={environmentMap} envMapIntensity={0.2} />
      </mesh>
      <mesh position={[12.5, 3, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <boxGeometry args={[25, 6, 0.3]} />
        <meshStandardMaterial color="#fde68a" roughness={0.5} map={wallTexture} envMap={environmentMap} envMapIntensity={0.2} />
      </mesh>

      {/* Fenêtres */}
      {[[-12.4, 3, -6], [-12.4, 3, 2], [12.4, 3, -6], [12.4, 3, 2]].map((pos, i) => (
        <group key={i} position={pos as [number, number, number]}>
          <mesh>
            <boxGeometry args={[0.15, 2.5, 3.5]} />
            <meshStandardMaterial color="#f0f0f0" roughness={0.3} metalness={0.6} />
          </mesh>
          <mesh position={[i < 2 ? 0.08 : -0.08, 0, 0]}>
            <boxGeometry args={[0.02, 2.3, 3.3]} />
            <meshPhysicalMaterial
              color="#e0f8ff"
              transparent
              opacity={0.4}
              transmission={0.9}
              envMap={environmentMap}
              envMapIntensity={1.2}
            />
          </mesh>
        </group>
      ))}

      {/* Plafond */}
      <mesh position={[0, 6, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[25, 25]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.6} />
      </mesh>

      {/* Table principale */}
      <group position={[0, 0.6, -4]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[8, 0.2, 4]} />
          <meshStandardMaterial color="#1e293b" roughness={0.3} metalness={0.3} />
        </mesh>
        {[[-3.9, -0.4, -1.9], [3.9, -0.4, -1.9], [-3.9, -0.4, 1.9], [3.9, -0.4, 1.9]].map((pos, i) => (
          <mesh key={i} position={pos as [number, number, number]} castShadow>
            <cylinderGeometry args={[0.1, 0.1, 0.8]} />
            <meshStandardMaterial color="#475569" roughness={0.3} metalness={0.9} />
          </mesh>
        ))}
      </group>

      {/* Bec Bunsen */}
      <InteractiveInstrument
        position={[-3, 1.5, -4]}
        name="Bec Bunsen"
        description="Bec Bunsen pour chauffage chimique"
        onParameterChange={(params) => setBurnerParams({ ...burnerParams, ...params })}
        parameters={{
          temperature: { min: 100, max: 800, value: burnerParams.temperature, label: "Température", unit: "°C" },
          gasFow: { min: 0, max: 100, value: burnerParams.gasFow, label: "Débit gaz", unit: "%" },
        }}
        showData={true}
        dataValue={burnerData}
        dataUnit="°C"
        discipline={discipline}
      >
        <mesh castShadow>
          <cylinderGeometry args={[0.08, 0.08, 0.02]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.3} metalness={0.7} />
        </mesh>
        <mesh position={[0, 0.08, 0]} castShadow>
          <cylinderGeometry args={[0.025, 0.025, 0.15]} />
          <meshStandardMaterial color="#94a3b8" roughness={0.2} metalness={0.9} />
        </mesh>
        {burnerParams.temperature > 200 && (
          <mesh position={[0, 0.2, 0]} castShadow>
            <coneGeometry args={[0.04, 0.15, 8]} />
            <meshStandardMaterial
              color="#f59e0b"
              emissive="#f59e0b"
              emissiveIntensity={burnerParams.temperature / 800}
              transparent
              opacity={0.8}
            />
          </mesh>
        )}
      </InteractiveInstrument>

      {/* Système de titrage */}
      <InteractiveInstrument
        position={[0, 1.5, -4]}
        name="Burette de titrage"
        description="Système automatique de titrage acide-base"
        onParameterChange={(params) => setTitratorParams({ ...titratorParams, ...params })}
        parameters={{
          volume: { min: 0, max: 50, value: titratorParams.volume, label: "Volume", unit: "mL" },
          pH: { min: 0, max: 14, value: titratorParams.pH, label: "pH", unit: "" },
        }}
        showData={true}
        dataValue={titratorData}
        discipline={discipline}
        dataUnit="pH"
      >
        <mesh castShadow>
          <cylinderGeometry args={[0.03, 0.03, 0.5]} />
          <meshStandardMaterial color="#ffffff" transparent opacity={0.5} roughness={0.05} />
        </mesh>
        <mesh position={[0, -0.3, 0]} castShadow>
          <cylinderGeometry args={[0.1, 0.1, 0.15]} />
          <meshStandardMaterial
            color={titratorParams.pH < 7 ? "#ef4444" : titratorParams.pH > 7 ? "#3b82f6" : "#10b981"}
            transparent
            opacity={0.7}
          />
        </mesh>
      </InteractiveInstrument>

      {/* Agitateur magnétique */}
      <InteractiveInstrument
        position={[3, 1.4, -4]}
        name="Agitateur magnétique chauffant"
        description="Agitation et chauffage simultanés"
        onParameterChange={(params) => setStirrerParams({ ...stirrerParams, ...params })}
        parameters={{
          speed: { min: 0, max: 1500, value: stirrerParams.speed, label: "Vitesse", unit: "rpm" },
          temperature: { min: 20, max: 150, value: stirrerParams.temperature, label: "Température", unit: "°C" },
        }}
        showData={true}
        dataValue={stirrerData}
        discipline={discipline}
        dataUnit="rpm"
      >
        <mesh castShadow>
          <cylinderGeometry args={[0.15, 0.15, 0.1]} />
          <meshStandardMaterial color="#ffffff" roughness={0.2} />
        </mesh>
        <mesh position={[0, 0.06, 0]} castShadow>
          <cylinderGeometry args={[0.12, 0.12, 0.02]} />
          <meshStandardMaterial color="#94a3b8" roughness={0.1} metalness={0.9} />
        </mesh>
        {stirrerParams.speed > 0 && (
          <mesh position={[0, 0.15, 0]} rotation={[0, Date.now() * stirrerParams.speed * 0.0001, 0]} castShadow>
            <cylinderGeometry args={[0.08, 0.08, 0.15]} />
            <meshStandardMaterial
              color="#3b82f6"
              transparent
              opacity={0.5}
            />
          </mesh>
        )}
      </InteractiveInstrument>

      {/* Hotte aspirante */}
      <InteractiveInstrument
        position={[0, 2, 10]}
        name="Hotte aspirante"
        description="Hotte de sécurité avec extraction"
        onParameterChange={(params) => setHoodParams({ ...hoodParams, ...params })}
        parameters={{
          airflow: { min: 0, max: 200, value: hoodParams.airflow, label: "Débit air", unit: "m³/h" },
          temperature: { min: 15, max: 30, value: hoodParams.temperature, label: "Température", unit: "°C" },
        }}
        showData={true}
        dataValue={hoodData}
        discipline={discipline}
        dataUnit="m³/h"
      >
        <mesh castShadow>
          <boxGeometry args={[3, 3, 1]} />
          <meshStandardMaterial color="#f0f0f0" roughness={0.3} />
        </mesh>
        <mesh position={[0, 0, 0.5]} castShadow>
          <boxGeometry args={[2.8, 2.5, 0.05]} />
          <meshPhysicalMaterial color="#e0f0ff" transparent opacity={0.6} transmission={0.8} />
        </mesh>
        {hoodParams.airflow > 0 && (
          <mesh position={[0, 1.6, 0]} castShadow>
            <cylinderGeometry args={[0.02, 0.02, 0.1]} />
            <meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={0.8} />
          </mesh>
        )}
      </InteractiveInstrument>

      {/* Thermomètre numérique */}
      <InteractiveInstrument
        position={[-3, 1.4, 0]}
        name="Thermomètre numérique"
        description="Mesure de température avec sonde"
        onParameterChange={(params) => setThermoParams({ ...thermoParams, ...params })}
        parameters={{
          temperature: { min: -50, max: 300, value: thermoParams.temperature, label: "Température", unit: "°C" },
          pressure: { min: 0.5, max: 2, value: thermoParams.pressure, label: "Pression", unit: "bar" },
        }}
        showData={true}
        dataValue={thermoData}
        discipline={discipline}
        dataUnit="°C"
      >
        <mesh castShadow>
          <boxGeometry args={[0.15, 0.2, 0.1]} />
          <meshStandardMaterial color="#1e293b" roughness={0.2} />
        </mesh>
        <mesh position={[0, 0, 0.06]} castShadow>
          <boxGeometry args={[0.1, 0.08, 0.01]} />
          <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.7} />
        </mesh>
      </InteractiveInstrument>

      {/* Béchers avec solutions colorées */}
      {[
        [-2.5, 1.25, -3.5, "#ef4444"],
        [-2, 1.25, -3.5, "#3b82f6"],
        [-1.5, 1.25, -3.5, "#10b981"],
        [1.5, 1.25, -3.5, "#f59e0b"],
        [2, 1.25, -3.5, "#8b5cf6"],
        [2.5, 1.25, -3.5, "#ec4899"],
      ].map(([x, y, z, color], i) => (
        <group key={i} position={[x, y, z] as [number, number, number]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.08, 0.08, 0.2]} />
            <meshStandardMaterial color="#ffffff" transparent opacity={0.3} roughness={0.05} />
          </mesh>
          <mesh position={[0, -0.04, 0]} castShadow>
            <cylinderGeometry args={[0.075, 0.075, 0.12]} />
            <meshStandardMaterial color={color as string} transparent opacity={0.7} />
          </mesh>
        </group>
      ))}

      {/* Armoires chimie */}
      {[-8, -4, 4, 8].map((x, i) => (
        <group key={i} position={[x, 1.5, -12]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[1.8, 3, 0.6]} />
            <meshStandardMaterial color="#fbbf24" roughness={0.4} metalness={0.2} />
          </mesh>
        </group>
      ))}

      {/* Chaises */}
      {[[-3, 0.4, 1], [3, 0.4, 1], [0, 0.4, 3]].map((pos, i) => (
        <group key={i} position={pos as [number, number, number]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.25, 0.25, 0.05]} />
            <meshStandardMaterial color="#ef4444" roughness={0.4} />
          </mesh>
          <mesh position={[0, 0.3, 0]} castShadow>
            <cylinderGeometry args={[0.02, 0.02, 0.5]} />
            <meshStandardMaterial color="#1e293b" roughness={0.2} metalness={0.8} />
          </mesh>
          <mesh position={[0, 0.6, 0]} castShadow>
            <cylinderGeometry args={[0.22, 0.2, 0.08]} />
            <meshStandardMaterial color="#ef4444" roughness={0.5} />
          </mesh>
        </group>
      ))}

      {/* Éclairage */}
      {[[-6, 5.8, -4], [0, 5.8, -4], [6, 5.8, -4], [-6, 5.8, 2], [0, 5.8, 2], [6, 5.8, 2]].map((pos, i) => (
        <mesh key={i} position={pos as [number, number, number]}>
          <boxGeometry args={[2, 0.1, 1]} />
          <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.5} />
        </mesh>
      ))}

      {/* Panneau danger chimique */}
      <group position={[0, 3, -11.9]}>
        <mesh castShadow>
          <boxGeometry args={[2, 2, 0.05]} />
          <meshStandardMaterial color="#dc2626" roughness={0.3} />
        </mesh>
        <mesh position={[0, 0, 0.03]} castShadow>
          <cylinderGeometry args={[0.5, 0.5, 0.01]} />
          <meshStandardMaterial color="#fef3c7" />
        </mesh>
      </group>

      {/* Extincteur */}
      <group position={[11, 1, 8]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.12, 0.12, 0.6]} />
          <meshStandardMaterial color="#dc2626" roughness={0.4} />
        </mesh>
      </group>

      {/* Douche de sécurité */}
      <group position={[-11, 3, 8]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.05, 0.05, 0.4]} />
          <meshStandardMaterial color="#94a3b8" roughness={0.2} metalness={0.8} />
        </mesh>
        <mesh position={[0, 0.25, 0]} castShadow>
          <boxGeometry args={[0.25, 0.1, 0.25]} />
          <meshStandardMaterial color="#facc15" roughness={0.3} />
        </mesh>
      </group>
    </group>
  )
}
