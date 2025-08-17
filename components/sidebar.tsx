"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Home,
  Users,
  Car,
  FileText,
  Receipt,
  ShoppingCart,
  BarChart3,
  Building2,
  UserCheck,
  Shield,
  Package,
  UserCog,
} from "lucide-react"

const menuItems = [
  { href: "/", label: "Accueil", icon: Home },
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/voitures", label: "Véhicules", icon: Car },
  { href: "/affaires", label: "Affaires", icon: FileText },
  { href: "/devis", label: "Devis", icon: Receipt },
  { href: "/bons-commande", label: "Bons de Commande", icon: ShoppingCart },
  { href: "/analytics", label: "Analyses", icon: BarChart3 },
  { href: "/fournisseurs", label: "Fournisseurs", icon: Building2 },
  { href: "/experts", label: "Experts", icon: UserCheck },
  { href: "/assurances", label: "Assurances", icon: Shield },
  { href: "/articles", label: "Articles", icon: Package },
  { href: "/agents", label: "Agents", icon: UserCog },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="fixed left-0 top-0 h-full w-64 bg-slate-900 text-white shadow-lg z-50">
      {/* Header */}
      <div className="p-6 border-b border-slate-700">
        <h1 className="text-xl font-bold text-blue-400">Garage CNG</h1>
        <p className="text-sm text-slate-400 mt-1">Système de Gestion</p>
      </div>

      {/* Navigation */}
      <nav className="p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-700">
        <div className="text-xs text-slate-500 text-center">
          <p>Carrosserie Nouvelle Génération</p>
          <p className="mt-1">© 2024 CNG SARL</p>
        </div>
      </div>
    </div>
  )
}
