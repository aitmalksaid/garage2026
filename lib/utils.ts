import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formate un nombre au format français (12.000,40)
 */
export function formatFrenchNumber(value: number, decimals = 2): string {
  return value
    .toFixed(decimals)
    .replace(".", ",")
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".")
}

/**
 * Parse un nombre au format français vers un nombre JavaScript
 */
export function parseFrenchNumber(value: string): number {
  if (!value || value.trim() === "") return 0

  // Remplace les points (milliers) par rien et les virgules (décimales) par des points
  const cleanValue = value
    .replace(/\./g, "") // Supprime les séparateurs de milliers
    .replace(",", ".") // Remplace la virgule décimale par un point

  const parsed = Number.parseFloat(cleanValue)
  return isNaN(parsed) ? 0 : parsed
}

/**
 * Formate une valeur d'input pour l'affichage français
 */
export function formatInputValue(value: number | string): string {
  if (typeof value === "string") {
    const parsed = parseFrenchNumber(value)
    return formatFrenchNumber(parsed)
  }
  return formatFrenchNumber(value)
}
