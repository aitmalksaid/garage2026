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
import { Trash2, Edit, Plus, Search, ArrowLeft, UserCheck, Phone, Mail } from "lucide-react"
import { supabase, type Expert } from "@/lib/supabase/client"
import Link from "next/link"
import { toast } from "@/hooks/use-toast"

export default function ExpertsPage() {
  const [experts, setExperts] = useState<Expert[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingExpert, setEditingExpert] = useState<Expert | null>(null)
  const [formData, setFormData] = useState({
    nom: "",
    prenom: "",
    telephone: "",
    email: "",
  })

  // Charger les experts
  const fetchExperts = async () => {
    try {
      const { data, error } = await supabase.from("experts").select("*").order("created_at", { ascending: false })

      if (error) throw error
      setExperts(data || [])
    } catch (error) {
      console.error("Erreur lors du chargement des experts:", error)
      toast({
        title: "Erreur",
        description: "Impossible de charger les experts",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchExperts()
  }, [])

  // Filtrer les experts selon le terme de recherche
  const filteredExperts = experts.filter(
    (expert) =>
      expert.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expert.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expert.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expert.telephone?.includes(searchTerm),
  )

  // Réinitialiser le formulaire
  const resetForm = () => {
    setFormData({
      nom: "",
      prenom: "",
      telephone: "",
      email: "",
    })
    setEditingExpert(null)
  }

  // Ouvrir le dialog pour ajouter un expert
  const handleAddExpert = () => {
    resetForm()
    setIsDialogOpen(true)
  }

  // Ouvrir le dialog pour modifier un expert
  const handleEditExpert = (expert: Expert) => {
    setFormData({
      nom: expert.nom,
      prenom: expert.prenom,
      telephone: expert.telephone || "",
      email: expert.email || "",
    })
    setEditingExpert(expert)
    setIsDialogOpen(true)
  }

  // Sauvegarder un expert
  const handleSaveExpert = async () => {
    if (!formData.nom.trim() || !formData.prenom.trim()) {
      toast({
        title: "Erreur",
        description: "Le nom et le prénom sont obligatoires",
        variant: "destructive",
      })
      return
    }

    try {
      if (editingExpert) {
        const { error } = await supabase.from("experts").update(formData).eq("id", editingExpert.id)
        if (error) throw error
        toast({ title: "Succès", description: "Expert modifié avec succès" })
      } else {
        const { error } = await supabase.from("experts").insert([formData])
        if (error) throw error
        toast({ title: "Succès", description: "Expert ajouté avec succès" })
      }

      setIsDialogOpen(false)
      resetForm()
      fetchExperts()
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error)
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder l'expert",
        variant: "destructive",
      })
    }
  }

  // Supprimer un expert
  const handleDeleteExpert = async (expert: Expert) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer ${expert.prenom} ${expert.nom} ?`)) {
      return
    }

    try {
      const { error } = await supabase.from("experts").delete().eq("id", expert.id)
      if (error) throw error
      toast({ title: "Succès", description: "Expert supprimé avec succès" })
      fetchExperts()
    } catch (error) {
      console.error("Erreur lors de la suppression:", error)
      toast({
        title: "Erreur",
        description: "Impossible de supprimer l'expert",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Chargement des experts...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-100 p-6">
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
              <h1 className="text-3xl font-bold text-gray-900">Gestion des Experts</h1>
              <p className="text-gray-600">Gérer les experts en assurance automobile</p>
            </div>
          </div>
          <Badge variant="secondary" className="text-lg px-4 py-2">
            {experts.length} expert{experts.length > 1 ? "s" : ""}
          </Badge>
        </div>

        {/* Barre de recherche et bouton d'ajout */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Rechercher un expert..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button onClick={handleAddExpert} className="bg-teal-600 hover:bg-teal-700">
                <Plus className="h-4 w-4 mr-2" />
                Nouvel Expert
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Liste des experts */}
        <Card>
          <CardHeader>
            <CardTitle>Liste des Experts</CardTitle>
            <CardDescription>
              {filteredExperts.length} expert{filteredExperts.length > 1 ? "s" : ""} trouvé
              {filteredExperts.length > 1 ? "s" : ""}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredExperts.length === 0 ? (
              <div className="text-center py-12">
                <UserCheck className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">Aucun expert trouvé</p>
                <p className="text-gray-400">Commencez par ajouter votre premier expert</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nom Complet</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Date d'ajout</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredExperts.map((expert) => (
                      <TableRow key={expert.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <UserCheck className="h-4 w-4 text-gray-400" />
                            {expert.prenom} {expert.nom}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {expert.telephone && (
                              <div className="flex items-center gap-2 text-sm">
                                <Phone className="h-3 w-3 text-gray-400" />
                                {expert.telephone}
                              </div>
                            )}
                            {expert.email && (
                              <div className="flex items-center gap-2 text-sm">
                                <Mail className="h-3 w-3 text-gray-400" />
                                {expert.email}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{new Date(expert.created_at).toLocaleDateString("fr-FR")}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="outline" size="sm" onClick={() => handleEditExpert(expert)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteExpert(expert)}
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

        {/* Dialog pour ajouter/modifier un expert */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editingExpert ? "Modifier l'Expert" : "Nouvel Expert"}</DialogTitle>
              <DialogDescription>
                {editingExpert ? "Modifiez les informations de l'expert" : "Ajoutez un nouvel expert au système"}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="prenom">Prénom *</Label>
                  <Input
                    id="prenom"
                    value={formData.prenom}
                    onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                    placeholder="Antoine"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nom">Nom *</Label>
                  <Input
                    id="nom"
                    value={formData.nom}
                    onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                    placeholder="Leroy"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="telephone">Téléphone</Label>
                <Input
                  id="telephone"
                  value={formData.telephone}
                  onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                  placeholder="01 56 78 90 12"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="antoine.leroy@expert.fr"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleSaveExpert} className="bg-teal-600 hover:bg-teal-700">
                {editingExpert ? "Modifier" : "Ajouter"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
