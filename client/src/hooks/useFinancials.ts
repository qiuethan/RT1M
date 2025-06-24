import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  getUserFinancials,
  updateUserFinancialsSection,
  FinancialInfo,
  Asset,
  Debt
} from '../services/firestore';
import { isFormChanged } from '../utils/unsavedChanges';

export interface UseFinancialsReturn {
  // State
  loading: boolean;
  savingSection: string | null;
  financialInfo: FinancialInfo;
  assets: Asset[] | null;
  debts: Debt[] | null;
  
  // Change detection
  hasFinancialInfoChanged: boolean;
  
  // Actions
  setFinancialInfo: (info: FinancialInfo) => void;
  setAssets: (assets: Asset[] | null) => void;
  setDebts: (debts: Debt[] | null) => void;
  saveFinancialInfo: () => Promise<void>;
  saveAssetWithTotals: (updatedAssets: Asset[]) => Promise<void>;
  saveDebtWithTotals: (updatedDebts: Debt[]) => Promise<void>;
  
  // Calculations
  calculateNetWorth: () => number;
  calculateCashFlow: () => number;
  calculateSavingsRate: () => number;
}

export const useFinancials = (): UseFinancialsReturn => {
  const { currentUser } = useAuth();
  
  // State
  const [loading, setLoading] = useState(true);
  const [savingSection, setSavingSection] = useState<string | null>(null);
  const [financialInfo, setFinancialInfo] = useState<FinancialInfo>({
    annualIncome: null,
    annualExpenses: null,
    totalAssets: null,
    totalDebts: null,
    currentSavings: null
  });
  const [assets, setAssets] = useState<Asset[] | null>(null);
  const [debts, setDebts] = useState<Debt[] | null>(null);
  
  // Original data for change detection
  const [originalFinancialInfo, setOriginalFinancialInfo] = useState<FinancialInfo>({
    annualIncome: null,
    annualExpenses: null,
    totalAssets: null,
    totalDebts: null,
    currentSavings: null
  });

  // Load financial data on component mount
  useEffect(() => {
    const loadFinancials = async () => {
      if (!currentUser) return;
      
      try {
        setLoading(true);
        console.log('Loading financials for user:', currentUser.uid);
        const financials = await getUserFinancials();
        console.log('Raw financials response:', financials);
        
        if (financials) {
          console.log('Setting financialInfo:', financials.financialInfo);
          console.log('Setting assets:', financials.assets);
          console.log('Setting debts:', financials.debts);
          
          const defaultFinancialInfo = {
            annualIncome: null,
            annualExpenses: null,
            totalAssets: null,
            totalDebts: null,
            currentSavings: null
          };
          
          const loadedFinancialInfo = financials.financialInfo || defaultFinancialInfo;
          
          setFinancialInfo(loadedFinancialInfo);
          setOriginalFinancialInfo(loadedFinancialInfo);
          setAssets(financials.assets || null);
          setDebts(financials.debts || null);
        } else {
          console.log('No financials data found');
        }
      } catch (error) {
        console.error('Error loading financials:', error);
      } finally {
        setLoading(false);
      }
    };

    loadFinancials();
  }, [currentUser]);

  // Calculate totals from individual assets and debts
  useEffect(() => {
    const totalAssetValue = assets ? assets.reduce((sum, asset) => sum + asset.value, 0) : 0;
    const totalDebtBalance = debts ? debts.reduce((sum, debt) => sum + debt.balance, 0) : 0;
    
    setFinancialInfo(prev => ({
      ...prev,
      totalAssets: totalAssetValue,
      totalDebts: totalDebtBalance
    }));
  }, [assets, debts]);

  // Actions
  const saveFinancialInfo = async () => {
    setSavingSection('info');
    try {
      console.log('Saving financial info:', financialInfo);
      const result = await updateUserFinancialsSection('financialInfo', financialInfo);
      console.log('Financial info save result:', result);
      setOriginalFinancialInfo(financialInfo);
      alert('Financial information saved successfully!');
    } catch (error) {
      console.error('Error saving financial info:', error);
      alert('Failed to save financial information. Please try again.');
    } finally {
      setSavingSection(null);
    }
  };

  const saveAssetWithTotals = async (updatedAssets: Asset[]) => {
    setSavingSection('assets');
    try {
      // Calculate new totals
      const newTotalAssets = updatedAssets.reduce((sum, asset) => sum + asset.value, 0);
      const updatedFinancialInfo = {
        ...financialInfo,
        totalAssets: newTotalAssets
      };

      console.log('Saving assets:', updatedAssets);
      console.log('Saving updated financial info:', updatedFinancialInfo);
      
      // Save assets
      const assetsResult = await updateUserFinancialsSection('assets', updatedAssets);
      console.log('Assets save result:', assetsResult);
      
      // Save updated financial info
      const infoResult = await updateUserFinancialsSection('financialInfo', updatedFinancialInfo);
      console.log('Financial info save result:', infoResult);
      
      // Update local state
      setAssets(updatedAssets);
      setFinancialInfo(updatedFinancialInfo);
    } catch (error) {
      console.error('Error saving assets:', error);
      alert('Failed to save assets. Please try again.');
    } finally {
      setSavingSection(null);
    }
  };

  const saveDebtWithTotals = async (updatedDebts: Debt[]) => {
    setSavingSection('debts');
    try {
      // Calculate new totals
      const newTotalDebts = updatedDebts.reduce((sum, debt) => sum + debt.balance, 0);
      const updatedFinancialInfo = {
        ...financialInfo,
        totalDebts: newTotalDebts
      };

      console.log('Saving debts:', updatedDebts);
      console.log('Saving updated financial info:', updatedFinancialInfo);
      
      // Save debts
      const debtsResult = await updateUserFinancialsSection('debts', updatedDebts);
      console.log('Debts save result:', debtsResult);
      
      // Save updated financial info
      const infoResult = await updateUserFinancialsSection('financialInfo', updatedFinancialInfo);
      console.log('Financial info save result:', infoResult);
      
      // Update local state
      setDebts(updatedDebts);
      setFinancialInfo(updatedFinancialInfo);
    } catch (error) {
      console.error('Error saving debts:', error);
      alert('Failed to save debts. Please try again.');
    } finally {
      setSavingSection(null);
    }
  };

  // Calculations
  const calculateNetWorth = () => {
    return (financialInfo.totalAssets || 0) - (financialInfo.totalDebts || 0);
  };

  const calculateCashFlow = () => {
    return (financialInfo.annualIncome || 0) - (financialInfo.annualExpenses || 0);
  };

  const calculateSavingsRate = () => {
    if (!financialInfo.annualIncome || financialInfo.annualIncome === 0) return 0;
    return ((calculateCashFlow() / financialInfo.annualIncome) * 100);
  };

  // Change detection
  const hasFinancialInfoChanged = isFormChanged(originalFinancialInfo, financialInfo);

  return {
    // State
    loading,
    savingSection,
    financialInfo,
    assets,
    debts,
    
    // Change detection
    hasFinancialInfoChanged,
    
    // Actions
    setFinancialInfo,
    setAssets,
    setDebts,
    saveFinancialInfo,
    saveAssetWithTotals,
    saveDebtWithTotals,
    
    // Calculations
    calculateNetWorth,
    calculateCashFlow,
    calculateSavingsRate,
  };
}; 