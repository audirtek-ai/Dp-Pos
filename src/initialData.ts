/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Ingredient, Product, Transaction } from './types';

export const INITIAL_INGREDIENTS: Ingredient[] = [
  { id: 'ing_1', name: 'Tepung Terigu Segitiga Biru', unit: 'Kg', price: 14000, stock: 15, minStock: 5 },
  { id: 'ing_2', name: 'Gula Pasir Putih', unit: 'Kg', price: 16000, stock: 2, minStock: 5 },
  { id: 'ing_3', name: 'Telur Ayam Segar', unit: 'Kg', price: 28000, stock: 1.5, minStock: 3 },
  { id: 'ing_4', name: 'Butter / Mentega Wisman', unit: 'Kg', price: 280000, stock: 6, minStock: 2 },
  { id: 'ing_5', name: 'Chocolate Compound Dark', unit: 'Kg', price: 72000, stock: 0.8, minStock: 2 },
  { id: 'ing_6', name: 'Kopi Espresso Premium', unit: 'Liter', price: 60000, stock: 12, minStock: 4 },
  { id: 'ing_7', name: 'Susu UHT Full Cream', unit: 'Liter', price: 18000, stock: 3, minStock: 10 },
  { id: 'ing_8', name: 'Gula Aren Cair murni', unit: 'Liter', price: 40000, stock: 8, minStock: 2 },
  { id: 'ing_9', name: 'Cup Plastik PET 16oz', unit: 'Pcs', price: 800, stock: 150, minStock: 50 },
  { id: 'ing_10', name: 'Dus Kemasan Craft Brownies', unit: 'Pcs', price: 1500, stock: 15, minStock: 20 },
  { id: 'ing_11', name: 'Mika Box Plastik Kecil', unit: 'Pcs', price: 600, stock: 80, minStock: 25 },
  { id: 'ing_12', name: 'Minyak Goreng Sawit', unit: 'Liter', price: 17500, stock: 5, minStock: 2 }
];

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod_1',
    name: 'Kopi Susu Gula Aren (Batch 10 Cup)',
    category: 'Minuman',
    description: 'Kopi susu kekinian dengan gula aren premium, disajikan dingin. HPP dihitung untuk 1 batch pembuatan (10 cup).',
    batchSize: 10,
    ingredients: [
      {
        id: 'rec_1_1',
        ingredientId: 'ing_6',
        name: 'Kopi Espresso Premium',
        amountNeeded: 1.2,
        unit: 'Liter',
        unitPrice: 60000,
        totalCost: 72000
      },
      {
        id: 'rec_1_2',
        ingredientId: 'ing_7',
        name: 'Susu UHT Full Cream',
        amountNeeded: 1.5,
        unit: 'Liter',
        unitPrice: 18000,
        totalCost: 27000
      },
      {
        id: 'rec_1_3',
        ingredientId: 'ing_8',
        name: 'Gula Aren Cair murni',
        amountNeeded: 0.3,
        unit: 'Liter',
        unitPrice: 40000,
        totalCost: 12000
      }
    ],
    laborCost: 15000, // Rp 15.000 Jasa pembuatan/seduh 10 cup
    overheads: [
      { id: 'ov_1_1', name: 'Cup Plastik PET 16oz', cost: 8000 }, // 10 cup x 800
      { id: 'ov_1_2', name: 'Sedotan steril & Kantong Plastik', cost: 2000 }
    ],
    totalIngredientsCost: 111000, // 72000 + 27000 + 12000
    totalOverheadsCost: 10000, // 8000 + 2000
    totalHppPerBatch: 136000, // 111000 + 10000 + 15000
    calculatedHppPerUnit: 13600, // 136000 / 10
    
    sellingPrice: 20000,
    markupPercent: 47.05,
    profitAmount: 6400,
    marginPercent: 32.0,
    imageUrl: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'prod_2',
    name: 'Brownies Panggang Cokelat Premium',
    category: 'Makanan',
    description: 'Brownies panggang dengan tekstur fudgy, menggunakan butter Wisman dan cokelat berkualitas. HPP dihitung untuk 4 loyang.',
    batchSize: 4,
    ingredients: [
      {
        id: 'rec_2_1',
        ingredientId: 'ing_1',
        name: 'Tepung Terigu Segitiga Biru',
        amountNeeded: 0.5,
        unit: 'Kg',
        unitPrice: 14000,
        totalCost: 7000
      },
      {
        id: 'rec_2_2',
        ingredientId: 'ing_2',
        name: 'Gula Pasir Putih',
        amountNeeded: 0.8,
        unit: 'Kg',
        unitPrice: 16000,
        totalCost: 12800
      },
      {
        id: 'rec_2_3',
        ingredientId: 'ing_3',
        name: 'Telur Ayam Segar',
        amountNeeded: 1.0,
        unit: 'Kg',
        unitPrice: 28000,
        totalCost: 28000
      },
      {
        id: 'rec_2_4',
        ingredientId: 'ing_4',
        name: 'Butter / Mentega Wisman',
        amountNeeded: 0.3,
        unit: 'Kg',
        unitPrice: 280000,
        totalCost: 84000
      },
      {
        id: 'rec_2_5',
        ingredientId: 'ing_5',
        name: 'Chocolate Compound Dark',
        amountNeeded: 0.5,
        unit: 'Kg',
        unitPrice: 72000,
        totalCost: 36000
      }
    ],
    laborCost: 40000, // Upah pembuatan 4 loyang
    overheads: [
      { id: 'ov_2_1', name: 'Dus Kemasan Craft Brownies', cost: 6000 }, // 4 dus x 1500
      { id: 'ov_2_2', name: 'Gas LPG & Kertas Roti', cost: 9000 }
    ],
    totalIngredientsCost: 167800, // 7000 + 12800 + 28000 + 84000 + 36000
    totalOverheadsCost: 15000, // 6000 + 9000
    totalHppPerBatch: 222800, // 167800 + 15000 + 40000
    calculatedHppPerUnit: 55700, // 222800 / 4
    
    sellingPrice: 85000,
    markupPercent: 52.6,
    profitAmount: 29300,
    marginPercent: 34.47,
    imageUrl: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=600&q=80'
  }
];

export const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx_1',
    invoiceNumber: 'INV-20260607-001',
    timestamp: '2026-06-07T12:30:00Z',
    items: [
      {
        productId: 'prod_1',
        productName: 'Kopi Susu Gula Aren (Batch 10 Cup)',
        quantity: 5,
        sellingPrice: 20000,
        hppPerUnit: 13600,
        totalPrice: 100000,
        totalHpp: 68000,
        totalProfit: 32000
      },
      {
        productId: 'prod_2',
        productName: 'Brownies Panggang Cokelat Premium',
        quantity: 2,
        sellingPrice: 85000,
        hppPerUnit: 55700,
        totalPrice: 170000,
        totalHpp: 111400,
        totalProfit: 58600
      }
    ],
    subtotal: 270000,
    totalSales: 270000,
    totalHpp: 179400,
    totalProfit: 90600,
    amountPaid: 300000,
    change: 30000,
    paymentMethod: 'Tunai'
  },
  {
    id: 'tx_2',
    invoiceNumber: 'INV-20260607-002',
    timestamp: '2026-06-07T14:15:00Z',
    items: [
      {
        productId: 'prod_1',
        productName: 'Kopi Susu Gula Aren (Batch 10 Cup)',
        quantity: 3,
        sellingPrice: 20000,
        hppPerUnit: 13600,
        totalPrice: 60000,
        totalHpp: 40800,
        totalProfit: 19200
      }
    ],
    subtotal: 60000,
    totalSales: 60000,
    totalHpp: 40800,
    totalProfit: 19200,
    amountPaid: 60000,
    change: 0,
    paymentMethod: 'QRIS'
  }
];

export const INITIAL_PROFILE = {
  storeName: 'TOKO MERCHANT SAYA',
  address: 'Jl. Berdikari Kaya No. 10, Jakarta',
  phone: '0812-3456-7890',
  receiptFooter: 'Terima Kasih Atas Kunjungan Anda!'
};

