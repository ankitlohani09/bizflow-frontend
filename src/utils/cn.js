import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * utility to merge tailwind classes safely
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
