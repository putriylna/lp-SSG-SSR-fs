// src/types/recipe.ts
import type { Category } from './category'
import type { Profile } from './profile'

export type Difficulty = 'easy' | 'medium' | 'hard'

export interface Recipe {
  id: string
  created_at: string
  title: string
  slug: string
  description: string
  cooking_time: number
  servings: number
  difficulty: Difficulty
  image_url: string | null
  category_id: string
  author_id: string
  categories?: Category
  profiles?: Profile
}