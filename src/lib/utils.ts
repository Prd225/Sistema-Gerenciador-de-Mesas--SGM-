import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function timeAgo(timestamp: number): string {
  const diffMs = Date.now() - timestamp;
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Menos de 1 minuto';
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 1) return `Há ${diffMins} min`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 1) return `Há ${diffHours} h`;
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 1) return `Há ${diffDays} dias`;
  const diffYears = Math.floor(diffMonths / 12);
  if (diffYears < 1) return `Há ${diffMonths} meses`;
  return `Há ${diffYears} anos`;
}
