/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  X, Sparkles, Layers, ShoppingBag, Database, ArrowRight, ArrowLeft, Check, HelpCircle, AlertCircle, Receipt, ArrowUpRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface QuickStartModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToTab?: (tab: string) => void;
}

export default function QuickStartModal({ isOpen, onClose, onNavigateToTab }: QuickStartModalProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: "Selamat Datang di HPPOS! 👋",
      subtitle: "Mari pahami alur kerja pintar pencatatan kasir & HPP mikro dalam 1 menit.",
      icon: Sparkles,
      color: "from-indigo-400 to-purple-500",
      content: (
        <div className="space-y-4 text-left">
          <p className="text-xs text-slate-300 leading-relaxed font-sans">
            Aplikasi ini didesain khusus agar pengusaha makanan, katering, dan ritel bisa melacak keuntungan bersih terperinci. Sistem kami bekerja dengan menghubungkan <strong className="text-white">stok bahan baku</strong>, <strong className="text-white">resep masakan</strong>, dan <strong className="text-white">transaksi penjualan kasir</strong> secara otomatis.
          </p>
          
          <div className="grid grid-cols-1 gap-2.5 pt-1.5">
            <div className="p-3 rounded-xl bg-slate-950/40 border border-white/5 flex items-start gap-3">
              <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 shrink-0 border border-indigo-500/10 text-[10px] font-bold">1</div>
              <div>
                <span className="text-xs font-bold text-white block">Input Bahan Baku (Database)</span>
                <span className="text-[10.5px] text-slate-400 block leading-normal">Simpan daftar bahan mentah, harga beli, dan kuantitas unit terkecil.</span>
              </div>
            </div>
            
            <div className="p-3 rounded-xl bg-slate-950/40 border border-white/5 flex items-start gap-3">
              <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400 shrink-0 border border-purple-500/10 text-[10px] font-bold">2</div>
              <div>
                <span className="text-xs font-bold text-white block">Formulasi HPP (Kalkulator Resep)</span>
                <span className="text-[10.5px] text-slate-400 block leading-normal">Rancang menu Anda dengan mencampurkan bahan baku. Margin laba akan terhitung otomatis!</span>
              </div>
            </div>
            
            <div className="p-3 rounded-xl bg-slate-950/40 border border-white/5 flex items-start gap-3">
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 shrink-0 border border-emerald-500/10 text-[10px] font-bold">3</div>
              <div>
                <span className="text-xs font-bold text-white block">Catat Penjualan di Kasir (POS)</span>
                <span className="text-[10.5px] text-slate-400 block leading-normal">Lakukan transaksi. Stok bahan baku dalam resep akan langsung berkurang secara realtime!</span>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "1. Menginput Bahan Baku",
      subtitle: "Mulai dari membangun fondasi harga resep Anda.",
      icon: Database,
      color: "from-indigo-400 to-indigo-600",
      content: (
        <div className="space-y-4 text-left">
          <p className="text-xs text-slate-300 leading-relaxed font-sans">
            Semua bahan yang digunakan untuk memasak atau dikemas harus dimasukkan pada tab <strong className="text-white">Database Bahan</strong>. Contoh: Tepung Terigu, Susu, Gula Pasir, Bubuk Kopi, Kemasan Box.
          </p>

          <div className="p-3.5 bg-slate-950/50 rounded-xl border border-indigo-500/20 space-y-2">
            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> Tips Penting database:
            </span>
            <ul className="space-y-1.5 text-[11px] text-slate-300 list-disc list-inside leading-relaxed font-sans">
              <li>Lakukan input dengan <strong className="text-white">Satuan Terkecil</strong> yang dicakup (misal gram untuk tepung, ml untuk susu, butir untuk telur).</li>
              <li>Sistem akan membagi harga beli per karung/pack menjadi <strong className="text-indigo-300">biaya per unit satuan dasar</strong> itu.</li>
              <li>Atur <strong className="text-white">Stok Minimum</strong> agar sistem memberi peringatan ketika bahan baku kritis hampir habis dan harus segera belanja!</li>
            </ul>
          </div>

          <div className="flex justify-center pt-1">
            <button
              id="qs-btn-nav-ingredients"
              type="button"
              onClick={() => {
                if (onNavigateToTab) onNavigateToTab('bahan');
                onClose();
              }}
              className="py-2 px-4 bg-indigo-650 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-[11px] rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-indigo-600/15"
            >
              <span>Buka Database Bahan</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )
    },
    {
      title: "2. Menghitung HPP & Desain Menu",
      subtitle: "Bebas menebak-nebak harga, mulailah berhitung secara ilmiah.",
      icon: Layers,
      color: "from-purple-400 to-purple-600",
      content: (
        <div className="space-y-4 text-left">
          <p className="text-xs text-slate-300 leading-relaxed font-sans">
            Setelah menginput bahan dasar, Anda siap merumuskan resep di bagian <strong className="text-white">Formulasi HPP</strong>. Di sini, Anda menyusun menu dari bahan-bahan yang telah disimpan untuk dihitung beban HPP-nya.
          </p>

          <div className="grid grid-cols-2 gap-3 pb-1">
            <div className="p-3 bg-slate-950/40 rounded-xl border border-white/5 space-y-1 text-center">
              <span className="text-[9px] text-slate-400 tracking-wider font-bold uppercase">Formulasi Resep</span>
              <p className="text-[10.5px] text-slate-300 leading-normal font-sans">Pilih bahan baku & tentukan takaran porsi (batch). Modal HPP porsi didapat instan.</p>
            </div>
            
            <div className="p-3 bg-slate-950/40 rounded-xl border border-white/5 space-y-1 text-center">
              <span className="text-[9px] text-indigo-400 tracking-wider font-bold uppercase">Analisis Margin</span>
              <p className="text-[10.5px] text-slate-300 leading-normal font-sans">Masukkan harga jual yang diincar. Sistem menampilkan persentase margin laba bersih.</p>
            </div>
          </div>

          <div className="p-3.5 bg-slate-950/50 rounded-xl border border-purple-500/20 space-y-2">
            <span className="text-[10px] font-bold text-purple-450 text-purple-400 uppercase tracking-widest flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" /> Formula Profit:
            </span>
            <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
              Usahakan margin laba kotor Anda berkisar pada <span className="text-emerald-400 font-bold">&gt;40%</span> untuk menutupi biaya operasional sewa, listrik, dan gaji karyawan. Jika terlalu tipis, sesuaikan harga jual atau takaran resep.
            </p>
          </div>

          <div className="flex justify-center pt-1">
            <button
              id="qs-btn-nav-cal"
              type="button"
              onClick={() => {
                if (onNavigateToTab) onNavigateToTab('kalkulasi');
                onClose();
              }}
              className="py-2 px-4 bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-[11px] rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-purple-600/15"
            >
              <span>Buka Formulasi HPP</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )
    },
    {
      title: "3. Kasir & Auto-potong Stok",
      subtitle: "Catat setiap transaksi penjualan tanpa ribet mengupdate kartu stok manual.",
      icon: ShoppingBag,
      color: "from-emerald-400 to-emerald-600",
      content: (
        <div className="space-y-4 text-left">
          <p className="text-xs text-slate-300 leading-relaxed font-sans">
            Menu pesanan yang sudah diformulasikan siap dijual lewat layar <strong className="text-white">Kasir POS</strong>. Cukup klik menu yang diinginkan, isi nominal bayar uang tunai, dan selesaikan transaksi!
          </p>

          <div className="p-3.5 bg-slate-950/50 rounded-xl border border-emerald-500/20 space-y-2">
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-1">
              <Receipt className="w-3.5 h-3.5" /> Cetak & Personalisasi Invoice:
            </span>
            <ul className="space-y-1.5 text-[11px] text-slate-300 list-disc list-inside leading-relaxed font-sans">
              <li>Nota kasir otomatis dapat diunduh, dicetak, ataupun dikiirm ke <strong className="text-white">Printer Thermal Bluetooth/USB 58mm</strong>.</li>
              <li>Ada <strong className="text-emerald-300">5 Pilihan Desain Nota</strong> (Classic, Retro Tiket, Elegant Serif, Cyber Terminal, Eco-Sprout) yang bisa Anda ganti kapan saja di menu Profil Toko!</li>
              <li>Anda bahkan bisa memotret <strong className="text-emerald-300">Logo kustom toko</strong> menggunakan kamera perangkat Anda untuk disematkan di kop nota!</li>
            </ul>
          </div>

          <div className="flex justify-center pt-1">
            <button
              id="qs-btn-nav-pos"
              type="button"
              onClick={() => {
                if (onNavigateToTab) onNavigateToTab('kasir');
                onClose();
              }}
              className="py-2 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[11px] rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-emerald-600/15"
            >
              <span>Buka Kasir POS</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  if (!isOpen) return null;

  const StepIcon = steps[currentStep].icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      {/* Container */}
      <motion.div 
        id="quickstart-modal-card"
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="w-full max-w-lg bg-slate-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
      >
        {/* Neon Gradient Header line */}
        <div className={`h-1.5 w-full bg-gradient-to-r ${steps[currentStep].color} transition-all duration-500`}></div>

        {/* Modal Top Nav Bar */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-white/5 shrink-0 bg-slate-900/60 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg bg-gradient-to-br ${steps[currentStep].color} text-slate-950 flex items-center justify-center`}>
              <HelpCircle className="w-4 h-4 text-white" />
            </div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">
              Panduan Cepat Kasir {currentStep > 0 ? `(${currentStep}/${steps.length - 1})` : ""}
            </span>
          </div>

          <button
            id="qs-close-btn"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/5 text-slate-400 hover:text-white transition-all cursor-pointer"
            aria-label="Tutup panduan"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          
          {/* Progress bullets */}
          <div className="flex items-center justify-center gap-1.5">
            {steps.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentStep(idx)}
                className={`h-1 rounded-full transition-all duration-300 ${
                  currentStep === idx 
                    ? `w-8 bg-gradient-to-r ${steps[idx].color}` 
                    : 'w-2 bg-white/10 hover:bg-white/20'
                }`}
                aria-label={`Ke porsi ${idx + 1}`}
              />
            ))}
          </div>

          {/* Heading Module */}
          <div className="text-center space-y-1 pt-2">
            <div className="inline-flex p-3 rounded-2xl bg-white/5 border border-white/10 mb-2">
              <StepIcon className="w-7 h-7 text-indigo-400" />
            </div>
            <h3 className="font-heading font-black text-lg text-white leading-tight">
              {steps[currentStep].title}
            </h3>
            <p className="text-[11px] text-slate-400 max-w-sm mx-auto leading-normal">
              {steps[currentStep].subtitle}
            </p>
          </div>

          {/* Core Content View */}
          <div className="pt-2">
            {steps[currentStep].content}
          </div>

        </div>

        {/* Modal Bottom Sticky Nav row */}
        <div className="p-4 bg-slate-950/40 border-t border-white/5 flex items-center justify-between gap-3 shrink-0">
          
          {/* Back button */}
          <button
            id="qs-back-btn"
            type="button"
            onClick={handleBack}
            className={`py-2 px-3.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[11px] font-bold text-slate-300 flex items-center gap-1 cursor-pointer transition-all ${
              currentStep === 0 ? 'opacity-0 pointer-events-none' : 'opacity-100'
            }`}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Kembali
          </button>

          {/* Counter text or Lewati button */}
          <button
            id="qs-skip-btn"
            type="button"
            onClick={onClose}
            className="text-[10px] font-extrabold text-slate-450 hover:text-slate-200 cursor-pointer transition-all"
          >
            {currentStep === steps.length - 1 ? "Tutup" : "Lewati Panduan"}
          </button>

          {/* Next / Finish button */}
          <button
            id="qs-next-btn"
            type="button"
            onClick={handleNext}
            className={`py-2 px-4 rounded-xl text-[11px] font-extrabold text-slate-950 flex items-center gap-1 bg-white hover:bg-slate-150 hover:bg-slate-200 cursor-pointer shadow-lg transition-all`}
          >
            {currentStep === steps.length - 1 ? (
              <>
                Selesai
                <Check className="w-3.5 h-3.5" />
              </>
            ) : (
              <>
                Lanjut
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>

        </div>
      </motion.div>
    </div>
  );
}
