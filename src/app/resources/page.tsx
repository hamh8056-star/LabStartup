import Link from "next/link"
import { BookOpenCheck, Download, FileText, PlayCircle } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { withFallback } from "@/lib/data/helpers"
import { getResources } from "@/lib/data/service"
import { baseResources } from "@/lib/data/seed"

export default async function ResourcesPage() {
  const resources = await withFallback(
    () => getResources(),
    () => baseResources,
    "resources-public",
  )

  return (
    <div className="mx-auto w-full max-w-6xl space-y-12 px-4 py-16">
      <header className="space-y-6 text-center">
        <Badge variant="secondary" className="uppercase tracking-[0.3em]">
          Ressources pédagogiques
        </Badge>
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-white md:text-4xl">
          Guides interactifs, vidéos immersives et fiches de laboratoire
        </h1>
        <p className="mx-auto max-w-2xl text-muted-foreground">
          Chaque simulation Taalimia est accompagnée de ressources multimédias, d&apos;exercices corrigés et de
          quiz adaptatifs pour accélérer la compréhension scientifique des élèves.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-muted-foreground">
          <span className="flex items-center gap-2 rounded-full border border-border/70 px-4 py-2">
            <PlayCircle className="size-4 text-primary" />
            Vidéos 4K et animations interactives
          </span>
          <span className="flex items-center gap-2 rounded-full border border-border/70 px-4 py-2">
            <FileText className="size-4 text-primary" />
            Fiches synthèse multilingues
          </span>
          <span className="flex items-center gap-2 rounded-full border border-border/70 px-4 py-2">
            <BookOpenCheck className="size-4 text-primary" />
            Quiz avant / après expérience
          </span>
        </div>
      </header>
      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {resources.map(resource => (
          <Card
            key={resource.id}
            className="border-border/60 bg-white/80 backdrop-blur transition hover:-translate-y-1 hover:shadow-xl dark:bg-slate-950/70"
          >
            <CardHeader className="space-y-3">
              <Badge variant="outline" className="w-max uppercase tracking-[0.3em]">
                {resource.discipline}
              </Badge>
              <CardTitle className="text-lg">{resource.title}</CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                {resource.summary}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <Badge variant="secondary" className="uppercase tracking-[0.3em]">
                  {resource.type}
                </Badge>
                <Badge variant="outline">{resource.duration} min</Badge>
              </div>
              <p>
                Ressource synchronisée avec les simulations immersives correspondantes. Compatible avec le mode
                collaboration et l&apos;IA éducative.
              </p>
            </CardContent>
            <CardFooter>
              <Button asChild variant="outline" className="w-full gap-2">
                <Link href={resource.url}>
                  <Download className="size-4" />
                  Ouvrir ou télécharger
                </Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </section>
    </div>
  )
}






