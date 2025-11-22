import type { InstrumentContext } from "@/hooks/use-lab-assistant"

export type ChatMessage = {
  role: "system" | "user" | "assistant"
  content: string
}

export type ChatContext = {
  instrument?: InstrumentContext
  discipline?: string
  userRole?: "student" | "teacher" | "admin"
  userName?: string
}

/**
 * Service de chat IA conversationnel
 * Supporte Google Gemini, OpenAI, Anthropic, ou réponses simulées si aucune clé API n'est configurée
 */
export class ChatService {
  private apiKey: string | null = null
  private provider: "gemini" | "openai" | "anthropic" | "simulated" = "simulated"
  private geminiModel: string = "gemini-1.5-flash"

  constructor() {
    // Vérifier les variables d'environnement (priorité à OpenAI/ChatGPT)
    if (process.env.OPENAI_API_KEY) {
      this.apiKey = process.env.OPENAI_API_KEY
      this.provider = "openai"
      console.log("✅ Assistant IA configuré avec OpenAI (ChatGPT)")
    } else if (process.env.GEMINI_API_KEY) {
      this.apiKey = process.env.GEMINI_API_KEY
      this.provider = "gemini"
      // Permettre de configurer le modèle Gemini (par défaut: gemini-1.5-flash - gratuit)
      // Options: gemini-1.5-flash (gratuit), gemini-1.5-pro (gratuit), gemini-pro (gratuit)
      // Note: gemini-2.0-flash-exp nécessite un plan payant et n'est PAS disponible en gratuit
      const configuredModel = process.env.GEMINI_MODEL || "gemini-1.5-flash"
      
      // Si l'utilisateur a configuré un modèle payant, utiliser un modèle gratuit à la place
      if (configuredModel.includes("2.0") || configuredModel.includes("flash-exp")) {
        console.warn(`⚠️ Le modèle "${configuredModel}" nécessite un plan payant. Utilisation de "gemini-1.5-flash" (gratuit) à la place.`)
        this.geminiModel = "gemini-1.5-flash"
      } else {
        this.geminiModel = configuredModel
      }
      
      // Valider que la clé API n'est pas un placeholder
      if (this.apiKey.includes("...") || this.apiKey.length < 20) {
        console.warn("⚠️ GEMINI_API_KEY semble être un placeholder. Veuillez configurer une vraie clé API.")
      }
      console.log("✅ Assistant IA configuré avec Google Gemini")
    } else if (process.env.ANTHROPIC_API_KEY) {
      this.apiKey = process.env.ANTHROPIC_API_KEY
      this.provider = "anthropic"
      console.log("✅ Assistant IA configuré avec Anthropic (Claude)")
    } else {
      console.warn("⚠️ Aucune clé API configurée. L'assistant utilisera le mode simulé.")
    }
  }

  /**
   * Génère une réponse conversationnelle basée sur l'historique et le contexte
   */
  async generateResponse(
    messages: ChatMessage[],
    context?: ChatContext,
  ): Promise<{ reply: string; followUps?: string[]; suggestedActions?: Array<{ label: string; target: string }> }> {
    // Construire le prompt système avec le contexte
    const systemPrompt = this.buildSystemPrompt(context)

    // Préparer les messages pour l'API
    const apiMessages: ChatMessage[] = [
      { role: "system", content: systemPrompt },
      ...messages,
    ]

    try {
      if (this.provider === "openai" && this.apiKey) {
        return await this.callOpenAI(apiMessages, context)
      } else if (this.provider === "gemini" && this.apiKey) {
        return await this.callGemini(apiMessages, context)
      } else if (this.provider === "anthropic" && this.apiKey) {
        return await this.callAnthropic(apiMessages, context)
      } else {
        // Mode simulé avec réponses intelligentes basées sur le contexte
        return await this.generateSimulatedResponse(apiMessages, context)
      }
    } catch (error) {
      console.error("Erreur lors de l'appel à l'IA:", error)
      // Fallback vers réponse simulée en cas d'erreur
      return await this.generateSimulatedResponse(apiMessages, context)
    }
  }

  private buildSystemPrompt(context?: ChatContext): string {
    let prompt = `Tu es un assistant IA pédagogique spécialisé dans l'enseignement scientifique pour la plateforme Taalimia.
Tu es patient, clair et encourageant. Tu adaptes tes explications au niveau de l'utilisateur.
Tu réponds toujours en français, de manière concise mais complète.`

    if (context?.instrument) {
      const { instrument } = context
      prompt += `\n\nL'utilisateur travaille actuellement avec l'instrument suivant :
- Nom : ${instrument.name}
- Description : ${instrument.description}
- Discipline : ${instrument.discipline}

Paramètres actuels de l'instrument :
${Object.entries(instrument.parameters)
  .map(([key, param]) => `- ${param.label} : ${param.value.toFixed(2)} ${param.unit || ""} (plage : ${param.min} - ${param.max} ${param.unit || ""})`)
  .join("\n")}

Tu dois aider l'utilisateur à :
1. Comprendre comment utiliser cet instrument
2. Configurer correctement les paramètres
3. Interpréter les résultats
4. Identifier et corriger les erreurs de configuration
5. Répondre à toutes ses questions sur cet instrument`
    }

    if (context?.discipline) {
      prompt += `\n\nDiscipline scientifique : ${context.discipline}`
    }

    if (context?.userRole) {
      prompt += `\n\nRôle de l'utilisateur : ${context.userRole}`
    }

    prompt += `\n\nRéponds de manière conversationnelle et naturelle, comme un tuteur bienveillant.`

    return prompt
  }

  private async callGemini(
    messages: ChatMessage[],
    context?: ChatContext,
    fallbackModel?: string,
  ): Promise<{ reply: string; followUps?: string[]; suggestedActions?: Array<{ label: string; target: string }> }> {
    // Utiliser le modèle de fallback si fourni, sinon le modèle configuré
    const modelToUse = fallbackModel || this.geminiModel
    // Extraire le message système et les messages de conversation
    const systemMessage = messages.find(m => m.role === "system")
    const conversationMessages = messages.filter(m => m.role !== "system")

    // Convertir au format Gemini (parts avec text)
    const contents = conversationMessages.map(msg => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }],
    }))

    // Ajouter le contexte système comme instruction système
    const systemInstruction = systemMessage?.content || ""

    // Construire le body de la requête
    const requestBody: any = {
      contents,
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      },
    }

    // Ajouter systemInstruction seulement pour v1beta (pas supporté dans v1)
    // On va d'abord essayer v1beta, et si ça échoue, on utilisera v1 sans systemInstruction
    const useSystemInstruction = systemInstruction && (modelToUse.includes("1.5") || modelToUse.includes("2.0"))
    
    if (useSystemInstruction) {
      requestBody.systemInstruction = {
        parts: [{ text: systemInstruction }],
      }
    } else if (systemInstruction) {
      // Pour les anciens modèles ou v1, ajouter le système comme premier message
      contents.unshift({
        role: "user",
        parts: [{ text: `[Instructions système] ${systemInstruction}` }],
      })
    }

    // Essayer d'abord avec v1beta (plus récent), puis v1 en fallback
    let apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelToUse}:generateContent?key=${this.apiKey}`

    let response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    })

    // Si v1beta échoue, essayer v1 puis gemini-pro
    if (!response.ok) {
      let errorText = ""
      let errorJson: any = null
      
      try {
        errorText = await response.text()
        errorJson = JSON.parse(errorText)
      } catch (parseError) {
        // Ignorer l'erreur de parsing, on utilisera errorText
      }

      // Si 404 dans v1beta, essayer v1
      if (response.status === 404 && apiUrl.includes("v1beta")) {
        console.warn(`Modèle ${modelToUse} non trouvé dans v1beta, tentative avec v1...`)
        apiUrl = `https://generativelanguage.googleapis.com/v1/models/${modelToUse}:generateContent?key=${this.apiKey}`
        
        // Pour v1, retirer systemInstruction (non supporté) et l'ajouter comme message système
        const v1RequestBody: any = {
          contents: [...requestBody.contents],
          generationConfig: requestBody.generationConfig,
        }
        
        // Si on avait systemInstruction, l'ajouter comme premier message utilisateur
        if (requestBody.systemInstruction && systemInstruction) {
          v1RequestBody.contents = [
            {
              role: "user",
              parts: [{ text: `[Instructions système] ${systemInstruction}` }],
            },
            ...v1RequestBody.contents,
          ]
        }
        
        const fallbackResponse = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(v1RequestBody),
        })
        
        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json()
          const reply = fallbackData.candidates?.[0]?.content?.parts?.[0]?.text || "Désolé, je n'ai pas pu générer de réponse."
          
          if (fallbackData.candidates?.[0]?.finishReason === "SAFETY") {
            return {
              reply: "Désolé, ma réponse a été bloquée par les filtres de sécurité. Pouvez-vous reformuler votre question ?",
              followUps: this.generateFollowUps(context),
              suggestedActions: this.generateSuggestedActions(context),
            }
          }
          
          return {
            reply,
            followUps: this.generateFollowUps(context),
            suggestedActions: this.generateSuggestedActions(context),
          }
        }
        
        // Si v1 échoue aussi avec 404, essayer gemini-1.5-flash (gratuit)
        if (fallbackResponse.status === 404 && !fallbackModel && modelToUse !== "gemini-1.5-flash") {
          console.warn(`Modèle ${modelToUse} non trouvé dans v1, tentative avec gemini-1.5-flash (gratuit)...`)
          try {
            return await this.callGemini(messages, context, "gemini-1.5-flash")
          } catch (flashError) {
            // Si gemini-1.5-flash échoue, essayer gemini-pro
            console.warn(`gemini-1.5-flash a échoué, tentative avec gemini-pro...`)
            try {
              return await this.callGemini(messages, context, "gemini-pro")
            } catch (proError) {
              // Continuer pour afficher l'erreur
            }
          }
        }
        
        // Si v1 échoue avec 429 (quota), essayer un modèle gratuit
        if (fallbackResponse.status === 429 && !fallbackModel) {
          console.warn(`Quota dépassé pour ${modelToUse} dans v1, basculement vers gemini-1.5-flash (gratuit)...`)
          try {
            return await this.callGemini(messages, context, "gemini-1.5-flash")
          } catch (flashError) {
            console.warn(`gemini-1.5-flash a échoué, tentative avec gemini-pro...`)
            try {
              return await this.callGemini(messages, context, "gemini-pro")
            } catch (proError) {
              // Continuer pour afficher l'erreur
            }
          }
        }
        
        // Si v1 échoue avec 400 (Bad Request), c'est peut-être à cause de systemInstruction
        // Réessayer sans systemInstruction
        if (fallbackResponse.status === 400) {
          const errorText400 = await fallbackResponse.text()
          let errorJson400: any = null
          try {
            errorJson400 = JSON.parse(errorText400)
          } catch (e) {
            // Ignorer
          }
          
          if (errorJson400?.error?.message?.includes("systemInstruction")) {
            console.warn(`Erreur 400 avec v1 (systemInstruction non supporté), réessai sans systemInstruction...`)
            const v1RequestBodyWithoutSystem: any = {
              contents: [...requestBody.contents],
              generationConfig: requestBody.generationConfig,
            }
            
            // Ajouter l'instruction système comme premier message utilisateur
            if (systemInstruction) {
              v1RequestBodyWithoutSystem.contents = [
                {
                  role: "user",
                  parts: [{ text: `[Instructions système] ${systemInstruction}` }],
                },
                ...v1RequestBodyWithoutSystem.contents,
              ]
            }
            
            const retryResponse = await fetch(apiUrl, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(v1RequestBodyWithoutSystem),
            })
            
            if (retryResponse.ok) {
              const retryData = await retryResponse.json()
              const reply = retryData.candidates?.[0]?.content?.parts?.[0]?.text || "Désolé, je n'ai pas pu générer de réponse."
              
              if (retryData.candidates?.[0]?.finishReason === "SAFETY") {
                return {
                  reply: "Désolé, ma réponse a été bloquée par les filtres de sécurité. Pouvez-vous reformuler votre question ?",
                  followUps: this.generateFollowUps(context),
                  suggestedActions: this.generateSuggestedActions(context),
                }
              }
              
              return {
                reply,
                followUps: this.generateFollowUps(context),
                suggestedActions: this.generateSuggestedActions(context),
              }
            }
          }
        }
        
        // Récupérer l'erreur de la réponse v1
        try {
          errorText = await fallbackResponse.text()
          errorJson = JSON.parse(errorText)
          response = fallbackResponse // Utiliser la réponse de fallback pour l'erreur
        } catch (e) {
          // Ignorer
        }
      } else if (response.status === 404 && !fallbackModel && modelToUse !== "gemini-1.5-flash") {
        // Si 404 et pas déjà en fallback, essayer gemini-1.5-flash (gratuit)
        console.warn(`Modèle ${modelToUse} non trouvé, tentative avec gemini-1.5-flash (gratuit)...`)
        try {
          return await this.callGemini(messages, context, "gemini-1.5-flash")
        } catch (flashError) {
          // Si gemini-1.5-flash échoue, essayer gemini-pro
          console.warn(`gemini-1.5-flash a échoué, tentative avec gemini-pro...`)
          try {
            return await this.callGemini(messages, context, "gemini-pro")
          } catch (proError) {
            // Continuer pour afficher l'erreur originale
          }
        }
      } else if (response.status === 429 && !fallbackModel) {
        // Si quota dépassé (429), essayer un modèle gratuit immédiatement
        console.warn(`⚠️ Quota dépassé pour ${modelToUse} (modèle payant). Basculement automatique vers gemini-1.5-flash (gratuit)...`)
        try {
          return await this.callGemini(messages, context, "gemini-1.5-flash")
        } catch (flashError) {
          // Si gemini-1.5-flash échoue aussi, essayer gemini-pro
          console.warn(`gemini-1.5-flash a échoué, tentative avec gemini-pro...`)
          try {
            return await this.callGemini(messages, context, "gemini-pro")
          } catch (proError) {
            // Continuer pour afficher l'erreur originale
          }
        }
      }

      // Afficher l'erreur détaillée
      const errorMessage = errorJson?.error?.message || response.statusText
      console.error("Gemini API error details:", {
        status: response.status,
        statusText: response.statusText,
        error: errorJson,
        model: modelToUse,
        url: apiUrl.replace(this.apiKey || "", "***"),
      })
      
      // Message d'erreur plus explicite pour le quota
      if (response.status === 429) {
        throw new Error(
          `Quota API Gemini dépassé pour le modèle "${modelToUse}". Ce modèle n'est peut-être pas disponible dans votre plan gratuit. Le système a tenté un fallback vers un modèle gratuit mais a échoué. Erreur: ${errorMessage}`,
        )
      }
      
      throw new Error(
        `Gemini API error (${response.status}): ${errorMessage}. Modèle: ${modelToUse}`,
      )
    }

    const data = await response.json()
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "Désolé, je n'ai pas pu générer de réponse."

    // Vérifier si la réponse a été bloquée
    if (data.candidates?.[0]?.finishReason === "SAFETY") {
      return {
        reply: "Désolé, ma réponse a été bloquée par les filtres de sécurité. Pouvez-vous reformuler votre question ?",
        followUps: this.generateFollowUps(context),
        suggestedActions: this.generateSuggestedActions(context),
      }
    }

    return {
      reply,
      followUps: this.generateFollowUps(context),
      suggestedActions: this.generateSuggestedActions(context),
    }
  }

  private async callOpenAI(
    messages: ChatMessage[],
    context?: ChatContext,
  ): Promise<{ reply: string; followUps?: string[]; suggestedActions?: Array<{ label: string; target: string }> }> {
    // Modèles OpenAI disponibles :
    // - gpt-4o : Le plus récent et puissant (recommandé)
    // - gpt-4o-mini : Version allégée de GPT-4o, économique
    // - gpt-3.5-turbo : Le plus économique
    // Note: OpenAI n'offre pas de modèle vraiment gratuit, mais gpt-3.5-turbo est très économique
    const model = process.env.OPENAI_MODEL || "gpt-4o-mini"
    
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: model, // gpt-3.5-turbo (économique) ou gpt-4o-mini
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content,
        })),
        temperature: 0.7,
        max_tokens: 1000,
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`)
    }

    const data = await response.json()
    const reply = data.choices[0]?.message?.content || "Désolé, je n'ai pas pu générer de réponse."

    return {
      reply,
      followUps: this.generateFollowUps(context),
      suggestedActions: this.generateSuggestedActions(context),
    }
  }

  private async callAnthropic(
    messages: ChatMessage[],
    context?: ChatContext,
  ): Promise<{ reply: string; followUps?: string[]; suggestedActions?: Array<{ label: string; target: string }> }> {
    // Filtrer le message système pour Anthropic (il utilise un format différent)
    const systemMessage = messages.find(m => m.role === "system")
    const conversationMessages = messages.filter(m => m.role !== "system")

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey!,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-haiku-20240307", // ou "claude-3-sonnet-20240229" pour plus de qualité
        max_tokens: 1000,
        system: systemMessage?.content || "",
        messages: conversationMessages.map(msg => ({
          role: msg.role === "assistant" ? "assistant" : "user",
          content: msg.content,
        })),
      }),
    })

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.statusText}`)
    }

    const data = await response.json()
    const reply = data.content[0]?.text || "Désolé, je n'ai pas pu générer de réponse."

    return {
      reply,
      followUps: this.generateFollowUps(context),
      suggestedActions: this.generateSuggestedActions(context),
    }
  }

  private async generateSimulatedResponse(
    messages: ChatMessage[],
    context?: ChatContext,
  ): Promise<{ reply: string; followUps?: string[]; suggestedActions?: Array<{ label: string; target: string }> }> {
    const lastMessage = messages[messages.length - 1]?.content.toLowerCase() || ""
    const instrument = context?.instrument

    let reply = ""

    // Réponses contextuelles basées sur l'instrument
    if (instrument) {
      if (lastMessage.includes("comment") || lastMessage.includes("utiliser") || lastMessage.includes("fonctionne")) {
        reply = `Pour utiliser le **${instrument.name}** :\n\n`
        reply += `${instrument.description}\n\n`

        if (Object.keys(instrument.parameters).length > 0) {
          reply += "**Paramètres disponibles :**\n"
          Object.entries(instrument.parameters).forEach(([key, param]) => {
            reply += `- **${param.label}** : Actuellement à ${param.value.toFixed(2)} ${param.unit || ""} (plage recommandée : ${param.min} - ${param.max} ${param.unit || ""})\n`
          })
        }

        reply += `\n**Conseils d'utilisation :**\n`
        reply += `- Commencez par des valeurs modérées pour vous familiariser\n`
        reply += `- Observez les résultats en temps réel dans l'affichage des données\n`
        reply += `- Ajustez progressivement les paramètres selon vos objectifs expérimentaux\n`

        // Détecter les configurations problématiques
        const issues: string[] = []
        Object.entries(instrument.parameters).forEach(([key, param]) => {
          const range = param.max - param.min
          const percentage = ((param.value - param.min) / range) * 100
          if (percentage > 90) {
            issues.push(`⚠️ ${param.label} est très élevé (${param.value.toFixed(2)} ${param.unit || ""}). Réduisez-le pour éviter la saturation.`)
          } else if (percentage < 10 && param.value > param.min) {
            issues.push(`⚠️ ${param.label} est très faible (${param.value.toFixed(2)} ${param.unit || ""}). Augmentez-le pour obtenir des résultats mesurables.`)
          }
        })

        if (issues.length > 0) {
          reply += `\n**⚠️ Avertissements :**\n${issues.join("\n")}\n`
        }
      } else if (lastMessage.includes("vérif") || lastMessage.includes("configur") || lastMessage.includes("correct")) {
        const issues: string[] = []
        const tips: string[] = []

        Object.entries(instrument.parameters).forEach(([key, param]) => {
          const range = param.max - param.min
          const percentage = ((param.value - param.min) / range) * 100

          if (percentage > 90) {
            issues.push(`${param.label} est très élevé`)
            tips.push(`Réduire ${param.label} à environ ${((param.min + param.max) / 2).toFixed(2)} ${param.unit || ""}`)
          } else if (percentage < 10 && param.value > param.min) {
            issues.push(`${param.label} est très faible`)
            tips.push(`Augmenter ${param.label} à environ ${((param.min + param.max) / 2).toFixed(2)} ${param.unit || ""}`)
          }
        })

        if (issues.length > 0) {
          reply = `⚠️ **Votre configuration nécessite des ajustements :**\n\n`
          reply += `**Problèmes détectés :**\n${issues.map(i => `- ${i}`).join("\n")}\n\n`
          reply += `**Recommandations :**\n${tips.map(t => `- ${t}`).join("\n")}\n`
        } else {
          reply = `✅ **Votre configuration est correcte !**\n\n`
          reply += `Tous les paramètres sont dans des plages appropriées. Vous pouvez procéder à l'expérience.\n\n`
          reply += `**Paramètres actuels :**\n`
          Object.entries(instrument.parameters).forEach(([key, param]) => {
            reply += `- ${param.label} : ${param.value.toFixed(2)} ${param.unit || ""}\n`
          })
        }
      } else if (lastMessage.includes("risque") || lastMessage.includes("danger") || lastMessage.includes("sécurité")) {
        reply = `**Consignes de sécurité pour ${instrument.name} :**\n\n`
        reply += `- Respectez toujours les plages de paramètres recommandées\n`
        reply += `- Ne dépassez pas les valeurs maximales indiquées\n`
        reply += `- Observez les données en temps réel pour détecter tout comportement anormal\n`
        reply += `- En cas de doute, réduisez les paramètres à des valeurs modérées\n`
      } else {
        // Réponse générique mais contextuelle
        reply = `Je peux vous aider avec le **${instrument.name}**. `
        reply += `Posez-moi une question spécifique sur son utilisation, sa configuration, ou l'interprétation des résultats. `
        reply += `Je peux aussi vérifier votre configuration actuelle si vous le souhaitez.`
      }
    } else {
      // Réponse générale sans instrument
      reply = `Bonjour ! Je suis l'assistant IA de Taalimia. `
      reply += `Je peux vous aider avec les simulations, les laboratoires virtuels, les évaluations, ou toute autre question sur la plateforme. `
      reply += `Que souhaitez-vous savoir ?`
    }

    return {
      reply,
      followUps: this.generateFollowUps(context),
      suggestedActions: this.generateSuggestedActions(context),
    }
  }

  private generateFollowUps(context?: ChatContext): string[] {
    if (context?.instrument) {
      return [
        "Comment interpréter les résultats ?",
        "Quels sont les paramètres recommandés ?",
        "Y a-t-il des risques à éviter ?",
      ]
    }
    return [
      "Que devrais-je travailler ensuite ?",
      "Explique-moi un concept clé",
      "Comment utiliser les laboratoires virtuels ?",
    ]
  }

  private generateSuggestedActions(context?: ChatContext): Array<{ label: string; target: string }> {
    const actions: Array<{ label: string; target: string }> = []

    if (context?.instrument) {
      actions.push({
        label: "Voir le guide d'utilisation",
        target: `/dashboard/resources?discipline=${context.instrument.discipline}&instrument=${encodeURIComponent(context.instrument.name)}`,
      })
      actions.push({
        label: "Consulter les tutoriels vidéo",
        target: `/dashboard/resources?type=video&discipline=${context.instrument.discipline}`,
      })
    }

    if (context?.discipline) {
      actions.push({
        label: `Simulations de ${context.discipline}`,
        target: `/dashboard/simulations?discipline=${context.discipline}`,
      })
    }

    return actions
  }
}

// Instance singleton
export const chatService = new ChatService()

