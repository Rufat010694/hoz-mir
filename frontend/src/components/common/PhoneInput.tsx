import { useState } from "react";
import { autoCompletePhone, extractDigits, formatDigits, phoneError } from "@/utils/phone";

interface PhoneInputProps {
  value: string;           // raw digits
  onChange: (digits: string) => void;
  label?: string;
  required?: boolean;
  touched?: boolean;
}

/**
 * Phone input that stores raw digits and only formats on blur.
 * This avoids the cursor-stuck-at-dash problem on mobile.
 */
export default function PhoneInput({ value, onChange, label, required, touched }: PhoneInputProps) {
  const [isFocused, setIsFocused] = useState(false);

  // While focused: show raw digits so user can edit freely
  // While blurred: show nicely formatted number
  const displayValue = isFocused ? value : (value ? formatDigits(value) : "");

  const err = touched ? phoneError(value) : null;

  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
      <input
        type="text"
        inputMode="numeric"
        value={displayValue}
        required={required}
        placeholder="+7 (___) ___-__-__"
        autoComplete="tel"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        className="w-full px-3 py-2 border border-gray-300 bg-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        onChange={(e) => onChange(extractDigits(e.target.value))}
        onFocus={() => setIsFocused(true)}
        onBlur={() => {
          setIsFocused(false);
          // Auto-prepend country code if user skipped it (10 digits)
          const completed = autoCompletePhone(value);
          if (completed !== value) onChange(completed);
        }}
      />
      {err && <p className="text-xs text-red-500">{err}</p>}
    </div>
  );
}
