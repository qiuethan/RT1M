import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, Button, Input, Select, Badge } from '../components/ui';
import Footer from '../components/Footer';
import { MiniChatbot } from '../components/MiniChatbot';
import { 
  getUserProfile, 
  updateUserProfileSection, 
  BasicInfo,
  EducationEntry,
  ExperienceEntry,
  SkillsAndInterests,
  FinancialGoal
} from '../services/firestore';

export default function Profile() {
  const { currentUser } = useAuth();

  // Loading states
  const [loading, setLoading] = useState(true);
  const [savingSection, setSavingSection] = useState<string | null>(null);

  // Collapsible sections state
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    basic: true,
    financialGoal: false,
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

  const [educationHistory, setEducationHistory] = useState<EducationEntry[]>([]);
  const [experience, setExperience] = useState<ExperienceEntry[]>([]);
  const [skillsAndInterests, setSkillsAndInterests] = useState<SkillsAndInterests>({
    skills: [],
    interests: []
  });

  const [financialGoal, setFinancialGoal] = useState<FinancialGoal>({
    targetAmount: 1000000,
    targetYear: new Date().getFullYear() + 20,
    timeframe: '',
    riskTolerance: '',
    primaryStrategy: ''
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

  const primaryStrategyOptions = [
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
          setEducationHistory(profile.educationHistory || []);
          setExperience(profile.experience || []);
          setSkillsAndInterests(profile.skillsAndInterests || {
            skills: [],
            interests: []
          });
          setFinancialGoal(profile.financialGoal || {
            targetAmount: 1000000,
            targetYear: new Date().getFullYear() + 20,
            timeframe: '',
            riskTolerance: '',
            primaryStrategy: ''
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

  // Education management functions
  const addEducationEntry = () => {
    setEducationHistory([...educationHistory, {
      school: '',
      field: '',
      graduationYear: ''
    }]);
  };

  const updateEducationEntry = (index: number, field: keyof EducationEntry, value: string) => {
    const updated = [...educationHistory];
    updated[index] = { ...updated[index], [field]: value };
    setEducationHistory(updated);
  };

  const removeEducationEntry = (index: number) => {
    setEducationHistory(educationHistory.filter((_, i) => i !== index));
  };

  // Experience management functions
  const addExperienceEntry = () => {
    setExperience([...experience, {
      company: '',
      position: '',
      startYear: '',
      endYear: '',
      description: ''
    }]);
  };

  const updateExperienceEntry = (index: number, field: keyof ExperienceEntry, value: string) => {
    const updated = [...experience];
    updated[index] = { ...updated[index], [field]: value };
    setExperience(updated);
  };

  const removeExperienceEntry = (index: number) => {
    setExperience(experience.filter((_, i) => i !== index));
  };

  // Skills and interests management
  const toggleSkill = (skill: string) => {
    const currentSkills = skillsAndInterests.skills || [];
    const isSelected = currentSkills.includes(skill);
    setSkillsAndInterests({
      ...skillsAndInterests,
      skills: isSelected 
        ? currentSkills.filter(s => s !== skill)
        : [...currentSkills, skill]
    });
  };

  const toggleInterest = (interest: string) => {
    const currentInterests = skillsAndInterests.interests || [];
    const isSelected = currentInterests.includes(interest);
    setSkillsAndInterests({
      ...skillsAndInterests,
      interests: isSelected 
        ? currentInterests.filter(i => i !== interest)
        : [...currentInterests, interest]
    });
  };

  const addCustomSkill = () => {
    if (customSkillInput.trim() && !skillsAndInterests.skills.includes(customSkillInput.trim())) {
      setSkillsAndInterests({
        ...skillsAndInterests,
        skills: [...skillsAndInterests.skills, customSkillInput.trim()]
      });
      setCustomSkillInput('');
    }
  };

  const addCustomInterest = () => {
    if (customInterestInput.trim() && !skillsAndInterests.interests.includes(customInterestInput.trim())) {
      setSkillsAndInterests({
        ...skillsAndInterests,
        interests: [...skillsAndInterests.interests, customInterestInput.trim()]
      });
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

  const removeCustomSkill = (skill: string) => {
    setSkillsAndInterests({
      ...skillsAndInterests,
      skills: skillsAndInterests.skills.filter(s => s !== skill)
    });
  };

  const removeCustomInterest = (interest: string) => {
    setSkillsAndInterests({
      ...skillsAndInterests,
      interests: skillsAndInterests.interests.filter(i => i !== interest)
    });
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

  const saveEducationHistory = async () => {
    setSavingSection('education');
    try {
      // Filter out empty entries
      const validEducation = educationHistory.filter(entry => 
        entry.school.trim() && entry.field.trim() && entry.graduationYear.trim()
      );
      await updateUserProfileSection('educationHistory', validEducation);
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
      const validExperience = experience.filter(entry => 
        entry.company.trim() && entry.position.trim() && entry.startYear.trim() && entry.endYear.trim()
      );
      await updateUserProfileSection('experience', validExperience);
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

  const saveFinancialGoal = async () => {
    setSavingSection('financialGoal');
    try {
      await updateUserProfileSection('financialGoal', financialGoal);
    } catch (error) {
      console.error('Error saving financial goal:', error);
    } finally {
      setSavingSection(null);
    }
  };

  // Helper function to get user's first name
  const getFirstName = () => {
    if (basicInfo.name) {
      return basicInfo.name.split(' ')[0];
    }
    return currentUser?.displayName?.split(' ')[0] || 'there';
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
              ? `Welcome back, ${getFirstName()}! Manage your personal information and professional details` 
              : 'Manage your personal information and professional details'
            }
          </p>
        </div>

        <div className="space-y-6">
          {/* Basic Information */}
          <Card className="overflow-hidden">
            <div 
              className="p-6 cursor-pointer bg-gradient-to-r from-primary-50 to-accent-50 border-b border-surface-200"
              onClick={() => toggleSection('basic')}
            >
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold text-surface-900 flex items-center">
                    <span className="w-2 h-2 bg-primary-500 rounded-full mr-3"></span>
                    Basic Information
                  </h2>
                  <p className="text-sm text-surface-600 mt-1">Personal details and contact information</p>
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
                    value={basicInfo.name}
                    onChange={(e) => setBasicInfo({...basicInfo, name: e.target.value})}
                    placeholder="John Doe"
                  />
                  
                  <Input
                    label="Email"
                    type="email"
                    value={basicInfo.email}
                    onChange={(e) => setBasicInfo({...basicInfo, email: e.target.value})}
                    placeholder="john@example.com"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Input
                    label="Birthday"
                    type="date"
                    value={basicInfo.birthday}
                    onChange={(e) => setBasicInfo({...basicInfo, birthday: e.target.value})}
                  />
                  
                  <Input
                    label="Location"
                    value={basicInfo.location}
                    onChange={(e) => setBasicInfo({...basicInfo, location: e.target.value})}
                    placeholder="New York, NY"
                  />
                  
                  <Input
                    label="Occupation"
                    value={basicInfo.occupation}
                    onChange={(e) => setBasicInfo({...basicInfo, occupation: e.target.value})}
                    placeholder="Software Engineer"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Select
                    label="Country"
                    value={basicInfo.country}
                    onChange={(e) => setBasicInfo({...basicInfo, country: e.target.value})}
                    options={countryOptions}
                  />
                  
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

          {/* Financial Goal */}
          <Card className="overflow-hidden">
            <div 
              className="p-6 cursor-pointer bg-gradient-to-r from-accent-50 to-secondary-50 border-b border-surface-200"
              onClick={() => toggleSection('financialGoal')}
            >
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold text-surface-900 flex items-center">
                    <span className="w-2 h-2 bg-accent-500 rounded-full mr-3"></span>
                    Financial Goal & Strategy
                  </h2>
                  <p className="text-sm text-surface-600 mt-1">Your RT1M target and investment approach</p>
                </div>
                <svg 
                  className={`w-5 h-5 text-surface-500 transition-transform duration-200 ${openSections.financialGoal ? 'transform rotate-180' : ''}`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            
            {openSections.financialGoal && (
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    label="Target Amount ($)"
                    type="number"
                    value={financialGoal.targetAmount.toString()}
                    onChange={(e) => setFinancialGoal({...financialGoal, targetAmount: parseFloat(e.target.value) || 0})}
                    placeholder="1000000"
                  />
                  
                  <Input
                    label="Target Year"
                    type="number"
                    value={financialGoal.targetYear.toString()}
                    onChange={(e) => setFinancialGoal({...financialGoal, targetYear: parseInt(e.target.value) || new Date().getFullYear()})}
                    placeholder="2030"
                  />
                </div>
                
                <Select
                  label="Timeframe"
                  value={financialGoal.timeframe}
                  onChange={(e) => setFinancialGoal({...financialGoal, timeframe: e.target.value})}
                  options={timeframeOptions}
                />
                
                <Select
                  label="Risk Tolerance"
                  value={financialGoal.riskTolerance}
                  onChange={(e) => setFinancialGoal({...financialGoal, riskTolerance: e.target.value})}
                  options={riskToleranceOptions}
                />
                
                <Select
                  label="Primary Strategy"
                  value={financialGoal.primaryStrategy}
                  onChange={(e) => setFinancialGoal({...financialGoal, primaryStrategy: e.target.value})}
                  options={primaryStrategyOptions}
                />
                
                <div className="flex justify-end pt-4 border-t border-surface-200">
                  <Button 
                    onClick={saveFinancialGoal}
                    loading={savingSection === 'financialGoal'}
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
              className="p-6 cursor-pointer bg-gradient-to-r from-secondary-50 to-primary-50 border-b border-surface-200"
              onClick={() => toggleSection('education')}
            >
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold text-surface-900 flex items-center">
                    <span className="w-2 h-2 bg-secondary-500 rounded-full mr-3"></span>
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
                {educationHistory.length === 0 && (
                  <div className="text-center py-8 text-surface-500">
                    <svg className="w-12 h-12 mx-auto mb-4 text-surface-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    <p className="text-sm">No education entries yet. Add your first one below!</p>
                  </div>
                )}
                
                {educationHistory.map((education, index) => (
                  <div key={index} className="p-4 border border-surface-200 rounded-lg bg-surface-50">
                    <div className="flex justify-between items-start mb-4">
                      <h4 className="font-medium text-surface-900">Education #{index + 1}</h4>
                      <button
                        onClick={() => removeEducationEntry(index)}
                        className="text-red-500 hover:text-red-700 transition-colors"
                        title="Remove education"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Input
                        label="School/Institution"
                        value={education.school}
                        onChange={(e) => updateEducationEntry(index, 'school', e.target.value)}
                        placeholder="Harvard University"
                      />
                      
                      <Input
                        label="Field of Study"
                        value={education.field}
                        onChange={(e) => updateEducationEntry(index, 'field', e.target.value)}
                        placeholder="Computer Science"
                      />
                      
                      <Input
                        label="Graduation Year"
                        value={education.graduationYear}
                        onChange={(e) => updateEducationEntry(index, 'graduationYear', e.target.value)}
                        placeholder="2020"
                      />
                    </div>
                  </div>
                ))}
                
                <div className="flex justify-between items-center pt-4 border-t border-surface-200">
                  <Button 
                    onClick={addEducationEntry}
                    variant="outline"
                    size="sm"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add Education
                  </Button>
                  
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
              className="p-6 cursor-pointer bg-gradient-to-r from-accent-50 to-secondary-50 border-b border-surface-200"
              onClick={() => toggleSection('experience')}
            >
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold text-surface-900 flex items-center">
                    <span className="w-2 h-2 bg-accent-500 rounded-full mr-3"></span>
                    Work Experience
                  </h2>
                  <p className="text-sm text-surface-600 mt-1">Your professional work history</p>
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
                {experience.length === 0 && (
                  <div className="text-center py-8 text-surface-500">
                    <svg className="w-12 h-12 mx-auto mb-4 text-surface-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2V6" />
                    </svg>
                    <p className="text-sm">No work experience entries yet. Add your first one below!</p>
                  </div>
                )}
                
                {experience.map((exp, index) => (
                  <div key={index} className="p-4 border border-surface-200 rounded-lg bg-surface-50">
                    <div className="flex justify-between items-start mb-4">
                      <h4 className="font-medium text-surface-900">Experience #{index + 1}</h4>
                      <button
                        onClick={() => removeExperienceEntry(index)}
                        className="text-red-500 hover:text-red-700 transition-colors"
                        title="Remove experience"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                          label="Company"
                          value={exp.company}
                          onChange={(e) => updateExperienceEntry(index, 'company', e.target.value)}
                          placeholder="Google"
                        />
                        
                        <Input
                          label="Position"
                          value={exp.position}
                          onChange={(e) => updateExperienceEntry(index, 'position', e.target.value)}
                          placeholder="Software Engineer"
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                          placeholder="2023 or Present"
                        />
                      </div>
                      
                      <Input
                        label="Description"
                        value={exp.description}
                        onChange={(e) => updateExperienceEntry(index, 'description', e.target.value)}
                        placeholder="Brief description of your role and achievements"
                      />
                    </div>
                  </div>
                ))}
                
                <div className="flex justify-between items-center pt-4 border-t border-surface-200">
                  <Button 
                    onClick={addExperienceEntry}
                    variant="outline"
                    size="sm"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add Experience
                  </Button>
                  
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
              className="p-6 cursor-pointer bg-gradient-to-r from-primary-50 to-surface-50 border-b border-surface-200"
              onClick={() => toggleSection('skills')}
            >
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold text-surface-900 flex items-center">
                    <span className="w-2 h-2 bg-primary-500 rounded-full mr-3"></span>
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
                    Professional Skills
                  </h3>
                  
                  {/* Available Skills */}
                  <div className="mb-4">
                    <p className="text-sm text-surface-600 mb-3">Select from popular skills:</p>
                    <div className="flex flex-wrap gap-2">
                      {availableSkills.map((skill) => (
                        <button
                          key={skill}
                          onClick={() => toggleSkill(skill)}
                          className={`px-3 py-1 rounded-full text-sm transition-colors ${
                            skillsAndInterests.skills.includes(skill)
                              ? 'bg-primary-100 text-primary-800 border border-primary-200'
                              : 'bg-surface-100 text-surface-700 border border-surface-200 hover:bg-surface-200'
                          }`}
                        >
                          {skill}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Custom Skills */}
                  <div className="mb-4">
                    <p className="text-sm text-surface-600 mb-3">Add custom skills:</p>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter a custom skill..."
                        value={customSkillInput}
                        onChange={(e) => setCustomSkillInput(e.target.value)}
                        onKeyDown={handleCustomSkillKeyPress}
                      />
                      <Button onClick={addCustomSkill} size="sm" variant="outline">
                        Add
                      </Button>
                    </div>
                  </div>
                  
                  {/* Selected Skills */}
                  {skillsAndInterests.skills.length > 0 && (
                    <div>
                      <p className="text-sm text-surface-600 mb-3">Your selected skills:</p>
                      <div className="flex flex-wrap gap-2">
                        {skillsAndInterests.skills.map((skill) => (
                          <Badge 
                            key={skill} 
                            variant="primary" 
                            className="flex items-center gap-1"
                          >
                            {skill}
                            <button
                              onClick={() => removeCustomSkill(skill)}
                              className="ml-1 text-primary-600 hover:text-primary-800"
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
                    Personal Interests
                  </h3>
                  
                  {/* Available Interests */}
                  <div className="mb-4">
                    <p className="text-sm text-surface-600 mb-3">Select from popular interests:</p>
                    <div className="flex flex-wrap gap-2">
                      {availableInterests.map((interest) => (
                        <button
                          key={interest}
                          onClick={() => toggleInterest(interest)}
                          className={`px-3 py-1 rounded-full text-sm transition-colors ${
                            skillsAndInterests.interests.includes(interest)
                              ? 'bg-secondary-100 text-secondary-800 border border-secondary-200'
                              : 'bg-surface-100 text-surface-700 border border-surface-200 hover:bg-surface-200'
                          }`}
                        >
                          {interest}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Custom Interests */}
                  <div className="mb-4">
                    <p className="text-sm text-surface-600 mb-3">Add custom interests:</p>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter a custom interest..."
                        value={customInterestInput}
                        onChange={(e) => setCustomInterestInput(e.target.value)}
                        onKeyDown={handleCustomInterestKeyPress}
                      />
                      <Button onClick={addCustomInterest} size="sm" variant="outline">
                        Add
                      </Button>
                    </div>
                  </div>
                  
                  {/* Selected Interests */}
                  {skillsAndInterests.interests.length > 0 && (
                    <div>
                      <p className="text-sm text-surface-600 mb-3">Your selected interests:</p>
                      <div className="flex flex-wrap gap-2">
                        {skillsAndInterests.interests.map((interest) => (
                          <Badge 
                            key={interest} 
                            variant="secondary" 
                            className="flex items-center gap-1"
                          >
                            {interest}
                            <button
                              onClick={() => removeCustomInterest(interest)}
                              className="ml-1 text-secondary-600 hover:text-secondary-800"
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