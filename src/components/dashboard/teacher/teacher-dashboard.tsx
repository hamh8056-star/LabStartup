"use client"

import { useCallback, useEffect, useMemo, useState, useTransition } from "react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { ChevronLeft, ChevronRight, Loader2, Pencil, PlusCircle, Search, Trash2, Upload, UserPlus, UserRoundPlus, X } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import type { Simulation } from "@/lib/data/seed"

type TeacherClass = {
  id: string
  name: string
  description: string
  discipline: string
  level: string
  studentIds: string[]
  createdAt: string
  updatedAt: string
}

type TeacherAssignment = {
  id: string
  classId: string
  simulationId: string
  title: string
  instructions: string
  dueDate: string | null
  status: "draft" | "active" | "closed"
  createdAt: string
  updatedAt: string
}

type TeacherDashboardProps = {
  simulations: Simulation[]
}

type ViewMode = "assignments" | "roster"

type RosterStudent = {
  id: string
  name: string
  email: string
  institution: string | null
}

export function TeacherDashboard({ simulations }: TeacherDashboardProps) {
  const [classes, setClasses] = useState<TeacherClass[]>([])
  const [assignments, setAssignments] = useState<TeacherAssignment[]>([])
  const [selectedClassId, setSelectedClassId] = useState<string>("")
  const [selectedView, setSelectedView] = useState<ViewMode>("assignments")
  const [isLoadingClasses, setIsLoadingClasses] = useState(true)
  const [isLoadingAssignments, setIsLoadingAssignments] = useState(true)
  const [isCreatingClass, startCreateClass] = useTransition()
  const [isSubmittingAssignment, startSubmitAssignment] = useTransition()
  const [isAddingStudent, startAddStudent] = useTransition()
  const [isUpdatingStudent, startUpdateStudent] = useTransition()
  const [isDeletingStudent, startDeleteStudent] = useTransition()
  const [isLoadingRoster, setIsLoadingRoster] = useState(false)
  const [roster, setRoster] = useState<RosterStudent[]>([])
  const [lastInviteInfo, setLastInviteInfo] = useState<string | null>(null)
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState("")
  const [editingInstitution, setEditingInstitution] = useState("")
  const [isImporting, setIsImporting] = useState(false)
  const [deletingStudentId, setDeletingStudentId] = useState<string | null>(null)
  const [sendInvitationEmail, setSendInvitationEmail] = useState(false)
  const [classNameDraft, setClassNameDraft] = useState("")
  const [classDisciplineDraft, setClassDisciplineDraft] = useState("")
  const [classLevelDraft, setClassLevelDraft] = useState("")
  const [classDescriptionDraft, setClassDescriptionDraft] = useState("")
  const [isUpdatingClass, startUpdateClass] = useTransition()
  const [isDeletingClass, startDeleteClass] = useTransition()
  const [deletingClassId, setDeletingClassId] = useState<string | null>(null)
  const [isUpdatingAssignment, startUpdateAssignment] = useTransition()
  const [isDeletingAssignment, startDeleteAssignment] = useTransition()
  const [deletingAssignmentId, setDeletingAssignmentId] = useState<string | null>(null)
  const [editingAssignmentId, setEditingAssignmentId] = useState<string | null>(null)
  const [assignmentTitleDraft, setAssignmentTitleDraft] = useState("")
  const [assignmentSimulationIdDraft, setAssignmentSimulationIdDraft] = useState("")
  const [assignmentDueDateDraft, setAssignmentDueDateDraft] = useState("")
  const [assignmentInstructionsDraft, setAssignmentInstructionsDraft] = useState("")
  const [activeModal, setActiveModal] = useState<null | "view" | "edit" | "enroll" | "assign" | "delete" | "editAssignment" | "deleteAssignment">(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [activeClassId, setActiveClassId] = useState<string | null>(null)
  const [activeAssignmentId, setActiveAssignmentId] = useState<string | null>(null)
  const [modalFeedback, setModalFeedback] = useState<string | null>(null)
  const [assignmentSearchQuery, setAssignmentSearchQuery] = useState("")
  const [assignmentCurrentPage, setAssignmentCurrentPage] = useState(1)
  const assignmentsPerPage = 5
  const [rosterSearchQuery, setRosterSearchQuery] = useState("")
  const [rosterCurrentPage, setRosterCurrentPage] = useState(1)
  const rosterPerPage = 5

  const classMap = useMemo(() => new Map(classes.map(klass => [klass.id, klass])), [classes])
  const simulationMap = useMemo(() => new Map(simulations.map(simulation => [simulation.id, simulation])), [simulations])

  const decoratedAssignments = useMemo(
    () =>
      assignments.map(assignment => ({
        ...assignment,
        className: classMap.get(assignment.classId)?.name ?? "Classe inconnue",
        simulationTitle: simulationMap.get(assignment.simulationId)?.title ?? assignment.simulationId,
      })),
    [assignments, classMap, simulationMap],
  )

  const filteredAssignments = useMemo(() => {
    let filtered = decoratedAssignments

    // Filtrer par classe sélectionnée
    if (selectedClassId) {
      filtered = filtered.filter(assignment => assignment.classId === selectedClassId)
    }

    // Filtrer par recherche
    if (assignmentSearchQuery.trim()) {
      const query = assignmentSearchQuery.toLowerCase().trim()
      filtered = filtered.filter(
        assignment =>
          assignment.title.toLowerCase().includes(query) ||
          assignment.className.toLowerCase().includes(query) ||
          assignment.simulationTitle.toLowerCase().includes(query) ||
          (assignment.instructions && assignment.instructions.toLowerCase().includes(query)),
      )
    }

    return filtered
  }, [decoratedAssignments, selectedClassId, assignmentSearchQuery])

  const paginatedAssignments = useMemo(() => {
    const startIndex = (assignmentCurrentPage - 1) * assignmentsPerPage
    const endIndex = startIndex + assignmentsPerPage
    return filteredAssignments.slice(startIndex, endIndex)
  }, [filteredAssignments, assignmentCurrentPage, assignmentsPerPage])

  const totalAssignmentPages = useMemo(() => {
    return Math.ceil(filteredAssignments.length / assignmentsPerPage)
  }, [filteredAssignments.length, assignmentsPerPage])

  // Réinitialiser la page si elle est hors limites
  useEffect(() => {
    if (assignmentCurrentPage > totalAssignmentPages && totalAssignmentPages > 0) {
      setAssignmentCurrentPage(1)
    }
  }, [assignmentCurrentPage, totalAssignmentPages])

  const filteredRoster = useMemo(() => {
    if (!rosterSearchQuery.trim()) {
      return roster
    }

    const query = rosterSearchQuery.toLowerCase().trim()
    return roster.filter(
      student =>
        (student.name && student.name.toLowerCase().includes(query)) ||
        student.email.toLowerCase().includes(query) ||
        (student.institution && student.institution.toLowerCase().includes(query)),
    )
  }, [roster, rosterSearchQuery])

  const paginatedRoster = useMemo(() => {
    const startIndex = (rosterCurrentPage - 1) * rosterPerPage
    const endIndex = startIndex + rosterPerPage
    return filteredRoster.slice(startIndex, endIndex)
  }, [filteredRoster, rosterCurrentPage, rosterPerPage])

  const totalRosterPages = useMemo(() => {
    return Math.ceil(filteredRoster.length / rosterPerPage)
  }, [filteredRoster.length, rosterPerPage])

  // Réinitialiser la page si elle est hors limites
  useEffect(() => {
    if (rosterCurrentPage > totalRosterPages && totalRosterPages > 0) {
      setRosterCurrentPage(1)
    }
  }, [rosterCurrentPage, totalRosterPages])

  const selectedClass = useMemo(() => {
    if (!classes.length) {
      return undefined
    }
    const match = classes.find(current => current.id === selectedClassId)
    return match ?? classes[0]
  }, [classes, selectedClassId])

  const totalStudents = useMemo(
    () => classes.reduce((sum, klass) => sum + (klass.studentIds?.length ?? 0), 0),
    [classes],
  )
  const totalAssignments = assignments.length
  const activeAssignments = useMemo(
    () => assignments.filter(assignment => assignment.status === "active").length,
    [assignments],
  )

  const handleSelectClass = useCallback(
    (classId: string, options?: { focus?: "students" | "assignments" | "overview" }) => {
      setSelectedClassId(classId)

      if (options?.focus === "students") {
        setSelectedView("roster")
      } else if (options?.focus === "assignments") {
        setSelectedView("assignments")
      }
    },
    [],
  )

  const fetchClasses = useCallback(async () => {
    setIsLoadingClasses(true)
    try {
      const response = await fetch("/api/teacher/classes", { cache: "no-store" })
      
      if (!response.ok) {
        let errorData: { message?: string; error?: string } = {}
        let errorMessage = "Impossible de récupérer les classes."
        
        try {
          const contentType = response.headers.get("content-type")
          if (contentType && contentType.includes("application/json")) {
            errorData = await response.json()
            errorMessage = errorData.message || errorData.error || errorMessage
          } else {
            const text = await response.text()
            errorMessage = text || errorMessage
          }
        } catch (parseError) {
          console.warn("[TeacherDashboard] Could not parse error response:", parseError)
        }
        
        if (response.status === 403) {
          console.error("[TeacherDashboard] Access denied:", {
            status: response.status,
            statusText: response.statusText,
            errorData,
            errorMessage,
          })
          
          const description = errorMessage.includes("Rôle requis") || errorMessage.includes("rôle actuel")
            ? errorMessage
            : errorMessage.includes("Session non trouvée") || errorMessage.includes("ID utilisateur manquant")
            ? "Votre session a expiré. Veuillez vous reconnecter."
            : "Vous devez être connecté avec un compte enseignant pour accéder à cette fonctionnalité."
          
          toast.error("Accès refusé", { description })
        } else {
          throw new Error(errorMessage)
        }
        return
      }
      
      const payload = (await response.json()) as { classes?: TeacherClass[] }
      setClasses(payload.classes ?? [])
      if (!selectedClassId && payload.classes?.length) {
        setSelectedClassId(payload.classes[0].id)
      }
    } catch (error) {
      console.error("[TeacherDashboard] Error fetching classes:", error)
      const errorMessage = error instanceof Error ? error.message : "Impossible de charger vos classes."
      toast.error(errorMessage)
    } finally {
      setIsLoadingClasses(false)
    }
  }, [selectedClassId])

  const fetchAssignments = useCallback(async () => {
    setIsLoadingAssignments(true)
    try {
      const query = selectedClassId ? `?classId=${encodeURIComponent(selectedClassId)}` : ""
      const response = await fetch(`/api/teacher/assignments${query}`, { cache: "no-store" })
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.message || "Impossible de récupérer les assignations."
        throw new Error(errorMessage)
      }
      const payload = (await response.json()) as { assignments?: TeacherAssignment[] }
      setAssignments(payload.assignments ?? [])
    } catch (error) {
      console.error("[TeacherDashboard] Error fetching assignments:", error)
      const errorMessage = error instanceof Error ? error.message : "Impossible de charger vos assignations."
      toast.error(errorMessage)
    } finally {
      setIsLoadingAssignments(false)
    }
  }, [selectedClassId])

  const fetchRoster = useCallback(
    async (classId: string) => {
      setIsLoadingRoster(true)
      try {
        const response = await fetch(`/api/teacher/classes/${classId}/students`, { cache: "no-store" })
        if (!response.ok) {
          throw new Error("Impossible de récupérer les étudiants.")
        }
        const payload = (await response.json()) as { students?: RosterStudent[] }
        const sorted = (payload.students ?? []).sort((a, b) => {
          const labelA = (a.name || a.email).toLowerCase()
          const labelB = (b.name || b.email).toLowerCase()
          return labelA.localeCompare(labelB)
        })
        setRoster(sorted)
      } catch (error) {
        console.error(error)
        setRoster([])
        toast.error("Impossible de charger les étudiants de la classe sélectionnée.")
      } finally {
        setIsLoadingRoster(false)
      }
    },
    [toast],
  )

  useEffect(() => {
    void fetchClasses()
  }, [fetchClasses])

  useEffect(() => {
    void fetchAssignments()
  }, [fetchAssignments])

  useEffect(() => {
    if (!selectedClassId) {
      setRoster([])
      return
    }

    void fetchRoster(selectedClassId)
  }, [selectedClassId, fetchRoster])

  useEffect(() => {
    setEditingStudentId(null)
    setEditingName("")
    setEditingInstitution("")
    setClassNameDraft("")
    setClassDisciplineDraft("")
    setClassLevelDraft("")
    setClassDescriptionDraft("")
    setLastInviteInfo(null)
  }, [selectedClassId])

  const handleCreateClass = (formData: FormData, options?: { onSuccess?: () => void }) => {
    const name = (formData.get("name") as string | null)?.trim()
    const discipline = (formData.get("discipline") as string | null)?.trim()
    const level = (formData.get("level") as string | null)?.trim()
    const description = (formData.get("description") as string | null)?.trim() ?? ""

    if (!name || !discipline || !level) {
      toast.error("Merci de renseigner le nom, la discipline et le niveau.")
      return
    }

    startCreateClass(async () => {
      const response = await fetch("/api/teacher/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, discipline, level, description }),
      })

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { message?: string } | null
        toast.error(payload?.message ?? "Impossible de créer la classe.")
        return
      }

      const payload = (await response.json()) as { class: TeacherClass }
      toast.success("Classe créée", { description: "Vous pouvez maintenant y assigner des simulations." })
      setSelectedClassId(payload.class.id)
      options?.onSuccess?.()
      await fetchClasses()
    })
  }

  const handleSubmitAssignment = (
    formData: FormData,
    targetClassId?: string,
    options?: { onSuccess?: () => void },
  ) => {
    const formClassId = (formData.get("classId") as string | null) ?? undefined
    const classId = targetClassId ?? formClassId
    const simulationId = (formData.get("simulationId") as string | null) ?? ""
    const title = (formData.get("title") as string | null)?.trim()
    const dueDate = (formData.get("dueDate") as string | null) ?? undefined
    const instructions = (formData.get("instructions") as string | null)?.trim() ?? ""

    if (!classId || !simulationId || !title) {
      toast.error("Merci de préciser la classe, la simulation et le titre.")
      return
    }

    startSubmitAssignment(async () => {
      const response = await fetch("/api/teacher/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classId,
          simulationId,
          title,
          dueDate: dueDate && dueDate.length ? new Date(dueDate).toISOString() : undefined,
          instructions,
        }),
      })

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { message?: string } | null
        toast.error(payload?.message ?? "Impossible d'enregistrer l'assignation.")
        return
      }

      toast.success("Assignation planifiée", {
        description: "Les apprenants seront notifiés automatiquement.",
      })
      setSelectedClassId(classId)
      options?.onSuccess?.()
      await fetchAssignments()
      if (targetClassId) {
        setModalFeedback("Assignation créée avec succès.")
      }
    })
  }

  const handleUpdateAssignment = (assignmentId: string) => {
    const assignment = assignments.find(a => a.id === assignmentId)
    if (!assignment) return

    const title = assignmentTitleDraft.trim()
    const simulationId = assignmentSimulationIdDraft.trim()
    const dueDate = assignmentDueDateDraft.trim() || undefined
    const instructions = assignmentInstructionsDraft.trim() || undefined

    if (!title || !simulationId) {
      toast.error("Merci de renseigner le titre et la simulation.")
      return
    }

    startUpdateAssignment(async () => {
      const response = await fetch(`/api/teacher/assignments/${assignmentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          simulationId,
          dueDate: dueDate ? new Date(dueDate).toISOString() : null,
          instructions,
        }),
      })

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { message?: string } | null
        toast.error(payload?.message ?? "Impossible de mettre à jour l'assignation.")
        return
      }

      toast.success("Assignation mise à jour", {
        description: "Les modifications ont été enregistrées.",
      })
      closeModal()
      await fetchAssignments()
    })
  }

  const handleDeleteAssignment = (assignmentId: string) => {
    startDeleteAssignment(async () => {
      setDeletingAssignmentId(assignmentId)
      try {
        const response = await fetch(`/api/teacher/assignments/${assignmentId}`, {
          method: "DELETE",
        })

        if (!response.ok && response.status !== 404) {
          const payload = (await response.json().catch(() => null)) as { message?: string } | null
          toast.error(payload?.message ?? "Impossible de supprimer l'assignation.")
          return
        }

        toast.success("Assignation supprimée", {
          description: "L'assignation a été retirée avec succès.",
        })
        closeModal()
        await fetchAssignments()
      } finally {
        setDeletingAssignmentId(null)
      }
    })
  }

  const handleStartEditAssignment = (assignment: TeacherAssignment) => {
    setEditingAssignmentId(assignment.id)
    setAssignmentTitleDraft(assignment.title)
    setAssignmentSimulationIdDraft(assignment.simulationId)
    setAssignmentDueDateDraft(assignment.dueDate ? format(new Date(assignment.dueDate), "yyyy-MM-dd") : "")
    setAssignmentInstructionsDraft(assignment.instructions ?? "")
    setActiveAssignmentId(assignment.id)
    openModal("editAssignment")
  }

  const handleCancelEditAssignment = () => {
    setEditingAssignmentId(null)
    setAssignmentTitleDraft("")
    setAssignmentSimulationIdDraft("")
    setAssignmentDueDateDraft("")
    setAssignmentInstructionsDraft("")
    setActiveAssignmentId(null)
  }

  const handleAddStudent = (
    formData: FormData,
    targetClassId?: string,
    options?: { onSuccess?: () => void; showPasswords?: boolean },
  ) => {
    const classId = targetClassId ?? selectedClass?.id
    if (!classId) {
      toast.error("Sélectionnez d'abord une classe.")
      return
    }

    const email = (formData.get("email") as string | null)?.trim()
    const name = (formData.get("studentName") as string | null)?.trim()
    const institution = (formData.get("studentInstitution") as string | null)?.trim()

    if (!email || !name) {
      toast.error("Merci de renseigner le nom et l'email de l'étudiant.")
      return
    }

    startAddStudent(async () => {
      const response = await fetch(`/api/teacher/classes/${classId}/students`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, institution, sendInvitationEmail: sendInvitationEmail }),
      })

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { message?: string } | null
        toast.error(payload?.message ?? "Impossible d'ajouter l'étudiant.")
        return
      }

      const payload = (await response.json()) as {
        student: RosterStudent
        created: boolean
        temporaryPassword?: string
        invitationSent?: boolean
      }

      if (payload.created) {
        if (sendInvitationEmail && payload.invitationSent) {
          toast.success("Invitation envoyée", {
            description: `Un email d'invitation a été envoyé à ${email} avec un lien pour définir son mot de passe.`,
          })
        } else {
          toast.success("Étudiant créé", {
            description: payload.temporaryPassword
              ? `Mot de passe temporaire : ${payload.temporaryPassword} - Partagez-le avec l'étudiant.`
              : "Un mot de passe provisoire a été généré, partagez-le avec l'étudiant.",
          })
        }
      } else {
        if (sendInvitationEmail && payload.invitationSent) {
          toast.success("Invitation envoyée", {
            description: `Un email d'invitation a été envoyé à ${email} pour rejoindre la classe.`,
          })
        } else {
          toast.success("Étudiant ajouté", {
            description: "L'étudiant a été associé à la classe.",
          })
        }
      }

      if (payload.temporaryPassword && !sendInvitationEmail) {
        const message = `Mot de passe provisoire pour ${payload.student.email} : ${payload.temporaryPassword}`
        if (classId === selectedClassId) {
          setLastInviteInfo(message)
        }
        if (targetClassId) {
          setModalFeedback(message)
        }
      } else {
        if (classId === selectedClassId) {
          setLastInviteInfo(null)
        }
        if (targetClassId) {
          setModalFeedback(null)
        }
      }

      if (classId === selectedClassId) {
        setRoster(prev => {
          const filtered = prev.filter(student => student.id !== payload.student.id)
          return [...filtered, payload.student].sort((a, b) =>
            (a.name || a.email).toLowerCase().localeCompare((b.name || b.email).toLowerCase()),
          )
        })
      }

      options?.onSuccess?.()
      await fetchClasses()
    })
  }

  const handleStartEditStudent = (student: RosterStudent) => {
    setEditingStudentId(student.id)
    setEditingName(student.name ?? "")
    setEditingInstitution(student.institution ?? "")
  }

  const handleCancelEditStudent = () => {
    setEditingStudentId(null)
    setEditingName("")
    setEditingInstitution("")
  }

  const handleUpdateStudent = () => {
    const classId = selectedClass?.id
    if (!classId || !editingStudentId) {
      toast.error("Sélectionnez un étudiant à modifier.")
      return
    }

    const trimmedName = editingName.trim()
    const trimmedInstitution = editingInstitution.trim()

    if (!trimmedName) {
      toast.error("Le nom de l'étudiant est obligatoire.")
      return
    }

    startUpdateStudent(async () => {
      const response = await fetch(`/api/teacher/classes/${classId}/students/${editingStudentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmedName,
          institution: trimmedInstitution.length ? trimmedInstitution : null,
        }),
      })

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { message?: string } | null
        toast.error(payload?.message ?? "Impossible de modifier l'étudiant.")
        return
      }

      const payload = (await response.json()) as { student: RosterStudent }
      setRoster(prev =>
        prev
          .map(student => (student.id === payload.student.id ? payload.student : student))
          .sort((a, b) =>
            (a.name || a.email).toLowerCase().localeCompare((b.name || b.email).toLowerCase()),
          ),
      )
      toast.success("Étudiant mis à jour.")
      handleCancelEditStudent()
    })
  }

  const handleDeleteStudent = (studentId: string) => {
    const classId = selectedClass?.id
    if (!classId) {
      toast.error("Sélectionnez une classe.")
      return
    }

    startDeleteStudent(async () => {
      setDeletingStudentId(studentId)
      try {
        const response = await fetch(`/api/teacher/classes/${classId}/students/${studentId}`, {
          method: "DELETE",
        })

        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as { message?: string } | null
          toast.error(payload?.message ?? "Impossible de retirer l'étudiant.")
          return
        }

        setRoster(prev => prev.filter(student => student.id !== studentId))
        toast.success("Étudiant retiré de la classe.")

        if (editingStudentId === studentId) {
          handleCancelEditStudent()
        }
      } finally {
        setDeletingStudentId(null)
      }
    })
  }

  const handleImportCsv = async (file: File, targetClassId?: string) => {
    const classId = targetClassId ?? selectedClass?.id
    if (!classId) {
      toast.error("Sélectionnez d'abord une classe.")
      return
    }

    setIsImporting(true)
    setLastInviteInfo(null)

    try {
      const text = await file.text()
      const lines = text.split(/\r?\n/).map(line => line.trim())
      const rows = lines.filter(line => line.length > 0)

      if (!rows.length) {
        toast.error("Le fichier CSV est vide.")
        return
      }

      let header = rows[0].split(",").map(cell => cell.trim().toLowerCase())
      let dataRows = rows.slice(1)

      if (header.length < 2 || !header.includes("name") || !header.includes("email")) {
        header = ["name", "email", "institution"]
        dataRows = rows
      }

      const indexOf = (key: string) => header.findIndex(column => column === key)
      const nameIndex = indexOf("name")
      const emailIndex = indexOf("email")
      const institutionIndex = indexOf("institution")

      if (nameIndex === -1 || emailIndex === -1) {
        toast.error("Le fichier CSV doit contenir au minimum les colonnes name et email.")
        return
      }

      let successCount = 0
      const passwordInfos: string[] = []

      for (const row of dataRows) {
        const cells = row.split(",").map(cell => cell.trim())
        if (!cells[emailIndex] || !cells[nameIndex]) {
          continue
        }

        const email = cells[emailIndex]
        const name = cells[nameIndex]
        const institution = institutionIndex !== -1 ? cells[institutionIndex] : ""

        const response = await fetch(`/api/teacher/classes/${classId}/students`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, name, institution }),
        })

        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as { message?: string } | null
          toast.error(payload?.message ?? `Impossible d'ajouter ${email}.`)
          continue
        }

        const payload = (await response.json()) as {
          student: RosterStudent
          created: boolean
          temporaryPassword?: string
        }

        setRoster(prev =>
          prev
            .filter(student => student.id !== payload.student.id)
            .concat(payload.student)
            .sort((a, b) =>
              (a.name || a.email).toLowerCase().localeCompare((b.name || b.email).toLowerCase()),
            ),
        )

        if (payload.temporaryPassword) {
          passwordInfos.push(`${payload.student.email}: ${payload.temporaryPassword}`)
        }

        successCount += 1
      }

      toast.success(`Import terminé (${successCount} étudiants ajoutés).`)

      if (passwordInfos.length) {
      const message = `Mots de passe provisoires:\n${passwordInfos.join("\n")}`
      if (!targetClassId || targetClassId === selectedClassId) {
        setLastInviteInfo(message)
      }
      setModalFeedback(message)
      }

      await fetchClasses()
    } catch (error) {
      console.error(error)
      toast.error("Impossible de traiter le fichier CSV.")
    } finally {
      setIsImporting(false)
    }
  }

  const renderAssignments = () => {
    if (isLoadingAssignments) {
  return (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Chargement des assignations...
        </div>
      )
    }

    if (!filteredAssignments.length) {
      return (
        <p className="text-sm text-muted-foreground">
          Aucune assignation pour le moment. Utilisez le formulaire ci-dessus pour planifier une simulation.
        </p>
      )
    }

    return (
      <>
        <div className="space-y-3">
          {paginatedAssignments.map(assignment => (
            <div key={assignment.id} className="rounded-2xl border border-border/60 bg-muted/20 p-4 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex-1 min-w-[250px]">
                  <p className="font-semibold text-foreground">{assignment.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {assignment.className} • {assignment.simulationTitle}
                    {assignment.dueDate ? ` • Échéance ${format(new Date(assignment.dueDate), "PPP", { locale: fr })}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="capitalize">
                    {assignment.status === "draft"
                      ? "Brouillon"
                      : assignment.status === "active"
                        ? "En cours"
                        : "Clôturée"}
                  </Badge>
                  <Button
                    variant="outline"
                    size="icon"
                    className="size-8"
                    onClick={() => handleStartEditAssignment(assignment)}
                    disabled={isUpdatingAssignment || isDeletingAssignment}
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon"
                    className="size-8"
                    onClick={() => {
                      setActiveAssignmentId(assignment.id)
                      openModal("deleteAssignment")
                    }}
                    disabled={isUpdatingAssignment || isDeletingAssignment}
                  >
                    {isDeletingAssignment && deletingAssignmentId === assignment.id ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Trash2 className="size-4" />
                    )}
                  </Button>
                </div>
              </div>
              {assignment.instructions ? (
                <p className="mt-3 text-sm text-muted-foreground">{assignment.instructions}</p>
              ) : null}
              <div className="mt-3 text-xs text-muted-foreground">
                Créée le {format(new Date(assignment.createdAt), "PPPp", { locale: fr })}
              </div>
            </div>
          ))}
        </div>

        {totalAssignmentPages > 1 && (
          <div className="flex items-center justify-between gap-4 pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              Page {assignmentCurrentPage} sur {totalAssignmentPages} • {filteredAssignments.length} assignation{filteredAssignments.length > 1 ? "s" : ""}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAssignmentCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={assignmentCurrentPage === 1}
              >
                <ChevronLeft className="size-4" />
                Précédent
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAssignmentCurrentPage(prev => Math.min(totalAssignmentPages, prev + 1))}
                disabled={assignmentCurrentPage === totalAssignmentPages}
              >
                Suivant
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        )}
      </>
    )
  }

  const renderRoster = () => {
    if (!selectedClass) {
      return (
        <p className="text-sm text-muted-foreground">
          Sélectionnez ou créez une classe pour consulter ses membres.
        </p>
      )
    }

    if (isLoadingRoster) {
      return (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Chargement de la liste des étudiants...
        </div>
      )
    }

    if (!roster.length) {
      return (
        <p className="text-sm text-muted-foreground">
          Aucun étudiant inscrit pour cette classe. Utilisez le formulaire ci-dessus pour en ajouter.
        </p>
      )
    }

    if (!filteredRoster.length) {
      return (
        <p className="text-sm text-muted-foreground">
          Aucun étudiant ne correspond à votre recherche.
        </p>
      )
    }

    return (
      <>
        <div className="space-y-3 text-sm">
          {paginatedRoster.map(student => (
          <div key={student.id} className="rounded-2xl border border-border/60 bg-muted/20 p-4">
            {editingStudentId === student.id ? (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-2 flex-1 min-w-[200px]">
                    <Label className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Nom complet</Label>
                    <Input
                      value={editingName}
                      onChange={event => setEditingName(event.target.value)}
                      disabled={isUpdatingStudent}
                    />
                  </div>
                  <div className="space-y-2 flex-1 min-w-[200px]">
                    <Label className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Institution</Label>
                    <Input
                      value={editingInstitution}
                      onChange={event => setEditingInstitution(event.target.value)}
                      placeholder="Université Ferhat Abbas Sétif 1"
                      disabled={isUpdatingStudent}
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">{student.email}</p>
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={handleCancelEditStudent}
                    disabled={isUpdatingStudent}
                  >
                    <X className="size-4" />
                    Annuler
                  </Button>
                  <Button size="sm" className="gap-2" onClick={handleUpdateStudent} disabled={isUpdatingStudent}>
                    {isUpdatingStudent ? <Loader2 className="size-4 animate-spin" /> : <UserRoundPlus className="size-4" />}
                    {isUpdatingStudent ? "Enregistrement..." : "Enregistrer"}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex-1 min-w-[200px]">
                  <p className="font-semibold text-foreground">{student.name || student.email}</p>
                  <p className="text-xs text-muted-foreground">{student.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{student.institution ?? "Étudiant"}</Badge>
                  <Button
                    variant="outline"
                    size="icon"
                    className="size-8"
                    onClick={() => handleStartEditStudent(student)}
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon"
                    className="size-8"
                    onClick={() => handleDeleteStudent(student.id)}
                    disabled={isDeletingStudent && deletingStudentId === student.id}
                  >
                    {isDeletingStudent && deletingStudentId === student.id ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Trash2 className="size-4" />
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
          ))}
        </div>

        {totalRosterPages > 1 && (
          <div className="flex items-center justify-between gap-4 pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              Page {rosterCurrentPage} sur {totalRosterPages} • {filteredRoster.length} étudiant{filteredRoster.length > 1 ? "s" : ""}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRosterCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={rosterCurrentPage === 1}
              >
                <ChevronLeft className="size-4" />
                Précédent
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRosterCurrentPage(prev => Math.min(totalRosterPages, prev + 1))}
                disabled={rosterCurrentPage === totalRosterPages}
              >
                Suivant
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        )}
      </>
    )
  }

  const handleCancelEditClass = () => {
    setClassNameDraft("")
    setClassDisciplineDraft("")
    setClassLevelDraft("")
    setClassDescriptionDraft("")
  }

  const modalClass = useMemo(() => {
    if (!activeClassId) {
      return null
    }
    return classMap.get(activeClassId) ?? null
  }, [activeClassId, classMap])

  const modalAssignment = useMemo(() => {
    if (!activeAssignmentId) {
      return null
    }
    return assignments.find(a => a.id === activeAssignmentId) ?? null
  }, [activeAssignmentId, assignments])

  const openModal = (type: "view" | "edit" | "enroll" | "assign" | "delete" | "editAssignment" | "deleteAssignment", klass?: TeacherClass) => {
    setIsCreateModalOpen(false)
    if (klass) {
      setActiveClassId(klass.id)
      setSelectedClassId(klass.id)
    }
    setModalFeedback(null)
    if (type === "enroll") {
      setSendInvitationEmail(false)
    }

    if (type === "edit" && klass) {
      setClassNameDraft(klass.name)
      setClassDisciplineDraft(klass.discipline)
      setClassLevelDraft(klass.level)
      setClassDescriptionDraft(klass.description ?? "")
    }

    setActiveModal(type)
  }

  const closeModal = () => {
    setActiveModal(null)
    setIsCreateModalOpen(false)
    setActiveClassId(null)
    setModalFeedback(null)
    handleCancelEditClass()
  }

  const handleUpdateClass = () => {
    const klass = modalClass ?? selectedClass
    if (!klass) return

    const name = classNameDraft.trim()
    const discipline = classDisciplineDraft.trim()
    const level = classLevelDraft.trim()
    const description = classDescriptionDraft.trim()

    if (!name || !discipline || !level) {
      toast.error("Merci de renseigner le nom, la discipline et le niveau.")
      return
    }

    startUpdateClass(async () => {
      const response = await fetch(`/api/teacher/classes/${klass.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, discipline, level, description }),
      })

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { message?: string } | null
        toast.error(payload?.message ?? "Impossible de mettre à jour la classe.")
        return
      }

      toast.success("Classe mise à jour.")
      handleCancelEditClass()
      await fetchClasses()
      closeModal()
    })
  }

  const handleDeleteClass = (targetClass?: TeacherClass) => {
    const klass = targetClass ?? selectedClass
    if (!klass) return

    startDeleteClass(async () => {
      setDeletingClassId(klass.id)
      try {
        const response = await fetch(`/api/teacher/classes/${klass.id}`, {
          method: "DELETE",
        })

        if (!response.ok && response.status !== 404) {
          const payload = (await response.json().catch(() => null)) as { message?: string } | null
          toast.error(payload?.message ?? "Impossible de supprimer la classe.")
          return
        }

        toast.success("Classe supprimée.")
        setClasses(prev => prev.filter(entry => entry.id !== klass.id))
        setAssignments(prev => prev.filter(entry => entry.classId !== klass.id))
        setSelectedClassId(prev => (prev === klass.id ? "" : prev))
        setRoster([])
        await fetchClasses()
        closeModal()
      } finally {
        setDeletingClassId(null)
      }
    })
  }

  const renderClassesTable = () => {
    return (
      <Card className="border-border/60 bg-card/90">
        <CardHeader className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex-1 min-w-[300px]">
            <CardTitle className="text-lg">Classes disponibles</CardTitle>
            <p className="text-sm text-muted-foreground">
              Gérez vos groupes, inscrivez des étudiants et planifiez vos simulations.
            </p>
          </div>
          <Button
            className="gap-2"
            onClick={() => {
              handleCancelEditClass()
              setModalFeedback(null)
              setIsCreateModalOpen(true)
            }}
          >
            <PlusCircle className="size-4" />
            Ajouter une classe
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoadingClasses ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Chargement des classes...
            </div>
          ) : classes.length ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Classe</TableHead>
                    <TableHead>Discipline</TableHead>
                    <TableHead>Niveau</TableHead>
                    <TableHead>Étudiants</TableHead>
                    <TableHead>Assignations</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {classes.map(klass => {
                    const isActive = selectedClass?.id === klass.id
                    const classAssignments = assignments.filter(assignment => assignment.classId === klass.id)
                    const classActiveAssignments = classAssignments.filter(assignment => assignment.status === "active").length

                    return (
                      <TableRow key={klass.id} className={isActive ? "bg-muted/40" : undefined}>
                        <TableCell className="font-medium text-foreground">{klass.name}</TableCell>
                        <TableCell>{klass.discipline}</TableCell>
                        <TableCell>{klass.level}</TableCell>
                        <TableCell>{klass.studentIds.length}</TableCell>
                        <TableCell>
                          {classActiveAssignments}/{classAssignments.length}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant={isActive ? "secondary" : "outline"}
                              size="sm"
                              onClick={() => openModal("view", klass)}
                            >
                              Voir
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openModal("edit", klass)}
                            >
                              Modifier
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openModal("enroll", klass)}
                            >
                              Inscrire
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openModal("assign", klass)}
                            >
                              Assigner
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => openModal("delete", klass)}
                              disabled={isDeletingClass && deletingClassId === klass.id}
                            >
                              {isDeletingClass && deletingClassId === klass.id ? (
                                <Loader2 className="size-4 animate-spin" />
                              ) : (
                                "Supprimer"
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Aucune classe pour le moment. Utilisez le formulaire ci-dessous pour en créer une.
            </p>
          )}
        </CardContent>
      </Card>
    )
  }

  const renderClassModals = () => {
    const klass = modalClass

    return (
      <>
        <Dialog open={activeModal === "view"} onOpenChange={open => (!open ? closeModal() : null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{klass?.name ?? "Classe"}</DialogTitle>
              <DialogDescription>
                {klass ? `${klass.discipline} • ${klass.level}` : "Classe non disponible."}
              </DialogDescription>
            </DialogHeader>
            {klass ? (
              <div className="space-y-4 text-sm text-muted-foreground">
                <p>{klass.description?.length ? klass.description : "Aucune description enregistrée."}</p>
                <div className="grid gap-2 grid-cols-3">
                  <div className="rounded-xl border border-border/60 bg-muted/30 p-3">
                    <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Créée le</p>
                    <p className="mt-1 font-medium text-foreground">
                      {format(new Date(klass.createdAt), "PPP", { locale: fr })}
                    </p>
                  </div>
                  <div className="rounded-xl border border-border/60 bg-muted/30 p-3">
                    <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Étudiants</p>
                    <p className="mt-1 font-medium text-foreground">{klass.studentIds.length}</p>
                  </div>
                  <div className="rounded-xl border border-border/60 bg-muted/30 p-3">
                    <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Assignations</p>
                    <p className="mt-1 font-medium text-foreground">
                      {assignments.filter(assignment => assignment.classId === klass.id).length}
                    </p>
                  </div>
                </div>
              </div>
            ) : null}
            <DialogFooter>
              <Button variant="outline" onClick={closeModal}>
                Fermer
              </Button>
              {klass ? (
                <Button onClick={() => openModal("edit", klass)} className="gap-2">
                  <Pencil className="size-4" />
                  Modifier
                </Button>
              ) : null}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={activeModal === "edit"} onOpenChange={open => (!open ? closeModal() : null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Modifier la classe</DialogTitle>
              <DialogDescription>Actualisez les informations avant de sauvegarder.</DialogDescription>
            </DialogHeader>
          <form
              className="space-y-4"
            onSubmit={event => {
              event.preventDefault()
                handleUpdateClass()
            }}
          >
            <div className="space-y-2">
                <Label>Nom</Label>
                <Input value={classNameDraft} onChange={event => setClassNameDraft(event.target.value)} required disabled={isUpdatingClass} />
              </div>
              <div className="grid gap-3 grid-cols-2">
                <div className="space-y-2">
                  <Label>Discipline</Label>
                  <Input
                    value={classDisciplineDraft}
                    onChange={event => setClassDisciplineDraft(event.target.value)}
                    required
                    disabled={isUpdatingClass}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Niveau</Label>
                  <Input
                    value={classLevelDraft}
                    onChange={event => setClassLevelDraft(event.target.value)}
                    required
                    disabled={isUpdatingClass}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={classDescriptionDraft}
                  onChange={event => setClassDescriptionDraft(event.target.value)}
                  placeholder="Notes ou objectifs spécifiques pour cette classe."
                  disabled={isUpdatingClass}
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={closeModal} disabled={isUpdatingClass}>
                  Annuler
                </Button>
                <Button type="submit" className="gap-2" disabled={isUpdatingClass}>
                  {isUpdatingClass ? <Loader2 className="size-4 animate-spin" /> : <UserRoundPlus className="size-4" />}
                  {isUpdatingClass ? "Enregistrement..." : "Enregistrer"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={activeModal === "enroll"} onOpenChange={open => (!open ? closeModal() : null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl">Inscrire un étudiant</DialogTitle>
              <DialogDescription className="text-base">
                Ajoutez un nouvel étudiant ou rattachez un compte existant à la classe <strong>{klass?.name ?? ""}</strong>.
              </DialogDescription>
            </DialogHeader>
            {klass ? (
              <div className="space-y-6">
                <form
                  className="grid gap-4 grid-cols-2"
                  onSubmit={event => {
                    event.preventDefault()
                    const form = event.currentTarget
                    handleAddStudent(new FormData(form), klass.id, {
                      onSuccess: () => {
                        form.reset()
                        setSendInvitationEmail(false)
                        closeModal()
                      },
                    })
                  }}
                >
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Nom complet *</Label>
                    <Input 
                      name="studentName" 
                      placeholder="Ex. Sara Kaci" 
                      disabled={isAddingStudent} 
                      required 
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Email académique *</Label>
                    <Input 
                      name="email" 
                      type="email" 
                      placeholder="etudiant@exemple.com" 
                      disabled={isAddingStudent} 
                      required 
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label className="text-sm font-medium">Institution (optionnel)</Label>
                    <Input 
                      name="studentInstitution" 
                      placeholder="Université Ferhat Abbas Sétif 1" 
                      disabled={isAddingStudent} 
                      className="h-10"
                    />
                  </div>
                  <div className="col-span-2 space-y-3">
                    <div className="flex items-start space-x-3 p-4 rounded-lg border border-border/60 bg-muted/30">
                      <input
                        type="checkbox"
                        id="sendInvitationEmail"
                        name="sendInvitationEmail"
                        checked={sendInvitationEmail}
                        onChange={e => setSendInvitationEmail(e.target.checked)}
                        disabled={isAddingStudent}
                        className="mt-1 size-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <div className="flex-1 space-y-1">
                        <Label htmlFor="sendInvitationEmail" className="text-sm font-medium cursor-pointer">
                          Envoyer une invitation par email
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          L'étudiant recevra un email avec un lien pour définir son mot de passe et accéder à la plateforme.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="col-span-2 flex items-center justify-end gap-3 pt-2">
                    <Button type="button" variant="outline" onClick={closeModal} disabled={isAddingStudent} className="h-10">
                      Annuler
                    </Button>
                    <Button type="submit" className="gap-2 h-10" disabled={isAddingStudent}>
                      {isAddingStudent ? <Loader2 className="size-4 animate-spin" /> : <UserPlus className="size-4" />}
                      {isAddingStudent ? "Traitement..." : sendInvitationEmail ? "Inviter par email" : "Ajouter"}
                    </Button>
                  </div>
                </form>
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed border-primary/30 bg-primary/5 p-3 text-xs text-primary">
                  <div className="space-y-1">
                    <p className="font-semibold text-primary">Import CSV</p>
                    <p>Colonnes attendues : name,email,institution (en-tête optionnelle). Une ligne par étudiant.</p>
                  </div>
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-primary/40 px-3 py-2 text-primary hover:bg-primary/10">
                    <Upload className="size-4" />
                    {isImporting ? "Import..." : "Choisir un fichier"}
                    <input
                      type="file"
                      accept=".csv,text/csv"
                      className="hidden"
                      disabled={isImporting}
                      onChange={event => {
                        const file = event.target.files?.[0]
                        if (file) {
                          void handleImportCsv(file, klass.id)
                          event.target.value = ""
                        }
                      }}
                    />
                  </label>
                </div>
                {modalFeedback ? (
                  <div className="rounded-xl border border-dashed border-primary/40 bg-primary/5 p-3 text-xs text-primary whitespace-pre-wrap">
                    {modalFeedback}
                  </div>
                ) : null}
              </div>
            ) : null}
          </DialogContent>
        </Dialog>

        <Dialog open={activeModal === "assign"} onOpenChange={open => (!open ? closeModal() : null)}>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl">Assigner une simulation</DialogTitle>
              <DialogDescription className="text-base">
                Planifiez une expérience immersive pour la classe <strong>{klass?.name ?? ""}</strong>.
              </DialogDescription>
            </DialogHeader>
            {klass ? (
              <form
                className="grid gap-4 grid-cols-2"
                onSubmit={event => {
                  event.preventDefault()
                  const form = event.currentTarget
                  const formData = new FormData(form)
                  formData.set("classId", klass.id)
                  handleSubmitAssignment(formData, klass.id, {
                    onSuccess: () => {
                      form.reset()
                      closeModal()
                    },
                  })
                }}
              >
                <input type="hidden" name="classId" value={klass.id} />
                <div className="space-y-2 col-span-2">
                  <Label className="text-sm font-medium">Simulation *</Label>
                  <select
                    name="simulationId"
                    defaultValue={simulations[0]?.id ?? ""}
                    className="flex h-11 w-full rounded-md border border-input bg-transparent px-4 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
                    required
                    disabled={isSubmittingAssignment}
                  >
                    {simulations.map(simulation => (
                      <option key={simulation.id} value={simulation.id}>
                        {simulation.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Titre de l'assignation *</Label>
                  <Input 
                    name="title" 
                    placeholder="Ex. Séance holographique - Manipulation des ondes" 
                    disabled={isSubmittingAssignment} 
                    required 
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Échéance (optionnel)</Label>
                  <Input
                    type="date"
                    name="dueDate"
                    defaultValue={format(new Date(), "yyyy-MM-dd")}
                    disabled={isSubmittingAssignment}
                    className="h-11"
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label className="text-sm font-medium">Consignes et instructions (optionnel)</Label>
                  <Textarea
                    name="instructions"
                    placeholder="Précisez les attentes, ressources ou consignes particulières pour cette simulation..."
                    disabled={isSubmittingAssignment}
                    rows={6}
                    className="resize-none min-h-[120px]"
                  />
                  <p className="text-xs text-muted-foreground">
                    Vous pouvez inclure des liens vers des ressources, des objectifs d'apprentissage ou des consignes de sécurité.
                  </p>
                </div>
                {modalFeedback ? (
                  <div className="col-span-2 rounded-xl border border-dashed border-primary/40 bg-primary/5 p-3 text-xs text-primary">
                    {modalFeedback}
                  </div>
                ) : null}
                <div className="col-span-2 flex items-center justify-end gap-3 pt-2">
                  <Button type="button" variant="outline" onClick={closeModal} disabled={isSubmittingAssignment} className="h-10">
                    Annuler
                  </Button>
                  <Button type="submit" className="gap-2 h-10" disabled={isSubmittingAssignment}>
                    {isSubmittingAssignment ? <Loader2 className="size-4 animate-spin" /> : null}
                    {isSubmittingAssignment ? "Enregistrement..." : "Assigner la simulation"}
                  </Button>
                </div>
          </form>
            ) : null}
          </DialogContent>
        </Dialog>

        <Dialog open={activeModal === "delete"} onOpenChange={open => (!open ? closeModal() : null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Supprimer la classe</DialogTitle>
              <DialogDescription>
                Cette action retirera la classe {klass?.name ?? ""} et ses assignations associées.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>Les étudiants resteront dans la base mais ne seront plus rattachés à ce groupe.</p>
              <p>Confirmez-vous la suppression de cette classe ?</p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={closeModal} disabled={isDeletingClass}>
                Annuler
              </Button>
              <Button
                variant="destructive"
                className="gap-2"
                onClick={() => {
                  if (klass) {
                    handleDeleteClass(klass)
                  }
                }}
                disabled={isDeletingClass}
              >
                {isDeletingClass ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                {isDeletingClass ? "Suppression..." : "Supprimer"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isCreateModalOpen} onOpenChange={open => (!open ? closeModal() : setIsCreateModalOpen(true))}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Créer une classe</DialogTitle>
              <DialogDescription>Définissez les informations de votre nouvelle classe.</DialogDescription>
            </DialogHeader>
            <form
              className="space-y-4"
              onSubmit={event => {
                event.preventDefault()
                const form = event.currentTarget
                handleCreateClass(new FormData(form), {
                  onSuccess: () => {
                    form.reset()
                    handleCancelEditClass()
                    setIsCreateModalOpen(false)
                  },
                })
              }}
            >
              <div className="space-y-2">
                <Label>Nom</Label>
                <Input name="name" placeholder="Ex. Licence Physique L2" disabled={isCreatingClass} required />
              </div>
              <div className="grid gap-3 grid-cols-2">
                <div className="space-y-2">
                  <Label>Discipline</Label>
                  <Input name="discipline" placeholder="Physique, Chimie..." disabled={isCreatingClass} required />
                </div>
                <div className="space-y-2">
                  <Label>Niveau</Label>
                  <Input name="level" placeholder="Université, Prépa, Lycée..." disabled={isCreatingClass} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  name="description"
                  placeholder="Décrivez rapidement les objectifs ou particularités de cette classe."
                  disabled={isCreatingClass}
                />
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsCreateModalOpen(false)
                    closeModal()
                  }}
                  disabled={isCreatingClass}
                >
                  Annuler
                </Button>
                <Button type="submit" className="gap-2" disabled={isCreatingClass}>
                  {isCreatingClass ? <Loader2 className="size-4 animate-spin" /> : <PlusCircle className="size-4" />}
                  {isCreatingClass ? "Création..." : "Créer la classe"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={activeModal === "editAssignment"} onOpenChange={open => (!open ? closeModal() : null)}>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl">Modifier l'assignation</DialogTitle>
              <DialogDescription className="text-base">
                Modifiez les informations de l'assignation.
              </DialogDescription>
            </DialogHeader>
            <form
              className="grid gap-4 grid-cols-2"
              onSubmit={event => {
                event.preventDefault()
                if (editingAssignmentId) {
                  handleUpdateAssignment(editingAssignmentId)
                }
              }}
            >
              <div className="space-y-2 col-span-2">
                <Label className="text-sm font-medium">Simulation *</Label>
                <select
                  value={assignmentSimulationIdDraft}
                  onChange={event => setAssignmentSimulationIdDraft(event.target.value)}
                  className="flex h-11 w-full rounded-md border border-input bg-transparent px-4 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
                  required
                  disabled={isUpdatingAssignment}
                >
                  {simulations.map(simulation => (
                    <option key={simulation.id} value={simulation.id}>
                      {simulation.title}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Titre de l'assignation *</Label>
                <Input 
                  value={assignmentTitleDraft}
                  onChange={event => setAssignmentTitleDraft(event.target.value)}
                  placeholder="Ex. Séance holographique - Manipulation des ondes" 
                  disabled={isUpdatingAssignment} 
                  required 
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Échéance (optionnel)</Label>
                <Input
                  type="date"
                  value={assignmentDueDateDraft}
                  onChange={event => setAssignmentDueDateDraft(event.target.value)}
                  disabled={isUpdatingAssignment}
                  className="h-11"
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label className="text-sm font-medium">Consignes et instructions (optionnel)</Label>
                <Textarea
                  value={assignmentInstructionsDraft}
                  onChange={event => setAssignmentInstructionsDraft(event.target.value)}
                  placeholder="Précisez les attentes, ressources ou consignes particulières pour cette simulation..."
                  disabled={isUpdatingAssignment}
                  rows={6}
                  className="resize-none min-h-[120px]"
                />
                <p className="text-xs text-muted-foreground">
                  Vous pouvez inclure des liens vers des ressources, des objectifs d'apprentissage ou des consignes de sécurité.
                </p>
              </div>
              <DialogFooter className="col-span-2">
                <Button type="button" variant="outline" onClick={closeModal} disabled={isUpdatingAssignment} className="h-10">
                  Annuler
                </Button>
                <Button type="submit" className="gap-2 h-10" disabled={isUpdatingAssignment}>
                  {isUpdatingAssignment ? <Loader2 className="size-4 animate-spin" /> : null}
                  {isUpdatingAssignment ? "Enregistrement..." : "Enregistrer les modifications"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={activeModal === "deleteAssignment"} onOpenChange={open => (!open ? closeModal() : null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Supprimer l'assignation</DialogTitle>
              <DialogDescription>
                Cette action retirera l'assignation "{modalAssignment?.title ?? ""}" de manière définitive.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={closeModal} disabled={isDeletingAssignment}>
                Annuler
              </Button>
              <Button
                variant="destructive"
                className="gap-2"
                onClick={() => {
                  if (activeAssignmentId) {
                    handleDeleteAssignment(activeAssignmentId)
                  }
                }}
                disabled={isDeletingAssignment}
              >
                {isDeletingAssignment ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                {isDeletingAssignment ? "Suppression..." : "Supprimer"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    )
  }

  return (
    <div className="space-y-6 max-w-[1800px] mx-auto w-full">
      <Card className="border-border/60 bg-card/90">
        <CardHeader>
          <CardTitle className="text-lg">Vue d'ensemble</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-border/60 bg-muted/40 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Classes actives</p>
            <p className="mt-2 text-2xl font-semibold text-foreground">{classes.length}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {classes.length ? "Groupes prêts à l'emploi." : "Créez votre première classe pour démarrer."}
            </p>
          </div>
          <div className="rounded-2xl border border-border/60 bg-muted/40 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Étudiants suivis</p>
            <p className="mt-2 text-2xl font-semibold text-foreground">{totalStudents}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {selectedClass ? `${roster.length} dans ${selectedClass.name}.` : "Sélectionnez une classe pour détailler."}
            </p>
          </div>
          <div className="rounded-2xl border border-border/60 bg-muted/40 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Assignations</p>
            <p className="mt-2 text-2xl font-semibold text-foreground">{totalAssignments}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {filteredAssignments.length
                ? `${filteredAssignments.length} pour la classe actuelle.`
                : "Planifiez votre prochaine simulation."}
            </p>
          </div>
          <div className="rounded-2xl border border-border/60 bg-muted/40 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Assignations en cours</p>
            <p className="mt-2 text-2xl font-semibold text-foreground">{activeAssignments}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {activeAssignments ? "Simulations actives dans vos classes." : "Aucune simulation en cours."}
            </p>
          </div>
        </CardContent>
      </Card>
      {renderClassesTable()}
      <Card className="border-border/60 bg-card/90">
        <CardHeader className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex-1 min-w-[300px]">
            <CardTitle className="text-lg">Suivi pédagogique</CardTitle>
            <p className="text-sm text-muted-foreground">
              Visualisez vos assignations et la composition des classes.
            </p>
          </div>
          <Tabs value={selectedView} onValueChange={value => setSelectedView(value as ViewMode)}>
            <TabsList>
              <TabsTrigger value="assignments">Assignations</TabsTrigger>
              <TabsTrigger value="roster">Liste des étudiants</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-wrap items-center gap-3 text-sm">
            <Label className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Classe sélectionnée</Label>
            <select
              value={selectedClass?.id ?? ""}
              onChange={event => handleSelectClass(event.target.value, { focus: "overview" })}
              className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={!classes.length}
            >
              {classes.map(course => (
                <option key={course.id} value={course.id}>
                  {course.name}
                </option>
              ))}
            </select>
            {selectedClass ? (
                      <Badge variant="outline" className="capitalize">
                {selectedClass.discipline} • {selectedClass.level}
                      </Badge>
            ) : null}
                    </div>
          {lastInviteInfo ? (
            <div className="mb-4 rounded-xl border border-dashed border-primary/40 bg-primary/5 p-3 text-xs text-primary whitespace-pre-wrap">
              {lastInviteInfo}
            </div>
          ) : null}

          <Tabs value={selectedView}>
            <TabsContent value="assignments" className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher une assignation (titre, classe, simulation, instructions)..."
                  value={assignmentSearchQuery}
                  onChange={event => {
                    setAssignmentSearchQuery(event.target.value)
                    setAssignmentCurrentPage(1)
                  }}
                  className="pl-10"
                />
              </div>
              {renderAssignments()}
            </TabsContent>
            <TabsContent value="roster" className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un étudiant (nom, email, institution)..."
                  value={rosterSearchQuery}
                  onChange={event => {
                    setRosterSearchQuery(event.target.value)
                    setRosterCurrentPage(1)
                  }}
                  className="pl-10"
                />
              </div>
              {renderRoster()}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      {renderClassModals()}
    </div>
  )
}
