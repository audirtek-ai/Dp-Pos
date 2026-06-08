/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Transaction, Product } from '../types';
import { formatRupiah, formatPercent } from '../utils';
import { 
  BarChart3, Calendar, Layers, DollarSign, ArrowUpRight, TrendingUp, 
  HelpCircle, ChevronRight, Eye, RefreshCw, ShoppingCart, Info, Percent, AlertCircle, PieChart, Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface FinanceReportProps {
  transactions: Transaction[];
  products: Product[];
}

type PeriodType = 'harian' | 'mingguan' | 'bulanan' | 'semua';

export default function FinanceReport({ transactions, products }: FinanceReportProps) {
  const [period, setPeriod] = useState<PeriodType>('semua');
  const [selectedProductDetails, setSelectedProductDetails] = useState<Product | null>(null);

  // Helper: Filter transactions based on date periods
  const filterTransactionsByPeriod = (txs: Transaction[], selectedPeriod: PeriodType) => {
    const now = new Date();
    // Normalize to start of today for strict comparisons
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    
    return txs.filter(tx => {
      const txTime = new Date(tx.timestamp).getTime();
      
      switch (selectedPeriod) {
        case 'harian':
          // Match today only
          return txTime >= todayStart;
        case 'mingguan':
          // Last 7 days
          const sevenDaysAgo = todayStart - 7 * 24 * 60 * 60 * 1000;
          return txTime >= sevenDaysAgo;
        case 'bulanan':
          // Last 30 days
          const thirtyDaysAgo = todayStart - 30 * 24 * 60 * 60 * 1000;
          return txTime >= thirtyDaysAgo;
        case 'semua':
        default:
          return true;
      }
    });
  };

  const filteredTxs = filterTransactionsByPeriod(transactions, period);

  // Core KPI Calculations
  const summarySales = filteredTxs.reduce((sum, tx) => sum + tx.totalSales, 0);
  const summaryHpp = filteredTxs.reduce((sum, tx) => sum + tx.totalHpp, 0);
  const summaryProfit = filteredTxs.reduce((sum, tx) => sum + tx.totalProfit, 0);
  const summaryMargin = summarySales > 0 ? (summaryProfit / summarySales) * 100 : 0;
  const summaryTxCount = filteredTxs.length;
  const avgTxValue = summaryTxCount > 0 ? summarySales / summaryTxCount : 0;

  // Group sales method counts
  const paymentMethodStats = filteredTxs.reduce((acc, tx) => {
    const method = tx.paymentMethod || 'Tunai';
    if (!acc[method]) {
      acc[method] = { count: 0, amount: 0 };
    }
    acc[method].count += 1;
    acc[method].amount += tx.totalSales;
    return acc;
  }, {} as { [method: string]: { count: number; amount: number } });

  // Product-wise cumulative metrics
  const productPerformanceMap: { 
    [id: string]: { 
      id: string;
      name: string; 
      category: string;
      quantitySold: number; 
      revenue: number; 
      hppContribution: number; 
      profit: number; 
    } 
  } = {};

  // Initialize with all products so we can see 0 sales too (Analysis purposes)
  products.forEach(p => {
    productPerformanceMap[p.id] = {
      id: p.id,
      name: p.name,
      category: p.category,
      quantitySold: 0,
      revenue: 0,
      hppContribution: 0,
      profit: 0
    };
  });

  // Calculate real performance on filtered transactions
  filteredTxs.forEach(tx => {
    tx.items.forEach(it => {
      if (!productPerformanceMap[it.productId]) {
        productPerformanceMap[it.productId] = {
          id: it.productId,
          name: it.productName,
          category: 'Kategori',
          quantitySold: 0,
          revenue: 0,
          hppContribution: 0,
          profit: 0
        };
      }
      const mapItem = productPerformanceMap[it.productId];
      mapItem.quantitySold += it.quantity;
      mapItem.revenue += it.totalPrice;
      mapItem.hppContribution += it.totalHpp;
      mapItem.profit += it.totalProfit;
    });
  });

  const productPerformancesList = Object.values(productPerformanceMap)
    .sort((a, b) => b.profit - a.profit); // Sort by highest absolute profit contributions

  // Construct chart trend data depending on timeframe
  const getTrendData = () => {
    const trendMap: { [key: string]: { label: string; rawDate: Date; sales: number; profit: number } } = {};

    if (period === 'harian') {
      // Group by hours for today
      // Initialize 8 slots for a neat hourly chart (08:00 to 22:00)
      for (let h = 8; h <= 22; h += 2) {
        const key = `${h.toString().padStart(2, '0')}:00`;
        trendMap[key] = { label: key, rawDate: new Date(), sales: 0, profit: 0 };
      }

      filteredTxs.forEach(tx => {
        const date = new Date(tx.timestamp);
        const hour = date.getHours();
        // Snap to nearest 2 hours index
        const snappedHour = Math.floor(hour / 2) * 2;
        if (snappedHour >= 8 && snappedHour <= 22) {
          const key = `${snappedHour.toString().padStart(2, '0')}:00`;
          if (trendMap[key]) {
            trendMap[key].sales += tx.totalSales;
            trendMap[key].profit += tx.totalProfit;
          }
        }
      });
    } else if (period === 'mingguan') {
      // Last 7 days individual
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dayLabel = d.toLocaleDateString('id-ID', { weekday: 'short' });
        const mapKey = d.toISOString().slice(0, 10);
        trendMap[mapKey] = { label: dayLabel, rawDate: d, sales: 0, profit: 0 };
      }

      filteredTxs.forEach(tx => {
        const dateStr = tx.timestamp.slice(0, 10);
        if (trendMap[dateStr]) {
          trendMap[dateStr].sales += tx.totalSales;
          trendMap[dateStr].profit += tx.totalProfit;
        }
      });
    } else if (period === 'bulanan') {
      // Group last 30 days into 5 blocks of 6 days
      for (let i = 4; i >= 0; i--) {
        const label = `Blok ${5-i}`;
        trendMap[i.toString()] = { label, rawDate: new Date(), sales: 0, profit: 0 };
      }

      const nowTime = new Date().getTime();
      filteredTxs.forEach(tx => {
        const txTime = new Date(tx.timestamp).getTime();
        const diffDays = Math.floor((nowTime - txTime) / (24 * 60 * 60 * 1000));
        const blockIdx = Math.min(Math.floor(diffDays / 6), 4);
        const key = (4 - blockIdx).toString(); // reverse so chronological
        if (trendMap[key]) {
          trendMap[key].sales += tx.totalSales;
          trendMap[key].profit += tx.totalProfit;
        }
      });

      // Refine labels based on actual date range of blocks
      for (let i = 0; i < 5; i++) {
        const startDay = (4 - i) * 6 + 6;
        const endDay = (4 - i) * 6 + 1;
        trendMap[i.toString()].label = `${endDay}-${startDay} hr lalu`;
      }
    } else {
      // "Semua waktu" - Group by date
      filteredTxs.forEach(tx => {
        const dateStr = new Date(tx.timestamp).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
        if (!trendMap[dateStr]) {
          trendMap[dateStr] = { label: dateStr, rawDate: new Date(tx.timestamp), sales: 0, profit: 0 };
        }
        trendMap[dateStr].sales += tx.totalSales;
        trendMap[dateStr].profit += tx.totalProfit;
      });
    }

    const result = Object.values(trendMap);
    if (period === 'semua') {
      // Sort chronologically
      result.sort((a, b) => a.rawDate.getTime() - b.rawDate.getTime());
    }
    return result;
  };

  const trendData = getTrendData();
  const maxTrendVal = Math.max(...trendData.map(d => d.sales), 10000);

  // Suggested Actions based on report conditions
  const getProductAdvice = (prodPerf: typeof productPerformancesList[0]) => {
    const parentProd = products.find(p => p.id === prodPerf.id);
    if (!parentProd) return null;

    if (prodPerf.quantitySold === 0) {
      return {
        text: `Menu ini nihil transaksi penjualannya selama periode terpilih. Pertimbangkan promo paketan dengan menu terlaris untuk menarik perhatian pembeli.`,
        urgency: 'low'
      };
    }

    if (parentProd.marginPercent < 30) {
      return {
        text: `Warning: Margin keuntungan sangat tipis (${parentProd.marginPercent.toFixed(1)}%). HPP per unit (${formatRupiah(parentProd.calculatedHppPerUnit)}) memakan ${ (parentProd.calculatedHppPerUnit / parentProd.sellingPrice * 100).toFixed(0)}% harga jual. Segera periksa susun ulang formula bahan.`,
        urgency: 'high'
      };
    }

    if (prodPerf.profit / summaryProfit > 0.4) {
      return {
        text: `Star Menu! Menu ini menyumbang lebih dari 40% total keuntungan bersih toko Anda. Jaga konsistensi rasa dan pastikan ketersediaan bahan baku utama agar tidak kehabisan stok.`,
        urgency: 'premium'
      };
    }

    return {
      text: `Profitabilitas dalam tingkat ideal (${parentProd.marginPercent.toFixed(1)}%). Jaga margin stabil dengan menekan sisa takaran yang terbuang (waste).`,
      urgency: 'stable'
    };
  };

  return (
    <div className="space-y-6">
      {/* HEADER CONTROLS CARD */}
      <div className="glass-panel p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 border border-white/10 shadow-xl">
        <div className="space-y-1">
          <h2 className="font-heading font-extrabold text-xl text-white flex items-center gap-2">
            <BarChart3 className="w-5.5 h-5.5 text-indigo-400" />
            Laporan Keuangan & Analisis HPP
          </h2>
          <p className="text-xs text-slate-400">
            Analisis terperinci performa omzet penjualan, biaya pokok (HPP), serta margin kontribusi bersih per resep produk.
          </p>
        </div>

        {/* Period Selector Tabs */}
        <div className="bg-white/5 border border-white/10 p-1 rounded-xl flex gap-1 self-start md:self-auto">
          {[
            { id: 'harian', label: 'Harian' },
            { id: 'mingguan', label: 'Mingguan 7 H' },
            { id: 'bulanan', label: 'Bulanan 30 H' },
            { id: 'semua', label: 'Semua Waktu' }
          ].map(p => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id as PeriodType)}
              className={`py-1.5 px-3 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                period === p.id 
                  ? 'bg-indigo-600 text-white shadow-md' 
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* CORE FINANCIAL KPIS SUMMARY */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI: Sales */}
        <div className="glass-panel p-5 rounded-2xl shadow-lg border border-white/5 space-y-3 relative overflow-hidden group">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Total Omzet Penjualan</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1 pt-1">
            <span className="font-mono text-xl font-bold text-white block leading-none">
              {formatRupiah(summarySales)}
            </span>
            <span className="text-[10px] text-slate-450 text-slate-400">
              {summaryTxCount} Nota Penjualan Tercatat
            </span>
          </div>
        </div>

        {/* KPI: HPP */}
        <div className="glass-panel p-5 rounded-2xl shadow-lg border border-white/5 space-y-3 relative overflow-hidden group">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Total Beban Pokok (HPP)</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1 pt-1">
            <span className="font-mono text-xl font-bold text-slate-100 block leading-none">
              {formatRupiah(summaryHpp)}
            </span>
            <span className="text-[10px] text-slate-405 text-slate-400">
              Bahan + Tenaga Kerja + Overhead
            </span>
          </div>
        </div>

        {/* KPI: Profit */}
        <div className="glass-panel p-5 rounded-2xl shadow-lg border border-white/5 space-y-3 relative overflow-hidden group">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Keuntungan Bersih</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-505/10 bg-indigo-500/20 text-indigo-305 text-indigo-300 flex items-center justify-center border border-indigo-500/30">
              <DollarSign className="w-4 h-4 animate-pulse" />
            </div>
          </div>
          <div className="space-y-1 pt-1">
            <span className="font-mono text-xl font-extrabold text-emerald-400 block leading-none">
              +{formatRupiah(summaryProfit)}
            </span>
            <span className="text-[10px] text-slate-400">
              Uang Masuk Bersih setelah HPP
            </span>
          </div>
        </div>

        {/* KPI: Profit Margin Ratio */}
        <div className="glass-panel p-5 rounded-2xl shadow-lg border border-white/5 space-y-3 relative overflow-hidden group">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Margin Profit Bersih</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-505/10 bg-white/10 text-white flex items-center justify-center border border-white/10">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1 pt-1">
            <span className={`font-mono text-xl font-bold block leading-none ${summaryMargin >= 35 ? 'text-emerald-400' : 'text-amber-400'}`}>
              {formatPercent(summaryMargin)}
            </span>
            <span className="text-[10px] text-slate-400">
              Rasio Efisiensi Keuntungan Bisnis
            </span>
          </div>
        </div>
      </div>

      {/* CHARTS GRAPH SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Dynamic Financial Trend (8 cols) */}
        <div className="lg:col-span-8 glass-panel rounded-2xl p-5 shadow-xl border border-white/5 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-4">
            <div className="space-y-0.5">
              <h3 className="font-heading font-semibold text-sm text-white">
                Trendline Akumulasi Keuangan ({period === 'harian' ? 'Jam-ke-Jam' : period === 'semua' ? 'Setiap Hari' : 'Bagan Tanggal'})
              </h3>
              <p className="text-[11px] text-slate-400">Histogram data perbandingan total porsi Omzet vs Keuntungan Bersih</p>
            </div>
            
            <div className="flex items-center gap-3 text-[10px] font-bold">
              <span className="flex items-center gap-1 text-slate-300">
                <span className="w-2.5 h-2.5 bg-emerald-400 rounded-sm inline-block"></span>
                Penjualan
              </span>
              <span className="flex items-center gap-1 text-slate-300">
                <span className="w-2.5 h-2.5 bg-indigo-400 rounded-sm inline-block"></span>
                Profit Bersih
              </span>
            </div>
          </div>

          {/* SVG Trend chart drawing */}
          <div className="relative h-60 pt-2">
            {trendData.length === 0 ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-xs text-slate-450 text-slate-400 border border-dashed border-white/5 rounded-xl">
                Tidak ada riwayat penjualan pada jangka waktu filter ini.
              </div>
            ) : (
              <svg viewBox="0 0 500 200" className="w-full h-full overflow-visible" xmlns="http://www.w3.org/2000/svg">
                {/* Horizontal reference frames */}
                <line x1="40" y1="20" x2="485" y2="20" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                <line x1="40" y1="70" x2="485" y2="70" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                <line x1="40" y1="120" x2="485" y2="120" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                <line x1="40" y1="170" x2="485" y2="170" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />

                {trendData.map((d, idx) => {
                  const w = 420 / trendData.length;
                  const colCenter = 45 + idx * w + (w - 20) / 2;
                  
                  // Compute scales
                  const sHeight = (d.sales / maxTrendVal) * 140;
                  const pHeight = (d.profit / maxTrendVal) * 140;

                  const sY = 170 - sHeight;
                  const pY = 170 - pHeight;

                  return (
                    <g key={idx} className="group cursor-pointer">
                      {/* Revenue outline card */}
                      <rect 
                        x={colCenter} 
                        y={sY} 
                        width="10" 
                        height={Math.max(sHeight, 2)} 
                        rx="3" 
                        fill="#34d399" 
                        className="opacity-80 group-hover:opacity-100 transition-all duration-300" 
                      />
                      {/* Profit outline card */}
                      <rect 
                        x={colCenter + 12} 
                        y={pY} 
                        width="10" 
                        height={Math.max(pHeight, 2)} 
                        rx="3" 
                        fill="#818cf8" 
                        className="opacity-80 group-hover:opacity-100 transition-all duration-300" 
                      />

                      {/* Label under Column */}
                      <text 
                        x={colCenter + 11} 
                        y="186" 
                        textAnchor="middle" 
                        fill="#94a3b8" 
                        fontSize="8" 
                        fontWeight="700"
                        className="group-hover:fill-white transition-colors"
                      >
                        {d.label}
                      </text>

                      {/* Browser tooltip title hint */}
                      <title>{`${d.label}: Penjualan ${formatRupiah(d.sales)}, Laba ${formatRupiah(d.profit)}`}</title>
                    </g>
                  );
                })}

                {/* Y Axis markings */}
                <text x="35" y="23" textAnchor="end" fill="#64748b" fontSize="8" fontWeight="bold">
                  {formatRupiah(maxTrendVal)}
                </text>
                <text x="35" y="95" textAnchor="end" fill="#64748b" fontSize="8" fontWeight="bold">
                  {formatRupiah(maxTrendVal / 2)}
                </text>
                <text x="35" y="174" textAnchor="end" fill="#64748b" fontSize="8" fontWeight="bold">
                  Rp 0
                </text>
              </svg>
            )}
          </div>
        </div>

        {/* Payment Channels and Ticket sizes (4 cols) */}
        <div className="lg:col-span-4 glass-panel rounded-2xl p-5 shadow-xl border border-white/5 flex flex-col justify-between">
          <div className="space-y-1">
            <h3 className="font-heading font-semibold text-sm text-white flex items-center gap-1.5">
              <PieChart className="w-4 h-4 text-indigo-400" />
              Sirkulasi Metode Bayar & Rerata Nota
            </h3>
            <p className="text-[11px] text-slate-400">Metrik transaksi & preferensi kanal pembayaran merchant.</p>
          </div>

          <div className="space-y-5 my-4">
            {/* Payment channel progression meters */}
            <div className="space-y-3.5">
              {['Tunai', 'QRIS', 'Transfer'].map((method) => {
                const stats = paymentMethodStats[method] || { count: 0, amount: 0 };
                const pct = summarySales > 0 ? (stats.amount / summarySales) * 100 : 0;
                
                return (
                  <div key={method} className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-300">{method}</span>
                      <div className="space-x-1.5">
                        <span className="text-[10px] text-slate-400 font-medium">({stats.count} nota)</span>
                        <strong className="font-mono text-white text-[11px]">{formatRupiah(stats.amount)}</strong>
                      </div>
                    </div>
                    {/* Visual meter bar */}
                    <div className="w-full bg-slate-900 border border-white/5 h-2 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${
                          method === 'Tunai' ? 'bg-indigo-500' :
                          method === 'QRIS' ? 'bg-emerald-400' :
                          'bg-cyan-400'
                        }`}
                        style={{ width: `${pct}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Average ticket size and total tx stats */}
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/5 text-xs">
              <div className="bg-white/[0.01] border border-white/5 p-2 rounded-xl">
                <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wide">Rerata Nota / Tiket</span>
                <strong className="font-mono text-slate-200 mt-0.5 block">{formatRupiah(avgTxValue)}</strong>
              </div>
              <div className="bg-white/[0.01] border border-white/5 p-2 rounded-xl">
                <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wide">Total Transaksi</span>
                <strong className="font-sans text-slate-200 mt-0.5 block font-bold">{summaryTxCount} Penjualan</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* DETAILED HPP ANALYSIS PER PRODUCT */}
      <div className="glass-panel rounded-2xl shadow-xl border border-white/5 overflow-hidden">
        {/* Section title header */}
        <div className="bg-white/[0.02] border-b border-white/5 px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <h3 className="font-heading font-semibold text-sm text-white flex items-center gap-1.5">
              <Layers className="w-4.5 h-4.5 text-indigo-400" />
              Tabel Analisis Struktur HPP & Margin Kontribusi
            </h3>
            <p className="text-[11px] text-slate-405 text-slate-400">
              Analisis sumbangsih omzet dan margin bersih per menu berdasarkan formulasi bahan baku yang terdaftar.
            </p>
          </div>
          
          <div className="text-[10px] bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-semibold px-3 py-1 rounded-full flex items-center gap-1">
            <Info className="w-3.5 h-3.5" />
            Ketuk nama produk atau baris untuk mendeteksi resep & takaran HPP.
          </div>
        </div>

        {/* Detailed reports grid table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-[#0f172a]/30 font-bold text-slate-400 uppercase tracking-wider text-[9px] border-b border-white/5">
              <tr>
                <th className="py-3 px-5">Detail Produk</th>
                <th className="py-3 px-4 text-right">Harga Jual</th>
                <th className="py-3 px-4 text-right">HPP Satuan</th>
                <th className="py-3 px-4 text-center">Margin Laba</th>
                <th className="py-3 px-4 text-center">Porsi Terjual</th>
                <th className="py-3 px-4 text-right">Kontribusi Omzet</th>
                <th className="py-3 px-4 text-right">Kontribusi Profit</th>
                <th className="py-3 px-5 text-center">Rekomendasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-medium">
              {productPerformancesList.map(perf => {
                const parentProd = products.find(p => p.id === perf.id);
                if (!parentProd) return null;

                const profitMargin = parentProd.marginPercent;
                const recommendation = getProductAdvice(perf);
                const isZeroSales = perf.quantitySold === 0;

                return (
                  <tr 
                    key={perf.id} 
                    onClick={() => setSelectedProductDetails(parentProd)}
                    className="hover:bg-white/[0.02] cursor-pointer transition-colors"
                  >
                    {/* Item title */}
                    <td className="py-3 px-5">
                      <div className="flex items-center gap-2.5">
                        <img 
                          src={parentProd.imageUrl} 
                          alt={perf.name} 
                          className="w-8 h-8 rounded-lg object-cover border border-white/10 flex-shrink-0 bg-slate-950"
                          referrerPolicy="no-referrer"
                        />
                        <div className="space-y-0.5">
                          <span className="font-extrabold text-white text-[12px] hover:text-indigo-400 transition-colors block">
                            {perf.name}
                          </span>
                          <span className="text-[10px] text-slate-450 text-slate-400 block">
                            {parentProd.category}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Selling price */}
                    <td className="py-3 px-4 text-right font-mono text-slate-200">
                      {formatRupiah(parentProd.sellingPrice)}
                    </td>

                    {/* Cost of goods sold (HPP per Unit) */}
                    <td className="py-3 px-4 text-right font-mono text-slate-200">
                      {formatRupiah(parentProd.calculatedHppPerUnit)}
                    </td>

                    {/* Profit margin */}
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded border ${
                        profitMargin >= 35 
                          ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/10' 
                          : 'bg-amber-500/15 text-amber-300 border-amber-500/10'
                      }`}>
                        {formatPercent(profitMargin)}
                      </span>
                    </td>

                    {/* Quantity sold */}
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-block font-sans text-xs font-bold ${isZeroSales ? 'text-slate-500' : 'text-slate-100'}`}>
                        {perf.quantitySold} Porsi
                      </span>
                    </td>

                    {/* Total Revenue contributed */}
                    <td className="py-3 px-4 text-right font-mono text-slate-200">
                      {isZeroSales ? 'Rp 0' : formatRupiah(perf.revenue)}
                    </td>

                    {/* Personal profit contributed */}
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">
                      {isZeroSales ? '+Rp 0' : `+${formatRupiah(perf.profit)}`}
                    </td>

                    {/* Advice recommendations */}
                    <td className="py-3 px-5 max-w-[200px]" onClick={e => e.stopPropagation()}>
                      {recommendation && (
                        <div className={`p-1.5 px-2 rounded-lg text-[9px] font-semibold leading-relaxed border ${
                          recommendation.urgency === 'high' ? 'bg-red-950/20 text-red-300 border-red-550/20' :
                          recommendation.urgency === 'premium' ? 'bg-indigo-950/20 text-indigo-300 border-indigo-550/20' :
                          recommendation.urgency === 'low' ? 'bg-slate-900 border-white/5 text-slate-400' :
                          'bg-emerald-950/10 text-emerald-300 border-emerald-500/10'
                        }`}>
                          {recommendation.text}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* RECIPE DETAILS MODAL/DRAWER OVERLAY */}
      <AnimatePresence>
        {selectedProductDetails && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-white/10 rounded-3xl shadow-2xl max-w-2xl w-full text-slate-200 overflow-hidden flex flex-col justify-between max-h-[90vh]"
            >
              {/* Modal Banner Header */}
              <div className="p-5 border-b border-white/5 bg-[#1e293b]/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img 
                    src={selectedProductDetails.imageUrl} 
                    alt={selectedProductDetails.name} 
                    className="w-12 h-12 rounded-xl object-cover border border-white/10 bg-slate-950"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <span className="text-[9px] uppercase font-semibold text-indigo-400 tracking-widest block">
                      Analisis Struktur Modal Resep
                    </span>
                    <h3 className="font-heading font-extrabold text-sm text-white leading-normal">
                      {selectedProductDetails.name}
                    </h3>
                  </div>
                </div>

                <button
                  id="close-report-modal"
                  onClick={() => setSelectedProductDetails(null)}
                  className="p-1 px-2.5 text-xs text-slate-405 font-bold text-slate-350 hover:text-white bg-white/5 hover:bg-white/10 transition-colors rounded-lg cursor-pointer"
                >
                  Tutup
                </button>
              </div>

              {/* Modal Contents Scrollable */}
              <div className="p-6 space-y-6 overflow-y-auto">
                
                {/* Cost ratio indicator meters */}
                <div className="space-y-3.5">
                  <h4 className="text-[10px] uppercase font-bold tracking-wider text-indigo-300">
                    Proporsi Komponen HPP ({formatRupiah(selectedProductDetails.totalHppPerBatch)} / Batch {selectedProductDetails.batchSize} Unit)
                  </h4>

                  {/* Meter stack percentages */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                    {/* Ingredients cost portion */}
                    <div className="bg-[#0f172a]/40 border border-white/5 p-3 rounded-2xl">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-slate-400">1. Bahan Baku</span>
                        <strong className="text-white font-mono">
                          {((selectedProductDetails.totalIngredientsCost / selectedProductDetails.totalHppPerBatch) * 105 - 5).toFixed(0)}%
                        </strong>
                      </div>
                      <span className="text-sm font-mono text-white font-bold block mt-1.5">
                        {formatRupiah(selectedProductDetails.totalIngredientsCost)}
                      </span>
                      <span className="text-[9px] text-slate-405 text-slate-450 block">Formula item mentah</span>
                    </div>

                    {/* Labor portions */}
                    <div className="bg-[#0f172a]/40 border border-white/5 p-3 rounded-2xl">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-slate-400">2. Jasa / Pembuatan</span>
                        <strong className="text-white font-mono">
                          {selectedProductDetails.totalHppPerBatch > 0 ? ((selectedProductDetails.laborCost / selectedProductDetails.totalHppPerBatch) * 100).toFixed(0) : 0}%
                        </strong>
                      </div>
                      <span className="text-sm font-mono text-white font-bold block mt-1.5">
                        {formatRupiah(selectedProductDetails.laborCost)}
                      </span>
                      <span className="text-[9px] text-slate-450 block">Tenaga kerja langsung</span>
                    </div>

                    {/* Miscellaneous overhead */}
                    <div className="bg-[#0f172a]/40 border border-white/5 p-3 rounded-2xl">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-slate-400">3. Biaya Overhead</span>
                        <strong className="text-white font-mono">
                          {selectedProductDetails.totalHppPerBatch > 0 ? ((selectedProductDetails.totalOverheadsCost / selectedProductDetails.totalHppPerBatch) * 105 - 5).toFixed(0) : 0}%
                        </strong>
                      </div>
                      <span className="text-sm font-mono text-white font-bold block mt-1.5">
                        {formatRupiah(selectedProductDetails.totalOverheadsCost)}
                      </span>
                      <span className="text-[9px] text-slate-450 block">Kemasan & operasional</span>
                    </div>
                  </div>
                </div>

                {/* Ingredients composition list table */}
                <div className="space-y-2">
                  <h4 className="text-[10px] uppercase font-bold tracking-wider text-indigo-300">
                    Daftar Takaran Bahan Formula ({selectedProductDetails.ingredients.length} Macam Bahan Baku)
                  </h4>
                  <div className="border border-white/5 rounded-2xl overflow-hidden text-xs">
                    <table className="w-full text-left">
                      <thead className="bg-white/5 text-[9px] font-bold uppercase text-slate-400 tracking-wide border-b border-white/5">
                        <tr>
                          <th className="py-2.5 px-4 text-slate-300">Nama Bahan</th>
                          <th className="py-2.5 px-3 text-center text-slate-300">Takaran yang Dibutuhkan</th>
                          <th className="py-2.5 px-3 text-right text-slate-300">Harga Satuan Porsi</th>
                          <th className="py-2.5 px-4 text-right text-slate-300">Total Biaya Porsi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 font-medium text-slate-200">
                        {selectedProductDetails.ingredients.map(item => (
                          <tr key={item.id} className="hover:bg-white/[0.01]">
                            <td className="py-2.5 px-4 font-bold text-white">{item.name}</td>
                            <td className="py-2.5 px-3 text-center">
                              <span className="font-mono bg-white/5 text-indigo-300 px-2 py-0.5 rounded border border-white/5">
                                {item.amountNeeded} {item.unit}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono text-slate-450 text-slate-400">{formatRupiah(item.unitPrice)}</td>
                            <td className="py-2.5 px-4 text-right font-mono font-bold text-white">{formatRupiah(item.totalCost)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Overheads composition list */}
                {selectedProductDetails.overheads.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-[10px] uppercase font-bold tracking-wider text-indigo-300">
                      Daftar Biaya Penunjang & Kemasan
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                      {selectedProductDetails.overheads.map(ov => (
                        <div key={ov.id} className="flex justify-between items-center p-2.5 bg-white/[0.01] border border-white/5 rounded-xl">
                          <span className="font-semibold text-slate-300">{ov.name}</span>
                          <strong className="font-mono text-white">{formatRupiah(ov.cost)}</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Pricing profit margin recap */}
                <div className="bg-indigo-500/10 border border-indigo-500/20 p-4 rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-4 text-xs font-semibold">
                  <div className="space-y-1 text-center sm:text-left">
                    <span className="block text-[9px] uppercase font-bold tracking-wide text-indigo-300">HPP vs Harga Jual</span>
                    <p className="text-slate-304 text-slate-300">
                      Setiap <strong className="text-white">1 unit {selectedProductDetails.name}</strong> yang terjual menyumbang margin laba sebesar <strong className="text-emerald-400 font-mono">{formatPercent(selectedProductDetails.marginPercent)}</strong>.
                    </p>
                  </div>
                  <div className="flex gap-4 font-mono font-bold leading-normal">
                    <div className="text-center">
                      <span className="text-[9px] font-sans font-bold uppercase text-slate-400 block tracking-wide">HPP Satuan</span>
                      <span className="text-white text-sm">{formatRupiah(selectedProductDetails.calculatedHppPerUnit)}</span>
                    </div>
                    <div className="text-center">
                      <span className="text-[9px] font-sans font-bold uppercase text-slate-400 block tracking-wide">Harga Jual</span>
                      <span className="text-indigo-305 text-indigo-300 text-sm">{formatRupiah(selectedProductDetails.sellingPrice)}</span>
                    </div>
                    <div className="text-center">
                      <span className="text-[9px] font-sans font-bold uppercase text-slate-400 block tracking-wide">Laba Bersih</span>
                      <span className="text-emerald-450 text-emerald-400 text-sm">+{formatRupiah(selectedProductDetails.profitAmount)}</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Modal actions */}
              <div className="p-4 border-t border-white/5 bg-[#0f172a]/20 text-right">
                <button
                  id="modal-close-recap"
                  onClick={() => setSelectedProductDetails(null)}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-550 border border-indigo-500/30 text-white font-bold text-xs rounded-xl cursor-pointer transition-all shadow-md"
                >
                  Selesai Membaca Laporan
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
