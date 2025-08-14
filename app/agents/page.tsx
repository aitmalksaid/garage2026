"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Edit, Trash2, Search, Users } from "lucide-react"
import { supabase } from "@/lib/supabase/client"

interface Agent {
  id: number
  nom: string
  prenom?: string
  telephone?: string
  email?: string
  compagnie?: string
  created_at: string
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null)
  const [formData, setFormData] = useState({
    nom: "",
    prenom: "",
    telephone: "",
    email: "",
    compagnie: "",
  })

  useEffect(() => {
    fetchAgents()
  }, [])

  const fetchAgents = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase.from("agents").select("*").order("nom", { ascending: true })

      if (error) throw error
      setAgents(data || [])
    } catch (error) {
      console.error("Erreur lors du chargement des agents:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveAgent = async () => {
    try {
      if (editingAgent) {
        const { error } = await supabase.from("agents").update(formData).eq("id", editingAgent.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from("agents").insert([formData])
        if (error) throw error
      }

      await fetchAgents()
      setIsDialogOpen(false)
      resetForm()
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error)
    }
  }

  const handleDeleteAgent = async (agent: Agent) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer l'agent ${agent.nom} ?`)) {
      try {
        const { error } = await supabase.from("agents").delete().eq("id", agent.id)

        if (error) throw error
        await fetchAgents()
      } catch (error) {
        console.error("Erreur lors de la suppression:", error)
      }
    }
  }

  const handleEditAgent = (agent: Agent) => {
    setEditingAgent(agent)
    setFormData({
      nom: agent.nom,
      prenom: agent.prenom || "",
      telephone: agent.telephone || "",
      email: agent.email || "",
      compagnie: agent.compagnie || "",
    })
    setIsDialogOpen(true)
  }

  const resetForm = () => {
    setFormData({
      nom: "",
      prenom: "",
      telephone: "",
      email: "",
      compagnie: "",
    })
    setEditingAgent(null)
  }

  const filteredAgents = agents.filter(
    (agent) =>
      agent.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (agent.prenom && agent.prenom.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (agent.compagnie && agent.compagnie.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Users className="h-8 w-8 text-purple-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestion des Agents</h1>
            <p className="text-gray-600">Gérer les agents d'assurance</p>
          </div>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} className="bg-purple-600 hover:bg-purple-700">
              <Plus className="h-4 w-4 mr-2" />
              Nouvel Agent
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editingAgent ? "Modifier l'agent" : "Nouvel agent"}</DialogTitle>
              <DialogDescription>
                {editingAgent ? "Modifiez les informations de l'agent" : "Ajoutez un nouvel agent d'assurance"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="nom">Nom *</Label>
                <Input
                  id="nom"
                  value={formData.nom}
                  onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                  placeholder="Nom de l'agent"
                />
              </div>
              <div>
                <Label htmlFor="prenom">Prénom</Label>
                <Input
                  id="prenom"
                  value={formData.prenom}
                  onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                  placeholder="Prénom"
                />
              </div>
              <div>
                <Label htmlFor="compagnie">Compagnie</Label>
                <Input
                  id="compagnie"
                  value={formData.compagnie}
                  onChange={(e) => setFormData({ ...formData, compagnie: e.target.value })}
                  placeholder="Compagnie d'assurance"
                />
              </div>
              <div>
                <Label htmlFor="telephone">Téléphone</Label>
                <Input
                  id="telephone"
                  value={formData.telephone}
                  onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                  placeholder="Numéro de téléphone"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Adresse email"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Annuler
                </Button>
                <Button onClick={handleSaveAgent} disabled={!formData.nom}>
                  {editingAgent ? "Modifier" : "Ajouter"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des Agents</CardTitle>
          <CardDescription>
            {agents.length} agent{agents.length > 1 ? "s" : ""} enregistré{agents.length > 1 ? "s" : ""}
          </CardDescription>
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-gray-400" />
            <Input
              placeholder="Rechercher un agent..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">Chargement...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Prénom</TableHead>
                  <TableHead>Compagnie</TableHead>
                  <TableHead>Téléphone</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAgents.map((agent) => (
                  <TableRow key={agent.id}>
                    <TableCell className="font-medium">{agent.nom}</TableCell>
                    <TableCell>{agent.prenom || "-"}</TableCell>
                    <TableCell>{agent.compagnie || "-"}</TableCell>
                    <TableCell>{agent.telephone || "-"}</TableCell>
                    <TableCell>{agent.email || "-"}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" onClick={() => handleEditAgent(agent)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDeleteAgent(agent)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
