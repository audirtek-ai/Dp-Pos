/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Transaction } from '../types';
import { formatRupiah, formatDate, formatPercent } from '../utils';
import { 
  FileText, Search, Trash2, Calendar, ClipboardList, TrendingUp, HelpCircle, ChevronDown, ChevronUp, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface TransactionHistoryProps {
  transactions: Transaction[];
  onClearTransactions: () => void;
  onDeleteTransaction: (id: string) => void;
}

export default function TransactionHistory({ transactions, onClearTransactions, onDeleteTransaction }: TransactionHistoryProps) {
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = transactions.filter(t => 
    t.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
    t.paymentMethod.toLowerCase().includes(search.toLowerCase())
  );

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleClearAll = () => {
    if (confirm('Apakah Anda yakin ingin menghapus seluruh riwayat penjualan? Tindakan ini bersifat permanen dan tidak dapat dibatalkan.')) {
      onClearTransactions();
    }
  };

  const handleDeleteOne = (id: string, invoice: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus transaksi ${invoice}? Data HPP dan keuntungan terkait akan dihapus dari dasbor.`)) {
      onDeleteTransaction(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search and Action bars */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-center bg-white p-4 rounded-xl border border-slate-100">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            id="tx-search"
            type="text"
            placeholder="Cari Invoice atau metode..."
            className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-hidden"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {transactions.length > 0 && (
          <button
            id="btn-clear-all"
            onClick={handleClearAll}
            className="text-xs text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100/60 font-semibold px-4 py-2 rounded-xl transition-all cursor-pointer inline-flex items-center gap-1.5"
          >
            <Trash2 className="w-4 h-4" />
            Hapus Riwayat Penjualan
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-xs border border-slate-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-heading font-semibold text-base text-slate-800 flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-slate-400" />
            Buku Jurnal Penjualan ({filtered.length})
          </h2>
          <span className="text-xs bg-slate-100 text-slate-700 font-semibold px-2.5 py-1 rounded-full">
            Tahun Buku: {new Date().getFullYear()}
          </span>
        </div>

        {filtered.length === 0 ? (
          <div className="py-20 text-center text-slate-400 space-y-3 flex flex-col items-center">
            <div className="w-12 h-12 bg-slate-50 text-slate-400 flex items-center justify-center rounded-full">
              <FileText className="w-6 h-6" />
            </div>
            <p className="text-sm">Tidak ada catatan transaksi penjualan ditemukan.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {/* Header row for pseudo table in desktop */}
            <div className="hidden md:grid grid-cols-12 gap-2 bg-slate-50/70 p-4 font-semibold text-xs text-slate-500 uppercase tracking-wider text-left border-b border-slate-100">
              <div className="col-span-2">No. Invoice</div>
              <div className="col-span-3">Tanggal & Waktu</div>
              <div className="col-span-1">Metode</div>
              <div className="col-span-2 text-right">Total Transaksi</div>
              <div className="col-span-1 text-center">HPP Cost</div>
              <div className="col-span-2 text-right text-emerald-700">Laba Bersih</div>
              <div className="col-span-1 text-center">Tindakan</div>
            </div>

            {filtered.map(tx => {
              const profitMargin = tx.totalSales > 0 ? (tx.totalProfit / tx.totalSales) * 100 : 0;
              const isExpanded = expandedId === tx.id;
              
              return (
                <div key={tx.id} className="transition-all hover:bg-slate-50/30">
                  {/* Row click body */}
                  <div 
                    onClick={() => toggleExpand(tx.id)}
                    className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center p-4 text-xs font-medium text-slate-700 cursor-pointer select-none"
                  >
                    {/* Invoice block */}
                    <div className="col-span-2 font-bold text-slate-900 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-slate-400 md:hidden" />
                      {tx.invoiceNumber}
                    </div>

                    {/* Timestamp block */}
                    <div className="col-span-3 text-slate-400 flex items-center gap-1.5 md:gap-0 font-sans">
                      <Calendar className="w-3.5 h-3.5 text-slate-300 md:hidden" />
                      {formatDate(tx.timestamp)}
                    </div>

                    {/* Method block */}
                    <div className="col-span-1 text-slate-500">
                      <span className="inline-block px-2 py-0.5 bg-slate-100 rounded text-[10px] font-bold uppercase text-slate-700">
                        {tx.paymentMethod}
                      </span>
                    </div>

                    {/* Sales totals block */}
                    <div className="col-span-2 text-left md:text-right font-mono font-bold text-slate-900">
                      <span className="md:hidden text-[10px] text-slate-400 font-sans block mt-1 uppercase">Total Penjualan:</span>
                      {formatRupiah(tx.totalSales)}
                    </div>

                    {/* HPP cost indicators */}
                    <div className="col-span-1 text-left md:text-center font-mono text-slate-400">
                      <span className="md:hidden text-[10px] text-slate-400 font-sans block mt-1 uppercase">HPP Modal:</span>
                      {formatRupiah(tx.totalHpp)}
                    </div>

                    {/* Net margin blocks */}
                    <div className="col-span-2 text-left md:text-right font-mono text-emerald-600 font-bold">
                      <span className="md:hidden text-[10px] text-slate-400 font-sans block mt-1 uppercase">Keuntungan Bersih:</span>
                      +{formatRupiah(tx.totalProfit)}
                      <span className="block text-[9px] text-slate-400 font-sans font-normal mt-0.5">
                        Margin: {formatPercent(profitMargin)}
                      </span>
                    </div>

                    {/* Actions button */}
                    <div className="col-span-1 flex items-center justify-end m-auto gap-2 text-right w-full md:w-auto">
                      <button
                        id={`del-tx-${tx.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteOne(tx.id, tx.invoiceNumber);
                        }}
                        className="p-1 px-2 hover:bg-red-50 text-slate-300 hover:text-red-500 rounded-lg cursor-pointer transition-all"
                        title="Hapus Transaksi"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      
                      <button onClick={(e) => { e.stopPropagation(); toggleExpand(tx.id); }} className="text-slate-400">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded receipt lists details */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden bg-slate-50/50 border-t border-b border-slate-100"
                      >
                        <div className="p-4 px-6 space-y-3">
                          <h4 className="text-[11px] uppercase font-bold tracking-wider text-slate-500">
                            Rincian Item Pembelian:
                          </h4>
                          <div className="bg-white rounded-xl border border-slate-100 divide-y divide-slate-100 text-xs">
                            {tx.items.map((it, idx) => (
                              <div key={idx} className="p-3 flex justify-between items-center">
                                <div className="space-y-0.5">
                                  <div className="font-bold text-slate-800">{it.productName}</div>
                                  <div className="text-slate-400 text-[11px]">
                                    {formatRupiah(it.sellingPrice)} x {it.quantity}
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 text-right">
                                  <div>
                                    <span className="block text-[9px] text-slate-400 uppercase">HPP Modal</span>
                                    <span className="font-mono font-medium text-slate-500">{formatRupiah(it.totalHpp)}</span>
                                  </div>
                                  <div>
                                    <span className="block text-[9px] text-emerald-800 uppercase font-semibold">Laba Kotor</span>
                                    <span className="font-mono font-bold text-emerald-600 font-semibold">{formatRupiah(it.totalProfit)}</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Extra info panel */}
                          <div className="flex justify-between items-center text-[11px] text-slate-450 text-slate-400 px-1 pt-1">
                            <span className="flex items-center gap-1">
                              <AlertCircle className="w-3.5 h-3.5 text-slate-300" />
                              HPP modal berdasarkan recipe log pada waktu transaksi dibuat.
                            </span>
                            <span>
                              Kasir: <strong>Merchant Kasir Otomatis</strong>
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
