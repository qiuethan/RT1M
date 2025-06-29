import { useState } from 'react';
import { Debt } from '../services/firestore';
import { DEFAULT_DEBT } from '../constants/financial';
import { isValidDebt, generateId, addItemToArray, updateItemInArray, validateDebtBalance, validateInterestRate } from '../utils/financial';

export interface UseDebtModalReturn {
  // Modal state
  showModal: boolean;
  editingDebt: Debt | null;
  debtForm: Debt;
  
  // Actions
  openModal: (debt?: Debt) => void;
  closeModal: () => void;
  updateForm: (updates: Partial<Debt>) => void;
  handleSave: (debts: Debt[], onSave: (updatedDebts: Debt[]) => Promise<void>) => Promise<void>;
  
  // Validation
  isFormValid: boolean;
  errors: {
    name?: string;
    balance?: string;
    interestRate?: string;
  };
  validateField: (field: keyof Debt, value: any) => void;
  clearError: (field: keyof Debt) => void;
}

export const useDebtModal = (): UseDebtModalReturn => {
  const [showModal, setShowModal] = useState(false);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);
  const [debtForm, setDebtForm] = useState<Debt>(DEFAULT_DEBT);
  const [errors, setErrors] = useState<{
    name?: string;
    balance?: string;
    interestRate?: string;
  }>({});

  const openModal = (debt?: Debt) => {
    if (debt) {
      setEditingDebt(debt);
      setDebtForm(debt);
    } else {
      setEditingDebt(null);
      setDebtForm(DEFAULT_DEBT);
    }
    setErrors({});  // Clear errors when opening modal
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingDebt(null);
    setDebtForm(DEFAULT_DEBT);
    setErrors({});  // Clear errors when closing modal
  };

  const validateField = (field: keyof Debt, value: any) => {
    let error = '';
    
    switch (field) {
      case 'name':
        if (!value || !value.trim()) {
          error = 'Debt name is required';
        }
        break;
      case 'balance':
        error = validateDebtBalance(value);
        break;
      case 'interestRate':
        error = validateInterestRate(value);
        break;
    }
    
    setErrors(prev => ({ ...prev, [field]: error }));
  };

  const clearError = (field: keyof Debt) => {
    setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const updateForm = (updates: Partial<Debt>) => {
    setDebtForm(prev => ({ ...prev, ...updates }));
    
    // Validate updated fields
    Object.keys(updates).forEach(key => {
      const field = key as keyof Debt;
      validateField(field, updates[field]);
    });
  };

  const handleSave = async (
    debts: Debt[], 
    onSave: (updatedDebts: Debt[]) => Promise<void>
  ) => {
    // Validate all fields before saving
    validateField('name', debtForm.name);
    validateField('balance', debtForm.balance);
    validateField('interestRate', debtForm.interestRate);
    
    // Check if form has any errors
    const hasErrors = Object.values(errors).some(error => error);
    if (!isValidDebt(debtForm) || hasErrors) return;

    const newDebt = {
      ...debtForm,
      id: editingDebt?.id || generateId()
    };

    let updatedDebts: Debt[];
    if (editingDebt) {
      updatedDebts = updateItemInArray(debts, editingDebt.id!, newDebt);
    } else {
      updatedDebts = addItemToArray(debts, newDebt);
    }

    await onSave(updatedDebts);
    closeModal();
  };

  const isFormValid = isValidDebt(debtForm) && !Object.values(errors).some(error => error);

  return {
    // Modal state
    showModal,
    editingDebt,
    debtForm,
    
    // Actions
    openModal,
    closeModal,
    updateForm,
    handleSave,
    
    // Validation
    isFormValid,
    errors,
    validateField,
    clearError
  };
}; 