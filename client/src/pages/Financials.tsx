import { Card, Button, Input, Select, Modal, LoadingSpinner } from '../components/ui';
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
  removeItemFromArray,
  calculateTotalAssets,
  calculateTotalDebts
} from '../utils/financial';
import { 
  formatNumberForDisplay, 
  parseNumberInput,
  formatArrayForDisplay,
  getArrayStatus 
} from '../utils/formatters';
import { useUnsavedChanges, UnsavedChangesPrompt } from '../utils/unsavedChanges';

export default function FinancialsRefactored() {
  // Custom hooks for financial data management
  const {
    loading,
    savingSection,
    financialInfo,
    assets,
    debts,
    hasFinancialInfoChanged,
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

  // Unsaved changes protection
  const { showPrompt, confirmNavigation, cancelNavigation } = useUnsavedChanges(
    hasFinancialInfoChanged,
    'You have unsaved changes to your financial information. Are you sure you want to leave without saving?'
  );

  // Asset management handlers
  const handleDeleteAsset = async (assetId: string) => {
    const assetsArray = formatArrayForDisplay(assets);
    const updatedAssets = removeItemFromArray(assetsArray, assetId);
    await saveAssetWithTotals(updatedAssets);
  };

  // Debt management handlers
  const handleDeleteDebt = async (debtId: string) => {
    const debtsArray = formatArrayForDisplay(debts);
    const updatedDebts = removeItemFromArray(debtsArray, debtId);
    await saveDebtWithTotals(updatedDebts);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-surface-50 via-secondary-50/20 to-accent-50/30 flex items-center justify-center">
        <LoadingSpinner 
          size="xl" 
          variant="secondary" 
          text="Loading your financial data..." 
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface-50 via-secondary-50/20 to-accent-50/30">
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
            <Card variant="secondary" className="text-center group hover:scale-105" hover>
              <div className="w-12 h-12 bg-gradient-to-br from-secondary-500 to-secondary-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-medium">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <div className="text-2xl font-bold text-secondary-700 mb-2">
                {formatCurrency(financialInfo.annualIncome || 0)}
              </div>
              <div className="text-sm text-secondary-600 font-medium">Annual Income</div>
            </Card>
            
            <Card variant="accent" className="text-center group hover:scale-105" hover>
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-medium">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="text-2xl font-bold text-red-600 mb-2">
                {formatCurrency(financialInfo.annualExpenses || 0)}
              </div>
              <div className="text-sm text-red-600 font-medium">Annual Expenses</div>
            </Card>
            
            <Card variant="primary" className="text-center group hover:scale-105" hover>
              <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-medium">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div className="text-2xl font-bold text-primary-700 mb-2">
                {formatCurrency(calculateTotalAssets(assets || []))}
              </div>
              <div className="text-sm text-primary-600 font-medium">Total Assets</div>
            </Card>
            
            <Card variant="glass" className="text-center group hover:scale-105" hover>
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-medium">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div className={`text-2xl font-bold mb-2 ${getNetWorthColor(calculateNetWorth())}`}>
                {formatCurrency(calculateNetWorth())}
              </div>
              <div className="text-sm text-purple-600 font-medium">Net Worth</div>
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
                disabled={savingSection === 'info' || !hasFinancialInfoChanged}
                variant={hasFinancialInfoChanged ? 'primary' : 'outline'}
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
                  value={formatNumberForDisplay(financialInfo.annualIncome)}
                  onChange={(e) => setFinancialInfo({...financialInfo, annualIncome: parseNumberInput(e.target.value)})}
                  placeholder="75000"
                />
                
                <Input
                  label="Annual Expenses"
                  type="number"
                  value={formatNumberForDisplay(financialInfo.annualExpenses)}
                  onChange={(e) => setFinancialInfo({...financialInfo, annualExpenses: parseNumberInput(e.target.value)})}
                  placeholder="45000"
                />
              </div>
              
              <Input
                label="Current Savings"
                type="number"
                value={formatNumberForDisplay(financialInfo.currentSavings)}
                onChange={(e) => setFinancialInfo({...financialInfo, currentSavings: parseNumberInput(e.target.value)})}
                placeholder="25000"
              />
            </div>
          </Card>

          {/* Assets */}
          <Card className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-surface-900">
                Assets ({formatArrayForDisplay(assets).length}) - {formatCurrency(calculateTotalAssets(assets || []))}
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
              {(() => {
                const assetsArray = formatArrayForDisplay(assets);
                const arrayStatus = getArrayStatus(assets);
                
                if (arrayStatus === 'not-entered') {
                  return (
                    <div className="text-center py-8 text-surface-500">
                      <svg className="w-12 h-12 mx-auto mb-4 text-surface-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                      <p className="text-sm">Asset information not entered yet. Add your first asset above!</p>
                    </div>
                  );
                } else if (arrayStatus === 'empty') {
                  return (
                    <div className="text-center py-8 text-surface-500">
                      <svg className="w-12 h-12 mx-auto mb-4 text-surface-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                      <p className="text-sm">You confirmed you have no assets. Add one if this changes!</p>
                    </div>
                  );
                } else {
                  return (
                    <div className="space-y-3">
                        {assetsArray.map((asset) => (
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
                    );
                  }
                })()}
              </div>
          </Card>

          {/* Debts */}
          <Card className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-surface-900">
                Debts ({formatArrayForDisplay(debts).length}) - {formatCurrency(calculateTotalDebts(debts || []))}
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
              {(() => {
                const debtsArray = formatArrayForDisplay(debts);
                const arrayStatus = getArrayStatus(debts);
                
                if (arrayStatus === 'not-entered') {
                  return (
                    <div className="text-center py-8 text-surface-500">
                      <svg className="w-12 h-12 mx-auto mb-4 text-surface-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                      <p className="text-sm">Debt information not entered yet. Add your first debt above!</p>
                    </div>
                  );
                } else if (arrayStatus === 'empty') {
                  return (
                    <div className="text-center py-8 text-surface-500">
                      <svg className="w-12 h-12 mx-auto mb-4 text-surface-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                      <p className="text-sm">You confirmed you have no debts. Great job!</p>
                    </div>
                  );
                } else {
                  return (
                    <div className="space-y-3">
                                              {debtsArray.map((debt) => (
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
                    );
                  }
                })()}
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
              value={assetModal.assetForm.value === 0 ? '' : assetModal.assetForm.value.toString()}
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
                onClick={() => assetModal.handleSave(formatArrayForDisplay(assets), saveAssetWithTotals)}
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
              value={debtModal.debtForm.balance === 0 ? '' : debtModal.debtForm.balance.toString()}
              onChange={(e) => debtModal.updateForm({balance: parseFloat(e.target.value) || 0})}
              placeholder="5000"
            />
            
            <Input
              label="Interest Rate (% APR)"
              type="number"
              value={debtModal.debtForm.interestRate === 0 ? '' : (debtModal.debtForm.interestRate?.toString() || '')}
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
                onClick={() => debtModal.handleSave(formatArrayForDisplay(debts), saveDebtWithTotals)}
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

      {/* Unsaved Changes Prompt */}
      <UnsavedChangesPrompt
        isOpen={showPrompt}
        onConfirm={confirmNavigation}
        onCancel={cancelNavigation}
        message="You have unsaved changes to your financial information. Are you sure you want to leave without saving?"
      />
    </div>
  );
} 