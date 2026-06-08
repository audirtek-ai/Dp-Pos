/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Transaction, StoreProfile } from '../types';
import { formatRupiah } from '../utils';

interface ReceiptThemeViewProps {
  receipt: {
    invoiceNumber: string;
    timestamp: string | Date;
    items: Array<{
      productName: string;
      quantity: number;
      sellingPrice: number;
      totalPrice: number;
    }>;
    totalSales: number;
    paymentMethod: string;
    amountPaid: number;
    change: number;
  };
  profile: StoreProfile;
  theme?: string; // override theme: 'classic' | 'retro' | 'elegant' | 'cyber' | 'eco'
  printMode?: 'thermal' | 'standard';
  isActualPrint?: boolean; // If true, rendering the hidden actual physical target print element
}

export default function ReceiptThemeView({
  receipt,
  profile,
  theme,
  printMode = 'thermal',
  isActualPrint = false,
}: ReceiptThemeViewProps) {
  // Determine which theme to use (prop override or profile default, fallback to classic)
  const selectedTheme = theme || profile.receiptTheme || 'classic';

  const storeName = profile.storeName || 'TOKO MERCHANT SAYA';
  const address = profile.address || 'Alamat Toko Belum Diatur';
  const phone = profile.phone || '';
  const footerMessage = profile.receiptFooter || 'Terima Kasih Atas Kunjungan Anda!';
  
  const formattedDate = new Date(receipt.timestamp).toLocaleString('id-ID', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }) + ' WIB';

  // Return appropriate design template block
  if (selectedTheme === 'retro') {
    // ----------------------------------------------------
    // STYLE 2: RETRO VINTAGE TICKET (Double margins, Stars, Vintage label styling)
    // ----------------------------------------------------
    return (
      <div className={`font-mono text-slate-800 ${isActualPrint ? 'text-black' : ''}`}>
        <div className="text-center pb-2">
          {profile.logoUrl && (
            <div className="flex justify-center mb-1.5 bg-white p-0.5 rounded-full border border-slate-900 w-11 h-11 mx-auto overflow-hidden shadow-xs">
              <img src={profile.logoUrl} alt="Logo Toko" className="w-full h-full object-cover rounded-full" referrerPolicy="no-referrer" />
            </div>
          )}
          <div className="text-[9px] font-bold tracking-widest uppercase mb-1">
            ★ ★ ★ ESTABLISHED 2026 ★ ★ ★
          </div>
          <h4 className="font-serif font-black text-sm uppercase tracking-wider text-slate-900 border-2 border-double border-slate-900 py-1 px-2 inline-block mx-auto max-w-full">
            {storeName}
          </h4>
          <p className="text-[8px] tracking-tight uppercase leading-snug mt-1 font-mono">
            {address}
          </p>
          {phone && <p className="text-[8px] font-mono">TELP: {phone}</p>}
          
          <div className="text-[8px] border-t-2 border-b-2 border-dotted border-slate-800 py-1 my-1.5 font-mono">
            ★ NOTA PENJUALAN: {receipt.invoiceNumber} ★<br />
            ★ TANGGAL: {formattedDate} ★
          </div>
        </div>

        <div className="text-[8px] space-y-1.5 font-mono">
          <div className="flex justify-between font-bold text-[7px] text-slate-500 uppercase border-b border-dashed border-slate-500 pb-0.5">
            <span>URAIAN MENU</span>
            <span>TOTAL</span>
          </div>
          
          {receipt.items.map((it, idx) => (
            <div key={idx} className="pb-1 border-b border-dotted border-slate-200/50">
              <div className="font-bold uppercase tracking-tight">{it.productName}</div>
              <div className="flex justify-between text-[7.5px] font-mono">
                <span>  {it.quantity} x {formatRupiah(it.sellingPrice)}</span>
                <span className="font-bold">{formatRupiah(it.totalPrice)}</span>
              </div>
            </div>
          ))}

          <div className="border-t-2 border-double border-slate-800 pt-1 my-1.5 space-y-1">
            <div className="flex justify-between font-black text-[9px]">
              <span>★ TOTAL TRANS:</span>
              <span>{formatRupiah(receipt.totalSales)}</span>
            </div>
            <div className="flex justify-between text-slate-700 text-[8px] font-medium">
              <span>★ CARA BAYAR:</span>
              <span className="uppercase">{receipt.paymentMethod}</span>
            </div>
            <div className="flex justify-between text-slate-700 text-[8px]">
              <span>★ TUNAI DITERIMA:</span>
              <span>{formatRupiah(receipt.amountPaid)}</span>
            </div>
            <div className="flex justify-between text-[8px] font-bold border-t border-dotted border-slate-800 pt-1">
              <span>★ KEMBALIAN:</span>
              <span>{formatRupiah(receipt.change)}</span>
            </div>
          </div>
        </div>

        <div className="text-center pt-3 border-t-2 border-dashed border-slate-850 mt-3 flex flex-col items-center gap-1">
          <p className="font-bold text-[9px] uppercase tracking-wide border border-slate-500 px-2 py-0.5 max-w-full">
            {footerMessage}
          </p>
          <div className="text-[7px] text-slate-450 tracking-widest font-mono">
            ★ ★ ★ HARAP DATANG LAGI ★ ★ ★
          </div>
        </div>
      </div>
    );
  }

  if (selectedTheme === 'elegant') {
    // ----------------------------------------------------
    // STYLE 3: LUXURIOUS SERIF (Elegant, crown, boutique high-contrast serif lines)
    // ----------------------------------------------------
    return (
      <div className={`font-serif text-slate-700 leading-relaxed ${isActualPrint ? 'text-black font-serif' : ''}`}>
        <div className="text-center pb-2">
          {profile.logoUrl && (
            <div className="flex justify-center mb-2 p-0.5 rounded-full ring-2 ring-amber-700/20 w-10 h-10 mx-auto overflow-hidden bg-white shadow-xs">
              <img src={profile.logoUrl} alt="Logo Toko" className="w-full h-full object-cover rounded-full" referrerPolicy="no-referrer" />
            </div>
          )}
          <div className="text-[8px] text-indigo-700 font-sans tracking-widest uppercase mb-1">
            ◈ PREMIUM MERCHANT ◈
          </div>
          <h4 className="font-serif italic font-bold text-base text-slate-900 tracking-wide leading-tight px-1 py-0.5">
            {storeName}
          </h4>
          <p className="text-[9px] uppercase tracking-widest italic leading-tight text-slate-500 font-sans mt-1">
            {address}
          </p>
          {phone && <p className="text-[8px] font-sans tracking-wide">Contact: {phone}</p>}
          
          <div className="text-[8px] font-sans text-slate-400 mt-2 border-t border-b border-slate-200 py-1 uppercase tracking-widest">
            Invoice: {receipt.invoiceNumber} • Date: {formattedDate}
          </div>
        </div>

        <div className="text-[8.5px] py-1.5 space-y-1.5 font-serif">
          <div className="text-[7.5px] font-sans uppercase tracking-widest text-slate-500 flex justify-between border-b border-slate-200 pb-1">
            <span>Product Details</span>
            <span>Amount</span>
          </div>

          {receipt.items.map((it, idx) => (
            <div key={idx} className="pb-1 text-slate-800 italic">
              <div className="font-bold font-serif not-italic uppercase tracking-wide text-amber-950 text-[9px]">{it.productName}</div>
              <div className="flex justify-between text-[8px] font-sans">
                <span className="text-slate-500">  {it.quantity} x {formatRupiah(it.sellingPrice)}</span>
                <span className="font-bold text-slate-900">{formatRupiah(it.totalPrice)}</span>
              </div>
            </div>
          ))}

          <div className="text-center text-slate-300 text-[6px] tracking-[0.25em] py-1">
            ◈ ◈ ◈ ◈ ◈ ◈ ◈ ◈ ◈ ◈ ◈ ◈ ◈ ◈ ◈ ◈
          </div>

          <div className="space-y-1 font-sans text-[8.5px] tracking-wide">
            <div className="flex justify-between font-bold text-slate-950 text-[9.5px]">
              <span>TOTAL ACQUISITION:</span>
              <span className="font-serif italic font-bold">{formatRupiah(receipt.totalSales)}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Payment Type:</span>
              <span className="uppercase text-slate-700 font-bold">{receipt.paymentMethod}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Sovereign Cash:</span>
              <span>{formatRupiah(receipt.amountPaid)}</span>
            </div>
            <div className="flex justify-between font-bold text-slate-900 border-t border-dashed border-slate-300 pt-1 mt-1 text-[9px]">
              <span>Balance Returned:</span>
              <span className="font-serif italic font-bold">{formatRupiah(receipt.change)}</span>
            </div>
          </div>
        </div>

        <div className="text-center pt-3 border-t border-slate-200 mt-2 flex flex-col items-center">
          <p className="font-serif italic font-bold text-[9px] text-slate-800">
            "{footerMessage}"
          </p>
          <p className="text-[7.5px] tracking-wider text-slate-400 font-sans mt-1 uppercase">With Compliments of Management</p>
        </div>
      </div>
    );
  }

  if (selectedTheme === 'cyber') {
    // ----------------------------------------------------
    // STYLE 4: CYBER TECH TERMINAL (Brackets, digital scan CRC outputs, tech variables)
    // ----------------------------------------------------
    return (
      <div className={`font-mono text-emerald-800 ${isActualPrint ? 'text-black font-mono' : ''}`}>
        <div className="text-left pb-2 space-y-0.5 border-b-2 border-emerald-800">
          <div className="flex justify-between items-start gap-2">
            <div className="text-[7.5px] bg-slate-900 text-white font-mono px-1.5 py-0.5 inline-block rounded font-bold uppercase tracking-widest">
              [SYS_ID: HPPOS_TERM_09]
            </div>
            {profile.logoUrl && (
              <div className="border border-emerald-800 p-0.5 w-9 h-9 overflow-hidden bg-slate-950 flex-shrink-0 rounded-sm">
                <img src={profile.logoUrl} alt="Logo Toko" className="w-full h-full object-cover brightness-110 contrast-125 grayscale" referrerPolicy="no-referrer" />
              </div>
            )}
          </div>
          <h4 className="font-black text-xs text-slate-955 uppercase tracking-tight mt-1 font-mono">
            &gt;&gt; HOST: {storeName}
          </h4>
          <p className="text-[7px] text-slate-500 font-mono leading-tight">
            LOC: {address}
          </p>
          {phone && <p className="text-[7px] font-mono">PHONE: {phone}</p>}
          
          <div className="text-[7.5px] leading-relaxed pt-1.5 border-t border-dashed border-slate-300 mt-1">
            // ID: {receipt.invoiceNumber}<br />
            // DATE: {formattedDate}<br />
            // SYNC STATUS: SECURE_LOCAL_OK
          </div>
        </div>

        <div className="text-[8px] font-mono py-1">
          <div className="text-center font-mono text-[7px] text-slate-400 py-1">
            ////////////////////////////////
          </div>
          
          <div className="space-y-1">
            {receipt.items.map((it, idx) => (
              <div key={idx} className="pb-1 leading-normal font-mono">
                <div className="font-bold uppercase">&gt; [ITEM] {it.productName}</div>
                <div className="flex justify-between text-[7.5px] pl-2 font-mono">
                  <span>  {it.quantity} UNITS x {formatRupiah(it.sellingPrice)}</span>
                  <span className="font-bold">[{formatRupiah(it.totalPrice)}]</span>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center font-mono text-[7px] text-slate-400 py-1">
            ////////////////////////////////
          </div>

          <div className="space-y-1 font-mono text-[8px] bg-slate-50/50 p-1.5 border border-slate-200 rounded">
            <div className="flex justify-between font-extrabold text-slate-900">
              <span>[SUBTOTAL_SUM]:</span>
              <span>{formatRupiah(receipt.totalSales)}</span>
            </div>
            <div className="flex justify-between text-slate-700">
              <span>[PAY_METHOD]:</span>
              <span className="uppercase font-bold underline">{receipt.paymentMethod}</span>
            </div>
            <div className="flex justify-between text-slate-700">
              <span>[CASH_INPUT]:</span>
              <span>{formatRupiah(receipt.amountPaid)}</span>
            </div>
            <div className="flex justify-between font-bold text-slate-950 border-t border-dotted border-slate-400 pt-1 mt-1">
              <span>[CHANGE_DUE]:</span>
              <span>{formatRupiah(receipt.change)}</span>
            </div>
          </div>
        </div>

        <div className="text-left pt-2 border-t border-slate-300 font-mono text-[7.5px] space-y-1">
          <p className="font-bold text-slate-800">
            &gt; MSG: "{footerMessage}"
          </p>
          <div className="text-[6.5px] text-slate-400 font-mono flex justify-between uppercase">
            <span>[CRC32: 0x883AFA91]</span>
            <span>[SECURE_PROT_V2]</span>
          </div>
        </div>
      </div>
    );
  }

  if (selectedTheme === 'eco') {
    // ----------------------------------------------------
    // STYLE 5: ECO ORGANIC SPROUT (Natural, Leaves sprout theme, Eco notice)
    // ----------------------------------------------------
    return (
      <div className={`font-sans text-stone-800 ${isActualPrint ? 'text-black font-sans' : ''}`}>
        <div className="text-center pb-2">
          {profile.logoUrl && (
            <div className="flex justify-center mb-1.5 p-0.5 rounded-full border border-emerald-500/20 bg-emerald-50 w-11 h-11 mx-auto overflow-hidden shadow-xs">
              <img src={profile.logoUrl} alt="Logo Toko" className="w-full h-full object-cover rounded-full" referrerPolicy="no-referrer" />
            </div>
          )}
          <div className="text-[8px] text-emerald-600 font-bold uppercase tracking-wider mb-0.5 flex items-center justify-center gap-1 font-sans">
            🌱 HEMAT KERTAS UNTUK BUMI 🌱
          </div>
          <h4 className="font-sans font-bold text-xs uppercase tracking-normal text-emerald-950 bg-emerald-50 max-w-xs mx-auto py-1 px-3 rounded-full border border-emerald-100 font-sans inline-block">
            {storeName}
          </h4>
          <p className="text-[8px] text-stone-500 mt-1 font-sans leading-relaxed">
            {address}
          </p>
          {phone && <p className="text-[8px] text-stone-500 font-sans">Hubungi Kami: {phone}</p>}
          
          <div className="text-[8px] text-stone-400 font-sans mt-2 border-y border-dashed border-stone-200 py-1">
            No. Nota: {receipt.invoiceNumber} <br />
            Hari & Tanggal: {formattedDate}
          </div>
        </div>

        <div className="text-[8.5px] font-sans py-1 leading-normal">
          <div className="text-[7.5px] uppercase font-bold text-stone-500 flex justify-between border-b border-stone-100 pb-1 mb-1">
            <span>Rincian Item Sehat</span>
            <span>Jumlah</span>
          </div>

          <div className="space-y-1">
            {receipt.items.map((it, idx) => (
              <div key={idx} className="pb-1 border-b border-stone-100/50">
                <div className="font-bold text-stone-900 flex items-center gap-1">
                  <span>🍃</span> {it.productName}
                </div>
                <div className="flex justify-between text-[7.5px] text-stone-500 pl-3">
                  <span>  {it.quantity} Pcs x {formatRupiah(it.sellingPrice)}</span>
                  <span className="font-bold text-stone-800">{formatRupiah(it.totalPrice)}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center text-stone-300 text-[8px] py-1">
            🌿 🌿 🌿 🌿 🌿 🌿 🌿 🌿 🌿 🌿 🌿 🌿 🌿
          </div>

          <div className="space-y-1 text-stone-700 text-[8.5px]">
            <div className="flex justify-between font-bold text-stone-900">
              <span>Total Amal Pembayaran:</span>
              <span>{formatRupiah(receipt.totalSales)}</span>
            </div>
            <div className="flex justify-between text-[8px] text-stone-500">
              <span>Media Pembayaran:</span>
              <span className="uppercase font-semibold">{receipt.paymentMethod}</span>
            </div>
            <div className="flex justify-between text-[8px] text-stone-500">
              <span>Nominal Bayar:</span>
              <span>{formatRupiah(receipt.amountPaid)}</span>
            </div>
            <div className="flex justify-between font-bold text-stone-900 border-t border-dotted border-stone-300 pt-1 mt-1">
              <span>Kembalian Rupiah:</span>
              <span>{formatRupiah(receipt.change)}</span>
            </div>
          </div>
        </div>

        <div className="text-center pt-3 border-t border-stone-200 mt-2 flex flex-col items-center gap-1 bg-stone-50 p-2 rounded-xl">
          <p className="font-semibold text-[8px] text-stone-600 font-sans">
            " {footerMessage} "
          </p>
          <div className="text-[7.5px] text-emerald-700 flex items-center gap-1 font-sans justify-center leading-tight">
            <span>💚</span> Salam sehat berkelanjutan. Kemasan eco-friendly.
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // STYLE 1: CLASSIC MINIMALIST (Default, Sederhana, Bersih)
  // ----------------------------------------------------
  return (
    <div className={`font-mono text-slate-800 ${isActualPrint ? 'text-black' : ''}`}>
      <div className="text-center pb-2">
        {profile.logoUrl && (
          <div className="flex justify-center mb-1.5 p-0.5 bg-white border border-slate-355 border-slate-200 w-11 h-11 mx-auto overflow-hidden rounded-full shadow-xs">
            <img src={profile.logoUrl} alt="Logo Toko" className="w-full h-full object-cover rounded-full" referrerPolicy="no-referrer" />
          </div>
        )}
        <h4 className="font-heading font-black text-xs text-slate-900 uppercase tracking-tight leading-tight">
          {storeName}
        </h4>
        <p className="text-[9px] text-slate-500 font-sans leading-tight mt-0.5">
          {address}
        </p>
        {phone && (
          <p className="text-[9px] text-slate-500 font-sans">
            Telp: {phone}
          </p>
        )}
        <div className="text-[8px] text-slate-400 font-mono mt-1.5 border-t border-b border-dashed border-slate-200 py-1">
          INV: {receipt.invoiceNumber}<br />
          Tgl: {formattedDate}
        </div>
      </div>

      <div className="font-mono text-[8.5px] leading-relaxed py-1">
        <div className="text-center text-slate-400 font-mono text-[7px] tracking-[0.1em] mb-1.5">
          ================================
        </div>
        {receipt.items.map((it, idx) => (
          <div key={idx} className="pb-1 font-mono text-slate-800">
            <div className="font-bold uppercase leading-tight">{it.productName}</div>
            <div className="flex justify-between text-[7.5px] text-slate-650 scale-95 origin-left">
              <span>  {it.quantity} x {formatRupiah(it.sellingPrice)}</span>
              <span className="font-bold shrink-0">{formatRupiah(it.totalPrice)}</span>
            </div>
          </div>
        ))}
        <div className="text-center text-slate-400 font-mono text-[7px] tracking-[0.1em] mt-1.5 mb-1.5">
          --------------------------------
        </div>
        <div className="space-y-1">
          <div className="flex justify-between font-extrabold text-slate-900">
            <span>TOTAL BELANJA:</span>
            <span>{formatRupiah(receipt.totalSales)}</span>
          </div>
          <div className="flex justify-between text-slate-700 text-[8px]">
            <span>Metode:</span>
            <span className="uppercase">{receipt.paymentMethod}</span>
          </div>
          <div className="flex justify-between text-slate-700 text-[8px]">
            <span>Uang Tunai:</span>
            <span>{formatRupiah(receipt.amountPaid)}</span>
          </div>
          <div className="flex justify-between text-[8px] font-bold text-slate-900 border-t border-dotted border-slate-300 pt-1 mt-1 font-mono">
            <span>Uang Kembali:</span>
            <span>{formatRupiah(receipt.change)}</span>
          </div>
        </div>
      </div>

      <div className="text-center font-sans pt-3 border-t border-dashed border-slate-200 mt-2.5">
        <p className="font-extrabold text-[9px] text-slate-700 uppercase leading-snug">
          {footerMessage}
        </p>
        <p className="text-[8px] text-slate-400 mt-0.5">Sistem Kasir HPPOS</p>
      </div>
    </div>
  );
}
