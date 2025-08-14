"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Trash2, Edit, Plus, Search, ArrowLeft, Car, Calendar, User } from "lucide-react"
import { supabase, type Voiture, type Client } from "@/lib/supabase/client"
import Link from "next/link"
import { toast } from "@/hooks/use-toast"

export default function VoituresPage() {
  const [voitures, setVoitures] = useState<(Voiture & { clients?: Client })[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingVoiture, setEditingVoiture] = useState<Voiture | null>(null)
  const [formData, setFormData] = useState({
    immatriculation: "",
    marque: "",
    modele: "",
    num_chassis: "",
    date_mec: "",
    client_id: "",
  })

  // Listes des marques et modèles populaires
  const marques = [
    "Renault",
    "Peugeot",
    "Citroën",
    "BMW",
    "Mercedes",
    "Audi",
    "Volkswagen",
    "Ford",
    "Opel",
    "Toyota",
    "Honda",
    "Nissan",
    "Hyundai",
    "Kia",
    "Autre",
  ]

  const modelesParMarque: { [key: string]: string[] } = {
    Renault: ["Clio", "Megane", "Scenic", "Captur", "Kadjar", "Talisman", "Twingo"],
    Peugeot: ["208", "308", "3008", "5008", "2008", "508", "Partner"],
    Citroën: ["C3", "C4", "C5", "Berlingo", "Picasso", "DS3", "DS4"],
    BMW: ["Serie 1", "Serie 3", "Serie 5", "X1", "X3", "X5", "Z4"],
    Mercedes: ["Classe A", "Classe C", "Classe E", "GLA", "GLC", "GLE", "CLA"],
    Audi: ["A1", "A3", "A4", "A6", "Q2", "Q3", "Q5", "TT"],
  }

  // Charger les voitures avec les informations des clients
  const fetchVoitures = async () => {
    try {
      const { data, error } = await supabase
        .from("voitures")
        .select(`
          *,
          clients (
            id,
            nom,
            prenom,
            telephone,
            email
          )
        `)
        .order("created_at", { ascending: false })

      if (error) throw error
      setVoitures(data || [])
    } catch (error) {
      console.error("Erreur lors du chargement des voitures:", error)
      toast({
        title: "Erreur",
        description: "Impossible de charger les voitures",
        variant: "destructive",
      })
    }
  }

  // Charger les clients pour le formulaire
  const fetchClients = async () => {
    try {
      const { data, error } = await supabase.from("clients").select("*").order("nom", { ascending: true })

      if (error) throw error
      setClients(data || [])
    } catch (error) {
      console.error("Erreur lors du chargement des clients:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchVoitures()
    fetchClients()
  }, [])

  // Filtrer les voitures selon le terme de recherche
  const filteredVoitures = voitures.filter(
    (voiture) =>
      voiture.immatriculation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      voiture.marque.toLowerCase().includes(searchTerm.toLowerCase()) ||
      voiture.modele.toLowerCase().includes(searchTerm.toLowerCase()) ||
      voiture.clients?.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      voiture.clients?.prenom.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // Réinitialiser le formulaire
  const resetForm = () => {
    setFormData({
      immatriculation: "",
      marque: "",
      modele: "",
      num_chassis: "",
      date_mec: "",
      client_id: "",
    })
    setEditingVoiture(null)
  }

  // Ouvrir le dialog pour ajouter une voiture
  const handleAddVoiture = () => {
    resetForm()
    setIsDialogOpen(true)
  }

  // Ouvrir le dialog pour modifier une voiture
  const handleEditVoiture = (voiture: Voiture) => {
    setFormData({
      immatriculation: voiture.immatriculation,
      marque: voiture.marque,
      modele: voiture.modele,
      num_chassis: voiture.num_chassis || "",
      date_mec: voiture.date_mec || "",
      client_id: voiture.client_id?.toString() || "",
    })
    setEditingVoiture(voiture)
    setIsDialogOpen(true)
  }

  // Sauvegarder une voiture
  const handleSaveVoiture = async () => {
    if (!formData.immatriculation.trim() || !formData.marque.trim() || !formData.modele.trim()) {
      toast({
        title: "Erreur",
        description: "L'immatriculation, la marque et le modèle sont obligatoires",
        variant: "destructive",
      })
      return
    }

    try {
      const dataToSave = {
        ...formData,
        client_id: formData.client_id ? Number.parseInt(formData.client_id) : null,
      }

      if (editingVoiture) {
        // Modification
        const { error } = await supabase.from("voitures").update(dataToSave).eq("id", editingVoiture.id)

        if (error) throw error
        toast({
          title: "Succès",
          description: "Véhicule modifié avec succès",
        })
      } else {
        // Ajout
        const { error } = await supabase.from("voitures").insert([dataToSave])

        if (error) throw error
        toast({
          title: "Succès",
          description: "Véhicule ajouté avec succès",
        })
      }

      setIsDialogOpen(false)
      resetForm()
      fetchVoitures()
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error)
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder le véhicule",
        variant: "destructive",
      })
    }
  }

  // Supprimer une voiture
  const handleDeleteVoiture = async (voiture: Voiture) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le véhicule ${voiture.immatriculation} ?`)) {
      return
    }

    try {
      const { error } = await supabase.from("voitures").delete().eq("id", voiture.id)

      if (error) throw error

      toast({
        title: "Succès",
        description: "Véhicule supprimé avec succès",
      })
      fetchVoitures()
    } catch (error) {
      console.error("Erreur lors de la suppression:", error)
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le véhicule",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Chargement des véhicules...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 p-6">
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
              <h1 className="text-3xl font-bold text-gray-900">Gestion des Véhicules</h1>
              <p className="text-gray-600">Gérer le parc automobile des clients</p>
            </div>
          </div>
          <Badge variant="secondary" className="text-lg px-4 py-2">
            {voitures.length} véhicule{voitures.length > 1 ? "s" : ""}
          </Badge>
        </div>

        {/* Barre de recherche et bouton d'ajout */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Rechercher un véhicule..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button onClick={handleAddVoiture} className="bg-green-600 hover:bg-green-700">
                <Plus className="h-4 w-4 mr-2" />
                Nouveau Véhicule
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Liste des véhicules */}
        <Card>
          <CardHeader>
            <CardTitle>Liste des Véhicules</CardTitle>
            <CardDescription>
              {filteredVoitures.length} véhicule{filteredVoitures.length > 1 ? "s" : ""} trouvé
              {filteredVoitures.length > 1 ? "s" : ""}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredVoitures.length === 0 ? (
              <div className="text-center py-12">
                <Car className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">Aucun véhicule trouvé</p>
                <p className="text-gray-400">Commencez par ajouter votre premier véhicule</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Immatriculation</TableHead>
                      <TableHead>Véhicule</TableHead>
                      <TableHead>Propriétaire</TableHead>
                      <TableHead>Informations</TableHead>
                      <TableHead>Date d'ajout</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredVoitures.map((voiture) => (
                      <TableRow key={voiture.id}>
                        <TableCell className="font-mono font-medium">
                          <Badge variant="outline" className="font-mono">
                            {voiture.immatriculation}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Car className="h-4 w-4 text-gray-400" />
                            <div>
                              <div className="font-medium">
                                {voiture.marque} {voiture.modele}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {voiture.clients && (
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-gray-400" />
                              <div>
                                <div className="font-medium">
                                  {voiture.clients.prenom} {voiture.clients.nom}
                                </div>
                                {voiture.clients.telephone && (
                                  <div className="text-sm text-gray-500">{voiture.clients.telephone}</div>
                                )}
                              </div>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1 text-sm">
                            {voiture.num_chassis && <div className="text-gray-600">Châssis: {voiture.num_chassis}</div>}
                            {voiture.date_mec && (
                              <div className="flex items-center gap-1 text-gray-600">
                                <Calendar className="h-3 w-3" />
                                MEC: {new Date(voiture.date_mec).toLocaleDateString("fr-FR")}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{new Date(voiture.created_at).toLocaleDateString("fr-FR")}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="outline" size="sm" onClick={() => handleEditVoiture(voiture)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteVoiture(voiture)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dialog pour ajouter/modifier un véhicule */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingVoiture ? "Modifier le Véhicule" : "Nouveau Véhicule"}</DialogTitle>
              <DialogDescription>
                {editingVoiture ? "Modifiez les informations du véhicule" : "Ajoutez un nouveau véhicule au système"}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="immatriculation">Immatriculation *</Label>
                  <Input
                    id="immatriculation"
                    value={formData.immatriculation}
                    onChange={(e) => setFormData({ ...formData, immatriculation: e.target.value.toUpperCase() })}
                    placeholder="AB-123-CD"
                    className="font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client_id">Propriétaire</Label>
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
                  <Label htmlFor="marque">Marque *</Label>
                  <Select
                    value={formData.marque}
                    onValueChange={(value) => setFormData({ ...formData, marque: value, modele: "" })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une marque" />
                    </SelectTrigger>
                    <SelectContent>
                      {marques.map((marque) => (
                        <SelectItem key={marque} value={marque}>
                          {marque}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="modele">Modèle *</Label>
                  {formData.marque && modelesParMarque[formData.marque] ? (
                    <Select
                      value={formData.modele}
                      onValueChange={(value) => setFormData({ ...formData, modele: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un modèle" />
                      </SelectTrigger>
                      <SelectContent>
                        {modelesParMarque[formData.marque].map((modele) => (
                          <SelectItem key={modele} value={modele}>
                            {modele}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      id="modele"
                      value={formData.modele}
                      onChange={(e) => setFormData({ ...formData, modele: e.target.value })}
                      placeholder="Saisir le modèle"
                    />
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="num_chassis">Numéro de châssis</Label>
                <Input
                  id="num_chassis"
                  value={formData.num_chassis}
                  onChange={(e) => setFormData({ ...formData, num_chassis: e.target.value.toUpperCase() })}
                  placeholder="VF1CB0E0H12345678"
                  className="font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date_mec">Date de mise en circulation</Label>
                <Input
                  id="date_mec"
                  type="date"
                  value={formData.date_mec}
                  onChange={(e) => setFormData({ ...formData, date_mec: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleSaveVoiture} className="bg-green-600 hover:bg-green-700">
                {editingVoiture ? "Modifier" : "Ajouter"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
