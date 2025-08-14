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
import { Trash2, Edit, Plus, Search, ArrowLeft, Building2, Phone, Mail, MapPin } from "lucide-react"
import { supabase, type Fournisseur } from "@/lib/supabase/client"
import Link from "next/link"
import { toast } from "@/hooks/use-toast"

export default function FournisseursPage() {
  const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingFournisseur, setEditingFournisseur] = useState<Fournisseur | null>(null)
  const [formData, setFormData] = useState({
    nom: "",
    adresse: "",
    telephone: "",
    email: "",
  })

  // Charger les fournisseurs
  const fetchFournisseurs = async () => {
    try {
      const { data, error } = await supabase.from("fournisseurs").select("*").order("created_at", { ascending: false })

      if (error) throw error
      setFournisseurs(data || [])
    } catch (error) {
      console.error("Erreur lors du chargement des fournisseurs:", error)
      toast({
        title: "Erreur",
        description: "Impossible de charger les fournisseurs",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFournisseurs()
  }, [])

  // Filtrer les fournisseurs selon le terme de recherche
  const filteredFournisseurs = fournisseurs.filter(
    (fournisseur) =>
      fournisseur.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fournisseur.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fournisseur.telephone?.includes(searchTerm),
  )

  // Réinitialiser le formulaire
  const resetForm = () => {
    setFormData({
      nom: "",
      adresse: "",
      telephone: "",
      email: "",
    })
    setEditingFournisseur(null)
  }

  // Ouvrir le dialog pour ajouter un fournisseur
  const handleAddFournisseur = () => {
    resetForm()
    setIsDialogOpen(true)
  }

  // Ouvrir le dialog pour modifier un fournisseur
  const handleEditFournisseur = (fournisseur: Fournisseur) => {
    setFormData({
      nom: fournisseur.nom,
      adresse: fournisseur.adresse || "",
      telephone: fournisseur.telephone || "",
      email: fournisseur.email || "",
    })
    setEditingFournisseur(fournisseur)
    setIsDialogOpen(true)
  }

  // Sauvegarder un fournisseur
  const handleSaveFournisseur = async () => {
    if (!formData.nom.trim()) {
      toast({
        title: "Erreur",
        description: "Le nom est obligatoire",
        variant: "destructive",
      })
      return
    }

    try {
      if (editingFournisseur) {
        const { error } = await supabase.from("fournisseurs").update(formData).eq("id", editingFournisseur.id)
        if (error) throw error
        toast({ title: "Succès", description: "Fournisseur modifié avec succès" })
      } else {
        const { error } = await supabase.from("fournisseurs").insert([formData])
        if (error) throw error
        toast({ title: "Succès", description: "Fournisseur ajouté avec succès" })
      }

      setIsDialogOpen(false)
      resetForm()
      fetchFournisseurs()
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error)
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder le fournisseur",
        variant: "destructive",
      })
    }
  }

  // Supprimer un fournisseur
  const handleDeleteFournisseur = async (fournisseur: Fournisseur) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer ${fournisseur.nom} ?`)) {
      return
    }

    try {
      const { error } = await supabase.from("fournisseurs").delete().eq("id", fournisseur.id)
      if (error) throw error
      toast({ title: "Succès", description: "Fournisseur supprimé avec succès" })
      fetchFournisseurs()
    } catch (error) {
      console.error("Erreur lors de la suppression:", error)
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le fournisseur",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Chargement des fournisseurs...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-100 p-6">
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
              <h1 className="text-3xl font-bold text-gray-900">Gestion des Fournisseurs</h1>
              <p className="text-gray-600">Gérer les fournisseurs de pièces détachées</p>
            </div>
          </div>
          <Badge variant="secondary" className="text-lg px-4 py-2">
            {fournisseurs.length} fournisseur{fournisseurs.length > 1 ? "s" : ""}
          </Badge>
        </div>

        {/* Barre de recherche et bouton d'ajout */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Rechercher un fournisseur..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button onClick={handleAddFournisseur} className="bg-orange-600 hover:bg-orange-700">
                <Plus className="h-4 w-4 mr-2" />
                Nouveau Fournisseur
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Liste des fournisseurs */}
        <Card>
          <CardHeader>
            <CardTitle>Liste des Fournisseurs</CardTitle>
            <CardDescription>
              {filteredFournisseurs.length} fournisseur{filteredFournisseurs.length > 1 ? "s" : ""} trouvé
              {filteredFournisseurs.length > 1 ? "s" : ""}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredFournisseurs.length === 0 ? (
              <div className="text-center py-12">
                <Building2 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">Aucun fournisseur trouvé</p>
                <p className="text-gray-400">Commencez par ajouter votre premier fournisseur</p>
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
                    {filteredFournisseurs.map((fournisseur) => (
                      <TableRow key={fournisseur.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-gray-400" />
                            {fournisseur.nom}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {fournisseur.telephone && (
                              <div className="flex items-center gap-2 text-sm">
                                <Phone className="h-3 w-3 text-gray-400" />
                                {fournisseur.telephone}
                              </div>
                            )}
                            {fournisseur.email && (
                              <div className="flex items-center gap-2 text-sm">
                                <Mail className="h-3 w-3 text-gray-400" />
                                {fournisseur.email}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {fournisseur.adresse && (
                            <div className="flex items-center gap-2 text-sm">
                              <MapPin className="h-3 w-3 text-gray-400" />
                              <span className="truncate max-w-xs">{fournisseur.adresse}</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>{new Date(fournisseur.created_at).toLocaleDateString("fr-FR")}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="outline" size="sm" onClick={() => handleEditFournisseur(fournisseur)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteFournisseur(fournisseur)}
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

        {/* Dialog pour ajouter/modifier un fournisseur */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editingFournisseur ? "Modifier le Fournisseur" : "Nouveau Fournisseur"}</DialogTitle>
              <DialogDescription>
                {editingFournisseur
                  ? "Modifiez les informations du fournisseur"
                  : "Ajoutez un nouveau fournisseur au système"}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="nom">Nom *</Label>
                <Input
                  id="nom"
                  value={formData.nom}
                  onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                  placeholder="Pièces Auto Pro"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telephone">Téléphone</Label>
                <Input
                  id="telephone"
                  value={formData.telephone}
                  onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                  placeholder="01 23 45 67 89"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="contact@piecesautopro.fr"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="adresse">Adresse</Label>
                <Input
                  id="adresse"
                  value={formData.adresse}
                  onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
                  placeholder="12 Zone Industrielle, 94000 Créteil"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleSaveFournisseur} className="bg-orange-600 hover:bg-orange-700">
                {editingFournisseur ? "Modifier" : "Ajouter"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
