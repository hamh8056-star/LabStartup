"use client"

import { useRef, useState, useMemo } from "react"
import { useFrame } from "@react-three/fiber"
import { Box, Cylinder, Text, Html, Sphere } from "@react-three/drei"
import * as THREE from "three"
import { InteractiveInstrument } from "./interactive-instrument"

type PhysicsLabProps = {
  discipline?: string
}

export function PhysicsLab({ discipline = "physique" }: PhysicsLabProps = {}) {
  const [laserParams, setLaserParams] = useState({ wavelength: 632.8, power: 5.0, angle: 0 })
  const [oscilloscopeParams, setOscilloscopeParams] = useState({ frequency: 1000, amplitude: 2.0, offset: 0 })
  const [magnetParams, setMagnetParams] = useState({ field: 0.5, current: 2.0 })
  const [pendulumParams, setPendulumParams] = useState({ length: 1.0, mass: 0.5, amplitude: 30 })
  const [voltmeterParams, setVoltmeterParams] = useState({ voltage: 5.0, range: 10 })
  
  const [laserData, setLaserData] = useState(0)
  const [oscilloscopeData, setOscilloscopeData] = useState(0)
  const [magnetData, setMagnetData] = useState(0)
  const [pendulumData, setPendulumData] = useState(0)
  const [voltmeterData, setVoltmeterData] = useState(0)

  // Textures générées par IA - Sol de laboratoire de physique (gris technique)
  const floorTexture = useMemo(() => {
    const canvas = document.createElement("canvas")
    canvas.width = 2048
    canvas.height = 2048
    const ctx = canvas.getContext("2d")!
    
    // Base: Sol industriel gris
    const baseGradient = ctx.createLinearGradient(0, 0, 2048, 2048)
    baseGradient.addColorStop(0, "#4a5568")
    baseGradient.addColorStop(0.5, "#3a4556")
    baseGradient.addColorStop(1, "#2d3748")
    ctx.fillStyle = baseGradient
    ctx.fillRect(0, 0, 2048, 2048)
    
    // Dalles carrées
    const tileSize = 136.5
    for (let i = 0; i < 15; i++) {
      for (let j = 0; j < 15; j++) {
        const x = i * tileSize
        const y = j * tileSize
        
        ctx.fillStyle = `hsl(${210 + Math.random() * 5}, ${10 + Math.random() * 5}%, ${30 + Math.random() * 5}%)`
        ctx.fillRect(x + 2, y + 2, tileSize - 4, tileSize - 4)
        
        // Joints
        ctx.fillStyle = "#1a202c"
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

  // Texture murs - Gris clair technique
  const wallTexture = useMemo(() => {
    const canvas = document.createElement("canvas")
    canvas.width = 1024
    canvas.height = 1024
    const ctx = canvas.getContext("2d")!
    
    const baseGradient = ctx.createLinearGradient(0, 0, 1024, 1024)
    baseGradient.addColorStop(0, "#e2e8f0")
    baseGradient.addColorStop(0.5, "#cbd5e1")
    baseGradient.addColorStop(1, "#b4c4d8")
    ctx.fillStyle = baseGradient
    ctx.fillRect(0, 0, 1024, 1024)
    
    for (let i = 0; i < 500; i++) {
      ctx.fillStyle = `rgba(${180 + Math.random() * 40}, ${190 + Math.random() * 40}, ${210 + Math.random() * 30}, ${0.1 + Math.random() * 0.2})`
      ctx.fillRect(Math.random() * 1024, Math.random() * 1024, 3 + Math.random() * 5, 2 + Math.random() * 4)
    }
    
    const texture = new THREE.CanvasTexture(canvas)
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.RepeatWrapping
    texture.repeat.set(2, 2)
    return texture
  }, [])

  // Skybox HDRI
  const environmentMap = useMemo(() => {
    const canvas = document.createElement("canvas")
    canvas.width = 1024
    canvas.height = 512
    const ctx = canvas.getContext("2d")!
    
    const skyGradient = ctx.createLinearGradient(0, 0, 0, 512)
    skyGradient.addColorStop(0, "#87ceeb")
    skyGradient.addColorStop(0.5, "#b0d4e8")
    skyGradient.addColorStop(1, "#e0f2ff")
    ctx.fillStyle = skyGradient
    ctx.fillRect(0, 0, 1024, 512)
    
    // Nuages
    for (let i = 0; i < 40; i++) {
      const x = Math.random() * 1024
      const y = Math.random() * 250
      const radius = 25 + Math.random() * 50
      const cloudGradient = ctx.createRadialGradient(x, y, 0, x, y, radius)
      cloudGradient.addColorStop(0, "rgba(255, 255, 255, 0.7)")
      cloudGradient.addColorStop(1, "rgba(255, 255, 255, 0)")
      ctx.fillStyle = cloudGradient
      ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2)
    }
    
    const texture = new THREE.CanvasTexture(canvas)
    texture.mapping = THREE.EquirectangularReflectionMapping
    return texture
  }, [])

  useFrame((state) => {
    setLaserData(laserParams.power * (0.95 + Math.sin(state.clock.elapsedTime * 2) * 0.05))
    setOscilloscopeData(oscilloscopeParams.amplitude * Math.sin(state.clock.elapsedTime * oscilloscopeParams.frequency * 0.001))
    setMagnetData(magnetParams.field * magnetParams.current)
    setPendulumData(pendulumParams.amplitude * Math.cos(state.clock.elapsedTime * Math.sqrt(9.81 / pendulumParams.length)))
    setVoltmeterData(voltmeterParams.voltage + Math.sin(state.clock.elapsedTime) * 0.1)
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
          color="#3a4556"
          roughness={0.3}
          metalness={0.2}
          map={floorTexture}
          envMap={environmentMap}
          envMapIntensity={0.4}
        />
      </mesh>

      {/* Murs */}
      <mesh position={[0, 3, -12.5]} receiveShadow>
        <boxGeometry args={[25, 6, 0.3]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.4} map={wallTexture} envMap={environmentMap} envMapIntensity={0.2} />
      </mesh>
      <mesh position={[-12.5, 3, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <boxGeometry args={[25, 6, 0.3]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.4} map={wallTexture} envMap={environmentMap} envMapIntensity={0.2} />
      </mesh>
      <mesh position={[12.5, 3, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <boxGeometry args={[25, 6, 0.3]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.4} map={wallTexture} envMap={environmentMap} envMapIntensity={0.2} />
      </mesh>

      {/* Fenêtres avec vue extérieure */}
      {[
        [-12.4, 3, -6], [-12.4, 3, 2], [12.4, 3, -6], [12.4, 3, 2]
      ].map((pos, i) => (
        <group key={i} position={pos as [number, number, number]}>
          <mesh>
            <boxGeometry args={[0.15, 2.5, 3.5]} />
            <meshStandardMaterial color="#94a3b8" roughness={0.3} metalness={0.7} />
          </mesh>
          <mesh position={[i < 2 ? 0.08 : -0.08, 0, 0]}>
            <boxGeometry args={[0.02, 2.3, 3.3]} />
            <meshPhysicalMaterial
              color="#d0e8ff"
              transparent
              opacity={0.4}
              transmission={0.9}
              thickness={0.5}
              envMap={environmentMap}
              envMapIntensity={1.3}
            />
          </mesh>
        </group>
      ))}

      {/* Plafond */}
      <mesh position={[0, 6, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[25, 25]} />
        <meshStandardMaterial color="#f1f5f9" roughness={0.6} />
      </mesh>

      {/* Table principale */}
      <group position={[0, 0.6, -4]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[8, 0.2, 4]} />
          <meshStandardMaterial color="#1e293b" roughness={0.3} metalness={0.5} />
        </mesh>
        {[[-3.9, -0.4, -1.9], [3.9, -0.4, -1.9], [-3.9, -0.4, 1.9], [3.9, -0.4, 1.9]].map((pos, i) => (
          <mesh key={i} position={pos as [number, number, number]} castShadow>
            <cylinderGeometry args={[0.1, 0.1, 0.8]} />
            <meshStandardMaterial color="#475569" roughness={0.3} metalness={0.9} />
          </mesh>
        ))}
      </group>

      {/* Laser He-Ne */}
      <InteractiveInstrument
        position={[-3, 1.5, -4]}
        name="Laser He-Ne"
        description="Laser hélium-néon pour expériences d'optique et diffraction"
        onParameterChange={(params) => setLaserParams({ ...laserParams, ...params })}
        parameters={{
          wavelength: { min: 400, max: 800, value: laserParams.wavelength, label: "Longueur d'onde", unit: "nm" },
          power: { min: 0, max: 10, value: laserParams.power, label: "Puissance", unit: "mW" },
        }}
        showData={true}
        dataValue={laserData}
        dataUnit="mW"
        discipline={discipline}
      >
        <mesh castShadow>
          <boxGeometry args={[0.4, 0.25, 0.6]} />
          <meshStandardMaterial color="#6366f1" roughness={0.2} metalness={0.6} />
        </mesh>
        <mesh position={[0, 0, 0.35]} castShadow>
          <cylinderGeometry args={[0.04, 0.04, 0.15]} />
          <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={laserParams.power / 10} />
        </mesh>
      </InteractiveInstrument>

      {/* Faisceau laser */}
      {laserParams.power > 0 && (
        <mesh position={[-3, 1.5, -1.5]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.015, 0.015, 5]} />
          <meshBasicMaterial color="#ef4444" transparent opacity={0.6 + (laserParams.power / 10) * 0.4} />
        </mesh>
      )}

      {/* Oscilloscope */}
      <InteractiveInstrument
        position={[0, 1.5, -4]}
        name="Oscilloscope numérique"
        description="Oscilloscope pour visualisation de signaux électriques"
        onParameterChange={(params) => setOscilloscopeParams({ ...oscilloscopeParams, ...params })}
        parameters={{
          frequency: { min: 1, max: 10000, value: oscilloscopeParams.frequency, label: "Fréquence", unit: "Hz" },
          amplitude: { min: 0, max: 5, value: oscilloscopeParams.amplitude, label: "Amplitude", unit: "V" },
        }}
        showData={true}
        dataValue={oscilloscopeData}
        dataUnit="V"
        discipline={discipline}
      >
        <mesh castShadow>
          <boxGeometry args={[0.6, 0.4, 0.3]} />
          <meshStandardMaterial color="#1e293b" roughness={0.2} metalness={0.3} />
        </mesh>
        <mesh position={[0, 0.1, 0.16]} castShadow>
          <boxGeometry args={[0.5, 0.3, 0.02]} />
          <meshStandardMaterial color="#0f172a" emissive="#22c55e" emissiveIntensity={0.5} />
        </mesh>
      </InteractiveInstrument>

      {/* Électroaimant */}
      <InteractiveInstrument
        position={[3, 1.5, -4]}
        name="Électroaimant"
        description="Électroaimant avec champ magnétique réglable"
        onParameterChange={(params) => setMagnetParams({ ...magnetParams, ...params })}
        parameters={{
          field: { min: 0, max: 2, value: magnetParams.field, label: "Champ magnétique", unit: "T" },
          current: { min: 0, max: 10, value: magnetParams.current, label: "Courant", unit: "A" },
        }}
        showData={true}
        dataValue={magnetData}
        dataUnit="T"
        discipline={discipline}
      >
        <mesh castShadow>
          <cylinderGeometry args={[0.15, 0.15, 0.4]} />
          <meshStandardMaterial color="#dc2626" roughness={0.2} metalness={0.8} />
        </mesh>
        <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <torusGeometry args={[0.12, 0.03, 16, 32]} />
          <meshStandardMaterial color="#b91c1c" roughness={0.3} metalness={0.7} />
        </mesh>
      </InteractiveInstrument>

      {/* Pendule simple */}
      <InteractiveInstrument
        position={[-3, 3, 0]}
        name="Pendule simple"
        description="Pendule pour étude des oscillations"
        onParameterChange={(params) => setPendulumParams({ ...pendulumParams, ...params })}
        parameters={{
          length: { min: 0.5, max: 2, value: pendulumParams.length, label: "Longueur", unit: "m" },
          mass: { min: 0.1, max: 2, value: pendulumParams.mass, label: "Masse", unit: "kg" },
        }}
        showData={true}
        dataValue={pendulumData}
        dataUnit="°"
        discipline={discipline}
      >
        <mesh position={[0, 0, 0]} castShadow>
          <cylinderGeometry args={[0.02, 0.02, pendulumParams.length]} />
          <meshStandardMaterial color="#64748b" roughness={0.2} metalness={0.9} />
        </mesh>
        <mesh position={[0, -pendulumParams.length / 2, 0]} castShadow>
          <sphereGeometry args={[0.08 * Math.sqrt(pendulumParams.mass)]} />
          <meshStandardMaterial color="#f59e0b" roughness={0.3} metalness={0.6} />
        </mesh>
      </InteractiveInstrument>

      {/* Voltmètre */}
      <InteractiveInstrument
        position={[3, 1.4, 0]}
        name="Voltmètre numérique"
        description="Mesure de tension électrique"
        onParameterChange={(params) => setVoltmeterParams({ ...voltmeterParams, ...params })}
        parameters={{
          voltage: { min: 0, max: 20, value: voltmeterParams.voltage, label: "Tension", unit: "V" },
          range: { min: 5, max: 50, value: voltmeterParams.range, label: "Plage", unit: "V" },
        }}
        showData={true}
        dataValue={voltmeterData}
        dataUnit="V"
        discipline={discipline}
      >
        <mesh castShadow>
          <boxGeometry args={[0.3, 0.25, 0.2]} />
          <meshStandardMaterial color="#1e293b" roughness={0.3} />
        </mesh>
        <mesh position={[0, 0, 0.11]} castShadow>
          <boxGeometry args={[0.25, 0.15, 0.01]} />
          <meshStandardMaterial color="#000000" emissive="#ff0000" emissiveIntensity={0.6} />
        </mesh>
      </InteractiveInstrument>

      {/* Armoires */}
      {[-8, -4, 4, 8].map((x, i) => (
        <group key={i} position={[x, 1.5, -12]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[1.8, 3, 0.6]} />
            <meshStandardMaterial color="#64748b" roughness={0.3} metalness={0.4} />
          </mesh>
        </group>
      ))}

      {/* Chaises */}
      {[[-3, 0.4, 1], [3, 0.4, 1], [0, 0.4, 3]].map((pos, i) => (
        <group key={i} position={pos as [number, number, number]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.25, 0.25, 0.05]} />
            <meshStandardMaterial color="#334155" roughness={0.4} />
          </mesh>
          <mesh position={[0, 0.3, 0]} castShadow>
            <cylinderGeometry args={[0.02, 0.02, 0.5]} />
            <meshStandardMaterial color="#1e293b" roughness={0.2} metalness={0.8} />
          </mesh>
          <mesh position={[0, 0.6, 0]} castShadow>
            <cylinderGeometry args={[0.22, 0.2, 0.08]} />
            <meshStandardMaterial color="#334155" roughness={0.5} />
          </mesh>
        </group>
      ))}

      {/* Planche optique avec supports */}
      <group position={[0, 1.3, 2]}>
        <mesh castShadow>
          <boxGeometry args={[3, 0.05, 0.8]} />
          <meshStandardMaterial color="#94a3b8" roughness={0.2} metalness={0.8} />
        </mesh>
        {/* Supports optiques */}
        {[-1, 0, 1].map((x, i) => (
          <mesh key={i} position={[x, 0.1, 0]} castShadow>
            <cylinderGeometry args={[0.03, 0.03, 0.15]} />
            <meshStandardMaterial color="#1e293b" roughness={0.2} metalness={0.9} />
          </mesh>
        ))}
      </group>

      {/* Éclairage plafond */}
      {[[-6, 5.8, -4], [0, 5.8, -4], [6, 5.8, -4], [-6, 5.8, 2], [0, 5.8, 2], [6, 5.8, 2]].map((pos, i) => (
        <mesh key={i} position={pos as [number, number, number]} castShadow>
          <boxGeometry args={[2, 0.1, 1]} />
          <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.5} />
        </mesh>
      ))}

      {/* Tableau blanc */}
      <group position={[0, 3, -11.9]}>
        <mesh castShadow>
          <boxGeometry args={[4, 2, 0.05]} />
          <meshStandardMaterial color="#ffffff" roughness={0.05} metalness={0.1} />
        </mesh>
      </group>

      {/* Extincteur */}
      <group position={[11, 1, 8]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.12, 0.12, 0.6]} />
          <meshStandardMaterial color="#dc2626" roughness={0.4} />
        </mesh>
      </group>
    </group>
  )
}
