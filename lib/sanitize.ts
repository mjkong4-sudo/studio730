/**
 * Sanitizes HTML content to prevent XSS attacks
 * Allows only safe formatting tags
 * 
 * NOTE: Currently escapes all HTML (same as sanitizeText) to avoid jsdom dependency.
 * If HTML sanitization with allowed tags is needed in the future, consider using
 * a different library that doesn't require jsdom.
 */
export function sanitizeHtml(html: string): string {
  // For now, escape all HTML entities (same as sanitizeText)
  // This prevents XSS while avoiding jsdom dependency issues
  return sanitizeText(html)
}

/**
 * Sanitizes plain text by escaping HTML entities
 */
export function sanitizeText(text: string): string {
  if (!text) return ''
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
}

/**
 * Validates and sanitizes content length
 */
export function validateContentLength(content: string, maxLength: number): { valid: boolean; error?: string } {
  if (content.length > maxLength) {
    return {
      valid: false,
      error: `Content exceeds maximum length of ${maxLength} characters`
    }
  }
  return { valid: true }
}

/**
 * Content length limits
 */
export const CONTENT_LIMITS = {
  RECORD_CONTENT: 5000,
  COMMENT_CONTENT: 1000,
  BIO_CONTENT: 500,
  NICKNAME_LENGTH: 50,
} as const
