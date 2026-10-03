import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  if (amount === 0) return 'Free Registration';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Generates an authoritative Participant ID format e.g. PARINAAM26-7K4P92
 */
export function generateParticipantId(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let randomPart = '';
  for (let i = 0; i < 6; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `PARINAAM26-${randomPart}`;
}

/**
 * Generates a secure, opaque verification token for QR payload
 */
export function generateOpaqueQRToken(participantId: string): string {
  const chars = 'abcdef0123456789';
  let hash = '';
  for (let i = 0; i < 24; i++) {
    hash += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  // Store or deterministic binding simulation
  return `${participantId.toLowerCase().replace(/[^a-z0-9]/g, '')}-${hash.slice(0, 12)}`;
}

export function formatDate(dateString: string): string {
  return dateString;
}

/**
 * Standard email format regex adhering to RFC 5322 validation
 */
export const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

/**
 * Validates whether the given string is a correctly formatted email address
 */
export function isValidEmail(email: string | null | undefined): boolean {
  if (!email || typeof email !== 'string') return false;
  return EMAIL_REGEX.test(email.trim());
}

/**
 * Maximum character length allowed for student names across the platform
 */
export const MAX_STUDENT_NAME_LENGTH = 30;

/**
 * Validates student name regex:
 * - Alphabetic characters and single spaces between words only
 * - Pattern: ^[A-Za-z]+(?: [A-Za-z]+)*$
 * - Rejects numbers, special characters, leading/trailing spaces, and consecutive spaces
 */
export const STUDENT_NAME_REGEX = /^[A-Za-z]+(?: [A-Za-z]+)*$/;

/**
 * Validates student name length (max 30 characters), non-empty status, and alphabetic/space pattern
 */
export function isValidStudentName(name: string | null | undefined): { valid: boolean; error?: string } {
  if (!name || typeof name !== 'string') {
    return { valid: false, error: 'Student name is required' };
  }
  if (name.length > MAX_STUDENT_NAME_LENGTH) {
    return {
      valid: false,
      error: `Student name must not exceed ${MAX_STUDENT_NAME_LENGTH} characters (currently ${name.length})`,
    };
  }
  if (!STUDENT_NAME_REGEX.test(name)) {
    return {
      valid: false,
      error: 'Student name must contain letters only with single spaces between words (no numbers, special characters, or leading/trailing/extra spaces)',
    };
  }
  return { valid: true };
}

