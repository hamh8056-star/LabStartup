"use client"

import { useState, useTransition } from "react"
import { Loader2, MailCheck } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"

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

const forgotSchema = z.object({
  email: z.string().email("Adresse email invalide."),
})

type ForgotValues = z.infer<typeof forgotSchema>

export function ForgotPasswordForm() {
  const [isPending, startTransition] = useTransition()
  const [isSent, setIsSent] = useState(false)

  const form = useForm<ForgotValues>({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: "" },
  })

  const onSubmit = (values: ForgotValues) => {
    startTransition(async () => {
      const response = await fetch("/api/auth/reset/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      })

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { message?: string } | null
        toast.error(payload?.message ?? "Impossible d'envoyer l'email de réinitialisation.")
        return
      }

      setIsSent(true)
      toast.success("Email envoyé", {
        description:
          "Un lien de réinitialisation a été généré. Consultez votre messagerie (ou la console serveur en mode démo).",
      })
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email professionnel</FormLabel>
              <FormControl>
                <Input placeholder="vous@institution.fr" type="email" autoComplete="email" disabled={isPending} {...field} />
              </FormControl>
              <FormDescription>Nous vous enverrons un lien sécurisé pour réinitialiser votre mot de passe.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full gap-2" disabled={isPending}>
          {isPending ? <Loader2 className="size-4 animate-spin" /> : <MailCheck className="size-4" />}
          {isPending ? "Envoi en cours..." : "Envoyer le lien"}
        </Button>
        {isSent ? (
          <p className="rounded-lg border border-primary/30 bg-primary/10 p-3 text-sm text-primary">
            Lien généré : vérifiez votre boîte mail. En environnement de développement, consultez la console serveur pour copier le lien.
          </p>
        ) : null}
      </form>
    </Form>
  )
}






