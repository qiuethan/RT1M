import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, Button, Input } from '../components/ui';
import Footer from '../components/Footer';
import { MiniChatbot } from '../components/MiniChatbot';
import { 
  getUserFinancials,
  updateUserFinancialsSection,
  FinancialInfo
} from '../services/firestore';

export default function Financials() {
  const { currentUser } = useAuth();

  // Loading states
  const [loading, setLoading] = useState(true);
  const [savingSection, setSavingSection] = useState<string | null>(null);

  // Collapsible sections state
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    info: true
  });

  // Financial data
  const [financialInfo, setFinancialInfo] = useState<FinancialInfo>({
    annualIncome: 0,
    annualExpenses: 0,
    totalAssets: 0,
    totalDebts: 0,
    currentSavings: 0
  });

  // Toggle section visibility
  const toggleSection = (section: string) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

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
        }
      } catch (error) {
        console.error('Error loading financials:', error);
      } finally {
        setLoading(false);
      }
    };

    loadFinancials();
  }, [currentUser]);

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
          {/* Financial Information */}
          <Card className="overflow-hidden">
            <div 
              className="p-6 cursor-pointer bg-gradient-to-r from-accent-50 to-primary-50 border-b border-surface-200"
              onClick={() => toggleSection('info')}
            >
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold text-surface-900 flex items-center">
                    <span className="w-2 h-2 bg-accent-500 rounded-full mr-3"></span>
                    Financial Information
                  </h2>
                  <p className="text-sm text-surface-600 mt-1">Track your income, expenses, and wealth building progress</p>
                </div>
                <svg 
                  className={`w-5 h-5 text-surface-500 transition-transform duration-200 ${openSections.info ? 'transform rotate-180' : ''}`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            
            {openSections.info && (
              <div className="p-6 space-y-8">
                {/* Income & Expenses Section */}
                <div>
                  <h3 className="text-lg font-medium text-surface-800 mb-4 flex items-center">
                    <span className="w-2 h-2 bg-primary-500 rounded-full mr-2"></span>
                    Cash Flow
                  </h3>
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
                  
                  {/* Cash Flow Summary */}
                  {(financialInfo.annualIncome > 0 || financialInfo.annualExpenses > 0) && (
                    <div className="mt-4 p-4 bg-gradient-to-r from-primary-50 to-accent-50 rounded-lg border">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-surface-700">Annual Cash Flow:</span>
                        <span className={`font-semibold ${
                          calculateCashFlow() >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {calculateCashFlow() >= 0 ? '+' : ''}${calculateCashFlow().toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-sm font-medium text-surface-700">Savings Rate:</span>
                        <span className="font-semibold text-primary-600">
                          {calculateSavingsRate().toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Assets & Debts Section */}
                <div>
                  <h3 className="text-lg font-medium text-surface-800 mb-4 flex items-center">
                    <span className="w-2 h-2 bg-secondary-500 rounded-full mr-2"></span>
                    Net Worth
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Input
                      label="Total Assets"
                      type="number"
                      value={financialInfo.totalAssets === 0 ? '' : financialInfo.totalAssets.toString()}
                      onChange={(e) => setFinancialInfo({...financialInfo, totalAssets: parseInt(e.target.value) || 0})}
                      placeholder="250000"
                    />
                    
                    <Input
                      label="Total Debts"
                      type="number"
                      value={financialInfo.totalDebts === 0 ? '' : financialInfo.totalDebts.toString()}
                      onChange={(e) => setFinancialInfo({...financialInfo, totalDebts: parseInt(e.target.value) || 0})}
                      placeholder="150000"
                    />
                    
                    <Input
                      label="Current Savings"
                      type="number"
                      value={financialInfo.currentSavings === 0 ? '' : financialInfo.currentSavings.toString()}
                      onChange={(e) => setFinancialInfo({...financialInfo, currentSavings: parseInt(e.target.value) || 0})}
                      placeholder="25000"
                    />
                  </div>
                  
                  {/* Net Worth Display */}
                  {(financialInfo.totalAssets > 0 || financialInfo.totalDebts > 0) && (
                    <div className="mt-4 p-6 bg-gradient-to-r from-secondary-50 via-surface-50 to-primary-50 rounded-xl border-2 border-surface-200">
                      <div className="text-center">
                        <div className="text-sm font-medium text-surface-600 mb-2">Your Current Net Worth</div>
                        <div className={`text-3xl font-bold mb-2 ${
                          calculateNetWorth() >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          ${calculateNetWorth().toLocaleString()}
                        </div>
                        <div className="text-sm text-surface-500 space-y-1">
                          <div>Assets: ${(financialInfo.totalAssets || 0).toLocaleString()}</div>
                          <div>Debts: ${(financialInfo.totalDebts || 0).toLocaleString()}</div>
                          <div>Liquid Savings: ${(financialInfo.currentSavings || 0).toLocaleString()}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end pt-4 border-t border-surface-200">
                  <Button 
                    onClick={saveFinancialInfo}
                    loading={savingSection === 'info'}
                    size="sm"
                  >
                    Save Changes
                  </Button>
                </div>
              </div>
            )}
          </Card>

          {/* Financial Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-6 text-center">
              <div className="text-2xl font-bold text-primary-600 mb-2">
                ${(financialInfo.annualIncome || 0).toLocaleString()}
              </div>
              <div className="text-sm text-surface-600">Annual Income</div>
            </Card>
            
            <Card className="p-6 text-center">
              <div className={`text-2xl font-bold mb-2 ${
                calculateNetWorth() >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                ${calculateNetWorth().toLocaleString()}
              </div>
              <div className="text-sm text-surface-600">Net Worth</div>
            </Card>
            
            <Card className="p-6 text-center">
              <div className={`text-2xl font-bold mb-2 ${
                calculateSavingsRate() >= 20 ? 'text-green-600' : 
                calculateSavingsRate() >= 10 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {calculateSavingsRate().toFixed(1)}%
              </div>
              <div className="text-sm text-surface-600">Savings Rate</div>
            </Card>
          </div>
        </div>

        <MiniChatbot />
      </div>
      <Footer />
    </div>
  );
} 