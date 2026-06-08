/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Ingredient } from '../types';
import { formatRupiah } from '../utils';
import { Search, Plus, Edit2, Trash2, X, RefreshCw, Sparkles, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface IngredientManagerProps {
  ingredients: Ingredient[];
  onSaveIngredients: (ingredients: Ingredient[]) => void;
}

export default function IngredientManager({ ingredients, onSaveIngredients }: IngredientManagerProps) {
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  
  // Form states
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('Kg');
  const [price, setPrice] = useState<number | ''>('');
  const [stock, setStock] = useState<number | ''>('');
  const [minStock, setMinStock] = useState<number | ''>('');

  const [errorFlag, setErrorFlag] = useState('');

  const filtered = ingredients.filter(i => 
    i.name.toLowerCase().includes(search.toLowerCase())
  );

  const startEdit = (ing: Ingredient) => {
    setEditingId(ing.id);
    setName(ing.name);
    setUnit(ing.unit);
    setPrice(ing.price);
    setStock(ing.stock ?? 0);
    setMinStock(ing.minStock ?? 0);
    setIsAdding(false);
    setErrorFlag('');
  };

  const startAdd = () => {
    setIsAdding(true);
    setEditingId(null);
    setName('');
    setUnit('Kg');
    setPrice('');
    setStock('0');
    setMinStock('5');
    setErrorFlag('');
  };

  const cancelForm = () => {
    setIsAdding(false);
    setEditingId(null);
    setName('');
    setUnit('Kg');
    setPrice('');
    setStock('');
    setMinStock('');
    setErrorFlag('');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorFlag('Nama bahan baku tidak boleh kosong.');
      return;
    }
    if (price === '' || price <= 0) {
      setErrorFlag('Harga satuan harus lebih besar dari 0.');
      return;
    }

    const finalStock = stock === '' ? 0 : Number(stock);
    const finalMinStock = minStock === '' ? 0 : Number(minStock);

    if (finalStock < 0 || finalMinStock < 0) {
      setErrorFlag('Jumlah stok dan batas aman minimum tidak boleh negatif.');
      return;
    }

    if (editingId) {
      // Update
      const updated = ingredients.map(i => 
        i.id === editingId ? { 
          ...i, 
          name: name.trim(), 
          unit, 
          price: Number(price),
          stock: finalStock,
          minStock: finalMinStock
        } : i
      );
      onSaveIngredients(updated);
    } else {
      // Insert
      const newIng: Ingredient = {
        id: `ing_${Date.now()}`,
        name: name.trim(),
        unit,
        price: Number(price),
        stock: finalStock,
        minStock: finalMinStock
      };
      onSaveIngredients([...ingredients, newIng]);
    }
    cancelForm();
  };

  const handleDelete = (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus bahan baku ini? Produk yang menggunakan bahan ini mungkin perlu dikonfigurasi ulang.')) {
      onSaveIngredients(ingredients.filter(i => i.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      {/* Top action row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-4 rounded-2xl shadow-xl">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            id="search-ingredient"
            type="text"
            className="w-full bg-slate-900/40 border border-white/10 text-white rounded-xl pl-11 pr-4 py-2.5 text-sm focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-500"
            placeholder="Cari bahan baku (tepung, gula, cup...)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        {!isAdding && !editingId && (
          <motion.button
            id="btn-add-ingredient"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={startAdd}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-550 text-white font-medium text-sm rounded-xl cursor-pointer shadow-lg border border-indigo-500/30 transition-all"
          >
            <Plus className="w-4 h-4" />
            Tambah Bahan Baku
          </motion.button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Main List */}
        <div className="lg:col-span-2 glass-panel rounded-2xl shadow-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
            <h2 id="ingredients-list-title" className="font-heading font-semibold text-base text-white">
              Daftar Bahan Baku ({ingredients.length})
            </h2>
            <span className="text-xs font-semibold text-indigo-300 bg-indigo-500/20 px-2.5 py-1 rounded-full border border-indigo-550/20">
              Database Aktif
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/[0.02] border-b border-white/5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-5">Nama Bahan</th>
                  <th className="py-3 px-5">Stok Saat Ini</th>
                  <th className="py-3 px-5 text-right">Harga / Satuan</th>
                  <th className="py-3 px-5 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300 text-sm">
                <AnimatePresence mode="popLayout">
                  {filtered.length === 0 ? (
                    <motion.tr
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <td colSpan={4} className="py-10 text-center text-slate-500 bg-transparent">
                        Tidak ada bahan baku ditemukan
                      </td>
                    </motion.tr>
                  ) : (
                    filtered.map((ing) => (
                      <motion.tr
                        key={ing.id}
                        layoutId={`row_${ing.id}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className={`hover:bg-white/[0.03] transition-colors border-transparent ${editingId === ing.id ? 'bg-indigo-500/10' : ''}`}
                      >
                        <td className="py-3.5 px-5 font-semibold text-white">
                          <div className="space-y-1">
                            <div>{ing.name}</div>
                            {(ing.stock ?? 0) < (ing.minStock ?? 0) && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-md select-none">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                                Di bawah Batas Aman ({ing.minStock ?? 0} {ing.unit})
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-5">
                          <span className={`inline-flex items-center font-mono text-xs font-bold px-2.5 py-1 rounded-lg border ${
                            (ing.stock ?? 0) < (ing.minStock ?? 0) 
                              ? 'bg-red-500/20 text-red-300 border-red-500/30' 
                              : 'bg-white/5 text-slate-200 border-white/10'
                          }`}>
                            {ing.stock ?? 0} {ing.unit}
                          </span>
                        </td>
                        <td className="py-3.5 px-5 text-right font-mono font-medium text-indigo-300">
                          {formatRupiah(ing.price)}
                        </td>
                        <td className="py-3.5 px-5 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              id={`edit-btn-${ing.id}`}
                              onClick={() => startEdit(ing)}
                              className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              id={`delete-btn-${ing.id}`}
                              onClick={() => handleDelete(ing.id)}
                              className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                              title="Hapus"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))
                  )}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </div>

        {/* Side Editor Form */}
        <AnimatePresence mode="wait">
          {(isAdding || editingId) ? (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="glass-panel rounded-2xl shadow-2xl p-5 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <h3 className="font-heading font-semibold text-base text-white">
                  {editingId ? 'Edit Bahan Baku' : 'Tambah Bahan Baku'}
                </h3>
                <button
                  id="close-form-btn"
                  onClick={cancelForm}
                  className="p-1 text-slate-400 hover:text-white rounded-full hover:bg-white/10 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {errorFlag && (
                <div id="form-error" className="p-3 text-xs bg-red-950/20 border border-red-500/20 text-red-350 text-red-300 rounded-xl">
                  {errorFlag}
                </div>
              )}

              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label htmlFor="ing-name-input" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Nama Bahan Baku <span className="text-red-400">*</span>
                  </label>
                  <input
                    id="ing-name-input"
                    type="text"
                    required
                    placeholder="Contoh: Susu Cair Full Cream"
                    className="w-full bg-slate-900/40 border border-white/10 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="ing-unit-select" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                      Satuan Ukur <span className="text-red-450 text-red-400">*</span>
                    </label>
                    <select
                      id="ing-unit-select"
                      className="w-full bg-slate-900 border border-white/10 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium"
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                    >
                      <option value="Kg" className="bg-slate-900 text-white">Kg (Kilogram)</option>
                      <option value="Gram" className="bg-slate-900 text-white">Gram</option>
                      <option value="Liter" className="bg-slate-900 text-white">Liter</option>
                      <option value="Ml" className="bg-slate-900 text-white">Ml (Mililiter)</option>
                      <option value="Pcs" className="bg-slate-900 text-white">Pcs (Keping/Buah)</option>
                      <option value="Butir" className="bg-slate-900 text-white">Butir (Telur dsb)</option>
                      <option value="Pack" className="bg-slate-900 text-white">Pack</option>
                      <option value="Lembar" className="bg-slate-900 text-white">Lembar</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="ing-price-input" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                      Harga per Satuan <span className="text-red-450 text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-550 text-slate-500">
                        Rp
                      </span>
                      <input
                        id="ing-price-input"
                        type="number"
                        min="1"
                        required
                        placeholder="Harga"
                        className="w-full bg-slate-900/40 border border-white/10 text-white rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono"
                        value={price}
                        onChange={(e) => setPrice(e.target.value === '' ? '' : Number(e.target.value))}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="ing-stock-input" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                      Stok Saat Ini ({unit}) <span className="text-red-400">*</span>
                    </label>
                    <input
                      id="ing-stock-input"
                      type="number"
                      step="any"
                      min="0"
                      required
                      placeholder="Contoh: 10"
                      className="w-full bg-slate-900/40 border border-white/10 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono font-medium"
                      value={stock}
                      onChange={(e) => setStock(e.target.value === '' ? '' : Number(e.target.value))}
                    />
                  </div>

                  <div>
                    <label htmlFor="ing-min-stock-input" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                      Batas Aman ({unit}) <span className="text-red-400">*</span>
                    </label>
                    <input
                      id="ing-min-stock-input"
                      type="number"
                      step="any"
                      min="0"
                      required
                      placeholder="Contoh: 2"
                      className="w-full bg-slate-900/40 border border-white/10 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono font-medium"
                      value={minStock}
                      onChange={(e) => setMinStock(e.target.value === '' ? '' : Number(e.target.value))}
                    />
                  </div>
                </div>

                <div className="p-3 bg-indigo-950/20 rounded-xl text-xs text-indigo-300 space-y-1 border border-indigo-500/10">
                  <div className="font-semibold flex items-center gap-1 text-white">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    Tips Konversi Mengukus:
                  </div>
                  <p className="leading-relaxed opacity-90">
                    Disarankan menginput bahan cair kasar dalam <strong>Liter</strong> (misal 1 Liter UHT) dan bahan berat dalam <strong>Kg</strong> (misal 1 Kg Tepung). Saat pembuatan resep nanti, Anda bisa memasukkan takaran desimal (misal 0.25 Kg untuk 250 gram).
                  </p>
                </div>

                <div className="flex gap-2.5 border-t border-white/5 pt-3">
                  <button
                    id="ing-btn-cancel"
                    type="button"
                    onClick={cancelForm}
                    className="flex-1 py-2.5 border border-white/10 hover:bg-white/5 text-slate-300 text-sm font-medium rounded-xl transition-all cursor-pointer text-center"
                  >
                    Batal
                  </button>
                  <button
                    id="ing-btn-submit"
                    type="submit"
                    className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-550 border border-indigo-500/30 text-white text-sm font-medium rounded-xl transition-all cursor-pointer shadow-lg text-center inline-flex items-center justify-center gap-1"
                  >
                    <Check className="w-4 h-4" />
                    Simpan
                  </button>
                </div>
              </form>
            </motion.div>
          ) : (
            <div className="bg-white/[0.01] border border-dashed border-white/10 rounded-2xl p-6 text-center text-slate-450 text-slate-400 flex flex-col items-center justify-center min-h-[300px]">
              <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3 border border-white/5">
                <RefreshCw className="w-6 h-6 text-slate-400 animate-spin-slow" />
              </div>
              <h3 className="font-semibold text-slate-200 text-sm mb-1">Editor Bahan Baku</h3>
              <p className="text-xs max-w-xs leading-relaxed">
                Pilih salah satu bahan di tabel untuk mengubah harga, atau klik tombol tambah untuk merekam bahan baku baru.
              </p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
