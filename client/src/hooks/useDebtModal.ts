import { useState } from 'react';
import { Debt } from '../services/firestore';
import { DEFAULT_DEBT } from '../constants/financial';
import { isValidDebt, generateId, addItemToArray, updateItemInArray } from '../utils/financial';

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
}

export const useDebtModal = (): UseDebtModalReturn => {
  const [showModal, setShowModal] = useState(false);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);
  const [debtForm, setDebtForm] = useState<Debt>(DEFAULT_DEBT);

  const openModal = (debt?: Debt) => {
    if (debt) {
      setEditingDebt(debt);
      setDebtForm(debt);
    } else {
      setEditingDebt(null);
      setDebtForm(DEFAULT_DEBT);
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingDebt(null);
    setDebtForm(DEFAULT_DEBT);
  };

  const updateForm = (updates: Partial<Debt>) => {
    setDebtForm(prev => ({ ...prev, ...updates }));
  };

  const handleSave = async (
    debts: Debt[], 
    onSave: (updatedDebts: Debt[]) => Promise<void>
  ) => {
    if (!isValidDebt(debtForm)) return;

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

  const isFormValid = isValidDebt(debtForm);

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
    isFormValid
  };
}; 