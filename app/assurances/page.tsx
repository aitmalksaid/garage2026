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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Trash2, Edit, Plus, Search, ArrowLeft, Shield, Phone, Mail, MapPin } from "lucide-react"
import { supabase, type Assurance } from "@/lib/supabase/client"
import Link from "next/link"
import { toast } from "@/hooks/use-toast"

export default function AssurancesPage() {
  const [assurances, setAssurances] = useState<Assurance[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingAssurance, setEditingAssurance] = useState<Assurance | null>(null)
  const [formData, setFormData] = useState({
    nom: "",
    adresse: "",
    telephone: "",
    email: "",
  })

  // Charger les assurances
  const fetchAssurances = async () => {
    try {
      const { data, error } = await supabase.from("assurances").select("*").order("created_at", { ascending: false })

      if (error) throw error
      setAssurances(data || [])
    } catch (error) {
      console.error("Erreur lors du chargement des assurances:", error)
      toast({
        title: "Erreur",
        description: "Impossible de charger les assurances",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAssurances()
  }, [])

  // Filtrer les assurances selon le terme de recherche
  const filteredAssurances = assurances.filter(
    (assurance) =>
      assurance.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assurance.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assurance.telephone?.includes(searchTerm),
  )

  // Réinitialiser le formulaire
  const resetForm = () => {
    setFormData({
      nom: "",
      adresse: "",
      telephone: "",
      email: "",
    })
    setEditingAssurance(null)
  }

  // Ouvrir le dialog pour ajouter une assurance
  const handleAddAssurance = () => {
    resetForm()
    setIsDialogOpen(true)
  }

  // Ouvrir le dialog pour modifier une assurance
  const handleEditAssurance = (assurance: Assurance) => {
    setFormData({
      nom: assurance.nom,
      adresse: assurance.adresse || "",
      telephone: assurance.telephone || "",
      email: assurance.email || "",
    })
    setEditingAssurance(assurance)
    setIsDialogOpen(true)
  }

  // Sauvegarder une assurance
  const handleSaveAssurance = async () => {
    if (!formData.nom.trim()) {
      toast({
        title: "Erreur",
        description: "Le nom est obligatoire",
        variant: "destructive",
      })
      return
    }

    try {
      if (editingAssurance) {
        const { error } = await supabase.from("assurances").update(formData).eq("id", editingAssurance.id)
        if (error) throw error
        toast({ title: "Succès", description: "Assurance modifiée avec succès" })
      } else {
        const { error } = await supabase.from("assurances").insert([formData])
        if (error) throw error
        toast({ title: "Succès", description: "Assurance ajoutée avec succès" })
      }

      setIsDialogOpen(false)
      resetForm()
      fetchAssurances()
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error)
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder l'assurance",
        variant: "destructive",
      })
    }
  }

  // Supprimer une assurance
  const handleDeleteAssurance = async (assurance: Assurance) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer ${assurance.nom} ?`)) {
      return
    }

    try {
      const { error } = await supabase.from("assurances").delete().eq("id", assurance.id)
      if (error) throw error
      toast({ title: "Succès", description: "Assurance supprimée avec succès" })
      fetchAssurances()
    } catch (error) {
      console.error("Erreur lors de la suppression:", error)
      toast({
        title: "Erreur",
        description: "Impossible de supprimer l'assurance",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Chargement des assurances...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 p-6">
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
              <h1 className="text-3xl font-bold text-gray-900">Gestion des Assurances</h1>
              <p className="text-gray-600">Gérer les compagnies d'assurance</p>
            </div>
          </div>
          <Badge variant="secondary" className="text-lg px-4 py-2">
            {assurances.length} assurance{assurances.length > 1 ? "s" : ""}
          </Badge>
        </div>

        {/* Barre de recherche et bouton d'ajout */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Rechercher une assurance..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button onClick={handleAddAssurance} className="bg-indigo-600 hover:bg-indigo-700">
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle Assurance
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Liste des assurances */}
        <Card>
          <CardHeader>
            <CardTitle>Liste des Assurances</CardTitle>
            <CardDescription>
              {filteredAssurances.length} assurance{filteredAssurances.length > 1 ? "s" : ""} trouvée
              {filteredAssurances.length > 1 ? "s" : ""}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredAssurances.length === 0 ? (
              <div className="text-center py-12">
                <Shield className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">Aucune assurance trouvée</p>
                <p className="text-gray-400">Commencez par ajouter votre première assurance</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nom</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Adresse</TableHead>
                      <TableHead>Date d'ajout</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAssurances.map((assurance) => (
                      <TableRow key={assurance.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4 text-gray-400" />
                            {assurance.nom}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {assurance.telephone && (
                              <div className="flex items-center gap-2 text-sm">
                                <Phone className="h-3 w-3 text-gray-400" />
                                {assurance.telephone}
                              </div>
                            )}
                            {assurance.email && (
                              <div className="flex items-center gap-2 text-sm">
                                <Mail className="h-3 w-3 text-gray-400" />
                                {assurance.email}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {assurance.adresse && (
                            <div className="flex items-center gap-2 text-sm">
                              <MapPin className="h-3 w-3 text-gray-400" />
                              <span className="truncate max-w-xs">{assurance.adresse}</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>{new Date(assurance.created_at).toLocaleDateString("fr-FR")}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="outline" size="sm" onClick={() => handleEditAssurance(assurance)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteAssurance(assurance)}
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

        {/* Dialog pour ajouter/modifier une assurance */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editingAssurance ? "Modifier l'Assurance" : "Nouvelle Assurance"}</DialogTitle>
              <DialogDescription>
                {editingAssurance
                  ? "Modifiez les informations de l'assurance"
                  : "Ajoutez une nouvelle assurance au système"}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="nom">Nom *</Label>
                <Input
                  id="nom"
                  value={formData.nom}
                  onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                  placeholder="Assurance Générale"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telephone">Téléphone</Label>
                <Input
                  id="telephone"
                  value={formData.telephone}
                  onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                  placeholder="08 00 12 34 56"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="contact@assurance-generale.fr"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="adresse">Adresse</Label>
                <Input
                  id="adresse"
                  value={formData.adresse}
                  onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
                  placeholder="100 Rue de Rivoli, 75001 Paris"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleSaveAssurance} className="bg-indigo-600 hover:bg-indigo-700">
                {editingAssurance ? "Modifier" : "Ajouter"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
