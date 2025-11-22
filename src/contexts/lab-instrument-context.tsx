"use client"

import { createContext, useContext, useState, useCallback, ReactNode } from "react"
import type { InstrumentContext } from "@/hooks/use-lab-assistant"

type LabInstrumentContextType = {
  selectedInstrument: InstrumentContext | null
  selectInstrument: (instrument: InstrumentContext | null) => void
  clearInstrument: () => void
}

const LabInstrumentContext = createContext<LabInstrumentContextType | undefined>(undefined)

export function LabInstrumentProvider({ children }: { children: ReactNode }) {
  const [selectedInstrument, setSelectedInstrument] = useState<InstrumentContext | null>(null)

  const selectInstrument = useCallback((instrument: InstrumentContext | null) => {
    setSelectedInstrument(instrument)
  }, [])

  const clearInstrument = useCallback(() => {
    setSelectedInstrument(null)
  }, [])

  return (
    <LabInstrumentContext.Provider
      value={{
        selectedInstrument,
        selectInstrument,
        clearInstrument,
      }}
    >
      {children}
    </LabInstrumentContext.Provider>
  )
}

export function useLabInstrument() {
  const context = useContext(LabInstrumentContext)
  if (context === undefined) {
    throw new Error("useLabInstrument must be used within a LabInstrumentProvider")
  }
  return context
}



