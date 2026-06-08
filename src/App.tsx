/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Ingredient, Product, Transaction, StoreProfile } from './types';
import { 
  INITIAL_INGREDIENTS, INITIAL_PRODUCTS, INITIAL_TRANSACTIONS, INITIAL_PROFILE 
} from './initialData';

// Subcomponents
import Dashboard from './components/Dashboard';
import IngredientManager from './components/IngredientManager';
import ProductCalculator from './components/ProductCalculator';
import PointOfSale from './components/PointOfSale';
import TransactionHistory from './components/TransactionHistory';
import FinanceReport from './components/FinanceReport';
import StoreProfileManager from './components/StoreProfileManager';
import AIRestockAdvisor from './components/AIRestockAdvisor';
import QuickStartModal from './components/QuickStartModal';

// Visual Assets
import { 
  LayoutDashboard, ShoppingBag, Layers, History, Sparkles, BarChart3, Menu, X, Store, Wifi, WifiOff, HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [menuOpen, setMenuOpen] = useState(false);
  const [quickStartOpen, setQuickStartOpen] = useState(false);
  
  // Connection & Auto-Sync tracking states
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const triggerSyncIndicator = () => {
    setIsSyncing(true);
    const id = setTimeout(() => {
      setIsSyncing(false);
    }, 1200);
    return id;
  };
  
  // Persistent States
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [profile, setProfile] = useState<StoreProfile>({
    storeName: 'TOKO MERCHANT SAYA',
    address: 'Jl. Berdikari Kaya No. 10, Jakarta',
    phone: '0812-3456-7890',
    receiptFooter: 'Terima Kasih Atas Kunjungan Anda!'
  });

  // Load state on startup
  useEffect(() => {
    const rawIng = localStorage.getItem('hppos_ingredients');
    const rawProd = localStorage.getItem('hppos_products');
    const rawTx = localStorage.getItem('hppos_transactions');
    const rawProfile = localStorage.getItem('hppos_profile');
    const rawQuickStartDismissed = localStorage.getItem('hppos_quickstart_dismissed');

    if (rawIng) {
      setIngredients(JSON.parse(rawIng));
    } else {
      setIngredients(INITIAL_INGREDIENTS);
      localStorage.setItem('hppos_ingredients', JSON.stringify(INITIAL_INGREDIENTS));
    }

    if (rawProd) {
      setProducts(JSON.parse(rawProd));
    } else {
      setProducts(INITIAL_PRODUCTS);
      localStorage.setItem('hppos_products', JSON.stringify(INITIAL_PRODUCTS));
    }

    if (rawTx) {
      setTransactions(JSON.parse(rawTx));
    } else {
      setTransactions(INITIAL_TRANSACTIONS);
      localStorage.setItem('hppos_transactions', JSON.stringify(INITIAL_TRANSACTIONS));
    }

    if (rawProfile) {
      setProfile(JSON.parse(rawProfile));
    } else {
      setProfile(INITIAL_PROFILE);
      localStorage.setItem('hppos_profile', JSON.stringify(INITIAL_PROFILE));
    }

    if (!rawQuickStartDismissed) {
      setQuickStartOpen(true);
    }
  }, []);

  // Sync helpers with non-blocking async localStorage persistence
  const saveIngredients = (newIng: Ingredient[]) => {
    setIngredients(newIng);
    setTimeout(() => {
      try {
        localStorage.setItem('hppos_ingredients', JSON.stringify(newIng));
        triggerSyncIndicator();
      } catch (err) {
        console.error("Local Storage Error:", err);
      }
    }, 0);
  };

  const saveProducts = (newProd: Product[]) => {
    setProducts(newProd);
    setTimeout(() => {
      try {
        localStorage.setItem('hppos_products', JSON.stringify(newProd));
        triggerSyncIndicator();
      } catch (err) {
        console.error("Local Storage Error:", err);
      }
    }, 0);
  };

  const saveProfile = (newProfile: StoreProfile) => {
    setProfile(newProfile);
    setTimeout(() => {
      try {
        localStorage.setItem('hppos_profile', JSON.stringify(newProfile));
        triggerSyncIndicator();
      } catch (err) {
        console.error("Local Storage Error:", err);
      }
    }, 0);
  };

  const addTransaction = (newTx: Transaction) => {
    const updated = [newTx, ...transactions];
    setTransactions(updated);
    setTimeout(() => {
      try {
        localStorage.setItem('hppos_transactions', JSON.stringify(updated));
        triggerSyncIndicator();
      } catch (err) {
        console.error("Local Storage Error:", err);
      }
    }, 0);

    // Deduct stock levels for ingredients used in the transaction items
    let stockChanged = false;
    const updatedIngredients = ingredients.map(ing => {
      let stockToDeduct = 0;
      newTx.items.forEach(txItem => {
        const prod = products.find(p => p.id === txItem.productId);
        if (prod && prod.ingredients) {
          const batchSize = prod.batchSize || 1;
          const recipeItem = prod.ingredients.find(ri => ri.ingredientId === ing.id);
          if (recipeItem) {
            // formula: amountNeededPerBatch / batchSize * quantitySold
            stockToDeduct += (recipeItem.amountNeeded / batchSize) * txItem.quantity;
          }
        }
      });

      if (stockToDeduct > 0) {
        stockChanged = true;
        const currentStock = ing.stock ?? 0;
        // round to 4 decimals to avoid IEEE float inaccuracy in display
        const nextStock = Math.max(0, Number((currentStock - stockToDeduct).toFixed(4)));
        return { ...ing, stock: nextStock };
      }
      return ing;
    });

    if (stockChanged) {
      saveIngredients(updatedIngredients);
    }
  };

  const deleteTransaction = (id: string) => {
    const txToDelete = transactions.find(t => t.id === id);
    const updated = transactions.filter(t => t.id !== id);
    setTransactions(updated);
    setTimeout(() => {
      try {
        localStorage.setItem('hppos_transactions', JSON.stringify(updated));
        triggerSyncIndicator();
      } catch (err) {
        console.error("Local Storage Error:", err);
      }
    }, 0);

    // Restore stock levels for ingredients used in the deleted transaction
    if (txToDelete) {
      let stockChanged = false;
      const updatedIngredients = ingredients.map(ing => {
        let stockToRestore = 0;
        txToDelete.items.forEach(txItem => {
          const prod = products.find(p => p.id === txItem.productId);
          if (prod && prod.ingredients) {
            const batchSize = prod.batchSize || 1;
            const recipeItem = prod.ingredients.find(ri => ri.ingredientId === ing.id);
            if (recipeItem) {
              stockToRestore += (recipeItem.amountNeeded / batchSize) * txItem.quantity;
            }
          }
        });

        if (stockToRestore > 0) {
          stockChanged = true;
          const currentStock = ing.stock ?? 0;
          const nextStock = Number((currentStock + stockToRestore).toFixed(4));
          return { ...ing, stock: nextStock };
        }
        return ing;
      });

      if (stockChanged) {
        saveIngredients(updatedIngredients);
      }
    }
  };

  const clearTransactions = () => {
    setTransactions([]);
    setTimeout(() => {
      try {
        localStorage.setItem('hppos_transactions', JSON.stringify([]));
        triggerSyncIndicator();
      } catch (err) {
        console.error("Local Storage Error:", err);
      }
    }, 0);
  };

  const lowStockCount = (ingredients || []).filter(
    ing => (ing.stock ?? 0) < (ing.minStock ?? 0)
  ).length;

  const navTabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'bahan', label: 'Database Bahan', icon: ClipboardIcon },
    { id: 'restock', label: 'Restock AI ✨', icon: Sparkles },
    { id: 'kalkulasi', label: 'Formulasi HPP', icon: Layers },
    { id: 'kasir', label: 'Kasir POS', icon: ShoppingBag },
    { id: 'riwayat', label: 'Riwayat Nota', icon: History },
    { id: 'laporan', label: 'Laporan Keuangan', icon: BarChart3 },
    { id: 'profile', label: 'Profil Toko', icon: Store }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans relative overflow-x-hidden">
      {/* Background Mesh Gradients */}
      <div className="absolute top-[-120px] left-[-120px] w-[500px] h-[500px] bg-indigo-600/15 rounded-full blur-[130px] pointer-events-none"></div>
      <div className="absolute bottom-[-100px] right-[-100px] w-[600px] h-[600px] bg-purple-600/15 rounded-full blur-[130px] pointer-events-none"></div>
      <div className="absolute top-1/3 left-1/4 w-[700px] h-[300px] bg-blue-500/10 rounded-full blur-[110px] rotate-45 pointer-events-none"></div>

      {/* PROFESSIONAL MERCHANT GLOW MAIN HEADER - HIDDEN ON PRINT */}
      <header className="sticky top-0 z-40 bg-slate-900/40 backdrop-blur-md border-b border-white/10 text-white no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/20 border border-indigo-400/30 font-sans relative">
              <Sparkles className="w-5.5 h-5.5 text-white" />
              {lowStockCount > 0 && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 rounded-full ring-2 ring-slate-900 animate-pulse"></span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-heading font-black text-base tracking-tight text-white">
                  {profile.storeName ? profile.storeName : "HPPOS"}
                </h1>
                <span className="hidden sm:inline-block text-[10px] bg-indigo-500/20 text-indigo-300 font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-indigo-500/30">
                  KASIR PINTAR
                </span>

                {/* Connection Status Indicator */}
                <div 
                  title={isOnline ? "Aplikasi tersambung ke Internet" : "Aplikasi berjalan dalam mode mandiri offline"}
                  className={`flex items-center gap-1.5 text-[9px] font-black px-2 py-0.5 rounded-full tracking-wider border select-none transition-all duration-300 ${
                    isOnline 
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                      : 'bg-rose-500/15 text-rose-400 border-rose-500/20 animate-pulse'
                  }`}
                >
                  {isOnline ? (
                    <>
                      <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></span>
                      <span className="hidden xs:inline">Online</span>
                    </>
                  ) : (
                    <>
                      <WifiOff className="w-2.5 h-2.5" />
                      <span>Offline</span>
                    </>
                  )}
                </div>

                {/* High-Performance Local Save Indicator */}
                <AnimatePresence>
                  {isSyncing && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8, x: -6 }}
                      animate={{ opacity: 1, scale: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.8, x: 6 }}
                      className="hidden sm:flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping"></span>
                      <span>Disimpan</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Guide trigger button */}
                <button
                  id="header-quickstart-btn"
                  title="Buka panduan cepat penggunaan"
                  type="button"
                  onClick={() => setQuickStartOpen(true)}
                  className="flex items-center gap-1.5 text-[9.5px] font-extrabold px-2.5 py-0.5 rounded-full border bg-indigo-650/10 bg-indigo-600/10 hover:bg-indigo-600/20 hover:text-white border-indigo-500/25 text-indigo-300 cursor-pointer transition-all active:scale-95"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Panduan</span>
                </button>
              </div>
              <p className="text-[11px] text-slate-400">Pencatat Harga Pokok Penjualan & Kasir Mikro UMKM</p>
            </div>
          </div>

          {/* Desktop Navigation Links (hidden on mobile/tablet screens <= 1024px) */}
          <nav className="hidden lg:flex gap-1.5 scrollbar-none">
            {navTabs.map(tab => {
              const TabIcon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  id={`tab-link-${tab.id}`}
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setMenuOpen(false);
                  }}
                  className={`py-2 px-3.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer whitespace-nowrap transition-all relative ${
                    isActive 
                      ? 'bg-white/10 hover:bg-white/15 text-white border border-white/20 shadow-lg' 
                      : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <div className="relative flex items-center gap-1.5">
                    <TabIcon className="w-4 h-4" />
                    {tab.label}
                    {tab.id === 'bahan' && lowStockCount > 0 && (
                      <span className="ml-1.5 px-1.5 py-0.5 text-[9px] font-black bg-rose-500 text-white rounded-full leading-none shadow-md shadow-rose-950/25">
                        {lowStockCount}
                      </span>
                    )}
                    {tab.id === 'dashboard' && lowStockCount > 0 && (
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 absolute top-0 -right-1.5 animate-ping"></span>
                    )}
                  </div>
                </button>
              );
            })}
          </nav>

          {/* Mobile hamburger menu toggle button */}
          <button
            id="hamburger-btn"
            onClick={() => setMenuOpen(!menuOpen)}
            className="lg:hidden p-2 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-white cursor-pointer transition-all relative"
            aria-label="Toggle Menu Layout"
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            {lowStockCount > 0 && !menuOpen && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-550 bg-rose-500 rounded-full ring-2 ring-slate-900 animate-pulse"></span>
            )}
          </button>
        </div>

        {/* Hamburger dropdown menu panel */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              id="navbar-drawer"
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              className="lg:hidden border-t border-white/10 bg-slate-900/95 backdrop-blur-xl px-4 py-3 space-y-1 block shadow-2xl"
            >
              <div className="py-1 uppercase text-[9px] font-bold text-slate-500 tracking-wider">Navigasi Fitur</div>
              {navTabs.map(tab => {
                const TabIcon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    id={`hamburger-tab-link-${tab.id}`}
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setMenuOpen(false);
                    }}
                    className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-between cursor-pointer transition-all ${
                      isActive
                        ? 'bg-indigo-650 bg-indigo-600 text-white shadow-md font-bold1'
                        : 'text-slate-300 hover:text-white hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <TabIcon className="w-4.5 h-4.5" />
                      {tab.label}
                    </div>
                    {tab.id === 'bahan' && lowStockCount > 0 && (
                      <span className="px-2 py-0.5 text-[9px] font-black bg-rose-500 text-white rounded-full leading-none shadow-md">
                        {lowStockCount} REBELANJA
                      </span>
                    )}
                    {tab.id === 'dashboard' && lowStockCount > 0 && (
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
                    )}
                  </button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Elegant Warning Alert Bar for Offline mode */}
      <AnimatePresence>
        {!isOnline && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-amber-500/10 border-b border-amber-500/20 text-amber-300 text-xs text-center py-2 px-4 flex items-center justify-center gap-2 font-medium z-30"
          >
            <WifiOff className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span>
              <strong>Mode Offline Aktif</strong>: Pencatatan kasir dan database stok bahan berjalan penuh secara lokal. Analisis <strong>Restock AI Gemini</strong> memerlukan koneksi internet.
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* RENDER VIEW MODULE PANELS */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 lg:pb-8 z-10 relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
          >
            {activeTab === 'dashboard' && (
              <Dashboard 
                transactions={transactions} 
                products={products} 
                ingredients={ingredients}
                onNavigateToTab={(tab) => setActiveTab(tab)}
              />
            )}
            
            {activeTab === 'bahan' && (
              <IngredientManager 
                ingredients={ingredients} 
                onSaveIngredients={saveIngredients} 
              />
            )}
            
            {activeTab === 'restock' && (
              <AIRestockAdvisor 
                ingredients={ingredients} 
                products={products} 
                transactions={transactions} 
                isOnline={isOnline}
              />
            )}
            
            {activeTab === 'kalkulasi' && (
              <ProductCalculator 
                products={products} 
                ingredients={ingredients} 
                onSaveProducts={saveProducts} 
              />
            )}
            
            {activeTab === 'kasir' && (
              <PointOfSale 
                products={products} 
                onAddTransaction={addTransaction} 
                profile={profile}
              />
            )}
            
            {activeTab === 'riwayat' && (
              <TransactionHistory 
                transactions={transactions} 
                onClearTransactions={clearTransactions} 
                onDeleteTransaction={deleteTransaction}
              />
            )}

            {activeTab === 'laporan' && (
              <FinanceReport 
                transactions={transactions}
                products={products}
              />
            )}

            {activeTab === 'profile' && (
              <StoreProfileManager 
                profile={profile} 
                onSaveProfile={saveProfile} 
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/90 backdrop-blur-md border-t border-white/10 lg:hidden flex justify-around items-center py-2 px-1 text-[11px] no-print">
        {/* Item 1: Dashboard */}
        <button
          id="mobile-nav-dashboard"
          onClick={() => {
            setActiveTab('dashboard');
            setMenuOpen(false);
          }}
          className={`flex flex-col items-center gap-1 cursor-pointer transition-all relative ${
            activeTab === 'dashboard' ? 'text-indigo-400 font-bold' : 'text-slate-400'
          }`}
        >
          <div className="relative">
            <LayoutDashboard className="w-5 h-5" />
            {lowStockCount > 0 && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-rose-500 rounded-full animate-ping"></span>
            )}
          </div>
          <span className="scale-90 text-[10px]">Beranda</span>
        </button>

        {/* Item 2: Bahan */}
        <button
          id="mobile-nav-bahan"
          onClick={() => {
            setActiveTab('bahan');
            setMenuOpen(false);
          }}
          className={`flex flex-col items-center gap-1 cursor-pointer transition-all relative ${
            activeTab === 'bahan' ? 'text-indigo-400 font-bold' : 'text-slate-400'
          }`}
        >
          <div className="relative">
            <ClipboardIcon className="w-5 h-5" />
            {lowStockCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 px-1 bg-rose-500 text-white rounded-full text-[8.5px] font-black scale-90 leading-tight">
                {lowStockCount}
              </span>
            )}
          </div>
          <span className="scale-90 text-[10px]">Bahan</span>
        </button>

        {/* Item 3: Kasir (POS Centerpiece - glowing elevated spotlight!) */}
        <button
          id="mobile-nav-kasir"
          onClick={() => {
            setActiveTab('kasir');
            setMenuOpen(false);
          }}
          className="relative flex flex-col items-center gap-1 cursor-pointer group -mt-5 transition-all"
        >
          <div className={`p-3 rounded-full shadow-lg border transition-all ${
            activeTab === 'kasir' 
              ? 'bg-indigo-650 bg-indigo-600 border-indigo-400 text-white shadow-indigo-500/40 scale-110' 
              : 'bg-slate-800 border-white/10 text-slate-300'
          }`}>
            <ShoppingBag className="w-5 h-5" />
          </div>
          <span className={`scale-90 text-[10px] font-bold ${activeTab === 'kasir' ? 'text-indigo-300' : 'text-slate-400'}`}>
            Kasir
          </span>
        </button>

        {/* Item 4: HPP Formulasi */}
        <button
          id="mobile-nav-kalkulasi"
          onClick={() => {
            setActiveTab('kalkulasi');
            setMenuOpen(false);
          }}
          className={`flex flex-col items-center gap-1 cursor-pointer transition-all ${
            activeTab === 'kalkulasi' ? 'text-indigo-400 font-bold' : 'text-slate-400'
          }`}
        >
          <Layers className="w-5 h-5" />
          <span className="scale-90 text-[10px]">Formulasi</span>
        </button>

        {/* Item 5: Menu Hamburger layout drawer toggle to access riwayat, laporan, profile */}
        <button
          id="mobile-nav-hamburger"
          onClick={() => setMenuOpen(!menuOpen)}
          className={`flex flex-col items-center gap-1 cursor-pointer transition-all ${
            menuOpen ? 'text-indigo-400 font-bold' : 'text-slate-450 text-indigo-300 animate-pulse'
          }`}
        >
          {menuOpen ? <X className="w-5 h-5 text-indigo-400" /> : <Menu className="w-5 h-5" />}
          <span className="scale-90 text-[10px]">Lainnya</span>
        </button>
      </nav>

      {/* FOOTER - HIDDEN ON PRINT & SAFE SPACE FROM MOBILE BAR */}
      <footer className="border-t border-white/5 bg-slate-950/40 backdrop-blur-md py-6 pb-24 text-center text-xs text-slate-400 mt-12 z-10 relative no-print lg:pb-6">
        <div className="max-w-7xl mx-auto px-4 space-y-1">
          <p>© {new Date().getFullYear()} HPPOS Kasir. Aplikasi Cerdas Manajemen Profitabilitas Usaha Mikro.</p>
          <p className="opacity-75">Didesain dengan Cinta untuk Kesejahteraan Pengusaha Kuliner, Katering & Ritel Indonesia.</p>
        </div>
      </footer>

      {/* Quick Start Guide Modal */}
      <QuickStartModal 
        isOpen={quickStartOpen} 
        onClose={() => {
          setQuickStartOpen(false);
          localStorage.setItem('hppos_quickstart_dismissed', 'true');
        }} 
        onNavigateToTab={(tab) => setActiveTab(tab)}
      />
    </div>
  );
}

// Simple internal ClipboardIcon replacement to keep lucide-react standard
function ClipboardIcon(props: any) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2.5" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={props.className}
      style={{ width: '1em', height: '1em' }}
    >
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
    </svg>
  );
}
