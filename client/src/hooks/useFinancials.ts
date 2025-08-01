import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useChatContext } from '../contexts/ChatContext';
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
  
  // Data refresh
  refreshData: () => Promise<void>;
}

export const useFinancials = (): UseFinancialsReturn => {
  const { currentUser } = useAuth();
  const { registerDataRefreshCallback, unregisterDataRefreshCallback } = useChatContext();
  
  // State
  const [loading, setLoading] = useState(true);
  const [savingSection, setSavingSection] = useState<string | null>(null);
  const [financialInfo, setFinancialInfo] = useState<FinancialInfo>({
    annualIncome: null,
    annualExpenses: null,
    currentSavings: null
  });
  const [assets, setAssets] = useState<Asset[] | null>(null);
  const [debts, setDebts] = useState<Debt[] | null>(null);
  
  // Original data for change detection
  const [originalFinancialInfo, setOriginalFinancialInfo] = useState<FinancialInfo>({
    annualIncome: null,
    annualExpenses: null,
    currentSavings: null
  });

  // Refresh data function
  const refreshData = useCallback(async () => {
    if (!currentUser) return;
    
    try {
      console.log('Refreshing financials data due to AI update');
      const financials = await getUserFinancials();
      
      if (financials) {
        const defaultFinancialInfo = {
          annualIncome: null,
          annualExpenses: null,
          currentSavings: null
        };
        
        const loadedFinancialInfo = financials.financialInfo || defaultFinancialInfo;
        
        setFinancialInfo(loadedFinancialInfo);
        setOriginalFinancialInfo(loadedFinancialInfo);
        setAssets(financials.assets || null);
        setDebts(financials.debts || null);
        
        console.log('Financials refreshed successfully');
      }
    } catch (error) {
      console.error('Error refreshing financials:', error);
    }
  }, [currentUser]);

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

  // Register for data refresh callbacks from chat
  useEffect(() => {
    registerDataRefreshCallback(refreshData);
    
    return () => {
      unregisterDataRefreshCallback(refreshData);
    };
  }, [refreshData, registerDataRefreshCallback, unregisterDataRefreshCallback]);

  // No longer need to track totals in financialInfo - calculate on demand

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
      console.log('Saving assets:', updatedAssets);
      
      // Save assets (no need to save totals separately)
      const assetsResult = await updateUserFinancialsSection('assets', updatedAssets);
      console.log('Assets save result:', assetsResult);
      
      // Update local state
      setAssets(updatedAssets);
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
      console.log('Saving debts:', updatedDebts);
      
      // Save debts (no need to save totals separately)
      const debtsResult = await updateUserFinancialsSection('debts', updatedDebts);
      console.log('Debts save result:', debtsResult);
      
      // Update local state
      setDebts(updatedDebts);
    } catch (error) {
      console.error('Error saving debts:', error);
      alert('Failed to save debts. Please try again.');
    } finally {
      setSavingSection(null);
    }
  };

  // Calculations
  const calculateNetWorth = () => {
    const totalAssets = assets ? assets.reduce((sum, asset) => sum + asset.value, 0) : 0;
    const totalDebts = debts ? debts.reduce((sum, debt) => sum + debt.balance, 0) : 0;
    return totalAssets - totalDebts;
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
    
    // Data refresh
    refreshData,
  };
}; 