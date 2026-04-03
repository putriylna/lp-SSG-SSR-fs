// src/components/CategoryFilter.tsx
import React from 'react';
import { motion } from 'framer-motion';
import type { Category } from '../types/category';

interface CategoryFilterProps {
  categories: Category[];
  selectedId?: string; // Menerima state dari Dashboard
  onSelect: (id: string | undefined) => void;
}

const CategoryFilter: React.FC<CategoryFilterProps> = ({ categories, selectedId, onSelect }) => {
  return (
    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-2">
      {/* Tombol "All" */}
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => onSelect(undefined)}
        className={`px-5 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap border ${
          selectedId === undefined
            ? 'bg-yellow-500 text-white border-yellow-500 shadow-sm shadow-yellow-200'
            : 'bg-white text-gray-500 border-yellow-100 hover:border-yellow-300'
        }`}
      >
        Semua
      </motion.button>

      {/* Daftar Kategori dari Database */}
      {categories.map((cat) => (
        <motion.button
          key={cat.id}
          whileTap={{ scale: 0.95 }}
          onClick={() => onSelect(cat.id)}
          className={`px-5 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap border ${
            selectedId === cat.id
              ? 'bg-yellow-500 text-white border-yellow-500 shadow-sm shadow-yellow-200'
              : 'bg-white text-gray-500 border-yellow-100 hover:border-yellow-300'
          }`}
        >
          {cat.name}
        </motion.button>
      ))}
    </div>
  );
};

export default CategoryFilter;