// Utility functions

// Date formatting - converts Date to YYYY-MM-DD format
export function toISODate(date: Date): string {
  return date.toISOString().split('T')[0];
}