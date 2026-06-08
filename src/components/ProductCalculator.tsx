/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Product, Ingredient, RecipeItem, OverheadItem } from '../types';
import { formatRupiah, formatPercent } from '../utils';
import { 
  Plus, Edit2, Trash2, X, Sparkles, Check, ChevronRight, HelpCircle, 
  Layers, CircleDollarSign, Percent, AlertCircle, RefreshCw, ShoppingCart, ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ProductCalculatorProps {
  products: Product[];
  ingredients: Ingredient[];
  onSaveProducts: (products: Product[]) => void;
}

export default function ProductCalculator({ products, ingredients, onSaveProducts }: ProductCalculatorProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  // Form States
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Makanan');
  const [description, setDescription] = useState('');
  const [batchSize, setBatchSize] = useState<number>(1);
  const [recipeItems, setRecipeItems] = useState<RecipeItem[]>([]);
  const [laborCost, setLaborCost] = useState<number>(0);
  const [overheads, setOverheads] = useState<OverheadItem[]>([]);
  const [sellingPrice, setSellingPrice] = useState<number>(0);
  const [imageUrl, setImageUrl] = useState('');
  const [barcode, setBarcode] = useState('');

  // Local helper form states
  const [selectedingId, setSelectedIngId] = useState('');
  const [ingAmount, setIngAmount] = useState<number | ''>('');
  
  const [overHeadName, setOverHeadName] = useState('');
  const [overHeadCost, setOverHeadCost] = useState<number | ''>('');

  const [formError, setFormError] = useState('');

  // Formulas
  const totalIngredientsCost = recipeItems.reduce((sum, item) => sum + item.totalCost, 0);
  const totalOverheadsCost = overheads.reduce((sum, item) => sum + item.cost, 0);
  const totalHppPerBatch = totalIngredientsCost + totalOverheadsCost + laborCost;
  const calculatedHppPerUnit = batchSize > 0 ? (totalHppPerBatch / batchSize) : 0;

  // Margin analyses
  const profitAmount = sellingPrice - calculatedHppPerUnit;
  const marginPercent = sellingPrice > 0 ? (profitAmount / sellingPrice) * 100 : 0;
  const markupPercent = calculatedHppPerUnit > 0 ? (profitAmount / calculatedHppPerUnit) * 100 : 0;

  const startAdd = () => {
    setIsAdding(true);
    setEditingId(null);
    setName('');
    setCategory('Makanan');
    setDescription('');
    setBatchSize(1);
    setRecipeItems([]);
    setLaborCost(0);
    setOverheads([]);
    setSellingPrice(0);
    setImageUrl('');
    setBarcode('');
    setFormError('');
  };

  const startEdit = (prod: Product) => {
    setEditingId(prod.id);
    setIsAdding(false);
    setName(prod.name);
    setCategory(prod.category);
    setDescription(prod.description);
    setBatchSize(prod.batchSize);
    setRecipeItems(prod.ingredients);
    setLaborCost(prod.laborCost);
    setOverheads(prod.overheads);
    setSellingPrice(prod.sellingPrice);
    setImageUrl(prod.imageUrl || '');
    setBarcode(prod.barcode || '');
    setFormError('');
  };

  const cancelForm = () => {
    setIsAdding(false);
    setEditingId(null);
    setFormError('');
  };

  // Ingredient list handlers inside Recipe
  const addIngredientToRecipe = () => {
    if (!selectedingId) return;
    if (ingAmount === '' || ingAmount <= 0) {
      alert('Masukkan jumlah takaran yang valid.');
      return;
    }

    const baseIng = ingredients.find(i => i.id === selectedingId);
    if (!baseIng) return;

    // Check duplicate
    const exists = recipeItems.some(item => item.ingredientId === selectedingId);
    if (exists) {
      alert('Bahan ini sudah ada di resep. Silakan hapus item tersebut terlebih dahulu untuk mengubah takaran.');
      return;
    }

    const newItem: RecipeItem = {
      id: `rec_item_${Date.now()}`,
      ingredientId: baseIng.id,
      name: baseIng.name,
      amountNeeded: Number(ingAmount),
      unit: baseIng.unit,
      unitPrice: baseIng.price,
      totalCost: Number(ingAmount) * baseIng.price
    };

    setRecipeItems([...recipeItems, newItem]);
    setSelectedIngId('');
    setIngAmount('');
  };

  const removeIngredientFromRecipe = (id: string) => {
    setRecipeItems(recipeItems.filter(item => item.id !== id));
  };

  // Overhead list handlers
  const addOverhead = () => {
    if (!overHeadName.trim()) return;
    if (overHeadCost === '' || overHeadCost <= 0) {
      alert('Masukkan biaya operasional yang valid.');
      return;
    }

    const newItem: OverheadItem = {
      id: `ov_item_${Date.now()}`,
      name: overHeadName.trim(),
      cost: Number(overHeadCost)
    };

    setOverheads([...overheads, newItem]);
    setOverHeadName('');
    setOverHeadCost('');
  };

  const removeOverhead = (id: string) => {
    setOverheads(overheads.filter(item => item.id !== id));
  };

  // Save Product to Main State
  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('Nama produk tidak boleh kosong.');
      return;
    }
    if (batchSize <= 0) {
      setFormError('Batch size / hasil produksi per batch harus minimal 1 unit/cup/pcs.');
      return;
    }
    if (recipeItems.length === 0) {
      setFormError('Resep tidak boleh kosong. Harap tambahkan minimal 1 bahan baku.');
      return;
    }
    if (sellingPrice <= 0) {
      setFormError('Harga jual harus lebih besar dari 0.');
      return;
    }

    // Default neat fallback image
    const finalImageUrl = imageUrl.trim() || 
      (category === 'Minuman' 
        ? 'https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=600&q=80'
        : 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=600&q=80');

    const calculatedProduct: Product = {
      id: editingId || `prod_${Date.now()}`,
      name: name.trim(),
      category,
      description: description.trim(),
      batchSize,
      ingredients: recipeItems,
      laborCost,
      overheads,
      
      // Calculations
      totalIngredientsCost,
      totalOverheadsCost,
      totalHppPerBatch,
      calculatedHppPerUnit,
      
      // Pricing
      sellingPrice,
      markupPercent: Number(markupPercent.toFixed(2)),
      profitAmount: Number(profitAmount.toFixed(2)),
      marginPercent: Number(marginPercent.toFixed(2)),
      imageUrl: finalImageUrl,
      barcode: barcode.trim()
    };

    if (editingId) {
      // Edit mode
      onSaveProducts(products.map(p => p.id === editingId ? calculatedProduct : p));
    } else {
      // Create mode
      onSaveProducts([...products, calculatedProduct]);
    }

    cancelForm();
  };

  const handleDeleteProduct = (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus produk ini? Produk ini tidak akan lagi muncul di menu transaksi Kasir.')) {
      onSaveProducts(products.filter(p => p.id !== id));
    }
  };

  const applyTargetMargin = (targetMarginPercent: number) => {
    // formula: Price = Hpp / (1 - (margin/100))
    const priceWithMargin = calculatedHppPerUnit / (1 - (targetMarginPercent / 100));
    setSellingPrice(Math.round(priceWithMargin / 100) * 100); // round to nearest Rp 100
  };

  return (
    <div className="space-y-6">
      <AnimatePresence mode="wait">
        {!isAdding && !editingId ? (
          // Product Grid View
          <motion.div
            key="grid"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            {/* Header section with Stats and Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-4 rounded-xl shadow-xl">
              <div className="space-y-1">
                <h2 className="font-heading font-semibold text-lg text-white">
                  Kalkulator HPP & Manajemen Produk
                </h2>
                <p className="text-xs text-slate-400">
                  Formulasikan bahan baku, hitung otomatis penyusutan, overhead, dan temukan harga jual terbaik.
                </p>
              </div>

              <motion.button
                id="btn-trigger-add-prod"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={startAdd}
                className="bg-indigo-600 hover:bg-indigo-550 text-white font-medium text-sm py-2.5 px-4 rounded-xl border border-indigo-500/30 shadow-lg inline-flex items-center gap-2 justify-center cursor-pointer transition-all"
              >
                <Plus className="w-4 h-4" />
                Formulasikan Produk Baru
              </motion.button>
            </div>

            {products.length === 0 ? (
              <div className="glass-panel text-slate-100 rounded-2xl py-12 px-6 text-center max-w-xl mx-auto flex flex-col items-center justify-center space-y-4 shadow-2xl">
                <div className="w-14 h-14 bg-indigo-500/10 border border-indigo-500/20 rounded-full flex items-center justify-center text-indigo-400">
                  <Layers className="w-6 h-6 animate-pulse" />
                </div>
                <h3 className="font-heading font-semibold text-white text-base">Belum Ada Produk Terdaftar</h3>
                <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
                  Mari formulasikan produk kuliner atau dagangan Anda. Kita akan menghitung estimasi HPP berdasarkan bahan baku, tenaga kerja, serta biaya overhead agar harga jual Anda tidak rugi!
                </p>
                <button
                  id="btn-empty-add-prod"
                  onClick={startAdd}
                  className="bg-indigo-600 hover:bg-indigo-550 border border-indigo-500/30 text-white text-xs font-semibold py-2.5 px-4 rounded-xl transition-all cursor-pointer shadow-lg"
                >
                  Buat Master Resep Sekarang
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {products.map(prod => (
                  <motion.div
                    key={prod.id}
                    className="glass-panel rounded-2xl overflow-hidden shadow-xl hover:border-indigo-500/30 hover:shadow-2xl transition-all flex flex-col md:flex-row h-full"
                  >
                    {/* Image Box */}
                    <div className="w-full md:w-2/5 min-h-[160px] md:min-h-full bg-slate-950 relative">
                      <img 
                        src={prod.imageUrl} 
                        alt={prod.name} 
                        className="w-full h-full object-cover absolute inset-0 opacity-85"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute top-2 left-2 bg-slate-900/80 backdrop-blur-md text-[10px] uppercase tracking-wider font-bold text-white px-2.5 py-1 rounded-full border border-white/5">
                        {prod.category}
                      </div>
                    </div>

                    {/* Description Box */}
                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-heading font-bold text-white text-base leading-snug">
                            {prod.name}
                          </h3>
                          {prod.barcode && (
                            <span className="text-[9px] font-mono bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 px-1.5 py-0.2 rounded font-bold" title="Kode Barcode/SKU">
                              [||| {prod.barcode}]
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                          {prod.description || 'Tidak ada deskripsi resep.'}
                        </p>
                        <div className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Porsi produksi: <strong className="text-white">{prod.batchSize} unit / batch</strong></span>
                        </div>
                      </div>

                      {/* Calculations summary row */}
                      <div className="grid grid-cols-2 gap-3 bg-white/[0.02] p-2.5 rounded-xl border border-white/5">
                        <div>
                          <span className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                            HPP Satuan
                          </span>
                          <span className="font-mono text-xs font-bold text-white">
                            {formatRupiah(prod.calculatedHppPerUnit)}
                          </span>
                        </div>
                        <div>
                          <span className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                            Harga Jual
                          </span>
                          <span className="font-mono text-xs font-bold text-emerald-400">
                            {formatRupiah(prod.sellingPrice)}
                          </span>
                        </div>
                      </div>

                      {/* Profit Margin indicator */}
                      <div className="flex items-center justify-between border-t border-white/5 pt-3">
                        <div className="flex items-center gap-1">
                          <span className="text-[11px] font-medium text-slate-400">Margin Profit:</span>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${prod.marginPercent >= 35 ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/10' : 'bg-amber-500/15 text-amber-300 border-amber-500/10'}`}>
                            {formatPercent(prod.marginPercent)}
                          </span>
                        </div>
                        
                        <div id={`actions-${prod.id}`} className="flex gap-1.5">
                          <button
                            id={`edit-prod-btn-${prod.id}`}
                            onClick={() => startEdit(prod)}
                            className="p-1 px-2.5 text-xs text-indigo-305 text-indigo-300 border border-indigo-500/25 hover:bg-white/10 rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                          >
                            <Edit2 className="w-3 h-3" />
                            Resep
                          </button>
                          <button
                            id={`delete-prod-btn-${prod.id}`}
                            onClick={() => handleDeleteProduct(prod.id)}
                            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-white/10 rounded-lg transition-all cursor-pointer"
                            title="Hapus Produk"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        ) : (
          // Product Form Modeler Interface (Full Details)
          <motion.div
            key="form"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="glass-panel rounded-2xl shadow-2xl overflow-hidden border border-white/10"
          >
            {/* Form banner header */}
            <div className="px-5 py-4 bg-white/5 border-b border-white/10 text-white flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase tracking-widest font-bold text-indigo-300">
                  Formulasi Resep & Kalkulasi HPP
                </span>
                <h2 className="font-heading font-semibold text-base">
                  {editingId ? 'Edit Formulir Produk' : 'Tulis Formula Produk Baru'}
                </h2>
              </div>
              <button
                id="close-form-panel-btn"
                onClick={cancelForm}
                className="p-1.5 bg-white/10 hover:bg-white/20 text-slate-305 text-slate-300 hover:text-white rounded-full cursor-pointer transition-colors"
                title="Tutup Form"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div id="product-form-error" className="m-5 p-3.5 bg-red-950/20 border border-red-500/30 text-xs font-semibold text-red-305 text-red-300 rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveProduct} className="p-5 md:p-6 space-y-6">
              {/* SECTION 1: Master Details Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-b border-white/5 pb-5">
                <div className="md:col-span-2 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label htmlFor="prod-name-input" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                        Nama Produk <span className="text-red-400">*</span>
                      </label>
                      <input
                        id="prod-name-input"
                        type="text"
                        required
                        placeholder="Contoh: Kue Soes Vla Vanilla"
                        className="w-full bg-slate-905 bg-slate-900/60 border border-white/10 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-hidden focus:border-indigo-500 transition-all font-medium placeholder:text-slate-500"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </div>

                    <div>
                      <label htmlFor="prod-category-select" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                        Kategori Produk
                      </label>
                      <select
                        id="prod-category-select"
                        className="w-full bg-slate-905 bg-slate-900 border border-white/10 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-hidden focus:border-indigo-500 transition-all font-medium"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                      >
                        <option value="Makanan" className="bg-slate-950">Makanan (Kue, Lauk, dll)</option>
                        <option value="Minuman" className="bg-slate-950">Minuman (Kopi, Boba, dll)</option>
                        <option value="Jasa" className="bg-slate-950">Jasa / Katering</option>
                        <option value="Lainnya" className="bg-slate-950">Lainnya / Paket</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="prod-barcode-input" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                        Barcode / SKU <span className="text-slate-500 text-[10px]">(Opsional)</span>
                      </label>
                      <div className="flex gap-1.5">
                        <input
                          id="prod-barcode-input"
                          type="text"
                          placeholder="Contoh: 899123456"
                          className="w-full bg-slate-905 bg-slate-900/60 border border-white/10 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-hidden focus:border-indigo-500 transition-all font-medium placeholder:text-slate-500 font-mono text-indigo-300"
                          value={barcode}
                          onChange={(e) => setBarcode(e.target.value)}
                        />
                        <button
                          type="button"
                          onClick={() => setBarcode(Math.floor(100000000 + Math.random() * 900000000).toString())}
                          className="px-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-[10.5px] font-bold text-slate-300 rounded-xl cursor-pointer transition-all active:scale-95"
                          title="Generate Barcode Acak"
                        >
                          Acak
                        </button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="prod-description-input" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                      Deskripsi Ringkas Resep
                    </label>
                    <textarea
                      id="prod-description-input"
                      rows={2}
                      placeholder="Tuliskan catatan produksi misal: 'HPP untuk 1 resep adonan menghasilkan 20 pcs soes isi vla'"
                      className="w-full bg-slate-905 bg-slate-900/40 border border-white/10 text-white rounded-xl px-4 py-2 text-sm focus:outline-hidden focus:border-indigo-500 placeholder:text-slate-500"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>
                </div>

                <div className="bg-emerald-950/20 rounded-2xl border border-emerald-500/20 p-4 space-y-3">
                  <div className="flex items-start gap-2.5">
                    <Layers className="w-5 h-5 text-emerald-400 mt-0.5" />
                    <div>
                      <label htmlFor="prod-batch-input" className="block text-xs font-bold text-emerald-300 uppercase tracking-wide">
                        Hasil Produksi (Batch Size)
                      </label>
                      <p className="text-[10px] text-slate-400 leading-normal mt-0.5">
                        Berapa porsi/pcs/pack yang dihasilkan dari total bahan yang ingin Anda tulis di bawah?
                      </p>
                    </div>
                  </div>
                  <div>
                    <input
                      id="prod-batch-input"
                      type="number"
                      min="1"
                      required
                      placeholder="Misal: 10"
                      className="w-full bg-slate-905 bg-slate-900 border border-emerald-500/30 text-emerald-300 font-bold rounded-xl px-4 py-2 text-center text-lg focus:outline-hidden focus:border-emerald-400 font-mono"
                      value={batchSize}
                      onChange={(e) => setBatchSize(e.target.value === '' ? 1 : Math.max(1, Number(e.target.value)))}
                    />
                    <div className="text-center text-[10px] text-emerald-400 font-semibold mt-1.5 text-center">
                      *HPP satuan = Total Cost ÷ {batchSize} pcs
                    </div>
                  </div>
                </div>
              </div>


              {/* SECTION 2: Ingredients formulation inside recipes */}
              <div className="space-y-4 border-b border-white/5 pb-5">
                <div className="flex items-center justify-between">
                  <h3 className="font-heading font-semibold text-white text-sm flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-indigo-400" />
                    1. Formulasi Bahan Baku per {batchSize} Unit Output
                  </h3>
                  <span className="text-xs font-semibold text-slate-400">
                    Subtotal Bahan: <strong className="font-mono text-indigo-300 font-bold">{formatRupiah(totalIngredientsCost)}</strong>
                  </span>
                </div>

                {/* Inline form to select ingredient to add to recipe */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 bg-white/[0.02] p-4 rounded-xl border border-white/5">
                  <div className="sm:col-span-6">
                    <label htmlFor="select-recipe-ing" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1 text-xs">
                      Pilih Bahan Baku dari Database
                    </label>
                    <select
                      id="select-recipe-ing"
                      className="w-full bg-slate-900 border border-white/10 text-white rounded-lg px-3 py-2 text-xs focus:outline-hidden"
                      value={selectedingId}
                      onChange={(e) => setSelectedIngId(e.target.value)}
                    >
                      <option value="" className="bg-slate-950">-- Pilih Bahan Baku --</option>
                      {ingredients.map(ing => (
                        <option key={ing.id} value={ing.id} className="bg-slate-950">
                          {ing.name} ({formatRupiah(ing.price)} / {ing.unit})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-4">
                    <label htmlFor="ingredient-amount-input" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1 text-xs">
                      Porsi Takaran yang Dibutuhkan
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        id="ingredient-amount-input"
                        type="number"
                        step="any"
                        placeholder="Misal 0.5 atau 250"
                        className="w-full bg-slate-900 border border-white/10 text-white rounded-lg px-3 py-2 text-xs font-mono placeholder:text-slate-500"
                        value={ingAmount}
                        onChange={(e) => setIngAmount(e.target.value === '' ? '' : Number(e.target.value))}
                      />
                      <span className="text-xs font-semibold px-2 py-2 bg-white/10 rounded-lg border border-white/10 min-w-[50px] text-center text-slate-300">
                        {ingredients.find(i => i.id === selectedingId)?.unit || '-'}
                      </span>
                    </div>
                  </div>

                  <div className="sm:col-span-2 flex items-end">
                    <button
                      id="btn-add-ingredient-to-recipe"
                      type="button"
                      onClick={addIngredientToRecipe}
                      disabled={!selectedingId}
                      className="w-full py-2 bg-indigo-600 hover:bg-indigo-550 border border-indigo-500/20 disabled:bg-white/5 disabled:text-slate-505 disabled:text-slate-500 text-white rounded-lg text-xs font-semibold cursor-pointer transition-all flex items-center justify-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Pasang
                    </button>
                  </div>
                </div>

                {/* Recipe ingredients table */}
                <div className="border border-white/5 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-white/[0.02] font-semibold text-slate-400 uppercase tracking-tight text-[10px] border-b border-white/5">
                      <tr>
                        <th className="py-2.5 px-4 font-bold text-slate-300">Bahan Baku</th>
                        <th className="py-2.5 px-4 text-center font-bold text-slate-300">Kebutuhan Takaran</th>
                        <th className="py-2.5 px-4 text-right font-bold text-slate-300">Harga Beli Satuan</th>
                        <th className="py-2.5 px-4 text-right font-bold text-slate-300">Subtotal Biaya</th>
                        <th className="py-2.5 px-4 text-center font-bold text-slate-300">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 font-medium">
                      {recipeItems.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-slate-500 font-normal">
                            Belum ada bahan baku terpasang di resep produk ini.
                          </td>
                        </tr>
                      ) : (
                        recipeItems.map(item => (
                          <tr key={item.id} className="hover:bg-white/[0.01]">
                            <td className="py-2 px-4 font-bold text-white">{item.name}</td>
                            <td className="py-2 px-4 text-center">
                              <span className="inline-block px-1.5 py-0.5 bg-white/10 text-slate-300 font-mono text-[11px] rounded border border-white/5">
                                {item.amountNeeded} {item.unit}
                              </span>
                            </td>
                            <td className="py-2 px-4 text-right font-mono text-slate-400">{formatRupiah(item.unitPrice)}</td>
                            <td className="py-2 px-4 text-right font-mono text-white font-bold">
                              {formatRupiah(item.totalCost)}
                            </td>
                            <td className="py-2 px-4 text-center">
                              <button
                                id={`remove-recipe-item-${item.id}`}
                                type="button"
                                onClick={() => removeIngredientFromRecipe(item.id)}
                                className="p-1 text-slate-400 hover:text-red-400 rounded hover:bg-white/10 cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>


              {/* SECTION 3: Labor & Overheads configuration */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-b border-white/5 pb-5">
                {/* Labor (Upah Pembuatan) */}
                <div className="space-y-4">
                  <h3 className="font-heading font-semibold text-white text-sm flex items-center gap-1.5">
                    <CircleDollarSign className="w-4 h-4 text-indigo-400" />
                    2. Upah Tenaga Kerja Langsung per Batch
                  </h3>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    Upah pengerjaan langsung yang dianggarkan untuk memproduksi 1 batch ({batchSize} unit). Misal koki pembuat Kue, atau biaya jasa seduh kopi Anda sendiri.
                  </p>

                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-500">
                      Rp
                    </span>
                    <input
                      id="labor-cost-input"
                      type="number"
                      min="0"
                      placeholder="Masukkan upah kerja per batch, misal 25000"
                      className="w-full bg-slate-900 border border-white/10 text-white rounded-xl pl-10 pr-4 py-2.5 text-sm font-mono font-medium focus:outline-hidden focus:border-indigo-500 placeholder:text-slate-500"
                      value={laborCost === 0 ? '' : laborCost}
                      onChange={(e) => setLaborCost(e.target.value === '' ? 0 : Number(e.target.value))}
                    />
                  </div>
                </div>

                {/* Overheads (Operasional & Kemasan) */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-heading font-semibold text-white text-sm flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-indigo-400" />
                      3. Biaya Overhead & Kemasan per Batch
                    </h3>
                    <span className="text-xs font-semibold text-slate-400 font-mono">
                      {formatRupiah(totalOverheadsCost)}
                    </span>
                  </div>

                  <div className="grid grid-cols-12 gap-2 bg-white/[0.02] p-3 rounded-xl border border-white/5">
                    <div className="col-span-6">
                      <input
                        id="overhead-name-input"
                        type="text"
                        placeholder="Contoh: Box Brownies"
                        className="w-full bg-slate-900 border border-white/10 text-white rounded-lg px-2.5 py-1.5 text-xs font-medium placeholder:text-slate-500"
                        value={overHeadName}
                        onChange={(e) => setOverHeadName(e.target.value)}
                      />
                    </div>
                    <div className="col-span-4">
                      <input
                        id="overhead-cost-input"
                        type="number"
                        placeholder="Biaya, Rp"
                        className="w-full bg-slate-900 border border-white/10 text-white rounded-lg px-2 py-1.5 text-xs font-mono font-medium placeholder:text-slate-500"
                        value={overHeadCost}
                        onChange={(e) => setOverHeadCost(e.target.value === '' ? '' : Number(e.target.value))}
                      />
                    </div>
                    <div className="col-span-2">
                      <button
                        id="btn-add-overhead"
                        type="button"
                        onClick={addOverhead}
                        style={{ height: '100%' }}
                        className="w-full bg-indigo-600 hover:bg-indigo-550 text-white rounded-lg text-xs font-semibold cursor-pointer py-1.5 inline-flex items-center justify-center transition-all border border-indigo-500/20"
                      >
                        Pasang
                      </button>
                    </div>
                  </div>

                  <div className="border border-white/5 rounded-xl overflow-hidden max-h-[150px] overflow-y-auto">
                    <table className="w-full text-left text-xs bg-transparent">
                      <tbody>
                        {overheads.length === 0 ? (
                          <tr>
                            <td className="py-3 text-center text-slate-500 font-normal italic bg-transparent">
                              Tidak ada biaya overhead terpasang.
                            </td>
                          </tr>
                        ) : (
                          overheads.map(ov => (
                            <tr key={ov.id} className="border-b border-white/5 last:border-b-0 hover:bg-white/[0.01] bg-transparent">
                              <td className="py-2 px-3 font-semibold text-slate-300">{ov.name}</td>
                              <td className="py-2 px-3 text-right font-mono text-white font-bold">{formatRupiah(ov.cost)}</td>
                              <td className="py-2 px-3 text-center w-8">
                                <button
                                  id={`remove-overhead-${ov.id}`}
                                  type="button"
                                  onClick={() => removeOverhead(ov.id)}
                                  className="text-slate-400 hover:text-red-400 cursor-pointer p-0.5 rounded hover:bg-white/10 bg-transparent"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>


              {/* SECTION 4: Live summary and target price formulation */}
              <div className="bg-indigo-950/20 border border-indigo-500/20 backdrop-blur-2xl text-white p-5 rounded-3xl grid grid-cols-1 md:grid-cols-3 gap-6 relative shadow-2xl">
                {/* Total accumulation calculations */}
                <div className="space-y-3.5 md:border-r md:border-white/10 pr-5">
                  <h4 className="text-xs uppercase font-extrabold tracking-widest text-indigo-300">
                    Rekapitulasi Harga Pokok
                  </h4>
                  <div className="space-y-1.5 text-xs text-slate-300">
                    <div className="flex justify-between">
                      <span>Bahan Baku:</span>
                      <span className="font-mono">{formatRupiah(totalIngredientsCost)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tenaga Kerja:</span>
                      <span className="font-mono">{formatRupiah(laborCost)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Overhead:</span>
                      <span className="font-mono">{formatRupiah(totalOverheadsCost)}</span>
                    </div>
                    <div className="border-t border-white/10 pt-1.5 flex justify-between font-bold text-white text-sm">
                      <span>Total HPP / Batch:</span>
                      <span className="font-mono text-indigo-300">{formatRupiah(totalHppPerBatch)}</span>
                    </div>
                  </div>

                  <div className="bg-indigo-500/10 p-3 rounded-xl border border-indigo-500/20 mt-2">
                    <span className="block text-[10px] text-indigo-300 uppercase tracking-widest font-bold">
                      HPP Satuan (HPP per Unit)
                    </span>
                    <span className="font-mono text-xl font-bold text-white">
                      {formatRupiah(calculatedHppPerUnit)}
                    </span>
                  </div>
                </div>

                {/* Target pricing suggested boxes */}
                <div className="space-y-3 md:border-r md:border-white/10 pr-5">
                  <h4 className="text-xs uppercase font-extrabold tracking-widest text-indigo-300 flex items-center justify-between">
                    <span>Menu Rekomendasi Jual</span>
                    <HelpCircle className="w-3.5 h-3.5 text-slate-400" title="Harga Jual = HPP Satuan / (1 - Target Margin)" />
                  </h4>
                  <p className="text-[10px] text-slate-400 leading-normal">
                    Pilih target margin berikut untuk memasang harga jual secara instan berdasarkan HPP satuan:
                  </p>

                  <div className="grid grid-cols-3 gap-2">
                    <button
                      id="btn-margin-30"
                      type="button"
                      onClick={() => applyTargetMargin(30)}
                      className="p-1.5 bg-white/5 hover:bg-indigo-600 border border-white/10 hover:border-indigo-400/50 rounded-lg text-center text-[11px] font-semibold transition-all cursor-pointer text-white"
                    >
                      Margin 30%
                      <span className="block font-mono font-bold text-[10px] text-indigo-300 mt-0.5">
                        {formatRupiah(calculatedHppPerUnit / 0.7)}
                      </span>
                    </button>
                    <button
                      id="btn-margin-40"
                      type="button"
                      onClick={() => applyTargetMargin(40)}
                      className="p-1.5 bg-white/5 hover:bg-indigo-600 border border-white/10 hover:border-indigo-400/50 rounded-lg text-center text-[11px] font-semibold transition-all cursor-pointer text-white"
                    >
                      Margin 40%
                      <span className="block font-mono font-bold text-[10px] text-indigo-300 mt-0.5">
                        {formatRupiah(calculatedHppPerUnit / 0.6)}
                      </span>
                    </button>
                    <button
                      id="btn-margin-50"
                      type="button"
                      onClick={() => applyTargetMargin(50)}
                      className="p-1.5 bg-white/5 hover:bg-indigo-600 border border-white/10 hover:border-indigo-400/50 rounded-lg text-center text-[11px] font-semibold transition-all cursor-pointer text-white"
                    >
                      Margin 50%
                      <span className="block font-mono font-bold text-[10px] text-indigo-300 mt-0.5">
                        {formatRupiah(calculatedHppPerUnit / 0.5)}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Final user pricing configuration */}
                <div className="space-y-4 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <h4 className="text-xs uppercase font-extrabold tracking-widest text-indigo-300">
                      Penetapan Harga Jual Riil
                    </h4>
                    <label htmlFor="user-selling-price" className="block text-[10px] text-slate-400">
                      Tentukan harga penjualan produk Anda per unit ke konsumen:
                    </label>

                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-500">
                        Rp
                      </span>
                      <input
                        id="user-selling-price"
                        type="number"
                        min="1"
                        required
                        placeholder="Harga Jual"
                        className="w-full bg-slate-900 border border-white/10 text-white font-bold rounded-xl pl-9 pr-3 py-2 text-sm font-mono focus:outline-hidden focus:border-indigo-400 transition-all text-base text-indigo-300 focus:ring-1 focus:ring-indigo-400"
                        value={sellingPrice === 0 ? '' : sellingPrice}
                        onChange={(e) => setSellingPrice(e.target.value === '' ? 0 : Number(e.target.value))}
                      />
                    </div>
                  </div>

                  {/* Profit breakdown live simulation */}
                  <div className="bg-white/[0.02] p-2.5 text-[11px] space-y-1.5 rounded-xl border border-white/5 font-semibold">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Laba per Unit:</span>
                      <strong className="text-emerald-400 font-mono">+{formatRupiah(profitAmount)}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-450 text-slate-400">Laba Margin:</span>
                      <strong className={`font-mono px-1.5 py-0.2 rounded text-[10px] font-bold ${marginPercent >= 35 ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20' : 'bg-red-500/10 text-red-305 text-red-300 border border-red-500/20'}`}>
                        {formatPercent(marginPercent)}
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Markup Rasio:</span>
                      <strong className="text-indigo-300 font-mono">{formatPercent(markupPercent)}</strong>
                    </div>
                  </div>
                </div>
              </div>


              {/* Image Input field link */}
              <div className="bg-white/[0.02] border border-white/5 p-4 rounded-xl space-y-2">
                <label htmlFor="image-input" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Foto Produk (URL Gambar Unsplash - Opsional)
                </label>
                <div className="flex gap-2">
                  <input
                    id="image-input"
                    type="url"
                    placeholder="Contoh: https://images.unsplash.com/photo-..."
                    className="w-full bg-slate-900 border border-white/10 text-white rounded-lg px-3 py-2 text-xs focus:outline-hidden focus:border-indigo-500 transition-all font-mono placeholder:text-slate-500"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                  />
                  {imageUrl && (
                    <img 
                      src={imageUrl} 
                      alt="Preview" 
                      className="w-9 h-9 object-cover rounded border border-white/10 bg-slate-950"
                      referrerPolicy="no-referrer"
                    />
                  )}
                </div>
              </div>

              {/* Form submit/cancel rows */}
              <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                <button
                  id="form-cancel-btn"
                  type="button"
                  onClick={cancelForm}
                  className="px-5 py-2.5 border border-white/10 hover:bg-white/5 font-medium text-sm text-slate-300 rounded-xl transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  id="form-submit-btn"
                  type="submit"
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-550 border border-indigo-500/25 text-white font-medium text-sm rounded-xl transition-all shadow-lg flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  Simpan Formula Resep
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
