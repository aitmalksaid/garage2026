"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Trash2, Edit, Plus, Search, ArrowLeft, FileText, Calendar, User, Car, Shield, UserCheck } from "lucide-react"
import {
  supabase,
  type Affaire,
  type Client,
  type Voiture,
  type Expert,
  type Assurance,
  type Agent,
} from "@/lib/supabase/client"
import Link from "next/link"
import { toast } from "@/hooks/use-toast"

// Types étendus pour les jointures
type AffaireComplete = Affaire & {
  clients?: Client
  voitures?: Voiture
  experts?: Expert
  assurances?: Assurance
  agents?: Agent
}

export default function AffairesPage() {
  const [affaires, setAffaires] = useState<AffaireComplete[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [voitures, setVoitures] = useState<Voiture[]>([])
  const [experts, setExperts] = useState<Expert[]>([])
  const [assurances, setAssurances] = useState<Assurance[]>([])
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("tous")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingAffaire, setEditingAffaire] = useState<Affaire | null>(null)
  const [formData, setFormData] = useState({
    numero_affaire: "",
    date_ouverture: "",
    statut: "ouvert",
    client_id: "",
    voiture_id: "",
    assurance_id: "",
    expert_id: "",
    description: "",
    numero_police: "",
    ref_sin: "",
    agent_id: "",
  })

  const statuts = [
    { value: "ouvert", label: "Ouvert", color: "bg-blue-500", progress: 10 },
    { value: "en-cours", label: "En cours", color: "bg-yellow-500", progress: 30 },
    { value: "prepare", label: "Préparé", color: "bg-orange-500", progress: 60 },
    { value: "envoye", label: "Envoyé", color: "bg-purple-500", progress: 80 },
    { value: "accepte", label: "Accepté", color: "bg-green-500", progress: 90 },
    { value: "rejete", label: "Rejeté", color: "bg-red-500", progress: 100 },
  ]

  // Charger toutes les données
  const fetchData = async () => {
    try {
      // Charger les affaires avec toutes les relations
      const { data: affairesData, error: affairesError } = await supabase
        .from("affaires")
        .select(`
          *,
          clients (id, nom, prenom, telephone, email),
          voitures (id, immatriculation, marque, modele),
          experts (id, nom, prenom, telephone),
          assurances (id, nom, telephone),
          agents (id, nom, prenom, compagnie)
        `)
        .order("created_at", { ascending: false })

      if (affairesError) throw affairesError
      setAffaires(affairesData || [])

      // Charger les données pour les formulaires
      const [clientsRes, voituresRes, expertsRes, assurancesRes, agentsRes] = await Promise.all([
        supabase.from("clients").select("*").order("nom"),
        supabase.from("voitures").select("*, clients(nom, prenom)").order("immatriculation"),
        supabase.from("experts").select("*").order("nom"),
        supabase.from("assurances").select("*").order("nom"),
        supabase.from("agents").select("*").order("nom"),
      ])

      if (clientsRes.error) throw clientsRes.error
      if (voituresRes.error) throw voituresRes.error
      if (expertsRes.error) throw expertsRes.error
      if (assurancesRes.error) throw assurancesRes.error
      if (agentsRes.error) throw agentsRes.error

      setClients(clientsRes.data || [])
      setVoitures(voituresRes.data || [])
      setExperts(expertsRes.data || [])
      setAssurances(assurancesRes.data || [])
      setAgents(agentsRes.data || [])
    } catch (error) {
      console.error("Erreur lors du chargement des données:", error)
      toast({
        title: "Erreur",
        description: "Impossible de charger les données",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Filtrer les affaires
  const filteredAffaires = affaires.filter((affaire) => {
    const matchesSearch =
      affaire.numero_affaire.toLowerCase().includes(searchTerm.toLowerCase()) ||
      affaire.clients?.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      affaire.clients?.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      affaire.voitures?.immatriculation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      affaire.description?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "tous" || affaire.statut === statusFilter

    return matchesSearch && matchesStatus
  })

  // Générer un numéro d'affaire automatique
  const generateNumeroAffaire = () => {
    const year = new Date().getFullYear()
    const count = affaires.length + 1
    return `AFF-${year}-${count.toString().padStart(3, "0")}`
  }

  // Réinitialiser le formulaire
  const resetForm = () => {
    setFormData({
      numero_affaire: generateNumeroAffaire(),
      date_ouverture: new Date().toISOString().split("T")[0],
      statut: "ouvert",
      client_id: "",
      voiture_id: "",
      assurance_id: "",
      expert_id: "",
      description: "",
      numero_police: "",
      ref_sin: "",
      agent_id: "",
    })
    setEditingAffaire(null)
  }

  // Ouvrir le dialog pour ajouter une affaire
  const handleAddAffaire = () => {
    resetForm()
    setIsDialogOpen(true)
  }

  // Ouvrir le dialog pour modifier une affaire
  const handleEditAffaire = (affaire: Affaire) => {
    setFormData({
      numero_affaire: affaire.numero_affaire,
      date_ouverture: affaire.date_ouverture,
      statut: affaire.statut,
      client_id: affaire.client_id?.toString() || "",
      voiture_id: affaire.voiture_id?.toString() || "",
      assurance_id: affaire.assurance_id?.toString() || "",
      expert_id: affaire.expert_id?.toString() || "",
      description: affaire.description || "",
      numero_police: affaire.numero_police || "",
      ref_sin: affaire.ref_sin || "",
      agent_id: affaire.agent_id?.toString() || "",
    })
    setEditingAffaire(affaire)
    setIsDialogOpen(true)
  }

  // Sauvegarder une affaire
  const handleSaveAffaire = async () => {
    if (!formData.numero_affaire.trim()) {
      toast({
        title: "Erreur",
        description: "Le numéro d'affaire est obligatoire",
        variant: "destructive",
      })
      return
    }

    try {
      const dataToSave = {
        ...formData,
        client_id: formData.client_id ? Number.parseInt(formData.client_id) : null,
        voiture_id: formData.voiture_id ? Number.parseInt(formData.voiture_id) : null,
        assurance_id: formData.assurance_id ? Number.parseInt(formData.assurance_id) : null,
        expert_id: formData.expert_id ? Number.parseInt(formData.expert_id) : null,
        agent_id: formData.agent_id ? Number.parseInt(formData.agent_id) : null,
      }

      if (editingAffaire) {
        const { error } = await supabase.from("affaires").update(dataToSave).eq("id", editingAffaire.id)
        if (error) throw error
        toast({ title: "Succès", description: "Affaire modifiée avec succès" })
      } else {
        const { error } = await supabase.from("affaires").insert([dataToSave])
        if (error) throw error
        toast({ title: "Succès", description: "Affaire créée avec succès" })
      }

      setIsDialogOpen(false)
      resetForm()
      fetchData()
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error)
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder l'affaire",
        variant: "destructive",
      })
    }
  }

  // Supprimer une affaire
  const handleDeleteAffaire = async (affaire: Affaire) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer l'affaire ${affaire.numero_affaire} ?`)) {
      return
    }

    try {
      const { error } = await supabase.from("affaires").delete().eq("id", affaire.id)
      if (error) throw error
      toast({ title: "Succès", description: "Affaire supprimée avec succès" })
      fetchData()
    } catch (error) {
      console.error("Erreur lors de la suppression:", error)
      toast({
        title: "Erreur",
        description: "Impossible de supprimer l'affaire",
        variant: "destructive",
      })
    }
  }

  // Obtenir les informations du statut
  const getStatutInfo = (statut: string) => {
    return statuts.find((s) => s.value === statut) || statuts[0]
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Chargement des affaires...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Tableau de Bord des Affaires</h1>
              <p className="text-gray-600">Gérer les dossiers de réparation du garage</p>
            </div>
          </div>
          <Badge variant="secondary" className="text-lg px-4 py-2">
            {affaires.length} affaire{affaires.length > 1 ? "s" : ""}
          </Badge>
        </div>

        {/* Filtres et recherche */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-4 flex-1">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Rechercher une affaire..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filtrer par statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tous">Tous les statuts</SelectItem>
                    {statuts.map((statut) => (
                      <SelectItem key={statut.value} value={statut.value}>
                        {statut.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleAddAffaire} className="bg-purple-600 hover:bg-purple-700">
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle Affaire
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Grille des affaires */}
        {filteredAffaires.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">Aucune affaire trouvée</p>
              <p className="text-gray-400">Commencez par créer votre première affaire</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAffaires.map((affaire) => {
              const statutInfo = getStatutInfo(affaire.statut)
              return (
                <Card key={affaire.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{affaire.numero_affaire}</CardTitle>
                      <Badge className={`${statutInfo.color} text-white`}>{statutInfo.label}</Badge>
                    </div>
                    <div className="space-y-2">
                      <Progress value={statutInfo.progress} className="h-2" />
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="h-4 w-4" />
                        {new Date(affaire.date_ouverture).toLocaleDateString("fr-FR")}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Client */}
                    {affaire.clients && (
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">
                          {affaire.clients.prenom} {affaire.clients.nom}
                        </span>
                      </div>
                    )}

                    {/* Véhicule */}
                    {affaire.voitures && (
                      <div className="flex items-center gap-2">
                        <Car className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">
                          {affaire.voitures.immatriculation} - {affaire.voitures.marque} {affaire.voitures.modele}
                        </span>
                      </div>
                    )}

                    {/* Expert */}
                    {affaire.experts && (
                      <div className="flex items-center gap-2">
                        <UserCheck className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">
                          {affaire.experts.prenom} {affaire.experts.nom}
                        </span>
                      </div>
                    )}

                    {/* Assurance */}
                    {affaire.assurances && (
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">{affaire.assurances.nom}</span>
                      </div>
                    )}

                    {/* Description */}
                    {affaire.description && <p className="text-sm text-gray-600 line-clamp-2">{affaire.description}</p>}

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-2 pt-2">
                      <Button variant="outline" size="sm" onClick={() => handleEditAffaire(affaire)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteAffaire(affaire)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {/* Dialog pour ajouter/modifier une affaire */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingAffaire ? "Modifier l'Affaire" : "Nouvelle Affaire"}</DialogTitle>
              <DialogDescription>
                {editingAffaire ? "Modifiez les informations de l'affaire" : "Créez un nouveau dossier de réparation"}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="numero_affaire">Numéro d'affaire *</Label>
                  <Input
                    id="numero_affaire"
                    value={formData.numero_affaire}
                    onChange={(e) => setFormData({ ...formData, numero_affaire: e.target.value })}
                    placeholder="AFF-2024-001"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date_ouverture">Date d'ouverture</Label>
                  <Input
                    id="date_ouverture"
                    type="date"
                    value={formData.date_ouverture}
                    onChange={(e) => setFormData({ ...formData, date_ouverture: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="statut">Statut</Label>
                  <Select
                    value={formData.statut}
                    onValueChange={(value) => setFormData({ ...formData, statut: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statuts.map((statut) => (
                        <SelectItem key={statut.value} value={statut.value}>
                          {statut.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client_id">Client</Label>
                  <Select
                    value={formData.client_id}
                    onValueChange={(value) => setFormData({ ...formData, client_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un client" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id.toString()}>
                          {client.prenom} {client.nom}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="voiture_id">Véhicule</Label>
                  <Select
                    value={formData.voiture_id}
                    onValueChange={(value) => setFormData({ ...formData, voiture_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un véhicule" />
                    </SelectTrigger>
                    <SelectContent>
                      {voitures.map((voiture) => (
                        <SelectItem key={voiture.id} value={voiture.id.toString()}>
                          {voiture.immatriculation} - {voiture.marque} {voiture.modele}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expert_id">Expert</Label>
                  <Select
                    value={formData.expert_id}
                    onValueChange={(value) => setFormData({ ...formData, expert_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un expert" />
                    </SelectTrigger>
                    <SelectContent>
                      {experts.map((expert) => (
                        <SelectItem key={expert.id} value={expert.id.toString()}>
                          {expert.prenom} {expert.nom}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="assurance_id">Assurance</Label>
                  <Select
                    value={formData.assurance_id}
                    onValueChange={(value) => setFormData({ ...formData, assurance_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une assurance" />
                    </SelectTrigger>
                    <SelectContent>
                      {assurances.map((assurance) => (
                        <SelectItem key={assurance.id} value={assurance.id.toString()}>
                          {assurance.nom}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="agent_id">Agent</Label>
                  <Select
                    value={formData.agent_id}
                    onValueChange={(value) => setFormData({ ...formData, agent_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un agent" />
                    </SelectTrigger>
                    <SelectContent>
                      {agents.map((agent) => (
                        <SelectItem key={agent.id} value={agent.id.toString()}>
                          {agent.prenom} {agent.nom} - {agent.compagnie}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="numero_police">N° Police</Label>
                  <Input
                    id="numero_police"
                    value={formData.numero_police}
                    onChange={(e) => setFormData({ ...formData, numero_police: e.target.value })}
                    placeholder="Numéro de police"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ref_sin">Réf Sin</Label>
                  <Input
                    id="ref_sin"
                    value={formData.ref_sin}
                    onChange={(e) => setFormData({ ...formData, ref_sin: e.target.value })}
                    placeholder="Référence sinistre"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Description du problème ou des travaux à effectuer..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleSaveAffaire} className="bg-purple-600 hover:bg-purple-700">
                {editingAffaire ? "Modifier" : "Créer"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
