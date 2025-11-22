"use client"

import { useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Bot, X, AlertCircle, CheckCircle2, Loader2, MessageCircle, BookOpen } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useLabAssistant, type InstrumentContext } from "@/hooks/use-lab-assistant"

type Lab3DAssistantPanelProps = {
  selectedInstrument: InstrumentContext | null
  onClose: () => void
}

export function Lab3DAssistantPanel({ selectedInstrument, onClose }: Lab3DAssistantPanelProps) {
  const router = useRouter()
  const { isLoading, currentAdvice, error, askAboutInstrument, checkConfiguration, clearAdvice } = useLabAssistant()

  useEffect(() => {
    if (selectedInstrument) {
      // Demander automatiquement des conseils quand un instrument est sélectionné
      askAboutInstrument(selectedInstrument, "Comment utiliser cet instrument ?")
    } else {
      clearAdvice()
    }
  }, [selectedInstrument, askAboutInstrument, clearAdvice])

  const handleFollowUp = useCallback(
    (question: string) => {
      if (selectedInstrument) {
        askAboutInstrument(selectedInstrument, question)
      }
    },
    [selectedInstrument, askAboutInstrument],
  )

  const handleAction = useCallback(
    (target: string) => {
      router.push(target)
    },
    [router],
  )

  if (!selectedInstrument && !currentAdvice) {
    return null
  }

  return (
    <Card className="fixed bottom-4 right-4 z-50 w-full max-w-md bg-black/90 backdrop-blur-sm border border-white/20 shadow-2xl">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Bot className="size-5 text-primary" />
          <CardTitle className="text-base text-white">Assistant IA du laboratoire</CardTitle>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="text-white/70 hover:text-white hover:bg-white/10 h-8 w-8"
        >
          <X className="size-4" />
        </Button>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        {selectedInstrument && (
          <div className="pb-3 border-b border-white/10">
            <p className="text-sm font-semibold text-white mb-1">{selectedInstrument.name}</p>
            <p className="text-xs text-white/70">{selectedInstrument.description}</p>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-8 text-white/70">
            <Loader2 className="size-5 animate-spin" />
            <span className="text-sm">L'assistant réfléchit...</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center gap-2 py-8 text-red-400">
            <AlertCircle className="size-5" />
            <span className="text-sm text-center">{error}</span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => selectedInstrument && askAboutInstrument(selectedInstrument)}
              className="mt-2 bg-white/10 text-white border-white/20 hover:bg-white/20"
            >
              Réessayer
            </Button>
          </div>
        ) : currentAdvice ? (
          <ScrollArea className="max-h-[300px] pr-4">
            <div className="space-y-4">
              {currentAdvice.needsCorrection && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/20 border border-amber-500/30">
                  <AlertCircle className="size-5 text-amber-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-amber-300 mb-1">Configuration à corriger</p>
                    {currentAdvice.correctionTips && (
                      <ul className="text-xs text-amber-200/80 space-y-1 list-disc list-inside">
                        {currentAdvice.correctionTips.map((tip, idx) => (
                          <li key={idx}>{tip}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}

              {!currentAdvice.needsCorrection && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-green-500/20 border border-green-500/30">
                  <CheckCircle2 className="size-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-green-300">Configuration correcte</p>
                </div>
              )}

              <div className="text-sm text-white/90 whitespace-pre-wrap">
                {currentAdvice.reply.split('\n').map((line, idx) => {
                  if (line.startsWith('**') && line.endsWith('**')) {
                    return <p key={idx} className="font-semibold text-white mb-2">{line.replace(/\*\*/g, '')}</p>
                  }
                  if (line.startsWith('- ')) {
                    return <p key={idx} className="text-white/80 ml-4 mb-1">• {line.substring(2)}</p>
                  }
                  return <p key={idx} className="mb-2">{line || '\u00A0'}</p>
                })}
              </div>

              {currentAdvice.followUps && currentAdvice.followUps.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-wider text-white/60">Questions suggérées</p>
                  <div className="flex flex-wrap gap-2">
                    {currentAdvice.followUps.map((followUp, idx) => (
                      <Button
                        key={idx}
                        size="sm"
                        variant="secondary"
                        className="text-xs bg-white/10 text-white hover:bg-white/20 border-white/20"
                        onClick={() => handleFollowUp(followUp)}
                        disabled={isLoading}
                      >
                        <MessageCircle className="mr-1 size-3" />
                        {followUp}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {currentAdvice.suggestedActions && currentAdvice.suggestedActions.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-wider text-white/60">Actions rapides</p>
                  <div className="flex flex-wrap gap-2">
                    {currentAdvice.suggestedActions.map((action, idx) => (
                      <Badge
                        key={idx}
                        variant="outline"
                        className="cursor-pointer text-xs bg-white/10 text-white border-white/20 hover:bg-white/20 px-3 py-1.5"
                        onClick={() => handleAction(action.target)}
                      >
                        <BookOpen className="mr-1 size-3" />
                        {action.label}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {selectedInstrument && (
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full bg-primary/20 text-primary border-primary/30 hover:bg-primary/30"
                  onClick={() => checkConfiguration(selectedInstrument)}
                  disabled={isLoading}
                >
                  Vérifier la configuration
                </Button>
              )}
            </div>
          </ScrollArea>
        ) : null}
      </CardContent>
    </Card>
  )
}

