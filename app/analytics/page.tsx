"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts"
import { TrendingUp, TrendingDown, DollarSign, FileText, Car, Users, Package, Calculator } from "lucide-react"
import { formatFrenchNumber } from "@/lib/utils"

interface AnalyticsData {
  totalAffaires: number
  totalClients: number
  totalVehicules: number
  totalDevis: number
  totalRevenues: number
  totalDepenses: number
  beneficeTotal: number
  affairesParStatut: { statut: string; count: number; color: string }[]
  beneficesParMois: { mois: string; benefice: number; revenus: number; depenses: number }[]
  topClients: { nom: string; prenom: string; totalAffaires: number; totalRevenues: number }[]
  affairesRentabilite: AffaireRentabilite[]
}

interface AffaireRentabilite {
  id: number
  numero_affaire: string
  client_nom: string
  client_prenom: string
  voiture: string
  statut: string
  revenus_prevus: number
  depenses_reelles: number
  benefice: number
  marge: number
}

const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#06B6D4"]

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState("6months")
  const supabase = createClient()

  useEffect(() => {
    fetchAnalyticsData()
  }, [selectedPeriod])

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true)

      // Statistiques générales
      const [{ count: totalAffaires }, { count: totalClients }, { count: totalVehicules }, { count: totalDevis }] =
        await Promise.all([
          supabase.from("affaires").select("*", { count: "exact", head: true }),
          supabase.from("clients").select("*", { count: "exact", head: true }),
          supabase.from("voitures").select("*", { count: "exact", head: true }),
          supabase.from("devis").select("*", { count: "exact", head: true }),
        ])

      // Affaires par statut
      const { data: affairesStatut } = await supabase.from("affaires").select("statut")

      const statutCounts =
        affairesStatut?.reduce((acc: any, affaire) => {
          acc[affaire.statut] = (acc[affaire.statut] || 0) + 1
          return acc
        }, {}) || {}

      const affairesParStatut = Object.entries(statutCounts).map(([statut, count], index) => ({
        statut,
        count: count as number,
        color: COLORS[index % COLORS.length],
      }))

      // Données financières détaillées
      const { data: affairesData } = await supabase.from("affaires").select(`
          id,
          numero_affaire,
          statut,
          created_at,
          client:clients(nom, prenom),
          voiture:voitures(marque, modele, immatriculation),
          devis(montant_ttc),
          depenses(montant)
        `)

      let totalRevenues = 0
      let totalDepenses = 0
      const affairesRentabilite: AffaireRentabilite[] = []

      affairesData?.forEach((affaire) => {
        const revenus = affaire.devis?.reduce((sum: number, devis: any) => sum + (devis.montant_ttc || 0), 0) || 0
        const depenses = affaire.depenses?.reduce((sum: number, depense: any) => sum + (depense.montant || 0), 0) || 0

        totalRevenues += revenus
        totalDepenses += depenses

        const benefice = revenus - depenses
        const marge = revenus > 0 ? (benefice / revenus) * 100 : 0

        affairesRentabilite.push({
          id: affaire.id,
          numero_affaire: affaire.numero_affaire,
          client_nom: affaire.client.nom,
          client_prenom: affaire.client.prenom,
          voiture: `${affaire.voiture.marque} ${affaire.voiture.modele}`,
          statut: affaire.statut,
          revenus_prevus: revenus,
          depenses_reelles: depenses,
          benefice,
          marge,
        })
      })

      const beneficeTotal = totalRevenues - totalDepenses

      // Top clients
      const clientsMap = new Map()
      affairesData?.forEach((affaire) => {
        const clientKey = `${affaire.client.nom}_${affaire.client.prenom}`
        const revenus = affaire.devis?.reduce((sum: number, devis: any) => sum + (devis.montant_ttc || 0), 0) || 0

        if (clientsMap.has(clientKey)) {
          const existing = clientsMap.get(clientKey)
          existing.totalAffaires += 1
          existing.totalRevenues += revenus
        } else {
          clientsMap.set(clientKey, {
            nom: affaire.client.nom,
            prenom: affaire.client.prenom,
            totalAffaires: 1,
            totalRevenues: revenus,
          })
        }
      })

      const topClients = Array.from(clientsMap.values())
        .sort((a, b) => b.totalRevenues - a.totalRevenues)
        .slice(0, 5)

      // Bénéfices par mois (simulation - dans un vrai projet, on utiliserait des données temporelles)
      const beneficesParMois = [
        { mois: "Jan", benefice: 2400, revenus: 8000, depenses: 5600 },
        { mois: "Fév", benefice: 1800, revenus: 7200, depenses: 5400 },
        { mois: "Mar", benefice: 3200, revenus: 9500, depenses: 6300 },
        { mois: "Avr", benefice: 2800, revenus: 8800, depenses: 6000 },
        { mois: "Mai", benefice: 3600, revenus: 10200, depenses: 6600 },
        { mois: "Jun", benefice: 4200, revenus: 11500, depenses: 7300 },
      ]

      setData({
        totalAffaires: totalAffaires || 0,
        totalClients: totalClients || 0,
        totalVehicules: totalVehicules || 0,
        totalDevis: totalDevis || 0,
        totalRevenues,
        totalDepenses,
        beneficeTotal,
        affairesParStatut,
        beneficesParMois,
        topClients,
        affairesRentabilite: affairesRentabilite.sort((a, b) => b.benefice - a.benefice),
      })
    } catch (error) {
      console.error("Erreur lors du chargement des analytics:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || !data) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* En-tête */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tableau de Bord Analytique</h1>
          <p className="text-gray-600 mt-1">Analyse des performances et rentabilité du garage</p>
        </div>
        <div className="flex items-center gap-2">
          <Calculator className="h-5 w-5 text-blue-600" />
          <span className="text-sm text-gray-600">Données en temps réel</span>
        </div>
      </div>

      {/* KPIs principaux */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Affaires</p>
                <p className="text-2xl font-bold text-gray-900">{data.totalAffaires}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Revenus Totaux</p>
                <p className="text-2xl font-bold text-green-600">{formatFrenchNumber(data.totalRevenues, 0)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Dépenses Totales</p>
                <p className="text-2xl font-bold text-red-600">{formatFrenchNumber(data.totalDepenses, 0)}</p>
              </div>
              <TrendingDown className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Bénéfice Net</p>
                <p className={`text-2xl font-bold ${data.beneficeTotal >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {formatFrenchNumber(data.beneficeTotal, 0)}
                </p>
              </div>
              <DollarSign className={`h-8 w-8 ${data.beneficeTotal >= 0 ? "text-green-600" : "text-red-600"}`} />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="profitability">Rentabilité</TabsTrigger>
          <TabsTrigger value="clients">Clients</TabsTrigger>
          <TabsTrigger value="trends">Tendances</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Répartition des affaires par statut */}
            <Card>
              <CardHeader>
                <CardTitle>Répartition des Affaires par Statut</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={data.affairesParStatut}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ statut, count }) => `${statut}: ${count}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {data.affairesParStatut.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Évolution des bénéfices */}
            <Card>
              <CardHeader>
                <CardTitle>Évolution des Bénéfices</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={data.beneficesParMois}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mois" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="benefice" stroke="#10B981" strokeWidth={2} />
                    <Line type="monotone" dataKey="revenus" stroke="#3B82F6" strokeWidth={2} />
                    <Line type="monotone" dataKey="depenses" stroke="#EF4444" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Statistiques supplémentaires */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Clients</p>
                    <p className="text-2xl font-bold text-gray-900">{data.totalClients}</p>
                  </div>
                  <Users className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Véhicules Gérés</p>
                    <p className="text-2xl font-bold text-gray-900">{data.totalVehicules}</p>
                  </div>
                  <Car className="h-8 w-8 text-indigo-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Devis Créés</p>
                    <p className="text-2xl font-bold text-gray-900">{data.totalDevis}</p>
                  </div>
                  <Package className="h-8 w-8 text-teal-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="profitability" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Analyse de Rentabilité par Affaire
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.affairesRentabilite.slice(0, 10).map((affaire) => (
                  <div key={affaire.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-medium text-gray-900">{affaire.numero_affaire}</h4>
                        <p className="text-sm text-gray-600">
                          {affaire.client_prenom} {affaire.client_nom} - {affaire.voiture}
                        </p>
                      </div>
                      <Badge
                        className={affaire.benefice >= 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
                      >
                        {affaire.statut}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-3">
                      <div>
                        <p className="text-xs text-gray-500">Revenus Prévus</p>
                        <p className="font-medium text-blue-600">{formatFrenchNumber(affaire.revenus_prevus)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Dépenses Réelles</p>
                        <p className="font-medium text-red-600">{formatFrenchNumber(affaire.depenses_reelles)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Bénéfice</p>
                        <p className={`font-medium ${affaire.benefice >= 0 ? "text-green-600" : "text-red-600"}`}>
                          {formatFrenchNumber(affaire.benefice)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Marge</p>
                        <p className={`font-medium ${affaire.marge >= 0 ? "text-green-600" : "text-red-600"}`}>
                          {affaire.marge.toFixed(1)}%
                        </p>
                      </div>
                    </div>

                    <Progress value={Math.max(0, Math.min(100, affaire.marge + 50))} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="clients" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Top 5 Clients par Chiffre d'Affaires
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.topClients.map((client, index) => (
                  <div
                    key={`${client.nom}_${client.prenom}`}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-600">#{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {client.prenom} {client.nom}
                        </p>
                        <p className="text-sm text-gray-600">
                          {client.totalAffaires} affaire{client.totalAffaires > 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-green-600">{formatFrenchNumber(client.totalRevenues)}</p>
                      <p className="text-xs text-gray-500">Chiffre d'affaires</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Comparaison Revenus vs Dépenses</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={data.beneficesParMois}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mois" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="revenus" fill="#3B82F6" name="Revenus" />
                  <Bar dataKey="depenses" fill="#EF4444" name="Dépenses" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
