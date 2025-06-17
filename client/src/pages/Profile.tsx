import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, Button, Input, Select, Badge } from '../components/ui';
import Footer from '../components/Footer';
import { saveUserProfile, getUserProfile, updateUserProfileSection, UserProfile } from '../services/firestore';

interface EducationEntry {
  id: number;
  school: string;
  major: string;
  graduationYear: string;
}

interface FinancialGoal {
  targetAmount: string;
  targetAge: string;
  targetYear: string;
}

export default function Profile() {
  const { currentUser } = useAuth();

  // Loading states
  const [loading, setLoading] = useState(true);
  const [savingSection, setSavingSection] = useState<string | null>(null);

  // Basic Information
  const [birthday, setBirthday] = useState('1995-06-15');
  const [income, setIncome] = useState('75000');
  const [expenses, setExpenses] = useState('55000');
  const [currentSavings, setCurrentSavings] = useState('125500');
  const [assets, setAssets] = useState('200000');
  const [debts, setDebts] = useState('74500');
  const [employmentStatus, setEmploymentStatus] = useState('full-time');

  // Financial Goal
  const [financialGoal, setFinancialGoal] = useState<FinancialGoal>({
    targetAmount: '1000000',
    targetAge: '45',
    targetYear: '2040'
  });

  // Education History
  const [educationEntries, setEducationEntries] = useState<EducationEntry[]>([
    {
      id: 1,
      school: 'State University',
      major: 'Computer Science',
      graduationYear: '2018'
    }
  ]);

  // Skills and Interests
  const [selectedSkills, setSelectedSkills] = useState<string[]>([
    'Programming', 'Data Analysis', 'Project Management'
  ]);

  const availableSkills = [
    'Programming', 'Data Analysis', 'Project Management', 'Digital Marketing',
    'Graphic Design', 'Sales', 'Customer Service', 'Writing', 'Photography',
    'Video Editing', 'Web Development', 'Mobile Development', 'Consulting',
    'Teaching', 'Public Speaking', 'Languages', 'Real Estate', 'Trading',
    'E-commerce', 'Social Media'
  ];

  const addEducationEntry = () => {
    const newEntry: EducationEntry = {
      id: Date.now(),
      school: '',
      major: '',
      graduationYear: ''
    };
    setEducationEntries([...educationEntries, newEntry]);
  };

  const updateEducationEntry = (id: number, field: keyof EducationEntry, value: string) => {
    setEducationEntries(educationEntries.map(entry => 
      entry.id === id ? { ...entry, [field]: value } : entry
    ));
  };

  const removeEducationEntry = (id: number) => {
    setEducationEntries(educationEntries.filter(entry => entry.id !== id));
  };

  const toggleSkill = (skill: string) => {
    setSelectedSkills(prev => 
      prev.includes(skill) 
        ? prev.filter(s => s !== skill)
        : [...prev, skill]
    );
  };

  const employmentOptions = [
    { value: 'full-time', label: 'Full-time Employee' },
    { value: 'part-time', label: 'Part-time Employee' },
    { value: 'freelancer', label: 'Freelancer/Contractor' },
    { value: 'entrepreneur', label: 'Entrepreneur/Business Owner' },
    { value: 'student', label: 'Student' },
    { value: 'unemployed', label: 'Unemployed' },
    { value: 'retired', label: 'Retired' }
  ];

  // Load profile data on component mount
  useEffect(() => {
    const loadProfile = async () => {
      if (!currentUser) return;
      
      try {
        setLoading(true);
        const profile = await getUserProfile();
        
        if (profile) {
          setBirthday(profile.birthday || '1995-06-15');
          setEmploymentStatus(profile.employmentStatus || 'full-time');
          setIncome(profile.income?.toString() || '75000');
          setExpenses(profile.expenses?.toString() || '55000');
          setCurrentSavings(profile.currentSavings?.toString() || '125500');
          setAssets(profile.assets?.toString() || '200000');
          setDebts(profile.debts?.toString() || '74500');
          setFinancialGoal({
            targetAmount: profile.targetAmount?.toString() || '1000000',
            targetAge: profile.targetAge?.toString() || '45',
            targetYear: profile.targetYear?.toString() || '2040'
          });
          setEducationEntries(profile.education || [{
            id: 1,
            school: 'State University',
            major: 'Computer Science',
            graduationYear: '2018'
          }]);
          setSelectedSkills(profile.skills || ['Programming', 'Data Analysis', 'Project Management']);
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      } finally {
          setLoading(false);
      }
    };

    loadProfile();
  }, [currentUser]);

  // Save functions for each section
  const saveBasicInfo = async () => {
    setSavingSection('basic');
    try {
      await updateUserProfileSection('basic', {
        birthday,
        employmentStatus
      });
    } catch (error) {
      console.error('Error saving basic info:', error);
    } finally {
      setSavingSection(null);
      }
  };

  const saveFinancialInfo = async () => {
    setSavingSection('financial');
    try {
      await updateUserProfileSection('financial', {
        income: parseInt(income || '0'),
        expenses: parseInt(expenses || '0'),
        currentSavings: parseInt(currentSavings || '0'),
        assets: parseInt(assets || '0'),
        debts: parseInt(debts || '0')
      });
    } catch (error) {
      console.error('Error saving financial info:', error);
    } finally {
      setSavingSection(null);
    }
  };

  const saveFinancialGoal = async () => {
    setSavingSection('goal');
    try {
      await updateUserProfileSection('goal', {
        targetAmount: parseInt(financialGoal.targetAmount || '0'),
        targetAge: parseInt(financialGoal.targetAge || '0'),
        targetYear: parseInt(financialGoal.targetYear || '0')
      });
    } catch (error) {
      console.error('Error saving financial goal:', error);
    } finally {
      setSavingSection(null);
    }
  };

  const saveEducationHistory = async () => {
    setSavingSection('education');
    try {
      await updateUserProfileSection('education', {
        education: educationEntries
      });
    } catch (error) {
      console.error('Error saving education history:', error);
    } finally {
      setSavingSection(null);
    }
  };

  const saveSkillsInterests = async () => {
    setSavingSection('skills');
    try {
      await updateUserProfileSection('skills', {
        skills: selectedSkills
      });
    } catch (error) {
      console.error('Error saving skills:', error);
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
          <h1 className="text-3xl font-bold text-surface-900">Profile Settings</h1>
          <p className="text-surface-600 mt-2">Manage your personal and financial information</p>
        </div>

        <div className="space-y-8">
          {/* Basic Information */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-surface-900 mb-6">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Birthday"
                type="date"
                value={birthday}
                onChange={(e) => setBirthday(e.target.value)}
                placeholder="Enter your birthday"
              />
            
              <Select
                label="Employment Status"
                value={employmentStatus}
                onChange={(e) => setEmploymentStatus(e.target.value)}
                options={employmentOptions}
              />
            </div>

            <div className="flex justify-end mt-6">
              <Button 
                size="sm" 
                onClick={saveBasicInfo}
                loading={savingSection === 'basic'}
              >
                Save Basic Info
              </Button>
            </div>
          </Card>

          {/* Financial Information */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-surface-900 mb-6">Financial Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                <h3 className="text-sm font-medium text-surface-700 mb-3">Income & Expenses</h3>
                <div className="space-y-4">
                  <Input
                    label="Annual Income"
                    type="number"
                    value={income}
                    onChange={(e) => setIncome(e.target.value)}
                    placeholder="75000"
                  />
                  
                  <Input
                    label="Annual Expenses"
                    type="number"
                    value={expenses}
                    onChange={(e) => setExpenses(e.target.value)}
                    placeholder="55000"
                  />
                </div>
                </div>

                <div>
                <h3 className="text-sm font-medium text-surface-700 mb-3">Assets & Debts</h3>
                <div className="space-y-4">
                  <Input
                    label="Total Assets"
                    type="number"
                    value={assets}
                    onChange={(e) => setAssets(e.target.value)}
                    placeholder="200000"
                  />
                  
                  <Input
                    label="Total Debts"
                    type="number"
                    value={debts}
                    onChange={(e) => setDebts(e.target.value)}
                    placeholder="74500"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 mb-6">
              <Input
                label="Current Savings"
                type="number"
                value={currentSavings}
                onChange={(e) => setCurrentSavings(e.target.value)}
                placeholder="125500"
              />
              </div>

            {/* Financial Summary */}
            <div className="p-4 bg-surface-50 rounded-lg mb-4">
              <h3 className="text-sm font-medium text-surface-700 mb-3">Financial Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-surface-600">Net Annual Income:</span>
                  <div className="font-semibold text-secondary-600">
                    ${(parseInt(income || '0') - parseInt(expenses || '0')).toLocaleString()}
                  </div>
                </div>
                <div>
                  <span className="text-surface-600">Savings Rate:</span>
                  <div className="font-semibold text-primary-600">
                    {parseInt(income || '0') > 0 ? 
                      (((parseInt(income || '0') - parseInt(expenses || '0')) / parseInt(income || '0')) * 100).toFixed(1)
                      : 0}%
                  </div>
                </div>
                  <div>
                  <span className="text-surface-600">Net Worth:</span>
                  <div className="font-semibold text-accent-600">
                    ${(parseInt(assets || '0') - parseInt(debts || '0')).toLocaleString()}
                  </div>
                </div>
                  <div>
                  <span className="text-surface-600">Liquid Savings:</span>
                  <div className="font-semibold text-secondary-600">
                    ${parseInt(currentSavings || '0').toLocaleString()}
                  </div>
                  </div>
                </div>
              </div>

            <div className="flex justify-end mt-6">
              <Button 
                size="sm" 
                onClick={saveFinancialInfo}
                loading={savingSection === 'financial'}
              >
                Save Financial Info
              </Button>
              </div>
          </Card>

          {/* Financial Goal */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-surface-900 mb-6">Financial Goal</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Input
                label="Target Amount ($)"
                type="number"
                value={financialGoal.targetAmount}
                onChange={(e) => setFinancialGoal({...financialGoal, targetAmount: e.target.value})}
                placeholder="1000000"
              />
              
              <Input
                label="Target Age"
                type="number"
                value={financialGoal.targetAge}
                onChange={(e) => setFinancialGoal({...financialGoal, targetAge: e.target.value})}
                placeholder="45"
              />
              
              <Input
                label="Target Year"
                type="number"
                value={financialGoal.targetYear}
                onChange={(e) => setFinancialGoal({...financialGoal, targetYear: e.target.value})}
                placeholder="2040"
              />
            </div>

            {/* Goal Summary */}
            <div className="mt-6 p-4 bg-gradient-to-r from-primary-50 to-secondary-50 rounded-lg border border-primary-200">
              <h3 className="text-sm font-medium text-primary-700 mb-2">Your Goal</h3>
              <p className="text-primary-900">
                Reach <strong>${parseInt(financialGoal.targetAmount || '0').toLocaleString()}</strong> by age{' '}
                <strong>{financialGoal.targetAge}</strong> (year {financialGoal.targetYear})
                </p>
              <p className="text-sm text-primary-600 mt-1">
                Years remaining: {parseInt(financialGoal.targetYear || '0') - new Date().getFullYear()}
                </p>
              </div>

            <div className="flex justify-end mt-6">
              <Button 
                size="sm" 
                onClick={saveFinancialGoal}
                loading={savingSection === 'goal'}
              >
                Save Financial Goal
              </Button>
            </div>
          </Card>

          {/* Education History */}
          <Card className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-surface-900">Education History</h2>
              <Button onClick={addEducationEntry} size="sm">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Education
              </Button>
            </div>

            <div className="space-y-4">
              {educationEntries.map((entry) => (
                <div key={entry.id} className="p-4 border border-surface-200 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <Input
                      label="School/University"
                      value={entry.school}
                      onChange={(e) => updateEducationEntry(entry.id, 'school', e.target.value)}
                      placeholder="e.g., State University"
                    />
                    
                    <Input
                      label="Major/Field of Study"
                      value={entry.major}
                      onChange={(e) => updateEducationEntry(entry.id, 'major', e.target.value)}
                      placeholder="e.g., Computer Science"
                    />
                    
                    <Input
                      label="Graduation Year"
                      type="number"
                      value={entry.graduationYear}
                      onChange={(e) => updateEducationEntry(entry.id, 'graduationYear', e.target.value)}
                      placeholder="2018"
                    />
                  </div>
                  
                  {educationEntries.length > 1 && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => removeEducationEntry(entry.id)}
                      className="text-error-600 hover:text-error-700"
                    >
                      Remove
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-end mt-6">
              <Button 
                size="sm" 
                onClick={saveEducationHistory}
                loading={savingSection === 'education'}
              >
                Save Education History
              </Button>
            </div>
          </Card>

          {/* Skills and Interests */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-surface-900 mb-6">Skills & Interests</h2>
            <p className="text-surface-600 mb-4">Select skills and interests that could help with income generation</p>
            
            <div className="flex flex-wrap gap-2 mb-4">
              {availableSkills.map((skill) => (
                <Badge
                  key={skill}
                  variant={selectedSkills.includes(skill) ? 'primary' : 'neutral'}
                  className={`cursor-pointer transition-all ${
                    selectedSkills.includes(skill) 
                      ? 'bg-primary-500 text-white' 
                      : 'hover:bg-surface-200'
                  }`}
                  onClick={() => toggleSkill(skill)}
                >
                  {skill}
                  {selectedSkills.includes(skill) && (
                    <svg className="w-3 h-3 ml-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </Badge>
              ))}
            </div>

            <div className="text-sm text-surface-600">
              Selected: {selectedSkills.length} skills
            </div>

            <div className="flex justify-end mt-4">
              <Button 
                size="sm" 
                onClick={saveSkillsInterests}
                loading={savingSection === 'skills'}
              >
                Save Skills & Interests
              </Button>
          </div>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  );
} 