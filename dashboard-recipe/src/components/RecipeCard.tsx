// src/components/RecipeCard.tsx
import React from 'react';
import { UtensilsCrossed, Edit3, Trash2, Loader2, Clock, ChevronRight } from 'lucide-react';
import type { Recipe } from '../types/recipe';

interface RecipeCardProps {
  recipe: Recipe;
  onViewDetail: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string, imageUrl?: string | null) => void;
  isDeleting?: boolean;
}

const RecipeCard: React.FC<RecipeCardProps> = ({ 
  recipe, 
  onViewDetail, 
  onEdit, 
  onDelete, 
  isDeleting 
}) => {
  return (
    <div className="group bg-white rounded-[1.5rem] border border-slate-100 hover:border-yellow-200 hover:shadow-xl hover:shadow-yellow-900/5 transition-all duration-500 overflow-hidden flex h-[160px] relative">
      
      {/* 1. Image Section (Kiri) - Diperlebar sedikit agar lebih jelas */}
      <div 
        className="relative w-2/5 overflow-hidden cursor-pointer"
        onClick={() => onViewDetail(recipe.id)}
      >
        <img 
          src={recipe.image_url || 'https://via.placeholder.com/400x300'} 
          alt={recipe.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors"></div>
      </div>

      {/* 2. Content Section (Kanan) */}
      <div className="flex-1 p-4 flex flex-col justify-between min-w-0 relative">
        
        {/* Tombol Manajemen (Hanya muncul jika props onEdit/onDelete ada) */}
        {(onEdit || onDelete) && (
          <div className="absolute top-3 right-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
            {onEdit && (
              <button 
                onClick={(e) => { e.stopPropagation(); onEdit(recipe.id); }}
                className="p-2 bg-white hover:bg-yellow-500 hover:text-white text-slate-400 rounded-lg transition-colors shadow-sm border border-slate-100"
                title="Edit"
              >
                <Edit3 size={14} />
              </button>
            )}
            {onDelete && (
              <button 
                onClick={(e) => { e.stopPropagation(); onDelete(recipe.id, recipe.image_url); }}
                disabled={isDeleting}
                className="p-2 bg-white hover:bg-red-500 hover:text-white text-slate-400 rounded-lg transition-colors shadow-sm border border-slate-100"
                title="Hapus"
              >
                {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
              </button>
            )}
          </div>
        )}

        {/* Info Atas */}
        <div className="pr-12">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Clock size={12} className="text-yellow-500" />
            <span className="text-[10px] font-semibold text-slate-400 tracking-wide">
              {recipe.cooking_time || '30'} menit
            </span>
          </div>

          <h3 
            className="text-sm md:text-base font-bold text-slate-900 leading-tight mb-1 group-hover:text-yellow-600 transition-colors line-clamp-2 cursor-pointer capitalize"
            onClick={() => onViewDetail(recipe.id)}
          >
            {recipe.title}
          </h3>
          
          <p className="text-[11px] text-slate-400 font-medium">
            Oleh <span className="text-slate-700">Koki Flavoriz</span>
          </p>
        </div>

        {/* Info Bawah & Detail Button */}
        <div className="flex items-center justify-between mt-2">
          {/* Badge Tingkat Kesulitan - Warna Kuning Teks Hitam */}
          <div className="flex items-center">
             <div className="px-2.5 py-1 bg-yellow-400 rounded-lg shadow-sm shadow-yellow-200">
                <span className="text-[9px] font-bold text-black capitalize">
                  {recipe.difficulty || 'Mudah'}
                </span>
             </div>
          </div>
          
          <button 
            onClick={() => onViewDetail(recipe.id)}
            className="flex items-center gap-1 text-slate-900 hover:text-yellow-600 transition-colors group/btn"
          >
            <span className="text-[10px] font-bold">Lihat detail</span>
            <ChevronRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default RecipeCard;