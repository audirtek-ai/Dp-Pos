/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Product, CartItem, Transaction, StoreProfile } from '../types';
import { formatRupiah, formatPercent } from '../utils';
import { 
  ShoppingCart, Plus, Minus, Trash2, Search, ArrowRight, Eye, EyeOff,
  Sparkles, Check, ShoppingBag, Receipt, Printer, X, RefreshCw, Bluetooth, Usb
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { generateEscPosReceipt, sendToActivePrinter } from '../utils/thermalPrinter';

interface PointOfSaleProps {
  products: Product[];
  onAddTransaction: (transaction: Transaction) => void;
  profile: StoreProfile;
}

export default function PointOfSale({ products, onAddTransaction, profile }: PointOfSaleProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState('Tunai');
  const [amountPaid, setAmountPaid] = useState<number | ''>('');
  const [showOwnerStats, setShowOwnerStats] = useState(true); // Toggle to show/hide transaction margin
  const [showReceipt, setShowReceipt] = useState<Transaction | null>(null);
  const [printMode, setPrintMode] = useState<'standard' | 'thermal'>('standard');
  const [thermalStatus, setThermalStatus] = useState('');
  const [isPrintingThermal, setIsPrintingThermal] = useState(false);

  const handlePrintHardwareThermal = async () => {
    if (!showReceipt) return;
    setThermalStatus('Menyiapkan transmisi byte...');
    setIsPrintingThermal(true);
    try {
      const data = generateEscPosReceipt(showReceipt, {
        storeName: profile.storeName || 'TOKO SAYA',
        address: profile.address || '',
        phone: profile.phone || '',
        receiptFooter: profile.receiptFooter || ''
      });
      const ok = await sendToActivePrinter(data);
      if (ok) {
        setThermalStatus('✓ Struk berhasil dicetak!');
        setTimeout(() => setThermalStatus(''), 4000);
      } else {
        setThermalStatus('⚠️ Tidak terhubung ke printer Bluetooth/USB. Sambungkan di tab "Profil Toko" terlebih dahulu!');
      }
    } catch (err: any) {
      setThermalStatus(`⚠️ Gagal mencetak: ${err.message || 'transmisi diputus'}`);
    } finally {
      setIsPrintingThermal(false);
    }
  };


  // Cart operations
  const addToCart = (prod: Product) => {
    const existing = cart.find(c => c.product.id === prod.id);
    if (existing) {
      setCart(cart.map(c => 
        c.product.id === prod.id ? { ...c, quantity: c.quantity + 1 } : c
      ));
    } else {
      setCart([...cart, { product: prod, quantity: 1 }]);
    }
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(c => c.product.id !== productId));
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(cart.map(c => {
      if (c.product.id === productId) {
        const newQty = c.quantity + delta;
        return newQty > 0 ? { ...c, quantity: newQty } : c;
      }
      return c;
    }).filter(c => c.quantity > 0));
  };

  const clearCart = () => {
    setCart([]);
    setAmountPaid('');
  };

  // Calculations
  const totalBill = cart.reduce((sum, item) => sum + (item.product.sellingPrice * item.quantity), 0);
  const totalHppCost = cart.reduce((sum, item) => sum + (item.product.calculatedHppPerUnit * item.quantity), 0);
  const expectedProfit = totalBill - totalHppCost;
  const expectedMargin = totalBill > 0 ? (expectedProfit / totalBill) * 100 : 0;

  const changeDue = (amountPaid && Number(amountPaid) >= totalBill) ? (Number(amountPaid) - totalBill) : 0;

  // Categories
  const categories = ['Semua', 'Makanan', 'Minuman', 'Jasa', 'Lainnya'];
  const filteredProducts = products.filter(prod => {
    const matchesSearch = prod.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'Semua' || prod.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Suggest bills helper
  const getQuickCashSuggestions = () => {
    if (totalBill === 0) return [];
    const suggestions = [totalBill];
    
    const bills = [10000, 20000, 50000, 100000];
    bills.forEach(bill => {
      if (bill > totalBill && !suggestions.includes(bill)) {
        suggestions.push(bill);
      }
    });

    // Add round-up numbers
    const nearestTen = Math.ceil(totalBill / 10000) * 10000;
    if (nearestTen > totalBill && !suggestions.includes(nearestTen)) {
      suggestions.push(nearestTen);
    }
    const nearestFifty = Math.ceil(totalBill / 50000) * 50000;
    if (nearestFifty > totalBill && !suggestions.includes(nearestFifty)) {
      suggestions.push(nearestFifty);
    }

    return suggestions.sort((a, b) => a - b).slice(0, 4);
  };

  // Complete sale checkout
  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;
    
    // Validate custom paid amount if cash
    const actualPaid = paymentMethod === 'Tunai' ? Number(amountPaid) : totalBill;
    if (paymentMethod === 'Tunai' && actualPaid < totalBill) {
      alert('Uang pembayaran kurang dari total tagihan.');
      return;
    }

    const txId = `tx_${Date.now()}`;
    const invoiceNumber = `INV-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`;

    const itemsForTx = cart.map(item => ({
      productId: item.product.id,
      productName: item.product.name,
      quantity: item.quantity,
      sellingPrice: item.product.sellingPrice,
      hppPerUnit: item.product.calculatedHppPerUnit,
      totalPrice: item.product.sellingPrice * item.quantity,
      totalHpp: item.product.calculatedHppPerUnit * item.quantity,
      totalProfit: (item.product.sellingPrice - item.product.calculatedHppPerUnit) * item.quantity
    }));

    const transaction: Transaction = {
      id: txId,
      invoiceNumber,
      timestamp: new Date().toISOString(),
      items: itemsForTx,
      subtotal: totalBill,
      totalSales: totalBill,
      totalHpp: totalHppCost,
      totalProfit: expectedProfit,
      amountPaid: actualPaid,
      change: actualPaid - totalBill,
      paymentMethod
    };

    onAddTransaction(transaction);
    setShowReceipt(transaction);
    clearCart();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* PRODUCTS DISPLAY GRID PANEL (8 cols in desktop) */}
      <div className="lg:col-span-7 space-y-5">
        <div className="bg-white p-4 rounded-xl shadow-xs border border-slate-100 flex flex-col sm:flex-row gap-3 justify-between items-center">
          {/* Categories Tab Pill */}
          <div className="flex gap-1 overflow-x-auto w-full sm:w-auto py-1">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`py-1.5 px-3.5 rounded-full text-xs font-semibold whitespace-nowrap cursor-pointer transition-all ${
                  selectedCategory === cat 
                    ? 'bg-primary-600 text-white shadow-xs' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search bar pill */}
          <div className="relative w-full sm:w-60">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              id="pos-search"
              type="text"
              placeholder="Cari menu barang..."
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-lg pl-9 pr-3 py-1.5 text-xs focus:outline-hidden focus:ring-1 focus:ring-primary-500 placeholder:text-slate-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Dynamic products catalog cards */}
        {filteredProducts.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-2xl border border-slate-100 text-slate-400">
            Tidak ada produk cocok. Pastikan Anda telah membuat atau memformulasikan HPP produk terlebih dahulu di tab <strong>Kalkulator HPP</strong>.
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {filteredProducts.map(prod => {
              const inCartCount = cart.find(c => c.product.id === prod.id)?.quantity || 0;
              return (
                <motion.div
                  id={`pos-card-${prod.id}`}
                  key={prod.id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => addToCart(prod)}
                  className="bg-white rounded-xl overflow-hidden border border-slate-150-100 flex flex-col justify-between shadow-xs hover:shadow-md hover:border-emerald-200 cursor-pointer transition-all relative group"
                >
                  <div className="h-28 bg-slate-100 relative">
                    <img 
                      src={prod.imageUrl} 
                      alt={prod.name} 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    
                    {inCartCount > 0 && (
                      <div className="absolute top-2 right-2 w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-sm">
                        {inCartCount}
                      </div>
                    )}

                    <div className="absolute bottom-1 bg-slate-900/40 backdrop-blur-xs text-[9px] px-2 py-0.5 rounded text-white m-1">
                      {prod.category}
                    </div>
                  </div>

                  <div className="p-3 space-y-1.5 flex-1 flex flex-col justify-between">
                    <h4 className="font-heading font-medium text-xs text-slate-800 line-clamp-2 leading-snug group-hover:text-emerald-700">
                      {prod.name}
                    </h4>
                    <div className="flex flex-col">
                      <span className="font-mono text-xs font-bold text-slate-900">
                        {formatRupiah(prod.sellingPrice)}
                      </span>
                      <span className="text-[9px] text-slate-400 mt-0.5">
                        HPP: {formatRupiah(prod.calculatedHppPerUnit)}
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* POS REALTIME KASIR SALES CART (5 cols in desktop) */}
      <div className="lg:col-span-5 bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden flex flex-col justify-between sticky top-4">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-emerald-600" />
            <h3 className="font-heading font-semibold text-sm text-slate-800">Keranjang Kasir</h3>
          </div>
          {cart.length > 0 && (
            <button
              id="clear-cart-btn"
              onClick={clearCart}
              className="text-[11px] text-red-500 hover:text-red-700 font-semibold cursor-pointer"
            >
              Kosongkan
            </button>
          )}
        </div>

        {/* Cart Item lists */}
        <div className="flex-1 overflow-y-auto min-h-[220px] max-h-[350px] p-4 divide-y divide-slate-100">
          {cart.length === 0 ? (
            <div className="text-center py-16 text-slate-400 space-y-2 flex flex-col items-center">
              <ShoppingCart className="w-10 h-10 text-slate-300" />
              <p className="text-xs">Keranjang masih kosong</p>
              <p className="text-[10px] text-slate-400 max-w-xs">Ketuk produk di sebelah kiri untuk menambah ke antrean pembayaran.</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.product.id} className="py-3 flex justify-between items-center first:pt-0 last:pb-0">
                <div className="flex-1 pr-3">
                  <h5 className="font-medium text-xs text-slate-800 leading-normal line-clamp-1">
                    {item.product.name}
                  </h5>
                  <div className="font-mono text-xs text-slate-400 mt-0.5">
                    {formatRupiah(item.product.sellingPrice)} x {item.quantity}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Quantity adjustments */}
                  <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                    <button
                      id={`dec-qty-${item.product.id}`}
                      onClick={() => updateQuantity(item.product.id, -1)}
                      className="px-2 py-1 hover:bg-slate-150-200 text-slate-600 cursor-pointer"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="px-2.5 font-mono text-xs font-bold text-slate-800 bg-white">
                      {item.quantity}
                    </span>
                    <button
                      id={`inc-qty-${item.product.id}`}
                      onClick={() => updateQuantity(item.product.id, 1)}
                      className="px-2 py-1 hover:bg-slate-150-200 text-slate-600 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  <strong className="font-mono text-xs text-slate-900 w-20 text-right">
                    {formatRupiah(item.product.sellingPrice * item.quantity)}
                  </strong>

                  <button
                    id={`remove-item-${item.product.id}`}
                    onClick={() => removeFromCart(item.product.id)}
                    className="p-1 text-slate-300 hover:text-red-500 rounded cursor-pointer"
                    title="Hapus"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* OWNER VIEW: Dynamic profit analysis */}
        {cart.length > 0 && (
          <div className="bg-emerald-50/50 border-t border-b border-emerald-100 p-3.5 px-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-emerald-800 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                Mode Pemilik: Analisis Keuntungan
              </span>
              <button
                id="toggle-owner-view"
                onClick={() => setShowOwnerStats(!showOwnerStats)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
                title="Sembunyikan/Tampilkan Analisis Laba"
              >
                {showOwnerStats ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>

            {showOwnerStats && (
              <div className="grid grid-cols-2 gap-3 bg-white p-2.5 rounded-xl border border-emerald-105-100 text-xs">
                <div>
                  <span className="block text-[9px] font-semibold text-slate-400 uppercase">HPP Modal Terjual</span>
                  <span className="font-mono font-bold text-slate-800">{formatRupiah(totalHppCost)}</span>
                </div>
                <div>
                  <span className="block text-[9px] font-semibold text-slate-400 uppercase">Estimasi Laba Bersih</span>
                  <span className="font-mono font-bold text-emerald-600">+{formatRupiah(expectedProfit)} <span className="font-sans text-[10px]">({formatPercent(expectedMargin)})</span></span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Check out Form Area */}
        {cart.length > 0 && (
          <form onSubmit={handleCheckout} className="p-4 space-y-4 bg-slate-50 border-t border-slate-100">
            {/* Total sales bill view */}
            <div className="flex justify-between items-center py-1">
              <span className="text-sm font-semibold text-slate-700">Total Tagihan</span>
              <strong className="font-mono text-xl font-extrabold text-slate-900">{formatRupiah(totalBill)}</strong>
            </div>

            {/* Payment options */}
            <div className="space-y-1.5">
              <label htmlFor="select-payment-method" className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">Metode Pembayaran</label>
              <div className="grid grid-cols-3 gap-2">
                {['Tunai', 'QRIS', 'Transfer'].map(method => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => {
                      setPaymentMethod(method);
                      if (method !== 'Tunai') setAmountPaid(totalBill);
                    }}
                    className={`py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all border text-center ${
                      paymentMethod === method 
                        ? 'bg-slate-900 border-slate-900 text-white' 
                        : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    {method}
                  </button>
                ))}
              </div>
            </div>

            {/* Cash nominal box */}
            {paymentMethod === 'Tunai' && (
              <div className="space-y-3 pt-1">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="cash-input" className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Diterima (Cash)</label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">Rp</span>
                      <input
                        id="cash-input"
                        type="number"
                        min={totalBill}
                        required
                        placeholder="Uang Tunai"
                        className="w-full bg-white border border-slate-200 text-slate-900 rounded-xl pl-7 pr-2 py-2 text-xs font-mono font-bold focus:outline-hidden"
                        value={amountPaid === '' ? '' : amountPaid}
                        onChange={(e) => setAmountPaid(e.target.value === '' ? '' : Number(e.target.value))}
                      />
                    </div>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Kembalian</span>
                    <div className="bg-white border border-slate-200 py-2 px-3 rounded-xl font-mono text-xs font-bold text-slate-800">
                      {formatRupiah(changeDue)}
                    </div>
                  </div>
                </div>

                {/* Cash suggestion pill shortcuts */}
                <div className="flex gap-1.5 flex-wrap">
                  {getQuickCashSuggestions().map((sug, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setAmountPaid(sug)}
                      className="text-[10px] font-mono px-2 py-1 bg-white hover:bg-slate-200 border border-slate-250 rounded-lg cursor-pointer transition-all text-slate-700 hover:text-slate-900"
                    >
                      {sug === totalBill ? 'Uang Pas' : formatRupiah(sug)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Action buttons */}
            <button
              id="confirm-checkout-btn"
              type="submit"
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl transition-all shadow-xs inline-flex items-center justify-center gap-2 cursor-pointer"
            >
              <Receipt className="w-4 h-4" />
              Proses Transaksi Penjualan
            </button>
          </form>
        )}
      </div>

      {/* RETAIL RECEIPT thermal modal overlay */}
      {typeof window !== 'undefined' && createPortal(
        <AnimatePresence>
          {showReceipt && (
            <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center z-[100] p-4 overflow-y-auto no-print">
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-2xl border border-slate-300 shadow-2xl max-w-sm w-full p-5 text-slate-800 space-y-3.5 my-auto max-h-[92vh] flex flex-col justify-between"
              >
                {/* Receipt Header Icon */}
                <div className="text-center space-y-1 pb-1.5 border-b border-dashed border-slate-200 shrink-0">
                  <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                    <Check className="w-5.5 h-5.5" />
                  </div>
                  <h3 className="font-heading font-black text-xs text-slate-950 tracking-tight uppercase">
                    TRANSAKSI SELESAI
                  </h3>
                  <p className="text-[10px] text-slate-400 font-mono">
                    {showReceipt.invoiceNumber}
                  </p>
                </div>

                {/* Format selection toggles */}
                <div className="space-y-1 shrink-0">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Format Cetakan</span>
                  <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
                    <button 
                      id="print-mode-standard-btn"
                      type="button"
                      onClick={() => setPrintMode('standard')} 
                      className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${printMode === 'standard' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                      Nota Standar
                    </button>
                    <button 
                      id="print-mode-thermal-btn"
                      type="button"
                      onClick={() => setPrintMode('thermal')} 
                      className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${printMode === 'thermal' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                      Printer Thermal (58mm)
                    </button>
                  </div>
                </div>

                {/* Pseudo Physical Receipt layout viewport container */}
                <div className="max-h-[220px] sm:max-h-[280px] overflow-y-auto p-1 bg-slate-50 border border-slate-150 rounded-xl flex-1 min-h-[140px]">
                  {/* Print layout section */}
                  <div 
                    id="print-thermal-receipt"
                    className={printMode === 'thermal' ? 'thermal-receipt-layout bg-white text-black p-2 font-mono' : 'print-receipt-section bg-white text-slate-800 p-3 font-sans text-xs'}
                    style={{ color: '#000000', backgroundColor: '#ffffff' }}
                  >
                    {/* Dynamic Header */}
                    <div className="text-center pb-2">
                      <h4 className="font-heading font-black text-xs text-slate-900 uppercase tracking-tight leading-tight">
                        {profile.storeName || 'TOKO MERCHANT SAYA'}
                      </h4>
                      <p className="text-[9px] text-slate-500 font-sans leading-tight mt-0.5" style={{ color: '#4b5563' }}>
                        {profile.address || 'Alamat Toko Belum Diatur'}
                      </p>
                      {profile.phone && (
                        <p className="text-[9px] text-slate-500 font-sans" style={{ color: '#4b5563' }}>
                          Telp: {profile.phone}
                        </p>
                      )}
                      <div className="text-[8px] text-slate-400 font-mono mt-1.5 border-t border-b border-dashed border-slate-200 py-1" style={{ color: '#6b7280' }}>
                        INV: {showReceipt.invoiceNumber}<br />
                        Tgl: {new Date(showReceipt.timestamp).toLocaleString('id-ID')}
                      </div>
                    </div>

                    {/* Body dividers */}
                    {printMode === 'thermal' ? (
                      <div className="font-mono text-[8.5px] leading-relaxed py-1">
                        <div className="border-b border-dashed border-slate-300 pb-1 mb-1">
                          ITEM & JUMLAH
                        </div>
                        {showReceipt.items.map((it, idx) => (
                          <div key={idx} className="space-y-0.5 pb-1 flex justify-between items-start text-black font-mono">
                            <div className="max-w-[70%]">
                              <div>{it.productName}</div>
                              <div className="text-[8px] scale-95 origin-left text-slate-500">
                                {it.quantity} x {formatRupiah(it.sellingPrice)}
                              </div>
                            </div>
                            <span className="font-bold shrink-0">{formatRupiah(it.totalPrice)}</span>
                          </div>
                        ))}
                        <div className="border-t border-dashed border-slate-300 pt-1.5 mt-1.5 space-y-1">
                          <div className="flex justify-between font-extrabold text-black">
                            <span>TOTAL TAGIHAN:</span>
                            <span>{formatRupiah(showReceipt.totalSales)}</span>
                          </div>
                          <div className="flex justify-between text-slate-500 text-[8px]">
                            <span>Metode:</span>
                            <span className="uppercase">{showReceipt.paymentMethod}</span>
                          </div>
                          <div className="flex justify-between text-[8px] text-slate-600">
                            <span>Diterima:</span>
                            <span>{formatRupiah(showReceipt.amountPaid)}</span>
                          </div>
                          <div className="flex justify-between text-[8px] text-slate-600">
                            <span>Kembali:</span>
                            <span>{formatRupiah(showReceipt.change)}</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="font-sans leading-relaxed py-1">
                        <div className="border-b border-slate-100 pb-1.5 mb-1.5 font-bold text-slate-500 text-[9px] uppercase tracking-wider">
                          Rincian Belanja
                        </div>
                        <table className="w-full text-left text-xs border-collapse table-fixed">
                          <thead>
                            <tr className="border-b border-slate-100 text-slate-400 text-[9px] uppercase">
                              <th className="pb-1.5 font-semibold w-1/2">Menu</th>
                              <th className="pb-1.5 text-center font-semibold w-1/12 font-mono">Qty</th>
                              <th className="pb-1.5 text-right font-semibold w-[20%]">Harga</th>
                              <th className="pb-1.5 text-right font-semibold w-[20%]">Total</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {showReceipt.items.map((it, idx) => (
                              <tr key={idx} className="text-slate-700 align-top">
                                <td className="py-1.5 pr-2 font-medium text-slate-900 break-words leading-relaxed">{it.productName}</td>
                                <td className="py-1.5 text-center text-slate-500 font-mono">{it.quantity}</td>
                                <td className="py-1.5 text-right font-mono text-[10px] text-slate-500 whitespace-nowrap">{formatRupiah(it.sellingPrice)}</td>
                                <td className="py-1.5 text-right font-mono text-[10px] font-bold text-slate-900 whitespace-nowrap">{formatRupiah(it.totalPrice)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <div className="border-t border-slate-100 pt-2.5 mt-2.5 space-y-1 font-sans text-xs">
                          <div className="flex justify-between font-bold text-slate-900">
                            <span>Subtotal Belanja:</span>
                            <span>{formatRupiah(showReceipt.totalSales)}</span>
                          </div>
                          <div className="flex justify-between text-slate-500 text-[10px]">
                            <span>Metode Pembayaran:</span>
                            <span className="font-semibold text-slate-700">{showReceipt.paymentMethod}</span>
                          </div>
                          <div className="flex justify-between text-slate-505 text-slate-500 text-[10px]">
                            <span>Metode Bayar (Diterima):</span>
                            <span>{formatRupiah(showReceipt.amountPaid)}</span>
                          </div>
                          <div className="flex justify-between text-slate-800 font-medium">
                            <span>Uang Kembalian:</span>
                            <span className="font-mono text-slate-900 font-bold">{formatRupiah(showReceipt.change)}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Dynamic Footer note from settings */}
                    <div className="text-center font-sans pt-3 border-t border-dashed border-slate-200 mt-2.5">
                      <p className="font-extrabold text-[9px] text-slate-700 uppercase leading-snug">
                        {profile.receiptFooter || 'Terima Kasih Atas Kunjungan Anda!'}
                      </p>
                      <p className="text-[8px] text-slate-400 mt-0.5">Aplikasi Kasir Mikro HPPOS</p>
                    </div>
                  </div>
                </div>

                {/* Hidden duplication that displays ONLY on printing layout page */}
                <div className="hidden">
                  <div 
                    id="actual-print-output" 
                    className={`print-receipt-section ${printMode === 'thermal' ? 'thermal-receipt-layout font-mono text-black p-2' : 'bg-white text-black p-4 pr-10 font-sans'}`}
                    style={{ color: '#000000', backgroundColor: '#ffffff' }}
                  >
                    <div className="text-center pb-2">
                      <h4 className="font-bold text-[12px] uppercase">{profile.storeName || 'TOKO MERCHANT SAYA'}</h4>
                      <p className="text-[9px]">{profile.address || 'Alamat Toko'}</p>
                      {profile.phone && <p className="text-[9px]">Telp: {profile.phone}</p>}
                      <p className="text-[9px]">Invoice: {showReceipt.invoiceNumber}</p>
                      <p className="text-[9px]">Tgl: {new Date(showReceipt.timestamp).toLocaleString('id-ID')}</p>
                    </div>
                    <div className="border-t border-dashed border-black py-2">
                      {showReceipt.items.map((it, idx) => (
                        <div key={idx} className="flex justify-between text-[10px]">
                          <span>{it.productName} ({it.quantity}x)</span>
                          <span>{formatRupiah(it.totalPrice)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="border-t border-dashed border-black pt-2 space-y-1 text-[10px]">
                      <div className="flex justify-between font-bold">
                        <span>TOTAL:</span>
                        <span>{formatRupiah(showReceipt.totalSales)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Bayar:</span>
                        <span>{formatRupiah(showReceipt.amountPaid)}</span>
                      </div>
                      <div className="flex justify-between font-bold">
                        <span>Kembali:</span>
                        <span>{formatRupiah(showReceipt.change)}</span>
                      </div>
                      <div className="flex justify-between text-[9px]">
                        <span>Metode:</span>
                        <span>{showReceipt.paymentMethod}</span>
                      </div>
                    </div>
                    <div className="text-center pt-3 border-t border-dashed border-black mt-2 text-[10px]">
                      <p className="font-bold">{profile.receiptFooter || 'Terima Kasih!'}</p>
                      <p className="text-[8px]">Sistem Kasir HPPOS</p>
                    </div>
                  </div>
                </div>

                {/* Thermal Printer Feedback message */}
                {thermalStatus && (
                  <div className="p-2 border border-dashed border-indigo-150 rounded-xl text-center font-mono text-[9px] bg-slate-50 text-slate-700 leading-snug shrink-0 no-print">
                    {thermalStatus}
                  </div>
                )}

                {/* Controls */}
                <div className="flex gap-1.5 font-sans pt-1 shrink-0">
                  <button
                    id="print-btn"
                    onClick={() => window.print()}
                    className="flex-1 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[10px] font-semibold text-slate-700 rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer no-print"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Print Layar
                  </button>
                  <button
                    id="print-hardware-pos-btn"
                    onClick={handlePrintHardwareThermal}
                    disabled={isPrintingThermal}
                    className="flex-1 py-2 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-[10px] font-bold text-indigo-700 rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer no-print disabled:opacity-50"
                  >
                    <Bluetooth className="w-3 h-3" />
                    Cetak Thermal
                  </button>
                  <button
                    id="done-receipt-btn"
                    onClick={() => {
                      setShowReceipt(null);
                      setThermalStatus('');
                    }}
                    className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-[10px] rounded-xl transition-all text-center cursor-pointer no-print"
                  >
                    Transaksi Baru
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}
