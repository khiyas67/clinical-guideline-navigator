/**
 * Clinical Navigator - Centralized Validation Utilities
 * Enforces strict clinical, demographic, and authentication validation rules.
 */

export interface ValidationResult<T = string> {
  isValid: boolean;
  error?: string;
  normalized?: T;
}

/**
 * Validates an email address.
 * - Rejects leading/trailing whitespace.
 * - Rejects any spaces within the email.
 * - Enforces valid username, @ symbol, valid domain, and TLD >= 2 chars.
 */
export function validateEmail(
  email: string | undefined | null,
  options: { required?: boolean } = { required: true }
): ValidationResult<string> {
  const { required = true } = options;

  if (email === undefined || email === null || email === '') {
    if (required) {
      return { isValid: false, error: 'Email address is required.' };
    }
    return { isValid: true, normalized: '' };
  }

  // Reject whitespace-only input
  if (!email.trim()) {
    if (required) {
      return { isValid: false, error: 'Email address cannot be empty or whitespace.' };
    }
    return { isValid: true, normalized: '' };
  }

  // Reject leading or trailing whitespace
  if (email.startsWith(' ') || email.endsWith(' ') || email.startsWith('\t') || email.endsWith('\t')) {
    return { isValid: false, error: 'Email address must not contain leading or trailing spaces.' };
  }

  // Reject any whitespace inside email
  if (/\s/.test(email)) {
    return { isValid: false, error: 'Email address must not contain spaces.' };
  }

  // Validate presence and count of @
  const atCount = (email.match(/@/g) || []).length;
  if (atCount === 0) {
    return { isValid: false, error: "Email must include an '@' symbol." };
  }
  if (atCount > 1) {
    return { isValid: false, error: "Email must contain only one '@' symbol." };
  }

  const [localPart, domainPart] = email.split('@');

  if (!localPart) {
    return { isValid: false, error: "Email must have a mailbox name before the '@' symbol." };
  }
  if (localPart.length > 64) {
    return { isValid: false, error: "Email mailbox name before '@' cannot exceed 64 characters." };
  }

  if (!domainPart) {
    return { isValid: false, error: "Email must have a domain name after the '@' symbol." };
  }

  // Domain structure checks
  if (!domainPart.includes('.')) {
    return { isValid: false, error: "Email domain must include a top-level domain (e.g. .com, .org, .in)." };
  }

  if (domainPart.startsWith('.') || domainPart.endsWith('.')) {
    return { isValid: false, error: 'Email domain cannot start or end with a dot.' };
  }

  if (domainPart.startsWith('-') || domainPart.endsWith('-')) {
    return { isValid: false, error: 'Email domain cannot start or end with a hyphen.' };
  }

  const domainLabels = domainPart.split('.');
  const tld = domainLabels[domainLabels.length - 1];

  if (!tld || tld.length < 2 || !/^[a-zA-Z]+$/.test(tld)) {
    return { isValid: false, error: 'Email top-level domain must contain at least 2 letters (e.g. .com, .in).' };
  }

  for (const label of domainLabels) {
    if (!label) {
      return { isValid: false, error: 'Email domain contains consecutive dots.' };
    }
    if (!/^[a-zA-Z0-9-]+$/.test(label)) {
      return { isValid: false, error: 'Email domain contains invalid characters.' };
    }
  }

  // Full RFC 5322 compliant regex check
  const rfcEmailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  if (!rfcEmailRegex.test(email)) {
    return { isValid: false, error: 'Please enter a valid email address (e.g. doctor@hospital.com).' };
  }

  return { isValid: true, normalized: email.trim().toLowerCase() };
}

/**
 * Validates Indian Mobile Numbers.
 * - Accept valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.
 * - Allows optional +91, 91, or leading 0 prefix.
 * - Normalizes stored number to `+91 XXXXXXXXXX`.
 * - Rejects numbers with < or > 10 mobile digits.
 * - Rejects alphabetic characters, symbols, or whitespace-only input.
 */
export function validateIndianPhoneNumber(
  phone: string | undefined | null,
  options: { required?: boolean } = { required: false }
): ValidationResult<string> {
  const { required = false } = options;

  if (phone === undefined || phone === null || phone === '') {
    if (required) {
      return { isValid: false, error: 'Contact number is required.' };
    }
    return { isValid: true, normalized: '' };
  }

  const trimmed = phone.trim();

  if (!trimmed) {
    if (required) {
      return { isValid: false, error: 'Contact number cannot be empty or whitespace.' };
    }
    return { isValid: true, normalized: '' };
  }

  // Reject alphabetic characters
  if (/[a-zA-Z]/.test(trimmed)) {
    return { isValid: false, error: 'Contact number cannot contain letters.' };
  }

  // Strip allowed formatting characters: spaces, hyphens, parentheses, plus
  const cleaned = trimmed.replace(/[\s\-\(\)]/g, '');

  // Check for invalid characters remaining (only digits and leading plus allowed)
  if (!/^\+?\d+$/.test(cleaned)) {
    return { isValid: false, error: 'Contact number contains invalid symbols. Only digits, hyphens, and optional +91 are allowed.' };
  }

  let digits = cleaned;
  if (digits.startsWith('+91')) {
    digits = digits.substring(3);
  } else if (digits.startsWith('91') && digits.length === 12) {
    digits = digits.substring(2);
  } else if (digits.startsWith('0') && digits.length === 11) {
    digits = digits.substring(1);
  } else if (digits.startsWith('+')) {
    return { isValid: false, error: 'Only Indian country code (+91) is supported.' };
  }

  if (digits.length < 10) {
    return { isValid: false, error: `Indian mobile number has only ${digits.length} digits; exactly 10 digits are required.` };
  }

  if (digits.length > 10) {
    return { isValid: false, error: `Indian mobile number has ${digits.length} digits; exactly 10 digits are required (excluding +91).` };
  }

  // Indian mobile numbers must start with 6, 7, 8, or 9
  if (!/^[6-9]/.test(digits)) {
    return { isValid: false, error: 'Indian mobile numbers must begin with 6, 7, 8, or 9.' };
  }

  // Normalized format: +91 9876543210
  return { isValid: true, normalized: `+91 ${digits}` };
}

/**
 * Validates Patient Full Name.
 * - Required.
 * - Reject whitespace-only.
 * - Reject numeric digits or inappropriate symbols.
 * - Allow standard Indian and international names, spaces, hyphens, dots, apostrophes.
 */
export function validatePatientName(name: string | undefined | null): ValidationResult<string> {
  if (!name || !name.trim()) {
    return { isValid: false, error: 'Patient full name is required.' };
  }

  const trimmed = name.trim();

  if (trimmed.length < 2) {
    return { isValid: false, error: 'Patient name must be at least 2 characters.' };
  }

  if (trimmed.length > 100) {
    return { isValid: false, error: 'Patient name cannot exceed 100 characters.' };
  }

  // Reject numbers
  if (/\d/.test(trimmed)) {
    return { isValid: false, error: 'Patient name cannot contain numbers.' };
  }

  // Allow alphabetic characters, spaces, dots, hyphens, apostrophes (e.g. Dr. A. Sharma, O'Connor, Mary-Jane)
  const nameRegex = /^[a-zA-Z\s.'\-]+$/;
  if (!nameRegex.test(trimmed)) {
    return { isValid: false, error: 'Patient name contains invalid special characters.' };
  }

  // Must contain at least two letters
  const letterCount = (trimmed.match(/[a-zA-Z]/g) || []).length;
  if (letterCount < 2) {
    return { isValid: false, error: 'Patient name must contain at least 2 alphabetic letters.' };
  }

  return { isValid: true, normalized: trimmed };
}

/**
 * Validates Patient Age.
 * - Must be numeric.
 * - Reject negative numbers.
 * - Reject zero (minimum 1 year for this application).
 * - Maximum sensible age 125.
 */
export function validatePatientAge(age: number | string | undefined | null): ValidationResult<number> {
  if (age === undefined || age === null || age === '') {
    return { isValid: false, error: 'Patient age is required.' };
  }

  const parsed = typeof age === 'number' ? age : Number(String(age).trim());

  if (isNaN(parsed) || !Number.isInteger(parsed)) {
    return { isValid: false, error: 'Age must be a valid whole number.' };
  }

  if (parsed < 0) {
    return { isValid: false, error: 'Age cannot be a negative number.' };
  }

  if (parsed === 0) {
    return { isValid: false, error: 'Age must be at least 1 year.' };
  }

  if (parsed > 125) {
    return { isValid: false, error: 'Age must be a realistic number between 1 and 125.' };
  }

  return { isValid: true, normalized: parsed };
}

/**
 * Validates password according to authentication requirements.
 */
export function validatePassword(password: string | undefined | null): ValidationResult<string> {
  if (!password) {
    return { isValid: false, error: 'Password is required.' };
  }

  if (password.length < 6) {
    return { isValid: false, error: 'Password must be at least 6 characters long.' };
  }

  return { isValid: true, normalized: password };
}

