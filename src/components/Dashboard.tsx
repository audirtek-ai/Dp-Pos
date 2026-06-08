/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Transaction, Product, Ingredient } from '../types';
import { formatRupiah, formatPercent } from '../utils';
import { 
  TrendingUp, CircleDollarSign, Percent, Layers, Award, Sparkles, AlertCircle, ShoppingBag, DollarSign, AlertTriangle
} from 'lucide-react';
import { motion } from 'motion/react';

interface DashboardProps {
  transactions: Transaction[];
  products: Product[];
  ingredients: Ingredient[];
  onNavigateToTab: (tab: string) => void;
}

export default function Dashboard({ transactions, products, ingredients, onNavigateToTab }: DashboardProps) {
  // Low stock check
  const lowStockIngredients = (ingredients || []).filter(
    ing => (ing.stock ?? 0) < (ing.minStock ?? 0)
  );

  // Aggregate KPIs
  const totalRevenue = transactions.reduce((sum, tx) => sum + tx.totalSales, 0);
  const totalHpp = transactions.reduce((sum, tx) => sum + tx.totalHpp, 0);
  const totalProfit = transactions.reduce((sum, tx) => sum + tx.totalProfit, 0);
  const averageMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

  // Top Selling Products Calculations
  const productSalesMap: { [id: string]: { name: string; qty: number; revenue: number; profit: number } } = {};
  
  transactions.forEach(tx => {
    tx.items.forEach(it => {
      if (!productSalesMap[it.productId]) {
        productSalesMap[it.productId] = {
          name: it.productName,
          qty: 0,
          revenue: 0,
          profit: 0
        };
      }
      productSalesMap[it.productId].qty += it.quantity;
      productSalesMap[it.productId].revenue += it.totalPrice;
      productSalesMap[it.productId].profit += it.totalProfit;
    });
  });

  const topSellers = Object.values(productSalesMap)
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 4);

  // Group sales by day of the week, or by date serial
  const getAggregatedSalesByDate = () => {
    const map: { [date: string]: { date: string; sales: number; profit: number } } = {};
    
    // Last 5 transactions or days to visualize
    transactions.forEach(tx => {
      const dateStr = new Date(tx.timestamp).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
      if (!map[dateStr]) {
        map[dateStr] = { date: dateStr, sales: 0, profit: 0 };
      }
      map[dateStr].sales += tx.totalSales;
      map[dateStr].profit += tx.totalProfit;
    });

    const list = Object.values(map);
    // Fill empty placeholder dates if no transactions to make graph look pretty
    if (list.length === 0) {
      return [
        { date: 'Senin', sales: 0, profit: 0 },
        { date: 'Selasa', sales: 0, profit: 0 },
        { date: 'Rabu', sales: 0, profit: 0 },
        { date: 'Kamis', sales: 0, profit: 0 },
        { date: 'Jumat', sales: 0, profit: 0 }
      ];
    }
    return list.slice(-5); // Show latest 5 records
  };

  const chartData = getAggregatedSalesByDate();
  const maxVal = Math.max(...chartData.map(d => d.sales), 50000); // minimum scale

  // Financial Health Recommendation System
  const getFinancialAdvice = () => {
    if (transactions.length === 0) {
      return {
        title: "Selamat datang di HPPOS!",
        text: "Mulai dengan merekam transaksi penjualan di tab 'Kasir POS' untuk melacak omzet dan keuntungan bersih produk secara real-time.",
        type: "neutral"
      };
    }
    if (averageMargin < 25) {
      return {
        title: "Margin Laba Tipis (< 25%)",
        text: "Profitabilitas rata-rata Anda berada di bawah 25%. Pertimbangkan untuk menaikkan harga jual produk, meminimalkan overhead produksi, atau bernegosiasi dengan pemasok bahan baku untuk menekan angka HPP satuan.",
        type: "warning"
      };
    }
    if (averageMargin >= 25 && averageMargin <= 45) {
      return {
        title: "Profitabilitas Sehat & Stabil",
        text: "Rerata margin laba bersih Anda stabil di angka " + averageMargin.toFixed(0) + "%. Fokuslah pada volume perputaran penjualan di Kasir dan kurangi sisa bahan baku produksi (waste) untuk menjaga konsistensi laba.",
        type: "success"
      };
    }
    return {
      title: "Margin Laba Tinggi (> 45%)",
      text: "Luar biasa! Produk Anda memiliki margin keuntungan yang sangat tebal. Ini adalah peluang bagus untuk melakukan ekspansi, reinvestasi pada kualitas bahan baku, atau mengadakan promosi diskon terukur untuk menarik pelanggan baru.",
      type: "premium"
    };
  };

  const advice = getFinancialAdvice();

  return (
    <div className="space-y-6">
      {/* KPI Stats Cards Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="glass-panel p-5 rounded-2xl shadow-xl space-y-3">
          <div className="flex justify-between items-center text-slate-450 text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Penjualan (Omzet)</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <span className="font-mono text-xl font-bold text-white block leading-none">
              {formatRupiah(totalRevenue)}
            </span>
            <span className="text-[10px] text-slate-450 text-slate-400">Total kas masuk tunai & non-tunai</span>
          </div>
        </div>

        {/* Total HPP */}
        <div className="glass-panel p-5 rounded-2xl shadow-xl space-y-3">
          <div className="flex justify-between items-center text-slate-450 text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Modal (HPP)</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <span className="font-mono text-xl font-bold text-white block leading-none">
              {formatRupiah(totalHpp)}
            </span>
            <span className="text-[10px] text-slate-450 text-slate-400">Harga Pokok Produksi barang terjual</span>
          </div>
        </div>

        {/* Net Profit */}
        <div className="glass-panel p-5 rounded-2xl shadow-xl space-y-3">
          <div className="flex justify-between items-center text-slate-450 text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Keuntungan Bersih (Profit)</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-300 flex items-center justify-center border border-indigo-500/30">
              <CircleDollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <span className="font-mono text-xl font-bold text-emerald-400 block leading-none animate-pulse">
              +{formatRupiah(totalProfit)}
            </span>
            <span className="text-[10px] text-slate-450 text-slate-400">Penerimaan kotor dikurangi biaya modal HPP</span>
          </div>
        </div>

        {/* Margin % */}
        <div className="glass-panel p-5 rounded-2xl shadow-xl space-y-3">
          <div className="flex justify-between items-center text-slate-450 text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Rerata Margin Laba</span>
            <div className="w-8 h-8 rounded-lg bg-white/10 text-white flex items-center justify-center border border-white/10">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <span className="font-mono text-xl font-bold text-indigo-300 block leading-none">
              {formatPercent(averageMargin)}
            </span>
            <span className="text-[10px] text-slate-450 text-slate-400">Nisbah profitabilitas penjualan</span>
          </div>
        </div>
      </div>

      {/* LOW STOCK ALERT SYSTEM BENTO BLOCK */}
      {lowStockIngredients.length > 0 && (
        <motion.div
          id="low-stock-alert-panel"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-5 rounded-2xl border border-red-500/30 bg-red-950/20 backdrop-blur-xl flex flex-col md:flex-row gap-4 items-start justify-between shadow-lg shadow-red-950/10"
        >
          <div className="flex gap-3 items-start flex-1 w-full">
            <div className="mt-0.5 p-2 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse flex-shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="space-y-2 flex-1 w-full text-left">
              <h4 className="font-heading font-extrabold text-sm uppercase tracking-wider text-red-200">
                ⚠️ Peringatan: Stok Bahan Baku Menipis!
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                Ada <strong className="text-white">{lowStockIngredients.length} bahan baku</strong> yang berada di bawah ambang batas aman minimum produksi. Segera lakukan pengadaan atau penambahan stok untuk menjaga kelancaran operasional produksi HPP Anda.
              </p>
              
              {/* Grid of Low Stock Items */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-2">
                {lowStockIngredients.map(ing => (
                  <div 
                    key={ing.id} 
                    className="flex justify-between items-center p-2.5 rounded-xl bg-slate-950/50 border border-white/5 hover:border-red-500/25 transition-all text-left"
                  >
                    <span className="text-xs font-semibold text-slate-200 truncate pr-2 max-w-[150px]" title={ing.name}>
                      {ing.name}
                    </span>
                    <div className="text-right flex-shrink-0">
                      <span className="text-[9px] block font-mono text-slate-500">Tersisa:</span>
                      <span className="font-mono text-xs font-black text-red-300">
                        {ing.stock ?? 0} <span className="text-[10px] font-normal">{ing.unit}</span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <button
            id="btn-navigate-ingredients"
            onClick={() => onNavigateToTab('bahan')}
            className="w-full md:w-auto mt-2 md:mt-0 font-bold text-xs inline-flex items-center justify-center gap-1.5 text-red-350 bg-red-500/10 hover:bg-red-500/20 px-4 py-2.5 rounded-xl border border-red-500/30 cursor-pointer transition-all shadow-xl flex-shrink-0 text-red-300"
          >
            Belanja / Kelola Stok
            <ArrowRight className="w-4 h-4" />
          </button>
        </motion.div>
      )}

      {/* Main Charts & Action split rows */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Custom Pure SVG Sales Chart panel (8 cols in desktop) */}
        <div className="lg:col-span-8 glass-panel rounded-2xl p-5 shadow-2xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h3 className="font-heading font-semibold text-sm text-white">
                Visualisasi Keuangan & Tren Profit
              </h3>
              <p className="text-[11px] text-slate-400">Rasio perbandingan volume Penjualan (Hijau) vs Profit Bersih (Ungu)</p>
            </div>
            
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1 font-semibold text-slate-300">
                <span className="w-2.5 h-2.5 bg-emerald-400 rounded-sm inline-block"></span>
                Penjualan
              </span>
              <span className="flex items-center gap-1 font-semibold text-slate-300">
                <span className="w-2.5 h-2.5 bg-indigo-400 rounded-sm inline-block"></span>
                Laba Bersih
              </span>
            </div>
          </div>

          {/* Pure Inline SVG bar chart illustration dynamic representation */}
          <div className="relative pt-4">
            <svg viewBox="0 0 500 200" className="w-full h-56 overflow-visible" xmlns="http://www.w3.org/2000/svg">
              {/* Horizontal Grid lines changed to transparent glass lines */}
              <line x1="40" y1="20" x2="480" y2="20" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
              <line x1="40" y1="70" x2="480" y2="70" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
              <line x1="40" y1="120" x2="480" y2="120" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
              <line x1="40" y1="170" x2="480" y2="170" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />

              {/* Chart data bars mapping */}
              {chartData.map((d, index) => {
                const totalBars = chartData.length;
                const columnWidth = 400 / totalBars;
                const xPos = 50 + index * columnWidth + (columnWidth - 40) / 2;
                
                // Height computations relative to max val
                const salesHeight = (d.sales / maxVal) * 140;
                const profitHeight = (d.profit / maxVal) * 140;

                const salesY = 170 - salesHeight;
                const profitY = 170 - profitHeight;

                return (
                  <g key={index} className="group cursor-pointer">
                    {/* Sales Column (Emerald) */}
                    <rect
                      x={xPos}
                      y={salesY}
                      width="16"
                      height={Math.max(salesHeight, 2)}
                      rx="4"
                      fill="#34d399"
                      className="transition-all duration-300 hover:fill-emerald-300 opacity-90 hover:opacity-100"
                    />
                    {/* Profit Column (Lighter Violet/Indigo) */}
                    <rect
                      x={xPos + 18}
                      y={profitY}
                      width="16"
                      height={Math.max(profitHeight, 2)}
                      rx="4"
                      fill="#818cf8"
                      className="transition-all duration-300 hover:fill-indigo-300 opacity-90 hover:opacity-100"
                    />

                    {/* X axis date label */}
                    <text
                      x={xPos + 17}
                      y="188"
                      textAnchor="middle"
                      fill="#94a3b8"
                      fontSize="9"
                      fontWeight="600"
                    >
                      {d.date}
                    </text>

                    {/* Hover values overlay boxes (rendered transparently or via title tags safely) */}
                    <title>{`${d.date}: Penjualan ${formatRupiah(d.sales)}, Laba ${formatRupiah(d.profit)}`}</title>
                  </g>
                );
              })}

              {/* Y Axis Reference limits tags */}
              <text x="35" y="24" textAnchor="end" fill="#64748b" fontSize="8" fontWeight="bold">
                {formatRupiah(maxVal)}
              </text>
              <text x="35" y="95" textAnchor="end" fill="#64748b" fontSize="8" fontWeight="bold">
                {formatRupiah(maxVal / 2)}
              </text>
              <text x="35" y="174" textAnchor="end" fill="#64748b" fontSize="8" fontWeight="bold">
                Rp 0
              </text>
            </svg>
          </div>
        </div>

        {/* Top Product performances panel (4 cols in desktop) */}
        <div className="lg:col-span-4 glass-panel rounded-2xl p-5 shadow-2xl space-y-4 h-full">
          <div>
            <h3 className="font-heading font-semibold text-sm text-white flex items-center gap-1.5">
              <Award className="w-4 h-4 text-indigo-400" />
              Menu Terlaris & Profitabel
            </h3>
            <p className="text-[11px] text-slate-400">Diurutkan berdasarkan kuantitas item terjual</p>
          </div>

          <div className="space-y-3.5">
            {topSellers.length === 0 ? (
              <div className="py-12 border border-dashed border-white/10 rounded-xl text-center text-slate-450 text-slate-400 text-xs">
                Belum ada data barang terjual. Lakukan transaksi kasir untuk mengalkulasi performa produk.
              </div>
            ) : (
              topSellers.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/5">
                  <div className="space-y-1">
                    <h4 className="font-bold text-xs text-white line-clamp-1">{item.name}</h4>
                    <span className="text-[9px] px-2 py-0.5 bg-emerald-500/10 text-emerald-300 rounded font-bold font-sans border border-emerald-550/10">
                      Terjual {item.qty} Unit
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="block text-[10px] text-slate-400">Total Profit</span>
                    <span className="font-mono text-xs font-bold text-slate-100 block">
                      +{formatRupiah(item.profit)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ADVISORY ADVICE SYSTEM PANEL */}
      <div className={`p-5 rounded-2xl border flex flex-col md:flex-row gap-4 items-start backdrop-blur-xl ${
        advice.type === 'success' ? 'bg-emerald-950/20 border-emerald-500/20 text-emerald-250 text-emerald-200' : 
        advice.type === 'warning' ? 'bg-amber-950/20 border-amber-500/20 text-amber-250 text-amber-200' :
        advice.type === 'premium' ? 'bg-indigo-950/20 border-indigo-500/20 text-indigo-250 text-indigo-200' :
        'bg-white/5 border-white/10 text-slate-200'
      }`}>
        <div className="mt-0.5 flex-shrink-0">
          <Sparkles className={`w-6 h-6 ${
            advice.type === 'success' ? 'text-emerald-400' :
            advice.type === 'warning' ? 'text-amber-400' :
            advice.type === 'premium' ? 'text-indigo-400' :
            'text-slate-400'
          }`} />
        </div>
        <div className="space-y-2">
          <h4 className="font-heading font-extrabold text-sm uppercase tracking-wider text-white">
            {advice.title}
          </h4>
          <p className="text-xs leading-relaxed opacity-90 font-medium">
            {advice.text}
          </p>
          
          {transactions.length === 0 && (
            <button
              id="btn-nav-pos"
              onClick={() => onNavigateToTab('kasir')}
              className="mt-1 text-xs font-bold inline-flex items-center gap-1 text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 px-3.5 py-1.5 rounded-lg border border-emerald-500/30 cursor-pointer transition-all shadow-xl"
            >
              Mulai Transaksi Pertama
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Simple decorative inline icon helper
function ArrowRight(props: any) {
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
      <path d="M5 12h14"></path>
      <path d="m12 5 7 7-7 7"></path>
    </svg>
  );
}
