 "use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, UserPlus } from "lucide-react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import { USER_ROLES } from "@/lib/roles"

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const registerSchema = z.object({
  name: z.string().min(2, "Veuillez indiquer votre nom complet."),
  email: z.string().email("Adresse email invalide."),
  password: z.string().min(8, "Le mot de passe doit comporter au moins 8 caractères."),
  role: z.enum(USER_ROLES, {
    message: "Choisissez un rôle.",
  }),
  institution: z.string().min(2, "Indiquez le nom de l’établissement.").optional(),
})

type RegisterValues = z.infer<typeof registerSchema>

export function RegisterForm() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: "student",
      institution: "",
    },
  })

  async function onSubmit(values: RegisterValues) {
    startTransition(async () => {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      })

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { message?: string }
          | null

        toast.error(payload?.message ?? "Impossible de créer le compte.")
        return
      }

      toast.success("Compte créé", {
        description: "Vous pouvez maintenant vous connecter à Taalimia.",
      })

      router.push("/auth/login?registered=1")
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nom complet</FormLabel>
              <FormControl>
                <Input placeholder="Karim Benali" autoComplete="name" disabled={isPending} {...field} />
              </FormControl>
              <FormDescription>Affiché dans les salles virtuelles et certificats.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email professionnel</FormLabel>
              <FormControl>
                <Input
                  placeholder="prenom.nom@univ-setif.dz"
                  type="email"
                  autoComplete="email"
                  disabled={isPending}
                  {...field}
                />
              </FormControl>
              <FormDescription>Utilisé pour l’authentification et le suivi des résultats.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mot de passe</FormLabel>
              <FormControl>
                <Input
                  placeholder="••••••••"
                  type="password"
                  autoComplete="new-password"
                  disabled={isPending}
                  {...field}
                />
              </FormControl>
              <FormDescription>Au moins 8 caractères. Combinez lettres, chiffres et symboles.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Rôle</FormLabel>
                <Select disabled={isPending} onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez votre rôle" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="student">Étudiant</SelectItem>
                    <SelectItem value="teacher">Enseignant</SelectItem>
                    <SelectItem value="admin">Administrateur</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>Détermine l’accès aux tableaux de bord et aux outils.</FormDescription>
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
                  <Input
                    placeholder="Université Ferhat Abbas Sétif 1"
                    autoComplete="organization"
                    disabled={isPending}
                    {...field}
                  />
                </FormControl>
                <FormDescription>Optionnel, mais utile pour les rapports d’établissement.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <Button type="submit" className="w-full gap-2" disabled={isPending}>
          {isPending ? <Loader2 className="size-4 animate-spin" /> : <UserPlus className="size-4" />}
          {isPending ? "Création du compte..." : "Créer un compte"}
        </Button>
      </form>
    </Form>
  )
}


