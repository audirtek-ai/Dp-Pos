/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { RecipeItem, OverheadItem } from './types';

/**
 * Format number into Indonesian Rupiah (Rp)
 */
export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(amount);
}

/**
 * Format simple percentage
 */
export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

/**
 * Calculate totals for recipe ingredients
 */
export function calculateIngredientsTotal(items: RecipeItem[]): number {
  return items.reduce((sum, item) => sum + (item.amountNeeded * item.unitPrice), 0);
}

/**
 * Calculate totals for overhead items
 */
export function calculateOverheadsTotal(items: OverheadItem[]): number {
  return items.reduce((sum, item) => sum + item.cost, 0);
}

/**
 * Formats date into readable Indonesian format
 */
export function formatDate(isoString: string): string {
  const date = new Date(isoString);
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date);
}
