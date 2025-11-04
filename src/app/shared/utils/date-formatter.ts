/**
 * Utility functions for date formatting across the application
 */

/**
 * Format date to "DD MMM YYYY" format (e.g., "4 Nov 2025")
 * @param date - Date object, ISO string, or date string
 * @returns Formatted date string
 */
export function formatDisplayDate(date: Date | string | null | undefined): string {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) return '';
  
  const day = dateObj.getDate();
  const month = dateObj.toLocaleDateString('en-US', { month: 'short' });
  const year = dateObj.getFullYear();
  
  return `${day} ${month} ${year}`;
}

/**
 * Format date to "MMM DD, YYYY" format (e.g., "Nov 4, 2025")
 * @param date - Date object, ISO string, or date string
 * @returns Formatted date string
 */
export function formatDateWithComma(date: Date | string | null | undefined): string {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) return '';
  
  return dateObj.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}
