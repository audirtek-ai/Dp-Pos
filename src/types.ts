/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Ingredient {
  id: string;
  name: string;
  unit: string; // e.g., 'Gram', 'Kg', 'Liter', 'Ml', 'Pcs'
  price: number; // Price per unit
  stock: number; // Current stock level
  minStock: number; // Minimum safe stock limit
}

export interface RecipeItem {
  id: string;
  ingredientId?: string; // Link to predefined ingredients
  name: string;
  amountNeeded: number;
  unit: string;
  unitPrice: number; // Price per unit of measure
  totalCost: number; // calculated: amountNeeded * unitPrice
}

export interface OverheadItem {
  id: string;
  name: string; // e.g., 'Kemasan/Box', 'Gas LPG', 'Listrik', 'Stiker'
  cost: number;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  description: string;
  batchSize: number; // How many units are produced together (e.g., 50 boxes of cookies)
  ingredients: RecipeItem[];
  laborCost: number; // Total direct labor cost per batch production
  overheads: OverheadItem[];
  
  // Calculated properties
  totalIngredientsCost: number;
  totalOverheadsCost: number;
  totalHppPerBatch: number;
  calculatedHppPerUnit: number;
  
  // Pricing
  sellingPrice: number;
  markupPercent: number; // e.g., ((sellingPrice - hpp)/hpp) * 100
  profitAmount: number; // sellingPrice - hpp
  marginPercent: number; // (profit/sellingPrice) * 100
  imageUrl?: string;
  barcode?: string; // Barcode or SKU for camera scanning
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface TransactionItem {
  productId: string;
  productName: string;
  quantity: number;
  sellingPrice: number;
  hppPerUnit: number;
  totalPrice: number;
  totalHpp: number;
  totalProfit: number;
}

export interface Transaction {
  id: string;
  invoiceNumber: string;
  timestamp: string;
  items: TransactionItem[];
  subtotal: number;
  totalSales: number;
  totalHpp: number;
  totalProfit: number;
  amountPaid: number;
  change: number;
  paymentMethod: string; // e.g., 'Tunai', 'QRIS', 'Transfer'
}

export interface DashboardStats {
  totalRevenue: number;
  totalHpp: number;
  totalProfit: number;
  profitMarginPercent: number;
  totalTransactionsCount: number;
}

export interface StoreProfile {
  storeName: string;
  address: string;
  phone: string;
  receiptFooter: string;
  receiptTheme?: string; // Tampilan invoice: 'classic' | 'retro' | 'elegant' | 'cyber' | 'eco'
  logoUrl?: string; // base64 or URL of the custom store logo
}

