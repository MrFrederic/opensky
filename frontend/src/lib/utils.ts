import { type ClassValue, clsx } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatDate(date: Date | string): string {
  if (typeof date === 'string') {
    date = new Date(date);
  }
  return date.toLocaleDateString('de-DE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export function formatDateTime(date: Date | string): string {
  if (typeof date === 'string') {
    date = new Date(date);
  }
  return date.toLocaleString('de-DE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Formats a date consistently in dd.mm.yyyy format
 * Use this function throughout the app for consistent date display
 */
export function formatDateConsistent(dateString: string): string {
  return new Date(dateString).toLocaleDateString('de-DE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export function formatUserName(user: { first_name: string; last_name: string; username?: string; display_name?: string }): string {
  if (user.display_name) {
    return user.display_name;
  }
  const fullName = `${user.first_name} ${user.last_name}`.trim();
  return fullName || user.username || 'Unknown User';
}

export function formatMultiRoles(roles: string[]): string {
  const roleLabels: Record<string, string> = {
    tandem_jumper: 'Tandem Jumper',
    aff_student: 'AFF Student',
    sport_paid: 'Sport Jumper (Paid)',
    sport_free: 'Sport Jumper (Free)',
    tandem_instructor: 'Tandem Instructor',
    aff_instructor: 'AFF Instructor',
    administrator: 'Administrator',
  };
  
  const formattedRoles = roles.map(role => roleLabels[role] || role);
  return formattedRoles.join(', ');
}

export function formatSingleRole(role: string): string {
  const roleLabels: Record<string, string> = {
    tandem_jumper: 'Tandem Jumper',
    aff_student: 'AFF Student',
    sport_paid: 'Sport Jumper (Paid)',
    sport_free: 'Sport Jumper (Free)',
    tandem_instructor: 'Tandem Instructor',
    aff_instructor: 'AFF Instructor',
    administrator: 'Administrator',
  };
  
  return roleLabels[role] || role;
}

// Legacy function - deprecated, use formatUserRoles instead
export function getUserStatusLabel(status: string): string {
  const statusLabels: Record<string, string> = {
    newby: 'Newby',
    individual_sportsman: 'Individual Sportsman',
    sportsman: 'Sportsman',
    instructor: 'Instructor',
  };
  return statusLabels[status] || status;
}

export function getManifestStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending: 'text-yellow-600 bg-yellow-100',
    approved: 'text-green-600 bg-green-100',
    declined: 'text-red-600 bg-red-100',
  };
  return colors[status] || 'text-gray-600 bg-gray-100';
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
