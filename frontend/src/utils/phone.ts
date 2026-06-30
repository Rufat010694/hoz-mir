/**
 * Strips all non-digit characters and returns the digit string.
 */
export function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

/**
 * Formats a phone number as user types (Russian/CIS style: +7 (XXX) XXX-XX-XX).
 * Works for any number starting with +7 or 8; otherwise just keeps digits with +.
 */
export function formatPhoneInput(raw: string): string {
  // Keep leading + if user typed it
  const hasPlus = raw.startsWith("+");
  const digits = raw.replace(/\D/g, "");

  if (!digits) return "";

  // Russian / CIS: starts with 7 or 8 → format as +7 (XXX) XXX-XX-XX
  if (digits[0] === "7" || digits[0] === "8") {
    const d = digits.slice(1, 12); // up to 11 digits after country code
    let result = "+7";
    // Add separators only when the NEXT group has digits — avoids trailing dash on backspace
    if (d.length > 0) result += ` (${d.slice(0, 3)}`;
    if (d.length >= 3) result += `)`;
    if (d.length > 3) result += ` ${d.slice(3, 6)}`;
    if (d.length > 6) result += `-${d.slice(6, 8)}`;
    if (d.length > 8) result += `-${d.slice(8, 10)}`;
    return result;
  }

  // Other international: just prepend + and keep digits
  return (hasPlus || digits.length > 10 ? "+" : "") + digits.slice(0, 15);
}

/**
 * Returns true if the phone number has enough digits to be valid (11 digits).
 */
export function isValidPhone(value: string): boolean {
  return digitsOnly(value).length >= 11;
}

/**
 * Returns a validation error string or null if valid.
 */
export function phoneError(value: string): string | null {
  if (!value.trim()) return "Введите номер телефона";
  if (!isValidPhone(value)) return "Номер должен содержать 11 цифр";
  return null;
}
