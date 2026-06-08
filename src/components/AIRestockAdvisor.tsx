import { useState, useEffect } from 'react';
import { Ingredient, Product, Transaction } from '../types';
import { formatRupiah } from '../utils';
import { 
  Sparkles, AlertTriangle, Calendar, RefreshCw, Search, CheckCircle, HelpCircle, 
  Package, Clock, ArrowRight, Lightbulb, Wallet, CheckSquare, WifiOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AIRestockAdvisorProps {
  ingredients: Ingredient[];
  products: Product[];
  transactions: Transaction[];
  isOnline: boolean;
}

interface RestockItem {
  ingredientId: string;
  ingredientName: string;
  currentStock: number;
  unit: string;
  salesVelocity: number;
  daysLeft: number;
  recommendedRestockDate: string;
  restockAction: 'CRITICAL' | 'WARNING' | 'SAFE';
  recommendedQty: number;
  estimatedCost: number;
  reasoning: string;
}

interface RestockAnalysisResponse {
  summary: string;
  alertsCount: number;
  restockItems: RestockItem[];
  insights: string[];
}

export default function AIRestockAdvisor({ ingredients, products, transactions, isOnline }: AIRestockAdvisorProps) {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<RestockAnalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // GUI filter and search states
  const [filter, setFilter] = useState<'ALL' | 'CRITICAL' | 'WARNING' | 'SAFE'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Cyclic loading messages for responsive user feedback
  const [loadingMessageIdx, setLoadingMessageIdx] = useState(0);
  const loadingMessages = [
    "Menghubungkan ke Otak AI Gemini...",
    "Membongkar catatan resep produk...",
    "Menganalisis kecocokan transaksi penjualan...",
    "Mengalkulasi kecepatan konsumsi (laju volume harian)...",
    "Memetakan sisa hari sebelum stok kritis...",
    "Menyusun anggaran belanja optimal..."
  ];

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (loading) {
      timer = setInterval(() => {
        setLoadingMessageIdx((prev) => (prev + 1) % loadingMessages.length);
      }, 3000);
    } else {
      setLoadingMessageIdx(0);
    }
    return () => clearInterval(timer);
  }, [loading]);

  // Load cached analysis from local storage if appropriate to persist previous results
  useEffect(() => {
    const cached = localStorage.getItem('hppos_ai_restock_cache');
    if (cached) {
      try {
        setAnalysis(JSON.parse(cached));
      } catch (e) {
        console.error("Error reading cache", e);
      }
    }
  }, []);

  const runAnalysis = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/gemini/restock-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ingredients,
          products,
          transactions,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Gagal melakukan komunikasi dengan server.");
      }

      const result: RestockAnalysisResponse = await response.json();
      setAnalysis(result);
      localStorage.setItem('hppos_ai_restock_cache', JSON.stringify(result));
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Ugh, ada kesalahan koneksi saat memproses data.");
    } finally {
      setLoading(false);
    }
  };

  // Filter items based on user choice
  const filteredItems = analysis?.restockItems.filter((item) => {
    const matchesFilter = filter === 'ALL' || item.restockAction === filter;
    const matchesSearch = item.ingredientName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  }) || [];

  // Computed totals for recommended purchases
  const totalEstimatedCost = filteredItems.reduce((sum, item) => sum + item.estimatedCost, 0);
  const criticalCount = analysis?.restockItems.filter(item => item.restockAction === 'CRITICAL').length || 0;
  const warningCount = analysis?.restockItems.filter(item => item.restockAction === 'WARNING').length || 0;

  return (
    <div className="space-y-6">
      {/* HEADER HERO AREA */}
      <div className="glass-panel p-6 rounded-3xl relative overflow-hidden shadow-2xl border border-white/10 text-left bg-gradient-to-br from-slate-900 to-slate-950">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="flex flex-col md:flex-row gap-6 md:items-center justify-between z-10 relative">
          <div className="space-y-2.5 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-bold text-xs uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              Fitur Cerdas AI Gemini
            </div>
            <h2 className="font-heading font-black text-xl text-white tracking-tight leading-tight">
              AI Penasihat Stok & Prediksi Pengadaan
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Menganalisis kecepatan konsumsi bahan baku dari riwayat kuantitas transaksi penjualan Anda. AI mengalkulasi sisa hari pemakaian sebelum kritis, tanggal belanja ideal, serta jumlah unit yang harus dibeli untuk operasional 14 hari ke depan secara presisi.
            </p>
          </div>
          
          <button
            onClick={runAnalysis}
            disabled={loading || !isOnline}
            className="group relative inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-550 hover:bg-indigo-500 text-white font-extrabold text-xs cursor-pointer transition-all shadow-lg shadow-indigo-600/30 border border-indigo-400/30 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden flex-shrink-0"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin text-white" />
            ) : !isOnline ? (
              <WifiOff className="w-4 h-4 text-white/50 animate-pulse" />
            ) : (
              <Sparkles className="w-4 h-4 text-white group-hover:scale-110 transition-transform" />
            )}
            {loading ? "Menganalisis..." : !isOnline ? "Offline (Butuh Internet)" : analysis ? "Mulai Ulang Analisis AI" : "Analisis Riwayat & Stok"}
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* LOADING SCREEN CONTAINER */}
        {loading && (
          <motion.div
            key="loading"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="glass-panel p-16 rounded-2xl border border-white/5 flex flex-col items-center justify-center text-center space-y-6"
          >
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-t-2 border-r-2 border-indigo-500 animate-spin"></div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-indigo-400">
                <Sparkles className="w-6 h-6 animate-pulse" />
              </div>
            </div>
            
            <div className="space-y-1">
              <h4 className="font-heading font-bold text-slate-100 text-sm">Menghitung Strategi Pengadaan</h4>
              <p className="text-slate-400 text-xs transition-all duration-500 max-w-sm mx-auto h-4 font-semibold text-indigo-300">
                {loadingMessages[loadingMessageIdx]}
              </p>
            </div>
          </motion.div>
        )}

        {/* ERROR SCREEN */}
        {error && !loading && (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-5 bg-red-950/20 border border-red-500/30 rounded-2xl flex flex-col sm:flex-row gap-4 items-start text-left"
          >
            <div className="p-2 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="space-y-2">
              <h4 className="font-bold text-red-200 text-sm">Gagal Mengumpulkan Analisis AI</h4>
              <p className="text-xs text-slate-300 leading-relaxed font-semibold">
                {error}
              </p>
              <div className="pt-2 text-[11px] text-slate-400 leading-relaxed">
                Tip: Pastikan Anda telah menaruh <strong className="text-slate-200">GEMINI_API_KEY</strong> Anda di panel <strong className="text-indigo-400">Settings {" > "} Secrets</strong> pada AI Studio. Kunci API digunakan untuk memberi daya pada kecerdasan analitik asisten pengadaan Anda.
              </div>
            </div>
          </motion.div>
        )}

        {/* MAIN RESULTS AND INSIGHT CONTAINER */}
        {analysis && !loading && !error && (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* EXECUTIVE SUMMARY & PILL OVERVIEWS */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
              
              {/* Executive Summary Card */}
              <div className="lg:col-span-2 glass-panel p-5 rounded-2xl text-left flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <span className="text-[10px] uppercase font-black text-indigo-400 tracking-wider flex items-center gap-1.5">
                    <CheckSquare className="w-3.5 h-3.5" />
                    Ringkasan Eksekutif AI
                  </span>
                  <h3 className="font-heading font-extrabold text-sm text-white">Status Rantai Pasok Toko</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {analysis.summary}
                  </p>
                </div>
                
                {/* Count summary indicators */}
                <div className="grid grid-cols-2 gap-3.5 pt-4 border-t border-white/5">
                  <div className="bg-red-950/20 border border-red-500/20 p-3 rounded-xl">
                    <span className="block text-[10px] uppercase font-bold text-red-300">Harus Segera Belanja</span>
                    <span className="text-xl font-bold font-mono text-white leading-none">{criticalCount} <span className="text-xs font-normal">Bahan</span></span>
                  </div>
                  <div className="bg-amber-950/20 border border-amber-500/20 p-3 rounded-xl">
                    <span className="block text-[10px] uppercase font-bold text-amber-300">Stok Mulai Habis</span>
                    <span className="text-xl font-bold font-mono text-white leading-none">{warningCount} <span className="text-xs font-normal">Bahan</span></span>
                  </div>
                </div>
              </div>

              {/* AI Strategic Insights Card */}
              <div className="glass-panel p-5 rounded-2xl text-left bg-gradient-to-br from-indigo-950/20 to-slate-900 border border-indigo-500/10 flex flex-col justify-between">
                <div className="space-y-3">
                  <span className="text-[10px] uppercase font-black text-indigo-400 tracking-wider flex items-center gap-1.5">
                    <Lightbulb className="w-3.5 h-3.5 text-indigo-300" />
                    Wawasan Strategis Toko
                  </span>
                  <h3 className="font-heading font-extrabold text-sm text-white">Rasio Perputaran</h3>
                  
                  <ul className="space-y-2">
                    {analysis.insights.map((insight, index) => (
                      <li key={index} className="flex gap-2 items-start text-xs text-slate-350 leading-relaxed text-slate-300">
                        <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full mt-1.5 flex-shrink-0"></span>
                        {insight}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="pt-4 text-[10px] text-slate-450 text-slate-500">
                  ⚠️ Analisis diperbarui dinamis berdasarkan volume log transaksional Kasir POS.
                </div>
              </div>
            </div>

            {/* INTERACTIVE RECOMMENDATIONS TABLE/CARDS */}
            <div className="glass-panel rounded-2xl overflow-hidden shadow-xl text-left">
              
              {/* Filter and search bar header row */}
              <div className="p-4 border-b border-white/5 bg-slate-900/40 flex flex-col sm:flex-row gap-3 items-center justify-between">
                {/* Filters */}
                <div className="flex bg-slate-950 p-1.5 rounded-xl border border-white/5 scrollbar-none overflow-x-auto w-full sm:w-auto">
                  <button
                    onClick={() => setFilter('ALL')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                      filter === 'ALL' ? 'bg-white/10 text-white font-bold' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Semua ({analysis.restockItems.length})
                  </button>
                  <button
                    onClick={() => setFilter('CRITICAL')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                      filter === 'CRITICAL' ? 'bg-red-500/10 text-red-300 font-bold border border-red-500/20' : 'text-slate-400 hover:text-red-350 hover:text-red-300'
                    }`}
                  >
                    Kritis ({analysis.restockItems.filter(i => i.restockAction === 'CRITICAL').length})
                  </button>
                  <button
                    onClick={() => setFilter('WARNING')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                      filter === 'WARNING' ? 'bg-amber-500/10 text-amber-300 font-bold border border-amber-500/20' : 'text-slate-400 hover:text-amber-350 hover:text-amber-300'
                    }`}
                  >
                    Urgensi ({analysis.restockItems.filter(i => i.restockAction === 'WARNING').length})
                  </button>
                  <button
                    onClick={() => setFilter('SAFE')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                      filter === 'SAFE' ? 'bg-emerald-500/10 text-emerald-300 font-bold border border-emerald-500/20' : 'text-slate-400 hover:text-emerald-350 hover:text-emerald-300'
                    }`}
                  >
                    Aman ({analysis.restockItems.filter(i => i.restockAction === 'SAFE').length})
                  </button>
                </div>

                {/* Search query input */}
                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Cari bahan baku..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-950 border border-white/5 focus:border-indigo-500 rounded-xl py-2.5 pl-10 pr-4 text-xs font-semibold text-white focus:outline-none placeholder-slate-450 placeholder-slate-500"
                  />
                </div>
              </div>

              {/* Items Render Area */}
              {filteredItems.length === 0 ? (
                <div className="py-16 text-center text-slate-400 text-xs">
                  <Package className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                  Tidak ada data rekomendasi restock bahan baku yang cocok untuk filter ini.
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {filteredItems.map((item) => (
                    <div 
                      key={item.ingredientId}
                      className="p-5 hover:bg-white/[0.01] transition-colors flex flex-col md:flex-row gap-4 items-start md:items-center justify-between"
                    >
                      {/* Name & status badge */}
                      <div className="space-y-2 max-w-sm text-left">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="font-heading font-extrabold text-sm text-white">{item.ingredientName}</h4>
                          
                          {item.restockAction === 'CRITICAL' && (
                            <span className="text-[9px] font-black bg-red-500/10 text-red-300 border border-red-500/20 px-2 py-0.5 rounded-full select-none">
                              KRITIS / SEGERA
                            </span>
                          )}
                          {item.restockAction === 'WARNING' && (
                            <span className="text-[9px] font-black bg-amber-500/10 text-amber-300 border border-amber-500/20 px-2 py-0.5 rounded-full select-none">
                              WARNING
                            </span>
                          )}
                          {item.restockAction === 'SAFE' && (
                            <span className="text-[9px] font-black bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-2 py-0.5 rounded-full select-none">
                              STOK AMAN
                            </span>
                          )}
                        </div>

                        <p className="text-[11px] text-slate-400 line-clamp-2 md:line-clamp-none font-medium leading-relaxed">
                          {item.reasoning}
                        </p>
                      </div>

                      {/* Velocity and stock tracking */}
                      <div className="grid grid-cols-2 md:flex gap-4 md:gap-8 flex-shrink-0 text-left w-full md:w-auto">
                        
                        {/* current level & velocity */}
                        <div className="space-y-1">
                          <span className="text-[10px] text-slate-550 text-slate-400 uppercase font-semibold block">Persediaan</span>
                          <span className="font-mono text-xs font-bold text-slate-200 block">
                            {item.currentStock.toLocaleString('id-ID')} {item.unit}
                          </span>
                          <span className="text-[9px] text-slate-500 block">
                            Laju: ~{item.salesVelocity.toFixed(1)} / hari
                          </span>
                        </div>

                        {/* remaining survival duration */}
                        <div className="space-y-1">
                          <span className="text-[10px] text-slate-550 text-slate-400 uppercase font-semibold block">Daya Tahan</span>
                          <span className={`font-mono text-xs font-bold block ${
                            item.daysLeft <= 2 ? 'text-red-400' :
                            item.daysLeft <= 5 ? 'text-amber-400' :
                            'text-emerald-400'
                          }`}>
                            {item.daysLeft === 999 ? "∞ Hari" : `~${item.daysLeft.toFixed(1)} Hari`}
                          </span>
                          <span className="text-[9px] text-slate-500 flex items-center gap-0.5">
                            <Clock className="w-2.5 h-2.5" />
                            {item.daysLeft === 999 ? "Tidak terjual" : item.recommendedRestockDate}
                          </span>
                        </div>

                        {/* recommended purchase qty */}
                        <div className="space-y-1 text-left md:text-right">
                          <span className="text-[10px] text-slate-550 text-slate-400 uppercase font-semibold block text-indigo-300">Belanja Ulang</span>
                          {item.recommendedQty > 0 ? (
                            <span className="font-mono text-xs font-extrabold text-white block">
                              {item.recommendedQty.toLocaleString('id-ID')} {item.unit}
                            </span>
                          ) : (
                            <span className="font-sans text-xs text-slate-400 font-bold block">
                              Belum Perlu
                            </span>
                          )}
                          <span className="text-[9px] text-indigo-400 font-bold block">
                            {item.estimatedCost > 0 ? formatRupiah(item.estimatedCost) : "Rp 0"}
                          </span>
                        </div>

                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Aggregated budget footer summary under POS table */}
              <div className="p-5 bg-slate-900/40 border-t border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-left">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-indigo-300" />
                    <span className="text-xs font-bold text-slate-200">
                      Rencana Anggaran Belanja (Belanja Aman 14 Hari)
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 max-w-md">
                    Total estimasi permodalan belanja baru diringkas dari akumulasi bahan baku terpilih di tabel filter di atas.
                  </p>
                </div>

                <div className="space-y-1.5 sm:text-right w-full sm:w-auto">
                  <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider block">Total Pengeluaran</span>
                  <span className="text-lg font-black font-mono text-emerald-400 block tracking-tight">
                    {formatRupiah(totalEstimatedCost)}
                  </span>
                </div>
              </div>

            </div>
          </motion.div>
        )}

        {/* DEFAULT INITIAL INSTRUCTION SECTION */}
        {!analysis && !loading && (
          <motion.div
            key="initial"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass-panel p-8 sm:p-12 rounded-2xl border border-white/5 text-center max-w-xl mx-auto space-y-6"
          >
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-400/20 shadow-lg mx-auto">
              <Sparkles className="w-8 h-8" />
            </div>
            
            <div className="space-y-2">
              <h3 className="font-heading font-black text-slate-100 text-base">Butuh Gambaran Kapan Harus Belanja?</h3>
              <p className="text-slate-450 text-slate-400 text-xs leading-relaxed">
                Asisten AI Gemini akan menghitung laju konsumsi bahan baku dari riwayat transaksi POS yang terjadi, lalu dicocokkan dengan level stok bahan di gudang saat ini.
              </p>
            </div>

            <div className="p-4 bg-slate-950 rounded-xl border border-white/5 text-left text-xs text-slate-300 space-y-3 font-medium">
              <p className="font-bold text-white flex items-center gap-1.5 border-b border-white/5 pb-1.5">
                <Package className="w-4 h-4 text-indigo-300" /> Bagaimana AI bekerja untuk bisnis Anda?
              </p>
              <div className="flex gap-2.5 items-start">
                <span className="w-5 h-5 rounded-md bg-white/5 text-slate-200 text-[10px] flex items-center justify-center font-bold flex-shrink-0">1</span>
                <span>Menguraikan porsi bahan tiap menu terlaris dari resep Anda.</span>
              </div>
              <div className="flex gap-2.5 items-start">
                <span className="w-5 h-5 rounded-md bg-white/5 text-slate-200 text-[10px] flex items-center justify-center font-bold flex-shrink-0">2</span>
                <span>Mengalikan kuantitas terjual dengan porsi resep sepanjang log riwayat.</span>
              </div>
              <div className="flex gap-2.5 items-start">
                <span className="w-5 h-5 rounded-md bg-white/5 text-slate-200 text-[10px] flex items-center justify-center font-bold flex-shrink-0">3</span>
                <span>Membagi total konsumsi dengan rentang hari guna memetakan kecepatan konsumsi riil.</span>
              </div>
            </div>

            <button
              onClick={runAnalysis}
              disabled={!isOnline}
              className="w-full inline-flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-indigo-650 bg-indigo-600 hover:bg-indigo-550 text-white font-bold text-xs cursor-pointer transition-all shadow-md active:scale-95 disabled:bg-slate-800 disabled:text-slate-500 disabled:border-slate-700/50 disabled:cursor-not-allowed border border-transparent"
            >
              {!isOnline ? (
                <>
                  <WifiOff className="w-4 h-4 text-slate-500" />
                  Koneksi Terkompromikan (Butuh Internet)
                </>
              ) : (
                <>
                  Mulai Analisis Sekarang
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
