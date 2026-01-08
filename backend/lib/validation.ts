/**
 * Input validation utilities to prevent SQL injection and ensure data integrity
 */

/**
 * Validates and sanitizes a string input for SQL queries
 * @param input - The input string to validate
 * @param maxLength - Maximum allowed length
 * @returns Sanitized string or throws error if invalid
 */
export function validateString(input: unknown, maxLength: number = 255): string {
  if (typeof input !== 'string') {
    throw new Error('Input must be a string');
  }
  
  // Remove null bytes and trim
  let sanitized = input.replace(/\0/g, '').trim();
  
  // Check length
  if (sanitized.length > maxLength) {
    throw new Error(`Input exceeds maximum length of ${maxLength} characters`);
  }
  
  // Check for potentially dangerous SQL patterns
  const dangerousPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|SCRIPT)\b)/gi,
    /(--|;|\/\*|\*\/|xp_|sp_)/gi,
  ];
  
  for (const pattern of dangerousPatterns) {
    if (pattern.test(sanitized)) {
      throw new Error('Input contains potentially dangerous SQL patterns');
    }
  }
  
  return sanitized;
}

/**
 * Validates a numeric ID
 * @param input - The input to validate
 * @returns Validated number or throws error if invalid
 */
export function validateId(input: unknown): number {
  const num = typeof input === 'number' ? input : parseInt(String(input), 10);
  
  if (isNaN(num) || num <= 0 || !Number.isInteger(num)) {
    throw new Error('Invalid ID: must be a positive integer');
  }
  
  return num;
}

/**
 * Validates an array of strings (e.g., tags)
 * @param input - The input to validate
 * @param maxItems - Maximum number of items allowed
 * @returns Validated string array or throws error if invalid
 */
export function validateStringArray(input: unknown, maxItems: number = 50): string[] {
  if (!Array.isArray(input)) {
    throw new Error('Input must be an array');
  }
  
  if (input.length > maxItems) {
    throw new Error(`Array exceeds maximum length of ${maxItems} items`);
  }
  
  return input.map((item, index) => {
    if (typeof item !== 'string') {
      throw new Error(`Array item at index ${index} must be a string`);
    }
    return validateString(item, 100);
  });
}

/**
 * Validates category name
 * @param input - The input to validate
 * @returns Validated category string
 */
export function validateCategory(input: unknown): string {
  const validCategories = [
    'nature', 'business', 'travel', 'people', 
    'abstract', 'food', 'technology', 'architecture'
  ];
  
  const category = validateString(input as string, 50).toLowerCase();
  
  if (!validCategories.includes(category)) {
    throw new Error(`Invalid category. Must be one of: ${validCategories.join(', ')}`);
  }
  
  return category;
}

/**
 * Validates image type
 * @param input - The input to validate
 * @returns Validated image type
 */
export function validateImageType(input: unknown): 'photo' | 'illustration' | 'icon' {
  const validTypes: Array<'photo' | 'illustration' | 'icon'> = ['photo', 'illustration', 'icon'];
  const type = String(input).toLowerCase();
  
  if (!validTypes.includes(type as any)) {
    throw new Error(`Invalid image type. Must be one of: ${validTypes.join(', ')}`);
  }
  
  return type as 'photo' | 'illustration' | 'icon';
}

/**
 * Validates URL
 * @param input - The input to validate
 * @returns Validated URL string
 */
export function validateUrl(input: unknown): string {
  const url = validateString(input as string, 2048);
  
  try {
    const urlObj = new URL(url);
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      throw new Error('URL must use http or https protocol');
    }
    return url;
  } catch {
    throw new Error('Invalid URL format');
  }
}

/**
 * Validates pagination parameters
 * @param limit - Limit parameter
 * @param offset - Offset parameter
 * @returns Validated pagination object
 */
export function validatePagination(limit: unknown, offset: unknown): { limit: number; offset: number } {
  const limitNum = typeof limit === 'number' ? limit : parseInt(String(limit || '40'), 10);
  const offsetNum = typeof offset === 'number' ? offset : parseInt(String(offset || '0'), 10);
  
  if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
    throw new Error('Limit must be between 1 and 100');
  }
  
  if (isNaN(offsetNum) || offsetNum < 0) {
    throw new Error('Offset must be a non-negative number');
  }
  
  return { limit: limitNum, offset: offsetNum };
}
