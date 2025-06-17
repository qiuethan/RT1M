import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, Button, Input, Select, Badge } from '../components/ui';
import Footer from '../components/Footer';
import { 
  getUserProfile, 
  updateUserProfileSection, 
  BasicInfo,
  FinancialInfo,
  FinancialGoal,
  IntermediateGoal,
  EducationEntry,
  ExperienceEntry,
  SkillsAndInterests
} from '../services/firestore';

export default function Profile() {
  const { currentUser } = useAuth();

  // Loading states
  const [loading, setLoading] = useState(true);
  const [savingSection, setSavingSection] = useState<string | null>(null);

  // Profile sections
  const [basicInfo, setBasicInfo] = useState<BasicInfo>({
    name: '',
    email: '',
    birthday: '',
    employmentStatus: 'Employed'
  });

  const [financialInfo, setFinancialInfo] = useState<FinancialInfo>({
    annualIncome: 50000,
    annualExpenses: 35000,
    totalAssets: 25000,
    totalDebts: 5000,
    currentSavings: 10000
  });

  const [financialGoal, setFinancialGoal] = useState<FinancialGoal>({
    targetAmount: 1000000,
    targetYear: new Date().getFullYear() + 20
  });

  const [intermediateGoals, setIntermediateGoals] = useState<IntermediateGoal[]>([]);

  const [educationHistory, setEducationHistory] = useState<EducationEntry[]>([]);

  const [experience, setExperience] = useState<ExperienceEntry[]>([]);

  const [skillsAndInterests, setSkillsAndInterests] = useState<SkillsAndInterests>({
    skills: [],
    interests: []
  });

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
            employmentStatus: 'Employed'
          });
          setFinancialInfo(profile.financialInfo || {
            annualIncome: 50000,
            annualExpenses: 35000,
            totalAssets: 25000,
            totalDebts: 5000,
            currentSavings: 10000
          });
          setFinancialGoal(profile.financialGoal || {
            targetAmount: 1000000,
            targetYear: new Date().getFullYear() + 20
          });
          setIntermediateGoals(profile.intermediateGoals || []);
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
  const addIntermediateGoal = () => {
    const newGoal: IntermediateGoal = {
      id: Date.now().toString(),
      title: '',
      targetAmount: 0,
      targetDate: '',
      status: 'Not Started',
      currentAmount: 0,
      description: ''
    };
    setIntermediateGoals([...intermediateGoals, newGoal]);
  };

  const updateIntermediateGoal = (index: number, field: keyof IntermediateGoal, value: string | number) => {
    const updated = [...intermediateGoals];
    updated[index] = { ...updated[index], [field]: value };
    setIntermediateGoals(updated);
  };

  const removeIntermediateGoal = (index: number) => {
    setIntermediateGoals(intermediateGoals.filter((_, i) => i !== index));
  };

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

  // Save functions for each section
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

  const saveIntermediateGoals = async () => {
    setSavingSection('intermediate');
    try {
      await updateUserProfileSection('intermediateGoals', intermediateGoals);
    } catch (error) {
      console.error('Error saving intermediate goals:', error);
    } finally {
      setSavingSection(null);
    }
  };

  const saveEducationHistory = async () => {
    setSavingSection('education');
    try {
      await updateUserProfileSection('educationHistory', educationHistory);
    } catch (error) {
      console.error('Error saving education history:', error);
    } finally {
      setSavingSection(null);
    }
  };

  const saveExperience = async () => {
    setSavingSection('experience');
    try {
      await updateUserProfileSection('experience', experience);
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
          <h1 className="text-3xl font-bold text-surface-900">Your Profile</h1>
          <p className="text-surface-600 mt-2">Manage your personal and financial information</p>
        </div>

        <div className="space-y-8">
          {/* Basic Information */}
          <Card className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-surface-900">Basic Information</h2>
              <Button 
                onClick={saveBasicInfo}
                loading={savingSection === 'basic'}
                size="sm"
              >
                Save
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Full Name"
                type="text"
                value={basicInfo.name}
                onChange={(e) => setBasicInfo({...basicInfo, name: e.target.value})}
                placeholder="Enter your full name"
              />
              
              <Input
                label="Email"
                type="email"
                value={basicInfo.email}
                onChange={(e) => setBasicInfo({...basicInfo, email: e.target.value})}
                placeholder="Enter your email"
              />
              
              <Input
                label="Birthday"
                type="date"
                value={basicInfo.birthday}
                onChange={(e) => setBasicInfo({...basicInfo, birthday: e.target.value})}
              />
              
              <Select
                label="Employment Status"
                value={basicInfo.employmentStatus}
                onChange={(e) => setBasicInfo({...basicInfo, employmentStatus: e.target.value})}
                options={employmentOptions}
              />
            </div>
          </Card>

          {/* Financial Information */}
          <Card className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-surface-900">Financial Information</h2>
              <Button 
                onClick={saveFinancialInfo}
                loading={savingSection === 'financial'}
                size="sm"
              >
                Save
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Annual Income"
                type="number"
                value={financialInfo.annualIncome.toString()}
                onChange={(e) => setFinancialInfo({...financialInfo, annualIncome: parseInt(e.target.value) || 0})}
                placeholder="Enter your annual income"
              />
              
              <Input
                label="Annual Expenses"
                type="number"
                value={financialInfo.annualExpenses.toString()}
                onChange={(e) => setFinancialInfo({...financialInfo, annualExpenses: parseInt(e.target.value) || 0})}
                placeholder="Enter your annual expenses"
              />
              
              <Input
                label="Total Assets"
                type="number"
                value={financialInfo.totalAssets.toString()}
                onChange={(e) => setFinancialInfo({...financialInfo, totalAssets: parseInt(e.target.value) || 0})}
                placeholder="Enter your total assets"
              />
              
              <Input
                label="Total Debts"
                type="number"
                value={financialInfo.totalDebts.toString()}
                onChange={(e) => setFinancialInfo({...financialInfo, totalDebts: parseInt(e.target.value) || 0})}
                placeholder="Enter your total debts"
              />
              
              <Input
                label="Current Savings"
                type="number"
                value={financialInfo.currentSavings.toString()}
                onChange={(e) => setFinancialInfo({...financialInfo, currentSavings: parseInt(e.target.value) || 0})}
                placeholder="Enter your current savings"
              />
            </div>
            
            <div className="mt-4 p-4 bg-surface-100 rounded-lg">
              <div className="text-sm text-surface-600 mb-2">Net Worth Calculation:</div>
              <div className="text-lg font-semibold text-surface-900">
                ${(financialInfo.totalAssets - financialInfo.totalDebts).toLocaleString()}
              </div>
              <div className="text-sm text-surface-500">
                (Assets: ${financialInfo.totalAssets.toLocaleString()} - Debts: ${financialInfo.totalDebts.toLocaleString()})
              </div>
            </div>
          </Card>

          {/* Financial Goal */}
          <Card className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-surface-900">Financial Goal</h2>
              <Button 
                onClick={saveFinancialGoal}
                loading={savingSection === 'goal'}
                size="sm"
              >
                Save
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Target Amount"
                type="number"
                value={financialGoal.targetAmount.toString()}
                onChange={(e) => setFinancialGoal({...financialGoal, targetAmount: parseInt(e.target.value) || 0})}
                placeholder="Enter target amount"
              />
              
              <Input
                label="Target Year"
                type="number"
                value={financialGoal.targetYear.toString()}
                onChange={(e) => setFinancialGoal({...financialGoal, targetYear: parseInt(e.target.value) || 0})}
                placeholder="Enter target year"
              />
            </div>
          </Card>

          {/* Intermediate Goals */}
          <Card className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-surface-900">Intermediate Goals</h2>
              <div className="flex gap-2">
                <Button 
                  onClick={addIntermediateGoal}
                  variant="outline"
                  size="sm"
                >
                  Add Goal
                </Button>
                <Button 
                  onClick={saveIntermediateGoals}
                  loading={savingSection === 'intermediate'}
                  size="sm"
                >
                  Save
                </Button>
              </div>
            </div>
            
            <div className="space-y-4">
              {intermediateGoals.map((goal, index) => (
                <div key={goal.id || index} className="p-4 border border-surface-200 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <Input
                      label="Goal Title"
                      value={goal.title}
                      onChange={(e) => updateIntermediateGoal(index, 'title', e.target.value)}
                      placeholder="e.g., Emergency Fund"
                    />
                    <Input
                      label="Target Amount"
                      type="number"
                      value={goal.targetAmount.toString()}
                      onChange={(e) => updateIntermediateGoal(index, 'targetAmount', parseInt(e.target.value) || 0)}
                      placeholder="10000"
                    />
                    <Input
                      label="Current Amount"
                      type="number"
                      value={goal.currentAmount.toString()}
                      onChange={(e) => updateIntermediateGoal(index, 'currentAmount', parseInt(e.target.value) || 0)}
                      placeholder="2500"
                    />
                    <Input
                      label="Target Date"
                      type="date"
                      value={goal.targetDate}
                      onChange={(e) => updateIntermediateGoal(index, 'targetDate', e.target.value)}
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-surface-700 mb-2">
                      Status
                    </label>
                    <Select
                      value={goal.status}
                      onChange={(e) => updateIntermediateGoal(index, 'status', e.target.value as any)}
                      options={[
                        { value: 'Not Started', label: 'Not Started' },
                        { value: 'In Progress', label: 'In Progress' },
                        { value: 'Completed', label: 'Completed' }
                      ]}
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-surface-700 mb-2">
                      Description (Optional)
                    </label>
                    <textarea
                      className="w-full px-3 py-2 border border-surface-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      rows={2}
                      value={goal.description || ''}
                      onChange={(e) => updateIntermediateGoal(index, 'description', e.target.value)}
                      placeholder="Describe this goal..."
                    />
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-surface-700">Progress</span>
                      <span className="text-sm font-medium text-surface-700">
                        {goal.targetAmount > 0 ? ((goal.currentAmount / goal.targetAmount) * 100).toFixed(1) : 0}%
                      </span>
                    </div>
                    <div className="w-full bg-surface-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-primary-500 to-accent-500 h-2 rounded-full transition-all duration-300"
                        style={{ 
                          width: `${goal.targetAmount > 0 ? Math.min((goal.currentAmount / goal.targetAmount) * 100, 100) : 0}%` 
                        }}
                      ></div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="text-sm text-surface-600">
                      ${goal.currentAmount.toLocaleString()} of ${goal.targetAmount.toLocaleString()}
                    </div>
                    <Button
                      onClick={() => removeIntermediateGoal(index)}
                      variant="outline"
                      size="sm"
                      className="text-red-600 border-red-300 hover:bg-red-50"
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
              
              {intermediateGoals.length === 0 && (
                <div className="text-center py-8 text-surface-500">
                  No intermediate goals yet. Click "Add Goal" to get started.
                </div>
              )}
            </div>
          </Card>

          {/* Education History */}
          <Card className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-surface-900">Education History</h2>
              <div className="flex gap-2">
                <Button 
                  onClick={addEducationEntry}
                  variant="outline"
                  size="sm"
                >
                  Add Education
                </Button>
                <Button 
                  onClick={saveEducationHistory}
                  loading={savingSection === 'education'}
                  size="sm"
                >
                  Save
                </Button>
              </div>
            </div>
            
            <div className="space-y-4">
              {educationHistory.map((entry, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border border-surface-200 rounded-lg">
                  <Input
                    label="School"
                    value={entry.school}
                    onChange={(e) => updateEducationEntry(index, 'school', e.target.value)}
                    placeholder="University name"
                  />
                  <Input
                    label="Field of Study"
                    value={entry.field}
                    onChange={(e) => updateEducationEntry(index, 'field', e.target.value)}
                    placeholder="Major/Field"
                  />
                  <Input
                    label="Graduation Year"
                    value={entry.graduationYear}
                    onChange={(e) => updateEducationEntry(index, 'graduationYear', e.target.value)}
                    placeholder="YYYY"
                  />
                  <div className="flex items-end">
                    <Button
                      onClick={() => removeEducationEntry(index)}
                      variant="outline"
                      size="sm"
                      className="text-red-600 border-red-300 hover:bg-red-50"
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
              
              {educationHistory.length === 0 && (
                <div className="text-center py-8 text-surface-500">
                  No education entries yet. Click "Add Education" to get started.
                </div>
              )}
            </div>
          </Card>

          {/* Experience */}
          <Card className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-surface-900">Professional Experience</h2>
              <div className="flex gap-2">
                <Button 
                  onClick={addExperienceEntry}
                  variant="outline"
                  size="sm"
                >
                  Add Experience
                </Button>
                <Button 
                  onClick={saveExperience}
                  loading={savingSection === 'experience'}
                  size="sm"
                >
                  Save
                </Button>
              </div>
            </div>
            
            <div className="space-y-4">
              {experience.map((entry, index) => (
                <div key={index} className="p-4 border border-surface-200 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <Input
                      label="Company"
                      value={entry.company}
                      onChange={(e) => updateExperienceEntry(index, 'company', e.target.value)}
                      placeholder="Company name"
                    />
                    <Input
                      label="Position"
                      value={entry.position}
                      onChange={(e) => updateExperienceEntry(index, 'position', e.target.value)}
                      placeholder="Job title"
                    />
                    <Input
                      label="Start Year"
                      value={entry.startYear}
                      onChange={(e) => updateExperienceEntry(index, 'startYear', e.target.value)}
                      placeholder="YYYY"
                    />
                    <Input
                      label="End Year"
                      value={entry.endYear}
                      onChange={(e) => updateExperienceEntry(index, 'endYear', e.target.value)}
                      placeholder="YYYY or 'Present'"
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-surface-700 mb-2">
                      Description
                    </label>
                    <textarea
                      className="w-full px-3 py-2 border border-surface-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      rows={3}
                      value={entry.description}
                      onChange={(e) => updateExperienceEntry(index, 'description', e.target.value)}
                      placeholder="Describe your role and achievements..."
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button
                      onClick={() => removeExperienceEntry(index)}
                      variant="outline"
                      size="sm"
                      className="text-red-600 border-red-300 hover:bg-red-50"
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
              
              {experience.length === 0 && (
                <div className="text-center py-8 text-surface-500">
                  No experience entries yet. Click "Add Experience" to get started.
                </div>
              )}
            </div>
          </Card>

          {/* Skills & Interests */}
          <Card className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-surface-900">Skills & Interests</h2>
              <Button 
                onClick={saveSkillsAndInterests}
                loading={savingSection === 'skills'}
                size="sm"
              >
                Save
              </Button>
            </div>
            
            <div className="space-y-6">
              {/* Skills */}
              <div>
                <h3 className="text-lg font-medium text-surface-900 mb-3">Skills</h3>
                <div className="flex flex-wrap gap-2 mb-4">
                  {skillsAndInterests.skills.map((skill) => (
                    <Badge
                      key={skill}
                      variant="primary"
                      className="cursor-pointer"
                      onClick={() => toggleSkill(skill)}
                    >
                      {skill} ×
                    </Badge>
                  ))}
                </div>
                                 <div className="flex flex-wrap gap-2">
                   {availableSkills
                     .filter(skill => !skillsAndInterests.skills.includes(skill))
                     .map((skill) => (
                     <Badge
                       key={skill}
                       variant="neutral"
                       className="cursor-pointer hover:bg-primary-50"
                       onClick={() => toggleSkill(skill)}
                     >
                       + {skill}
                     </Badge>
                   ))}
                 </div>
              </div>

              {/* Interests */}
              <div>
                <h3 className="text-lg font-medium text-surface-900 mb-3">Interests</h3>
                <div className="flex flex-wrap gap-2 mb-4">
                  {skillsAndInterests.interests.map((interest) => (
                    <Badge
                      key={interest}
                      variant="secondary"
                      className="cursor-pointer"
                      onClick={() => toggleInterest(interest)}
                    >
                      {interest} ×
                    </Badge>
                  ))}
                </div>
                                 <div className="flex flex-wrap gap-2">
                   {availableInterests
                     .filter(interest => !skillsAndInterests.interests.includes(interest))
                     .map((interest) => (
                     <Badge
                       key={interest}
                       variant="neutral"
                       className="cursor-pointer hover:bg-secondary-50"
                       onClick={() => toggleInterest(interest)}
                     >
                       + {interest}
                     </Badge>
                   ))}
                 </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
      
      <Footer />
    </div>
  );
} 