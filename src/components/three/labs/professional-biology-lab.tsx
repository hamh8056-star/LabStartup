"use client"

import { useRef, useState, useMemo } from "react"
import { useFrame } from "@react-three/fiber"
import { Box, Cylinder, Text, Html, Sphere } from "@react-three/drei"
import * as THREE from "three"
import { InteractiveInstrument } from "./interactive-instrument"

type ProfessionalBiologyLabProps = {
  discipline?: string
}

export function ProfessionalBiologyLab({ discipline = "biologie" }: ProfessionalBiologyLabProps = {}) {
  const [microscopeParams, setMicroscopeParams] = useState({ magnification: 400, focus: 50, light: 75 })
  const [incubatorParams, setIncubatorParams] = useState({ temperature: 37, humidity: 60, co2: 5 })
  const [centrifugeParams, setCentrifugeParams] = useState({ speed: 0, time: 0, temperature: 4 })
  const [autoclaveParams, setAutoclaveParams] = useState({ temperature: 121, pressure: 1, time: 0 })
  const [balanceParams, setBalanceParams] = useState({ weight: 0, tare: 0, unit: "g" })
  const [phMeterParams, setPhMeterParams] = useState({ ph: 7.0, temperature: 25 })
  const [spectroParams, setSpectroParams] = useState({ wavelength: 550, absorbance: 0.5 })
  const [microscopeData, setMicroscopeData] = useState(0)
  const [incubatorData, setIncubatorData] = useState(37)
  const [centrifugeData, setCentrifugeData] = useState(0)
  const [autoclaveData, setAutoclaveData] = useState(0)
  const [balanceData, setBalanceData] = useState(0)
  const [phMeterData, setPhMeterData] = useState(7.0)
  const [spectroData, setSpectroData] = useState(0.5)

  // Ultra-realistic floor texture (AI-generated photo simulation)
  const floorTexture = useMemo(() => {
    const canvas = document.createElement("canvas")
    canvas.width = 2048
    canvas.height = 2048
    const ctx = canvas.getContext("2d")!
    
    // Base: Professional laboratory epoxy floor (light gray-blue)
    const baseGradient = ctx.createLinearGradient(0, 0, 2048, 2048)
    baseGradient.addColorStop(0, "#e8eff5")
    baseGradient.addColorStop(0.5, "#dce6f0")
    baseGradient.addColorStop(1, "#d5dfe8")
    ctx.fillStyle = baseGradient
    ctx.fillRect(0, 0, 2048, 2048)
    
    // Large epoxy tiles (600x600mm standard)
    const tileSize = 136.5 // 15 tiles
    for (let i = 0; i < 15; i++) {
      for (let j = 0; j < 15; j++) {
        const x = i * tileSize
        const y = j * tileSize
        
        // AI-generated tile variation (subtle color shifts)
        const hue = 200 + Math.random() * 10 // Blue-gray
        const sat = 15 + Math.random() * 5
        const light = 88 + Math.random() * 4
        ctx.fillStyle = `hsl(${hue}, ${sat}%, ${light}%)`
        ctx.fillRect(x + 2, y + 2, tileSize - 4, tileSize - 4)
        
        // Realistic epoxy grout (darker gray)
        ctx.fillStyle = "#b5c5d0"
        ctx.fillRect(x, y, tileSize, 3)
        ctx.fillRect(x, y, 3, tileSize)
        
        // AI-style micro-texture and imperfections
        for (let k = 0; k < 50; k++) {
          const px = x + Math.random() * tileSize
          const py = y + Math.random() * tileSize
          const size = 1 + Math.random() * 2
          ctx.fillStyle = `rgba(${210 + Math.random() * 30}, ${220 + Math.random() * 30}, ${235 + Math.random() * 20}, ${0.2 + Math.random() * 0.3})`
          ctx.fillRect(px, py, size, size)
        }
        
        // Glossy specular reflection (AI-enhanced)
        const specGradient = ctx.createRadialGradient(
          x + tileSize * (0.3 + Math.random() * 0.4),
          y + tileSize * (0.3 + Math.random() * 0.4),
          0,
          x + tileSize / 2,
          y + tileSize / 2,
          tileSize * 0.8
        )
        specGradient.addColorStop(0, "rgba(255,255,255,0.25)")
        specGradient.addColorStop(0.5, "rgba(255,255,255,0.1)")
        specGradient.addColorStop(1, "rgba(255,255,255,0)")
        ctx.fillStyle = specGradient
        ctx.fillRect(x + 2, y + 2, tileSize - 4, tileSize - 4)
        
        // Subtle wear patterns (AI realism)
        if (Math.random() > 0.7) {
          ctx.fillStyle = `rgba(180, 190, 200, ${0.05 + Math.random() * 0.1})`
          ctx.beginPath()
          ctx.arc(
            x + Math.random() * tileSize,
            y + Math.random() * tileSize,
            10 + Math.random() * 20,
            0,
            Math.PI * 2
          )
          ctx.fill()
        }
      }
    }
    
    const texture = new THREE.CanvasTexture(canvas)
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.RepeatWrapping
    texture.repeat.set(3, 3)
    return texture
  }, [])

  // AI-generated wall texture (professional laboratory paint)
  const wallTexture = useMemo(() => {
    const canvas = document.createElement("canvas")
    canvas.width = 1024
    canvas.height = 1024
    const ctx = canvas.getContext("2d")!
    
    // Base: Professional lab paint (light mint green - antibacterial)
    const baseGradient = ctx.createLinearGradient(0, 0, 1024, 1024)
    baseGradient.addColorStop(0, "#e8f5f0")
    baseGradient.addColorStop(0.5, "#e0f2ea")
    baseGradient.addColorStop(1, "#daf0e6")
    ctx.fillStyle = baseGradient
    ctx.fillRect(0, 0, 1024, 1024)
    
    // AI-generated paint brush strokes
    for (let i = 0; i < 800; i++) {
      const hue = 150 + Math.random() * 10 // Green tint
      const sat = 20 + Math.random() * 10
      const light = 92 + Math.random() * 6
      ctx.fillStyle = `hsla(${hue}, ${sat}%, ${light}%, ${0.1 + Math.random() * 0.15})`
      const x = Math.random() * 1024
      const y = Math.random() * 1024
      ctx.fillRect(x, y, 4 + Math.random() * 8, 2 + Math.random() * 6)
    }
    
    // Subtle surface variations (AI realism)
    for (let i = 0; i < 100; i++) {
      ctx.fillStyle = `rgba(${220 + Math.random() * 20}, ${240 + Math.random() * 15}, ${230 + Math.random() * 20}, ${0.05 + Math.random() * 0.1})`
      ctx.beginPath()
      ctx.arc(
        Math.random() * 1024,
        Math.random() * 1024,
        5 + Math.random() * 15,
        0,
        Math.PI * 2
      )
      ctx.fill()
    }
    
    // Slight dirt/wear marks (AI authenticity)
    for (let i = 0; i < 30; i++) {
      ctx.fillStyle = `rgba(200, 210, 205, ${0.02 + Math.random() * 0.05})`
      ctx.fillRect(
        Math.random() * 1024,
        Math.random() * 1024,
        10 + Math.random() * 30,
        2 + Math.random() * 8
      )
    }
    
    const texture = new THREE.CanvasTexture(canvas)
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.RepeatWrapping
    texture.repeat.set(2, 2)
    return texture
  }, [])

  // AI-generated table texture (white epoxy resin - lab standard)
  const tableTexture = useMemo(() => {
    const canvas = document.createElement("canvas")
    canvas.width = 1024
    canvas.height = 1024
    const ctx = canvas.getContext("2d")!
    
    // Base: Professional white epoxy resin surface
    const baseGradient = ctx.createRadialGradient(512, 512, 0, 512, 512, 724)
    baseGradient.addColorStop(0, "#ffffff")
    baseGradient.addColorStop(0.5, "#fefefe")
    baseGradient.addColorStop(1, "#fcfcfc")
    ctx.fillStyle = baseGradient
    ctx.fillRect(0, 0, 1024, 1024)
    
    // AI-enhanced micro-texture (epoxy surface)
    for (let i = 0; i < 1000; i++) {
      const x = Math.random() * 1024
      const y = Math.random() * 1024
      const size = Math.random() * 2
      ctx.fillStyle = `rgba(${248 + Math.random() * 7}, ${248 + Math.random() * 7}, ${250 + Math.random() * 5}, ${0.3 + Math.random() * 0.4})`
      ctx.fillRect(x, y, size, size)
    }
    
    // Glossy highlights (AI realism)
    for (let i = 0; i < 20; i++) {
      const highlightGradient = ctx.createRadialGradient(
        Math.random() * 1024,
        Math.random() * 1024,
        0,
        Math.random() * 1024,
        Math.random() * 1024,
        100 + Math.random() * 100
      )
      highlightGradient.addColorStop(0, "rgba(255,255,255,0.3)")
      highlightGradient.addColorStop(1, "rgba(255,255,255,0)")
      ctx.fillStyle = highlightGradient
      ctx.fillRect(0, 0, 1024, 1024)
    }
    
    const texture = new THREE.CanvasTexture(canvas)
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.RepeatWrapping
    return texture
  }, [])

  // AI-generated cabinet texture (powder-coated metal - professional lab white)
  const cabinetTexture = useMemo(() => {
    const canvas = document.createElement("canvas")
    canvas.width = 1024
    canvas.height = 1024
    const ctx = canvas.getContext("2d")!
    
    // Base: Powder-coated metal (slight warm white)
    const baseGradient = ctx.createLinearGradient(0, 0, 1024, 1024)
    baseGradient.addColorStop(0, "#f8f9fa")
    baseGradient.addColorStop(0.5, "#f5f6f8")
    baseGradient.addColorStop(1, "#f2f4f6")
    ctx.fillStyle = baseGradient
    ctx.fillRect(0, 0, 1024, 1024)
    
    // AI-generated metal texture (powder coating)
    for (let i = 0; i < 500; i++) {
      const x = Math.random() * 1024
      const y = Math.random() * 1024
      const size = 1 + Math.random() * 3
      ctx.fillStyle = `rgba(${240 + Math.random() * 15}, ${242 + Math.random() * 13}, ${245 + Math.random() * 10}, ${0.2 + Math.random() * 0.3})`
      ctx.fillRect(x, y, size, size)
    }
    
    // Metallic specular highlights
    for (let i = 0; i < 15; i++) {
      const specGradient = ctx.createRadialGradient(
        Math.random() * 1024,
        Math.random() * 1024,
        0,
        Math.random() * 1024,
        Math.random() * 1024,
        150 + Math.random() * 150
      )
      specGradient.addColorStop(0, "rgba(255,255,255,0.2)")
      specGradient.addColorStop(1, "rgba(255,255,255,0)")
      ctx.fillStyle = specGradient
      ctx.fillRect(0, 0, 1024, 1024)
    }
    
    // Subtle panel lines (AI realism)
    ctx.strokeStyle = "rgba(230, 235, 240, 0.3)"
    ctx.lineWidth = 2
    for (let i = 1; i < 4; i++) {
      ctx.beginPath()
      ctx.moveTo(i * 256, 0)
      ctx.lineTo(i * 256, 1024)
      ctx.stroke()
    }
    
    const texture = new THREE.CanvasTexture(canvas)
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.RepeatWrapping
    return texture
  }, [])

  // AI-generated wood texture for additional cabinets
  const woodTexture = useMemo(() => {
    const canvas = document.createElement("canvas")
    canvas.width = 1024
    canvas.height = 1024
    const ctx = canvas.getContext("2d")!
    
    // Base: Natural wood color (light oak)
    const baseGradient = ctx.createLinearGradient(0, 0, 1024, 0)
    baseGradient.addColorStop(0, "#d4a574")
    baseGradient.addColorStop(0.5, "#c89968")
    baseGradient.addColorStop(1, "#b88a5c")
    ctx.fillStyle = baseGradient
    ctx.fillRect(0, 0, 1024, 1024)
    
    // Wood grain patterns (AI-generated)
    for (let i = 0; i < 80; i++) {
      const y = i * 13
      const amplitude = 20 + Math.random() * 40
      ctx.strokeStyle = `rgba(${160 + Math.random() * 40}, ${120 + Math.random() * 30}, ${80 + Math.random() * 20}, ${0.15 + Math.random() * 0.25})`
      ctx.lineWidth = 2 + Math.random() * 4
      ctx.beginPath()
      for (let x = 0; x < 1024; x += 2) {
        const wave = Math.sin(x * 0.02 + i * 0.5) * amplitude
        ctx.lineTo(x, y + wave)
      }
      ctx.stroke()
    }
    
    // Wood knots (AI realism)
    for (let i = 0; i < 8; i++) {
      const knotX = Math.random() * 1024
      const knotY = Math.random() * 1024
      const knotSize = 20 + Math.random() * 40
      const knotGradient = ctx.createRadialGradient(knotX, knotY, 0, knotX, knotY, knotSize)
      knotGradient.addColorStop(0, "rgba(100, 70, 50, 0.5)")
      knotGradient.addColorStop(0.5, "rgba(140, 100, 80, 0.3)")
      knotGradient.addColorStop(1, "rgba(180, 140, 110, 0)")
      ctx.fillStyle = knotGradient
      ctx.fillRect(0, 0, 1024, 1024)
    }
    
    const texture = new THREE.CanvasTexture(canvas)
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.RepeatWrapping
    return texture
  }, [])

  // AI-generated ceiling texture (acoustic tiles)
  const ceilingTexture = useMemo(() => {
    const canvas = document.createElement("canvas")
    canvas.width = 512
    canvas.height = 512
    const ctx = canvas.getContext("2d")!
    
    // Base: Acoustic ceiling tile (off-white)
    ctx.fillStyle = "#f9f9f7"
    ctx.fillRect(0, 0, 512, 512)
    
    // AI-generated acoustic perforations
    const dotSize = 3
    const spacing = 12
    for (let x = spacing / 2; x < 512; x += spacing) {
      for (let y = spacing / 2; y < 512; y += spacing) {
        ctx.fillStyle = "rgba(200, 200, 195, 0.4)"
        ctx.beginPath()
        ctx.arc(x + (Math.random() - 0.5) * 2, y + (Math.random() - 0.5) * 2, dotSize / 2, 0, Math.PI * 2)
        ctx.fill()
      }
    }
    
    // Texture variation (AI realism)
    for (let i = 0; i < 200; i++) {
      ctx.fillStyle = `rgba(245, 245, 243, ${0.1 + Math.random() * 0.2})`
      ctx.fillRect(Math.random() * 512, Math.random() * 512, 2 + Math.random() * 4, 2 + Math.random() * 4)
    }
    
    const texture = new THREE.CanvasTexture(canvas)
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.RepeatWrapping
    texture.repeat.set(4, 4)
    return texture
  }, [])

  // AI-enhanced environment map (HDRI simulation)
  const environmentMap = useMemo(() => {
    const canvas = document.createElement("canvas")
    canvas.width = 1024
    canvas.height = 512
    const ctx = canvas.getContext("2d")!
    
    // Sky gradient (realistic laboratory lighting)
    const skyGradient = ctx.createLinearGradient(0, 0, 0, 512)
    skyGradient.addColorStop(0, "#e8f4f8")      // Bright sky
    skyGradient.addColorStop(0.3, "#b8d4e0")    // Mid sky
    skyGradient.addColorStop(0.5, "#a0c0d0")    // Horizon
    skyGradient.addColorStop(0.7, "#d5e5f0")    // Lower atmosphere
    skyGradient.addColorStop(1, "#f0f8ff")      // Near ground
    ctx.fillStyle = skyGradient
    ctx.fillRect(0, 0, 1024, 512)
    
    // Add realistic clouds (AI-style)
    for (let i = 0; i < 50; i++) {
      const x = Math.random() * 1024
      const y = Math.random() * 200
      const radius = 30 + Math.random() * 60
      const cloudGradient = ctx.createRadialGradient(x, y, 0, x, y, radius)
      cloudGradient.addColorStop(0, "rgba(255, 255, 255, 0.6)")
      cloudGradient.addColorStop(0.5, "rgba(240, 248, 255, 0.3)")
      cloudGradient.addColorStop(1, "rgba(255, 255, 255, 0)")
      ctx.fillStyle = cloudGradient
      ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2)
    }
    
    // Sun glow effect
    const sunX = 800
    const sunY = 150
    const sunGradient = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, 120)
    sunGradient.addColorStop(0, "rgba(255, 250, 220, 0.8)")
    sunGradient.addColorStop(0.3, "rgba(255, 245, 200, 0.4)")
    sunGradient.addColorStop(0.6, "rgba(255, 240, 180, 0.2)")
    sunGradient.addColorStop(1, "rgba(255, 235, 160, 0)")
    ctx.fillStyle = sunGradient
    ctx.fillRect(0, 0, 1024, 512)
    
    const texture = new THREE.CanvasTexture(canvas)
    texture.mapping = THREE.EquirectangularReflectionMapping
    return texture
  }, [])

  useFrame((state) => {
    setMicroscopeData(microscopeParams.magnification * (0.98 + Math.sin(state.clock.elapsedTime) * 0.02))
    setIncubatorData(incubatorParams.temperature + Math.sin(state.clock.elapsedTime * 0.3) * 0.1)
    setCentrifugeData(centrifugeParams.speed * (0.95 + Math.sin(state.clock.elapsedTime * 8) * 0.05))
    setAutoclaveData(autoclaveParams.temperature + Math.sin(state.clock.elapsedTime * 0.2) * 0.5)
    setBalanceData(balanceParams.weight + Math.sin(state.clock.elapsedTime * 2) * 0.001)
    setPhMeterData(phMeterParams.ph + Math.sin(state.clock.elapsedTime * 1.5) * 0.05)
    setSpectroData(spectroParams.absorbance + Math.sin(state.clock.elapsedTime) * 0.01)
  })

  return (
    <group>
      {/* Realistic skybox/environment - AI-generated HDRI */}
      <mesh>
        <sphereGeometry args={[100, 32, 32]} />
        <meshBasicMaterial map={environmentMap} side={THREE.BackSide} />
      </mesh>

      {/* Professional Lab Floor - AI-generated epoxy tile texture */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[25, 25]} />
        <meshStandardMaterial
          color="#dce6f0"
          roughness={0.15}
          metalness={0.1}
          map={floorTexture}
          normalMap={floorTexture}
          envMap={environmentMap}
          envMapIntensity={0.3}
        />
      </mesh>

      {/* Professional Lab Walls - AI-generated mint green antibacterial paint */}
      <mesh position={[0, 3, -12.5]} receiveShadow>
        <boxGeometry args={[25, 6, 0.3]} />
        <meshStandardMaterial 
          color="#e0f2ea" 
          roughness={0.5} 
          map={wallTexture}
          envMap={environmentMap}
          envMapIntensity={0.2}
        />
      </mesh>
      <mesh position={[-12.5, 3, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <boxGeometry args={[25, 6, 0.3]} />
        <meshStandardMaterial 
          color="#e0f2ea" 
          roughness={0.5} 
          map={wallTexture}
          envMap={environmentMap}
          envMapIntensity={0.2}
        />
      </mesh>
      <mesh position={[12.5, 3, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <boxGeometry args={[25, 6, 0.3]} />
        <meshStandardMaterial 
          color="#e0f2ea" 
          roughness={0.5} 
          map={wallTexture}
          envMap={environmentMap}
          envMapIntensity={0.2}
        />
      </mesh>

      {/* Large Windows with Realistic Outside View - AI-enhanced */}
      {/* Window 1 - Left wall, front */}
      <group position={[-12.4, 3, -6]}>
        {/* Window frame */}
        <mesh>
          <boxGeometry args={[0.15, 2.5, 3.5]} />
          <meshStandardMaterial color="#f0f0f0" roughness={0.3} metalness={0.6} />
        </mesh>
        {/* Window glass */}
        <mesh position={[0.08, 0, 0]}>
          <boxGeometry args={[0.02, 2.3, 3.3]} />
          <meshPhysicalMaterial
            color="#e0f8ff"
            transparent
            opacity={0.4}
            roughness={0.05}
            metalness={0.1}
            transmission={0.9}
            thickness={0.5}
            envMap={environmentMap}
            envMapIntensity={1.2}
          />
        </mesh>
        {/* Window mullions (crossbars) */}
        {[-1.1, 0, 1.1].map((z, i) => (
          <mesh key={`v-${i}`} position={[0.08, 0, z]}>
            <boxGeometry args={[0.03, 2.3, 0.04]} />
            <meshStandardMaterial color="#ffffff" roughness={0.2} metalness={0.7} />
          </mesh>
        ))}
        {[-0.8, 0, 0.8].map((y, i) => (
          <mesh key={`h-${i}`} position={[0.08, y, 0]}>
            <boxGeometry args={[0.03, 0.04, 3.3]} />
            <meshStandardMaterial color="#ffffff" roughness={0.2} metalness={0.7} />
          </mesh>
        ))}
      </group>

      {/* Window 2 - Left wall, middle */}
      <group position={[-12.4, 3, 2]}>
        {/* Window frame */}
        <mesh>
          <boxGeometry args={[0.15, 2.5, 3.5]} />
          <meshStandardMaterial color="#f0f0f0" roughness={0.3} metalness={0.6} />
        </mesh>
        {/* Window glass */}
        <mesh position={[0.08, 0, 0]}>
          <boxGeometry args={[0.02, 2.3, 3.3]} />
          <meshPhysicalMaterial
            color="#e0f8ff"
            transparent
            opacity={0.4}
            roughness={0.05}
            metalness={0.1}
            transmission={0.9}
            thickness={0.5}
            envMap={environmentMap}
            envMapIntensity={1.2}
          />
        </mesh>
        {/* Window mullions */}
        {[-1.1, 0, 1.1].map((z, i) => (
          <mesh key={`v-${i}`} position={[0.08, 0, z]}>
            <boxGeometry args={[0.03, 2.3, 0.04]} />
            <meshStandardMaterial color="#ffffff" roughness={0.2} metalness={0.7} />
          </mesh>
        ))}
        {[-0.8, 0, 0.8].map((y, i) => (
          <mesh key={`h-${i}`} position={[0.08, y, 0]}>
            <boxGeometry args={[0.03, 0.04, 3.3]} />
            <meshStandardMaterial color="#ffffff" roughness={0.2} metalness={0.7} />
          </mesh>
        ))}
      </group>

      {/* Window 3 - Right wall, front */}
      <group position={[12.4, 3, -6]}>
        {/* Window frame */}
        <mesh>
          <boxGeometry args={[0.15, 2.5, 3.5]} />
          <meshStandardMaterial color="#f0f0f0" roughness={0.3} metalness={0.6} />
        </mesh>
        {/* Window glass */}
        <mesh position={[-0.08, 0, 0]}>
          <boxGeometry args={[0.02, 2.3, 3.3]} />
          <meshPhysicalMaterial
            color="#e0f8ff"
            transparent
            opacity={0.4}
            roughness={0.05}
            metalness={0.1}
            transmission={0.9}
            thickness={0.5}
            envMap={environmentMap}
            envMapIntensity={1.2}
          />
        </mesh>
        {/* Window mullions */}
        {[-1.1, 0, 1.1].map((z, i) => (
          <mesh key={`v-${i}`} position={[-0.08, 0, z]}>
            <boxGeometry args={[0.03, 2.3, 0.04]} />
            <meshStandardMaterial color="#ffffff" roughness={0.2} metalness={0.7} />
          </mesh>
        ))}
        {[-0.8, 0, 0.8].map((y, i) => (
          <mesh key={`h-${i}`} position={[-0.08, y, 0]}>
            <boxGeometry args={[0.03, 0.04, 3.3]} />
            <meshStandardMaterial color="#ffffff" roughness={0.2} metalness={0.7} />
          </mesh>
        ))}
      </group>

      {/* Window 4 - Right wall, middle */}
      <group position={[12.4, 3, 2]}>
        {/* Window frame */}
        <mesh>
          <boxGeometry args={[0.15, 2.5, 3.5]} />
          <meshStandardMaterial color="#f0f0f0" roughness={0.3} metalness={0.6} />
        </mesh>
        {/* Window glass */}
        <mesh position={[-0.08, 0, 0]}>
          <boxGeometry args={[0.02, 2.3, 3.3]} />
          <meshPhysicalMaterial
            color="#e0f8ff"
            transparent
            opacity={0.4}
            roughness={0.05}
            metalness={0.1}
            transmission={0.9}
            thickness={0.5}
            envMap={environmentMap}
            envMapIntensity={1.2}
          />
        </mesh>
        {/* Window mullions */}
        {[-1.1, 0, 1.1].map((z, i) => (
          <mesh key={`v-${i}`} position={[-0.08, 0, z]}>
            <boxGeometry args={[0.03, 2.3, 0.04]} />
            <meshStandardMaterial color="#ffffff" roughness={0.2} metalness={0.7} />
          </mesh>
        ))}
        {[-0.8, 0, 0.8].map((y, i) => (
          <mesh key={`h-${i}`} position={[-0.08, y, 0]}>
            <boxGeometry args={[0.03, 0.04, 3.3]} />
            <meshStandardMaterial color="#ffffff" roughness={0.2} metalness={0.7} />
          </mesh>
        ))}
      </group>

      {/* Natural light beams from windows (volumetric effect simulation) */}
      {[
        [-12.4, 3, -6], [-12.4, 3, 2], [12.4, 3, -6], [12.4, 3, 2]
      ].map((pos, i) => (
        <mesh key={i} position={pos as [number, number, number]} rotation={[0, i < 2 ? Math.PI / 2 : -Math.PI / 2, 0]}>
          <coneGeometry args={[2, 8, 4, 1, true]} />
          <meshBasicMaterial
            color="#fffacd"
            transparent
            opacity={0.08}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}

      {/* Ceiling - AI-generated acoustic tile texture */}
      <mesh position={[0, 6, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[25, 25]} />
        <meshStandardMaterial color="#f9f9f7" roughness={0.7} map={ceilingTexture} />
      </mesh>

      {/* Professional Lab Bench - Large white bench */}
      <group position={[0, 0.6, -4]}>
        {/* Main surface */}
        <mesh castShadow receiveShadow>
          <boxGeometry args={[8, 0.2, 4]} />
          <meshStandardMaterial color="#ffffff" roughness={0.2} metalness={0.1} />
        </mesh>
        {/* Bench legs */}
        {[
          [-3.9, -0.4, -1.9],
          [3.9, -0.4, -1.9],
          [-3.9, -0.4, 1.9],
          [3.9, -0.4, 1.9],
        ].map((pos, i) => (
          <mesh key={i} position={pos as [number, number, number]} castShadow>
            <cylinderGeometry args={[0.1, 0.1, 0.8]} />
            <meshStandardMaterial color="#c8c8c8" roughness={0.3} metalness={0.9} />
          </mesh>
        ))}
        {/* Drawers */}
        {[-2, 0, 2].map((x, i) => (
          <group key={i} position={[x, -0.1, 1.8]}>
            <mesh castShadow>
              <boxGeometry args={[1.8, 0.3, 0.15]} />
              <meshStandardMaterial color="#e8e8e8" roughness={0.4} />
            </mesh>
            <mesh position={[0.7, 0, 0.08]} castShadow>
              <boxGeometry args={[0.4, 0.05, 0.02]} />
              <meshStandardMaterial color="#808080" roughness={0.2} metalness={0.9} />
            </mesh>
          </group>
        ))}
        {/* Backsplash */}
        <mesh position={[0, 0.3, -1.9]} castShadow receiveShadow>
          <boxGeometry args={[8, 0.6, 0.1]} />
          <meshStandardMaterial color="#ffffff" roughness={0.2} />
        </mesh>
      </group>

      {/* Professional Compound Microscope */}
      <InteractiveInstrument
        position={[-3, 1.5, -4]}
        name="Microscope optique professionnel"
        description="Microscope optique composé avec objectifs multiples et éclairage LED"
        onParameterChange={(params) => setMicroscopeParams({ ...microscopeParams, ...params })}
        discipline={discipline}
        parameters={{
          magnification: {
            min: 40,
            max: 1000,
            value: microscopeParams.magnification,
            label: "Grossissement",
            unit: "x",
          },
          focus: {
            min: 0,
            max: 100,
            value: microscopeParams.focus,
            label: "Mise au point",
            unit: "%",
          },
          light: {
            min: 0,
            max: 100,
            value: microscopeParams.light,
            label: "Intensité lumière",
            unit: "%",
          },
        }}
        showData={true}
        dataValue={microscopeData}
        dataUnit="x"
      >
        {/* Microscope base - heavy and stable */}
        <mesh castShadow>
          <boxGeometry args={[0.35, 0.2, 0.35]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.15} metalness={0.7} />
        </mesh>
        {/* Arm - curved and strong */}
        <mesh position={[0, 0.25, -0.12]} castShadow>
          <boxGeometry args={[0.12, 0.5, 0.12]} />
          <meshStandardMaterial color="#2a2a2a" roughness={0.2} metalness={0.6} />
        </mesh>
        {/* Head with eyepieces */}
        <mesh position={[0, 0.6, -0.15]} castShadow>
          <boxGeometry args={[0.25, 0.2, 0.25]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.15} metalness={0.7} />
        </mesh>
        {/* Eyepiece */}
        <mesh position={[0, 0.7, -0.15]} castShadow>
          <cylinderGeometry args={[0.05, 0.05, 0.1]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.1} metalness={0.8} />
        </mesh>
        {/* Objective turret */}
        <mesh position={[0, 0.5, -0.15]} castShadow>
          <cylinderGeometry args={[0.08, 0.08, 0.15]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.15} metalness={0.7} />
        </mesh>
        {/* Objective lenses */}
        {[0, 1, 2].map((i) => (
          <mesh key={i} position={[0, 0.5, -0.15 + i * 0.05]} rotation={[0, (i * Math.PI * 2) / 3, 0]} castShadow>
            <cylinderGeometry args={[0.04, 0.04, 0.08]} />
            <meshStandardMaterial color="#000000" roughness={0.05} metalness={0.95} />
          </mesh>
        ))}
        {/* Stage */}
        <mesh position={[0, 0.35, -0.1]} castShadow>
          <boxGeometry args={[0.2, 0.03, 0.2]} />
          <meshStandardMaterial color="#3a3a3a" roughness={0.3} metalness={0.5} />
        </mesh>
        {/* Stage clips */}
        {[-0.08, 0.08].map((x, i) => (
          <mesh key={i} position={[x, 0.37, -0.1]} castShadow>
            <boxGeometry args={[0.03, 0.05, 0.05]} />
            <meshStandardMaterial color="#2a2a2a" roughness={0.2} metalness={0.7} />
          </mesh>
        ))}
        {/* Condenser */}
        <mesh position={[0, 0.25, -0.1]} castShadow>
          <cylinderGeometry args={[0.06, 0.06, 0.08]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.2} metalness={0.6} />
        </mesh>
        {/* Light source */}
        <mesh position={[0, 0.15, -0.1]} castShadow>
          <cylinderGeometry args={[0.05, 0.05, 0.05]} />
          <meshStandardMaterial
            color="#ffffff"
            emissive="#ffffff"
            emissiveIntensity={microscopeParams.light / 100}
            roughness={0.1}
          />
        </mesh>
      </InteractiveInstrument>

      {/* Professional CO2 Incubator */}
      <InteractiveInstrument
        position={[0, 1.6, -4]}
        name="Incubateur CO₂ professionnel"
        description="Incubateur à CO₂ pour culture cellulaire avec contrôle précis"
        onParameterChange={(params) => setIncubatorParams({ ...incubatorParams, ...params })}
        discipline={discipline}
        parameters={{
          temperature: {
            min: 20,
            max: 50,
            value: incubatorParams.temperature,
            label: "Température",
            unit: "°C",
          },
          humidity: {
            min: 0,
            max: 100,
            value: incubatorParams.humidity,
            label: "Humidité",
            unit: "%",
          },
          co2: {
            min: 0,
            max: 20,
            value: incubatorParams.co2,
            label: "CO₂",
            unit: "%",
          },
        }}
        showData={true}
        dataValue={incubatorData}
        dataUnit="°C"
      >
        {/* Incubator body */}
        <mesh castShadow>
          <boxGeometry args={[0.7, 0.8, 0.5]} />
          <meshStandardMaterial color="#ffffff" roughness={0.15} metalness={0.1} />
        </mesh>
        {/* Double glass door */}
        <mesh position={[0, 0, 0.26]} castShadow>
          <boxGeometry args={[0.65, 0.75, 0.04]} />
          <meshStandardMaterial
            color="#e0f0ff"
            roughness={0.05}
            metalness={0.1}
            transparent
            opacity={0.85}
          />
        </mesh>
        {/* Control panel */}
        <mesh position={[0, 0.35, 0.26]} castShadow>
          <boxGeometry args={[0.6, 0.15, 0.05]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.3} />
        </mesh>
        {/* Digital display */}
        <mesh position={[0, 0.35, 0.28]} castShadow>
          <boxGeometry args={[0.25, 0.08, 0.01]} />
          <meshStandardMaterial
            color="#00ff00"
            emissive="#00ff00"
            emissiveIntensity={0.8}
            roughness={0.1}
          />
        </mesh>
        {/* Control buttons */}
        {[-0.15, 0, 0.15].map((x, i) => (
          <mesh key={i} position={[x, 0.25, 0.28]} castShadow>
            <cylinderGeometry args={[0.02, 0.02, 0.01]} />
            <meshStandardMaterial color="#404040" roughness={0.3} metalness={0.5} />
          </mesh>
        ))}
        {/* Handle */}
        <mesh position={[0.3, 0, 0.27]} castShadow>
          <boxGeometry args={[0.06, 0.2, 0.02]} />
          <meshStandardMaterial color="#c0c0c0" roughness={0.2} metalness={0.9} />
        </mesh>
        {/* Interior shelves */}
        {[-0.2, 0, 0.2].map((y, i) => (
          <mesh key={i} position={[0, y, 0.1]} castShadow>
            <boxGeometry args={[0.6, 0.02, 0.4]} />
            <meshStandardMaterial color="#e0e0e0" roughness={0.4} metalness={0.2} />
          </mesh>
        ))}
      </InteractiveInstrument>

      {/* Professional Centrifuge */}
      <InteractiveInstrument
        position={[3, 1.4, -4]}
        name="Centrifugeuse réfrigérée"
        description="Centrifugeuse de paillasse avec contrôle de température"
        onParameterChange={(params) => setCentrifugeParams({ ...centrifugeParams, ...params })}
        discipline={discipline}
        parameters={{
          speed: {
            min: 0,
            max: 15000,
            value: centrifugeParams.speed,
            label: "Vitesse",
            unit: "rpm",
          },
          time: {
            min: 0,
            max: 60,
            value: centrifugeParams.time,
            label: "Temps",
            unit: "min",
          },
          temperature: {
            min: -10,
            max: 40,
            value: centrifugeParams.temperature,
            label: "Température",
            unit: "°C",
          },
        }}
        showData={true}
        dataValue={centrifugeData}
        dataUnit="rpm"
      >
        {/* Centrifuge body */}
        <mesh castShadow>
          <cylinderGeometry args={[0.4, 0.4, 0.35]} />
          <meshStandardMaterial color="#ffffff" roughness={0.15} metalness={0.1} />
        </mesh>
        {/* Lid with handle */}
        <mesh position={[0, 0.2, 0]} castShadow>
          <cylinderGeometry args={[0.42, 0.42, 0.06]} />
          <meshStandardMaterial color="#e8e8e8" roughness={0.2} metalness={0.2} />
        </mesh>
        <mesh position={[0, 0.25, 0]} castShadow>
          <cylinderGeometry args={[0.05, 0.05, 0.08]} />
          <meshStandardMaterial color="#c0c0c0" roughness={0.2} metalness={0.9} />
        </mesh>
        {/* Control panel */}
        <mesh position={[0, -0.15, 0.4]} castShadow>
          <boxGeometry args={[0.35, 0.12, 0.08]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.3} />
        </mesh>
        {/* Display */}
        <mesh position={[0, -0.15, 0.42]} castShadow>
          <boxGeometry args={[0.2, 0.06, 0.01]} />
          <meshStandardMaterial
            color="#00ff00"
            emissive="#00ff00"
            emissiveIntensity={0.6}
            roughness={0.1}
          />
        </mesh>
        {/* Rotor - spinning when active */}
        {centrifugeParams.speed > 0 && (
          <mesh
            position={[0, 0.05, 0]}
            rotation={[0, 0, Date.now() * centrifugeParams.speed * 0.0001]}
            castShadow
          >
            <cylinderGeometry args={[0.3, 0.3, 0.03]} />
            <meshStandardMaterial color="#c0c0c0" roughness={0.15} metalness={0.8} />
          </mesh>
        )}
      </InteractiveInstrument>

      {/* Autoclave */}
      <InteractiveInstrument
        position={[-1.5, 1.5, -2]}
        name="Autoclave"
        description="Stérilisateur à vapeur sous pression"
        onParameterChange={(params) => setAutoclaveParams({ ...autoclaveParams, ...params })}
        discipline={discipline}
        parameters={{
          temperature: {
            min: 100,
            max: 135,
            value: autoclaveParams.temperature,
            label: "Température",
            unit: "°C",
          },
          pressure: {
            min: 0,
            max: 2,
            value: autoclaveParams.pressure,
            label: "Pression",
            unit: "bar",
          },
          time: {
            min: 0,
            max: 120,
            value: autoclaveParams.time,
            label: "Temps",
            unit: "min",
          },
        }}
        showData={true}
        dataValue={autoclaveData}
        dataUnit="°C"
      >
        {/* Autoclave body */}
        <mesh castShadow>
          <cylinderGeometry args={[0.35, 0.35, 0.5]} />
          <meshStandardMaterial color="#ffffff" roughness={0.2} metalness={0.2} />
        </mesh>
        {/* Door */}
        <mesh position={[0, 0, 0.26]} castShadow>
          <cylinderGeometry args={[0.36, 0.36, 0.06]} />
          <meshStandardMaterial color="#c0c0c0" roughness={0.3} metalness={0.7} />
        </mesh>
        {/* Control panel */}
        <mesh position={[0, 0.3, 0.35]} castShadow>
          <boxGeometry args={[0.3, 0.1, 0.05]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.3} />
        </mesh>
        {/* Pressure gauge */}
        <mesh position={[0.2, 0.2, 0.35]} castShadow>
          <cylinderGeometry args={[0.04, 0.04, 0.02]} />
          <meshStandardMaterial color="#c0c0c0" roughness={0.2} metalness={0.8} />
        </mesh>
      </InteractiveInstrument>

      {/* Professional Petri Dishes with cultures */}
      <group position={[-4.5, 1.2, -3.5]}>
        {[0, 0.25, 0.5, 0.75].map((offset, i) => (
          <group key={i} position={[offset, 0, 0]}>
            <mesh castShadow>
              <cylinderGeometry args={[0.1, 0.1, 0.02]} />
              <meshStandardMaterial color="#ffffff" roughness={0.1} metalness={0.1} />
            </mesh>
            <mesh position={[0, 0.015, 0]} castShadow>
              <cylinderGeometry args={[0.095, 0.095, 0.01]} />
              <meshStandardMaterial color="#ffffff" transparent opacity={0.95} />
            </mesh>
            {/* Culture medium with colonies */}
            <mesh position={[0, 0.01, 0]}>
              <cylinderGeometry args={[0.09, 0.09, 0.005]} />
              <meshStandardMaterial
                color={i === 0 ? "#ffeb3b" : i === 1 ? "#4caf50" : i === 2 ? "#ff9800" : "#e91e63"}
                roughness={0.8}
              />
            </mesh>
            {/* Bacterial colonies */}
            {Array.from({ length: 3 + i }).map((_, j) => (
              <mesh
                key={j}
                position={[
                  (Math.random() - 0.5) * 0.15,
                  0.012,
                  (Math.random() - 0.5) * 0.15,
                ]}
              >
                <sphereGeometry args={[0.01 + Math.random() * 0.01]} />
                <meshStandardMaterial color="#ffffff" roughness={0.5} />
              </mesh>
            ))}
          </group>
        ))}
      </group>

      {/* Professional Test Tube Rack */}
      <group position={[4.5, 1.2, -3.5]}>
        {/* Rack base */}
        <mesh castShadow>
          <boxGeometry args={[0.5, 0.12, 0.25]} />
          <meshStandardMaterial color="#ffffff" roughness={0.3} />
        </mesh>
        {/* Test tubes with samples */}
        {[0, 0.15, 0.3].map((offset, i) => (
          <group key={i} position={[offset - 0.15, 0.2, 0]}>
            <mesh castShadow>
              <cylinderGeometry args={[0.025, 0.025, 0.25]} />
              <meshStandardMaterial
                color="#ffffff"
                roughness={0.05}
                metalness={0.1}
                transparent
                opacity={0.9}
              />
            </mesh>
            {/* Sample liquid */}
            <mesh position={[0, -0.05 + i * 0.03, 0]}>
              <cylinderGeometry args={[0.023, 0.023, 0.1 + i * 0.05]} />
              <meshStandardMaterial
                color={i === 0 ? "#3b82f6" : i === 1 ? "#10b981" : "#f59e0b"}
                roughness={0.7}
                transparent
                opacity={0.8}
              />
            </mesh>
            {/* Cap */}
            <mesh position={[0, 0.13, 0]} castShadow>
              <cylinderGeometry args={[0.03, 0.03, 0.03]} />
              <meshStandardMaterial color="#c0c0c0" roughness={0.3} metalness={0.5} />
            </mesh>
          </group>
        ))}
      </group>

      {/* Lab Equipment Shelf */}
      <group position={[0, 4, -4]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[7, 0.15, 1.5]} />
          <meshStandardMaterial color="#d0d0d0" roughness={0.4} metalness={0.3} />
        </mesh>
        {/* Support brackets */}
        {[-3.3, 3.3].map((pos, i) => (
          <mesh key={i} position={[pos, -0.4, 0]} castShadow>
            <boxGeometry args={[0.15, 0.8, 0.15]} />
            <meshStandardMaterial color="#a0a0a0" roughness={0.5} metalness={0.5} />
          </mesh>
        ))}
        {/* Equipment on shelf */}
        <mesh position={[-2, 0.1, 0]} castShadow>
          <boxGeometry args={[0.4, 0.3, 0.4]} />
          <meshStandardMaterial color="#ffffff" roughness={0.2} />
        </mesh>
        <mesh position={[0, 0.1, 0]} castShadow>
          <boxGeometry args={[0.35, 0.25, 0.35]} />
          <meshStandardMaterial color="#ffffff" roughness={0.2} />
        </mesh>
        <mesh position={[2, 0.1, 0]} castShadow>
          <boxGeometry args={[0.4, 0.3, 0.4]} />
          <meshStandardMaterial color="#ffffff" roughness={0.2} />
        </mesh>
        {/* Reagent bottles */}
        {[-1, 1].map((x, i) => (
          <group key={i} position={[x, 0.2, 0]}>
            <mesh castShadow>
              <cylinderGeometry args={[0.08, 0.08, 0.2]} />
              <meshStandardMaterial
                color={i === 0 ? "#3b82f6" : "#10b981"}
                roughness={0.1}
                metalness={0.1}
                transparent
                opacity={0.7}
              />
            </mesh>
            <mesh position={[0, 0.12, 0]} castShadow>
              <cylinderGeometry args={[0.06, 0.06, 0.05]} />
              <meshStandardMaterial color="#ffffff" roughness={0.2} />
            </mesh>
          </group>
        ))}
      </group>

      {/* Safety Equipment - Eye Wash Station */}
      <group position={[-5, 2.5, -2]}>
        <mesh castShadow>
          <boxGeometry args={[0.3, 0.6, 0.3]} />
          <meshStandardMaterial color="#ffffff" roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.4, 0]} castShadow>
          <cylinderGeometry args={[0.06, 0.06, 0.15]} />
          <meshStandardMaterial color="#c0c0c0" roughness={0.2} metalness={0.8} />
        </mesh>
        <mesh position={[0, 0.5, 0]} castShadow>
          <cylinderGeometry args={[0.08, 0.08, 0.05]} />
          <meshStandardMaterial color="#3b82f6" roughness={0.2} metalness={0.7} />
        </mesh>
      </group>

      {/* Professional Lab Sink */}
      <group position={[5, 1, -2]}>
        <mesh castShadow>
          <boxGeometry args={[0.8, 0.4, 0.5]} />
          <meshStandardMaterial color="#ffffff" roughness={0.2} />
        </mesh>
        <mesh position={[0, 0.1, 0]} castShadow>
          <boxGeometry args={[0.7, 0.2, 0.45]} />
          <meshStandardMaterial color="#c0c0c0" roughness={0.1} metalness={0.95} />
        </mesh>
        {/* Faucet */}
        <mesh position={[0, 0.3, 0.2]} castShadow>
          <cylinderGeometry args={[0.025, 0.025, 0.25]} />
          <meshStandardMaterial color="#c0c0c0" roughness={0.15} metalness={0.9} />
        </mesh>
        <mesh position={[0, 0.45, 0.2]} castShadow>
          <boxGeometry args={[0.08, 0.05, 0.05]} />
          <meshStandardMaterial color="#c0c0c0" roughness={0.15} metalness={0.9} />
        </mesh>
        {/* Soap dispenser */}
        <mesh position={[0.3, 0.25, 0.2]} castShadow>
          <cylinderGeometry args={[0.05, 0.05, 0.15]} />
          <meshStandardMaterial color="#ffffff" roughness={0.2} />
        </mesh>
      </group>

      {/* Refrigerator */}
      <group position={[6, 1.8, -3]}>
        <mesh castShadow>
          <boxGeometry args={[0.6, 1, 0.5]} />
          <meshStandardMaterial color="#ffffff" roughness={0.2} metalness={0.1} />
        </mesh>
        <mesh position={[0, 0, 0.26]} castShadow>
          <boxGeometry args={[0.55, 0.95, 0.05]} />
          <meshStandardMaterial color="#e0e0e0" roughness={0.3} metalness={0.3} />
        </mesh>
        <mesh position={[0.25, 0, 0.28]} castShadow>
          <boxGeometry args={[0.05, 0.2, 0.02]} />
          <meshStandardMaterial color="#c0c0c0" roughness={0.2} metalness={0.9} />
        </mesh>
        {/* Temperature display */}
        <mesh position={[0, 0.4, 0.28]} castShadow>
          <boxGeometry args={[0.15, 0.06, 0.01]} />
          <meshStandardMaterial
            color="#00ff00"
            emissive="#00ff00"
            emissiveIntensity={0.5}
            roughness={0.1}
          />
        </mesh>
      </group>

      {/* Waste Bin */}
      <group position={[-6, 0.5, -2]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.3, 0.3, 0.6]} />
          <meshStandardMaterial color="#ff0000" roughness={0.4} />
        </mesh>
        <mesh position={[0, 0.35, 0]} castShadow>
          <cylinderGeometry args={[0.32, 0.32, 0.05]} />
          <meshStandardMaterial color="#cc0000" roughness={0.4} />
        </mesh>
        {/* Biohazard symbol */}
        <mesh position={[0, 0.35, 0.32]} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.15, 0.2, 32]} />
          <meshStandardMaterial color="#000000" />
        </mesh>
      </group>

      {/* Lab Chairs - More chairs distributed throughout */}
      {[
        [-3, 0.4, 1], [3, 0.4, 1], [-6, 0.4, 2], [6, 0.4, 2],
        [-2, 0.4, -2], [2, 0.4, -2], [0, 0.4, 3]
      ].map((pos, i) => (
        <group key={i} position={pos as [number, number, number]}>
          {/* Chair base */}
          <mesh castShadow>
            <cylinderGeometry args={[0.3, 0.3, 0.05]} />
            <meshStandardMaterial color="#2a2a2a" roughness={0.3} />
          </mesh>
          {/* Chair gas lift */}
          <mesh position={[0, 0.3, 0]} castShadow>
            <cylinderGeometry args={[0.025, 0.025, 0.6]} />
            <meshStandardMaterial color="#1a1a1a" roughness={0.2} metalness={0.8} />
          </mesh>
          {/* Chair seat with padding */}
          <mesh position={[0, 0.65, 0]} castShadow>
            <cylinderGeometry args={[0.25, 0.22, 0.1]} />
            <meshStandardMaterial color="#2a2a2a" roughness={0.6} />
          </mesh>
          {/* Chair back */}
          <mesh position={[0, 0.9, -0.2]} castShadow>
            <boxGeometry args={[0.35, 0.4, 0.08]} />
            <meshStandardMaterial color="#2a2a2a" roughness={0.5} />
          </mesh>
          {/* Armrests */}
          {[-0.2, 0.2].map((x, j) => (
            <mesh key={j} position={[x, 0.7, 0]} castShadow>
              <boxGeometry args={[0.06, 0.15, 0.3]} />
              <meshStandardMaterial color="#1a1a1a" roughness={0.3} metalness={0.6} />
            </mesh>
          ))}
        </group>
      ))}

      {/* Professional Storage Cabinets - Back wall */}
      {[-8, -4, 4, 8].map((x, i) => (
        <group key={i} position={[x, 1.5, -12]}>
          {/* Cabinet body */}
          <mesh castShadow receiveShadow>
            <boxGeometry args={[1.8, 3, 0.6]} />
            <meshStandardMaterial 
              color="#f0f0f0" 
              roughness={0.3} 
              metalness={0.1}
            />
          </mesh>
          {/* Cabinet doors with handles */}
          {[-0.45, 0.45].map((z, j) => (
            <group key={j}>
              <mesh position={[0, 0, z]} castShadow>
                <boxGeometry args={[1.7, 2.9, 0.05]} />
                <meshStandardMaterial 
                  color="#ffffff" 
                  roughness={0.2} 
                  metalness={0.1}
                />
              </mesh>
              {/* Door handle */}
              <mesh position={[(j === 0 ? 0.6 : -0.6), 0, z + 0.03]} castShadow>
                <boxGeometry args={[0.15, 0.05, 0.03]} />
                <meshStandardMaterial color="#c0c0c0" roughness={0.15} metalness={0.9} />
              </mesh>
            </group>
          ))}
          {/* Glass window in upper section */}
          <mesh position={[0, 0.8, 0.31]} castShadow>
            <boxGeometry args={[1.5, 1, 0.02]} />
            <meshStandardMaterial 
              color="#e0f0ff" 
              roughness={0.05} 
              metalness={0.1}
              transparent
              opacity={0.7}
            />
          </mesh>
        </group>
      ))}

      {/* Side Cabinets - Left wall (White metal) */}
      {[-10, 2, 6].map((z, i) => (
        <group key={i} position={[-12, 1.5, z]}>
          {/* Cabinet body */}
          <mesh castShadow receiveShadow>
            <boxGeometry args={[0.6, 3, 2]} />
            <meshStandardMaterial 
              color="#f0f0f0" 
              roughness={0.3} 
              metalness={0.1}
              map={cabinetTexture}
            />
          </mesh>
          {/* Cabinet doors */}
          <mesh position={[0.31, 0, 0]} castShadow>
            <boxGeometry args={[0.05, 2.9, 1.9]} />
            <meshStandardMaterial 
              color="#ffffff" 
              roughness={0.2} 
              metalness={0.1}
              map={cabinetTexture}
            />
          </mesh>
          {/* Door handles */}
          {[-0.5, 0.5].map((y, j) => (
            <mesh key={j} position={[0.33, y, 0.8]} rotation={[0, 0, Math.PI / 2]} castShadow>
              <cylinderGeometry args={[0.02, 0.02, 0.2]} />
              <meshStandardMaterial color="#c0c0c0" roughness={0.15} metalness={0.9} />
            </mesh>
          ))}
          {/* Interior shelves visible through glass */}
          {[-0.8, -0.2, 0.4, 1.0].map((y, shelfIdx) => (
            <mesh key={`shelf-${shelfIdx}`} position={[0, y, 0]} castShadow>
              <boxGeometry args={[0.55, 0.03, 1.9]} />
              <meshStandardMaterial color="#e0e0e0" roughness={0.4} />
            </mesh>
          ))}
        </group>
      ))}

      {/* Side Cabinets - Right wall (Wood finish) */}
      {[-8, 0, 8].map((z, i) => (
        <group key={i} position={[12, 1.5, z]}>
          {/* Cabinet body */}
          <mesh castShadow receiveShadow>
            <boxGeometry args={[0.6, 3, 2.5]} />
            <meshStandardMaterial 
              color="#c89968" 
              roughness={0.4} 
              metalness={0.05}
              map={woodTexture}
            />
          </mesh>
          {/* Cabinet doors (Wood) */}
          <mesh position={[-0.31, 0, 0]} castShadow>
            <boxGeometry args={[0.05, 2.9, 2.4]} />
            <meshStandardMaterial 
              color="#b88a5c" 
              roughness={0.3} 
              metalness={0.05}
              map={woodTexture}
            />
          </mesh>
          {/* Door handles (brass) */}
          {[-0.6, 0.6].map((y, j) => (
            <mesh key={j} position={[-0.33, y, 1]} rotation={[0, 0, Math.PI / 2]} castShadow>
              <cylinderGeometry args={[0.025, 0.025, 0.15]} />
              <meshStandardMaterial color="#daa520" roughness={0.2} metalness={0.8} />
            </mesh>
          ))}
          {/* Interior shelves */}
          {[-0.8, -0.2, 0.4, 1.0].map((y, shelfIdx) => (
            <mesh key={`shelf-${shelfIdx}`} position={[0, y, 0]} castShadow>
              <boxGeometry args={[0.55, 0.03, 2.4]} />
              <meshStandardMaterial color="#b88a5c" roughness={0.4} map={woodTexture} />
            </mesh>
          ))}
        </group>
      ))}

      {/* Additional Work Tables */}
      {[
        [-8, 0.6, 3], [8, 0.6, 3], [-8, 0.6, 8], [8, 0.6, 8]
      ].map((pos, i) => (
        <group key={i} position={pos as [number, number, number]}>
          {/* Table surface */}
          <mesh castShadow receiveShadow>
            <boxGeometry args={[3, 0.15, 2]} />
            <meshStandardMaterial 
              color="#ffffff" 
              roughness={0.15} 
              metalness={0.1}
            />
          </mesh>
          {/* Table legs */}
          {[
            [-1.4, -0.4, -0.9],
            [1.4, -0.4, -0.9],
            [-1.4, -0.4, 0.9],
            [1.4, -0.4, 0.9],
          ].map((legPos, j) => (
            <mesh key={j} position={legPos as [number, number, number]} castShadow>
              <cylinderGeometry args={[0.08, 0.08, 0.8]} />
              <meshStandardMaterial color="#c0c0c0" roughness={0.3} metalness={0.9} />
            </mesh>
          ))}
          {/* Under-table shelf */}
          <mesh position={[0, -0.4, 0]} castShadow>
            <boxGeometry args={[2.8, 0.05, 1.8]} />
            <meshStandardMaterial color="#e0e0e0" roughness={0.4} />
          </mesh>
        </group>
      ))}

      {/* Professional Analytical Balance */}
      <InteractiveInstrument
        position={[-6, 1.3, 3]}
        name="Balance analytique de précision"
        description="Balance de haute précision pour pesées micrométriques"
        onParameterChange={(params) => setBalanceParams({ ...balanceParams, ...params })}
        discipline={discipline}
        parameters={{
          weight: {
            min: 0,
            max: 220,
            value: balanceParams.weight,
            label: "Poids",
            unit: "g",
          },
          tare: {
            min: -50,
            max: 50,
            value: balanceParams.tare,
            label: "Tare",
            unit: "g",
          },
        }}
        showData={true}
        dataValue={balanceData}
        dataUnit="g"
      >
        {/* Balance base */}
        <mesh castShadow>
          <boxGeometry args={[0.3, 0.08, 0.3]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.2} metalness={0.3} />
        </mesh>
        {/* Wind shield */}
        <mesh position={[0, 0.15, 0]} castShadow>
          <boxGeometry args={[0.25, 0.25, 0.25]} />
          <meshStandardMaterial 
            color="#e0f0ff" 
            roughness={0.05} 
            transparent
            opacity={0.8}
          />
        </mesh>
        {/* Weighing pan */}
        <mesh position={[0, 0.1, 0]} castShadow>
          <cylinderGeometry args={[0.08, 0.08, 0.01]} />
          <meshStandardMaterial color="#c0c0c0" roughness={0.1} metalness={0.95} />
        </mesh>
        {/* Digital display */}
        <mesh position={[0, 0.05, -0.13]} castShadow>
          <boxGeometry args={[0.18, 0.05, 0.02]} />
          <meshStandardMaterial 
            color="#00ff00" 
            emissive="#00ff00"
            emissiveIntensity={0.7}
            roughness={0.1}
          />
        </mesh>
      </InteractiveInstrument>

      {/* pH Meter */}
      <InteractiveInstrument
        position={[-6, 1.35, 4.5]}
        name="pH-mètre professionnel"
        description="Mesure précise du pH avec compensation de température"
        onParameterChange={(params) => setPhMeterParams({ ...phMeterParams, ...params })}
        discipline={discipline}
        parameters={{
          ph: {
            min: 0,
            max: 14,
            value: phMeterParams.ph,
            label: "pH",
            unit: "",
          },
          temperature: {
            min: 0,
            max: 100,
            value: phMeterParams.temperature,
            label: "Température",
            unit: "°C",
          },
        }}
        showData={true}
        dataValue={phMeterData}
        dataUnit="pH"
      >
        {/* pH Meter base */}
        <mesh castShadow>
          <boxGeometry args={[0.25, 0.15, 0.35]} />
          <meshStandardMaterial color="#ffffff" roughness={0.2} />
        </mesh>
        {/* Display */}
        <mesh position={[0, 0.1, 0.1]} rotation={[-Math.PI / 6, 0, 0]} castShadow>
          <boxGeometry args={[0.2, 0.12, 0.02]} />
          <meshStandardMaterial 
            color="#00ff00" 
            emissive="#00ff00"
            emissiveIntensity={0.6}
            roughness={0.1}
          />
        </mesh>
        {/* Electrode holder */}
        <mesh position={[0.15, 0.15, -0.1]} castShadow>
          <cylinderGeometry args={[0.02, 0.02, 0.3]} />
          <meshStandardMaterial color="#c0c0c0" roughness={0.2} metalness={0.8} />
        </mesh>
        {/* pH Electrode */}
        <mesh position={[0.15, 0.05, -0.1]} castShadow>
          <cylinderGeometry args={[0.015, 0.015, 0.2]} />
          <meshStandardMaterial 
            color="#ffffff" 
            roughness={0.05}
            transparent
            opacity={0.9}
          />
        </mesh>
      </InteractiveInstrument>

      {/* Spectrophotometer */}
      <InteractiveInstrument
        position={[6, 1.45, 3]}
        name="Spectrophotomètre UV-Vis"
        description="Analyse spectrale pour quantification moléculaire"
        onParameterChange={(params) => setSpectroParams({ ...spectroParams, ...params })}
        discipline={discipline}
        parameters={{
          wavelength: {
            min: 200,
            max: 800,
            value: spectroParams.wavelength,
            label: "Longueur d'onde",
            unit: "nm",
          },
          absorbance: {
            min: 0,
            max: 3,
            value: spectroParams.absorbance,
            label: "Absorbance",
            unit: "AU",
          },
        }}
        showData={true}
        dataValue={spectroData}
        dataUnit="AU"
      >
        {/* Spectrophotometer body */}
        <mesh castShadow>
          <boxGeometry args={[0.5, 0.35, 0.4]} />
          <meshStandardMaterial color="#e0e0e0" roughness={0.2} metalness={0.2} />
        </mesh>
        {/* Cover */}
        <mesh position={[0, 0.18, 0.1]} castShadow>
          <boxGeometry args={[0.48, 0.05, 0.2]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.3} />
        </mesh>
        {/* Display screen */}
        <mesh position={[-0.15, 0.18, -0.15]} rotation={[-Math.PI / 6, 0, 0]} castShadow>
          <boxGeometry args={[0.15, 0.1, 0.02]} />
          <meshStandardMaterial 
            color="#0066ff" 
            emissive="#0066ff"
            emissiveIntensity={0.5}
            roughness={0.1}
          />
        </mesh>
        {/* Sample compartment */}
        <mesh position={[0.1, 0.18, 0]} castShadow>
          <boxGeometry args={[0.15, 0.06, 0.15]} />
          <meshStandardMaterial 
            color="#1a1a1a" 
            roughness={0.1}
          />
        </mesh>
        {/* Light source indicator */}
        <mesh position={[-0.2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.02, 0.02, 0.03]} />
          <meshStandardMaterial 
            color="#ffff00" 
            emissive="#ffff00"
            emissiveIntensity={0.8}
            roughness={0.1}
          />
        </mesh>
      </InteractiveInstrument>

      {/* Vortex Mixer */}
      <group position={[6, 1.3, 5]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.15, 0.2, 0.2]} />
          <meshStandardMaterial color="#3b82f6" roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.12, 0]} castShadow>
          <cylinderGeometry args={[0.04, 0.04, 0.05]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.2} metalness={0.8} />
        </mesh>
        <mesh position={[0.08, -0.05, 0]} castShadow>
          <boxGeometry args={[0.06, 0.04, 0.03]} />
          <meshStandardMaterial color="#ffffff" roughness={0.2} />
        </mesh>
      </group>

      {/* Water Bath */}
      <group position={[8, 1.35, 6]}>
        <mesh castShadow>
          <boxGeometry args={[0.6, 0.25, 0.4]} />
          <meshStandardMaterial color="#ffffff" roughness={0.2} />
        </mesh>
        {/* Water chamber */}
        <mesh position={[0, 0.05, 0]} castShadow>
          <boxGeometry args={[0.55, 0.15, 0.35]} />
          <meshStandardMaterial 
            color="#3b82f6" 
            roughness={0.1}
            transparent
            opacity={0.7}
          />
        </mesh>
        {/* Control panel */}
        <mesh position={[0, 0.13, -0.18]} castShadow>
          <boxGeometry args={[0.2, 0.08, 0.03]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.3} />
        </mesh>
        {/* Temperature display */}
        <mesh position={[0, 0.13, -0.16]} castShadow>
          <boxGeometry args={[0.1, 0.04, 0.01]} />
          <meshStandardMaterial 
            color="#ff0000" 
            emissive="#ff0000"
            emissiveIntensity={0.6}
            roughness={0.1}
          />
        </mesh>
      </group>

      {/* Magnetic Stirrer */}
      <group position={[8, 1.3, 7]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.15, 0.15, 0.08]} />
          <meshStandardMaterial color="#ffffff" roughness={0.2} />
        </mesh>
        {/* Heating plate */}
        <mesh position={[0, 0.05, 0]} castShadow>
          <cylinderGeometry args={[0.12, 0.12, 0.02]} />
          <meshStandardMaterial color="#c0c0c0" roughness={0.1} metalness={0.9} />
        </mesh>
        {/* Control knobs */}
        {[-0.06, 0.06].map((x, i) => (
          <mesh key={i} position={[x, -0.02, 0]} castShadow>
            <cylinderGeometry args={[0.02, 0.02, 0.03]} />
            <meshStandardMaterial color="#1a1a1a" roughness={0.3} metalness={0.5} />
          </mesh>
        ))}
      </group>

      {/* Pipette Stand with Micropipettes */}
      <group position={[-8, 1.3, 4]}>
        {/* Stand base */}
        <mesh castShadow>
          <cylinderGeometry args={[0.1, 0.1, 0.05]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.3} />
        </mesh>
        {/* Stand post */}
        <mesh position={[0, 0.2, 0]} castShadow>
          <cylinderGeometry args={[0.015, 0.015, 0.4]} />
          <meshStandardMaterial color="#c0c0c0" roughness={0.2} metalness={0.8} />
        </mesh>
        {/* Pipettes */}
        {[0, 1, 2, 3, 4].map((i) => (
          <mesh key={i} position={[0, 0.35 - i * 0.05, 0]} castShadow>
            <cylinderGeometry args={[0.008, 0.008, 0.25]} />
            <meshStandardMaterial 
              color={i === 0 ? "#ff0000" : i === 1 ? "#0066ff" : i === 2 ? "#10b981" : i === 3 ? "#f59e0b" : "#8b5cf6"} 
              roughness={0.3}
              metalness={0.2}
            />
          </mesh>
        ))}
      </group>

      {/* Pipette Tip Boxes */}
      {[-8, -7.5].map((x, i) => (
        <group key={i} position={[x, 1.3, 5]}>
          <mesh castShadow>
            <boxGeometry args={[0.25, 0.12, 0.15]} />
            <meshStandardMaterial 
              color="#ffffff" 
              roughness={0.1}
              transparent
              opacity={0.9}
            />
          </mesh>
          {/* Tips inside */}
          {Array.from({ length: 8 }).map((_, j) => (
            <mesh key={j} position={[
              -0.08 + (j % 4) * 0.05,
              0.06,
              -0.04 + Math.floor(j / 4) * 0.05
            ]} castShadow>
              <cylinderGeometry args={[0.004, 0.001, 0.08]} />
              <meshStandardMaterial color={i === 0 ? "#ffff00" : "#0066ff"} roughness={0.2} />
            </mesh>
          ))}
        </group>
      ))}

      {/* Glove Box */}
      <group position={[-8, 1.45, 7]}>
        <mesh castShadow>
          <boxGeometry args={[0.8, 0.5, 0.6]} />
          <meshStandardMaterial 
            color="#e0f0ff" 
            roughness={0.05}
            transparent
            opacity={0.85}
          />
        </mesh>
        {/* Glove ports */}
        {[-0.25, 0.25].map((x, i) => (
          <mesh key={i} position={[x, 0, 0.3]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.08, 0.06, 0.05]} />
            <meshStandardMaterial color="#c0c0c0" roughness={0.3} metalness={0.6} />
          </mesh>
        ))}
      </group>

      {/* Whiteboard */}
      <group position={[0, 3, -11.9]}>
        <mesh castShadow>
          <boxGeometry args={[4, 2, 0.05]} />
          <meshStandardMaterial color="#ffffff" roughness={0.05} metalness={0.1} />
        </mesh>
        {/* Frame */}
        <mesh position={[0, 0, -0.04]} castShadow>
          <boxGeometry args={[4.1, 2.1, 0.02]} />
          <meshStandardMaterial color="#c0c0c0" roughness={0.3} metalness={0.7} />
        </mesh>
      </group>

      {/* Safety Shower */}
      <group position={[-11, 3, 8]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.05, 0.05, 0.4]} />
          <meshStandardMaterial color="#c0c0c0" roughness={0.2} metalness={0.8} />
        </mesh>
        <mesh position={[0, 0.25, 0]} castShadow>
          <boxGeometry args={[0.25, 0.1, 0.25]} />
          <meshStandardMaterial color="#ffff00" roughness={0.3} />
        </mesh>
        <mesh position={[0, -0.3, 0]} castShadow>
          <cylinderGeometry args={[0.15, 0.15, 0.05]} />
          <meshStandardMaterial color="#c0c0c0" roughness={0.2} metalness={0.8} />
        </mesh>
      </group>

      {/* Fire Extinguisher */}
      <group position={[11, 1, 8]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.12, 0.12, 0.6]} />
          <meshStandardMaterial color="#ff0000" roughness={0.4} metalness={0.3} />
        </mesh>
        <mesh position={[0, 0.35, 0]} castShadow>
          <cylinderGeometry args={[0.03, 0.03, 0.2]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.3} metalness={0.6} />
        </mesh>
        <mesh position={[0, 0.4, 0.08]} rotation={[Math.PI / 4, 0, 0]} castShadow>
          <cylinderGeometry args={[0.02, 0.02, 0.15]} />
          <meshStandardMaterial color="#c0c0c0" roughness={0.2} metalness={0.8} />
        </mesh>
      </group>

      {/* Ceiling Lights - Fluorescent panels */}
      {[
        [-6, 5.8, -4], [0, 5.8, -4], [6, 5.8, -4],
        [-6, 5.8, 2], [0, 5.8, 2], [6, 5.8, 2],
        [-6, 5.8, 8], [0, 5.8, 8], [6, 5.8, 8]
      ].map((pos, i) => (
        <mesh key={i} position={pos as [number, number, number]} castShadow>
          <boxGeometry args={[2, 0.1, 1]} />
          <meshStandardMaterial 
            color="#ffffff" 
            emissive="#ffffff"
            emissiveIntensity={0.4}
            roughness={0.1}
          />
        </mesh>
      ))}

      {/* Electrical Outlets on walls */}
      {[
        [-12.3, 0.5, -6], [-12.3, 0.5, 0], [-12.3, 0.5, 6],
        [12.3, 0.5, -6], [12.3, 0.5, 0], [12.3, 0.5, 6]
      ].map((pos, i) => (
        <mesh key={i} position={pos as [number, number, number]} rotation={[0, i < 3 ? Math.PI / 2 : -Math.PI / 2, 0]} castShadow>
          <boxGeometry args={[0.1, 0.15, 0.02]} />
          <meshStandardMaterial color="#f0f0f0" roughness={0.3} />
        </mesh>
      ))}

      {/* Additional Scientific Equipment - Gel Electrophoresis System */}
      <group position={[-3, 1.3, 3]}>
        {/* Main unit body */}
        <mesh castShadow>
          <boxGeometry args={[0.5, 0.2, 0.35]} />
          <meshStandardMaterial color="#2a2a2a" roughness={0.3} metalness={0.3} />
        </mesh>
        {/* Gel tray */}
        <mesh position={[0, 0.12, 0]} castShadow>
          <boxGeometry args={[0.35, 0.03, 0.25]} />
          <meshStandardMaterial color="#ffffff" transparent opacity={0.7} roughness={0.1} />
        </mesh>
        {/* Electrodes */}
        {[-0.15, 0.15].map((x, i) => (
          <mesh key={i} position={[x, 0.13, 0]} castShadow>
            <boxGeometry args={[0.03, 0.04, 0.2]} />
            <meshStandardMaterial color="#c0c0c0" roughness={0.2} metalness={0.9} />
          </mesh>
        ))}
        {/* Control panel */}
        <mesh position={[0, 0.12, -0.15]} castShadow>
          <boxGeometry args={[0.15, 0.06, 0.04]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.2} />
        </mesh>
        {/* LED display */}
        <mesh position={[0, 0.12, -0.13]} castShadow>
          <boxGeometry args={[0.08, 0.03, 0.01]} />
          <meshStandardMaterial 
            color="#ff0000" 
            emissive="#ff0000"
            emissiveIntensity={0.6}
            roughness={0.1}
          />
        </mesh>
    </group>

      {/* PCR Thermocycler */}
      <group position={[-1, 1.4, 3]}>
        <mesh castShadow>
          <boxGeometry args={[0.45, 0.35, 0.4]} />
          <meshStandardMaterial color="#e0e0e0" roughness={0.2} metalness={0.2} />
        </mesh>
        {/* Heated lid */}
        <mesh position={[0, 0.18, 0]} castShadow>
          <boxGeometry args={[0.43, 0.05, 0.38]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.3} />
        </mesh>
        {/* Touch screen */}
        <mesh position={[0, 0.18, -0.18]} rotation={[-Math.PI / 8, 0, 0]} castShadow>
          <boxGeometry args={[0.25, 0.18, 0.03]} />
          <meshStandardMaterial 
            color="#0066ff" 
            emissive="#0066ff"
            emissiveIntensity={0.4}
            roughness={0.05}
          />
        </mesh>
        {/* Sample block indicator */}
        <mesh position={[0, 0.1, 0.1]} castShadow>
          <cylinderGeometry args={[0.15, 0.15, 0.08]} />
          <meshStandardMaterial color="#c0c0c0" roughness={0.1} metalness={0.95} />
        </mesh>
      </group>

      {/* Laboratory Notebook and Writing Materials */}
      <group position={[0, 1.25, -3]}>
        {/* Notebook */}
        <mesh castShadow>
          <boxGeometry args={[0.25, 0.03, 0.35]} />
          <meshStandardMaterial color="#2a4a7a" roughness={0.7} />
        </mesh>
        {/* Pen */}
        <mesh position={[0.15, 0.02, 0]} rotation={[0, 0, Math.PI / 4]} castShadow>
          <cylinderGeometry args={[0.005, 0.005, 0.15]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.3} metalness={0.5} />
        </mesh>
      </group>

      {/* Beakers with colored solutions on main bench */}
      {[
        [-2.5, 1.25, -3.5, "#3b82f6"], 
        [-2, 1.25, -3.5, "#10b981"], 
        [-1.5, 1.25, -3.5, "#f59e0b"]
      ].map(([x, y, z, color], i) => (
        <group key={i} position={[x, y, z] as [number, number, number]}>
          {/* Beaker glass */}
          <mesh castShadow>
            <cylinderGeometry args={[0.08, 0.08, 0.2]} />
            <meshStandardMaterial 
              color="#ffffff" 
              transparent 
              opacity={0.3}
              roughness={0.05}
            />
          </mesh>
          {/* Solution */}
          <mesh position={[0, -0.04, 0]} castShadow>
            <cylinderGeometry args={[0.075, 0.075, 0.12]} />
            <meshStandardMaterial 
              color={color as string} 
              transparent 
              opacity={0.7}
              roughness={0.2}
            />
          </mesh>
          {/* Graduation marks */}
          {[0.05, 0, -0.05].map((markY, j) => (
            <mesh key={j} position={[0.08, markY, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
              <boxGeometry args={[0.015, 0.001, 0.001]} />
              <meshStandardMaterial color="#000000" />
            </mesh>
          ))}
        </group>
      ))}

      {/* Erlenmeyer Flasks */}
      {[
        [1.5, 1.25, -3.5, "#e91e63"], 
        [2, 1.25, -3.5, "#9c27b0"]
      ].map(([x, y, z, color], i) => (
        <group key={i} position={[x, y, z] as [number, number, number]}>
          {/* Flask body (conical) */}
          <mesh castShadow>
            <cylinderGeometry args={[0.05, 0.12, 0.25, 32]} />
            <meshStandardMaterial 
              color="#ffffff" 
              transparent 
              opacity={0.3}
              roughness={0.05}
            />
          </mesh>
          {/* Flask neck */}
          <mesh position={[0, 0.15, 0]} castShadow>
            <cylinderGeometry args={[0.02, 0.02, 0.05]} />
            <meshStandardMaterial 
              color="#ffffff" 
              transparent 
              opacity={0.3}
              roughness={0.05}
            />
          </mesh>
          {/* Solution */}
          <mesh position={[0, -0.06, 0]} castShadow>
            <cylinderGeometry args={[0.04, 0.11, 0.15, 32]} />
            <meshStandardMaterial 
              color={color as string} 
              transparent 
              opacity={0.7}
              roughness={0.2}
            />
          </mesh>
        </group>
      ))}

      {/* Graduated Cylinders */}
      {[
        [2.5, 1.25, -3.5, 0.25, "#00bcd4"], 
        [3, 1.25, -3.5, 0.2, "#cddc39"]
      ].map(([x, y, z, height, color], i) => (
        <group key={i} position={[x, y, z] as [number, number, number]}>
          {/* Cylinder glass */}
          <mesh castShadow>
            <cylinderGeometry args={[0.04, 0.04, height as number]} />
            <meshStandardMaterial 
              color="#ffffff" 
              transparent 
              opacity={0.3}
              roughness={0.05}
            />
          </mesh>
          {/* Solution */}
          <mesh position={[0, -(height as number) * 0.25, 0]} castShadow>
            <cylinderGeometry args={[0.038, 0.038, (height as number) * 0.5]} />
            <meshStandardMaterial 
              color={color as string} 
              transparent 
              opacity={0.7}
              roughness={0.2}
            />
          </mesh>
          {/* Base */}
          <mesh position={[0, -(height as number) / 2 - 0.02, 0]} castShadow>
            <cylinderGeometry args={[0.06, 0.06, 0.02]} />
            <meshStandardMaterial color="#ffffff" transparent opacity={0.5} roughness={0.1} />
          </mesh>
        </group>
      ))}

      {/* Bunsen Burner */}
      <group position={[3.5, 1.25, -3.5]}>
        {/* Base */}
        <mesh castShadow>
          <cylinderGeometry args={[0.08, 0.08, 0.02]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.3} metalness={0.7} />
        </mesh>
        {/* Body tube */}
        <mesh position={[0, 0.08, 0]} castShadow>
          <cylinderGeometry args={[0.025, 0.025, 0.15]} />
          <meshStandardMaterial color="#c0c0c0" roughness={0.2} metalness={0.9} />
        </mesh>
        {/* Burner top */}
        <mesh position={[0, 0.16, 0]} castShadow>
          <cylinderGeometry args={[0.035, 0.035, 0.02]} />
          <meshStandardMaterial color="#4a4a4a" roughness={0.4} metalness={0.6} />
        </mesh>
        {/* Air control collar */}
        <mesh position={[0, 0.05, 0]} castShadow>
          <cylinderGeometry args={[0.03, 0.03, 0.015]} />
          <meshStandardMaterial color="#daa520" roughness={0.2} metalness={0.8} />
        </mesh>
      </group>

      {/* Microscope Slides Box */}
      <group position={[-3.5, 1.22, -3.5]}>
        <mesh castShadow>
          <boxGeometry args={[0.15, 0.05, 0.2]} />
          <meshStandardMaterial color="#4a90e2" roughness={0.4} />
        </mesh>
        {/* Label */}
        <mesh position={[0, 0.026, 0.1]} castShadow>
          <boxGeometry args={[0.12, 0.001, 0.04]} />
          <meshStandardMaterial color="#ffffff" roughness={0.2} />
        </mesh>
      </group>

      {/* Laboratory Timer */}
      <group position={[4, 1.26, -3.5]}>
        <mesh castShadow>
          <boxGeometry args={[0.12, 0.12, 0.08]} />
          <meshStandardMaterial color="#ffffff" roughness={0.3} />
        </mesh>
        {/* Display */}
        <mesh position={[0, 0, 0.041]} castShadow>
          <boxGeometry args={[0.08, 0.04, 0.001]} />
          <meshStandardMaterial 
            color="#000000" 
            emissive="#00ff00"
            emissiveIntensity={0.3}
            roughness={0.1}
          />
        </mesh>
        {/* Buttons */}
        {[-0.03, 0, 0.03].map((x, i) => (
          <mesh key={i} position={[x, -0.04, 0.041]} castShadow>
            <cylinderGeometry args={[0.01, 0.01, 0.005]} />
            <meshStandardMaterial color="#4a4a4a" roughness={0.3} />
          </mesh>
        ))}
      </group>

      {/* Lab Safety Goggles */}
      {[[-4, 1.23, -3.2], [4.5, 1.23, -3.2]].map((pos, i) => (
        <group key={i} position={pos as [number, number, number]}>
          <mesh castShadow>
            <boxGeometry args={[0.15, 0.06, 0.08]} />
            <meshStandardMaterial 
              color="#e0f0ff" 
              transparent 
              opacity={0.6}
              roughness={0.1}
            />
          </mesh>
          {/* Strap */}
          <mesh position={[0, 0, -0.05]} rotation={[0, Math.PI / 2, 0]} castShadow>
            <cylinderGeometry args={[0.005, 0.005, 0.15]} />
            <meshStandardMaterial color="#1a1a1a" roughness={0.5} />
          </mesh>
        </group>
      ))}

      {/* Chemical Bottle Rack on side tables */}
      {[[-8, 1.3, 3.5], [8, 1.3, 3.5]].map((pos, rackIdx) => (
        <group key={rackIdx} position={pos as [number, number, number]}>
          {/* Rack base */}
          <mesh castShadow>
            <boxGeometry args={[0.8, 0.05, 0.3]} />
            <meshStandardMaterial color="#2a2a2a" roughness={0.4} />
          </mesh>
          {/* Chemical bottles */}
          {[-0.25, -0.08, 0.08, 0.25].map((x, i) => (
            <group key={i} position={[x, 0.08, 0]}>
              <mesh castShadow>
                <cylinderGeometry args={[0.035, 0.035, 0.12]} />
                <meshStandardMaterial 
                  color={["#8b4513", "#4a4a4a", "#ffffff", "#daa520"][i]} 
                  transparent 
                  opacity={0.6}
                  roughness={0.2}
                />
              </mesh>
              {/* Cap */}
              <mesh position={[0, 0.065, 0]} castShadow>
                <cylinderGeometry args={[0.04, 0.04, 0.02]} />
                <meshStandardMaterial color="#1a1a1a" roughness={0.4} />
              </mesh>
              {/* Label */}
              <mesh position={[0, 0, 0.036]} castShadow>
                <boxGeometry args={[0.06, 0.08, 0.001]} />
                <meshStandardMaterial color="#ffffff" roughness={0.3} />
              </mesh>
            </group>
          ))}
        </group>
      ))}

      {/* Computer Workstations with Monitors */}
      {[[-8, 1.3, 8.5], [8, 1.3, 8.5]].map((pos, i) => (
        <group key={i} position={pos as [number, number, number]}>
          {/* Monitor stand */}
          <mesh castShadow>
            <boxGeometry args={[0.15, 0.05, 0.15]} />
            <meshStandardMaterial color="#1a1a1a" roughness={0.3} metalness={0.5} />
          </mesh>
          {/* Monitor arm */}
          <mesh position={[0, 0.15, 0]} castShadow>
            <cylinderGeometry args={[0.02, 0.02, 0.25]} />
            <meshStandardMaterial color="#2a2a2a" roughness={0.3} metalness={0.7} />
          </mesh>
          {/* Monitor screen */}
          <mesh position={[0, 0.3, -0.05]} rotation={[-Math.PI / 12, 0, 0]} castShadow>
            <boxGeometry args={[0.5, 0.3, 0.03]} />
            <meshStandardMaterial color="#1a1a1a" roughness={0.2} metalness={0.3} />
          </mesh>
          {/* Screen display */}
          <mesh position={[0, 0.3, -0.035]} rotation={[-Math.PI / 12, 0, 0]} castShadow>
            <boxGeometry args={[0.48, 0.28, 0.001]} />
            <meshStandardMaterial 
              color="#2196f3" 
              emissive="#2196f3"
              emissiveIntensity={0.5}
              roughness={0.05}
            />
          </mesh>
          {/* Keyboard */}
          <mesh position={[0, 0.03, 0.2]} castShadow>
            <boxGeometry args={[0.4, 0.02, 0.15]} />
            <meshStandardMaterial color="#1a1a1a" roughness={0.4} />
          </mesh>
          {/* Mouse */}
          <mesh position={[0.25, 0.03, 0.2]} castShadow>
            <boxGeometry args={[0.06, 0.025, 0.1]} />
            <meshStandardMaterial color="#2a2a2a" roughness={0.3} />
          </mesh>
        </group>
      ))}

      {/* Laboratory Plants (for better ambiance) */}
      {[
        [-10, 1.3, -10], [10, 1.3, -10], [-6, 0.05, 10], [6, 0.05, 10]
      ].map((pos, i) => (
        <group key={i} position={pos as [number, number, number]}>
          {/* Pot */}
          <mesh castShadow>
            <cylinderGeometry args={[0.15, 0.12, 0.2]} />
            <meshStandardMaterial color="#8b4513" roughness={0.8} />
          </mesh>
          {/* Soil */}
          <mesh position={[0, 0.08, 0]} castShadow>
            <cylinderGeometry args={[0.14, 0.14, 0.05]} />
            <meshStandardMaterial color="#4a3520" roughness={0.9} />
          </mesh>
          {/* Plant stem */}
          <mesh position={[0, 0.25, 0]} castShadow>
            <cylinderGeometry args={[0.01, 0.015, 0.3]} />
            <meshStandardMaterial color="#2d5016" roughness={0.7} />
          </mesh>
          {/* Leaves */}
          {[0, 1, 2, 3, 4].map((leafIdx) => {
            const angle = (leafIdx * Math.PI * 2) / 5
            const height = 0.15 + leafIdx * 0.08
            return (
              <mesh 
                key={leafIdx} 
                position={[
                  Math.cos(angle) * 0.08, 
                  height, 
                  Math.sin(angle) * 0.08
                ]}
                rotation={[Math.PI / 3, angle, 0]}
                castShadow
              >
                <boxGeometry args={[0.12, 0.02, 0.08]} />
                <meshStandardMaterial color="#4caf50" roughness={0.6} />
              </mesh>
            )
          })}
        </group>
      ))}

      {/* Safety Posters and Signs on Walls */}
      {[
        [-11.9, 3, -8, Math.PI / 2, "Biohazard", "#ff0000"],
        [-11.9, 3, -4, Math.PI / 2, "Safety First", "#ffeb3b"],
        [-11.9, 3, 0, Math.PI / 2, "Lab Rules", "#2196f3"],
        [11.9, 3, -8, -Math.PI / 2, "Emergency Exit", "#4caf50"],
        [11.9, 3, -4, -Math.PI / 2, "First Aid", "#ffffff"],
      ].map(([x, y, z, rotation, label, color], i) => (
        <group key={i} position={[x, y, z] as [number, number, number]} rotation={[0, rotation as number, 0]}>
          {/* Poster frame */}
          <mesh castShadow>
            <boxGeometry args={[0.05, 0.8, 0.6]} />
            <meshStandardMaterial color="#1a1a1a" roughness={0.3} />
          </mesh>
          {/* Poster content */}
          <mesh position={[0.026, 0, 0]} castShadow>
            <boxGeometry args={[0.001, 0.75, 0.55]} />
            <meshStandardMaterial color={color as string} roughness={0.4} />
          </mesh>
        </group>
      ))}

      {/* Periodic Table Poster on back wall */}
      <group position={[4, 3, -11.9]}>
        <mesh castShadow>
          <boxGeometry args={[2.5, 1.5, 0.05]} />
          <meshStandardMaterial color="#ffffff" roughness={0.2} />
        </mesh>
        {/* Periodic table grid simulation (simplified) */}
        {Array.from({ length: 8 }).map((_, row) => 
          Array.from({ length: 18 }).map((_, col) => {
            if (Math.random() > 0.3) { // Not all cells filled
              return (
                <mesh 
                  key={`${row}-${col}`}
                  position={[
                    -1.15 + col * 0.13,
                    0.65 - row * 0.18,
                    0.03
                  ]}
                  castShadow
                >
                  <boxGeometry args={[0.11, 0.15, 0.001]} />
                  <meshStandardMaterial 
                    color={
                      col < 2 ? "#ffcdd2" : // Alkali/Alkaline
                      col >= 2 && col < 12 ? "#b3e5fc" : // Transition metals
                      col >= 12 && col < 16 ? "#c8e6c9" : // Post-transition
                      col >= 16 ? "#fff9c4" : "#e1bee7" // Nonmetals/Noble gases
                    }
                    roughness={0.3}
                  />
                </mesh>
              )
            }
            return null
          })
        )}
      </group>

      {/* Laboratory Clock */}
      <group position={[-4, 4.5, -11.9]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.25, 0.25, 0.05]} />
          <meshStandardMaterial color="#ffffff" roughness={0.2} />
        </mesh>
        {/* Clock face */}
        <mesh position={[0, 0, 0.03]} castShadow>
          <cylinderGeometry args={[0.23, 0.23, 0.001]} />
          <meshStandardMaterial color="#f5f5f5" roughness={0.1} />
        </mesh>
        {/* Hour markers */}
        {Array.from({ length: 12 }).map((_, i) => {
          const angle = (i * Math.PI * 2) / 12 - Math.PI / 2
          return (
            <mesh 
              key={i}
              position={[
                Math.cos(angle) * 0.18,
                Math.sin(angle) * 0.18,
                0.035
              ]}
              castShadow
            >
              <cylinderGeometry args={[0.01, 0.01, 0.005]} />
              <meshStandardMaterial color="#1a1a1a" roughness={0.3} />
            </mesh>
          )
        })}
        {/* Hour hand */}
        <mesh position={[0.05, 0.05, 0.04]} rotation={[0, 0, -Math.PI / 6]} castShadow>
          <boxGeometry args={[0.12, 0.015, 0.003]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.2} />
        </mesh>
        {/* Minute hand */}
        <mesh position={[0.02, 0.08, 0.04]} rotation={[0, 0, -Math.PI / 3]} castShadow>
          <boxGeometry args={[0.18, 0.01, 0.003]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.2} />
        </mesh>
      </group>

      {/* Air Vents / HVAC System */}
      {[
        [-8, 5.8, -8], [-4, 5.8, -8], [4, 5.8, -8], [8, 5.8, -8],
        [-8, 5.8, 4], [8, 5.8, 4]
      ].map((pos, i) => (
        <group key={i} position={pos as [number, number, number]}>
          <mesh castShadow>
            <boxGeometry args={[0.8, 0.1, 0.6]} />
            <meshStandardMaterial color="#e0e0e0" roughness={0.3} metalness={0.4} />
          </mesh>
          {/* Vent slats */}
          {Array.from({ length: 8 }).map((_, slat) => (
            <mesh 
              key={slat}
              position={[0, 0, -0.25 + slat * 0.07]}
              castShadow
            >
              <boxGeometry args={[0.75, 0.005, 0.05]} />
              <meshStandardMaterial color="#c0c0c0" roughness={0.2} metalness={0.7} />
            </mesh>
          ))}
        </group>
      ))}

      {/* Floor Safety Markings (Yellow hazard stripes) */}
      {[
        [-5.5, 0.01, -2], [5.5, 0.01, -2], [-11, 0.01, 8], [11, 0.01, 8]
      ].map((pos, i) => (
        <mesh key={i} position={pos as [number, number, number]} rotation={[-Math.PI / 2, 0, i % 2 === 0 ? 0 : Math.PI / 2]} receiveShadow>
          <planeGeometry args={[0.3, 2]} />
          <meshStandardMaterial color="#ffeb3b" roughness={0.7} />
        </mesh>
      ))}

      {/* Additional Lab Glassware on Shelves */}
      {[
        [-2, 4.15, -4], [-1, 4.15, -4], [1, 4.15, -4], [2, 4.15, -4]
      ].map((pos, i) => (
        <group key={i} position={pos as [number, number, number]}>
          {/* Volumetric Flask */}
          <mesh castShadow>
            <sphereGeometry args={[0.08, 16, 16]} />
            <meshStandardMaterial 
              color="#ffffff" 
              transparent 
              opacity={0.3}
              roughness={0.05}
            />
          </mesh>
          <mesh position={[0, 0.12, 0]} castShadow>
            <cylinderGeometry args={[0.015, 0.015, 0.08]} />
            <meshStandardMaterial 
              color="#ffffff" 
              transparent 
              opacity={0.3}
              roughness={0.05}
            />
          </mesh>
        </group>
      ))}

      {/* Stir Bars in Storage */}
      <group position={[-8, 1.28, 5.5]}>
        <mesh castShadow>
          <boxGeometry args={[0.2, 0.04, 0.15]} />
          <meshStandardMaterial 
            color="#ffffff" 
            transparent 
            opacity={0.8}
            roughness={0.1}
          />
        </mesh>
        {Array.from({ length: 6 }).map((_, i) => (
          <mesh 
            key={i}
            position={[
              -0.06 + (i % 3) * 0.06,
              0.025,
              -0.04 + Math.floor(i / 3) * 0.08
            ]}
            rotation={[0, Math.PI / 2, 0]}
            castShadow
          >
            <cylinderGeometry args={[0.005, 0.005, 0.04]} />
            <meshStandardMaterial color="#ffffff" roughness={0.1} metalness={0.95} />
          </mesh>
        ))}
      </group>

      {/* Lab Coat Hooks */}
      {[
        [-11.8, 2, -10], [-11.8, 2, -8], [-11.8, 2, -6]
      ].map((pos, i) => (
        <group key={i} position={pos as [number, number, number]}>
          {/* Hook */}
          <mesh castShadow>
            <cylinderGeometry args={[0.02, 0.02, 0.15]} />
            <meshStandardMaterial color="#c0c0c0" roughness={0.2} metalness={0.9} />
          </mesh>
          {/* Lab coat (if present) */}
          {i < 2 && (
            <mesh position={[0.1, -0.3, 0]} castShadow>
              <boxGeometry args={[0.2, 0.6, 0.4]} />
              <meshStandardMaterial color="#ffffff" roughness={0.6} />
            </mesh>
          )}
        </group>
      ))}

      {/* Desk Lamp on work tables */}
      {[[-8, 1.3, 3], [8, 1.3, 3]].map((pos, i) => (
        <group key={i} position={pos as [number, number, number]}>
          {/* Lamp base */}
          <mesh castShadow>
            <cylinderGeometry args={[0.08, 0.08, 0.03]} />
            <meshStandardMaterial color="#2a2a2a" roughness={0.4} metalness={0.3} />
          </mesh>
          {/* Lamp arm */}
          <mesh position={[0, 0.2, 0]} rotation={[0, 0, -Math.PI / 6]} castShadow>
            <cylinderGeometry args={[0.015, 0.015, 0.4]} />
            <meshStandardMaterial color="#2a2a2a" roughness={0.3} metalness={0.5} />
          </mesh>
          {/* Lamp head */}
          <mesh position={[0.17, 0.35, 0]} rotation={[0, 0, Math.PI / 3]} castShadow>
            <cylinderGeometry args={[0.08, 0.05, 0.12]} />
            <meshStandardMaterial color="#2a2a2a" roughness={0.4} />
          </mesh>
          {/* Light bulb (illuminated) */}
          <mesh position={[0.17, 0.35, 0]} castShadow>
            <sphereGeometry args={[0.04, 16, 16]} />
            <meshStandardMaterial 
              color="#ffffdd" 
              emissive="#ffffdd"
              emissiveIntensity={0.6}
              roughness={0.1}
            />
          </mesh>
        </group>
      ))}

      {/* Fume Hood (Hotte aspirante) - Essential for chemistry labs */}
      <group position={[0, 2, 10]}>
        {/* Hood body */}
        <mesh castShadow receiveShadow>
          <boxGeometry args={[3, 4, 1.2]} />
          <meshStandardMaterial color="#f0f0f0" roughness={0.3} metalness={0.1} map={cabinetTexture} />
        </mesh>
        {/* Hood interior (darker) */}
        <mesh position={[0, 0, -0.4]} castShadow>
          <boxGeometry args={[2.8, 3.8, 0.8]} />
          <meshStandardMaterial color="#4a4a4a" roughness={0.5} />
        </mesh>
        {/* Glass sash (adjustable window) */}
        <mesh position={[0, 0.5, 0.6]} castShadow>
          <boxGeometry args={[2.9, 2.5, 0.05]} />
          <meshStandardMaterial 
            color="#e0f0ff" 
            transparent 
            opacity={0.7}
            roughness={0.05}
          />
        </mesh>
        {/* Control panel */}
        <mesh position={[1.2, 1.8, 0.61]} castShadow>
          <boxGeometry args={[0.4, 0.3, 0.05]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.3} />
        </mesh>
        {/* LED indicators */}
        {[-0.1, 0, 0.1].map((y, i) => (
          <mesh key={i} position={[1.2, 1.8 + y, 0.64]} castShadow>
            <cylinderGeometry args={[0.015, 0.015, 0.01]} />
            <meshStandardMaterial 
              color={i === 0 ? "#ff0000" : i === 1 ? "#ffeb3b" : "#00ff00"} 
              emissive={i === 2 ? "#00ff00" : "#000000"}
              emissiveIntensity={i === 2 ? 0.8 : 0}
              roughness={0.2}
            />
          </mesh>
        ))}
        {/* Work surface inside */}
        <mesh position={[0, -1.8, -0.4]} castShadow>
          <boxGeometry args={[2.8, 0.1, 0.8]} />
          <meshStandardMaterial color="#ffffff" roughness={0.2} map={tableTexture} />
        </mesh>
        {/* Exhaust vent on top */}
        <mesh position={[0, 2.2, 0]} castShadow>
          <boxGeometry args={[1.5, 0.3, 1]} />
          <meshStandardMaterial color="#c0c0c0" roughness={0.3} metalness={0.6} />
        </mesh>
      </group>

      {/* Deep Freezer (-80°C) */}
      <group position={[-10, 1.2, 10]}>
        <mesh castShadow>
          <boxGeometry args={[1, 2.4, 0.8]} />
          <meshStandardMaterial color="#e0e0e0" roughness={0.2} metalness={0.1} />
        </mesh>
        {/* Freezer door */}
        <mesh position={[0, 0, 0.41]} castShadow>
          <boxGeometry args={[0.95, 2.35, 0.06]} />
          <meshStandardMaterial color="#d0d0d0" roughness={0.3} metalness={0.2} />
        </mesh>
        {/* Handle */}
        <mesh position={[0.4, 0.5, 0.44]} castShadow>
          <boxGeometry args={[0.08, 0.6, 0.04]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.3} metalness={0.7} />
        </mesh>
        {/* Temperature display */}
        <mesh position={[0, 1, 0.44]} castShadow>
          <boxGeometry args={[0.3, 0.12, 0.01]} />
          <meshStandardMaterial 
            color="#ff0000" 
            emissive="#ff0000"
            emissiveIntensity={0.5}
            roughness={0.1}
          />
        </mesh>
        {/* Warning label */}
        <mesh position={[0, -0.8, 0.44]} castShadow>
          <boxGeometry args={[0.4, 0.15, 0.001]} />
          <meshStandardMaterial color="#ffeb3b" roughness={0.3} />
        </mesh>
      </group>

      {/* Liquid Nitrogen Dewar */}
      <group position={[-10, 0.8, 8]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.35, 0.35, 1.6]} />
          <meshStandardMaterial color="#c0c0c0" roughness={0.15} metalness={0.95} />
        </mesh>
        {/* Lid */}
        <mesh position={[0, 0.85, 0]} castShadow>
          <cylinderGeometry args={[0.37, 0.37, 0.1]} />
          <meshStandardMaterial color="#a0a0a0" roughness={0.2} metalness={0.9} />
        </mesh>
        {/* Handle */}
        <mesh position={[0, 0.95, 0]} castShadow>
          <torusGeometry args={[0.15, 0.03, 8, 16]} />
          <meshStandardMaterial color="#808080" roughness={0.2} metalness={0.9} />
        </mesh>
        {/* Warning label */}
        <mesh position={[0, 0.4, 0.36]} castShadow>
          <boxGeometry args={[0.25, 0.12, 0.001]} />
          <meshStandardMaterial color="#2196f3" roughness={0.3} />
        </mesh>
      </group>

      {/* UV Transilluminator for gel imaging */}
      <group position={[1, 1.3, 3.5]}>
        <mesh castShadow>
          <boxGeometry args={[0.5, 0.2, 0.4]} />
          <meshStandardMaterial color="#2a2a2a" roughness={0.3} metalness={0.2} />
        </mesh>
        {/* UV viewing surface */}
        <mesh position={[0, 0.11, 0]} castShadow>
          <boxGeometry args={[0.45, 0.02, 0.35]} />
          <meshStandardMaterial 
            color="#9c27b0" 
            emissive="#9c27b0"
            emissiveIntensity={0.4}
            roughness={0.1}
          />
        </mesh>
        {/* Safety shield */}
        <mesh position={[0, 0.25, 0]} castShadow>
          <boxGeometry args={[0.5, 0.3, 0.4]} />
          <meshStandardMaterial 
            color="#ff9800" 
            transparent 
            opacity={0.4}
            roughness={0.2}
          />
        </mesh>
      </group>

      {/* Shaker/Incubator combo */}
      <group position={[3, 1.4, 5]}>
        <mesh castShadow>
          <boxGeometry args={[0.6, 0.5, 0.5]} />
          <meshStandardMaterial color="#e0e0e0" roughness={0.2} metalness={0.1} />
        </mesh>
        {/* Glass door */}
        <mesh position={[0, 0, 0.26]} castShadow>
          <boxGeometry args={[0.55, 0.45, 0.04]} />
          <meshStandardMaterial 
            color="#e0f0ff" 
            transparent 
            opacity={0.8}
            roughness={0.05}
          />
        </mesh>
        {/* Interior platform (shaking) */}
        <mesh position={[0, -0.15, 0]} castShadow>
          <boxGeometry args={[0.5, 0.03, 0.45]} />
          <meshStandardMaterial color="#c0c0c0" roughness={0.2} metalness={0.8} />
        </mesh>
        {/* Control panel */}
        <mesh position={[0.25, 0.2, 0.28]} castShadow>
          <boxGeometry args={[0.15, 0.15, 0.03]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.3} />
        </mesh>
        {/* Digital display */}
        <mesh position={[0.25, 0.2, 0.3]} castShadow>
          <boxGeometry args={[0.1, 0.06, 0.01]} />
          <meshStandardMaterial 
            color="#00ff00" 
            emissive="#00ff00"
            emissiveIntensity={0.7}
            roughness={0.1}
          />
        </mesh>
      </group>

      {/* Water Distiller */}
      <group position={[-6, 1.4, 5]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.2, 0.25, 0.5]} />
          <meshStandardMaterial color="#c0c0c0" roughness={0.15} metalness={0.9} />
        </mesh>
        {/* Condenser coil */}
        <mesh position={[0, 0.3, 0]} castShadow>
          <cylinderGeometry args={[0.15, 0.15, 0.15]} />
          <meshStandardMaterial color="#a0a0a0" roughness={0.2} metalness={0.85} />
        </mesh>
        {/* Collection flask */}
        <mesh position={[0.3, -0.15, 0]} castShadow>
          <cylinderGeometry args={[0.1, 0.1, 0.25]} />
          <meshStandardMaterial 
            color="#ffffff" 
            transparent 
            opacity={0.5}
            roughness={0.05}
          />
        </mesh>
      </group>

      {/* First Aid Cabinet */}
      <group position={[11.8, 2, 10]}>
        <mesh castShadow>
          <boxGeometry args={[0.1, 0.8, 0.6]} />
          <meshStandardMaterial color="#ffffff" roughness={0.2} />
        </mesh>
        {/* Red cross symbol */}
        <mesh position={[-0.051, 0, 0]} castShadow>
          <boxGeometry args={[0.001, 0.4, 0.1]} />
          <meshStandardMaterial color="#ff0000" roughness={0.3} />
        </mesh>
        <mesh position={[-0.051, 0, 0]} castShadow>
          <boxGeometry args={[0.001, 0.1, 0.4]} />
          <meshStandardMaterial color="#ff0000" roughness={0.3} />
        </mesh>
      </group>

      {/* Water Cooler/Dispenser */}
      <group position={[10, 1.2, 10]}>
        <mesh castShadow>
          <boxGeometry args={[0.4, 1.2, 0.4]} />
          <meshStandardMaterial color="#ffffff" roughness={0.3} />
        </mesh>
        {/* Water bottle */}
        <mesh position={[0, 0.7, 0]} castShadow>
          <cylinderGeometry args={[0.18, 0.18, 0.5]} />
          <meshStandardMaterial 
            color="#3b82f6" 
            transparent 
            opacity={0.5}
            roughness={0.1}
          />
        </mesh>
        {/* Dispenser taps */}
        {[-0.05, 0.05].map((x, i) => (
          <mesh key={i} position={[x, 0.2, 0.2]} castShadow>
            <cylinderGeometry args={[0.015, 0.015, 0.05]} />
            <meshStandardMaterial color={i === 0 ? "#2196f3" : "#ff0000"} roughness={0.2} metalness={0.7} />
          </mesh>
        ))}
        {/* Drip tray */}
        <mesh position={[0, 0.1, 0.15]} castShadow>
          <boxGeometry args={[0.3, 0.03, 0.15]} />
          <meshStandardMaterial color="#c0c0c0" roughness={0.2} metalness={0.8} />
        </mesh>
      </group>

      {/* Laboratory Cart with equipment */}
      <group position={[0, 0.5, 6]}>
        {/* Cart frame */}
        <mesh castShadow>
          <boxGeometry args={[1, 0.05, 0.6]} />
          <meshStandardMaterial color="#c0c0c0" roughness={0.3} metalness={0.7} />
        </mesh>
        {/* Lower shelf */}
        <mesh position={[0, -0.4, 0]} castShadow>
          <boxGeometry args={[1, 0.05, 0.6]} />
          <meshStandardMaterial color="#c0c0c0" roughness={0.3} metalness={0.7} />
        </mesh>
        {/* Wheels */}
        {[[-0.45, -0.65, -0.25], [0.45, -0.65, -0.25], [-0.45, -0.65, 0.25], [0.45, -0.65, 0.25]].map((pos, i) => (
          <mesh key={i} position={pos as [number, number, number]} rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.05, 0.05, 0.05]} />
            <meshStandardMaterial color="#1a1a1a" roughness={0.4} />
          </mesh>
        ))}
        {/* Equipment on cart */}
        <mesh position={[-0.2, 0.15, 0]} castShadow>
          <boxGeometry args={[0.3, 0.2, 0.25]} />
          <meshStandardMaterial color="#2a2a2a" roughness={0.3} />
        </mesh>
        <mesh position={[0.3, 0.08, 0]} castShadow>
          <cylinderGeometry args={[0.1, 0.1, 0.12]} />
          <meshStandardMaterial 
            color="#ffffff" 
            transparent 
            opacity={0.4}
            roughness={0.05}
          />
        </mesh>
      </group>

      {/* Analytical Balance (second one for different range) */}
      <group position={[-6, 1.3, 4]}>
        <mesh castShadow>
          <boxGeometry args={[0.35, 0.1, 0.35]} />
          <meshStandardMaterial color="#2a2a2a" roughness={0.2} metalness={0.3} />
        </mesh>
        {/* Wind shield */}
        <mesh position={[0, 0.18, 0]} castShadow>
          <boxGeometry args={[0.3, 0.3, 0.3]} />
          <meshStandardMaterial 
            color="#e0f0ff" 
            transparent 
            opacity={0.75}
            roughness={0.05}
          />
        </mesh>
        {/* Weighing pan */}
        <mesh position={[0, 0.12, 0]} castShadow>
          <cylinderGeometry args={[0.1, 0.1, 0.01]} />
          <meshStandardMaterial color="#c0c0c0" roughness={0.1} metalness={0.95} />
        </mesh>
      </group>

      {/* Sample Bottles and Vials Collection */}
      {[[-8, 1.3, 6], [8, 1.3, 6]].map((basePos, rackIdx) => (
        <group key={rackIdx} position={basePos as [number, number, number]}>
          {/* Rack */}
          <mesh castShadow>
            <boxGeometry args={[0.6, 0.1, 0.4]} />
            <meshStandardMaterial color="#ffffff" roughness={0.3} />
          </mesh>
          {/* Grid of vials */}
          {Array.from({ length: 20 }).map((_, i) => {
            const row = Math.floor(i / 5)
            const col = i % 5
            return (
              <mesh 
                key={i}
                position={[
                  -0.24 + col * 0.12,
                  0.12,
                  -0.15 + row * 0.1
                ]}
                castShadow
              >
                <cylinderGeometry args={[0.02, 0.02, 0.08]} />
                <meshStandardMaterial 
                  color={["#3b82f6", "#10b981", "#f59e0b", "#e91e63", "#9c27b0"][col]} 
                  transparent 
                  opacity={0.7}
                  roughness={0.2}
                />
              </mesh>
            )
          })}
        </group>
      ))}

      {/* Biohazard Waste Container (larger) */}
      <group position={[-6, 0.7, 10]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.4, 0.4, 0.8]} />
          <meshStandardMaterial color="#ff0000" roughness={0.4} />
        </mesh>
        {/* Lid with foot pedal mechanism */}
        <mesh position={[0, 0.45, 0]} castShadow>
          <cylinderGeometry args={[0.42, 0.42, 0.1]} />
          <meshStandardMaterial color="#cc0000" roughness={0.4} />
        </mesh>
        {/* Large biohazard symbol */}
        <mesh position={[0, 0.2, 0.41]} rotation={[0, 0, 0]} castShadow>
          <ringGeometry args={[0.2, 0.28, 32]} />
          <meshStandardMaterial color="#000000" />
        </mesh>
        {/* Foot pedal */}
        <mesh position={[0.35, -0.35, 0]} rotation={[-Math.PI / 6, 0, 0]} castShadow>
          <boxGeometry args={[0.12, 0.08, 0.2]} />
          <meshStandardMaterial color="#cc0000" roughness={0.4} />
        </mesh>
      </group>

      {/* Wall-mounted Paper Towel Dispenser */}
      {[[-5, 1.8, -11.9], [5, 1.8, -11.9]].map((pos, i) => (
        <group key={i} position={pos as [number, number, number]}>
          <mesh castShadow>
            <boxGeometry args={[0.4, 0.5, 0.15]} />
            <meshStandardMaterial color="#c0c0c0" roughness={0.3} metalness={0.5} />
          </mesh>
          {/* Dispenser opening */}
          <mesh position={[0, -0.2, 0.08]} castShadow>
            <boxGeometry args={[0.35, 0.05, 0.02]} />
            <meshStandardMaterial color="#1a1a1a" roughness={0.4} />
          </mesh>
        </group>
      ))}

      {/* Drying Rack for glassware */}
      <group position={[5.5, 1.2, -2]}>
        <mesh castShadow>
          <boxGeometry args={[0.8, 0.05, 0.6]} />
          <meshStandardMaterial color="#c0c0c0" roughness={0.3} metalness={0.7} />
        </mesh>
        {/* Pegs for drying */}
        {Array.from({ length: 12 }).map((_, i) => (
          <mesh 
            key={i}
            position={[
              -0.3 + (i % 4) * 0.2,
              0.15,
              -0.2 + Math.floor(i / 4) * 0.2
            ]}
            castShadow
          >
            <cylinderGeometry args={[0.015, 0.015, 0.25]} />
            <meshStandardMaterial color="#c0c0c0" roughness={0.2} metalness={0.8} />
          </mesh>
        ))}
        {/* Some test tubes drying */}
        {[0, 2, 5, 7].map((peg) => (
          <mesh 
            key={peg}
            position={[
              -0.3 + (peg % 4) * 0.2,
              0.25,
              -0.2 + Math.floor(peg / 4) * 0.2
            ]}
            castShadow
          >
            <cylinderGeometry args={[0.012, 0.012, 0.12]} />
            <meshStandardMaterial 
              color="#ffffff" 
              transparent 
              opacity={0.5}
              roughness={0.05}
            />
          </mesh>
        ))}
      </group>
    </group>
  )
}

