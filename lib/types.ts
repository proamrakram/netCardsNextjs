export interface Category {
  id: string
  name: string
  name_ar: string
  type: "hourly" | "monthly"
  description: string | null
  created_at: string
}

export interface Package {
  id: string
  category_id: string
  name: string
  name_ar: string
  description: string | null
  duration: string
  price: number
  is_active: boolean
  created_at: string
  category?: Category
  available_count?: number
}

export interface Card {
  id: string
  package_id: string
  username: string
  password: string
  status: "available" | "reserved" | "sold"
  reserved_at: string | null
  reserved_by: string | null
  sold_at: string | null
  created_at: string
  package?: Package
}

export interface Profile {
  id: string
  full_name: string | null
  phone: string | null
  is_admin: boolean
  created_at: string
}

export interface Order {
  id: string
  user_id: string
  card_id: string | null
  package_id: string
  status: "pending" | "confirmed" | "cancelled"
  payment_method: string
  payment_proof_url: string | null
  total_price: number
  notes: string | null
  created_at: string
  confirmed_at: string | null
  card?: Card
  package?: Package
  profile?: Profile
}
