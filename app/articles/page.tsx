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
import { Trash2, Edit, Plus, Search, ArrowLeft, Package, Euro, Building2 } from "lucide-react"
import { supabase, type Article, type Fournisseur } from "@/lib/supabase/client"
import Link from "next/link"
import { toast } from "@/hooks/use-toast"

// Type étendu pour les jointures
type ArticleComplete = Article & {
  fournisseurs?: Fournisseur
}

export default function ArticlesPage() {
  const [articles, setArticles] = useState<ArticleComplete[]>([])
  const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingArticle, setEditingArticle] = useState<Article | null>(null)
  const [formData, setFormData] = useState({
    description: "",
    prix_ht: "",
    fournisseur_id: "",
  })

  // Charger les articles avec les fournisseurs
  const fetchArticles = async () => {
    try {
      const { data, error } = await supabase
        .from("articles")
        .select(`
          *,
          fournisseurs (
            id,
            nom,
            telephone
          )
        `)
        .order("created_at", { ascending: false })

      if (error) throw error
      setArticles(data || [])
    } catch (error) {
      console.error("Erreur lors du chargement des articles:", error)
      toast({
        title: "Erreur",
        description: "Impossible de charger les articles",
        variant: "destructive",
      })
    }
  }

  // Charger les fournisseurs pour le formulaire
  const fetchFournisseurs = async () => {
    try {
      const { data, error } = await supabase.from("fournisseurs").select("*").order("nom", { ascending: true })

      if (error) throw error
      setFournisseurs(data || [])
    } catch (error) {
      console.error("Erreur lors du chargement des fournisseurs:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchArticles()
    fetchFournisseurs()
  }, [])

  // Filtrer les articles selon le terme de recherche
  const filteredArticles = articles.filter(
    (article) =>
      article.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.fournisseurs?.nom.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // Réinitialiser le formulaire
  const resetForm = () => {
    setFormData({
      description: "",
      prix_ht: "",
      fournisseur_id: "",
    })
    setEditingArticle(null)
  }

  // Ouvrir le dialog pour ajouter un article
  const handleAddArticle = () => {
    resetForm()
    setIsDialogOpen(true)
  }

  // Ouvrir le dialog pour modifier un article
  const handleEditArticle = (article: Article) => {
    setFormData({
      description: article.description,
      prix_ht: article.prix_ht.toString(),
      fournisseur_id: article.fournisseur_id?.toString() || "",
    })
    setEditingArticle(article)
    setIsDialogOpen(true)
  }

  // Sauvegarder un article
  const handleSaveArticle = async () => {
    if (!formData.description.trim()) {
      toast({
        title: "Erreur",
        description: "La description est obligatoire",
        variant: "destructive",
      })
      return
    }

    if (!formData.prix_ht || isNaN(Number.parseFloat(formData.prix_ht))) {
      toast({
        title: "Erreur",
        description: "Le prix HT doit être un nombre valide",
        variant: "destructive",
      })
      return
    }

    try {
      const dataToSave = {
        description: formData.description,
        prix_ht: Number.parseFloat(formData.prix_ht),
        fournisseur_id: formData.fournisseur_id ? Number.parseInt(formData.fournisseur_id) : null,
      }

      if (editingArticle) {
        const { error } = await supabase.from("articles").update(dataToSave).eq("id", editingArticle.id)
        if (error) throw error
        toast({ title: "Succès", description: "Article modifié avec succès" })
      } else {
        const { error } = await supabase.from("articles").insert([dataToSave])
        if (error) throw error
        toast({ title: "Succès", description: "Article ajouté avec succès" })
      }

      setIsDialogOpen(false)
      resetForm()
      fetchArticles()
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error)
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder l'article",
        variant: "destructive",
      })
    }
  }

  // Supprimer un article
  const handleDeleteArticle = async (article: Article) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer "${article.description}" ?`)) {
      return
    }

    try {
      const { error } = await supabase.from("articles").delete().eq("id", article.id)
      if (error) throw error
      toast({ title: "Succès", description: "Article supprimé avec succès" })
      fetchArticles()
    } catch (error) {
      console.error("Erreur lors de la suppression:", error)
      toast({
        title: "Erreur",
        description: "Impossible de supprimer l'article",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Chargement des articles...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-100 p-6">
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
              <h1 className="text-3xl font-bold text-gray-900">Catalogue des Articles</h1>
              <p className="text-gray-600">Gérer le catalogue de pièces détachées</p>
            </div>
          </div>
          <Badge variant="secondary" className="text-lg px-4 py-2">
            {articles.length} article{articles.length > 1 ? "s" : ""}
          </Badge>
        </div>

        {/* Barre de recherche et bouton d'ajout */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Rechercher un article..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button onClick={handleAddArticle} className="bg-rose-600 hover:bg-rose-700">
                <Plus className="h-4 w-4 mr-2" />
                Nouvel Article
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Liste des articles */}
        <Card>
          <CardHeader>
            <CardTitle>Liste des Articles</CardTitle>
            <CardDescription>
              {filteredArticles.length} article{filteredArticles.length > 1 ? "s" : ""} trouvé
              {filteredArticles.length > 1 ? "s" : ""}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredArticles.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">Aucun article trouvé</p>
                <p className="text-gray-400">Commencez par ajouter votre premier article</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Description</TableHead>
                      <TableHead>Prix HT</TableHead>
                      <TableHead>Fournisseur</TableHead>
                      <TableHead>Date d'ajout</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredArticles.map((article) => (
                      <TableRow key={article.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-gray-400" />
                            <span className="max-w-xs truncate">{article.description}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 font-medium text-green-600">
                            <Euro className="h-4 w-4" />
                            {article.prix_ht.toFixed(2)}
                          </div>
                        </TableCell>
                        <TableCell>
                          {article.fournisseurs && (
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-gray-400" />
                              <span className="text-sm">{article.fournisseurs.nom}</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>{new Date(article.created_at).toLocaleDateString("fr-FR")}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="outline" size="sm" onClick={() => handleEditArticle(article)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteArticle(article)}
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

        {/* Dialog pour ajouter/modifier un article */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editingArticle ? "Modifier l'Article" : "Nouvel Article"}</DialogTitle>
              <DialogDescription>
                {editingArticle ? "Modifiez les informations de l'article" : "Ajoutez un nouvel article au catalogue"}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Pare-choc avant Renault Clio"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="prix_ht">Prix HT (€) *</Label>
                <Input
                  id="prix_ht"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.prix_ht}
                  onChange={(e) => setFormData({ ...formData, prix_ht: e.target.value })}
                  placeholder="250.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fournisseur_id">Fournisseur par défaut</Label>
                <Select
                  value={formData.fournisseur_id}
                  onValueChange={(value) => setFormData({ ...formData, fournisseur_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un fournisseur" />
                  </SelectTrigger>
                  <SelectContent>
                    {fournisseurs.map((fournisseur) => (
                      <SelectItem key={fournisseur.id} value={fournisseur.id.toString()}>
                        {fournisseur.nom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleSaveArticle} className="bg-rose-600 hover:bg-rose-700">
                {editingArticle ? "Modifier" : "Ajouter"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
