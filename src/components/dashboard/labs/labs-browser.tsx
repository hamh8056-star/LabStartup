"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Search, Sparkles } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { VirtualLab } from "@/lib/data/seed"
import { getLabDetail } from "@/lib/data/labs-detail"

type LabsBrowserProps = {
  labs: VirtualLab[]
}

export function LabsBrowser({ labs }: LabsBrowserProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [disciplineFilter, setDisciplineFilter] = useState<string>("all")
  const [detailLab, setDetailLab] = useState<VirtualLab | null>(null)

  const detailData = detailLab ? getLabDetail(detailLab.id) : null

  const disciplines = useMemo(() => {
    const uniques = new Set<string>()
    labs.forEach(lab => uniques.add(lab.discipline))
    return Array.from(uniques)
  }, [labs])

  const filteredLabs = useMemo(() => {
    return labs
      .filter(lab => {
        const matchesSearch =
          lab.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          lab.description.toLowerCase().includes(searchQuery.toLowerCase())

        const matchesDiscipline = disciplineFilter === "all" || lab.discipline === disciplineFilter

        return matchesSearch && matchesDiscipline
      })
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [labs, searchQuery, disciplineFilter])

  return (
    <div className="flex h-full flex-col gap-6">
      {/* Barre de recherche et filtres simplifiés */}
      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher un laboratoire..."
            value={searchQuery}
            onChange={event => setSearchQuery(event.target.value)}
            className="pl-9"
          />
        </div>
        <Tabs value={disciplineFilter} onValueChange={value => setDisciplineFilter(value)} className="w-full">
          <TabsList className="flex w-full gap-2">
            <TabsTrigger value="all" className="flex-1">
              Tous
            </TabsTrigger>
            {disciplines.map(disc => (
              <TabsTrigger key={disc} value={disc} className="flex-1 capitalize">
                {disc}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Cartes des laboratoires */}
      <div className="flex-1">
        {filteredLabs.length ? (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filteredLabs.map((lab, index) => (
              <Card
                key={`${lab.id}-${index}`}
                className="flex h-full flex-col border-border/60 bg-white/85 backdrop-blur transition hover:-translate-y-1 hover:shadow-xl dark:bg-slate-950/70"
              >
                <CardHeader>
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="secondary" className="uppercase tracking-[0.3em]">
                      {lab.discipline}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg">{lab.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{lab.description}</p>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-4 text-sm text-muted-foreground">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em]">Fonctionnalités Principales</p>
                    <ul className="mt-2 space-y-1">
                      {lab.features.slice(0, 4).map(feature => (
                        <li key={feature}>• {feature}</li>
                      ))}
                      {lab.features.length > 4 && (
                        <li className="text-xs text-muted-foreground/70">
                          + {lab.features.length - 4} autres fonctionnalités
                        </li>
                      )}
                    </ul>
                  </div>
                </CardContent>
                <CardFooter className="flex items-center gap-3 border-t border-border/60">
                  <Button
                    size="lg"
                    className="flex-1 gap-2"
                    onClick={() => {
                      router.push(`/dashboard/labs/${lab.id}/vr`)
                    }}
                  >
                    <Sparkles className="size-4" />
                    Ouvrir le laboratoire
                  </Button>
                  <Button variant="outline" size="lg" onClick={() => setDetailLab(lab)}>
                    Détails
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-dashed border-primary/30 bg-primary/5 text-primary">
            <CardHeader>
              <CardTitle className="text-lg">Aucun laboratoire trouvé</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <p>Modifiez votre recherche pour voir plus de résultats.</p>
            </CardContent>
          </Card>
        )}
      </div>
      {/* Dialogue Détails du Laboratoire */}
      <Dialog open={Boolean(detailLab)} onOpenChange={open => !open && setDetailLab(null)}>
        <DialogContent className="max-w-3xl">
          {detailLab && detailData ? (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl">{detailLab.name}</DialogTitle>
                <DialogDescription>{detailLab.description}</DialogDescription>
              </DialogHeader>
              <ScrollArea className="max-h-[540px] space-y-6 pr-6">
                <section className="space-y-3">
                  <h3 className="text-sm font-semibold text-foreground">Fonctionnalités Complètes</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    {detailLab.features.map(feature => (
                      <li key={feature}>• {feature}</li>
                    ))}
                  </ul>
                </section>
                {detailData.experiences && detailData.experiences.length > 0 && (
                  <section className="space-y-3">
                    <h3 className="text-sm font-semibold text-foreground">Expériences Disponibles</h3>
                    <div className="grid gap-3">
                      {detailData.experiences.map(experience => (
                        <Card key={experience.id} className="border-border/60 bg-muted/30">
                          <CardHeader>
                            <CardTitle className="text-base">{experience.title}</CardTitle>
                            <p className="text-xs text-muted-foreground">
                              Durée : {experience.duration} min • Niveau : {experience.level}
                            </p>
                          </CardHeader>
                          <CardContent className="text-sm text-muted-foreground">
                            <p className="text-xs uppercase tracking-[0.3em] mb-2">Objectifs</p>
                            <ul className="space-y-1">
                              {experience.objectives.map(objective => (
                                <li key={objective}>• {objective}</li>
                              ))}
                            </ul>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </section>
                )}
              </ScrollArea>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDetailLab(null)}>
                  Fermer
                </Button>
                <Button
                  onClick={() => {
                    router.push(`/dashboard/labs/${detailLab.id}/vr`)
                  }}
                >
                  Ouvrir le laboratoire
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}

