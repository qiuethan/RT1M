import { forwardRef } from 'react';

interface Option {
  value: string;
  label: string;
}

interface SelectProps {
  label?: string;
  value?: string | null;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: Option[];
  error?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(({
  label,
  value,
  onChange,
  options,
  error,
  required = false,
  disabled = false,
  className = '',
  placeholder
}, ref) => {
  const selectClasses = `
    block w-full px-3 py-2 border border-surface-300 rounded-md shadow-sm
    focus:outline-none focus:ring-primary-500 focus:border-primary-500
    disabled:bg-surface-100 disabled:cursor-not-allowed
    bg-white text-surface-900
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
      <select
        ref={ref}
        value={value ?? ''}
        onChange={onChange}
        required={required}
        disabled={disabled}
        className={selectClasses}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="mt-1 text-sm text-error-500">{error}</p>
      )}
    </div>
  );
});

Select.displayName = 'Select';

export default Select; 