import { useState } from 'react';
import { Asset } from '../services/firestore';
import { DEFAULT_ASSET } from '../constants/financial';
import { isValidAsset, generateId, addItemToArray, updateItemInArray } from '../utils/financial';

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
}

export const useAssetModal = (): UseAssetModalReturn => {
  const [showModal, setShowModal] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [assetForm, setAssetForm] = useState<Asset>(DEFAULT_ASSET);

  const openModal = (asset?: Asset) => {
    if (asset) {
      setEditingAsset(asset);
      setAssetForm(asset);
    } else {
      setEditingAsset(null);
      setAssetForm(DEFAULT_ASSET);
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingAsset(null);
    setAssetForm(DEFAULT_ASSET);
  };

  const updateForm = (updates: Partial<Asset>) => {
    setAssetForm(prev => ({ ...prev, ...updates }));
  };

  const handleSave = async (
    assets: Asset[], 
    onSave: (updatedAssets: Asset[]) => Promise<void>
  ) => {
    if (!isValidAsset(assetForm)) return;

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

  const isFormValid = isValidAsset(assetForm);

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
    isFormValid
  };
}; 