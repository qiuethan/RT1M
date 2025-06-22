import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

export const useUnsavedChanges = (hasUnsavedChanges: boolean, message?: string) => {
  const location = useLocation();
  const [showPrompt, setShowPrompt] = useState(false);
  const [nextLocation, setNextLocation] = useState<string | null>(null);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        event.preventDefault();
        event.returnValue = message || 'You have unsaved changes. Are you sure you want to leave?';
        return message || 'You have unsaved changes. Are you sure you want to leave?';
      }
    };

    const handlePopState = (event: PopStateEvent) => {
      if (hasUnsavedChanges) {
        event.preventDefault();
        setShowPrompt(true);
        setNextLocation(window.location.pathname);
        // Push the current state back to prevent navigation
        window.history.pushState(null, '', location.pathname);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [hasUnsavedChanges, message, location.pathname]);

  const confirmNavigation = () => {
    setShowPrompt(false);
    if (nextLocation) {
      window.history.pushState(null, '', nextLocation);
      setNextLocation(null);
    }
  };

  const cancelNavigation = () => {
    setShowPrompt(false);
    setNextLocation(null);
  };

  return {
    showPrompt,
    confirmNavigation,
    cancelNavigation
  };
};

export const isFormChanged = (original: any, current: any): boolean => {
  return JSON.stringify(original) !== JSON.stringify(current);
};

// Utility component for unsaved changes prompt
export const UnsavedChangesPrompt: React.FC<{
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  message?: string;
}> = ({ isOpen, onConfirm, onCancel, message }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        <div className="fixed inset-0 bg-surface-500 bg-opacity-75 transition-opacity" />
        <div className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
          <div className="sm:flex sm:items-start">
            <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-orange-100 sm:mx-0 sm:h-10 sm:w-10">
              <svg className="h-6 w-6 text-orange-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
            <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
              <h3 className="text-base font-semibold leading-6 text-surface-900">
                Unsaved Changes
              </h3>
              <div className="mt-2">
                <p className="text-sm text-surface-500">
                  {message || 'You have unsaved changes. Are you sure you want to leave without saving?'}
                </p>
              </div>
            </div>
          </div>
          <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              className="inline-flex w-full justify-center rounded-md bg-error-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-error-500 sm:ml-3 sm:w-auto"
              onClick={onConfirm}
            >
              Leave without saving
            </button>
            <button
              type="button"
              className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-surface-900 shadow-sm ring-1 ring-inset ring-surface-300 hover:bg-surface-50 sm:mt-0 sm:w-auto"
              onClick={onCancel}
            >
              Stay and save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}; 