import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

// Check if Supabase environment variables are available
export const isSupabaseConfigured =
  typeof process.env.NEXT_PUBLIC_SUPABASE_URL === "string" &&
  process.env.NEXT_PUBLIC_SUPABASE_URL.length > 0 &&
  typeof process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY === "string" &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length > 0

const createMockClient = () => ({
  from: () => ({
    select: () => Promise.resolve({ data: [], error: null }),
    insert: () => Promise.resolve({ data: null, error: null }),
    update: () => Promise.resolve({ data: null, error: null }),
    delete: () => Promise.resolve({ data: null, error: null }),
  }),
  auth: {
    signUp: () => Promise.resolve({ data: null, error: null }),
    signInWithPassword: () => Promise.resolve({ data: null, error: null }),
    signOut: () => Promise.resolve({ error: null }),
    getUser: () => Promise.resolve({ data: { user: null }, error: null }),
  },
})

export const createClient = () => {
  if (!isSupabaseConfigured) {
    console.warn("Supabase environment variables are not set. Using mock client.")
    return createMockClient()
  }
  return createClientComponentClient()
}

export const supabase = createClient()

// Types pour TypeScript
export type Client = {
  id: number
  nom: string
  prenom: string
  adresse?: string
  telephone?: string
  email?: string
  ice?: string // Added ICE field to Client type
  created_at: string
}

export type Voiture = {
  id: number
  immatriculation: string
  marque: string
  modele: string
  num_chassis?: string
  date_mec?: string
  client_id: number
  created_at: string
}

export type Fournisseur = {
  id: number
  nom: string
  adresse?: string
  telephone?: string
  email?: string
  created_at: string
}

export type Expert = {
  id: number
  nom: string
  prenom: string
  telephone?: string
  email?: string
  created_at: string
}

export type Assurance = {
  id: number
  nom: string
  adresse?: string
  telephone?: string
  email?: string
  created_at: string
}

export type Affaire = {
  id: number
  numero_affaire: string
  date_ouverture: string
  statut: string
  client_id?: number
  voiture_id?: number
  assurance_id?: number
  expert_id?: number
  description?: string
  numero_police?: string
  ref_sin?: string
  agent?: string
  created_at: string
}

export type Article = {
  id: number
  description: string
  prix_ht: number
  fournisseur_id?: number
  created_at: string
}

export type Devis = {
  id: number
  numero_devis: string
  date_devis: string
  statut: string
  affaire_id: number
  montant_ht: number
  montant_tva: number
  montant_ttc: number
  mo_tolerie: number
  mo_peinture: number
  mo_mecanique: number
  mo_electrique: number
  created_at: string
}
