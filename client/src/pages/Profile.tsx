import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, Button, Input, Select, Badge } from '../components/ui';
import Footer from '../components/Footer';
import { MiniChatbot } from '../components/MiniChatbot';
import { 
  getUserProfile, 
  updateUserProfileSection, 
  BasicInfo,
  FinancialInfo,
  FinancialGoal,
  EducationEntry,
  ExperienceEntry,
  SkillsAndInterests
} from '../services/firestore';

export default function Profile() {
  const { currentUser } = useAuth();

  // Loading states
  const [loading, setLoading] = useState(true);
  const [savingSection, setSavingSection] = useState<string | null>(null);

  // Collapsible sections state
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    basic: true,
    financial: false,
    goal: false,
    education: false,
    experience: false,
    skills: false
  });

  // Profile sections
  const [basicInfo, setBasicInfo] = useState<BasicInfo>({
    name: '',
    email: '',
    birthday: '',
    location: '',
    occupation: '',
    country: '',
    employmentStatus: 'Employed'
  });

  const [financialInfo, setFinancialInfo] = useState<FinancialInfo>({
    annualIncome: 0,
    annualExpenses: 0,
    totalAssets: 0,
    totalDebts: 0,
    currentSavings: 0
  });

  const [financialGoal, setFinancialGoal] = useState<FinancialGoal & {
    timeframe?: string;
    riskTolerance?: string;
    primaryStrategy?: string;
  }>({
    targetAmount: 1000000,
    targetYear: new Date().getFullYear() + 20,
    timeframe: '',
    riskTolerance: '',
    primaryStrategy: ''
  });

  const [educationHistory, setEducationHistory] = useState<EducationEntry[]>([]);
  const [experience, setExperience] = useState<ExperienceEntry[]>([]);
  const [skillsAndInterests, setSkillsAndInterests] = useState<SkillsAndInterests>({
    skills: [],
    interests: []
  });

  // Custom skill and interest input states
  const [customSkillInput, setCustomSkillInput] = useState('');
  const [customInterestInput, setCustomInterestInput] = useState('');



  const availableSkills = [
    'Programming', 'Data Analysis', 'Project Management', 'Digital Marketing',
    'Graphic Design', 'Sales', 'Customer Service', 'Writing', 'Photography',
    'Video Editing', 'Web Development', 'Mobile Development', 'Consulting',
    'Teaching', 'Public Speaking', 'Languages', 'Real Estate', 'Trading',
    'E-commerce', 'Social Media', 'Finance', 'Accounting', 'Leadership'
  ];

  const availableInterests = [
    'Technology', 'Investing', 'Real Estate', 'Travel', 'Sports', 'Music',
    'Reading', 'Cooking', 'Fitness', 'Art', 'Gaming', 'Entrepreneurship',
    'Personal Development', 'Networking', 'Volunteering', 'Learning',
    'Innovation', 'Sustainability', 'Health & Wellness', 'Family'
  ];

  const employmentOptions = [
    { value: 'Employed', label: 'Full-time Employee' },
    { value: 'Part-time', label: 'Part-time Employee' },
    { value: 'Freelancer', label: 'Freelancer/Contractor' },
    { value: 'Entrepreneur', label: 'Entrepreneur/Business Owner' },
    { value: 'Student', label: 'Student' },
    { value: 'Unemployed', label: 'Unemployed' },
    { value: 'Retired', label: 'Retired' }
  ];

  const countryOptions = [
    { value: 'US', label: 'United States (USD)' },
    { value: 'CA', label: 'Canada (CAD)' },
    { value: 'GB', label: 'United Kingdom (GBP)' },
    { value: 'AU', label: 'Australia (AUD)' },
    { value: 'DE', label: 'Germany (EUR)' },
    { value: 'FR', label: 'France (EUR)' },
    { value: 'IT', label: 'Italy (EUR)' },
    { value: 'ES', label: 'Spain (EUR)' },
    { value: 'NL', label: 'Netherlands (EUR)' },
    { value: 'CH', label: 'Switzerland (CHF)' },
    { value: 'JP', label: 'Japan (JPY)' },
    { value: 'SG', label: 'Singapore (SGD)' },
    { value: 'OTHER', label: 'Other' }
  ];

  const timeframeOptions = [
    { value: '1-3 years', label: '1-3 years' },
    { value: '3-5 years', label: '3-5 years' },
    { value: '5-10 years', label: '5-10 years' },
    { value: '10+ years', label: '10+ years' }
  ];

  const riskToleranceOptions = [
    { value: 'conservative', label: 'Conservative - Prefer stable, low-risk investments' },
    { value: 'moderate', label: 'Moderate - Balanced approach to risk and return' },
    { value: 'aggressive', label: 'Aggressive - High-risk, high-reward investments' }
  ];

  const strategyOptions = [
    { value: 'investing', label: 'Investing in stocks/ETFs' },
    { value: 'real-estate', label: 'Real estate investment' },
    { value: 'business', label: 'Starting/growing a business' },
    { value: 'mixed', label: 'Mixed approach' },
    { value: 'other', label: 'Other' }
  ];

  // Toggle section visibility
  const toggleSection = (section: string) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Load profile data on component mount
  useEffect(() => {
    const loadProfile = async () => {
      if (!currentUser) return;
      
      try {
        setLoading(true);
        const profile = await getUserProfile();
        
        if (profile) {
          setBasicInfo(profile.basicInfo || {
            name: currentUser.displayName || '',
            email: currentUser.email || '',
            birthday: '',
            location: '',
            occupation: '',
            country: '',
            employmentStatus: 'Employed'
          });
          setFinancialInfo(profile.financialInfo || {
            annualIncome: 0,
            annualExpenses: 0,
            totalAssets: 0,
            totalDebts: 0,
            currentSavings: 0
          });
          setFinancialGoal({
            targetAmount: profile.financialGoal?.targetAmount || 1000000,
            targetYear: profile.financialGoal?.targetYear || new Date().getFullYear() + 20,
            timeframe: profile.financialGoal?.timeframe || '',
            riskTolerance: profile.financialGoal?.riskTolerance || '',
            primaryStrategy: profile.financialGoal?.primaryStrategy || ''
          });
          setEducationHistory(profile.educationHistory || []);
          setExperience(profile.experience || []);
          setSkillsAndInterests(profile.skillsAndInterests || {
            skills: [],
            interests: []
          });
        } else {
          // Set defaults for new users
          setBasicInfo({
            name: currentUser.displayName || '',
            email: currentUser.email || '',
            birthday: '',
            location: '',
            occupation: '',
            country: '',
            employmentStatus: 'Employed'
          });
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [currentUser]);

  // Helper functions for managing arrays
  const addEducationEntry = () => {
    const newEntry: EducationEntry = {
      school: '',
      field: '',
      graduationYear: ''
    };
    setEducationHistory([...educationHistory, newEntry]);
  };

  const updateEducationEntry = (index: number, field: keyof EducationEntry, value: string) => {
    const updated = [...educationHistory];
    updated[index] = { ...updated[index], [field]: value };
    setEducationHistory(updated);
  };

  const removeEducationEntry = (index: number) => {
    setEducationHistory(educationHistory.filter((_, i) => i !== index));
  };

  const addExperienceEntry = () => {
    const newEntry: ExperienceEntry = {
      company: '',
      position: '',
      startYear: '',
      endYear: '',
      description: ''
    };
    setExperience([...experience, newEntry]);
  };

  const updateExperienceEntry = (index: number, field: keyof ExperienceEntry, value: string) => {
    const updated = [...experience];
    updated[index] = { ...updated[index], [field]: value };
    setExperience(updated);
  };

  const removeExperienceEntry = (index: number) => {
    setExperience(experience.filter((_, i) => i !== index));
  };

  const toggleSkill = (skill: string) => {
    setSkillsAndInterests(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill]
    }));
  };

  const toggleInterest = (interest: string) => {
    setSkillsAndInterests(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  const addCustomSkill = () => {
    if (customSkillInput.trim() && !skillsAndInterests.skills.includes(customSkillInput.trim())) {
      setSkillsAndInterests(prev => ({
        ...prev,
        skills: [...prev.skills, customSkillInput.trim()]
      }));
      setCustomSkillInput('');
    }
  };

  const addCustomInterest = () => {
    if (customInterestInput.trim() && !skillsAndInterests.interests.includes(customInterestInput.trim())) {
      setSkillsAndInterests(prev => ({
        ...prev,
        interests: [...prev.interests, customInterestInput.trim()]
      }));
      setCustomInterestInput('');
    }
  };

  const handleCustomSkillKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addCustomSkill();
    }
  };

  const handleCustomInterestKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addCustomInterest();
    }
  };

  // Save functions
  const saveBasicInfo = async () => {
    setSavingSection('basic');
    try {
      await updateUserProfileSection('basicInfo', basicInfo);
    } catch (error) {
      console.error('Error saving basic info:', error);
    } finally {
      setSavingSection(null);
    }
  };



  const saveFinancialInfo = async () => {
    setSavingSection('financial');
    try {
      await updateUserProfileSection('financialInfo', financialInfo);
    } catch (error) {
      console.error('Error saving financial info:', error);
    } finally {
      setSavingSection(null);
    }
  };

  const saveFinancialGoal = async () => {
    setSavingSection('goal');
    try {
      await updateUserProfileSection('financialGoal', financialGoal);
    } catch (error) {
      console.error('Error saving financial goal:', error);
    } finally {
      setSavingSection(null);
    }
  };

  const saveEducationHistory = async () => {
    setSavingSection('education');
    try {
      // Filter out empty entries
      const validEducation = educationHistory.filter(edu => 
        edu.school.trim() || edu.field.trim() || edu.graduationYear.trim()
      );
      await updateUserProfileSection('educationHistory', validEducation);
      setEducationHistory(validEducation);
    } catch (error) {
      console.error('Error saving education history:', error);
    } finally {
      setSavingSection(null);
    }
  };

  const saveExperience = async () => {
    setSavingSection('experience');
    try {
      // Filter out empty entries
      const validExperience = experience.filter(exp => 
        exp.company.trim() || exp.position.trim() || exp.startYear.trim() || exp.endYear.trim()
      );
      await updateUserProfileSection('experience', validExperience);
      setExperience(validExperience);
    } catch (error) {
      console.error('Error saving experience:', error);
    } finally {
      setSavingSection(null);
    }
  };

  const saveSkillsAndInterests = async () => {
    setSavingSection('skills');
    try {
      await updateUserProfileSection('skillsAndInterests', skillsAndInterests);
    } catch (error) {
      console.error('Error saving skills and interests:', error);
    } finally {
      setSavingSection(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-surface-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-50">
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-surface-900">
            {basicInfo.name ? `${basicInfo.name}'s Profile` : 'Your Profile'}
          </h1>
          <p className="text-surface-600 mt-2">
            {basicInfo.name 
              ? `Welcome back, ${basicInfo.name.split(' ')[0]}! Manage your personal and financial information` 
              : 'Manage your personal and financial information'
            }
          </p>
        </div>

        <div className="space-y-6">
          {/* Basic Information */}
          <Card className="overflow-hidden">
            <div 
              className="p-6 cursor-pointer bg-gradient-to-r from-primary-50 to-secondary-50 border-b border-surface-200"
              onClick={() => toggleSection('basic')}
            >
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold text-surface-900 flex items-center">
                    <span className="w-2 h-2 bg-primary-500 rounded-full mr-3"></span>
                    Basic Information
                  </h2>
                  <p className="text-sm text-surface-600 mt-1">Your personal details and contact information</p>
                </div>
                <svg 
                  className={`w-5 h-5 text-surface-500 transition-transform duration-200 ${openSections.basic ? 'transform rotate-180' : ''}`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            
            {openSections.basic && (
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    label="Full Name"
                    type="text"
                    value={basicInfo.name}
                    onChange={(e) => setBasicInfo({...basicInfo, name: e.target.value})}
                    placeholder="Enter your full name"
                  />
                  
                  <Input
                    label="Email Address"
                    type="email"
                    value={basicInfo.email}
                    onChange={(e) => setBasicInfo({...basicInfo, email: e.target.value})}
                    placeholder="your.email@example.com"
                  />
                  
                  <Input
                    label="Date of Birth"
                    type="date"
                    value={basicInfo.birthday}
                    onChange={(e) => setBasicInfo({...basicInfo, birthday: e.target.value})}
                  />
                  
                  <Select
                    label="Country"
                    value={basicInfo.country}
                    onChange={(e) => setBasicInfo({...basicInfo, country: e.target.value})}
                    options={countryOptions}
                  />
                  
                  <Input
                    label="Location"
                    value={basicInfo.location}
                    onChange={(e) => setBasicInfo({...basicInfo, location: e.target.value})}
                    placeholder="City, State/Province"
                  />
                  
                  <Input
                    label="Occupation"
                    value={basicInfo.occupation}
                    onChange={(e) => setBasicInfo({...basicInfo, occupation: e.target.value})}
                    placeholder="Your job title or profession"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Select
                    label="Employment Status"
                    value={basicInfo.employmentStatus}
                    onChange={(e) => setBasicInfo({...basicInfo, employmentStatus: e.target.value})}
                    options={employmentOptions}
                  />
                </div>
                
                <div className="flex justify-end pt-4 border-t border-surface-200">
                  <Button 
                    onClick={saveBasicInfo}
                    loading={savingSection === 'basic'}
                    size="sm"
                  >
                    Save Changes
                  </Button>
                </div>
              </div>
            )}
          </Card>

          {/* Financial Information */}
          <Card className="overflow-hidden">
            <div 
              className="p-6 cursor-pointer bg-gradient-to-r from-accent-50 to-primary-50 border-b border-surface-200"
              onClick={() => toggleSection('financial')}
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
                  className={`w-5 h-5 text-surface-500 transition-transform duration-200 ${openSections.financial ? 'transform rotate-180' : ''}`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            
            {openSections.financial && (
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
                    <div className="mt-4 p-3 bg-gradient-to-r from-primary-50 to-accent-50 rounded-lg border">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-surface-700">Annual Cash Flow:</span>
                        <span className={`font-semibold ${
                          (financialInfo.annualIncome - financialInfo.annualExpenses) >= 0 
                            ? 'text-green-600' 
                            : 'text-red-600'
                        }`}>
                          {(financialInfo.annualIncome - financialInfo.annualExpenses) >= 0 ? '+' : ''}
                          ${(financialInfo.annualIncome - financialInfo.annualExpenses).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Assets & Debts Section */}
                <div>
                  <h3 className="text-lg font-medium text-surface-800 mb-4 flex items-center">
                    <span className="w-2 h-2 bg-accent-500 rounded-full mr-2"></span>
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
                </div>
                
                {/* Net Worth Display */}
                <div className="p-6 bg-gradient-to-r from-secondary-50 via-surface-50 to-primary-50 rounded-xl border-2 border-surface-200">
                  <div className="text-center">
                    <div className="text-sm font-medium text-surface-600 mb-2">Your Current Net Worth</div>
                    <div className={`text-3xl font-bold mb-2 ${
                      (financialInfo.totalAssets - financialInfo.totalDebts) >= 0 
                        ? 'text-green-600' 
                        : 'text-red-600'
                    }`}>
                      ${(financialInfo.totalAssets - financialInfo.totalDebts).toLocaleString()}
                    </div>
                    <div className="text-sm text-surface-500 space-y-1">
                      <div>Assets: ${financialInfo.totalAssets.toLocaleString()}</div>
                      <div>Debts: ${financialInfo.totalDebts.toLocaleString()}</div>
                      {financialInfo.currentSavings > 0 && (
                        <div className="pt-2 border-t border-surface-200">
                          Liquid Savings: ${financialInfo.currentSavings.toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end pt-4 border-t border-surface-200">
                  <Button 
                    onClick={saveFinancialInfo}
                    loading={savingSection === 'financial'}
                    size="sm"
                  >
                    Save Changes
                  </Button>
                </div>
              </div>
            )}
          </Card>

          {/* Financial Goal */}
          <Card className="overflow-hidden">
            <div 
              className="p-6 cursor-pointer bg-gradient-to-r from-secondary-50 to-accent-50 border-b border-surface-200"
              onClick={() => toggleSection('goal')}
            >
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold text-surface-900 flex items-center">
                    <span className="w-2 h-2 bg-secondary-500 rounded-full mr-3"></span>
                    Financial Goal & Strategy
                  </h2>
                  <p className="text-sm text-surface-600 mt-1">Set your ultimate wealth-building target and strategy</p>
                </div>
                <svg 
                  className={`w-5 h-5 text-surface-500 transition-transform duration-200 ${openSections.goal ? 'transform rotate-180' : ''}`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            
            {openSections.goal && (
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    label="Target Amount ($)"
                    type="number"
                    value={financialGoal.targetAmount === 0 ? '' : financialGoal.targetAmount.toString()}
                    onChange={(e) => setFinancialGoal({...financialGoal, targetAmount: parseInt(e.target.value) || 0})}
                    placeholder="1000000"
                  />
                  
                  <Input
                    label="Target Year"
                    type="number"
                    value={financialGoal.targetYear === 0 ? '' : financialGoal.targetYear.toString()}
                    onChange={(e) => setFinancialGoal({...financialGoal, targetYear: parseInt(e.target.value) || 0})}
                    placeholder="2030"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Select
                    label="Timeframe"
                    value={financialGoal.timeframe || ''}
                    onChange={(e) => setFinancialGoal({...financialGoal, timeframe: e.target.value})}
                    options={timeframeOptions}
                  />
                  
                  <Select
                    label="Risk Tolerance"
                    value={financialGoal.riskTolerance || ''}
                    onChange={(e) => setFinancialGoal({...financialGoal, riskTolerance: e.target.value})}
                    options={riskToleranceOptions}
                  />
                  
                  <Select
                    label="Primary Strategy"
                    value={financialGoal.primaryStrategy || ''}
                    onChange={(e) => setFinancialGoal({...financialGoal, primaryStrategy: e.target.value})}
                    options={strategyOptions}
                  />
                </div>
                
                {(financialGoal.targetAmount > 0 && financialGoal.targetYear > 0) && (
                  <div className="p-4 bg-gradient-to-r from-accent-50 to-secondary-50 rounded-lg border">
                    <div className="text-center">
                      <div className="text-sm font-medium text-surface-700 mb-2">Your RT1M Goal</div>
                      <div className="text-2xl font-bold text-accent-600 mb-1">
                        ${financialGoal.targetAmount.toLocaleString()}
                      </div>
                      <div className="text-sm text-surface-600">
                        Target: {financialGoal.targetYear}
                        {financialGoal.targetYear > new Date().getFullYear() && (
                          <span className="ml-2 text-surface-500">
                            ({financialGoal.targetYear - new Date().getFullYear()} years to go)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="flex justify-end pt-4 border-t border-surface-200">
                  <Button 
                    onClick={saveFinancialGoal}
                    loading={savingSection === 'goal'}
                    size="sm"
                  >
                    Save Changes
                  </Button>
                </div>
              </div>
            )}
          </Card>

          {/* Education History */}
          <Card className="overflow-hidden">
            <div 
              className="p-6 cursor-pointer bg-gradient-to-r from-primary-50 to-surface-50 border-b border-surface-200"
              onClick={() => toggleSection('education')}
            >
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold text-surface-900 flex items-center">
                    <span className="w-2 h-2 bg-primary-500 rounded-full mr-3"></span>
                    Education History
                  </h2>
                  <p className="text-sm text-surface-600 mt-1">Your academic background and qualifications</p>
                </div>
                <svg 
                  className={`w-5 h-5 text-surface-500 transition-transform duration-200 ${openSections.education ? 'transform rotate-180' : ''}`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            
            {openSections.education && (
              <div className="p-6 space-y-6">
                {educationHistory.map((edu, index) => (
                  <div key={index} className="p-4 border border-surface-200 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <Input
                        label="School/Institution"
                        value={edu.school}
                        onChange={(e) => updateEducationEntry(index, 'school', e.target.value)}
                        placeholder="University of Example"
                      />
                      <Input
                        label="Field of Study"
                        value={edu.field}
                        onChange={(e) => updateEducationEntry(index, 'field', e.target.value)}
                        placeholder="Computer Science"
                      />
                      <Input
                        label="Graduation Year"
                        value={edu.graduationYear}
                        onChange={(e) => updateEducationEntry(index, 'graduationYear', e.target.value)}
                        placeholder="2020"
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeEducationEntry(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      Remove
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  onClick={addEducationEntry}
                >
                  Add Education
                </Button>
                
                <div className="flex justify-end pt-4 border-t border-surface-200">
                  <Button 
                    onClick={saveEducationHistory}
                    loading={savingSection === 'education'}
                    size="sm"
                  >
                    Save Changes
                  </Button>
                </div>
              </div>
            )}
          </Card>

          {/* Work Experience */}
          <Card className="overflow-hidden">
            <div 
              className="p-6 cursor-pointer bg-gradient-to-r from-accent-50 to-surface-50 border-b border-surface-200"
              onClick={() => toggleSection('experience')}
            >
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold text-surface-900 flex items-center">
                    <span className="w-2 h-2 bg-accent-500 rounded-full mr-3"></span>
                    Work Experience
                  </h2>
                  <p className="text-sm text-surface-600 mt-1">Your professional work history and experience</p>
                </div>
                <svg 
                  className={`w-5 h-5 text-surface-500 transition-transform duration-200 ${openSections.experience ? 'transform rotate-180' : ''}`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            
            {openSections.experience && (
              <div className="p-6 space-y-6">
                {experience.map((exp, index) => (
                  <div key={index} className="p-4 border border-surface-200 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <Input
                        label="Company"
                        value={exp.company}
                        onChange={(e) => updateExperienceEntry(index, 'company', e.target.value)}
                        placeholder="Tech Corp"
                      />
                      <Input
                        label="Position"
                        value={exp.position}
                        onChange={(e) => updateExperienceEntry(index, 'position', e.target.value)}
                        placeholder="Software Engineer"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <Input
                        label="Start Year"
                        value={exp.startYear}
                        onChange={(e) => updateExperienceEntry(index, 'startYear', e.target.value)}
                        placeholder="2020"
                      />
                      <Input
                        label="End Year"
                        value={exp.endYear}
                        onChange={(e) => updateExperienceEntry(index, 'endYear', e.target.value)}
                        placeholder="Present or 2022"
                      />
                    </div>
                    <Input
                      label="Description (Optional)"
                      value={exp.description}
                      onChange={(e) => updateExperienceEntry(index, 'description', e.target.value)}
                      placeholder="Brief description of your role..."
                      className="mb-4"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeExperienceEntry(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      Remove
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  onClick={addExperienceEntry}
                >
                  Add Experience
                </Button>
                
                <div className="flex justify-end pt-4 border-t border-surface-200">
                  <Button 
                    onClick={saveExperience}
                    loading={savingSection === 'experience'}
                    size="sm"
                  >
                    Save Changes
                  </Button>
                </div>
              </div>
            )}
          </Card>

          {/* Skills & Interests */}
          <Card className="overflow-hidden">
            <div 
              className="p-6 cursor-pointer bg-gradient-to-r from-secondary-50 to-surface-50 border-b border-surface-200"
              onClick={() => toggleSection('skills')}
            >
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold text-surface-900 flex items-center">
                    <span className="w-2 h-2 bg-secondary-500 rounded-full mr-3"></span>
                    Skills & Interests
                  </h2>
                  <p className="text-sm text-surface-600 mt-1">Your professional skills and personal interests</p>
                </div>
                <svg 
                  className={`w-5 h-5 text-surface-500 transition-transform duration-200 ${openSections.skills ? 'transform rotate-180' : ''}`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            
            {openSections.skills && (
              <div className="p-6 space-y-8">
                {/* Skills Section */}
                <div>
                  <h3 className="text-lg font-medium text-surface-800 mb-4 flex items-center">
                    <span className="w-2 h-2 bg-primary-500 rounded-full mr-2"></span>
                    Skills
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 mb-4">
                    {availableSkills.map((skill) => (
                      <button
                        key={skill}
                        onClick={() => toggleSkill(skill)}
                        className={`px-3 py-2 rounded-full text-sm border transition-colors ${
                          skillsAndInterests.skills.includes(skill)
                            ? 'bg-primary-100 border-primary-300 text-primary-800'
                            : 'bg-white border-surface-300 text-surface-700 hover:bg-surface-50'
                        }`}
                      >
                        {skill}
                      </button>
                    ))}
                  </div>
                  
                  {/* Custom Skills */}
                  <div className="flex gap-2 mb-4">
                    <Input
                      value={customSkillInput}
                      onChange={(e) => setCustomSkillInput(e.target.value)}
                      placeholder="Add a custom skill..."
                      onKeyDown={handleCustomSkillKeyPress}
                    />
                    <Button
                      variant="outline"
                      onClick={addCustomSkill}
                      disabled={!customSkillInput.trim() || skillsAndInterests.skills.includes(customSkillInput.trim())}
                    >
                      Add
                    </Button>
                  </div>
                  
                  {/* Selected Skills */}
                  {skillsAndInterests.skills.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-surface-700 mb-2">Selected Skills:</h4>
                      <div className="flex flex-wrap gap-2">
                        {skillsAndInterests.skills.map((skill) => (
                          <Badge key={skill} variant="primary" className="flex items-center">
                            {skill}
                            <button
                              onClick={() => toggleSkill(skill)}
                              className="ml-2 text-primary-600 hover:text-primary-800"
                            >
                              ×
                            </button>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Interests Section */}
                <div>
                  <h3 className="text-lg font-medium text-surface-800 mb-4 flex items-center">
                    <span className="w-2 h-2 bg-secondary-500 rounded-full mr-2"></span>
                    Interests
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 mb-4">
                    {availableInterests.map((interest) => (
                      <button
                        key={interest}
                        onClick={() => toggleInterest(interest)}
                        className={`px-3 py-2 rounded-full text-sm border transition-colors ${
                          skillsAndInterests.interests.includes(interest)
                            ? 'bg-secondary-100 border-secondary-300 text-secondary-800'
                            : 'bg-white border-surface-300 text-surface-700 hover:bg-surface-50'
                        }`}
                      >
                        {interest}
                      </button>
                    ))}
                  </div>
                  
                  {/* Custom Interests */}
                  <div className="flex gap-2 mb-4">
                    <Input
                      value={customInterestInput}
                      onChange={(e) => setCustomInterestInput(e.target.value)}
                      placeholder="Add a custom interest..."
                      onKeyDown={handleCustomInterestKeyPress}
                    />
                    <Button
                      variant="outline"
                      onClick={addCustomInterest}
                      disabled={!customInterestInput.trim() || skillsAndInterests.interests.includes(customInterestInput.trim())}
                    >
                      Add
                    </Button>
                  </div>
                  
                  {/* Selected Interests */}
                  {skillsAndInterests.interests.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-surface-700 mb-2">Selected Interests:</h4>
                      <div className="flex flex-wrap gap-2">
                        {skillsAndInterests.interests.map((interest) => (
                          <Badge key={interest} variant="secondary" className="flex items-center">
                            {interest}
                            <button
                              onClick={() => toggleInterest(interest)}
                              className="ml-2 text-secondary-600 hover:text-secondary-800"
                            >
                              ×
                            </button>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex justify-end pt-4 border-t border-surface-200">
                  <Button 
                    onClick={saveSkillsAndInterests}
                    loading={savingSection === 'skills'}
                    size="sm"
                  >
                    Save Changes
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
      <Footer />
      
      {/* Mini Chatbot */}
      <MiniChatbot />
    </div>
  );
} 