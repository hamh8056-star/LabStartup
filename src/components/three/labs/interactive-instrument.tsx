"use client"

import { useRef, useState } from "react"
import { useFrame, useThree } from "@react-three/fiber"
import { Text, Html } from "@react-three/drei"
import * as THREE from "three"
import { useLabInstrument } from "@/contexts/lab-instrument-context"

type InteractiveInstrumentProps = {
  position: [number, number, number]
  name: string
  description: string
  children: React.ReactNode
  onSelect?: (selected: boolean) => void
  onParameterChange?: (params: Record<string, number>) => void
  parameters?: Record<string, { min: number; max: number; value: number; label: string; unit?: string }>
  showData?: boolean
  dataValue?: number
  dataUnit?: string
  discipline?: string
}

export function InteractiveInstrument({
  position,
  name,
  description,
  children,
  onSelect,
  onParameterChange,
  parameters = {},
  showData = false,
  dataValue = 0,
  dataUnit = "",
  discipline = "physique",
}: InteractiveInstrumentProps) {
  const { selectInstrument } = useLabInstrument()
  const meshRef = useRef<THREE.Group>(null)
  const [selected, setSelected] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const dragPlane = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0))
  const raycaster = useRef(new THREE.Raycaster())
  const { camera, gl } = useThree()

  const handlePointerDown = (e: any) => {
    e.stopPropagation()
    if (selected) {
      setIsDragging(true)
      gl.domElement.style.cursor = "grabbing"
      
      const handleGlobalMove = (event: MouseEvent) => {
        if (!meshRef.current) return
        
        const mouse = new THREE.Vector2()
        mouse.x = (event.clientX / gl.domElement.clientWidth) * 2 - 1
        mouse.y = -(event.clientY / gl.domElement.clientHeight) * 2 + 1
        
        raycaster.current.setFromCamera(mouse, camera)
        const intersection = new THREE.Vector3()
        raycaster.current.ray.intersectPlane(dragPlane.current, intersection)
        
        if (intersection) {
          meshRef.current.position.x = intersection.x
          meshRef.current.position.z = intersection.z
        }
      }
      
      const handleGlobalUp = () => {
        setIsDragging(false)
        gl.domElement.style.cursor = "default"
        document.removeEventListener("mousemove", handleGlobalMove)
        document.removeEventListener("mouseup", handleGlobalUp)
      }
      
      document.addEventListener("mousemove", handleGlobalMove)
      document.addEventListener("mouseup", handleGlobalUp)
    }
  }

  const handleClick = (e: any) => {
    e.stopPropagation()
    const newSelected = !selected
    setSelected(newSelected)
    onSelect?.(newSelected)
    
    // Notifier l'assistant IA global via le context
    if (newSelected) {
      const context = {
        name,
        description,
        parameters,
        discipline,
      }
      selectInstrument(context)
    } else {
      selectInstrument(null)
    }
  }

  useFrame(() => {
    if (meshRef.current && selected && !isDragging) {
      meshRef.current.rotation.y += 0.01
    }
  })

  return (
    <group
      ref={meshRef}
      position={position}
      onClick={handleClick}
      onPointerOver={(e) => {
        e.stopPropagation()
        setHovered(true)
        document.body.style.cursor = "pointer"
      }}
      onPointerOut={() => {
        setHovered(false)
        if (!isDragging) {
          document.body.style.cursor = "default"
        }
      }}
      onPointerDown={handlePointerDown}
    >
      <group scale={selected ? 1.1 : hovered ? 1.05 : 1}>
        {children}
      </group>
      
      {/* Selection indicator */}
      {selected && (
        <mesh position={[0, 0.5, 0]}>
          <ringGeometry args={[0.3, 0.35, 32]} />
          <meshBasicMaterial color="#3b82f6" transparent opacity={0.6} side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* Label */}
      {(selected || hovered) && (
        <Text
          position={[0, 0.8, 0]}
          fontSize={0.15}
          color="white"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.02}
          outlineColor="#000000"
        >
          {name}
        </Text>
      )}

      {/* Data display */}
      {selected && showData && (
        <Html position={[0, -0.5, 0]} center>
          <div className="bg-black/80 text-white px-3 py-2 rounded-lg text-sm font-mono border border-white/20">
            {dataValue.toFixed(2)} {dataUnit}
          </div>
        </Html>
      )}

      {/* Parameter controls */}
      {selected && Object.keys(parameters).length > 0 && (
        <Html position={[1, 0, 0]} center>
          <div className="bg-black/90 text-white p-4 rounded-lg border border-white/20 min-w-[200px]">
            <h4 className="text-xs font-semibold mb-2 uppercase tracking-wider">{name}</h4>
            <p className="text-xs text-white/70 mb-3">{description}</p>
            {Object.entries(parameters).map(([key, param]) => (
              <div key={key} className="mb-3">
                <label className="text-xs text-white/80 block mb-1">
                  {param.label} ({param.unit || ""})
                </label>
                <input
                  type="range"
                  min={param.min}
                  max={param.max}
                  value={param.value}
                  onChange={(e) => {
                    const newValue = parseFloat(e.target.value)
                    onParameterChange?.({ [key]: newValue })
                    // Notifier l'assistant global si la configuration change
                    if (selected) {
                      const updatedParams = { ...parameters, [key]: { ...param, value: newValue } }
                      const context = {
                        name,
                        description,
                        parameters: updatedParams,
                        discipline,
                      }
                      selectInstrument(context)
                    }
                  }}
                  className="w-full"
                />
                <div className="text-xs text-white/60 mt-1">
                  {param.value.toFixed(2)} {param.unit || ""}
                </div>
              </div>
            ))}
          </div>
        </Html>
      )}
    </group>
  )
}

