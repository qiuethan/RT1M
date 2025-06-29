import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  saveUserProfile, 
  getUserProfile, 
  saveUserIntermediateGoals,
  getUserIntermediateGoals,
  saveUserSkills,
  getUserSkills
} from '../services/firestore';
import { Button, Input, Select, Card, DatePicker, LoadingSpinner } from '../components/ui';

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
    title: "RT1M Goal",
    description: "Define your path to your first million"
  },
  {
    title: "Education & Experience",
    description: "Tell us about your background (optional)"
  },
  {
    title: "Skills & Interests",
    description: "What skills and interests do you have? (optional)"
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
  const [educationErrors, setEducationErrors] = useState<Record<number, Record<string, string>>>({});
  const [experienceErrors, setExperienceErrors] = useState<Record<number, Record<string, string>>>({});

  // Validation helper functions
  const validateYear = (year: string): boolean => {
    if (!year) return true; // Empty is allowed
    const yearNum = parseInt(year);
    return !isNaN(yearNum) && yearNum >= 1900 && yearNum <= new Date().getFullYear() + 10;
  };

  const validateEducationDates = (index: number, field: string, value: string) => {
    const education = [...formData.education];
    education[index] = { ...education[index], [field]: value };
    
    const newErrors = { ...educationErrors };
    if (!newErrors[index]) newErrors[index] = {};

    // Validate year format
    if (field === 'graduationYear' && value && !validateYear(value)) {
      newErrors[index].graduationYear = 'Please enter a valid year';
    } else if (field === 'graduationYear') {
      delete newErrors[index].graduationYear;
    }

    setEducationErrors(newErrors);
  };

  const validateExperienceDates = (index: number, field: string, value: string) => {
    const experience = [...formData.experience];
    experience[index] = { ...experience[index], [field]: value };
    
    const newErrors = { ...experienceErrors };
    if (!newErrors[index]) newErrors[index] = {};

    // Validate year format
    if ((field === 'startYear' || field === 'endYear') && value && value.toLowerCase() !== 'present' && !validateYear(value)) {
      newErrors[index][field] = 'Please enter a valid year or "Present"';
    } else if (field === 'startYear' || field === 'endYear') {
      delete newErrors[index][field];
    }

    // Validate end year is after start year
    if (field === 'endYear' || field === 'startYear') {
      const startYear = field === 'startYear' ? value : experience[index].startYear;
      const endYear = field === 'endYear' ? value : experience[index].endYear;
      
      if (startYear && endYear && endYear.toLowerCase() !== 'present') {
        const startYearNum = parseInt(startYear);
        const endYearNum = parseInt(endYear);
        
        if (!isNaN(startYearNum) && !isNaN(endYearNum) && endYearNum < startYearNum) {
          newErrors[index].endYear = 'End year must be after start year';
        } else {
          delete newErrors[index].endYear;
        }
      }
    }

    setExperienceErrors(newErrors);
  };

  useEffect(() => {
    if (currentUser) {
      setFormData(prev => ({
        ...prev,
        email: currentUser.email || ''
      }));

      // Load existing data if available
      Promise.all([
        getUserProfile(),
        getUserIntermediateGoals(),
        getUserSkills()
      ]).then(([profile, _goals, skills]) => {
        if (profile) {
          setFormData(prev => ({
            ...prev,
            name: profile.basicInfo?.name || '',
            birthday: profile.basicInfo?.birthday || '',
            location: profile.basicInfo?.location || '',
            occupation: profile.basicInfo?.occupation || '',
            country: profile.basicInfo?.country || '',
            employmentStatus: profile.basicInfo?.employmentStatus || '',
            education: profile.educationHistory && profile.educationHistory.length > 0 
              ? profile.educationHistory 
              : [{ school: '', field: '', graduationYear: '' }],
            experience: profile.experience && profile.experience.length > 0 
              ? profile.experience 
              : [{ company: '', position: '', startYear: '', endYear: '', description: '' }],
            // Skills now come from separate collection
            skills: skills?.skillsAndInterests?.skills || [],
            interests: skills?.skillsAndInterests?.interests || [],
            // Financial goal data now comes from profile
            targetAmount: profile.financialGoal?.targetAmount?.toString() || '1000000',
            targetYear: profile.financialGoal?.targetYear?.toString() || '',
            timeframe: profile.financialGoal?.timeframe || '',
            riskTolerance: profile.financialGoal?.riskTolerance || '',
            primaryStrategy: profile.financialGoal?.primaryStrategy || ''
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
      case 1: // RT1M Goal
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
      case 2: // Education & Experience - optional
        break;
      case 3: // Skills & Interests - optional
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
      // Prepare profile data (basic info, education, experience, financial goal - NO skills)
      const profileData = {
        basicInfo: {
          name: formData.name || null,
          email: formData.email,
          birthday: formData.birthday || null,
          location: formData.location || null,
          occupation: formData.occupation || null,
          country: formData.country || null,
          employmentStatus: formData.employmentStatus || null
        },
        educationHistory: formData.education.filter(edu => edu.school || edu.field || edu.graduationYear),
        experience: formData.experience.filter(exp => exp.company || exp.position),
        financialGoal: {
          targetAmount: parseFloat(formData.targetAmount),
          targetYear: parseInt(formData.targetYear),
          timeframe: formData.timeframe || null,
          riskTolerance: formData.riskTolerance || null,
          primaryStrategy: formData.primaryStrategy || null
        }
      };

      // Prepare goals data (empty for now, will be added later)
      const goalsData = {
        intermediateGoals: []
      };

      // Prepare skills data (separate from profile)
      const skillsData = {
        skillsAndInterests: {
          interests: formData.interests,
          skills: formData.skills
        }
      };

      // Save all data in parallel (no financial data since we removed that step)
      await Promise.all([
        saveUserProfile(profileData),
        saveUserIntermediateGoals(goalsData),
        saveUserSkills(skillsData)
      ]);

      // Navigate to dashboard
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

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-surface-50 via-primary-50/20 to-secondary-50/30 flex items-center justify-center">
        <LoadingSpinner 
          size="xl" 
          variant="primary" 
          text="Loading onboarding..." 
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-16 pb-4 sm:pt-8 sm:pb-8">
      <div className="max-w-4xl mx-auto px-2 sm:px-4">
        {/* Progress Bar */}
        <div className="mb-4 sm:mb-8">
          <div className="flex items-center justify-between mb-2 sm:mb-4">
            <h1 className="text-lg sm:text-2xl font-bold text-gray-900">Complete Your Profile</h1>
            <span className="text-xs sm:text-sm text-gray-500">
              Step {currentStep + 1} of {onboardingSteps.length}
            </span>
          </div>
          
          <div className="flex items-center space-x-1 sm:space-x-2">
            {onboardingSteps.map((_, index) => (
              <React.Fragment key={index}>
                <div
                  className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium ${
                    index <= currentStep
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {index + 1}
                </div>
                {index < onboardingSteps.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 sm:h-1 ${
                      index < currentStep ? 'bg-indigo-600' : 'bg-gray-200'
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        <Card className="p-3 sm:p-6 lg:p-8">
          <div className="mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
              {onboardingSteps[currentStep].title}
            </h2>
            <p className="text-sm sm:text-base text-gray-600 mt-1">
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
                <DatePicker
                  label="Date of Birth"
                  value={formData.birthday}
                  onChange={(date) => handleInputChange('birthday', date || '')}
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
                <div className="p-4 bg-gradient-to-r from-accent-50 to-secondary-50 rounded-lg border">
                  <div className="text-center">
                    <div className="text-sm font-medium text-surface-700 mb-2">Your RT1M Goal</div>
                    <div className="text-2xl font-bold text-accent-600 mb-1">
                      ${parseFloat(formData.targetAmount).toLocaleString()}
                    </div>
                    <div className="text-sm text-surface-600">
                      Target: {formData.targetYear}
                      {parseInt(formData.targetYear) > new Date().getFullYear() && (
                        <span className="ml-2 text-surface-500">
                          ({parseInt(formData.targetYear) - new Date().getFullYear()} years to go)
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6 sm:space-y-8">
              <div className="text-center text-gray-600 mb-4 sm:mb-6">
                <p className="text-xs sm:text-sm">This information is optional but helps us create more personalized recommendations.</p>
              </div>
              
              {/* Education Section */}
              <div>
                <h3 className="text-lg font-medium text-gray-800 mb-4">Education History</h3>
                {formData.education.map((edu, index) => (
                  <div key={index} className="p-4 border border-gray-200 rounded-lg mb-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <Input
                        label="School/Institution"
                        value={edu.school}
                        onChange={(e) => {
                          const newEducation = [...formData.education];
                          newEducation[index].school = e.target.value;
                          setFormData(prev => ({ ...prev, education: newEducation }));
                        }}
                        placeholder="University of Example"
                      />
                      <Input
                        label="Field of Study"
                        value={edu.field}
                        onChange={(e) => {
                          const newEducation = [...formData.education];
                          newEducation[index].field = e.target.value;
                          setFormData(prev => ({ ...prev, education: newEducation }));
                        }}
                        placeholder="Computer Science"
                      />
                      <Input
                        label="Graduation Year"
                        value={edu.graduationYear}
                        onChange={(e) => {
                          const newEducation = [...formData.education];
                          newEducation[index].graduationYear = e.target.value;
                          setFormData(prev => ({ ...prev, education: newEducation }));
                          validateEducationDates(index, 'graduationYear', e.target.value);
                        }}
                        placeholder="2020"
                        error={educationErrors[index]?.graduationYear}
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newEducation = formData.education.filter((_, i) => i !== index);
                        setFormData(prev => ({ ...prev, education: newEducation }));
                      }}
                      className="text-red-600 hover:text-red-700 w-full sm:w-auto"
                    >
                      Remove
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      education: [...prev.education, { school: '', field: '', graduationYear: '' }]
                    }));
                  }}
                  className="mb-6 w-full sm:w-auto"
                >
                  Add Education
                </Button>
              </div>

              {/* Experience Section */}
              <div>
                <h3 className="text-lg font-medium text-gray-800 mb-4">Work Experience</h3>
                {formData.experience.map((exp, index) => (
                  <div key={index} className="p-4 border border-gray-200 rounded-lg mb-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <Input
                        label="Company"
                        value={exp.company}
                        onChange={(e) => {
                          const newExperience = [...formData.experience];
                          newExperience[index].company = e.target.value;
                          setFormData(prev => ({ ...prev, experience: newExperience }));
                        }}
                        placeholder="Tech Corp"
                      />
                      <Input
                        label="Position"
                        value={exp.position}
                        onChange={(e) => {
                          const newExperience = [...formData.experience];
                          newExperience[index].position = e.target.value;
                          setFormData(prev => ({ ...prev, experience: newExperience }));
                        }}
                        placeholder="Software Engineer"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <Input
                        label="Start Year"
                        value={exp.startYear}
                        onChange={(e) => {
                          const newExperience = [...formData.experience];
                          newExperience[index].startYear = e.target.value;
                          setFormData(prev => ({ ...prev, experience: newExperience }));
                          validateExperienceDates(index, 'startYear', e.target.value);
                        }}
                        placeholder="2020"
                        error={experienceErrors[index]?.startYear}
                      />
                      <Input
                        label="End Year"
                        value={exp.endYear}
                        onChange={(e) => {
                          const newExperience = [...formData.experience];
                          newExperience[index].endYear = e.target.value;
                          setFormData(prev => ({ ...prev, experience: newExperience }));
                          validateExperienceDates(index, 'endYear', e.target.value);
                        }}
                        placeholder="Present or 2022"
                        error={experienceErrors[index]?.endYear}
                      />
                    </div>
                    <Input
                      label="Description (Optional)"
                      value={exp.description}
                      onChange={(e) => {
                        const newExperience = [...formData.experience];
                        newExperience[index].description = e.target.value;
                        setFormData(prev => ({ ...prev, experience: newExperience }));
                      }}
                      placeholder="Brief description of your role..."
                      className="mb-4"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newExperience = formData.experience.filter((_, i) => i !== index);
                        setFormData(prev => ({ ...prev, experience: newExperience }));
                      }}
                      className="text-red-600 hover:text-red-700 w-full sm:w-auto"
                    >
                      Remove
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      experience: [...prev.experience, { company: '', position: '', startYear: '', endYear: '', description: '' }]
                    }));
                  }}
                  className="w-full sm:w-auto"
                >
                  Add Experience
                </Button>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6 sm:space-y-8">
              {/* Skills Section */}
              <div>
                <h3 className="text-lg font-medium text-gray-800 mb-4">Skills (Optional)</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 mb-4">
                  {availableSkills.map((skill) => (
                    <button
                      key={skill}
                      onClick={() => toggleSkill(skill)}
                      className={`px-2 sm:px-3 py-2 rounded-full text-xs sm:text-sm border transition-colors ${
                        formData.skills.includes(skill)
                          ? 'bg-indigo-100 border-indigo-300 text-indigo-800'
                          : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {skill}
                    </button>
                  ))}
                </div>
                
                {/* Custom Skills */}
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Add Custom Skills</h4>
                  <div className="flex flex-col sm:flex-row gap-2 mb-2">
                    <div className="flex-1">
                      <Input
                        value={formData.customSkill}
                        onChange={(e) => handleInputChange('customSkill', e.target.value)}
                        placeholder="Enter a skill..."
                        onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                          if (e.key === 'Enter' && formData.customSkill.trim()) {
                            e.preventDefault();
                            if (!formData.skills.includes(formData.customSkill.trim())) {
                              setFormData(prev => ({
                                ...prev,
                                skills: [...prev.skills, prev.customSkill.trim()],
                                customSkill: ''
                              }));
                            } else {
                              setFormData(prev => ({ ...prev, customSkill: '' }));
                            }
                          }
                        }}
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full sm:w-auto"
                      onClick={() => {
                        if (formData.customSkill.trim() && !formData.skills.includes(formData.customSkill.trim())) {
                          setFormData(prev => ({
                            ...prev,
                            skills: [...prev.skills, prev.customSkill.trim()],
                            customSkill: ''
                          }));
                        }
                      }}
                      disabled={!formData.customSkill.trim() || formData.skills.includes(formData.customSkill.trim())}
                    >
                      Add
                    </Button>
                  </div>
                  
                  {/* Display custom skills with remove option */}
                  {formData.skills.filter(skill => !availableSkills.includes(skill)).length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.skills.filter(skill => !availableSkills.includes(skill)).map((skill) => (
                        <span
                          key={skill}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-indigo-100 border border-indigo-300 text-indigo-800"
                        >
                          {skill}
                          <button
                            onClick={() => toggleSkill(skill)}
                            className="ml-2 text-indigo-600 hover:text-indigo-800"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Interests Section */}
              <div>
                <h3 className="text-lg font-medium text-gray-800 mb-4">Interests (Optional)</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 mb-4">
                  {availableInterests.map((interest) => (
                    <button
                      key={interest}
                      onClick={() => toggleInterest(interest)}
                      className={`px-2 sm:px-3 py-2 rounded-full text-xs sm:text-sm border transition-colors ${
                        formData.interests.includes(interest)
                          ? 'bg-purple-100 border-purple-300 text-purple-800'
                          : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {interest}
                    </button>
                  ))}
                </div>
                
                {/* Custom Interests */}
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Add Custom Interests</h4>
                  <div className="flex flex-col sm:flex-row gap-2 mb-2">
                    <div className="flex-1">
                      <Input
                        value={formData.customInterest}
                        onChange={(e) => handleInputChange('customInterest', e.target.value)}
                        placeholder="Enter an interest..."
                        onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                          if (e.key === 'Enter' && formData.customInterest.trim()) {
                            e.preventDefault();
                            if (!formData.interests.includes(formData.customInterest.trim())) {
                              setFormData(prev => ({
                                ...prev,
                                interests: [...prev.interests, prev.customInterest.trim()],
                                customInterest: ''
                              }));
                            } else {
                              setFormData(prev => ({ ...prev, customInterest: '' }));
                            }
                          }
                        }}
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full sm:w-auto"
                      onClick={() => {
                        if (formData.customInterest.trim() && !formData.interests.includes(formData.customInterest.trim())) {
                          setFormData(prev => ({
                            ...prev,
                            interests: [...prev.interests, prev.customInterest.trim()],
                            customInterest: ''
                          }));
                        }
                      }}
                      disabled={!formData.customInterest.trim() || formData.interests.includes(formData.customInterest.trim())}
                    >
                      Add
                    </Button>
                  </div>
                  
                  {/* Display custom interests with remove option */}
                  {formData.interests.filter(interest => !availableInterests.includes(interest)).length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.interests.filter(interest => !availableInterests.includes(interest)).map((interest) => (
                        <span
                          key={interest}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-purple-100 border border-purple-300 text-purple-800"
                        >
                          {interest}
                          <button
                            onClick={() => toggleInterest(interest)}
                            className="ml-2 text-purple-600 hover:text-purple-800"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Summary */}
              <div className="p-4 bg-gradient-to-r from-primary-50 to-accent-50 rounded-lg border">
                <h3 className="font-medium text-surface-700 mb-2">Profile Summary</h3>
                <div className="text-sm text-surface-600 space-y-1">
                  <div>Selected Skills: {formData.skills.length}</div>
                  <div>Selected Interests: {formData.interests.length}</div>
                  <div className="text-xs text-surface-500 mt-2">
                    This information helps us provide more personalized recommendations and connect you with relevant opportunities.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-0 mt-6 sm:mt-8">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 0}
              className="w-full sm:w-auto order-2 sm:order-1"
            >
              Back
            </Button>
            
            <Button
              onClick={handleNext}
              disabled={loading}
              className="w-full sm:w-auto order-1 sm:order-2"
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