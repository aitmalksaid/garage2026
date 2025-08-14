import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, Car, FileText, ShoppingCart, TrendingUp, Settings, Building2, UserCheck, Shield } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Navigation Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Car className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-xl font-semibold text-gray-900">Garage Management</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Système de Gestion de Garage</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Gérez efficacement votre garage automobile : clients, véhicules, devis, commandes et analyses
          </p>
        </div>

        {/* Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {/* Gestion des Clients */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader className="text-center">
              <Users className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <CardTitle className="text-xl">Clients</CardTitle>
              <CardDescription>Gérer les informations des clients</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/clients">
                <Button className="w-full bg-blue-600 hover:bg-blue-700">Accéder</Button>
              </Link>
            </CardContent>
          </Card>

          {/* Gestion des Véhicules */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader className="text-center">
              <Car className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <CardTitle className="text-xl">Véhicules</CardTitle>
              <CardDescription>Gérer le parc automobile des clients</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/voitures">
                <Button className="w-full bg-green-600 hover:bg-green-700">Accéder</Button>
              </Link>
            </CardContent>
          </Card>

          {/* Gestion des Affaires */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader className="text-center">
              <FileText className="h-12 w-12 text-purple-600 mx-auto mb-4" />
              <CardTitle className="text-xl">Affaires</CardTitle>
              <CardDescription>Tableau de bord des dossiers de réparation</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/affaires">
                <Button className="w-full bg-purple-600 hover:bg-purple-700">Accéder</Button>
              </Link>
            </CardContent>
          </Card>

          {/* Gestion des Devis */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader className="text-center">
              <FileText className="h-12 w-12 text-orange-600 mx-auto mb-4" />
              <CardTitle className="text-xl">Devis</CardTitle>
              <CardDescription>Créer et gérer les devis</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/devis">
                <Button className="w-full bg-orange-600 hover:bg-orange-700">Accéder</Button>
              </Link>
            </CardContent>
          </Card>

          {/* Bons de Commande */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader className="text-center">
              <ShoppingCart className="h-12 w-12 text-red-600 mx-auto mb-4" />
              <CardTitle className="text-xl">Bons de Commande</CardTitle>
              <CardDescription>Suivi des commandes fournisseurs</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/bons-commande">
                <Button className="w-full bg-red-600 hover:bg-red-700">Accéder</Button>
              </Link>
            </CardContent>
          </Card>

          {/* Analyses */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader className="text-center">
              <TrendingUp className="h-12 w-12 text-indigo-600 mx-auto mb-4" />
              <CardTitle className="text-xl">Analyses</CardTitle>
              <CardDescription>Rapports et analyses de rentabilité</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/analytics">
                <Button className="w-full bg-indigo-600 hover:bg-indigo-700">Accéder</Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Section Gestion des Données */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6 text-center">Gestion des Données de Base</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/fournisseurs">
              <Button
                variant="outline"
                className="w-full h-16 flex flex-col items-center justify-center bg-transparent hover:bg-orange-50 hover:border-orange-300"
              >
                <Building2 className="h-6 w-6 mb-1 text-orange-600" />
                Fournisseurs
              </Button>
            </Link>
            <Link href="/experts">
              <Button
                variant="outline"
                className="w-full h-16 flex flex-col items-center justify-center bg-transparent hover:bg-teal-50 hover:border-teal-300"
              >
                <UserCheck className="h-6 w-6 mb-1 text-teal-600" />
                Experts
              </Button>
            </Link>
            <Link href="/assurances">
              <Button
                variant="outline"
                className="w-full h-16 flex flex-col items-center justify-center bg-transparent hover:bg-indigo-50 hover:border-indigo-300"
              >
                <Shield className="h-6 w-6 mb-1 text-indigo-600" />
                Assurances
              </Button>
            </Link>
            <Link href="/articles">
              <Button
                variant="outline"
                className="w-full h-16 flex flex-col items-center justify-center bg-transparent hover:bg-pink-50 hover:border-pink-300"
              >
                <Settings className="h-6 w-6 mb-1 text-pink-600" />
                Articles
              </Button>
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-gray-600">
          <p>Système de Gestion de Garage - Version 1.0</p>
          <p className="text-sm mt-1">Développé avec Next.js et Supabase</p>
        </div>
      </div>
    </div>
  )
}
