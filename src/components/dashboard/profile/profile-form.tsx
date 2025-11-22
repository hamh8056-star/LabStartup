"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, Save, ShieldCheck } from "lucide-react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const formSchema = z.object({
  name: z.string().min(2, "Indiquez votre nom complet."),
  institution: z.string().min(2, "Nom de l'établissement requis.").optional().nullable(),
  bio: z.string().max(280, "280 caractères maximum.").optional().nullable(),
  avatarUrl: z.string().url("URL invalide").optional().nullable(),
  interests: z.string().optional(),
  collaborationStyle: z.enum(["distanciel", "hybride", "presentiel"]),
})

export type ProfileFormValues = z.infer<typeof formSchema>

type ProfileFormProps = {
  initialData: ProfileFormValues & {
    email: string
    role: string
    createdAt?: string
    interestsList: string[]
  }
}

export function ProfileForm({ initialData }: ProfileFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData.name,
      institution: initialData.institution ?? "",
      bio: initialData.bio ?? "",
      avatarUrl: initialData.avatarUrl ?? "",
      interests: initialData.interestsList.join(", "),
      collaborationStyle: initialData.collaborationStyle ?? "hybride",
    },
  })

  async function onSubmit(values: ProfileFormValues) {
    setIsLoading(true)

    const response = await fetch("/api/profile", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...values,
        interests: values.interests
          ?.split(",")
          .map(item => item.trim())
          .filter(Boolean)
          .slice(0, 8),
      }),
    })

    setIsLoading(false)

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { message?: string } | null
      toast.error(payload?.message ?? "Impossible de mettre à jour le profil.")
      return
    }

    toast.success("Profil mis à jour", {
      description: "Vos informations personnelles ont été enregistrées avec succès.",
    })
    router.refresh()
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <CardWrapper>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <section className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom complet</FormLabel>
                    <FormControl>
                      <Input placeholder="Votre nom et prénom" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="institution"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Établissement</FormLabel>
                    <FormControl>
                      <Input placeholder="Université Ferhat Abbas Sétif 1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="avatarUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Avatar (URL)</FormLabel>
                    <FormControl>
                      <Input placeholder="https://..." {...field} />
                    </FormControl>
                    <FormDescription>Image hébergée utilisée dans les espaces collaboratifs.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="collaborationStyle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mode de collaboration préféré</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez un mode" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="distanciel">Distanciel</SelectItem>
                      <SelectItem value="hybride">Hybride</SelectItem>
                      <SelectItem value="presentiel">Présentiel</SelectItem>
                    </SelectContent>
                  </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </section>

            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Biographie</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Décrivez vos domaines d&apos;expertise, vos objectifs pédagogiques..."
                      className="min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>Visible par vos collaborateurs lors des sessions partagées.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="interests"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Centres d&apos;intérêt (séparés par des virgules)</FormLabel>
                  <FormControl>
                    <Input placeholder="Optique quantique, collaborations VR, classe inversée..." {...field} />
                  </FormControl>
                  <FormDescription>Maximum 8 tags. Utilisés pour les recommandations IA.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="gap-2" disabled={isLoading}>
              {isLoading ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              {isLoading ? "Enregistrement..." : "Enregistrer les modifications"}
            </Button>
          </form>
        </Form>
      </CardWrapper>

      <aside className="space-y-4">
        <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-foreground">Informations de connexion</h3>
          <div className="mt-3 space-y-2 text-sm text-muted-foreground">
            <p>
              <span className="font-medium text-foreground">Email :</span> {initialData.email}
            </p>
            <p className="capitalize">
              <span className="font-medium text-foreground">Rôle :</span> {initialData.role}
            </p>
            <p>
              <span className="font-medium text-foreground">Inscrit depuis :</span>{" "}
              {initialData.createdAt
                ? new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(new Date(initialData.createdAt))
                : "—"}
            </p>
          </div>
          <Button asChild variant="outline" size="sm" className="mt-4 w-full gap-2">
            <a href="/auth/forgot-password">
              <ShieldCheck className="size-4" />
              Réinitialiser le mot de passe
            </a>
          </Button>
        </div>
        <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-foreground">Vos centres d&apos;intérêt</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {initialData.interestsList.length ? (
              initialData.interestsList.map(tag => (
                <Badge key={tag} variant="secondary">
                  #{tag}
                </Badge>
              ))
            ) : (
              <p className="text-xs text-muted-foreground">Ajoutez des tags pour personnaliser les recommandations.</p>
            )}
          </div>
        </div>
      </aside>
    </div>
  )
}

function CardWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
      {children}
    </div>
  )
}


