/**
 * TECHNICAL UTILITY: Tailwind CSS class merger and optimizer
 * 
 * PURPOSE: Combines and optimizes multiple Tailwind CSS classes
 * Removes conflicting classes and merges similar utilities
 * 
 * BUSINESS VALUE: Ensures consistent styling across components
 * Prevents CSS conflicts and reduces bundle size
 * 
 * @param inputs - Array of Tailwind CSS class strings
 * @returns Optimized and merged CSS class string
 * 
 * @example
 * mergeTailwindClasses('px-2', 'px-4', 'py-2') // Returns: 'px-4 py-2'
 * mergeTailwindClasses('bg-red-500', 'bg-blue-500') // Returns: 'bg-blue-500'
 */

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function mergeTailwindClasses(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

// Legacy alias for backward compatibility
export const cn = mergeTailwindClasses;









