/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { StoreProfile } from '../types';
import { Store, MapPin, Phone, MessageSquare, Save, Sparkles, CheckCircle, Receipt, Printer, Bluetooth, Usb, AlertTriangle, Camera, Upload, Trash2, X, RefreshCw } from 'lucide-react';
import { motion } from 'motion/react';
import ReceiptThemeView from './ReceiptThemeView';
import { 
  connectBluetoothDevice, 
  connectUsbDevice, 
  generateTestReceipt, 
  sendToActivePrinter, 
  PrinterDeviceState 
} from '../utils/thermalPrinter';

interface StoreProfileManagerProps {
  profile: StoreProfile;
  onSaveProfile: (profile: StoreProfile) => void;
}

export default function StoreProfileManager({ profile, onSaveProfile }: StoreProfileManagerProps) {
  const [storeName, setStoreName] = useState(profile.storeName || 'TOKO SAYA');
  const [address, setAddress] = useState(profile.address || 'Jl. Berdikari Kaya No. 10, Jakarta');
  const [phone, setPhone] = useState(profile.phone || '0812-3456-7890');
  const [receiptFooter, setReceiptFooter] = useState(profile.receiptFooter || 'Terima Kasih Atas Kunjungan Anda!');
  const [receiptTheme, setReceiptTheme] = useState(profile.receiptTheme || 'classic');
  const [logoUrl, setLogoUrl] = useState(profile.logoUrl || '');
  
  // Camera capture states & refs
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [successMsg, setSuccessMsg] = useState(false);

  // Thermal Printer States
  const [printer, setPrinter] = useState<PrinterDeviceState>({
    type: null,
    name: 'Printer Belum Tersambung',
    connected: false
  });
  const [printStatusMsg, setPrintStatusMsg] = useState('');
  const [isPrintingTest, setIsPrintingTest] = useState(false);

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startCamera = async () => {
    setIsCameraActive(true);
    setCameraError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 400 }, height: { ideal: 400 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(console.error);
      }
    } catch (err: any) {
      console.error('Error starting camera:', err);
      setCameraError('Akses kamera ditolak atau tidak ada kamera terdeteksi pada perangkat ini.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = 180;
      canvas.height = 180;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Draw matched orientation
        ctx.translate(180, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(videoRef.current, 0, 0, 180, 180);
        const dataUrl = canvas.toDataURL('image/png');
        setLogoUrl(dataUrl);
        stopCamera();
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveProfile({
      storeName: storeName.trim(),
      address: address.trim(),
      phone: phone.trim(),
      receiptFooter: receiptFooter.trim(),
      receiptTheme: receiptTheme,
      logoUrl: logoUrl
    });
    setSuccessMsg(true);
    setTimeout(() => setSuccessMsg(false), 3000);
  };

  const handleConnectBluetooth = async () => {
    setPrintStatusMsg('Memulai pemindaian Bluetooth...');
    const result = await connectBluetoothDevice();
    setPrinter(result);
    if (result.connected) {
      setPrintStatusMsg(`Berhasil terhubung ke: ${result.name}`);
    } else {
      setPrintStatusMsg(`Gagal: ${result.error || 'Perangkat tidak ditemukan atau ditolak'}`);
    }
  };

  const handleConnectUsb = async () => {
    setPrintStatusMsg('Mendeteksi port USB printer...');
    const result = await connectUsbDevice();
    setPrinter(result);
    if (result.connected) {
      setPrintStatusMsg(`Berhasil terhubung USB: ${result.name}`);
    } else {
      setPrintStatusMsg(`Gagal USB: ${result.error || 'Kabel terputus atau tidak terdeteksi'}`);
    }
  };

  const handleTestPrint = async () => {
    if (!printer.connected) {
      setPrintStatusMsg('Peringatan: Sambungkan printer Bluetooth/USB terlebih dahulu!');
      return;
    }
    
    setIsPrintingTest(true);
    try {
      const testBytes = generateTestReceipt({
        storeName: storeName.trim(),
        address: address.trim(),
        phone: phone.trim(),
        receiptFooter: receiptFooter.trim()
      });
      const ok = await sendToActivePrinter(testBytes);
      if (ok) {
        setPrintStatusMsg('Sinyal cetak terkirim! Silakan periksa kertas printer.');
      } else {
        setPrintStatusMsg('Gagal mengirim data. Nyalakan ulang Bluetooth atau lepas kabel USB.');
      }
    } catch (err: any) {
      setPrintStatusMsg(`Error Cetak: ${err.message || 'masalah transmisi data'}`);
    } finally {
      setIsPrintingTest(false);
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 glass-panel p-5 rounded-2xl border border-white/10 shadow-xl">
        <div>
          <h2 className="font-heading font-extrabold text-xl text-slate-100 flex items-center gap-2.5">
            <Store className="w-6 h-6 text-indigo-400" />
            Pengaturan Profil Toko & Nota
          </h2>
          <p className="text-xs text-slate-400 mt-1">Sesuaikan informasi identifikasi merchant dan layout cetakan struk kasir Anda.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Form setup panel (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <form onSubmit={handleSubmit} className="glass-panel rounded-2xl border border-white/10 p-6 space-y-5 shadow-2xl">
            <h3 className="font-heading font-bold text-sm text-slate-200 border-b border-white/5 pb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              Identitas Bisnis & Nota
            </h3>

            {successMsg && (
              <motion.div 
                initial={{ scale: 0.98, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="p-3 bg-emerald-950/20 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs flex items-center gap-2 font-semibold"
              >
                <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 animate-pulse" />
                Profil toko dan pengaturan invoice berhasil disimpan serta disinkronkan ke seluruh sistem!
              </motion.div>
            )}

            <div className="space-y-4">
              {/* Logo Kustom Toko */}
              <div className="space-y-2 pb-2 border-b border-white/5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-indigo-400" />
                  Logo Kustom Toko (Tampil di Struk)
                </label>
                <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-slate-950/40 rounded-2xl border border-white/5">
                  <div className="relative w-16 h-16 rounded-full border-2 border-dashed border-white/10 hover:border-indigo-500/30 flex items-center justify-center overflow-hidden bg-slate-950 shrink-0 transition-all">
                    {logoUrl ? (
                      <img src={logoUrl} alt="Pratinjau Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <Store className="w-6 h-6 text-slate-500" />
                    )}
                  </div>

                  <div className="flex-1 text-center sm:text-left space-y-2">
                    <p className="text-[10px] text-slate-400 leading-normal">
                      Personalisasi invoice dengan foto logo Anda. Ambil foto secara instan melalui webcam/kamera ataupun unggah file gambar biasa.
                    </p>
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 theme-indigo">
                      <button
                        type="button"
                        onClick={startCamera}
                        className="py-1.5 px-3 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-300 border border-indigo-500/20 rounded-lg text-[10px] font-extrabold flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        Ambil via Kamera
                      </button>

                      <label className="py-1.5 px-3 bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 rounded-lg text-[10px] font-extrabold flex items-center gap-1.5 transition-all cursor-pointer">
                        <Upload className="w-3.5 h-3.5" />
                        Unggah Gambar
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleFileUpload}
                        />
                      </label>

                      {logoUrl && (
                        <button
                          type="button"
                          onClick={() => setLogoUrl('')}
                          className="py-1.5 px-3 bg-rose-600/10 hover:bg-rose-600/20 text-rose-300 border border-rose-500/20 rounded-lg text-[10px] font-extrabold flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Hapus Logo
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Viewfinder Kamera Aktif */}
                {isCameraActive && (
                  <div className="p-4 bg-slate-950 rounded-xl border border-indigo-500/30 flex flex-col items-center gap-3">
                    <span className="text-[10px] font-bold text-indigo-400 animate-pulse flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                      KAMERA AKTIF (Selfie/Webcam)
                    </span>
                    
                    <div className="relative w-[180px] h-[180px] rounded-lg overflow-hidden border-2 border-indigo-500/50 bg-black">
                      <video
                        ref={videoRef}
                        className="w-full h-full object-cover scale-x-[-1]"
                        playsInline
                        muted
                      />
                    </div>

                    {cameraError && (
                      <p className="text-[10px] text-rose-450 max-w-xs text-center leading-normal">
                        ⚠️ {cameraError}
                      </p>
                    )}

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={capturePhoto}
                        className="py-1.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[10px] rounded-lg transition-all cursor-pointer flex items-center gap-1"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        Ambil Foto
                      </button>
                      <button
                        type="button"
                        onClick={stopCamera}
                        className="py-1.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-extrabold text-[10px] rounded-lg transition-all cursor-pointer flex items-center gap-1"
                      >
                        <X className="w-3.5 h-3.5" />
                        Batal
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Store Name input */}
              <div className="space-y-1.5">
                <label htmlFor="p-name" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nama Toko / Usaha <span className="text-rose-450">*</span></label>
                <div className="relative">
                  <Store className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-4.5 h-4.5" />
                  <input
                    id="p-name"
                    type="text"
                    required
                    placeholder="Contoh: Bakery Barokah Jaya"
                    className="w-full bg-slate-950/40 border border-white/10 text-white rounded-xl pl-10 pr-4 py-2.5 text-sm font-semibold focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-500"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                  />
                </div>
              </div>

              {/* Address input */}
              <div className="space-y-1.5">
                <label htmlFor="p-address" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Alamat Lengkap</label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-3.5 text-slate-500 w-4.5 h-4.5" />
                  <textarea
                    id="p-address"
                    rows={2}
                    placeholder="Contoh: Jl. Berdikari No. 45, Kecamatan Sukasari, Bandung"
                    className="w-full bg-slate-950/40 border border-white/10 text-white rounded-xl pl-10 pr-4 py-2.5 text-sm font-semibold focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-sans placeholder:text-slate-500"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>
              </div>

              {/* Phone/WA input */}
              <div className="space-y-1.5">
                <label htmlFor="p-phone" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">No. Telepon / WhatsApp</label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-4.5 h-4.5" />
                  <input
                    id="p-phone"
                    type="text"
                    placeholder="Contoh: 081234567890"
                    className="w-full bg-slate-950/40 border border-white/10 text-white rounded-xl pl-10 pr-4 py-2.5 text-sm font-semibold focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono placeholder:text-slate-500"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </div>

              {/* Receipt Footer Message */}
              <div className="space-y-1.5">
                <label htmlFor="p-footer" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Catatan Kaki Struk (Footer)</label>
                <div className="relative">
                  <MessageSquare className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-4.5 h-4.5" />
                  <input
                    id="p-footer"
                    type="text"
                    placeholder="Contoh: Barang yang sudah dibeli tidak dapat ditukar."
                    className="w-full bg-slate-950/40 border border-white/10 text-white rounded-xl pl-10 pr-4 py-2.5 text-sm font-semibold focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-500"
                    value={receiptFooter}
                    onChange={(e) => setReceiptFooter(e.target.value)}
                  />
                </div>
              </div>

              {/* Tema / Gaya Nota Struk (5 Pilihan Tampilan) */}
              <div className="space-y-2 pt-4 border-t border-white/5">
                <label className="block text-[10px] font-bold text-slate-400 tracking-wider uppercase flex items-center gap-1.5">
                  <Receipt className="w-4 h-4 text-indigo-400" />
                  Gaya Nota & Tema Invoice Toko (5 Pilihan)
                </label>
                <p className="text-[11px] text-slate-400 italic">Klik salah satu tema di bawah untuk langsung mencoba pratinjau instan di sebelah kanan:</p>
                
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-2">
                  {[
                    { id: 'classic', name: 'Classic', desc: 'Minimalis', icon: '📝' },
                    { id: 'retro', name: 'Retro', desc: 'Tiket Bintang', icon: '⭐' },
                    { id: 'elegant', name: 'Elegant', desc: 'Serif Mewah', icon: '⚜️' },
                    { id: 'cyber', name: 'Cyber', desc: 'Terminal POS', icon: '🤖' },
                    { id: 'eco', name: 'Eco-Sprout', desc: 'Bumi Alami', icon: '🌱' },
                  ].map((themeOpt) => {
                    const active = receiptTheme === themeOpt.id;
                    return (
                      <button
                        key={themeOpt.id}
                        type="button"
                        onClick={() => setReceiptTheme(themeOpt.id)}
                        className={`p-2.5 rounded-xl border flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
                          active 
                            ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-lg shadow-indigo-650/10 scale-[1.03]' 
                            : 'bg-slate-950/30 border-white/5 hover:border-white/15 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <span className="text-lg mb-1 leading-none">{themeOpt.icon}</span>
                        <span className="text-[11px] font-extrabold leading-none block">{themeOpt.name}</span>
                        <span className="text-[8px] mt-1 opacity-75 leading-none">{themeOpt.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-white/5 flex justify-end">
              <button
                id="save-profile-btn"
                type="submit"
                className="py-2.5 px-6 bg-indigo-600 hover:bg-indigo-700 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl transition-all shadow-lg shadow-indigo-600/25 flex items-center gap-2 cursor-pointer border border-indigo-400/20 uppercase tracking-wider"
              >
                <Save className="w-4 h-4" />
                Simpan Identitas Struk
              </button>
            </div>
          </form>

          {/* Thermal Printer Hardware Sync block */}
          <div className="glass-panel bg-slate-900/25 rounded-2xl border border-white/10 p-6 space-y-4 shadow-2xl">
            <h3 className="font-heading font-bold text-sm text-slate-200 border-b border-white/5 pb-3 flex items-center gap-2">
              <Printer className="w-4.5 h-4.5 text-indigo-400 animate-pulse" />
              Koneksi Printer Thermal POS (Bluetooth / KABEL USB)
            </h3>

            <p className="text-xs text-slate-400 leading-relaxed">
              Sambungkan aplikasi kasir HPPOS secara langsung ke printer kasir thermal ukuran kertas 58mm / 80mm menggunakan konektivitas nirkabel Bluetooth maupun kabel data USB untuk pencetakan struk instan.
            </p>

            {/* Connection status display */}
            <div className={`p-4 rounded-xl border flex items-center justify-between gap-3 ${printer.connected ? 'bg-emerald-950/20 border-emerald-500/20 text-emerald-400' : 'bg-white/5 border-white/5 text-slate-350'}`}>
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-lg ${printer.connected ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/5 text-slate-400'}`}>
                  {printer.type === 'bluetooth' ? <Bluetooth className="w-5 h-5" /> : <Printer className="w-5 h-5" />}
                </div>
                <div>
                  <span className="text-[10px] block font-mono text-slate-500 font-bold uppercase">STATUS DONGLE</span>
                  <span className="font-bold text-xs">{printer.name}</span>
                </div>
              </div>
              <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold ${printer.connected ? 'bg-emerald-500/20 text-emerald-450 text-emerald-400' : 'bg-white/5 text-slate-400'}`}>
                {printer.connected ? 'TERHUBUNG' : 'DISCONNECT'}
              </span>
            </div>

            {/* Status logs */}
            {printStatusMsg && (
              <div className="p-3 bg-slate-950 text-slate-300 font-mono text-[10px] rounded-lg border border-white/5 break-words leading-relaxed text-left">
                📢 log: {printStatusMsg}
              </div>
            )}

            {/* Connection CTA trigger layout */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                id="connect-bt-printer-btn"
                type="button"
                onClick={handleConnectBluetooth}
                className="py-2.5 px-3 bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all shadow-xs"
              >
                <Bluetooth className="w-4 h-4 text-indigo-400" />
                Pair Bluetooth
              </button>
              <button
                id="connect-usb-printer-btn"
                type="button"
                onClick={handleConnectUsb}
                className="py-2.5 px-3 bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all shadow-xs"
              >
                <Usb className="w-4 h-4 text-orange-400" />
                Pair Kabel USB
              </button>
            </div>

            <div className="pt-2 border-t border-white/5 flex justify-between items-center text-xs">
              <span className="text-[10px] text-slate-400 font-medium">Tes konektivitas perangkat Anda:</span>
              <button
                id="test-print-receipt-btn"
                type="button"
                onClick={handleTestPrint}
                disabled={!printer.connected || isPrintingTest}
                className={`py-1.5 px-4 font-extrabold text-[10px] rounded-lg flex items-center gap-1.5 shadow-xs cursor-pointer transition-all ${
                  printer.connected 
                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white' 
                    : 'bg-white/5 text-slate-500 cursor-not-allowed border border-white/5'
                }`}
              >
                <Printer className="w-3.5 h-3.5" />
                {isPrintingTest ? 'Mencetak...' : 'Cetak Struk Tes'}
              </button>
            </div>
          </div>
        </div>

        {/* Live Struk Preview Panel (5 cols) */}
        <div className="lg:col-span-5 space-y-4 text-left">
          <div className="text-xs font-bold text-slate-405 text-slate-400 uppercase tracking-wider px-1">Pratinjau Struk Kasir Aktual</div>

          <div className="glass-panel p-5 rounded-2xl border border-white/10 shadow-2xl space-y-4">
            {/* Receipt container simulation */}
            <div className="bg-white rounded-xl text-xs p-4 relative overflow-hidden text-slate-800 shadow-xl border border-slate-200 transition-all duration-300">
              <ReceiptThemeView 
                receipt={{
                  invoiceNumber: 'INV-20260608-542',
                  timestamp: '2026-06-08T12:15:00Z',
                  items: [
                    { productName: 'PREMIUM BROWNIE', quantity: 1, sellingPrice: 45000, totalPrice: 45000 },
                    { productName: 'ESPRESSO COFFEE CUP', quantity: 2, sellingPrice: 18000, totalPrice: 36000 }
                  ],
                  totalSales: 81000,
                  paymentMethod: 'Tunai',
                  amountPaid: 100000,
                  change: 19000
                }}
                profile={{
                  storeName: storeName.trim(),
                  address: address.trim(),
                  phone: phone.trim(),
                  receiptFooter: receiptFooter.trim(),
                  receiptTheme: receiptTheme
                }}
              />
            </div>
            
            <div className="p-3 bg-indigo-950/20 border border-indigo-500/15 text-indigo-300 rounded-xl text-[11px] flex items-start gap-2">
              <span className="mt-0.5 block">💡</span>
              <p className="leading-snug">Identitas ini akan langsung tampil di nota penjualan aktif maupun invoice di dalam menu riwayat penjualan seluruh perangkat.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
