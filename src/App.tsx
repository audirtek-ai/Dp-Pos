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

// Visual Assets
import { 
  LayoutDashboard, ShoppingBag, Layers, History, Sparkles, BarChart3, Menu, X, Store
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [menuOpen, setMenuOpen] = useState(false);
  
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
  }, []);

  // Sync helpers
  const saveIngredients = (newIng: Ingredient[]) => {
    setIngredients(newIng);
    localStorage.setItem('hppos_ingredients', JSON.stringify(newIng));
  };

  const saveProducts = (newProd: Product[]) => {
    setProducts(newProd);
    localStorage.setItem('hppos_products', JSON.stringify(newProd));
  };

  const saveProfile = (newProfile: StoreProfile) => {
    setProfile(newProfile);
    localStorage.setItem('hppos_profile', JSON.stringify(newProfile));
  };

  const addTransaction = (newTx: Transaction) => {
    const updated = [newTx, ...transactions];
    setTransactions(updated);
    localStorage.setItem('hppos_transactions', JSON.stringify(updated));

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
    localStorage.setItem('hppos_transactions', JSON.stringify(updated));

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
    localStorage.setItem('hppos_transactions', JSON.stringify([]));
  };

  const navTabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'bahan', label: 'Database Bahan', icon: ClipboardIcon },
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
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/20 border border-indigo-400/30">
              <Sparkles className="w-5.5 h-5.5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-heading font-black text-base tracking-tight text-white">
                  {profile.storeName ? profile.storeName : "HPPOS"}
                </h1>
                <span className="hidden sm:inline-block text-[10px] bg-indigo-500/20 text-indigo-300 font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-indigo-500/30">
                  KASIR PINTAR
                </span>
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
                  className={`py-2 px-3.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer whitespace-nowrap transition-all ${
                    isActive 
                      ? 'bg-white/10 hover:bg-white/15 text-white border border-white/20 shadow-lg' 
                      : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <TabIcon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>

          {/* Mobile hamburger menu toggle button */}
          <button
            id="hamburger-btn"
            onClick={() => setMenuOpen(!menuOpen)}
            className="lg:hidden p-2 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-white cursor-pointer transition-all"
            aria-label="Toggle Menu Layout"
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
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
                    className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center gap-3 cursor-pointer transition-all ${
                      isActive
                        ? 'bg-indigo-650 bg-indigo-600 text-white shadow-md font-bold'
                        : 'text-slate-300 hover:text-white hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    <TabIcon className="w-4.5 h-4.5" />
                    {tab.label}
                  </button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </header>

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
          className={`flex flex-col items-center gap-1 cursor-pointer transition-all ${
            activeTab === 'dashboard' ? 'text-indigo-400 font-bold' : 'text-slate-400'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="scale-90 text-[10px]">Beranda</span>
        </button>

        {/* Item 2: Bahan */}
        <button
          id="mobile-nav-bahan"
          onClick={() => {
            setActiveTab('bahan');
            setMenuOpen(false);
          }}
          className={`flex flex-col items-center gap-1 cursor-pointer transition-all ${
            activeTab === 'bahan' ? 'text-indigo-400 font-bold' : 'text-slate-400'
          }`}
        >
          <ClipboardIcon className="w-5 h-5" />
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
