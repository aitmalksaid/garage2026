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
import { Separator } from "@/components/ui/separator"
import { Trash2, Edit, Plus, Search, ArrowLeft, FileText, Calculator, Download, X } from "lucide-react"
import { supabase, type Devis, type Affaire, type Article, type Fournisseur } from "@/lib/supabase/client"
import Link from "next/link"
import { toast } from "@/hooks/use-toast"

// Types pour les articles de devis
type DevisArticle = {
  id?: number
  article_id?: number
  description: string
  quantite: number
  prix_ht: number
  fournisseur_id?: number
  intervention: string
  total: number
}

// Type étendu pour les devis avec relations
type DevisComplete = Devis & {
  affaires?: Affaire & {
    clients?: { nom: string; prenom: string; telephone: string; id: number; ice: string }
    voitures?: { immatriculation: string; marque: string; modele: string; date_mec: string; num_chassis: string }
    assurances?: { nom: string }
    experts?: { nom: string; prenom: string }
    agents?: { nom: string; prenom: string; compagnie: string }
  }
}

export default function DevisPage() {
  const [devis, setDevis] = useState<DevisComplete[]>([])
  const [affaires, setAffaires] = useState<(Affaire & { clients?: any; voitures?: any })[]>([])
  const [articles, setArticles] = useState<Article[]>([])
  const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingDevis, setEditingDevis] = useState<Devis | null>(null)

  // État du formulaire de devis
  const [formData, setFormData] = useState({
    numero_devis: "",
    date_devis: "",
    statut: "brouillon",
    affaire_id: "",
    mo_tolerie: 0,
    mo_peinture: 0,
    mo_mecanique: 0,
    mo_electrique: 0,
  })

  // Articles du devis
  const [devisArticles, setDevisArticles] = useState<DevisArticle[]>([
    {
      description: "",
      quantite: 1,
      prix_ht: 0,
      fournisseur_id: undefined,
      intervention: "REMPLACEMENT",
      total: 0,
    },
  ])

  const interventions = ["REMPLACEMENT", "OCCASION", "REPARATION", "NEUF"]

  const statutsDevis = [
    { value: "brouillon", label: "Brouillon", color: "bg-gray-500" },
    { value: "envoye", label: "Envoyé", color: "bg-blue-500" },
    { value: "accepte", label: "Accepté", color: "bg-green-500" },
    { value: "rejete", label: "Rejeté", color: "bg-red-500" },
  ]

  // Charger toutes les données
  const fetchData = async () => {
    try {
      // Charger les devis avec relations
      const { data: devisData, error: devisError } = await supabase
        .from("devis")
        .select(`
          *,
          affaires (
            id,
            numero_affaire,
            numero_police,
            ref_sin,
            clients (nom, prenom, telephone, id, ice),
            voitures (immatriculation, marque, modele, date_mec, num_chassis),
            assurances (nom),
            experts (nom, prenom),
            agents (nom, prenom, compagnie)
          )
        `)
        .order("created_at", { ascending: false })

      if (devisError) throw devisError
      setDevis(devisData || [])

      // Charger les données pour les formulaires
      const [affairesRes, articlesRes, fournisseursRes] = await Promise.all([
        supabase
          .from("affaires")
          .select(`
          *,
          clients (nom, prenom),
          voitures (immatriculation, marque, modele)
        `)
          .order("numero_affaire"),
        supabase.from("articles").select("*").order("description"),
        supabase.from("fournisseurs").select("*").order("nom"),
      ])

      if (affairesRes.error) throw affairesRes.error
      if (articlesRes.error) throw articlesRes.error
      if (fournisseursRes.error) throw fournisseursRes.error

      setAffaires(affairesRes.data || [])
      setArticles(articlesRes.data || [])
      setFournisseurs(fournisseursRes.data || [])
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

  // Filtrer les devis
  const filteredDevis = devis.filter((d) => {
    const searchLower = searchTerm.toLowerCase()
    return (
      d.numero_devis.toLowerCase().includes(searchLower) ||
      d.affaires?.numero_affaire.toLowerCase().includes(searchLower) ||
      d.affaires?.clients?.nom.toLowerCase().includes(searchLower) ||
      d.affaires?.clients?.prenom.toLowerCase().includes(searchLower)
    )
  })

  // Générer un numéro de devis automatique
  const generateNumeroDevis = () => {
    const year = new Date().getFullYear()
    const count = devis.length + 1
    return `DEV-${year}-${count.toString().padStart(3, "0")}`
  }

  // Calculer les totaux
  const calculateTotals = () => {
    const sousTotal = devisArticles.reduce((sum, article) => sum + article.total, 0)
    const mainOeuvre = formData.mo_tolerie + formData.mo_peinture + formData.mo_mecanique + formData.mo_electrique
    const totalHT = sousTotal + mainOeuvre

    // Calculer la TVA (20% sauf pour les articles OCCASION qui sont à 0%)
    const tvaArticles = devisArticles.reduce((sum, article) => {
      const tva = article.intervention === "OCCASION" ? 0 : article.total * 0.2
      return sum + tva
    }, 0)
    const tvaMainOeuvre = mainOeuvre * 0.2
    const totalTVA = tvaArticles + tvaMainOeuvre

    const totalTTC = totalHT + totalTVA

    return {
      totalHT: totalHT.toFixed(2),
      totalTVA: totalTVA.toFixed(2),
      totalTTC: totalTTC.toFixed(2),
    }
  }

  // Ajouter une ligne d'article
  const addArticleLine = () => {
    setDevisArticles([
      ...devisArticles,
      {
        description: "",
        quantite: 1,
        prix_ht: 0,
        fournisseur_id: undefined,
        intervention: "REMPLACEMENT",
        total: 0,
      },
    ])
  }

  // Supprimer une ligne d'article
  const removeArticleLine = (index: number) => {
    if (devisArticles.length > 1) {
      setDevisArticles(devisArticles.filter((_, i) => i !== index))
    }
  }

  // Mettre à jour un article
  const updateArticle = (index: number, field: keyof DevisArticle, value: any) => {
    const updatedArticles = [...devisArticles]
    updatedArticles[index] = { ...updatedArticles[index], [field]: value }

    // Recalculer le total de la ligne
    if (field === "quantite" || field === "prix_ht") {
      updatedArticles[index].total = updatedArticles[index].quantite * updatedArticles[index].prix_ht
    }

    setDevisArticles(updatedArticles)
  }

  // Sélectionner un article du catalogue
  const selectArticleFromCatalog = (index: number, articleId: string) => {
    const article = articles.find((a) => a.id.toString() === articleId)
    if (article) {
      updateArticle(index, "article_id", article.id)
      updateArticle(index, "description", article.description)
      updateArticle(index, "prix_ht", article.prix_ht)
      updateArticle(index, "fournisseur_id", article.fournisseur_id)
    }
  }

  // Réinitialiser le formulaire
  const resetForm = () => {
    setFormData({
      numero_devis: generateNumeroDevis(),
      date_devis: new Date().toISOString().split("T")[0],
      statut: "brouillon",
      affaire_id: "",
      mo_tolerie: 0,
      mo_peinture: 0,
      mo_mecanique: 0,
      mo_electrique: 0,
    })
    setDevisArticles([
      {
        description: "",
        quantite: 1,
        prix_ht: 0,
        fournisseur_id: undefined,
        intervention: "REMPLACEMENT",
        total: 0,
      },
    ])
    setEditingDevis(null)
  }

  // Ouvrir le dialog pour ajouter un devis
  const handleAddDevis = () => {
    resetForm()
    setIsDialogOpen(true)
  }

  const handleEditDevis = async (devis: Devis) => {
    try {
      // Charger les articles du devis
      const { data: articlesData, error } = await supabase.from("devis_articles").select("*").eq("devis_id", devis.id)

      if (error) throw error

      // Remplir le formulaire avec les données du devis
      setFormData({
        numero_devis: devis.numero_devis,
        date_devis: devis.date_devis,
        statut: devis.statut,
        affaire_id: devis.affaire_id.toString(),
        mo_tolerie: devis.mo_tolerie || 0,
        mo_peinture: devis.mo_peinture || 0,
        mo_mecanique: devis.mo_mecanique || 0,
        mo_electrique: devis.mo_electrique || 0,
      })

      // Remplir les articles
      if (articlesData && articlesData.length > 0) {
        const formattedArticles = articlesData.map((article) => ({
          id: article.id,
          article_id: article.article_id,
          description: article.description,
          quantite: article.quantite,
          prix_ht: article.prix_ht,
          fournisseur_id: article.fournisseur_id,
          intervention: article.intervention,
          total: article.quantite * article.prix_ht,
        }))
        setDevisArticles(formattedArticles)
      }

      setEditingDevis(devis)
      setIsDialogOpen(true)
    } catch (error) {
      console.error("Erreur lors du chargement du devis:", error)
      toast({
        title: "Erreur",
        description: "Impossible de charger le devis",
        variant: "destructive",
      })
    }
  }

  const handleDownloadDevis = async (devis: DevisComplete) => {
    try {
      // Charger les articles du devis
      const { data: articlesData, error } = await supabase
        .from("devis_articles")
        .select(`
        *,
        fournisseurs (nom)
      `)
        .eq("devis_id", devis.id)

      if (error) throw error

      const totauxParType = {
        ingredients: 0,
        adaptable: 0,
        origine: 0,
        occasion: 0,
        autres: 0,
      }

      // Calculate totals by type based on article description and intervention
      articlesData?.forEach((article) => {
        const total = article.quantite * article.prix_ht
        const description = article.description.toLowerCase()
        const intervention = article.intervention.toLowerCase()

        if (description.includes("ingredient")) {
          totauxParType.ingredients += total
        } else if (intervention === "occasion") {
          totauxParType.occasion += total
        } else if (description.includes("adaptable")) {
          totauxParType.adaptable += total
        } else if (description.includes("origine") || intervention === "neuf") {
          totauxParType.origine += total
        } else {
          totauxParType.autres += total
        }
      })

      const totalFourniture = Object.values(totauxParType).reduce((sum, val) => sum + val, 0)

      const totalMainOeuvre =
        (devis.mo_tolerie || 0) + (devis.mo_peinture || 0) + (devis.mo_mecanique || 0) + (devis.mo_electrique || 0)
      const tvaFourniture = totalFourniture * 0.2
      const ttcFourniture = totalFourniture + tvaFourniture

      const tvaMainOeuvre = totalMainOeuvre * 0.2
      const ttcMainOeuvre = totalMainOeuvre + tvaMainOeuvre

      const totalGeneral = totalFourniture + totalMainOeuvre
      const tvaGenerale = tvaFourniture + tvaMainOeuvre
      const ttcGeneral = totalGeneral + tvaGenerale
      // </CHANGE>

      // Calculer les totaux par catégorie
      const totauxParCategorie = {
        remplacement: 0,
        occasion: 0,
        reparation: 0,
        neuf: 0,
      }

      const totalArticles =
        articlesData?.reduce((sum, article) => {
          const total = article.quantite * article.prix_ht
          const intervention = article.intervention.toLowerCase()
          if (intervention in totauxParCategorie) {
            totauxParCategorie[intervention as keyof typeof totauxParCategorie] += total
          }
          return sum + total
        }, 0) || 0

      const { totalTTC } = calculateTotals()

      const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Devis ${devis.numero_devis}</title>
        <style>
          @page { 
            margin: 15mm; 
            size: A4; 
          }
          body { 
            font-family: Arial, sans-serif; 
            font-size: 11px; 
            line-height: 1.3; 
            margin: 0; 
            padding: 0;
            color: #000;
          }
          .company-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 20px;
            border-bottom: 2px solid #000;
            padding-bottom: 10px;
          }
          .logo-section {
            display: flex;
            align-items: center;
            gap: 15px;
          }
          .logo-image {
            width: 120px;
          }
          .header-boxes {
            display: flex;
            align-items: center;
            gap: 20px;
            margin-left: 50px;
          }
          .devis-box {
            border: 2px solid #000;
            padding: 8px 15px;
            text-align: center;
            background-color: white;
          }
          .devis-title {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 5px;
          }
          .devis-number {
            font-size: 14px;
            font-weight: bold;
          }
          .info-box {
            border: 2px solid #000;
            padding: 8px 15px;
            background-color: white;
          }
          .info-line {
            font-size: 12px;
            font-weight: bold;
            margin-bottom: 3px;
          }
          .company-info-header {
            text-align: right;
            font-size: 10px;
            line-height: 1.2;
          }
          .header-table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-bottom: 15px;
            border: 2px solid #000;
          }
          .header-table td { 
            border: 1px solid #000; 
            padding: 4px 6px; 
            vertical-align: top;
            font-size: 10px;
          }
          .header-table .label { 
            font-weight: bold; 
            background-color: #f0f0f0;
            width: 25%;
          }
          .header-table .value { 
            width: 25%;
          }
          .title-section {
            text-align: center;
            margin: 10px 0;
            font-size: 14px;
            font-weight: bold;
          }
          .articles-table { 
            width: 100%; 
            border-collapse: collapse; 
            margin: 15px 0;
            border: 2px solid #000;
          }
          .articles-table th { 
            border: 1px solid #000; 
            padding: 6px 4px; 
            background-color: #f0f0f0; 
            font-weight: bold;
            text-align: center;
            font-size: 10px;
          }
          .articles-table td { 
            border: 1px solid #000; 
            padding: 4px; 
            text-align: center;
            font-size: 10px;
          }
          .articles-table td.description { 
            text-align: left; 
            font-weight: bold;
          }
          .totals-section {
            margin-top: 20px;
          }
          .totals-table { 
            width: 100%; 
            border-collapse: collapse;
            border: 2px solid #000;
          }
          .totals-table td { 
            border: 1px solid #000; 
            padding: 4px 6px;
            font-size: 10px;
          }
          .totals-table .label { 
            font-weight: bold; 
            background-color: #f0f0f0;
            text-align: right;
            width: 70%;
          }
          .totals-table .value { 
            text-align: right;
            font-weight: bold;
            width: 30%;
          }
          .company-footer {
            margin-top: 30px;
            text-align: center;
            font-size: 10px;
            border-top: 1px solid #000;
            padding-top: 10px;
          }
        </style>
      </head>
      <body>
        <div class="company-header">
          <div class="logo-section">
            <!-- Added real CNG logo image -->
            <img src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-sdX09OeKik320uePR47Vk9PXj5DcPv.png" alt="CNG Logo" class="logo-image">
            <div class="header-boxes">
              <div class="devis-box">
                <div class="devis-title">Devis</div>
                <div class="devis-number">${devis.numero_devis}</div>
              </div>
              <div class="info-box">
                <div class="info-line">MARRAKECH, LE : ${new Date(devis.date_devis).toLocaleDateString("fr-FR")}</div>
                <div class="info-line">DOSSIER N° ${devis.numero_devis}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- En-tête avec informations client et véhicule -->
        <table class="header-table">
          <tr>
            <td class="label">Nom Client :</td>
            <td class="value">${devis.affaires?.clients?.prenom || ""} ${devis.affaires?.clients?.nom || ""}</td>
            <td class="label">Véhicule :</td>
            <td class="value">${devis.affaires?.voitures?.marque || ""} ${devis.affaires?.voitures?.modele || ""}</td>
          </tr>
          <tr>
            <td class="label">Téléphone :</td>
            <td class="value">${devis.affaires?.clients?.telephone || "-"}</td>
            <td class="label">Matricule :</td>
            <td class="value">${devis.affaires?.voitures?.immatriculation || ""}</td>
          </tr>
          <tr>
            <td class="label">Code Client :</td>
            <td class="value">CL${devis.affaires?.clients?.id?.toString().padStart(5, "0") || "00000"}</td>
            <td class="label">Date M.E.C :</td>
            <td class="value">${devis.affaires?.voitures?.date_mec ? new Date(devis.affaires.voitures.date_mec).toLocaleDateString("fr-FR") : "-"}</td>
          </tr>
          <tr>
            <td class="label">ICE :</td>
            <td class="value">${devis.affaires?.clients?.ice || "-"}</td>
            <td class="label">Type Dossier :</td>
            <td class="value">Devis</td>
          </tr>
        </table>

        <!-- Titre et informations du devis -->
        <table class="header-table">
          <tr>
            <td class="label">Compagnie :</td>
            <td class="value">${devis.affaires?.assurances?.nom || "-"}</td>
            <td class="label">Type :</td>
            <td class="value">${devis.affaires?.voitures?.modele || ""}</td>
          </tr>
          <tr>
            <td class="label">N° Police :</td>
            <td class="value">${devis.affaires?.numero_police || "-"}</td>
            <td class="label">Num chassis :</td>
            <td class="value">${devis.affaires?.voitures?.num_chassis || "-"}</td>
          </tr>
          <tr>
            <td class="label">Expert 1:</td>
            <td class="value">${devis.affaires?.experts?.nom || "-"} ${devis.affaires?.experts?.prenom || ""}</td>
            <td class="label">Réf Sin :</td>
            <td class="value">${devis.affaires?.ref_sin || "-"}</td>
          </tr>
          <tr>
            <td class="label">Expert 2:</td>
            <td class="value">-</td>
            <td class="label">Agent :</td>
            <td class="value">${devis.affaires?.agents ? `${devis.affaires.agents.nom} ${devis.affaires.agents.prenom} - ${devis.affaires.agents.compagnie}` : "-"}</td>
          </tr>
        </table>

        <!-- Tableau des articles -->
        <table class="articles-table">
          <thead>
            <tr>
              <th style="width: 15%">Intervention</th>
              <th style="width: 35%">Désignation</th>
              <th style="width: 8%">Qté</th>
              <th style="width: 12%">P.U/H.T</th>
              <th style="width: 12%">Montant H.T</th>
              <th style="width: 8%">TVA</th>
              <th style="width: 10%">Montant TTC</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colspan="7" style="background-color: #f0f0f0; font-weight: bold; text-align: left;">Intervention:</td>
            </tr>
            ${
              articlesData
                ?.map((article) => {
                  const totalHT = article.quantite * article.prix_ht
                  const tva = article.intervention === "OCCASION" ? 0 : totalHT * 0.2
                  const totalTTC = totalHT + tva
                  const tvaPercent = article.intervention === "OCCASION" ? "" : "20%"

                  return `
                <tr>
                  <td>${article.intervention}</td>
                  <td class="description">${article.description}</td>
                  <td>${article.quantite}</td>
                  <td>${article.prix_ht.toFixed(2).replace(".", ",")}</td>
                  <td>${totalHT.toFixed(2).replace(".", ",")}</td>
                  <td>${tvaPercent}</td>
                  <td>${totalTTC.toFixed(2).replace(".", ",")}</td>
                </tr>
              `
                })
                .join("") || ""
            }
            ${
              devis.mo_tolerie
                ? `
              <tr>
                <td>MAIN D'ŒUVRE</td>
                <td class="description">TOLERIE</td>
                <td>1</td>
                <td>${devis.mo_tolerie.toFixed(2).replace(".", ",")}</td>
                <td>${devis.mo_tolerie.toFixed(2).replace(".", ",")}</td>
                <td>20%</td>
                <td>${(devis.mo_tolerie * 1.2).toFixed(2).replace(".", ",")}</td>
              </tr>
            `
                : ""
            }
            ${
              devis.mo_peinture
                ? `
              <tr>
                <td>MAIN D'ŒUVRE</td>
                <td class="description">PEINTURE</td>
                <td>1</td>
                <td>${devis.mo_peinture.toFixed(2).replace(".", ",")}</td>
                <td>${devis.mo_peinture.toFixed(2).replace(".", ",")}</td>
                <td>20%</td>
                <td>${(devis.mo_peinture * 1.2).toFixed(2).replace(".", ",")}</td>
              </tr>
            `
                : ""
            }
            ${
              devis.mo_mecanique
                ? `
              <tr>
                <td>MAIN D'ŒUVRE</td>
                <td class="description">MECANIQUE</td>
                <td>1</td>
                <td>${devis.mo_mecanique.toFixed(2).replace(".", ",")}</td>
                <td>${devis.mo_mecanique.toFixed(2).replace(".", ",")}</td>
                <td>20%</td>
                <td>${(devis.mo_mecanique * 1.2).toFixed(2).replace(".", ",")}</td>
              </tr>
            `
                : ""
            }
            ${
              devis.mo_electrique
                ? `
              <tr>
                <td>MAIN D'ŒUVRE</td>
                <td class="description">ELECTRIQUE</td>
                <td>1</td>
                <td>${devis.mo_electrique.toFixed(2).replace(".", ",")}</td>
                <td>${devis.mo_electrique.toFixed(2).replace(".", ",")}</td>
                <td>20%</td>
                <td>${(devis.mo_electrique * 1.2).toFixed(2).replace(".", ",")}</td>
              </tr>
            `
                : ""
            }
          </tbody>
        </table>

        <!-- Summary Table -->
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px;">
          <tr>
            <td style="width: 33%; vertical-align: top; border: 1px solid black; padding: 10px;">
              <div><strong>MO. Tôlerie :</strong> <span style="float: right;">${(devis.mo_tolerie || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2 })}</span></div>
              <div><strong>MO. Peinture :</strong> <span style="float: right;">${(devis.mo_peinture || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2 })}</span></div>
              <div><strong>MO. Mécanique :</strong> <span style="float: right;">${(devis.mo_mecanique || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2 })}</span></div>
              <div><strong>MO. Eléctrique :</strong> <span style="float: right;">${(devis.mo_electrique || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2 })}</span></div>
              <hr style="margin: 10px 0;">
              <div><strong>TOTAL :</strong> <span style="float: right;">${totalMainOeuvre.toLocaleString("fr-FR", { minimumFractionDigits: 2 })}</span></div>
            </td>
            <td style="width: 33%; vertical-align: top; border: 1px solid black; padding: 10px;">
              <div><strong>INGREDIENTS :</strong> <span style="float: right;">${totauxParType.ingredients.toLocaleString("fr-FR", { minimumFractionDigits: 2 })}</span></div>
              <div><strong>ADAPTABLE :</strong> <span style="float: right;">${totauxParType.adaptable.toLocaleString("fr-FR", { minimumFractionDigits: 2 })}</span></div>
              <div><strong>ORIGINE :</strong> <span style="float: right;">${totauxParType.origine.toLocaleString("fr-FR", { minimumFractionDigits: 2 })}</span></div>
              <div><strong>OCCASSION :</strong> <span style="float: right;">${totauxParType.occasion.toLocaleString("fr-FR", { minimumFractionDigits: 2 })}</span></div>
              <div><strong>AUTRES :</strong> <span style="float: right;">${totauxParType.autres.toLocaleString("fr-FR", { minimumFractionDigits: 2 })}</span></div>
              <hr style="margin: 10px 0;">
              <div><strong>TOTAL :</strong> <span style="float: right;">${totalFourniture.toLocaleString("fr-FR", { minimumFractionDigits: 2 })}</span></div>
            </td>
            <td style="width: 34%; vertical-align: top; border: 1px solid black; padding: 10px;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr style="border-bottom: 1px solid black;">
                  <th style="text-align: left; padding: 5px;"></th>
                  <th style="text-align: center; padding: 5px; border-left: 1px solid black;">Total HT</th>
                  <th style="text-align: center; padding: 5px; border-left: 1px solid black;">TVA 20%</th>
                  <th style="text-align: center; padding: 5px; border-left: 1px solid black;">Total TTC</th>
                </tr>
                <tr>
                  <td style="padding: 5px;"><strong>Fourniture:</strong></td>
                  <td style="text-align: right; padding: 5px; border-left: 1px solid black;">${totalFourniture.toLocaleString("fr-FR", { minimumFractionDigits: 2 })}</td>
                  <td style="text-align: right; padding: 5px; border-left: 1px solid black;">${tvaFourniture.toLocaleString("fr-FR", { minimumFractionDigits: 2 })}</td>
                  <td style="text-align: right; padding: 5px; border-left: 1px solid black;">${ttcFourniture.toLocaleString("fr-FR", { minimumFractionDigits: 2 })}</td>
                </tr>
                <tr>
                  <td style="padding: 5px;"><strong>M. Oeuvre:</strong></td>
                  <td style="text-align: right; padding: 5px; border-left: 1px solid black;">${totalMainOeuvre.toLocaleString("fr-FR", { minimumFractionDigits: 2 })}</td>
                  <td style="text-align: right; padding: 5px; border-left: 1px solid black;">${tvaMainOeuvre.toLocaleString("fr-FR", { minimumFractionDigits: 2 })}</td>
                  <td style="text-align: right; padding: 5px; border-left: 1px solid black;">${ttcMainOeuvre.toLocaleString("fr-FR", { minimumFractionDigits: 2 })}</td>
                </tr>
                <tr style="border-top: 2px solid black; background-color: #f0f0f0;">
                  <td style="padding: 5px;"><strong>TOTAL:</strong></td>
                  <td style="text-align: right; padding: 5px; border-left: 1px solid black;"><strong>${totalGeneral.toLocaleString("fr-FR", { minimumFractionDigits: 2 })}</strong></td>
                  <td style="text-align: right; padding: 5px; border-left: 1px solid black;"><strong>${tvaGenerale.toLocaleString("fr-FR", { minimumFractionDigits: 2 })}</strong></td>
                  <td style="text-align: right; padding: 5px; border-left: 1px solid black;"><strong>${ttcGeneral.toLocaleString("fr-FR", { minimumFractionDigits: 2 })}</strong></td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <!-- Adding amount in words section with proper styling -->
        <div style="margin-top: 20px; text-align: center; font-weight: bold; font-size: 14px; padding: 10px; border: 1px solid #000;">
          Arrêté le présent devis à la somme de ${numberToWords(totalTTC)} Dirhams
        </div>


      </div>
    </body>
    </html>
  `

      const printWindow = window.open("", "_blank")
      if (printWindow) {
        printWindow.document.write(htmlContent)
        printWindow.document.close()
      } else {
        // Fallback: télécharger comme fichier HTML
        const blob = new Blob([htmlContent], { type: "text/html" })
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.href = url
        link.download = `devis-${devis.numero_devis}.html`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      }

      toast({
        title: "Succès",
        description: "Devis généré pour impression PDF",
      })
    } catch (error) {
      console.error("Erreur lors de la génération du PDF:", error)
      toast({
        title: "Erreur",
        description: "Impossible de générer le devis",
        variant: "destructive",
      })
    }
  }

  const numberToWords = (num: number): string => {
    const units = ["", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf"]
    const teens = ["dix", "onze", "douze", "treize", "quatorze", "quinze", "seize", "dix-sept", "dix-huit", "dix-neuf"]
    const tens = [
      "",
      "",
      "vingt",
      "trente",
      "quarante",
      "cinquante",
      "soixante",
      "soixante-dix",
      "quatre-vingt",
      "quatre-vingt-dix",
    ]
    const hundreds = [
      "",
      "cent",
      "deux cents",
      "trois cents",
      "quatre cents",
      "cinq cents",
      "six cents",
      "sept cents",
      "huit cents",
      "neuf cents",
    ]

    if (num === 0) return "zéro"

    const integerPart = Math.floor(num)
    const decimalPart = Math.round((num - integerPart) * 100)

    let result = ""

    // Conversion de la partie entière
    if (integerPart >= 1000000) {
      const millions = Math.floor(integerPart / 1000000)
      result += convertHundreds(millions) + " million" + (millions > 1 ? "s" : "") + " "
      const remainder = integerPart % 1000000
      if (remainder > 0) {
        result += convertThousands(remainder)
      }
    } else if (integerPart >= 1000) {
      result += convertThousands(integerPart)
    } else {
      result += convertHundreds(integerPart)
    }

    // Ajout des centimes si nécessaire
    if (decimalPart > 0) {
      result += ", " + convertHundreds(decimalPart) + " centime" + (decimalPart > 1 ? "s" : "")
    }

    return result.trim()

    function convertHundreds(n: number): string {
      if (n === 0) return ""
      if (n < 10) return units[n]
      if (n < 20) return teens[n - 10]
      if (n < 100) {
        const ten = Math.floor(n / 10)
        const unit = n % 10
        if (ten === 7 || ten === 9) {
          return tens[ten - 1] + "-" + teens[unit]
        }
        return tens[ten] + (unit > 0 ? "-" + units[unit] : "")
      }

      const hundred = Math.floor(n / 100)
      const remainder = n % 100
      let result = hundreds[hundred]
      if (remainder > 0) {
        result += " " + convertHundreds(remainder)
      }
      return result
    }

    function convertThousands(n: number): string {
      const thousands = Math.floor(n / 1000)
      const remainder = n % 1000

      let result = ""
      if (thousands === 1) {
        result = "mille"
      } else {
        result = convertHundreds(thousands) + " mille"
      }

      if (remainder > 0) {
        result += " " + convertHundreds(remainder)
      }

      return result
    }
  }

  // Sauvegarder un devis
  const handleSaveDevis = async () => {
    if (!formData.numero_devis.trim() || !formData.affaire_id) {
      toast({
        title: "Erreur",
        description: "Le numéro de devis et l'affaire sont obligatoires",
        variant: "destructive",
      })
      return
    }

    const totals = calculateTotals()

    try {
      const devisData = {
        numero_devis: formData.numero_devis,
        date_devis: formData.date_devis,
        statut: formData.statut,
        affaire_id: Number.parseInt(formData.affaire_id),
        montant_ht: Number.parseFloat(totals.totalHT),
        montant_tva: Number.parseFloat(totals.totalTVA),
        montant_ttc: Number.parseFloat(totals.totalTTC),
        mo_tolerie: formData.mo_tolerie,
        mo_peinture: formData.mo_peinture,
        mo_mecanique: formData.mo_mecanique,
        mo_electrique: formData.mo_electrique,
      }

      let devisId: number

      if (editingDevis) {
        const { error } = await supabase.from("devis").update(devisData).eq("id", editingDevis.id)
        if (error) throw error
        devisId = editingDevis.id
        toast({ title: "Succès", description: "Devis modifié avec succès" })
      } else {
        const { data, error } = await supabase.from("devis").insert([devisData]).select().single()
        if (error) throw error
        devisId = data.id
        toast({ title: "Succès", description: "Devis créé avec succès" })
      }

      // Supprimer les anciens articles si modification
      if (editingDevis) {
        await supabase.from("devis_articles").delete().eq("devis_id", devisId)
      }

      // Insérer les articles du devis
      const articlesData = devisArticles
        .filter((article) => article.description.trim())
        .map((article) => ({
          devis_id: devisId,
          article_id: article.article_id || null,
          description: article.description,
          quantite: article.quantite,
          prix_ht: article.prix_ht,
          fournisseur_id: article.fournisseur_id || null,
          intervention: article.intervention,
        }))

      if (articlesData.length > 0) {
        const { error: articlesError } = await supabase.from("devis_articles").insert(articlesData)
        if (articlesError) throw articlesError
      }

      setIsDialogOpen(false)
      resetForm()
      fetchData()
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error)
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder le devis",
        variant: "destructive",
      })
    }
  }

  // Supprimer un devis
  const handleDeleteDevis = async (devis: Devis) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le devis ${devis.numero_devis} ?`)) {
      return
    }

    try {
      const { error } = await supabase.from("devis").delete().eq("id", devis.id)
      if (error) throw error
      toast({ title: "Succès", description: "Devis supprimé avec succès" })
      fetchData()
    } catch (error) {
      console.error("Erreur lors de la suppression:", error)
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le devis",
        variant: "destructive",
      })
    }
  }

  // Obtenir les informations du statut
  const getStatutInfo = (statut: string) => {
    return statutsDevis.find((s) => s.value === statut) || statutsDevis[0]
  }

  const totals = calculateTotals()

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-yellow-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Chargement des devis...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-yellow-100 p-6">
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
              <h1 className="text-3xl font-bold text-gray-900">Gestion des Devis</h1>
              <p className="text-gray-600">Créer et gérer les devis de réparation</p>
            </div>
          </div>
          <Badge variant="secondary" className="text-lg px-4 py-2">
            {devis.length} devis
          </Badge>
        </div>

        {/* Barre de recherche et bouton d'ajout */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Rechercher un devis..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button onClick={handleAddDevis} className="bg-amber-600 hover:bg-amber-700">
                <Plus className="h-4 w-4 mr-2" />
                Nouveau Devis
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Liste des devis */}
        <Card>
          <CardHeader>
            <CardTitle>Liste des Devis</CardTitle>
            <CardDescription>
              {filteredDevis.length} devis trouvé{filteredDevis.length > 1 ? "s" : ""}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredDevis.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">Aucun devis trouvé</p>
                <p className="text-gray-400">Commencez par créer votre premier devis</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Numéro</TableHead>
                      <TableHead>Affaire</TableHead>
                      <TableHead>Client / Véhicule</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Montant TTC</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDevis.map((devis) => {
                      const statutInfo = getStatutInfo(devis.statut)
                      return (
                        <TableRow key={devis.id}>
                          <TableCell className="font-medium">{devis.numero_devis}</TableCell>
                          <TableCell>{devis.affaires?.numero_affaire}</TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="font-medium">
                                {devis.affaires?.clients?.prenom} {devis.affaires?.clients?.nom}
                              </div>
                              <div className="text-sm text-gray-500">
                                {devis.affaires?.voitures?.immatriculation} - {devis.affaires?.voitures?.marque}{" "}
                                {devis.affaires?.voitures?.modele}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={`${statutInfo.color} text-white`}>{statutInfo.label}</Badge>
                          </TableCell>
                          <TableCell className="font-medium">{devis.montant_ttc.toFixed(2)} €</TableCell>
                          <TableCell>{new Date(devis.date_devis).toLocaleDateString("fr-FR")}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDownloadDevis(devis)}
                                title="Télécharger le devis"
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditDevis(devis)}
                                title="Modifier le devis"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteDevis(devis)}
                                className="text-red-600 hover:text-red-700"
                                title="Supprimer le devis"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dialog pour créer/modifier un devis */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingDevis ? "Modifier le Devis" : "Nouveau Devis"}</DialogTitle>
              <DialogDescription>
                {editingDevis ? "Modifiez les informations du devis" : "Créez un nouveau devis de réparation"}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Informations générales */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="numero_devis">Numéro de devis *</Label>
                  <Input
                    id="numero_devis"
                    value={formData.numero_devis}
                    onChange={(e) => setFormData({ ...formData, numero_devis: e.target.value })}
                    placeholder="DEV-2024-001"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date_devis">Date du devis</Label>
                  <Input
                    id="date_devis"
                    type="date"
                    value={formData.date_devis}
                    onChange={(e) => setFormData({ ...formData, date_devis: e.target.value })}
                  />
                </div>
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
                      {statutsDevis.map((statut) => (
                        <SelectItem key={statut.value} value={statut.value}>
                          {statut.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="affaire_id">Affaire *</Label>
                  <Select
                    value={formData.affaire_id}
                    onValueChange={(value) => setFormData({ ...formData, affaire_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une affaire" />
                    </SelectTrigger>
                    <SelectContent>
                      {affaires.map((affaire) => (
                        <SelectItem key={affaire.id} value={affaire.id.toString()}>
                          {affaire.numero_affaire} - {affaire.clients?.prenom} {affaire.clients?.nom}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              {/* Articles du devis */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Articles et Pièces</h3>
                  <Button type="button" onClick={addArticleLine} variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter une ligne
                  </Button>
                </div>

                <div className="space-y-3">
                  {devisArticles.map((article, index) => (
                    <Card key={index} className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
                        <div className="md:col-span-2 space-y-2">
                          <Label>Description</Label>
                          <div className="space-y-2">
                            <Select
                              value={article.article_id?.toString() || ""}
                              onValueChange={(value) => selectArticleFromCatalog(index, value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Choisir du catalogue" />
                              </SelectTrigger>
                              <SelectContent>
                                {articles.map((art) => (
                                  <SelectItem key={art.id} value={art.id.toString()}>
                                    {art.description} - {art.prix_ht.toFixed(2)}€
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Input
                              value={article.description}
                              onChange={(e) => updateArticle(index, "description", e.target.value)}
                              placeholder="Description de l'article"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Intervention</Label>
                          <Select
                            value={article.intervention}
                            onValueChange={(value) => updateArticle(index, "intervention", value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {interventions.map((intervention) => (
                                <SelectItem key={intervention} value={intervention}>
                                  {intervention}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Quantité</Label>
                          <Input
                            type="number"
                            min="1"
                            value={article.quantite}
                            onChange={(e) => updateArticle(index, "quantite", Number.parseInt(e.target.value) || 1)}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Prix HT (€)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={article.prix_ht}
                            onChange={(e) => updateArticle(index, "prix_ht", Number.parseFloat(e.target.value) || 0)}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="text-right">
                            <div className="text-sm text-gray-500">Total</div>
                            <div className="font-medium">{article.total.toFixed(2)} €</div>
                          </div>
                          {devisArticles.length > 1 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeArticleLine(index)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>

                      <div className="mt-4 space-y-2">
                        <Label>Fournisseur</Label>
                        <Select
                          value={article.fournisseur_id?.toString() || ""}
                          onValueChange={(value) =>
                            updateArticle(index, "fournisseur_id", Number.parseInt(value) || undefined)
                          }
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
                    </Card>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Main d'œuvre */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Main d'Œuvre</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="mo_tolerie">Tôlerie (€)</Label>
                    <Input
                      id="mo_tolerie"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.mo_tolerie}
                      onChange={(e) => setFormData({ ...formData, mo_tolerie: Number.parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mo_peinture">Peinture (€)</Label>
                    <Input
                      id="mo_peinture"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.mo_peinture}
                      onChange={(e) =>
                        setFormData({ ...formData, mo_peinture: Number.parseFloat(e.target.value) || 0 })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mo_mecanique">Mécanique (€)</Label>
                    <Input
                      id="mo_mecanique"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.mo_mecanique}
                      onChange={(e) =>
                        setFormData({ ...formData, mo_mecanique: Number.parseFloat(e.target.value) || 0 })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mo_electrique">Électrique (€)</Label>
                    <Input
                      id="mo_electrique"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.mo_electrique}
                      onChange={(e) =>
                        setFormData({ ...formData, mo_electrique: Number.parseFloat(e.target.value) || 0 })
                      }
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Totaux */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-4">
                  <Calculator className="h-5 w-5" />
                  <h3 className="text-lg font-semibold">Récapitulatif</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-right">
                  <div>
                    <div className="text-sm text-gray-500">Total HT</div>
                    <div className="text-xl font-medium">{totals.totalHT} €</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">TVA</div>
                    <div className="text-xl font-medium">{totals.totalTVA} €</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Total TTC</div>
                    <div className="text-2xl font-bold text-green-600">{totals.totalTTC} €</div>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleSaveDevis} className="bg-amber-600 hover:bg-amber-700">
                {editingDevis ? "Modifier" : "Créer"} le Devis
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
