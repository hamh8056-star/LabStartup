import { MessageCircle, Rocket, Trophy } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getCommunityHighlights } from "@/lib/data/community"

export default function CommunityPage() {
  const highlights = getCommunityHighlights()

  return (
    <div className="mx-auto w-full max-w-6xl space-y-12 px-4 py-16">
      <header className="space-y-6 text-center">
        <Badge variant="secondary" className="uppercase tracking-[0.3em]">
          Communauté Taalimia
        </Badge>
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-white md:text-4xl">
          Partagez vos projets, vos concours et vos bonnes pratiques
        </h1>
        <p className="mx-auto max-w-2xl text-muted-foreground">
          Enseignants, laboratoires universitaires et étudiants se retrouvent ici pour échanger des scénarios de
          simulations, organiser des challenges et valoriser leurs réussites scientifiques.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-muted-foreground">
          <span className="flex items-center gap-2 rounded-full border border-border/70 px-4 py-2">
            <MessageCircle className="size-4 text-primary" />
            Forum temps réel et feedback instantané
          </span>
          <span className="flex items-center gap-2 rounded-full border border-border/70 px-4 py-2">
            <Rocket className="size-4 text-primary" />
            Défis scientifiques entre établissements
          </span>
          <span className="flex items-center gap-2 rounded-full border border-border/70 px-4 py-2">
            <Trophy className="size-4 text-primary" />
            Badges, classements et certifications
          </span>
        </div>
      </header>
      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {highlights.map(post => (
          <Card
            key={post.id}
            className="border-border/60 bg-white/80 backdrop-blur transition hover:-translate-y-1 hover:shadow-xl dark:bg-slate-950/70"
          >
            <CardHeader className="space-y-3">
              <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-muted-foreground">
                <span>{new Date(post.createdAt).toLocaleDateString("fr-FR")}</span>
                <Badge variant="outline">{post.upvotes} votes</Badge>
              </div>
              <CardTitle className="text-lg">{post.title}</CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                {post.summary}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <p className="text-xs uppercase tracking-[0.3em] text-primary">Proposé par {post.author}</p>
              <div className="flex flex-wrap gap-2 text-xs">
                {post.tags.map(tag => (
                  <Badge key={tag} variant="secondary">
                    #{tag}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </section>
      <section className="rounded-3xl border border-border/60 bg-gradient-to-br from-slate-900 via-indigo-900 to-violet-800 p-10 text-white">
        <div className="grid gap-8 md:grid-cols-2">
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">Publiez vos expériences</h2>
            <p className="text-white/80">
              Soumettez vos scénarios, vos scripts d&apos;évaluation ou vos assets 3D. Partagez-les avec votre
              réseau, obtenez des retours et faites évoluer les pratiques pédagogiques.
            </p>
          </div>
          <div className="space-y-4 text-sm text-white/80">
            <p className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 p-4">
              <span className="font-semibold text-white">Mode concours</span>
              • Créez des compétitions inter-établissements avec scoring automatique.
            </p>
            <p className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 p-4">
              <span className="font-semibold text-white">Bibliothèque partagée</span>
              • Recherchez par discipline, compétences ou objectifs pédagogiques.
            </p>
            <p className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 p-4">
              <span className="font-semibold text-white">Mentorat</span>
              • Invitez des intervenants externes à guider vos étudiants en direct.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}






