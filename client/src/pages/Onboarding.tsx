import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { saveUserProfile, getUserProfile } from '../services/firestore';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Card from '../components/ui/Card';
import { Badge } from '../components/ui';

interface OnboardingStep {
  title: string;
  description: string;
}

const onboardingSteps: OnboardingStep[] = [
  {
    title: "Basic Information",
    description: "Let's start with your personal details"
  },
  {
    title: "Financial Overview", 
    description: "Help us understand your current financial situation"
  },
  {
    title: "RT1M Goal",
    description: "Define your path to your first million"
  },
  {
    title: "Education & Experience",
    description: "Tell us about your background"
  },
  {
    title: "Skills & Interests",
    description: "What skills and interests do you have?"
  }
];

const countryOptions = [
  { value: "", label: "Select your country" },
  { value: "US", label: "United States (USD)" },
  { value: "CA", label: "Canada (CAD)" },
  { value: "GB", label: "United Kingdom (GBP)" },
  { value: "AU", label: "Australia (AUD)" },
  { value: "DE", label: "Germany (EUR)" },
  { value: "FR", label: "France (EUR)" },
  { value: "JP", label: "Japan (JPY)" },
  { value: "SG", label: "Singapore (SGD)" },
  { value: "CH", label: "Switzerland (CHF)" },
  { value: "NL", label: "Netherlands (EUR)" },
  { value: "SE", label: "Sweden (SEK)" },
  { value: "NO", label: "Norway (NOK)" },
  { value: "DK", label: "Denmark (DKK)" },
  { value: "OTHER", label: "Other" }
];

const employmentOptions = [
  { value: "", label: "Select employment status" },
  { value: "Employed", label: "Full-time Employee" },
  { value: "Part-time", label: "Part-time Employee" },
  { value: "Freelancer", label: "Freelancer/Contractor" },
  { value: "Entrepreneur", label: "Entrepreneur/Business Owner" },
  { value: "Student", label: "Student" },
  { value: "Unemployed", label: "Unemployed" },
  { value: "Retired", label: "Retired" }
];

const timeframeOptions = [
  { value: "", label: "Select timeframe" },
  { value: "1-3 years", label: "1-3 years" },
  { value: "3-5 years", label: "3-5 years" },
  { value: "5-10 years", label: "5-10 years" },
  { value: "10+ years", label: "10+ years" }
];

const riskToleranceOptions = [
  { value: "", label: "Select risk tolerance" },
  { value: "conservative", label: "Conservative - Prefer stable, low-risk investments" },
  { value: "moderate", label: "Moderate - Balanced approach to risk and return" },
  { value: "aggressive", label: "Aggressive - High-risk, high-reward investments" }
];

const strategyOptions = [
  { value: "", label: "Select primary strategy" },
  { value: "investing", label: "Investing in stocks/ETFs" },
  { value: "real-estate", label: "Real estate investment" },
  { value: "business", label: "Starting/growing a business" },
  { value: "mixed", label: "Mixed approach" },
  { value: "other", label: "Other" }
];

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

const Onboarding: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);

  // Form state matching profile structure exactly
  const [formData, setFormData] = useState({
    // Basic Info
    name: '',
    email: '',
    birthday: '',
    location: '',
    occupation: '',
    country: '',
    employmentStatus: '',
    
    // Financial Info
    annualIncome: '',
    annualExpenses: '',
    totalAssets: '',
    totalDebts: '',
    currentSavings: '',
    
    // Financial Goal
    targetAmount: '1000000',
    targetYear: '',
    timeframe: '',
    riskTolerance: '',
    primaryStrategy: '',
    
    // Education History
    education: [{ school: '', field: '', graduationYear: '' }],
    
    // Experience
    experience: [{ company: '', position: '', startYear: '', endYear: '', description: '' }],
    
    // Skills & Interests
    skills: [] as string[],
    interests: [] as string[],
    customSkill: '',
    customInterest: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (currentUser) {
      setFormData(prev => ({
        ...prev,
        email: currentUser.email || ''
      }));

      // Load existing profile data if available
      getUserProfile().then(profile => {
        if (profile) {
          setFormData(prev => ({
            ...prev,
            name: profile.basicInfo?.name || '',
            birthday: profile.basicInfo?.birthday || '',
            location: profile.basicInfo?.location || '',
            occupation: profile.basicInfo?.occupation || '',
            country: profile.basicInfo?.country || '',
            employmentStatus: profile.basicInfo?.employmentStatus || '',
            annualIncome: profile.financialInfo?.annualIncome?.toString() || '',
            annualExpenses: profile.financialInfo?.annualExpenses?.toString() || '',
            totalAssets: profile.financialInfo?.totalAssets?.toString() || '',
            totalDebts: profile.financialInfo?.totalDebts?.toString() || '',
            currentSavings: profile.financialInfo?.currentSavings?.toString() || '',
            targetAmount: profile.financialGoal?.targetAmount?.toString() || '1000000',
            targetYear: profile.financialGoal?.targetYear?.toString() || '',
            education: profile.educationHistory && profile.educationHistory.length > 0 
              ? profile.educationHistory 
              : [{ school: '', field: '', graduationYear: '' }],
            experience: profile.experience && profile.experience.length > 0 
              ? profile.experience 
              : [{ company: '', position: '', startYear: '', endYear: '', description: '' }],
            skills: profile.skillsAndInterests?.skills || [],
            interests: profile.skillsAndInterests?.interests || []
          }));
        }
      });
    }
  }, [currentUser]);

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 0: // Basic Info
        if (!formData.name.trim()) newErrors.name = 'Name is required';
        if (!formData.email.trim()) newErrors.email = 'Email is required';
        if (!formData.country) newErrors.country = 'Country is required';
        if (!formData.employmentStatus) newErrors.employmentStatus = 'Employment status is required';
        break;
      case 1: // Financial Overview
        if (!formData.annualIncome || parseFloat(formData.annualIncome) < 0) {
          newErrors.annualIncome = 'Annual income must be 0 or greater';
        }
        if (!formData.annualExpenses || parseFloat(formData.annualExpenses) < 0) {
          newErrors.annualExpenses = 'Annual expenses must be 0 or greater';
        }
        if (formData.totalAssets && parseFloat(formData.totalAssets) < 0) {
          newErrors.totalAssets = 'Total assets cannot be negative';
        }
        if (formData.totalDebts && parseFloat(formData.totalDebts) < 0) {
          newErrors.totalDebts = 'Total debts cannot be negative';
        }
        if (formData.currentSavings && parseFloat(formData.currentSavings) < 0) {
          newErrors.currentSavings = 'Current savings cannot be negative';
        }
        break;
      case 2: // RT1M Goal
        if (!formData.targetAmount || parseFloat(formData.targetAmount) <= 0) {
          newErrors.targetAmount = 'Target amount must be greater than 0';
        }
        if (!formData.targetYear || parseInt(formData.targetYear) <= new Date().getFullYear()) {
          newErrors.targetYear = 'Target year must be in the future';
        }
        if (!formData.timeframe) newErrors.timeframe = 'Timeframe is required';
        if (!formData.riskTolerance) newErrors.riskTolerance = 'Risk tolerance is required';
        if (!formData.primaryStrategy) newErrors.primaryStrategy = 'Primary strategy is required';
        break;
      case 3: // Education & Experience - optional but validate if filled
        break;
      case 4: // Skills & Interests - optional
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < onboardingSteps.length - 1) {
        setCurrentStep(currentStep + 1);
      } else {
        handleComplete();
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    if (!currentUser) return;

    setLoading(true);
    try {
      const profileData = {
        basicInfo: {
          name: formData.name,
          email: formData.email,
          birthday: formData.birthday,
          location: formData.location,
          occupation: formData.occupation,
          country: formData.country,
          employmentStatus: formData.employmentStatus
        },
        financialInfo: {
          annualIncome: parseFloat(formData.annualIncome) || 0,
          annualExpenses: parseFloat(formData.annualExpenses) || 0,
          totalAssets: parseFloat(formData.totalAssets) || 0,
          totalDebts: parseFloat(formData.totalDebts) || 0,
          currentSavings: parseFloat(formData.currentSavings) || 0
        },
        financialGoal: {
          targetAmount: parseFloat(formData.targetAmount),
          targetYear: parseInt(formData.targetYear)
        },
        intermediateGoals: [],
        educationHistory: formData.education.filter(edu => edu.school || edu.field || edu.graduationYear),
        experience: formData.experience.filter(exp => exp.company || exp.position),
        skillsAndInterests: {
          interests: formData.interests,
          skills: formData.skills
        }
      };

      await saveUserProfile(profileData);
      navigate('/dashboard');
    } catch (error) {
      console.error('Error completing onboarding:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const addEducationEntry = () => {
    setFormData(prev => ({
      ...prev,
      education: [...prev.education, { school: '', field: '', graduationYear: '' }]
    }));
  };

  const updateEducationEntry = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      education: prev.education.map((edu, i) => 
        i === index ? { ...edu, [field]: value } : edu
      )
    }));
  };

  const removeEducationEntry = (index: number) => {
    if (formData.education.length > 1) {
      setFormData(prev => ({
        ...prev,
        education: prev.education.filter((_, i) => i !== index)
      }));
    }
  };

  const addExperienceEntry = () => {
    setFormData(prev => ({
      ...prev,
      experience: [...prev.experience, { company: '', position: '', startYear: '', endYear: '', description: '' }]
    }));
  };

  const updateExperienceEntry = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      experience: prev.experience.map((exp, i) => 
        i === index ? { ...exp, [field]: value } : exp
      )
    }));
  };

  const removeExperienceEntry = (index: number) => {
    if (formData.experience.length > 1) {
      setFormData(prev => ({
        ...prev,
        experience: prev.experience.filter((_, i) => i !== index)
      }));
    }
  };

  const toggleSkill = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill]
    }));
  };

  const toggleInterest = (interest: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  const addCustomSkill = () => {
    if (formData.customSkill.trim() && !formData.skills.includes(formData.customSkill.trim())) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, prev.customSkill.trim()],
        customSkill: ''
      }));
    }
  };

  const addCustomInterest = () => {
    if (formData.customInterest.trim() && !formData.interests.includes(formData.customInterest.trim())) {
      setFormData(prev => ({
        ...prev,
        interests: [...prev.interests, prev.customInterest.trim()],
        customInterest: ''
      }));
    }
  };

  const calculateNetWorth = () => {
    const assets = parseFloat(formData.totalAssets) || 0;
    const debts = parseFloat(formData.totalDebts) || 0;
    return assets - debts;
  };

  const calculateCashFlow = () => {
    const income = parseFloat(formData.annualIncome) || 0;
    const expenses = parseFloat(formData.annualExpenses) || 0;
    return income - expenses;
  };

  if (!currentUser) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">Complete Your Profile</h1>
            <span className="text-sm text-gray-500">
              Step {currentStep + 1} of {onboardingSteps.length}
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            {onboardingSteps.map((_, index) => (
              <React.Fragment key={index}>
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    index <= currentStep
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {index + 1}
                </div>
                {index < onboardingSteps.length - 1 && (
                  <div
                    className={`flex-1 h-1 ${
                      index < currentStep ? 'bg-indigo-600' : 'bg-gray-200'
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        <Card className="p-8">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              {onboardingSteps[currentStep].title}
            </h2>
            <p className="text-gray-600 mt-1">
              {onboardingSteps[currentStep].description}
            </p>
          </div>

          {/* Step Content */}
          {currentStep === 0 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Full Name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  error={errors.name}
                  required
                />
                <Input
                  label="Email Address"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  error={errors.email}
                  required
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Date of Birth"
                  type="date"
                  value={formData.birthday}
                  onChange={(e) => handleInputChange('birthday', e.target.value)}
                />
                <Select
                  label="Country"
                  value={formData.country}
                  onChange={(e) => handleInputChange('country', e.target.value)}
                  options={countryOptions}
                  error={errors.country}
                  required
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Location"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  placeholder="City, State/Province"
                />
                <Input
                  label="Occupation"
                  value={formData.occupation}
                  onChange={(e) => handleInputChange('occupation', e.target.value)}
                  placeholder="Your job title or profession"
                />
              </div>
              
              <Select
                label="Employment Status"
                value={formData.employmentStatus}
                onChange={(e) => handleInputChange('employmentStatus', e.target.value)}
                options={employmentOptions}
                error={errors.employmentStatus}
                required
              />
            </div>
          )}

          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Annual Income"
                  type="number"
                  value={formData.annualIncome}
                  onChange={(e) => handleInputChange('annualIncome', e.target.value)}
                  placeholder="75000"
                  error={errors.annualIncome}
                  required
                />
                <Input
                  label="Annual Expenses"
                  type="number"
                  value={formData.annualExpenses}
                  onChange={(e) => handleInputChange('annualExpenses', e.target.value)}
                  placeholder="45000"
                  error={errors.annualExpenses}
                  required
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  label="Total Assets"
                  type="number"
                  value={formData.totalAssets}
                  onChange={(e) => handleInputChange('totalAssets', e.target.value)}
                  placeholder="250000"
                  error={errors.totalAssets}
                />
                <Input
                  label="Total Debts"
                  type="number"
                  value={formData.totalDebts}
                  onChange={(e) => handleInputChange('totalDebts', e.target.value)}
                  placeholder="150000"
                  error={errors.totalDebts}
                />
                <Input
                  label="Current Savings"
                  type="number"
                  value={formData.currentSavings}
                  onChange={(e) => handleInputChange('currentSavings', e.target.value)}
                  placeholder="25000"
                  error={errors.currentSavings}
                />
              </div>

              {/* Financial Summary */}
              {(formData.annualIncome || formData.annualExpenses || formData.totalAssets || formData.totalDebts) && (
                <div className="space-y-4">
                  <div className="bg-indigo-50 p-4 rounded-lg">
                    <h3 className="font-medium text-indigo-900 mb-2">Annual Cash Flow</h3>
                    <div className="text-2xl font-bold">
                      <span className={calculateCashFlow() >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {calculateCashFlow() >= 0 ? '+' : ''}${calculateCashFlow().toLocaleString()}
                      </span>
                    </div>
                  </div>
                  
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h3 className="font-medium text-purple-900 mb-2">Net Worth</h3>
                    <div className="text-2xl font-bold">
                      <span className={calculateNetWorth() >= 0 ? 'text-green-600' : 'text-red-600'}>
                        ${calculateNetWorth().toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Target Amount ($)"
                  type="number"
                  value={formData.targetAmount}
                  onChange={(e) => handleInputChange('targetAmount', e.target.value)}
                  error={errors.targetAmount}
                  required
                />
                <Input
                  label="Target Year"
                  type="number"
                  value={formData.targetYear}
                  onChange={(e) => handleInputChange('targetYear', e.target.value)}
                  placeholder="2030"
                  error={errors.targetYear}
                  required
                />
              </div>
              
              <Select
                label="Timeframe"
                value={formData.timeframe}
                onChange={(e) => handleInputChange('timeframe', e.target.value)}
                options={timeframeOptions}
                error={errors.timeframe}
                required
              />
              <Select
                label="Risk Tolerance"
                value={formData.riskTolerance}
                onChange={(e) => handleInputChange('riskTolerance', e.target.value)}
                options={riskToleranceOptions}
                error={errors.riskTolerance}
                required
              />
              <Select
                label="Primary Strategy"
                value={formData.primaryStrategy}
                onChange={(e) => handleInputChange('primaryStrategy', e.target.value)}
                options={strategyOptions}
                error={errors.primaryStrategy}
                required
              />
              
              {/* Goal Summary */}
              {formData.targetAmount && formData.targetYear && (
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-medium text-green-900 mb-2">Your RT1M Goal</h3>
                  <div className="text-xl font-bold text-green-600">
                    ${parseFloat(formData.targetAmount).toLocaleString()} by {formData.targetYear}
                  </div>
                  {parseInt(formData.targetYear) > new Date().getFullYear() && (
                    <div className="text-sm text-green-700 mt-1">
                      {parseInt(formData.targetYear) - new Date().getFullYear()} years to go
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-8">
              {/* Education Section */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-800">Education History (Optional)</h3>
                  <Button onClick={addEducationEntry} variant="outline" size="sm">
                    Add Education
                  </Button>
                </div>
                
                <div className="space-y-4">
                  {formData.education.map((edu, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg">
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
                      <div className="flex gap-2">
                        <Input
                          label="Graduation Year"
                          value={edu.graduationYear}
                          onChange={(e) => updateEducationEntry(index, 'graduationYear', e.target.value)}
                          placeholder="2020"
                        />
                        {formData.education.length > 1 && (
                          <Button
                            onClick={() => removeEducationEntry(index)}
                            variant="outline"
                            size="sm"
                            className="mt-6 text-red-600 border-red-300 hover:bg-red-50"
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Experience Section */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-800">Work Experience (Optional)</h3>
                  <Button onClick={addExperienceEntry} variant="outline" size="sm">
                    Add Experience
                  </Button>
                </div>
                
                <div className="space-y-4">
                  {formData.experience.map((exp, index) => (
                    <div key={index} className="space-y-4 p-4 border rounded-lg">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                          placeholder="2023 or 'Present'"
                        />
                      </div>
                      <div className="flex gap-2">
                        <textarea
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          rows={3}
                          placeholder="Brief description of your role and achievements..."
                          value={exp.description}
                          onChange={(e) => updateExperienceEntry(index, 'description', e.target.value)}
                        />
                        {formData.experience.length > 1 && (
                          <Button
                            onClick={() => removeExperienceEntry(index)}
                            variant="outline"
                            size="sm"
                            className="text-red-600 border-red-300 hover:bg-red-50"
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-8">
              {/* Skills Section */}
              <div>
                <h3 className="text-lg font-medium text-gray-800 mb-4">Skills (Optional)</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 mb-4">
                  {availableSkills.map((skill) => (
                    <Badge
                      key={skill}
                      variant={formData.skills.includes(skill) ? "primary" : "neutral"}
                      className="cursor-pointer text-center justify-center py-2"
                      onClick={() => toggleSkill(skill)}
                    >
                      {skill}
                    </Badge>
                  ))}
                </div>
                
                <div className="flex gap-2">
                  <Input
                    placeholder="Add custom skill..."
                    value={formData.customSkill}
                    onChange={(e) => handleInputChange('customSkill', e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addCustomSkill()}
                  />
                  <Button onClick={addCustomSkill} variant="outline" size="sm">
                    Add
                  </Button>
                </div>
              </div>

              {/* Interests Section */}
              <div>
                <h3 className="text-lg font-medium text-gray-800 mb-4">Interests (Optional)</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 mb-4">
                  {availableInterests.map((interest) => (
                    <Badge
                      key={interest}
                      variant={formData.interests.includes(interest) ? "default" : "outline"}
                      className="cursor-pointer text-center justify-center py-2"
                      onClick={() => toggleInterest(interest)}
                    >
                      {interest}
                    </Badge>
                  ))}
                </div>
                
                <div className="flex gap-2">
                  <Input
                    placeholder="Add custom interest..."
                    value={formData.customInterest}
                    onChange={(e) => handleInputChange('customInterest', e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addCustomInterest()}
                  />
                  <Button onClick={addCustomInterest} variant="outline" size="sm">
                    Add
                  </Button>
                </div>
              </div>

              {/* Summary */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-medium text-blue-900 mb-2">Profile Summary</h3>
                <div className="text-sm text-blue-800 space-y-1">
                  <div>Selected Skills: {formData.skills.length}</div>
                  <div>Selected Interests: {formData.interests.length}</div>
                  <div className="text-xs text-blue-600 mt-2">
                    This information helps us provide more personalized recommendations and connect you with relevant opportunities.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 0}
            >
              Back
            </Button>
            
            <Button
              onClick={handleNext}
              disabled={loading}
            >
              {loading ? 'Completing...' : currentStep === onboardingSteps.length - 1 ? 'Complete Setup' : 'Next'}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Onboarding; 