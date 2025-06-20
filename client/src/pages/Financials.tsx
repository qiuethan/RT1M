import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, Button, Input, Select, Modal } from '../components/ui';
import Footer from '../components/Footer';
import { MiniChatbot } from '../components/MiniChatbot';
import { 
  getUserFinancials,
  updateUserFinancialsSection,
  FinancialInfo,
  Asset,
  Debt
} from '../services/firestore';

export default function Financials() {
  const { currentUser } = useAuth();

  // Loading states
  const [loading, setLoading] = useState(true);
  const [savingSection, setSavingSection] = useState<string | null>(null);

  // Modal states
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [showDebtModal, setShowDebtModal] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);

  // Financial data
  const [financialInfo, setFinancialInfo] = useState<FinancialInfo>({
    annualIncome: 0,
    annualExpenses: 0,
    totalAssets: 0,
    totalDebts: 0,
    currentSavings: 0
  });

  const [assets, setAssets] = useState<Asset[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);

  // Form states
  const [assetForm, setAssetForm] = useState<Asset>({
    name: '',
    type: 'savings',
    value: 0,
    description: ''
  });

  const [debtForm, setDebtForm] = useState<Debt>({
    name: '',
    type: 'credit-card',
    balance: 0,
    interestRate: 0,
    description: ''
  });

  // Asset and debt type options
  const assetTypeOptions = [
    { value: 'real-estate', label: 'Real Estate' },
    { value: 'stocks', label: 'Stocks & Equities' },
    { value: 'bonds', label: 'Bonds' },
    { value: 'savings', label: 'Savings Account' },
    { value: 'retirement', label: 'Retirement Account' },
    { value: 'crypto', label: 'Cryptocurrency' },
    { value: 'business', label: 'Business Investment' },
    { value: 'other', label: 'Other' }
  ];

  const debtTypeOptions = [
    { value: 'mortgage', label: 'Mortgage' },
    { value: 'credit-card', label: 'Credit Card' },
    { value: 'student-loan', label: 'Student Loan' },
    { value: 'car-loan', label: 'Car Loan' },
    { value: 'personal-loan', label: 'Personal Loan' },
    { value: 'business-loan', label: 'Business Loan' },
    { value: 'other', label: 'Other' }
  ];



  // Load financial data on component mount
  useEffect(() => {
    const loadFinancials = async () => {
      if (!currentUser) return;
      
      try {
        setLoading(true);
        const financials = await getUserFinancials();
        
        if (financials) {
          setFinancialInfo(financials.financialInfo || {
            annualIncome: 0,
            annualExpenses: 0,
            totalAssets: 0,
            totalDebts: 0,
            currentSavings: 0
          });
          setAssets(financials.assets || []);
          setDebts(financials.debts || []);
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
    const totalAssetValue = assets.reduce((sum, asset) => sum + asset.value, 0);
    const totalDebtBalance = debts.reduce((sum, debt) => sum + debt.balance, 0);
    
    setFinancialInfo(prev => ({
      ...prev,
      totalAssets: totalAssetValue,
      totalDebts: totalDebtBalance
    }));
  }, [assets, debts]);

  // Save functions
  const saveFinancialInfo = async () => {
    setSavingSection('info');
    try {
      await updateUserFinancialsSection('financialInfo', financialInfo);
    } catch (error) {
      console.error('Error saving financial info:', error);
    } finally {
      setSavingSection(null);
    }
  };

  const saveAssets = async () => {
    setSavingSection('assets');
    try {
      await updateUserFinancialsSection('assets', assets);
    } catch (error) {
      console.error('Error saving assets:', error);
    } finally {
      setSavingSection(null);
    }
  };

  const saveDebts = async () => {
    setSavingSection('debts');
    try {
      await updateUserFinancialsSection('debts', debts);
    } catch (error) {
      console.error('Error saving debts:', error);
    } finally {
      setSavingSection(null);
    }
  };

  // Asset management
  const openAssetModal = (asset?: Asset) => {
    if (asset) {
      setEditingAsset(asset);
      setAssetForm(asset);
    } else {
      setEditingAsset(null);
      setAssetForm({
        name: '',
        type: 'savings',
        value: 0,
        description: ''
      });
    }
    setShowAssetModal(true);
  };

  const handleSaveAsset = async () => {
    if (!assetForm.name || assetForm.value <= 0) return;

    const newAsset = {
      ...assetForm,
      id: editingAsset?.id || Date.now().toString()
    };

    if (editingAsset) {
      setAssets(assets.map(a => a.id === editingAsset.id ? newAsset : a));
    } else {
      setAssets([...assets, newAsset]);
    }

    setShowAssetModal(false);
    await saveAssets();
  };

  const handleDeleteAsset = async (assetId: string) => {
    setAssets(assets.filter(a => a.id !== assetId));
    await saveAssets();
  };

  // Debt management
  const openDebtModal = (debt?: Debt) => {
    if (debt) {
      setEditingDebt(debt);
      setDebtForm(debt);
    } else {
      setEditingDebt(null);
      setDebtForm({
        name: '',
        type: 'credit-card',
        balance: 0,
        interestRate: 0,
        description: ''
      });
    }
    setShowDebtModal(true);
  };

  const handleSaveDebt = async () => {
    if (!debtForm.name || debtForm.balance <= 0) return;

    const newDebt = {
      ...debtForm,
      id: editingDebt?.id || Date.now().toString()
    };

    if (editingDebt) {
      setDebts(debts.map(d => d.id === editingDebt.id ? newDebt : d));
    } else {
      setDebts([...debts, newDebt]);
    }

    setShowDebtModal(false);
    await saveDebts();
  };

  const handleDeleteDebt = async (debtId: string) => {
    setDebts(debts.filter(d => d.id !== debtId));
    await saveDebts();
  };

  // Helper functions
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

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-surface-600">Loading your financial data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-50">
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-surface-900">Financial Overview</h1>
          <p className="text-surface-600 mt-2">
            Manage your financial information and track your wealth building progress
          </p>
        </div>

        <div className="space-y-6">
          {/* Financial Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="p-6 text-center">
              <div className="text-2xl font-bold text-green-600 mb-2">
                ${(financialInfo.annualIncome || 0).toLocaleString()}
              </div>
              <div className="text-sm text-surface-600">Annual Income</div>
            </Card>
            
            <Card className="p-6 text-center">
              <div className="text-2xl font-bold text-red-600 mb-2">
                ${(financialInfo.annualExpenses || 0).toLocaleString()}
              </div>
              <div className="text-sm text-surface-600">Annual Expenses</div>
            </Card>
            
            <Card className="p-6 text-center">
              <div className="text-2xl font-bold text-blue-600 mb-2">
                ${(financialInfo.totalAssets || 0).toLocaleString()}
              </div>
              <div className="text-sm text-surface-600">Total Assets</div>
            </Card>
            
            <Card className="p-6 text-center">
              <div className={`text-2xl font-bold mb-2 ${
                calculateNetWorth() >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                ${calculateNetWorth().toLocaleString()}
              </div>
              <div className="text-sm text-surface-600">Net Worth</div>
            </Card>
          </div>

          {/* Cash Flow Overview */}
          <Card className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-surface-900">Cash Flow Analysis</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="text-lg font-semibold text-green-700 mb-2">Annual Cash Flow</div>
                <div className={`text-2xl font-bold ${
                  calculateCashFlow() >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {calculateCashFlow() >= 0 ? '+' : ''}${calculateCashFlow().toLocaleString()}
                </div>
                <div className="text-sm text-green-600 mt-1">
                  Income - Expenses
                </div>
              </div>
              
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="text-lg font-semibold text-blue-700 mb-2">Savings Rate</div>
                <div className={`text-2xl font-bold ${
                  calculateSavingsRate() >= 20 ? 'text-green-600' : 
                  calculateSavingsRate() >= 10 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {calculateSavingsRate().toFixed(1)}%
                </div>
                <div className="text-sm text-blue-600 mt-1">
                  Of annual income
                </div>
              </div>
            </div>
          </Card>

          {/* Income & Expenses */}
          <Card className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-surface-900">Income & Expenses</h2>
              <Button 
                onClick={saveFinancialInfo}
                loading={savingSection === 'info'}
                size="sm"
              >
                Save Changes
              </Button>
            </div>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Annual Income"
                  type="number"
                  value={financialInfo.annualIncome === 0 ? '' : financialInfo.annualIncome.toString()}
                  onChange={(e) => setFinancialInfo({...financialInfo, annualIncome: parseInt(e.target.value) || 0})}
                  placeholder="75000"
                />
                
                <Input
                  label="Annual Expenses"
                  type="number"
                  value={financialInfo.annualExpenses === 0 ? '' : financialInfo.annualExpenses.toString()}
                  onChange={(e) => setFinancialInfo({...financialInfo, annualExpenses: parseInt(e.target.value) || 0})}
                  placeholder="45000"
                />
              </div>
              
              <Input
                label="Current Savings"
                type="number"
                value={financialInfo.currentSavings === 0 ? '' : financialInfo.currentSavings.toString()}
                onChange={(e) => setFinancialInfo({...financialInfo, currentSavings: parseInt(e.target.value) || 0})}
                placeholder="25000"
              />
            </div>
          </Card>

          {/* Assets */}
          <Card className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-surface-900">
                Assets ({assets.length}) - ${(financialInfo.totalAssets || 0).toLocaleString()}
              </h2>
              <Button 
                onClick={() => openAssetModal()}
                variant="outline"
                size="sm"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Asset
              </Button>
            </div>
            
            <div className="space-y-4">
              {assets.length === 0 ? (
                <div className="text-center py-8 text-surface-500">
                  <svg className="w-12 h-12 mx-auto mb-4 text-surface-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                  <p className="text-sm">No assets added yet. Add your first asset above!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {assets.map((asset) => (
                    <div key={asset.id} className="flex items-center justify-between p-4 border border-surface-200 rounded-lg bg-surface-50">
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-surface-900">{asset.name}</h4>
                          <span className="text-lg font-semibold text-green-600">
                            ${asset.value.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center mt-1">
                          <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                            {assetTypeOptions.find(opt => opt.value === asset.type)?.label}
                          </span>
                          {asset.description && (
                            <span className="text-sm text-surface-600 ml-3">{asset.description}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openAssetModal(asset)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteAsset(asset.id!)}
                          className="text-red-600 hover:text-red-700"
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* Debts */}
          <Card className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-surface-900">
                Debts ({debts.length}) - ${(financialInfo.totalDebts || 0).toLocaleString()}
              </h2>
              <Button 
                onClick={() => openDebtModal()}
                variant="outline"
                size="sm"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Debt
              </Button>
            </div>
            
            <div className="space-y-4">
              {debts.length === 0 ? (
                <div className="text-center py-8 text-surface-500">
                  <svg className="w-12 h-12 mx-auto mb-4 text-surface-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2zM10 8.5a.5.5 0 11-1 0 .5.5 0 011 0zm5 5a.5.5 0 11-1 0 .5.5 0 011 0z" />
                  </svg>
                  <p className="text-sm">No debts added yet. Add debts to track your liabilities.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {debts.map((debt) => (
                    <div key={debt.id} className="flex items-center justify-between p-4 border border-surface-200 rounded-lg bg-surface-50">
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-surface-900">{debt.name}</h4>
                          <span className="text-lg font-semibold text-red-600">
                            ${debt.balance.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center mt-1">
                          <span className="text-xs px-2 py-1 bg-red-100 text-red-800 rounded-full">
                            {debtTypeOptions.find(opt => opt.value === debt.type)?.label}
                          </span>
                          {debt.interestRate && (
                            <span className="text-sm text-surface-600 ml-3">{debt.interestRate}% APR</span>
                          )}
                          {debt.description && (
                            <span className="text-sm text-surface-600 ml-3">{debt.description}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openDebtModal(debt)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteDebt(debt.id!)}
                          className="text-red-600 hover:text-red-700"
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Asset Modal */}
        <Modal
          isOpen={showAssetModal}
          onClose={() => setShowAssetModal(false)}
          title={editingAsset ? 'Edit Asset' : 'Add New Asset'}
        >
          <div className="space-y-4">
            <Input
              label="Asset Name"
              value={assetForm.name}
              onChange={(e) => setAssetForm({...assetForm, name: e.target.value})}
              placeholder="Primary Home"
            />
            
            <Select
              label="Asset Type"
              value={assetForm.type}
              onChange={(e) => setAssetForm({...assetForm, type: e.target.value as Asset['type']})}
              options={assetTypeOptions}
            />
            
            <Input
              label="Current Value ($)"
              type="number"
              value={assetForm.value.toString()}
              onChange={(e) => setAssetForm({...assetForm, value: parseFloat(e.target.value) || 0})}
              placeholder="500000"
            />
            
            <Input
              label="Description (Optional)"
              value={assetForm.description || ''}
              onChange={(e) => setAssetForm({...assetForm, description: e.target.value})}
              placeholder="Additional details about this asset"
            />
            
            <div className="flex justify-end space-x-3 pt-4">
              <Button variant="outline" onClick={() => setShowAssetModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveAsset}>
                {editingAsset ? 'Update Asset' : 'Add Asset'}
              </Button>
            </div>
          </div>
        </Modal>

        {/* Debt Modal */}
        <Modal
          isOpen={showDebtModal}
          onClose={() => setShowDebtModal(false)}
          title={editingDebt ? 'Edit Debt' : 'Add New Debt'}
        >
          <div className="space-y-4">
            <Input
              label="Debt Name"
              value={debtForm.name}
              onChange={(e) => setDebtForm({...debtForm, name: e.target.value})}
              placeholder="Credit Card"
            />
            
            <Select
              label="Debt Type"
              value={debtForm.type}
              onChange={(e) => setDebtForm({...debtForm, type: e.target.value as Debt['type']})}
              options={debtTypeOptions}
            />
            
            <Input
              label="Current Balance ($)"
              type="number"
              value={debtForm.balance.toString()}
              onChange={(e) => setDebtForm({...debtForm, balance: parseFloat(e.target.value) || 0})}
              placeholder="5000"
            />
            
            <Input
              label="Interest Rate (% APR)"
              type="number"
              value={debtForm.interestRate?.toString() || ''}
              onChange={(e) => setDebtForm({...debtForm, interestRate: parseFloat(e.target.value) || 0})}
              placeholder="18.5"
            />
            
            <Input
              label="Description (Optional)"
              value={debtForm.description || ''}
              onChange={(e) => setDebtForm({...debtForm, description: e.target.value})}
              placeholder="Additional details about this debt"
            />
            
            <div className="flex justify-end space-x-3 pt-4">
              <Button variant="outline" onClick={() => setShowDebtModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveDebt}>
                {editingDebt ? 'Update Debt' : 'Add Debt'}
              </Button>
            </div>
          </div>
        </Modal>

        <MiniChatbot />
      </div>
      <Footer />
    </div>
  );
} 