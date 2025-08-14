"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Calendar, Package, Truck, Search, Filter } from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

interface BonCommande {
  id: number
  numero_bon: string
  date_commande: string
  statut: string
  montant_total: number
  fournisseur: {
    nom: string
  }
  devis: {
    affaire: {
      numero_affaire: string
      client: {
        nom: string
        prenom: string
      }
      voiture: {
        marque: string
        modele: string
        immatriculation: string
      }
    }
  }
  articles: BonCommandeArticle[]
}

interface BonCommandeArticle {
  id: number
  description: string
  quantite: number
  prix_unitaire: number
  total_ht: number
  statut: string
  date_reception: string | null
  notes: string | null
  intervention: string
}

const statusColors = {
  brouillon: "bg-gray-100 text-gray-800",
  envoye: "bg-blue-100 text-blue-800",
  termine: "bg-green-100 text-green-800",
}

const articleStatusColors = {
  en_attente: "bg-yellow-100 text-yellow-800",
  commande: "bg-blue-100 text-blue-800",
  recu: "bg-green-100 text-green-800",
  termine: "bg-emerald-100 text-emerald-800",
}

const statusLabels = {
  brouillon: "Brouillon",
  envoye: "Envoyé",
  termine: "Terminé",
}

const articleStatusLabels = {
  en_attente: "En attente",
  commande: "Commandé",
  recu: "Reçu",
  termine: "Terminé",
}

export default function BonsCommandePage() {
  const [bonsCommande, setBonsCommande] = useState<BonCommande[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const supabase = createClient()

  useEffect(() => {
    fetchBonsCommande()
  }, [])

  const fetchBonsCommande = async () => {
    try {
      const { data, error } = await supabase
        .from("bons_commande")
        .select(`
          *,
          fournisseur:fournisseurs(nom),
          devis(
            affaire:affaires(
              numero_affaire,
              client:clients(nom, prenom),
              voiture:voitures(marque, modele, immatriculation)
            )
          )
        `)
        .order("created_at", { ascending: false })

      if (error) throw error

      // Récupérer les articles pour chaque bon de commande
      const bonsWithArticles = await Promise.all(
        (data || []).map(async (bon) => {
          const { data: articles, error: articlesError } = await supabase
            .from("bons_commande_articles")
            .select("*")
            .eq("bon_commande_id", bon.id)
            .order("id")

          if (articlesError) throw articlesError

          return {
            ...bon,
            articles: articles || [],
          }
        }),
      )

      setBonsCommande(bonsWithArticles)
    } catch (error) {
      console.error("Erreur lors du chargement des bons de commande:", error)
    } finally {
      setLoading(false)
    }
  }

  const updateArticleStatus = async (articleId: number, newStatus: string) => {
    try {
      const updateData: any = { statut: newStatus }

      // Si le statut est "recu", ajouter la date de réception
      if (newStatus === "recu") {
        updateData.date_reception = new Date().toISOString().split("T")[0]
      }

      const { error } = await supabase.from("bons_commande_articles").update(updateData).eq("id", articleId)

      if (error) throw error

      // Recharger les données
      await fetchBonsCommande()
    } catch (error) {
      console.error("Erreur lors de la mise à jour du statut:", error)
    }
  }

  const calculateProgress = (articles: BonCommandeArticle[]) => {
    if (articles.length === 0) return 0
    const completedArticles = articles.filter((article) => article.statut === "termine").length
    return Math.round((completedArticles / articles.length) * 100)
  }

  const filteredBonsCommande = bonsCommande.filter((bon) => {
    const matchesSearch =
      bon.numero_bon.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bon.fournisseur.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bon.devis.affaire.numero_affaire.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || bon.statut === statusFilter

    return matchesSearch && matchesStatus
  })

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Bons de Commande</h1>
          <p className="text-gray-600 mt-1">Gestion et suivi des commandes fournisseurs</p>
        </div>
        <div className="flex items-center gap-2">
          <Package className="h-5 w-5 text-orange-600" />
          <span className="text-sm text-gray-600">
            {filteredBonsCommande.length} bon{filteredBonsCommande.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Rechercher par numéro, fournisseur ou affaire..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filtrer par statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="brouillon">Brouillon</SelectItem>
              <SelectItem value="envoye">Envoyé</SelectItem>
              <SelectItem value="termine">Terminé</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Liste des bons de commande */}
      {filteredBonsCommande.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun bon de commande trouvé</h3>
            <p className="text-gray-600 text-center">
              {searchTerm || statusFilter !== "all"
                ? "Aucun bon de commande ne correspond à vos critères de recherche."
                : "Les bons de commande sont créés automatiquement lorsqu'un devis est accepté."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {filteredBonsCommande.map((bon) => {
            const progress = calculateProgress(bon.articles)

            return (
              <Card key={bon.id} className="border-l-4 border-l-orange-500">
                <CardHeader className="pb-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <CardTitle className="text-xl text-orange-700">{bon.numero_bon}</CardTitle>
                        <Badge className={statusColors[bon.statut as keyof typeof statusColors]}>
                          {statusLabels[bon.statut as keyof typeof statusLabels]}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {format(new Date(bon.date_commande), "dd MMMM yyyy", { locale: fr })}
                        </div>
                        <div className="flex items-center gap-1">
                          <Truck className="h-4 w-4" />
                          {bon.fournisseur.nom}
                        </div>
                        <div className="font-medium">Affaire: {bon.devis.affaire.numero_affaire}</div>
                      </div>
                      <div className="text-sm text-gray-600">
                        Client: {bon.devis.affaire.client.prenom} {bon.devis.affaire.client.nom} -
                        {bon.devis.affaire.voiture.marque} {bon.devis.affaire.voiture.modele}(
                        {bon.devis.affaire.voiture.immatriculation})
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-orange-600">{bon.montant_total.toFixed(2)} €</div>
                      <div className="text-sm text-gray-600">Total HT</div>
                    </div>
                  </div>

                  {/* Barre de progression */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">Progression des articles</span>
                      <span className="text-sm text-gray-600">
                        {progress}% ({bon.articles.filter((a) => a.statut === "termine").length}/{bon.articles.length})
                      </span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                </CardHeader>

                <CardContent>
                  {/* Liste des articles */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-900 flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      Articles commandés ({bon.articles.length})
                    </h4>

                    {bon.articles.length === 0 ? (
                      <p className="text-gray-500 text-sm italic">Aucun article dans ce bon de commande</p>
                    ) : (
                      <div className="space-y-2">
                        {bon.articles.map((article) => (
                          <div
                            key={article.id}
                            className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-3 bg-gray-50 rounded-lg"
                          >
                            <div className="flex-1 space-y-1">
                              <div className="font-medium text-gray-900">{article.description}</div>
                              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                                <span>Qté: {article.quantite}</span>
                                <span>Prix unitaire: {article.prix_unitaire.toFixed(2)} €</span>
                                <span className="font-medium">Total: {article.total_ht.toFixed(2)} €</span>
                                {article.intervention && (
                                  <Badge variant="outline" className="text-xs">
                                    {article.intervention}
                                  </Badge>
                                )}
                              </div>
                              {article.date_reception && (
                                <div className="text-xs text-green-600">
                                  Reçu le {format(new Date(article.date_reception), "dd/MM/yyyy", { locale: fr })}
                                </div>
                              )}
                              {article.notes && (
                                <div className="text-xs text-gray-500 italic">Note: {article.notes}</div>
                              )}
                            </div>

                            <div className="flex items-center gap-3">
                              <Badge
                                className={articleStatusColors[article.statut as keyof typeof articleStatusColors]}
                              >
                                {articleStatusLabels[article.statut as keyof typeof articleStatusLabels]}
                              </Badge>
                              <Select
                                value={article.statut}
                                onValueChange={(value) => updateArticleStatus(article.id, value)}
                              >
                                <SelectTrigger className="w-32">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="en_attente">En attente</SelectItem>
                                  <SelectItem value="commande">Commandé</SelectItem>
                                  <SelectItem value="recu">Reçu</SelectItem>
                                  <SelectItem value="termine">Terminé</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
