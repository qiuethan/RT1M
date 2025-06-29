import { useState } from 'react';
import { Asset } from '../services/firestore';
import { DEFAULT_ASSET } from '../constants/financial';
import { isValidAsset, generateId, addItemToArray, updateItemInArray, validateAssetValue } from '../utils/financial';

export interface UseAssetModalReturn {
  // Modal state
  showModal: boolean;
  editingAsset: Asset | null;
  assetForm: Asset;
  
  // Actions
  openModal: (asset?: Asset) => void;
  closeModal: () => void;
  updateForm: (updates: Partial<Asset>) => void;
  handleSave: (assets: Asset[], onSave: (updatedAssets: Asset[]) => Promise<void>) => Promise<void>;
  
  // Validation
  isFormValid: boolean;
  errors: {
    name?: string;
    value?: string;
  };
  validateField: (field: keyof Asset, value: any) => void;
  clearError: (field: keyof Asset) => void;
}

export const useAssetModal = (): UseAssetModalReturn => {
  const [showModal, setShowModal] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [assetForm, setAssetForm] = useState<Asset>(DEFAULT_ASSET);
  const [errors, setErrors] = useState<{
    name?: string;
    value?: string;
  }>({});

  const openModal = (asset?: Asset) => {
    if (asset) {
      setEditingAsset(asset);
      setAssetForm(asset);
    } else {
      setEditingAsset(null);
      setAssetForm(DEFAULT_ASSET);
    }
    setErrors({});  // Clear errors when opening modal
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingAsset(null);
    setAssetForm(DEFAULT_ASSET);
    setErrors({});  // Clear errors when closing modal
  };

  const validateField = (field: keyof Asset, value: any) => {
    let error = '';
    
    switch (field) {
      case 'name':
        if (!value || !value.trim()) {
          error = 'Asset name is required';
        }
        break;
      case 'value':
        error = validateAssetValue(value);
        break;
    }
    
    setErrors(prev => ({ ...prev, [field]: error }));
  };

  const clearError = (field: keyof Asset) => {
    setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const updateForm = (updates: Partial<Asset>) => {
    setAssetForm(prev => ({ ...prev, ...updates }));
    
    // Validate updated fields
    Object.keys(updates).forEach(key => {
      const field = key as keyof Asset;
      validateField(field, updates[field]);
    });
  };

  const handleSave = async (
    assets: Asset[], 
    onSave: (updatedAssets: Asset[]) => Promise<void>
  ) => {
    // Validate all fields before saving
    validateField('name', assetForm.name);
    validateField('value', assetForm.value);
    
    // Check if form has any errors
    const hasErrors = Object.values(errors).some(error => error);
    if (!isValidAsset(assetForm) || hasErrors) return;

    const newAsset = {
      ...assetForm,
      id: editingAsset?.id || generateId()
    };

    let updatedAssets: Asset[];
    if (editingAsset) {
      updatedAssets = updateItemInArray(assets, editingAsset.id!, newAsset);
    } else {
      updatedAssets = addItemToArray(assets, newAsset);
    }

    await onSave(updatedAssets);
    closeModal();
  };

  const isFormValid = isValidAsset(assetForm) && !Object.values(errors).some(error => error);

  return {
    // Modal state
    showModal,
    editingAsset,
    assetForm,
    
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