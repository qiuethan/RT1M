import { forwardRef } from 'react';

interface TextareaProps {
  label?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  rows?: number;
  className?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({
  label,
  placeholder,
  value,
  onChange,
  onKeyDown,
  error,
  required = false,
  disabled = false,
  rows = 3,
  className = ''
}, ref) => {
  const textareaClasses = `
    block w-full px-2 py-1.5 text-base border border-surface-300 rounded-md shadow-sm
    placeholder-surface-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500
    disabled:bg-surface-100 disabled:cursor-not-allowed resize-vertical
    ${error ? 'border-error-500 focus:ring-error-500 focus:border-error-500' : ''}
    ${className}
  `;

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-surface-700 mb-1">
          {label}
          {required && <span className="text-error-500 ml-1">*</span>}
        </label>
      )}
      <textarea
        ref={ref}
        placeholder={placeholder}
        value={value ?? ''}
        onChange={onChange}
        onKeyDown={onKeyDown}
        required={required}
        disabled={disabled}
        rows={rows}
        className={textareaClasses}
      />
      {error && (
        <p className="mt-1 text-sm text-error-500">{error}</p>
      )}
    </div>
  );
});

Textarea.displayName = 'Textarea';

export default Textarea; 