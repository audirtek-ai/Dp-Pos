/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Product, CartItem, Transaction, StoreProfile } from '../types';
import { formatRupiah, formatPercent } from '../utils';
import { 
  ShoppingCart, Plus, Minus, Trash2, Search, ArrowRight, Eye, EyeOff,
  Sparkles, Check, ShoppingBag, Receipt, Printer, X, RefreshCw, Bluetooth, Usb,
  Barcode, Camera, QrCode
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { generateEscPosReceipt, sendToActivePrinter } from '../utils/thermalPrinter';
import ReceiptThemeView from './ReceiptThemeView';

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
  const [activeTheme, setActiveTheme] = useState('classic');
  const [thermalStatus, setThermalStatus] = useState('');
  const [isPrintingThermal, setIsPrintingThermal] = useState(false);

  // Barcode / Camera scanning states
  const [isScannerActive, setIsScannerActive] = useState(false);
  const [scannerError, setScannerError] = useState('');
  const [scannerSuccessMsg, setScannerSuccessMsg] = useState('');

  useEffect(() => {
    if (profile.receiptTheme) {
      setActiveTheme(profile.receiptTheme);
    }
  }, [profile.receiptTheme]);

  // Camera Barcode Scanner Effect
  useEffect(() => {
    let qrcodeScanner: Html5QrcodeScanner | null = null;
    if (isScannerActive) {
      setScannerError('');
      setScannerSuccessMsg('');
      const timer = setTimeout(() => {
        try {
          qrcodeScanner = new Html5QrcodeScanner(
            "pos-barcode-reader",
            { 
              fps: 12, 
              qrbox: { width: 260, height: 160 },
              aspectRatio: 1.0,
              showTorchButtonIfSupported: true
            },
            /* verbose= */ false
          );

          qrcodeScanner.render(
            (decodedText) => {
              // Beep sound indicator upon success
              try {
                const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
                if (AudioContextClass) {
                  const audioCtx = new AudioContextClass();
                  const osc = audioCtx.createOscillator();
                  const gain = audioCtx.createGain();
                  osc.connect(gain);
                  gain.connect(audioCtx.destination);
                  osc.frequency.setValueAtTime(1200, audioCtx.currentTime); // high peak pos sound
                  gain.gain.setValueAtTime(0, audioCtx.currentTime);
                  gain.gain.linearRampToValueAtTime(0.12, audioCtx.currentTime + 0.04);
                  gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.15);
                  osc.start(audioCtx.currentTime);
                  osc.stop(audioCtx.currentTime + 0.16);
                }
              } catch (beepErr) {
                console.log("Beep ignored or blocked by gesture context", beepErr);
              }

              // Look for matched product in master index (either by barcode string OR direct id match)
              const matchedProd = products.find(
                p => (p.barcode && p.barcode.trim() === decodedText.trim()) || p.id === decodedText.trim()
              );

              if (matchedProd) {
                addToCart(matchedProd);
                setScannerSuccessMsg(`✓ Berhasil menambahkan ${matchedProd.name} ke keranjang!`);
                setScannerError('');
                
                // clear success message after 3 seconds
                setTimeout(() => setScannerSuccessMsg(''), 3000);
              } else {
                setScannerError(`Barcode "${decodedText}" belum terdaftar.`);
                // clear error after 4 seconds
                setTimeout(() => setScannerError(''), 4000);
              }
            },
            (error) => {
              // Silence frame parsing failures
            }
          );
        } catch (initErr: any) {
          console.error("Camera Scanner failed to initialize: ", initErr);
          setScannerError("Gagal mengaktifkan kamera. Pastikan memberikan izin akses kamera perangkat.");
        }
      }, 400);

      return () => {
        clearTimeout(timer);
        if (qrcodeScanner) {
          qrcodeScanner.clear().catch(err => {
            console.warn("Error clearing qrcode scanner: ", err);
          });
        }
      };
    }
  }, [isScannerActive, products]);

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
    const matchesSearch = prod.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          prod.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (prod.barcode && prod.barcode.toLowerCase().includes(searchTerm.toLowerCase()));
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
        <div className="glass-panel p-4 rounded-xl flex flex-col sm:flex-row gap-3 justify-between items-center shadow-xl">
          {/* Categories Tab Pill */}
          <div className="flex gap-1.5 overflow-x-auto w-full sm:w-auto py-1">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`py-1.5 px-3.5 rounded-full text-xs font-semibold whitespace-nowrap cursor-pointer transition-all border ${
                  selectedCategory === cat 
                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/20' 
                    : 'bg-white/5 border-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search bar & Barcode section */}
          <div className="flex gap-2 w-full sm:w-auto items-center">
            <div className="relative flex-1 sm:w-60">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
              <input
                id="pos-search"
                type="text"
                placeholder="Cari nama, kategori, barcode..."
                className="w-full bg-slate-950/40 border border-white/10 text-white rounded-xl pl-9 pr-8 py-2 text-xs focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-450 hover:text-white cursor-pointer p-1 rounded-full hover:bg-white/10 focus:outline-hidden"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
            
            <button
              id="camera-scanner-trigger-btn"
              type="button"
              onClick={() => setIsScannerActive(true)}
              className="py-1.5 px-3 bg-indigo-600 hover:bg-indigo-550 border border-indigo-500/30 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-lg active:scale-95 transition-all h-[32px]"
              title="Scan Barcode Produk Menggunakan Kamera HP/Laptop"
            >
              <Camera className="w-4 h-4" />
              <span className="hidden sm:inline">Scan</span>
            </button>
          </div>
        </div>

        {/* Dynamic products catalog cards */}
        {filteredProducts.length === 0 ? (
          <div className="glass-panel p-12 text-center rounded-2xl border border-white/10 text-slate-400">
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
                  className="glass-panel bg-slate-900/20 rounded-2xl overflow-hidden border border-white/10 flex flex-col justify-between shadow-lg hover:shadow-2xl hover:border-indigo-500/50 hover:shadow-indigo-500/5 cursor-pointer transition-all relative group"
                >
                  <div className="h-28 bg-slate-950/40 relative">
                    <img 
                      src={prod.imageUrl} 
                      alt={prod.name} 
                      className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                      referrerPolicy="no-referrer"
                    />
                    
                    {inCartCount > 0 && (
                      <div className="absolute top-2.5 right-2.5 w-6 h-6 bg-indigo-605 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xs font-black shadow-lg shadow-indigo-600/35 border border-indigo-400/20">
                        {inCartCount}
                      </div>
                    )}

                    <div className="absolute bottom-2 left-2 bg-slate-950/70 border border-white/15 backdrop-blur-xs text-[9px] font-semibold px-2.5 py-0.5 rounded-lg text-slate-300">
                      {prod.category}
                    </div>
                  </div>

                  <div className="p-3.5 space-y-2 flex-1 flex flex-col justify-between">
                    <h4 className="font-heading font-bold text-xs text-slate-200 line-clamp-2 leading-snug group-hover:text-white transition-colors">
                      {prod.name}
                    </h4>
                    <div className="flex flex-col pt-1 border-t border-white/5">
                      <span className="font-mono text-xs font-extrabold text-indigo-300">
                        {formatRupiah(prod.sellingPrice)}
                      </span>
                      <span className="text-[9px] text-slate-450 text-slate-400 mt-0.5 font-mono">
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
      <div className="lg:col-span-5 glass-panel bg-slate-900/35 border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col justify-between sticky top-4">
        <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-indigo-400" />
            <h3 className="font-heading font-black text-sm text-white">Keranjang Kasir</h3>
          </div>
          {cart.length > 0 && (
            <button
              id="clear-cart-btn"
              onClick={clearCart}
              className="text-[11px] text-rose-450 text-rose-405 hover:text-rose-350 text-rose-400 font-extrabold cursor-pointer hover:underline transition-all"
            >
              Kosongkan
            </button>
          )}
        </div>

        {/* Cart Item lists */}
        <div className="flex-1 overflow-y-auto min-h-[220px] max-h-[350px] p-4 divide-y divide-white/5">
          {cart.length === 0 ? (
            <div className="text-center py-16 text-slate-400 space-y-3 flex flex-col items-center">
              <ShoppingCart className="w-10 h-10 text-slate-500" />
              <p className="text-xs font-semibold text-slate-300">Keranjang masih kosong</p>
              <p className="text-[10px] text-slate-500 max-w-xs leading-normal">Ketuk produk di sebelah kiri untuk menambah ke antrean pembayaran.</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.product.id} className="py-3 flex justify-between items-center first:pt-0 last:pb-0 border-transparent">
                <div className="flex-1 pr-3 text-left">
                  <h5 className="font-bold text-xs text-white leading-normal line-clamp-1">
                    {item.product.name}
                  </h5>
                  <div className="font-mono text-[11px] text-slate-400 mt-0.5">
                    {formatRupiah(item.product.sellingPrice)} x {item.quantity}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Quantity adjustments */}
                  <div className="flex items-center border border-white/10 rounded-xl overflow-hidden bg-slate-950/40">
                    <button
                      id={`dec-qty-${item.product.id}`}
                      onClick={() => updateQuantity(item.product.id, -1)}
                      className="px-2 py-1.5 hover:bg-white/10 text-slate-300 cursor-pointer transition-colors"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="px-2.5 font-mono text-xs font-black text-white">
                      {item.quantity}
                    </span>
                    <button
                      id={`inc-qty-${item.product.id}`}
                      onClick={() => updateQuantity(item.product.id, 1)}
                      className="px-2 py-1.5 hover:bg-white/10 text-slate-300 pointer-events-auto cursor-pointer transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  <strong className="font-mono text-xs text-indigo-300 w-20 text-right">
                    {formatRupiah(item.product.sellingPrice * item.quantity)}
                  </strong>

                  <button
                    id={`remove-item-${item.product.id}`}
                    onClick={() => removeFromCart(item.product.id)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-white/5 rounded transition-all cursor-pointer"
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
          <div className="bg-emerald-950/15 border-t border-b border-emerald-500/20 p-3.5 px-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold text-emerald-400 flex items-center gap-1.5 uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                Analisis Margin Pemilik
              </span>
              <button
                id="toggle-owner-view"
                onClick={() => setShowOwnerStats(!showOwnerStats)}
                className="text-slate-400 hover:text-white cursor-pointer transition-all"
                title="Sembunyikan/Tampilkan Analisis Laba"
              >
                {showOwnerStats ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>

            {showOwnerStats && (
              <div className="grid grid-cols-2 gap-3 bg-slate-950/50 p-3 rounded-xl border border-white/5 text-xs text-left">
                <div>
                  <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-none mb-1">HPP Modal</span>
                  <span className="font-mono font-bold text-slate-300">{formatRupiah(totalHppCost)}</span>
                </div>
                <div>
                  <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-none mb-1">Untung Bersih</span>
                  <span className="font-mono font-black text-emerald-400">+{formatRupiah(expectedProfit)} <span className="font-sans text-[10px] font-normal">({formatPercent(expectedMargin)})</span></span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Check out Form Area */}
        {cart.length > 0 && (
          <form onSubmit={handleCheckout} className="p-4 space-y-4 bg-white/[0.015] border-t border-white/5">
            {/* Total sales bill view */}
            <div className="flex justify-between items-center py-1">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Total Tagihan</span>
              <strong className="font-mono text-xl font-black text-emerald-400 leading-none">{formatRupiah(totalBill)}</strong>
            </div>

            {/* Payment options */}
            <div className="space-y-1.5 text-left">
              <label htmlFor="select-payment-method" className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Metode Pembayaran</label>
              <div className="grid grid-cols-3 gap-2">
                {['Tunai', 'QRIS', 'Transfer'].map(method => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => {
                      setPaymentMethod(method);
                      if (method !== 'Tunai') setAmountPaid(totalBill);
                    }}
                    className={`py-2 rounded-xl text-xs font-bold cursor-pointer transition-all border text-center ${
                      paymentMethod === method 
                        ? 'bg-indigo-650 bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-600/15' 
                        : 'bg-white/5 border-white/10 hover:bg-white/10 hover:text-white text-slate-300'
                    }`}
                  >
                    {method}
                  </button>
                ))}
              </div>
            </div>

            {/* Cash nominal box */}
            {paymentMethod === 'Tunai' && (
              <div className="space-y-3 pt-1 text-left">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="cash-input" className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Diterima (Cash)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">Rp</span>
                      <input
                        id="cash-input"
                        type="number"
                        min={totalBill}
                        required
                        placeholder="Uang Tunai"
                        className="w-full bg-slate-950/40 border border-white/10 text-white rounded-xl pl-8 pr-2.5 py-2.5 text-xs font-mono font-black focus:outline-hidden focus:border-indigo-500"
                        value={amountPaid === '' ? '' : amountPaid}
                        onChange={(e) => setAmountPaid(e.target.value === '' ? '' : Number(e.target.value))}
                      />
                    </div>
                  </div>
                  <div>
                    <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Kembalian</span>
                    <div className="bg-slate-950/40 border border-white/10 py-2.5 px-3 rounded-xl font-mono text-xs font-black text-emerald-400 h-[38px] flex items-center">
                      {formatRupiah(changeDue)}
                    </div>
                  </div>
                </div>

                {/* Cash suggestion pill shortcuts */}
                <div className="flex gap-1.5 flex-wrap pt-0.5">
                  {getQuickCashSuggestions().map((sug, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setAmountPaid(sug)}
                      className="text-[10px] font-mono px-2.5 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg cursor-pointer transition-all text-slate-300 hover:text-white"
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
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-555 hover:bg-emerald-500 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-emerald-600/25 inline-flex items-center justify-center gap-2 cursor-pointer border border-emerald-400/30"
            >
              <Receipt className="w-4 h-4 text-white" />
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
                className="bg-slate-900 border border-white/10 rounded-2xl shadow-2xl max-w-sm w-full p-5 text-slate-300 space-y-3.5 my-auto max-h-[92vh] flex flex-col justify-between"
              >
                {/* Receipt Header Icon */}
                <div className="text-center space-y-1 pb-1.5 border-b border-dashed border-white/10 shrink-0">
                  <div className="w-10 h-10 rounded-full bg-emerald-950/40 text-emerald-400 flex items-center justify-center mx-auto">
                    <Check className="w-5.5 h-5.5" />
                  </div>
                  <h3 className="font-heading font-black text-xs text-white tracking-tight uppercase">
                    TRANSAKSI SELESAI
                  </h3>
                  <p className="text-[10px] text-slate-400 font-mono">
                    {showReceipt.invoiceNumber}
                  </p>
                </div>

                {/* Format selection toggles */}
                <div className="space-y-1.5 shrink-0 text-left">
                  <div className="flex md:flex-row flex-col gap-2.5">
                    <div className="flex-1 space-y-1">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Format Cetakan</span>
                      <div className="flex gap-1.5 p-1 bg-slate-950/45 border border-white/5 rounded-xl">
                        <button 
                          id="print-mode-standard-btn"
                          type="button"
                          onClick={() => setPrintMode('standard')} 
                          className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${printMode === 'standard' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-450 hover:text-slate-200'}`}
                        >
                          Nota Standar
                        </button>
                        <button 
                          id="print-mode-thermal-btn"
                          type="button"
                          onClick={() => setPrintMode('thermal')} 
                          className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${printMode === 'thermal' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-450 hover:text-slate-200'}`}
                        >
                          Thermal (58mm)
                        </button>
                      </div>
                    </div>

                    <div className="flex-1 space-y-1">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Desain Invoice</span>
                      <div className="flex gap-1 p-1 bg-slate-950/45 border border-white/5 rounded-xl overflow-x-auto scrollbar-none">
                        {[
                          { id: 'classic', label: 'Classic', icon: '📝' },
                          { id: 'retro', label: 'Retro', icon: '⭐' },
                          { id: 'elegant', label: 'Elegant', icon: '⚜️' },
                          { id: 'cyber', label: 'Cyber', icon: '🤖' },
                          { id: 'eco', label: 'Eco', icon: '🌱' },
                        ].map((t) => (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => setActiveTheme(t.id)}
                            className={`flex-1 py-1.5 px-1 rounded-md text-[9px] font-extrabold transition-all cursor-pointer whitespace-nowrap flex items-center justify-center gap-0.5 ${activeTheme === t.id ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-450 hover:text-slate-200'}`}
                            title={t.label}
                          >
                            <span>{t.icon}</span>
                            <span className="sr-only sm:not-sr-only sm:inline">{t.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pseudo Physical Receipt layout viewport container */}
                <div className="max-h-[280px] overflow-y-auto p-1.5 bg-slate-950/35 border border-white/10 rounded-xl flex-1 min-h-[140px] transition-all">
                  {/* Print layout section */}
                  <div 
                    id="print-thermal-receipt"
                    className={printMode === 'thermal' ? 'thermal-receipt-layout bg-white text-black p-3 font-mono border border-slate-100' : 'print-receipt-section bg-white text-slate-800 p-4 font-sans text-xs rounded-lg border border-slate-100'}
                    style={{ color: '#000000', backgroundColor: '#ffffff' }}
                  >
                    {showReceipt && (
                      <ReceiptThemeView 
                        receipt={showReceipt}
                        profile={profile}
                        theme={activeTheme}
                        printMode={printMode}
                      />
                    )}
                  </div>
                </div>

                 {/* Duplikasi cetak disembunyikan dari modal ini, dipindahkan ke Portal luar agar tidak terpengaruh no-print */}

                {/* Thermal Printer Feedback message */}
                {thermalStatus && (
                  <div className="p-2 border border-dashed border-white/10 rounded-xl text-center font-mono text-[9px] bg-slate-950/50 text-indigo-305 text-indigo-300 leading-snug shrink-0 no-print">
                    {thermalStatus}
                  </div>
                )}

                {/* Controls */}
                <div className="flex gap-1.5 font-sans pt-1 shrink-0">
                  <button
                    id="print-btn"
                    onClick={() => window.print()}
                    className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-bold text-slate-200 rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer no-print"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Print Layar
                  </button>
                  <button
                    id="print-hardware-pos-btn"
                    onClick={handlePrintHardwareThermal}
                    disabled={isPrintingThermal}
                    className="flex-1 py-2.5 bg-emerald-600/15 hover:bg-emerald-600/25 border border-emerald-500/20 text-[10px] font-bold text-emerald-405 text-emerald-404 rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer no-print disabled:opacity-50"
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
                    className="flex-1 py-2.5 bg-indigo-650 hover:bg-indigo-700 bg-indigo-600 text-white font-black text-[10px] rounded-xl transition-all text-center cursor-pointer no-print uppercase tracking-wider"
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

      {/* Render portal cetak di luar kontainer modal no-print agar tidak ter-blok saat window.print() */}
      {showReceipt && typeof window !== 'undefined' && createPortal(
        <div className="hidden print:block">
          <div 
            id="actual-print-output" 
            className={printMode === 'thermal' ? 'thermal-receipt-layout bg-white text-black p-3 font-mono border border-slate-100' : 'print-receipt-section bg-white text-slate-800 p-4 font-sans text-xs rounded-lg border border-slate-100'}
            style={{ color: '#000000', backgroundColor: '#ffffff' }}
          >
            <ReceiptThemeView 
              receipt={showReceipt}
              profile={profile}
              theme={activeTheme}
              printMode={printMode}
              isActualPrint={true}
            />
          </div>
        </div>,
        document.body
      )}

      {/* Modal Scanner Barcode Kamera */}
      {isScannerActive && typeof window !== 'undefined' && createPortal(
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center z-[110] p-4 overflow-y-auto no-print">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="glass-panel w-full max-w-md bg-slate-900 border border-white/10 rounded-2xl shadow-2xl p-5 space-y-4 focus:outline-hidden"
          >
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <Barcode className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-white text-sm">Scan Barcode / QR Produk</h3>
                  <p className="text-[10px] text-slate-400">Deteksi otomatis kode produk lewat kamera</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsScannerActive(false);
                  setScannerError('');
                  setScannerSuccessMsg('');
                }}
                className="p-1.5 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-full transition-colors cursor-pointer"
                title="Tutup Scanner"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Viewfinder scanner container */}
            <div className="space-y-3">
              <div className="text-[10.5px] text-slate-300 leading-normal bg-indigo-950/20 border border-indigo-500/10 p-3 rounded-xl flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <span>
                  Arahkan barcode atau QR atau kode ID produk ke area bidik kamera di bawah. Sistem akan <strong>mengeluarkan suara bip</strong> dan otomatis menambahkan produk ke keranjang.
                </span>
              </div>

              {/* Success notification banner */}
              <AnimatePresence>
                {scannerSuccessMsg && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs font-bold flex items-center gap-2"
                  >
                    <Check className="w-4 h-4 shrink-0" />
                    <span>{scannerSuccessMsg}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Error notification banner */}
              <AnimatePresence>
                {scannerError && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-350 text-xs font-semibold flex items-center gap-2"
                  >
                    <span className="shrink-0 text-red-400">⚠️</span>
                    <span>{scannerError}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Injected HTML reader wrapper */}
              <div 
                id="pos-barcode-reader" 
                className="w-full overflow-hidden rounded-xl bg-slate-950 border border-white/5 shadow-inner"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsScannerActive(false);
                  setScannerError('');
                  setScannerSuccessMsg('');
                }}
                className="px-4 py-2 text-xs bg-slate-800 hover:bg-slate-755 border border-white/5 text-slate-300 rounded-xl cursor-pointer transition-all hover:text-white"
              >
                Tutup Monitor
              </button>
            </div>
          </motion.div>
        </div>,
        document.body
      )}
    </div>
  );
}
