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
  encoder.push(...Array.from(stringToBytes('-'.repeat(cols) + '\n')));

  // Invoice identifiers
  encoder.push(...ESC_POS_COMMANDS.ALIGN_LEFT);
  encoder.push(...Array.from(stringToBytes(`INV   : ${tx.invoiceNumber}\n`)));
  encoder.push(...Array.from(stringToBytes(`WAKTU : ${new Date(tx.timestamp).toLocaleString('id-ID')}\n`)));
  encoder.push(...Array.from(stringToBytes(`METODE: ${tx.paymentMethod}\n`)));
  
  encoder.push(...Array.from(stringToBytes('-'.repeat(cols) + '\n')));

  // Items table
  tx.items.forEach(item => {
    // Left column: product name
    // Right column: total price
    // Sub-row: quantity sold x price
    const nameStr = item.productName || 'Menu';
    const totalStr = `Rp ${(item.totalPrice).toLocaleString('id-ID')}`;
    const qtyStr = `${item.quantity}x Rp ${(item.sellingPrice).toLocaleString('id-ID')}`;

    if (nameStr.length + totalStr.length + 1 <= cols) {
      // Fit in one line
      const spaceCount = cols - (nameStr.length + totalStr.length);
      encoder.push(...Array.from(stringToBytes(nameStr + ' '.repeat(spaceCount) + totalStr + '\n')));
    } else {
      // Truncate or flow product name, then total on right
      encoder.push(...Array.from(stringToBytes(nameStr + '\n')));
      const spaceCount = cols - totalStr.length;
      encoder.push(...Array.from(stringToBytes(' '.repeat(spaceCount) + totalStr + '\n')));
    }
    // Sub-details row
    encoder.push(...Array.from(stringToBytes('  ' + qtyStr + '\n')));
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
  const paidLabel = 'Uang Diterima:';
  const paidSpace = cols - (paidLabel.length + paidStr.length);
  encoder.push(...Array.from(stringToBytes(paidLabel + ' '.repeat(Math.max(1, paidSpace)) + paidStr + '\n')));

  const changeStr = `Rp ${(tx.change).toLocaleString('id-ID')}`;
  const changeLabel = 'Uang Kembalian:';
  const changeSpace = cols - (changeLabel.length + changeStr.length);
  encoder.push(...Array.from(stringToBytes(changeLabel + ' '.repeat(Math.max(1, changeSpace)) + changeStr + '\n')));

  encoder.push(...Array.from(stringToBytes('-'.repeat(cols) + '\n')));

  // Receipt Footer Banner
  encoder.push(...ESC_POS_COMMANDS.ALIGN_CENTER);
  encoder.push(...ESC_POS_COMMANDS.BOLD_ON);
  encoder.push(...Array.from(stringToBytes((profile.receiptFooter || 'TERIMA KASIH').toUpperCase() + '\n')));
  encoder.push(...ESC_POS_COMMANDS.BOLD_OFF);
  encoder.push(...Array.from(stringToBytes('Sistem Kasir Pintar HPPOS\n')));
  
  // Extra feeds & cuts
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
  encoder.push(...Array.from(stringToBytes('-'.repeat(cols) + '\n')));
  encoder.push(...Array.from(stringToBytes((profile.storeName || 'COBA KASIR HPPOS').toUpperCase() + '\n')));
  encoder.push(...Array.from(stringToBytes('Koneksi Printer Berhasil Aktif!\n')));
  encoder.push(...Array.from(stringToBytes('-'.repeat(cols) + '\n')));
  encoder.push(...Array.from(stringToBytes(`Waktu: ${new Date().toLocaleString()}\n`)));
  encoder.push(...ESC_POS_COMMANDS.FEED_2);
  encoder.push(...ESC_POS_COMMANDS.FEED_3_CUT);
  return new Uint8Array(encoder);
}

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
        '0000ff00-0000-1000-8000-00805f9b34fb', // Alternate generic write services
        'element-printer-service'
      ]
    });

    if (!device) {
      throw new Error('Tidak ada perangkat printer bluetooth terpilih.');
    }

    bluetoothDeviceCache = device;
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
    return {
      type: 'bluetooth',
      name: 'Printer Bluetooth',
      connected: false,
      error: err.message || 'Gagal menyambung perangkat BT'
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
    return {
      type: 'usb',
      name: 'USB Printer',
      connected: false,
      error: err.message || 'Gagal menyambung USB'
    };
  }
}

/**
 * Dispatch byte streams to the connected active thermal printer hardware
 */
export async function sendToActivePrinter(data: Uint8Array): Promise<boolean> {
  // Try Bluetooth first
  if (bluetoothCharacteristicCache) {
    try {
      // Split buffer chunk into smaller 20-byte arrays to comply with MTU limitations of thermal BLE devices
      const mtu = 20;
      for (let i = 0; i < data.length; i += mtu) {
        const chunk = data.slice(i, i + mtu);
        await bluetoothCharacteristicCache.writeValue(chunk);
      }
      return true;
    } catch (e) {
      console.error('BLE write failed:', e);
    }
  }

  // Try Web USB second
  if (usbDeviceCache) {
    try {
      // Find endpoints for data output
      const endpointNumber = 1; // Generic endpoint out
      await usbDeviceCache.transferOut(endpointNumber, data);
      return true;
    } catch (e) {
      console.error('USB transfer failed:', e);
    }
  }

  return false;
}
