import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility function to merge Tailwind CSS classes
 * Combines clsx and tailwind-merge for conditional class names
 * @param inputs - Class values to merge
 * @returns Merged class string
 * @example
 * cn('px-2 py-1', isActive && 'bg-primary', 'rounded-lg')
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
