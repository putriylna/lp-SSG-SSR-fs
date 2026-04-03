import { supabase } from '../lib/supabaseClient'
import type { Recipe } from '../types/recipe'
import type { Ingredient } from '../types/ingredient'
import type { Instruction } from '../types/instruction'

interface GetRecipesParams {
  page: number
  limit: number
  categoryId?: string 
  search?: string
  authorId?: string
}

export const getRecipes = async ({ page, limit, categoryId, search, authorId }: GetRecipesParams) => {
  const from = page * limit
  const to = from + limit - 1

  let query = supabase
    .from('recipes')
    .select('*, categories(name)', { count: 'exact' }) 
    .order('created_at', { ascending: false })
    .range(from, to)

  if (categoryId) query = query.eq('category_id', categoryId)
  if (search) query = query.ilike('title', `%${search}%`)
  if (authorId) query = query.eq('author_id', authorId)

  const { data, error, count } = await query
  if (error) throw error
  return { data: data as Recipe[], count }
}

export const getRecipeById = async (id: string) => {
  const { data, error } = await supabase
    .from('recipes')
    .select('*, categories(name)')
    .eq('id', id)
    .maybeSingle() 

  if (error) throw error
  return data as Recipe
}

export const getIngredientsByRecipeId = async (recipeId: string) => {
  const { data, error } = await supabase
    .from('ingredients')
    .select('*')
    .eq('recipe_id', recipeId)
    .order('item_name') 

  if (error) throw error
  return data as Ingredient[]
}

export const getInstructionsByRecipeId = async (recipeId: string) => {
  const { data, error } = await supabase
    .from('instructions')
    .select('*')
    .eq('recipe_id', recipeId)
    .order('step_number', { ascending: true }) 

  if (error) throw error
  return data as Instruction[]
}

export const createRecipe = async (
  recipe: Omit<Recipe, 'id' | 'created_at'>,
  ingredients: any[],
  instructions: any[]
) => {
  try {
    const { data: rec, error: recError } = await supabase
      .from('recipes')
      .insert({
        title: recipe.title,
        slug: recipe.slug,
        description: recipe.description,
        cooking_time: recipe.cooking_time,
        servings: recipe.servings,
        difficulty: recipe.difficulty,
        image_url: recipe.image_url,
        category_id: recipe.category_id,
        author_id: recipe.author_id,
      })
      .select()
      .single()

    if (recError) throw recError

    if (ingredients.length > 0) {
      const { error: ingError } = await supabase.from('ingredients').insert(
        ingredients.map((ing) => ({ 
          recipe_id: rec.id,
          item_name: ing.item_name, 
          quantity: ing.quantity,
          unit: ing.unit
        }))
      )
      if (ingError) throw ingError
    }

    if (instructions.length > 0) {
      const { error: instError } = await supabase.from('instructions').insert(
        instructions.map((inst, index) => ({ 
          recipe_id: rec.id,
          instruction_text: inst.instruction_text, 
          step_number: index + 1 
        }))
      )
      if (instError) throw instError
    }

    return rec as Recipe
  } catch (error: any) {
    console.error('Full createRecipe error:', error)
    throw error
  }
}

/**
 * UPDATE RECIPE - VERSI PERBAIKAN TOTAL
 */
export const updateRecipe = async (
  id: string,
  recipe: Partial<Recipe>,
  ingredients: any[],
  instructions: any[]
) => {
  // 1. Update Tabel Utama (Recipes)
  const { data: rec, error: recError } = await supabase
    .from('recipes')
    .update({
      title: recipe.title,
      description: recipe.description,
      cooking_time: recipe.cooking_time,
      servings: recipe.servings,
      difficulty: recipe.difficulty,
      image_url: recipe.image_url, // Memastikan URL gambar baru tersimpan
      category_id: recipe.category_id
    })
    .eq('id', id)
    .select()
    .single()

  if (recError) throw recError

  // 2. Hapus data relasi lama secara berurutan
  const { error: delIngError } = await supabase.from('ingredients').delete().eq('recipe_id', id)
  if (delIngError) throw delIngError
  
  const { error: delInstError } = await supabase.from('instructions').delete().eq('recipe_id', id)
  if (delInstError) throw delInstError

  // 3. Insert ulang Bahan-bahan
  if (ingredients.length > 0) {
    const { error: ingError } = await supabase.from('ingredients').insert(
      ingredients.map(ing => ({ 
        recipe_id: id,
        item_name: ing.item_name, 
        quantity: ing.quantity,
        unit: ing.unit
      }))
    )
    if (ingError) throw ingError
  }

  // 4. Insert ulang Instruksi
  if (instructions.length > 0) {
    const { error: instError } = await supabase.from('instructions').insert(
      instructions.map((inst, index) => ({ 
        recipe_id: id, 
        instruction_text: inst.instruction_text, 
        step_number: index + 1 
      }))
    )
    if (instError) throw instError
  }

  return rec as Recipe
}

export const deleteRecipe = async (id: string, imageUrl?: string | null) => {
  if (imageUrl) {
    const path = getPathFromUrl(imageUrl)
    await supabase.storage.from('recipe-images').remove([path])
  }

  const { error: recError } = await supabase.from('recipes').delete().eq('id', id)
  if (recError) throw recError
}

const getPathFromUrl = (url: string) => {
  try {
    const urlObj = new URL(url)
    // Menyesuaikan index slice tergantung struktur URL Supabase Anda
    return urlObj.pathname.split('/').slice(5).join('/')
  } catch {
    return url
  }
}