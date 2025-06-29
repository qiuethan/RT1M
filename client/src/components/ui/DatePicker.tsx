import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface DatePickerProps {
  label?: string;
  value?: string | null;
  onChange?: (date: string | null) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
}

const DatePicker: React.FC<DatePickerProps> = ({
  label,
  value,
  onChange,
  error,
  required = false,
  disabled = false,
  className = '',
  placeholder = 'Select date'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  // Parse a date string as local date (avoiding timezone shifts)
  // This ensures dates are always interpreted in the user's local timezone
  // instead of being converted to UTC which can cause day shifts
  const parseLocalDate = (dateString: string): Date | null => {
    if (!dateString) return null;
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day); // month is 0-indexed
  };

  const [selectedDate, setSelectedDate] = useState<Date | null>(
    value ? parseLocalDate(value) : null
  );
  const [showYearSelector, setShowYearSelector] = useState(false);
  const [showMonthSelector, setShowMonthSelector] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  
  const inputRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Update selected date when value prop changes
  useEffect(() => {
    if (value) {
      const parsedDate = parseLocalDate(value);
      setSelectedDate(parsedDate);
      // Also update currentDate to show the correct month/year
      if (parsedDate) {
        setCurrentDate(new Date(parsedDate.getFullYear(), parsedDate.getMonth(), 1));
      }
    } else {
      setSelectedDate(null);
    }
  }, [value]);

  // Calculate dropdown position
  useEffect(() => {
    if (isOpen && inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
      
      setDropdownPosition({
        top: rect.bottom + scrollTop + 4,
        left: rect.left + scrollLeft,
        width: rect.width
      });
    }
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
          inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowYearSelector(false);
        setShowMonthSelector(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        setShowYearSelector(false);
        setShowMonthSelector(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen]);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const firstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const formatDisplayDate = (date: Date | null) => {
    if (!date) return '';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatValueDate = (date: Date) => {
    // Format as YYYY-MM-DD in local timezone (no UTC conversion)
    // This ensures the date string represents the exact day the user selected
    // without any timezone-related shifts that could cause comparison issues
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleDateClick = (day: number) => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    setSelectedDate(newDate);
    onChange?.(formatValueDate(newDate));
    setIsOpen(false);
  };

  const handleMonthSelect = (monthIndex: number) => {
    setCurrentDate(prev => new Date(prev.getFullYear(), monthIndex, 1));
    setShowMonthSelector(false);
  };

  const handleYearSelect = (year: number) => {
    setCurrentDate(prev => new Date(year, prev.getMonth(), 1));
    setShowYearSelector(false);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const navigateYear = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setFullYear(prev.getFullYear() - 1);
      } else {
        newDate.setFullYear(prev.getFullYear() + 1);
      }
      return newDate;
    });
  };

  const generateYearRange = () => {
    const currentYear = new Date().getFullYear();
    const startYear = currentYear - 100;
    const endYear = currentYear + 10;
    const years = [];
    
    for (let year = endYear; year >= startYear; year--) {
      years.push(year);
    }
    
    return years;
  };

  const renderCalendar = () => {
    const daysCount = daysInMonth(currentDate);
    const startDay = firstDayOfMonth(currentDate);
    const days = [];
    const today = new Date();
    const isCurrentMonth = currentDate.getMonth() === today.getMonth() && 
                          currentDate.getFullYear() === today.getFullYear();

    // Empty cells for days before the first day of the month
    for (let i = 0; i < startDay; i++) {
      days.push(<div key={`empty-${i}`} className="p-2"></div>);
    }

    // Days of the month
    for (let day = 1; day <= daysCount; day++) {
      const isSelected = selectedDate && 
        selectedDate.getDate() === day && 
        selectedDate.getMonth() === currentDate.getMonth() &&
        selectedDate.getFullYear() === currentDate.getFullYear();
      
      const isToday = isCurrentMonth && today.getDate() === day;

      days.push(
        <button
          key={day}
          onClick={() => handleDateClick(day)}
          className={`p-2 text-sm rounded-lg hover:bg-primary-50 transition-colors ${
            isSelected 
              ? 'bg-primary-500 text-white hover:bg-primary-600' 
              : isToday 
                ? 'bg-primary-100 text-primary-700 font-medium'
                : 'text-surface-700 hover:text-primary-700'
          }`}
        >
          {day}
        </button>
      );
    }

    return days;
  };

  const renderDropdown = () => {
    if (!isOpen || disabled) return null;

    const dropdown = (
      <div 
        ref={dropdownRef}
        className="fixed z-[9999] bg-white border border-surface-200 rounded-lg shadow-xl p-4 min-w-[320px]"
        style={{
          top: `${dropdownPosition.top}px`,
          left: `${dropdownPosition.left}px`,
          minWidth: `${Math.max(dropdownPosition.width, 320)}px`
        }}
      >
        {/* Header with month/year selectors */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => navigateYear('prev')}
              className="p-1 hover:bg-surface-100 rounded-md transition-colors"
              title="Previous year"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => navigateMonth('prev')}
              className="p-1 hover:bg-surface-100 rounded-md transition-colors"
              title="Previous month"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          </div>
          
          <div className="flex items-center space-x-1">
            <button
              onClick={() => {
                setShowMonthSelector(!showMonthSelector);
                setShowYearSelector(false);
              }}
              className="flex items-center space-x-1 px-3 py-1 text-sm font-medium text-surface-900 hover:bg-surface-100 rounded-md transition-colors"
            >
              <span>{months[currentDate.getMonth()]}</span>
              <svg className={`w-3 h-3 text-surface-500 transition-transform ${showMonthSelector ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <button
              onClick={() => {
                setShowYearSelector(!showYearSelector);
                setShowMonthSelector(false);
              }}
              className="flex items-center space-x-1 px-3 py-1 text-sm font-medium text-surface-900 hover:bg-surface-100 rounded-md transition-colors"
            >
              <span>{currentDate.getFullYear()}</span>
              <svg className={`w-3 h-3 text-surface-500 transition-transform ${showYearSelector ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => navigateMonth('next')}
              className="p-1 hover:bg-surface-100 rounded-md transition-colors"
              title="Next month"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <button
              onClick={() => navigateYear('next')}
              className="p-1 hover:bg-surface-100 rounded-md transition-colors"
              title="Next year"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Month Selector */}
        {showMonthSelector && (
          <div className="mb-4 p-3 bg-surface-50 rounded-lg">
            <div className="grid grid-cols-3 gap-2">
              {months.map((month, index) => (
                <button
                  key={month}
                  onClick={() => handleMonthSelect(index)}
                  className={`p-2 text-sm rounded-md transition-colors ${
                    currentDate.getMonth() === index
                      ? 'bg-primary-500 text-white'
                      : 'hover:bg-primary-100 text-surface-700'
                  }`}
                >
                  {month.slice(0, 3)}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Year Selector */}
        {showYearSelector && (
          <div className="mb-4 p-3 bg-surface-50 rounded-lg max-h-48 overflow-y-auto">
            <div className="grid grid-cols-4 gap-2">
              {generateYearRange().map((year) => (
                <button
                  key={year}
                  onClick={() => handleYearSelect(year)}
                  className={`p-2 text-sm rounded-md transition-colors ${
                    currentDate.getFullYear() === year
                      ? 'bg-primary-500 text-white'
                      : 'hover:bg-primary-100 text-surface-700'
                  }`}
                >
                  {year}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Calendar View */}
        {!showMonthSelector && !showYearSelector && (
          <>
            {/* Days of week header */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                <div key={day} className="p-2 text-xs font-medium text-surface-500 text-center">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1 mb-4">
              {renderCalendar()}
            </div>
          </>
        )}

        {/* Quick actions */}
        <div className="flex justify-between pt-4 border-t border-surface-200">
          <button
            onClick={() => {
              setSelectedDate(null);
              onChange?.('');
              setIsOpen(false);
            }}
            className="text-sm text-surface-500 hover:text-surface-700 transition-colors"
          >
            Clear
          </button>
          <button
            onClick={() => {
              const today = new Date();
              setSelectedDate(today);
              setCurrentDate(today);
              onChange?.(formatValueDate(today));
              setIsOpen(false);
            }}
            className="text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors"
          >
            Today
          </button>
        </div>
      </div>
    );

    // Use portal to render outside of parent containers
    return createPortal(dropdown, document.body);
  };

  return (
    <div className={`relative ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-surface-700 mb-1">
          {label}
          {required && <span className="text-error-500 ml-1">*</span>}
        </label>
      )}
      
      <button
        ref={inputRef}
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full px-2 py-1.5 text-base text-left border rounded-md bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
          disabled 
            ? 'bg-surface-50 text-surface-400 cursor-not-allowed border-surface-200' 
            : error
              ? 'border-error-300 focus:ring-error-500 focus:border-error-500'
              : 'border-surface-300 hover:border-surface-400'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className={selectedDate ? 'text-surface-900' : 'text-surface-500'}>
            {selectedDate ? formatDisplayDate(selectedDate) : placeholder}
          </span>
          <svg 
            className={`w-5 h-5 text-surface-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {error && (
        <p className="mt-1 text-sm text-error-600">{error}</p>
      )}

      {renderDropdown()}
    </div>
  );
};

export default DatePicker; 