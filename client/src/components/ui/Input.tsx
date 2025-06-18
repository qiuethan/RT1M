import { forwardRef } from 'react';

interface InputProps {
  label?: string;
  type?: string;
  placeholder?: string;
  value?: string | number;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  onKeyDown,
  error,
  required = false,
  disabled = false,
  className = ''
}, ref) => {
  const inputClasses = `
    block w-full px-3 py-2 border border-surface-300 rounded-md shadow-sm
    placeholder-surface-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500
    disabled:bg-surface-100 disabled:cursor-not-allowed
    ${error ? 'border-error-500 focus:ring-error-500 focus:border-error-500' : ''}
    ${className}
  `;

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-surface-700 mb-2">
          {label}
          {required && <span className="text-error-500 ml-1">*</span>}
        </label>
      )}
      <input
        ref={ref}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        required={required}
        disabled={disabled}
        className={inputClasses}
      />
      {error && (
        <p className="mt-1 text-sm text-error-500">{error}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input; 