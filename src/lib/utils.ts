import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Consistent date formatting to prevent hydration errors
export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    
    // Check if date is valid
    if (isNaN(dateObj.getTime())) {
      return 'Invalid Date'
    }
    
    const defaultOptions: Intl.DateTimeFormatOptions = {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      ...options
    }
    
    // Use en-GB for consistent DD/MM/YYYY format across server and client
    return dateObj.toLocaleDateString('en-GB', defaultOptions)
  } catch (error) {
    console.warn('Error formatting date:', error)
    return 'Invalid Date'
  }
}
