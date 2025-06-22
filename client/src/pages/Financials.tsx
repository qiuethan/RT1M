import React from 'react';
import { Card, Button, Input, Select, Modal } from '../components/ui';
import Footer from '../components/Footer';
import { MiniChatbot } from '../components/MiniChatbot';
import { Asset, Debt } from '../services/firestore';
import { useFinancials } from '../hooks/useFinancials';
import { useAssetModal } from '../hooks/useAssetModal';
import { useDebtModal } from '../hooks/useDebtModal';
import { ASSET_TYPE_OPTIONS, DEBT_TYPE_OPTIONS } from '../constants/financial';
import { 
  formatCurrency, 
  formatPercentage, 
  getSavingsRateColor, 
  getNetWorthColor, 
  getCashFlowColor,
  removeItemFromArray
} from '../utils/financial';

export default function FinancialsRefactored() {
  // Custom hooks for financial data management
  const {
    loading,
    savingSection,
    financialInfo,
    assets,
    debts,
    setFinancialInfo,
    saveFinancialInfo,
    saveAssetWithTotals,
    saveDebtWithTotals,
    calculateNetWorth,
    calculateCashFlow,
    calculateSavingsRate,
  } = useFinancials();

  // Custom hooks for modal management
  const assetModal = useAssetModal();
  const debtModal = useDebtModal();

  // Asset management handlers
  const handleDeleteAsset = async (assetId: string) => {
    const updatedAssets = removeItemFromArray(assets, assetId);
    await saveAssetWithTotals(updatedAssets);
  };

  // Debt management handlers
  const handleDeleteDebt = async (debtId: string) => {
    const updatedDebts = removeItemFromArray(debts, debtId);
    await saveDebtWithTotals(updatedDebts);
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
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
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
                {formatCurrency(financialInfo.annualIncome || 0)}
              </div>
              <div className="text-sm text-surface-600">Annual Income</div>
            </Card>
            
            <Card className="p-6 text-center">
              <div className="text-2xl font-bold text-red-600 mb-2">
                {formatCurrency(financialInfo.annualExpenses || 0)}
              </div>
              <div className="text-sm text-surface-600">Annual Expenses</div>
            </Card>
            
            <Card className="p-6 text-center">
              <div className="text-2xl font-bold text-blue-600 mb-2">
                {formatCurrency(financialInfo.totalAssets || 0)}
              </div>
              <div className="text-sm text-surface-600">Total Assets</div>
            </Card>
            
            <Card className="p-6 text-center">
              <div className={`text-2xl font-bold mb-2 ${getNetWorthColor(calculateNetWorth())}`}>
                {formatCurrency(calculateNetWorth())}
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
                <div className={`text-2xl font-bold ${getCashFlowColor(calculateCashFlow())}`}>
                  {calculateCashFlow() >= 0 ? '+' : ''}{formatCurrency(calculateCashFlow())}
                </div>
                <div className="text-sm text-green-600 mt-1">
                  Income - Expenses
                </div>
              </div>
              
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="text-lg font-semibold text-blue-700 mb-2">Savings Rate</div>
                <div className={`text-2xl font-bold ${getSavingsRateColor(calculateSavingsRate())}`}>
                  {formatPercentage(calculateSavingsRate())}
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
                disabled={savingSection === 'info'}
                size="sm"
              >
                {savingSection === 'info' ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Annual Income"
                  type="number"
                  value={financialInfo.annualIncome === 0 ? '' : financialInfo.annualIncome.toString()}
                  onChange={(e) => setFinancialInfo({...financialInfo, annualIncome: parseFloat(e.target.value) || 0})}
                  placeholder="75000"
                />
                
                <Input
                  label="Annual Expenses"
                  type="number"
                  value={financialInfo.annualExpenses === 0 ? '' : financialInfo.annualExpenses.toString()}
                  onChange={(e) => setFinancialInfo({...financialInfo, annualExpenses: parseFloat(e.target.value) || 0})}
                  placeholder="45000"
                />
              </div>
              
              <Input
                label="Current Savings"
                type="number"
                value={financialInfo.currentSavings === 0 ? '' : financialInfo.currentSavings.toString()}
                onChange={(e) => setFinancialInfo({...financialInfo, currentSavings: parseFloat(e.target.value) || 0})}
                placeholder="25000"
              />
            </div>
          </Card>

          {/* Assets */}
          <Card className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-surface-900">
                Assets ({assets.length}) - {formatCurrency(financialInfo.totalAssets || 0)}
              </h2>
              <Button 
                onClick={() => assetModal.openModal()}
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
                    <div key={asset.id} className="flex items-center space-x-4 p-4 border border-surface-200 rounded-lg bg-surface-50">
                      <div className="flex-1">
                        <h4 className="font-medium text-surface-900">{asset.name}</h4>
                        <div className="flex items-center mt-1">
                          <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                            {ASSET_TYPE_OPTIONS.find(opt => opt.value === asset.type)?.label}
                          </span>
                          {asset.description && (
                            <span className="text-sm text-surface-600 ml-3">{asset.description}</span>
                          )}
                        </div>
                      </div>
                      
                      <span className="text-lg font-semibold text-green-600">
                        {formatCurrency(asset.value)}
                      </span>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => assetModal.openModal(asset)}
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
                Debts ({debts.length}) - {formatCurrency(financialInfo.totalDebts || 0)}
              </h2>
              <Button 
                onClick={() => debtModal.openModal()}
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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                  <p className="text-sm">No debts added yet. Add your first debt above!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {debts.map((debt) => (
                    <div key={debt.id} className="flex items-center space-x-4 p-4 border border-surface-200 rounded-lg bg-surface-50">
                      <div className="flex-1">
                        <h4 className="font-medium text-surface-900">{debt.name}</h4>
                        <div className="flex items-center mt-1">
                          <span className="text-xs px-2 py-1 bg-red-100 text-red-800 rounded-full">
                            {DEBT_TYPE_OPTIONS.find(opt => opt.value === debt.type)?.label}
                          </span>
                          {debt.interestRate && (
                            <span className="text-sm text-surface-600 ml-3">{debt.interestRate}% APR</span>
                          )}
                          {debt.description && (
                            <span className="text-sm text-surface-600 ml-3">{debt.description}</span>
                          )}
                        </div>
                      </div>
                      
                      <span className="text-lg font-semibold text-red-600">
                        {formatCurrency(debt.balance)}
                      </span>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => debtModal.openModal(debt)}
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
          isOpen={assetModal.showModal}
          onClose={assetModal.closeModal}
          title={assetModal.editingAsset ? 'Edit Asset' : 'Add New Asset'}
        >
          <div className="space-y-4">
            <Input
              label="Asset Name"
              value={assetModal.assetForm.name}
              onChange={(e) => assetModal.updateForm({name: e.target.value})}
              placeholder="Primary Home"
            />
            
            <Select
              label="Asset Type"
              value={assetModal.assetForm.type}
              onChange={(e) => assetModal.updateForm({type: e.target.value as Asset['type']})}
              options={ASSET_TYPE_OPTIONS}
            />
            
            <Input
              label="Current Value ($)"
              type="number"
              value={assetModal.assetForm.value.toString()}
              onChange={(e) => assetModal.updateForm({value: parseFloat(e.target.value) || 0})}
              placeholder="500000"
            />
            
            <Input
              label="Description (Optional)"
              value={assetModal.assetForm.description || ''}
              onChange={(e) => assetModal.updateForm({description: e.target.value})}
              placeholder="Additional details about this asset"
            />
            
            <div className="flex justify-end space-x-3 pt-4">
              <Button variant="outline" onClick={assetModal.closeModal}>
                Cancel
              </Button>
              <Button 
                onClick={() => assetModal.handleSave(assets, saveAssetWithTotals)}
                disabled={!assetModal.isFormValid}
              >
                {assetModal.editingAsset ? 'Update Asset' : 'Add Asset'}
              </Button>
            </div>
          </div>
        </Modal>

        {/* Debt Modal */}
        <Modal
          isOpen={debtModal.showModal}
          onClose={debtModal.closeModal}
          title={debtModal.editingDebt ? 'Edit Debt' : 'Add New Debt'}
        >
          <div className="space-y-4">
            <Input
              label="Debt Name"
              value={debtModal.debtForm.name}
              onChange={(e) => debtModal.updateForm({name: e.target.value})}
              placeholder="Credit Card"
            />
            
            <Select
              label="Debt Type"
              value={debtModal.debtForm.type}
              onChange={(e) => debtModal.updateForm({type: e.target.value as Debt['type']})}
              options={DEBT_TYPE_OPTIONS}
            />
            
            <Input
              label="Current Balance ($)"
              type="number"
              value={debtModal.debtForm.balance.toString()}
              onChange={(e) => debtModal.updateForm({balance: parseFloat(e.target.value) || 0})}
              placeholder="5000"
            />
            
            <Input
              label="Interest Rate (% APR)"
              type="number"
              value={debtModal.debtForm.interestRate?.toString() || ''}
              onChange={(e) => debtModal.updateForm({interestRate: parseFloat(e.target.value) || 0})}
              placeholder="18.5"
            />
            
            <Input
              label="Description (Optional)"
              value={debtModal.debtForm.description || ''}
              onChange={(e) => debtModal.updateForm({description: e.target.value})}
              placeholder="Additional details about this debt"
            />
            
            <div className="flex justify-end space-x-3 pt-4">
              <Button variant="outline" onClick={debtModal.closeModal}>
                Cancel
              </Button>
              <Button 
                onClick={() => debtModal.handleSave(debts, saveDebtWithTotals)}
                disabled={!debtModal.isFormValid}
              >
                {debtModal.editingDebt ? 'Update Debt' : 'Add Debt'}
              </Button>
            </div>
          </div>
        </Modal>
      </div>

      {/* Footer and Chatbot */}
      <Footer />
      <MiniChatbot />
    </div>
  );
} 