/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { StoreProfile } from '../types';
import { Store, MapPin, Phone, MessageSquare, Save, Sparkles, CheckCircle, Receipt, Printer, Bluetooth, Usb, AlertTriangle } from 'lucide-react';
import { motion } from 'motion/react';
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
  const [storeName, setStoreName] = useState(profile.storeName || 'TOKO MERCHANT SAYA');
  const [address, setAddress] = useState(profile.address || 'Jl. Berdikari Kaya No. 10, Jakarta');
  const [phone, setPhone] = useState(profile.phone || '0812-3456-7890');
  const [receiptFooter, setReceiptFooter] = useState(profile.receiptFooter || 'Terima Kasih Atas Kunjungan Anda!');
  const [successMsg, setSuccessMsg] = useState(false);

  // Thermal Printer States
  const [printer, setPrinter] = useState<PrinterDeviceState>({
    type: null,
    name: 'Printer Belum Tersambung',
    connected: false
  });
  const [printStatusMsg, setPrintStatusMsg] = useState('');
  const [isPrintingTest, setIsPrintingTest] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveProfile({
      storeName: storeName.trim(),
      address: address.trim(),
      phone: phone.trim(),
      receiptFooter: receiptFooter.trim()
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
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
        <div>
          <h2 className="font-heading font-extrabold text-xl text-slate-900 flex items-center gap-2">
            <Store className="w-6 h-6 text-indigo-600" />
            Pengaturan Profil Toko & Nota
          </h2>
          <p className="text-xs text-slate-500 mt-1">Sesuaikan informasi identifikasi merchant dan layout cetakan struk kasir Anda.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Form setup panel (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-100 p-6 space-y-5 shadow-xs">
            <h3 className="font-heading font-bold text-sm text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-500" />
              Identitas Bisnis & Nota
            </h3>

            {successMsg && (
              <motion.div 
                initial={{ scale: 0.98, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2 font-medium"
              >
                <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                Profil toko dan pengaturan invoice berhasil disimpan serta disinkronkan ke seluruh sistem!
              </motion.div>
            )}

            <div className="space-y-4">
              {/* Store Name input */}
              <div className="space-y-1.5">
                <label htmlFor="p-name" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Nama Toko / Usaha <span className="text-red-500">*</span></label>
                <div className="relative">
                  <Store className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4.5 h-4.5" />
                  <input
                    id="p-name"
                    type="text"
                    required
                    placeholder="Contoh: Bakery Barokah Jaya"
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl pl-10 pr-4 py-2.5 text-sm font-medium focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                  />
                </div>
              </div>

              {/* Address input */}
              <div className="space-y-1.5">
                <label htmlFor="p-address" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Alamat Lengkap</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3.5 text-slate-400 w-4.5 h-4.5" />
                  <textarea
                    id="p-address"
                    rows={2}
                    placeholder="Contoh: Jl. Berdikari No. 45, Kecamatan Sukasari, Bandung"
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl pl-10 pr-4 py-2.5 text-sm font-medium focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-sans"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>
              </div>

              {/* Phone/WA input */}
              <div className="space-y-1.5">
                <label htmlFor="p-phone" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">No. Telepon / WhatsApp</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4.5 h-4.5" />
                  <input
                    id="p-phone"
                    type="text"
                    placeholder="Contoh: 081234567890"
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl pl-10 pr-4 py-2.5 text-sm font-medium focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </div>

              {/* Receipt Footer Message */}
              <div className="space-y-1.5">
                <label htmlFor="p-footer" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Catatan Kaki Struk (Footer)</label>
                <div className="relative">
                  <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4.5 h-4.5" />
                  <input
                    id="p-footer"
                    type="text"
                    placeholder="Contoh: Barang yang sudah dibeli tidak dapat ditukar."
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl pl-10 pr-4 py-2.5 text-sm font-medium focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                    value={receiptFooter}
                    onChange={(e) => setReceiptFooter(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                id="save-profile-btn"
                type="submit"
                className="py-2.5 px-6 bg-indigo-650 hover:bg-indigo-700 bg-indigo-600 text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                Simpan Identitas Toko
              </button>
            </div>
          </form>

          {/* Thermal Printer Hardware Sync block */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4 shadow-xs">
            <h3 className="font-heading font-bold text-sm text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
              <Printer className="w-4.5 h-4.5 text-indigo-600 animate-pulse" />
              Koneksi Printer Thermal POS (Bluetooth / KABEL USB)
            </h3>

            <p className="text-xs text-slate-500 leading-relaxed">
              Sambungkan aplikasi kasir HPPOS secara langsung ke printer kasir thermal ukuran kertas 58mm / 80mm menggunakan konektivitas nirkabel Bluetooth maupun kabel data USB untuk pencetakan struk instan.
            </p>

            {/* Connection status display */}
            <div className={`p-4 rounded-xl border flex items-center justify-between gap-3 ${printer.connected ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-lg ${printer.connected ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-500'}`}>
                  {printer.type === 'bluetooth' ? <Bluetooth className="w-5 h-5" /> : <Printer className="w-5 h-5" />}
                </div>
                <div>
                  <span className="text-[10px] block font-mono text-slate-400 font-bold uppercase">STATUS DONGLE</span>
                  <span className="font-bold text-xs">{printer.name}</span>
                </div>
              </div>
              <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold ${printer.connected ? 'bg-emerald-200 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>
                {printer.connected ? 'TERHUBUNG' : 'DISCONNECT'}
              </span>
            </div>

            {/* Status logs */}
            {printStatusMsg && (
              <div className="p-3 bg-slate-900 text-slate-200 font-mono text-[10px] rounded-lg border border-slate-800 break-words leading-relaxed">
                📢 log: {printStatusMsg}
              </div>
            )}

            {/* Connection CTA trigger layout */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                id="connect-bt-printer-btn"
                type="button"
                onClick={handleConnectBluetooth}
                className="py-2.5 px-3 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all shadow-xs"
              >
                <Bluetooth className="w-4 h-4 text-blue-500" />
                Pair Bluetooth
              </button>
              <button
                id="connect-usb-printer-btn"
                type="button"
                onClick={handleConnectUsb}
                className="py-2.5 px-3 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all shadow-xs"
              >
                <Usb className="w-4 h-4 text-orange-500" />
                Pair Kabel USB
              </button>
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-xs">
              <span className="text-[10px] text-slate-400 font-medium">Tes konektivitas perangkat Anda:</span>
              <button
                id="test-print-receipt-btn"
                type="button"
                onClick={handleTestPrint}
                disabled={!printer.connected || isPrintingTest}
                className={`py-1.5 px-4 font-extrabold text-[10px] rounded-lg flex items-center gap-1.5 shadow-xs cursor-pointer transition-all ${
                  printer.connected 
                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white' 
                    : 'bg-slate-100 text-slate-350 bg-slate-100 text-slate-400 cursor-not-allowed'
                }`}
              >
                <Printer className="w-3.5 h-3.5" />
                {isPrintingTest ? 'Mencetak...' : 'Cetak Struk Tes'}
              </button>
            </div>
          </div>
        </div>

        {/* Live Struk Preview Panel (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="text-xs font-bold text-slate-450 text-slate-400 uppercase tracking-wider px-1">Pratinjau Struk Kasir Aktual</div>

          <div className="bg-slate-900/10 p-5 rounded-2xl border border-white/5 bg-white shadow-lg space-y-4 text-slate-800">
            {/* Receipt container simulation */}
            <div className="bg-white border-white rounded-xl text-xs font-mono p-4 space-y-3 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-indigo-600"></div>
              
              <div className="text-center space-y-0.5 pt-1.5">
                <div className="p-1 w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 mx-auto mb-1">
                  <Receipt className="w-4.5 h-4.5" />
                </div>
                <h4 className="font-heading font-black text-slate-900 text-sm uppercase tracking-tight antialiased">{storeName || 'TOKO SAYA'}</h4>
                <p className="text-[10px] text-slate-500 leading-normal">{address || 'Alamat Toko'}</p>
                <p className="text-[10px] text-slate-500">Telp: {phone || '-'}</p>
                <p className="text-[10px] text-slate-400 mt-2">ID PENJUALAN: INV-20260608-542</p>
                <p className="text-[10px] text-slate-400">08/06/2026, 12:15 WIB</p>
              </div>

              <div className="border-t border-dashed border-slate-200 py-2 space-y-1.5 leading-relaxed">
                <div className="flex justify-between">
                  <span>Product Premium Brownie x1</span>
                  <span className="font-bold">Rp 45.000</span>
                </div>
                <div className="flex justify-between">
                  <span>Espresso Coffee Cup x2</span>
                  <span className="font-bold">Rp 36.000</span>
                </div>
              </div>

              <div className="border-t border-dashed border-slate-200 pt-2 space-y-1 text-slate-700">
                <div className="flex justify-between font-bold text-slate-950">
                  <span>TOTAL TAGIHAN:</span>
                  <span>Rp 81.000</span>
                </div>
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>Metode:</span>
                  <span>Tunai</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span>Uang Diterima:</span>
                  <span>Rp 100.000</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span>Uang Kembali:</span>
                  <span>Rp 19.000</span>
                </div>
              </div>

              <div className="text-center text-[10px] text-slate-400 pt-4 border-t border-dashed border-slate-200 space-y-1 font-sans">
                <p className="font-bold text-slate-600 text-[10px] uppercase">{receiptFooter || 'Terima Kasih!'}</p>
                <p className="text-[9px] text-slate-400">Sistem Kasir Pintar HPPOS</p>
              </div>
            </div>
            <div className="p-3 bg-indigo-50 border border-indigo-150 text-indigo-800 rounded-xl text-[11px] flex items-start gap-2">
              <span className="mt-0.5 block">💡</span>
              <p className="leading-snug">Identitas ini akan langsung tampil di nota penjualan aktif maupun invoice di dalam menu riwayat penjualan seluruh perangkat.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
