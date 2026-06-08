/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Transaction } from '../types';

/**
 * ESC/POS Command Constants for Thermal Printers (e.g. 58mm / 82mm)
 */
const ESC = 0x1B;
const GS = 0x1D;

export const ESC_POS_COMMANDS = {
  INIT: [ESC, 0x40], // Reinitialize printer
  ALIGN_LEFT: [ESC, 0x61, 0x00],
  ALIGN_CENTER: [ESC, 0x61, 0x01],
  ALIGN_RIGHT: [ESC, 0x61, 0x02],
  BOLD_ON: [ESC, 0x45, 0x01],
  BOLD_OFF: [ESC, 0x45, 0x00],
  DOUBLE_SIZE_ON: [GS, 0x21, 0x11], // 2x width and height text
  DOUBLE_SIZE_OFF: [GS, 0x21, 0x00],
  FEED_3_CUT: [GS, 0x56, 0x42, 0x03], // Feed 3 lines & half cut
  FEED_2: [ESC, 0x64, 0x02],          // Feed 2 lines
  UNDERLINE_ON: [ESC, 0x2D, 0x01],
  UNDERLINE_OFF: [ESC, 0x2D, 0x00],
};

export interface PrinterDeviceState {
  type: 'bluetooth' | 'usb' | 'network' | null;
  name: string;
  connected: boolean;
  error?: string;
}

// Global cached connection reference
let bluetoothDeviceCache: any = null;
let bluetoothCharacteristicCache: any = null;
let usbDeviceCache: any = null;

// Helper to convert standard strings into raw Uint8Array (including ASCII text formatting)
function stringToBytes(text: string): Uint8Array {
  // Simple ISO-8859-1 conversion
  const bytes = new Uint8Array(text.length);
  for (let i = 0; i < text.length; i++) {
    bytes[i] = text.charCodeAt(i) & 0xFF;
  }
  return bytes;
}

/**
 * Generate formatted ESC/POS byte arrays for thermal receipt printing
 * Supports 32-character column width for standard 58mm roll width.
 */
export function generateEscPosReceipt(tx: Transaction, profile: { storeName: string; address: string; phone: string; receiptFooter: string }, cols = 32): Uint8Array {
  const encoder: number[] = [];

  // 1. Initialize
  encoder.push(...ESC_POS_COMMANDS.INIT);

  // 2. Alignment Centered for Header
  encoder.push(...ESC_POS_COMMANDS.ALIGN_CENTER);
  encoder.push(...ESC_POS_COMMANDS.DOUBLE_SIZE_ON);
  encoder.push(...ESC_POS_COMMANDS.BOLD_ON);
  encoder.push(...Array.from(stringToBytes((profile.storeName || 'TOKO SAYA').toUpperCase() + '\n')));
  encoder.push(...ESC_POS_COMMANDS.DOUBLE_SIZE_OFF);
  
  // Custom address
  encoder.push(...ESC_POS_COMMANDS.BOLD_OFF);
  if (profile.address) {
    encoder.push(...Array.from(stringToBytes(profile.address + '\n')));
  }
  if (profile.phone) {
    encoder.push(...Array.from(stringToBytes('Telp: ' + profile.phone + '\n')));
  }
  
  // Custom divider line
  encoder.push(...Array.from(stringToBytes('='.repeat(cols) + '\n')));

  // Invoice identifiers
  encoder.push(...ESC_POS_COMMANDS.ALIGN_LEFT);
  encoder.push(...Array.from(stringToBytes(`INV   : ${tx.invoiceNumber}\n`)));
  encoder.push(...Array.from(stringToBytes(`WAKTU : ${new Date(tx.timestamp).toLocaleString('id-ID')}\n`)));
  encoder.push(...Array.from(stringToBytes(`METODE: ${tx.paymentMethod}\n`)));
  
  encoder.push(...Array.from(stringToBytes('='.repeat(cols) + '\n')));

  // Items table
  tx.items.forEach(item => {
    const nameStr = (item.productName || 'Menu').toUpperCase();
    const totalStr = `Rp ${(item.totalPrice).toLocaleString('id-ID')}`;
    const qtyStr = `${item.quantity} x Rp ${(item.sellingPrice).toLocaleString('id-ID')}`;

    // Item name on its own line
    encoder.push(...Array.from(stringToBytes(nameStr + '\n')));
    
    // Right-aligned item total pricing inline with the item quantities calculation details
    const spaceCount = cols - (qtyStr.length + totalStr.length + 2); // 2 spaces indent
    if (spaceCount > 0) {
      encoder.push(...Array.from(stringToBytes('  ' + qtyStr + ' '.repeat(spaceCount) + totalStr + '\n')));
    } else {
      const fallbackSpace = cols - totalStr.length;
      encoder.push(...Array.from(stringToBytes('  ' + qtyStr + '\n')));
      encoder.push(...Array.from(stringToBytes(' '.repeat(Math.max(2, fallbackSpace)) + totalStr + '\n')));
    }
  });

  encoder.push(...Array.from(stringToBytes('-'.repeat(cols) + '\n')));

  // Totals Section
  const grandTotalStr = `Rp ${(tx.totalSales).toLocaleString('id-ID')}`;
  const totalLabel = 'TOTAL BELANJA:';
  const totalSpace = cols - (totalLabel.length + grandTotalStr.length);
  encoder.push(...ESC_POS_COMMANDS.BOLD_ON);
  encoder.push(...Array.from(stringToBytes(totalLabel + ' '.repeat(Math.max(1, totalSpace)) + grandTotalStr + '\n')));
  encoder.push(...ESC_POS_COMMANDS.BOLD_OFF);

  // Cash count and exchange details
  const paidStr = `Rp ${(tx.amountPaid).toLocaleString('id-ID')}`;
  const paidLabel = 'Uang Tunai:';
  const paidSpace = cols - (paidLabel.length + paidStr.length);
  encoder.push(...Array.from(stringToBytes(paidLabel + ' '.repeat(Math.max(1, paidSpace)) + paidStr + '\n')));

  const changeStr = `Rp ${(tx.change).toLocaleString('id-ID')}`;
  const changeLabel = 'Uang Kembali:';
  const changeSpace = cols - (changeLabel.length + changeStr.length);
  encoder.push(...Array.from(stringToBytes(changeLabel + ' '.repeat(Math.max(1, changeSpace)) + changeStr + '\n')));

  // Elegant footer boundary
  encoder.push(...Array.from(stringToBytes('='.repeat(cols) + '\n')));

  // Receipt Footer Banner
  encoder.push(...ESC_POS_COMMANDS.ALIGN_CENTER);
  encoder.push(...ESC_POS_COMMANDS.BOLD_ON);
  encoder.push(...Array.from(stringToBytes((profile.receiptFooter || 'TERIMA KASIH').toUpperCase() + '\n')));
  encoder.push(...ESC_POS_COMMANDS.BOLD_OFF);
  encoder.push(...Array.from(stringToBytes('Sistem Kasir Pintar HPPOS\n')));
  
  // Compact paper feed & cut to guarantee readability without wasting blank paper lengths
  encoder.push(...Array.from(stringToBytes('\n')));
  encoder.push(...ESC_POS_COMMANDS.FEED_2);
  encoder.push(...ESC_POS_COMMANDS.FEED_3_CUT);

  return new Uint8Array(encoder);
}

/**
 * Generate test slip bytes to verify thermal physical operation
 */
export function generateTestReceipt(profile: { storeName: string; address: string; phone: string; receiptFooter: string }, cols = 32): Uint8Array {
  const encoder: number[] = [];
  encoder.push(...ESC_POS_COMMANDS.INIT);
  encoder.push(...ESC_POS_COMMANDS.ALIGN_CENTER);
  encoder.push(...ESC_POS_COMMANDS.BOLD_ON);
  encoder.push(...Array.from(stringToBytes('TEST UTILITY SUKSES\n')));
  encoder.push(...ESC_POS_COMMANDS.BOLD_OFF);
  encoder.push(...Array.from(stringToBytes('='.repeat(cols) + '\n')));
  encoder.push(...Array.from(stringToBytes((profile.storeName || 'COBA KASIR HPPOS').toUpperCase() + '\n')));
  encoder.push(...Array.from(stringToBytes('Koneksi Printer Berhasil Aktif!\n')));
  encoder.push(...Array.from(stringToBytes('--------------------------------\n'.slice(0, cols))));
  encoder.push(...Array.from(stringToBytes(`Waktu: ${new Date().toLocaleString()}\n`)));
  encoder.push(...Array.from(stringToBytes('================================\n'.slice(0, cols))));
  
  // Compact paper feed & cut to guarantee readability without wasting paper
  encoder.push(...Array.from(stringToBytes('\n')));
  encoder.push(...ESC_POS_COMMANDS.FEED_2);
  encoder.push(...ESC_POS_COMMANDS.FEED_3_CUT);
  return new Uint8Array(encoder);
}

// Global Bluetooth disconnection handler to clear stale GATT cache targets instantly
const handleBluetoothDisconnect = () => {
  console.log('Bluetooth connection disconnected or timeout. Clearing cached characteristics.');
  bluetoothCharacteristicCache = null;
};

// Helper utility for non-blocking pacing delays between BLE packet frames
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Connect to thermal printer via Bluetooth (using Web Bluetooth API)
 */
export async function connectBluetoothDevice(): Promise<PrinterDeviceState> {
  try {
    if (!(navigator as any).bluetooth) {
      throw new Error('Bluetooth API tidak didukung pada browser ini. Pastikan menggunakan Chrome/Edge via HTTPS.');
    }

    // Filter bluetooth printers. Many thermal printers advertise generic serial profiles or printer services
    const device = await (navigator as any).bluetooth.requestDevice({
      filters: [
        { services: ['000018f0-0000-1000-8000-00805f9b34fb'] }, // Standard ESC/POS UUID
        { namePrefix: 'Printer' },
        { namePrefix: 'RPP' },
        { namePrefix: 'MTP' },
        { namePrefix: 'PT-' },
        { namePrefix: 'POS' }
      ],
      optionalServices: [
        '000018f0-0000-1000-8000-00805f9b34fb', // Standard ESC/POS printing
        '0000ff00-0000-1000-8000-00805f9b34fb', // Alternate generic write services
        '0000ffe0-0000-1000-8000-00805f9b34fb', // Common serial BLE modules (HM-10 and others)
        '0000fee7-0000-1000-8000-00805f9b34fb', // Generic printer/label service
        '49535343-fe7d-41aa-8eca-2e15f89a40c6'  // Microchip ISSC BLE Serial standard
      ]
    });

    if (!device) {
      throw new Error('Tidak ada perangkat printer bluetooth terpilih.');
    }

    bluetoothDeviceCache = device;
    
    // Wire up global disconnect listener so that stale characteristic references are cleared immediately
    device.removeEventListener('gattserverdisconnected', handleBluetoothDisconnect);
    device.addEventListener('gattserverdisconnected', handleBluetoothDisconnect);

    const server = await device.gatt?.connect();
    
    // Find writable characteristics
    // We try defined print service, otherwise search all services
    const services = await server?.getPrimaryServices();
    let writeChar: any = null;

    if (services) {
      for (const service of services) {
        const characteristics = await service.getCharacteristics();
        for (const char of characteristics) {
          if (char.properties.write || char.properties.writeWithoutResponse) {
            writeChar = char;
            break;
          }
        }
        if (writeChar) break;
      }
    }

    if (!writeChar) {
      throw new Error('Printer tidak memiliki karakteristik GATT penulisan (write status).');
    }

    bluetoothCharacteristicCache = writeChar;
    
    return {
      type: 'bluetooth',
      name: device.name || 'Printer Bluetooth',
      connected: true
    };
  } catch (err: any) {
    console.error('Bluetooth error:', err);
    let errorMsg = err.message || 'Gagal menyambung perangkat BT';
    if (errorMsg.includes('permissions policy') || errorMsg.includes('disallowed') || err.name === 'SecurityError') {
      errorMsg = 'Keamanan iFrame: Akses Bluetooth diblokir oleh kebijakan keamanan iFrame browser. Silakan buka aplikasi pada Tab Baru (klik ikon Buka di Tab Baru di sudut kanan atas panel pratinjau) untuk menggunakan fitur printer Bluetooth secara langsung!';
    } else if (errorMsg.includes('failed to connect') || errorMsg.includes('Connection attempt failed') || errorMsg.includes('GATT') || err.name === 'NetworkError') {
      errorMsg = 'Koneksi Gagal: Percobaan koneksi ke printer Bluetooth gagal. Pastikan unit printer dinyalakan, jaraknya dekat, baterainya tidak lemah, dan tidak sedang tersambung ke aplikasi kasir/HP lain.';
    }
    return {
      type: 'bluetooth',
      name: 'Printer Bluetooth',
      connected: false,
      error: errorMsg
    };
  }
}

/**
 * Connect to USB Thermal Printer via WebUSB API
 */
export async function connectUsbDevice(): Promise<PrinterDeviceState> {
  try {
    if (!(navigator as any).usb) {
      throw new Error('WebUSB API tidak didukung pada browser ini.');
    }

    const device = await (navigator as any).usb.requestDevice({
      filters: [
        { classCode: 7 } // Class 7 is the official USB Printer class code
      ]
    });

    if (!device) {
      throw new Error('Perangkat USB tidak terpilih.');
    }

    usbDeviceCache = device;
    await device.open();
    await device.selectConfiguration(1);
    await device.claimInterface(0);

    return {
      type: 'usb',
      name: device.productName || 'USB Printer',
      connected: true
    };
  } catch (err: any) {
    console.error('USB error:', err);
    let errorMsg = err.message || 'Gagal menyambung USB';
    if (errorMsg.includes('permissions policy') || errorMsg.includes('disallowed') || err.name === 'SecurityError') {
      errorMsg = 'Keamanan iFrame: Akses USB diblokir oleh kebijakan keamanan iFrame browser. Silakan buka aplikasi pada Tab Baru (klik ikon Buka di Tab Baru di sudut kanan atas panel pratinjau) untuk menggunakan fitur printer USB secara langsung!';
    }
    return {
      type: 'usb',
      name: 'USB Printer',
      connected: false,
      error: errorMsg
    };
  }
}

/**
 * Ensure the Bluetooth device GATT server and characteristic are connected.
 * This is crucial for mobile and battery-powered thermal printers that often disconnect aggressively.
 */
async function ensureBluetoothGattConnected(): Promise<boolean> {
  if (!bluetoothDeviceCache) {
    return false;
  }

  try {
    if (bluetoothDeviceCache.gatt?.connected && bluetoothCharacteristicCache) {
      return true;
    }

    console.log('Bluetooth GATT Server is disconnected. Reconnecting...');
    
    // Wire up global disconnect listener again on reconnection
    bluetoothDeviceCache.removeEventListener('gattserverdisconnected', handleBluetoothDisconnect);
    bluetoothDeviceCache.addEventListener('gattserverdisconnected', handleBluetoothDisconnect);

    const server = await bluetoothDeviceCache.gatt?.connect();
    if (!server) {
      throw new Error('Koneksi Gagal: GATT Server tidak merespon saat dihubungkan kembali.');
    }

    // Discover the primary services and write characteristic again after reconnection
    console.log('Discovering primary services after reconnection...');
    const services = await server.getPrimaryServices();
    let writeChar: any = null;

    if (services) {
      for (const service of services) {
        const characteristics = await service.getCharacteristics();
        for (const char of characteristics) {
          if (char.properties.write || char.properties.writeWithoutResponse) {
            writeChar = char;
            break;
          }
        }
        if (writeChar) break;
      }
    }

    if (!writeChar) {
      throw new Error('Koneksi Gagal: Printer terhubung kembali, tetapi karakteristik penulisan data (write characteristic) tidak ditemukan.');
    }

    bluetoothCharacteristicCache = writeChar;
    console.log('Successfully re-established Bluetooth write characteristic.');
    return true;
  } catch (err: any) {
    console.error('Error in ensureBluetoothGattConnected:', err);
    const errMsg = err.message || '';
    if (err.name === 'NetworkError' || errMsg.includes('failed') || errMsg.includes('disconnected') || errMsg.includes('GATT') || errMsg.includes('connection') || errMsg.includes('connect')) {
      throw new Error('Sambungan ke printer Bluetooth terputus atau gagal tersambung kembali. Pastikan printer menyala, berjarak dekat, daya baterai cukup, dan tidak terpairing ke handphone/perangkat lain secara eksklusif. Silakan nyalakan ulang bluetooth/printer dan klik Pair ulang di tab Profil Toko jika perlu.');
    }
    throw err;
  }
}

/**
 * Dispatch byte streams to the connected active thermal printer hardware
 */
export async function sendToActivePrinter(data: Uint8Array): Promise<boolean> {
  // Try Bluetooth first if a device has been paired
  if (bluetoothDeviceCache || bluetoothCharacteristicCache) {
    const isReady = await ensureBluetoothGattConnected();
    if (isReady && bluetoothCharacteristicCache) {
      try {
        // Split buffer chunk into smaller 20-byte arrays to comply with MTU limitations of thermal BLE devices
        const mtu = 20;
        for (let i = 0; i < data.length; i += mtu) {
          const chunk = data.slice(i, i + mtu);
          // Try with fallback for writeValue without response if writeValue is not optimal or throws
          await bluetoothCharacteristicCache.writeValue(chunk);
          // 15ms pacing delay gives the printer's microcontroller sufficient time to digest packets and avoid buffer overflow
          await sleep(15);
        }
        return true;
      } catch (e: any) {
        console.error('BLE write failed:', e);
        // If it failed because it disconnected or server was lost, try to reconnect one more time
        if (e.message?.includes('disconnected') || e.message?.includes('GATT') || e.message?.includes('connect')) {
          console.log('Disconnected during transfer. Attempting Bluetooth reconnection and retry...');
          const retryReady = await ensureBluetoothGattConnected();
          if (retryReady && bluetoothCharacteristicCache) {
            try {
              const mtu = 20;
              for (let i = 0; i < data.length; i += mtu) {
                const chunk = data.slice(i, i + mtu);
                await bluetoothCharacteristicCache.writeValue(chunk);
                await sleep(15);
              }
              return true;
            } catch (retryErr: any) {
              console.error('BLE retry write failed:', retryErr);
              throw new Error(`Koneksi Bluetooth terputus saat pencetakan: ${retryErr.message || 'GATT write error'}`);
            }
          }
        }
        throw new Error(`Gagal mengirim data Bluetooth: ${e.message || 'GATT write error'}`);
      }
    }
  }

  // Try Web USB second
  if (usbDeviceCache) {
    try {
      // Find endpoints for data output
      const endpointNumber = 1; // Generic endpoint out
      await usbDeviceCache.transferOut(endpointNumber, data);
      return true;
    } catch (e: any) {
      console.error('USB transfer failed:', e);
      throw new Error(`Gagal mengirim data melalui USB: ${e.message || 'transferOut error'}`);
    }
  }

  return false;
}
