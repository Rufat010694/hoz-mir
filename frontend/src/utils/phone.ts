/**
 * Strips all non-digit characters and returns the digit string.
 */
export function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

/**
 * Formats raw digits (no separators) into display form: +7 (XXX) XXX-XX-XX.
 * Input must be digits only (e.g. "79051234567").
 */
export function formatDigits(digits: string): string {
  if (!digits) return "";

  // Normalise: 8XXXXXXXXXX → 7XXXXXXXXXX
  const d = digits[0] === "8" ? "7" + digits.slice(1) : digits;

  if (d[0] === "7") {
    const area = d.slice(1, 4);   // 3 digits
    const p1   = d.slice(4, 7);   // 3 digits
    const p2   = d.slice(7, 9);   // 2 digits
    const p3   = d.slice(9, 11);  // 2 digits
    let result = "+7";
    if (area.length)       result += ` (${area}`;
    if (p1.length)         result += `) ${p1}`;
    if (p2.length)         result += `-${p2}`;
    if (p3.length)         result += `-${p3}`;
    return result;
  }

  // Other: keep as +digits
  return `+${d.slice(0, 15)}`;
}

/**
 * Extracts digits from any phone string (formatted or raw) and returns them.
 * Use this in onChange: setPhoneDigits(extractDigits(e.target.value))
 */
export function extractDigits(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  // If starts with 8, normalise to 7
  if (digits.startsWith("8")) return "7" + digits.slice(1, 11);
  return digits.slice(0, 11);
}

/**
 * @deprecated Use formatDigits(phoneDigits) instead.
 * Kept for backward compat — wraps extractDigits + formatDigits.
 */
export function formatPhoneInput(raw: string): string {
  return formatDigits(extractDigits(raw));
}

/**
 * Returns true if the phone number has enough digits to be valid (11 digits).
 */
export function isValidPhone(digits: string): boolean {
  return digitsOnly(digits).length >= 11;
}

/**
 * Returns a validation error string or null if valid.
 */
export function phoneError(digits: string): string | null {
  if (!digits.trim()) return "Введите номер телефона";
  if (!isValidPhone(digits)) return "Номер должен содержать 11 цифр";
  return null;
}
