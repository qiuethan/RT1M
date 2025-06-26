import {onCall} from "firebase-functions/v2/https";
import {logger} from "firebase-functions";
import {validateAuth} from "../utils/auth.js";
import {
  getUserProfileRef,
  getUserFinancialsRef,
  getUserGoalsRef,
  getUserSkillsRef,
  getDocument,
} from "../utils/firestore.js";

/**
 * Internal helper function to get AI conversation context
 * Used by other functions internally
 */
export const getAIContextData = async (uid) => {
  try {
    // Get all user data for AI context
    const [profileData, financialData, goalsData, skillsData] = await Promise.all([
      getDocument(getUserProfileRef(uid), "profile"),
      getDocument(getUserFinancialsRef(uid), "financials"),
      getDocument(getUserGoalsRef(uid), "goals"),
      getDocument(getUserSkillsRef(uid), "skills"),
    ]);

    // Build context object with ALL relevant information
    const context = {
      // Personal Information
      personalInfo: profileData?.basicInfo || {},
      educationHistory: profileData?.educationHistory || [],
      experience: profileData?.experience || [],
      
      // Financial Goal & Information
      financialGoal: profileData?.financialGoal || {},
      financialInfo: financialData?.financialInfo || {},
      
      // Assets and Debts (the detailed breakdown)
      assets: financialData?.assets, // null = not entered, [] = no assets
      debts: financialData?.debts,   // null = not entered, [] = no debts
      
      // Goals and Skills
      currentGoals: goalsData?.intermediateGoals, // null = not entered, [] = no goals
      skills: skillsData?.skillsAndInterests?.skills || [],
      interests: skillsData?.skillsAndInterests?.interests || [],
      
      // Metadata for AI decision making
      dataCompleteness: {
        hasBasicInfo: !!(profileData?.basicInfo?.name),
        hasFinancialInfo: financialData?.financialInfo?.annualIncome !== null,
        hasAssets: financialData?.assets !== null && financialData?.assets?.length > 0,
        hasDebts: financialData?.debts !== null && financialData?.debts?.length > 0,
        hasGoals: goalsData?.intermediateGoals !== null && goalsData?.intermediateGoals?.length > 0,
        hasSkills: (skillsData?.skillsAndInterests?.skills?.length || 0) > 0,
        hasEducation: (profileData?.educationHistory?.length || 0) > 0,
        hasExperience: (profileData?.experience?.length || 0) > 0,
        // New flags to distinguish null vs empty
        assetsEntered: financialData?.assets !== null,
        debtsEntered: financialData?.debts !== null,
        goalsEntered: goalsData?.intermediateGoals !== null,
      },
    };

    logger.info(`AI context retrieved for UID: ${uid}`);
    return context;
  } catch (error) {
    logger.error("Error getting AI conversation context:", error);
    throw new Error("Failed to get AI conversation context");
  }
};

/**
 * Get AI conversation context - returns relevant user data for chatbot
 * This is the public Firebase Function
 */
export const getAIConversationContext = onCall(async (request) => {
  const uid = validateAuth(request);
  
  const context = await getAIContextData(uid);
  return {
    success: true,
    data: context,
  };
});

/**
 * Format user profile data for AI context
 * Creates a comprehensive, human-readable summary of user data
 */
export const formatUserProfileForAI = (userContext) => {
  const profile = {
    personalInfo: userContext.personalInfo || {},
    educationHistory: userContext.educationHistory || [],
    experience: userContext.experience || [],
    financialGoal: userContext.financialGoal || {},
    financialInfo: userContext.financialInfo || {},
    assets: userContext.assets, // Keep null if not entered
    debts: userContext.debts,   // Keep null if not entered
    currentGoals: userContext.currentGoals, // Keep null if not entered
    skills: userContext.skills || [],
    interests: userContext.interests || [],
    dataCompleteness: userContext.dataCompleteness || {}
  };

  // Create a natural, conversational summary
  let summary = "Here's what I know about this user:\n\n";

  // Personal Information
  const personalDetails = [];
  if (profile.personalInfo.name) personalDetails.push(`Their name is ${profile.personalInfo.name}`);
  if (profile.personalInfo.age) personalDetails.push(`they're ${profile.personalInfo.age} years old`);
  if (profile.personalInfo.occupation) personalDetails.push(`they work as a ${profile.personalInfo.occupation}`);
  if (profile.personalInfo.location) personalDetails.push(`they're located in ${profile.personalInfo.location}`);
  if (profile.personalInfo.employmentStatus && profile.personalInfo.employmentStatus !== 'Employed') {
    personalDetails.push(`their employment status is ${profile.personalInfo.employmentStatus.toLowerCase()}`);
  }
  
  if (personalDetails.length > 0) {
    summary += "Personal background: " + personalDetails.join(', ') + ".\n\n";
  }

  // Education and Experience (if available)
  const backgroundItems = [];
  if (profile.educationHistory.length > 0) {
    const education = profile.educationHistory.map(edu => 
      `${edu.field} from ${edu.school}${edu.graduationYear ? ` (${edu.graduationYear})` : ''}`
    ).join(', ');
    backgroundItems.push(`studied ${education}`);
  }
  if (profile.experience.length > 0) {
    const recentExp = profile.experience[0]; // Most recent experience
    backgroundItems.push(`worked as ${recentExp.position} at ${recentExp.company}`);
  }
  
  if (backgroundItems.length > 0) {
    summary += "Background: They " + backgroundItems.join(' and ') + ".\n\n";
  }

  // Financial Information
  const financialDetails = [];
  if (profile.financialInfo.annualIncome !== null) {
    const incomeText = profile.financialInfo.annualIncome === 0 ? 
      "they confirmed they have $0 annual income" : 
      `they earn $${profile.financialInfo.annualIncome.toLocaleString()} annually`;
    financialDetails.push(incomeText);
  }
  if (profile.financialInfo.annualExpenses !== null) {
    const expenseText = profile.financialInfo.annualExpenses === 0 ? 
      "they confirmed they have $0 annual expenses" : 
      `their annual expenses are $${profile.financialInfo.annualExpenses.toLocaleString()}`;
    financialDetails.push(expenseText);
  }
  if (profile.financialInfo.currentSavings !== null) {
    const savingsText = profile.financialInfo.currentSavings === 0 ? 
      "they confirmed they have $0 in savings" : 
      `they have $${profile.financialInfo.currentSavings.toLocaleString()} in savings`;
    financialDetails.push(savingsText);
  }
  
  if (financialDetails.length > 0) {
    summary += "Financial situation: " + financialDetails.join(', ') + ".\n\n";
  }

  // Calculate and show net worth if we have asset/debt info
  // Calculate totals from arrays for accurate net worth
  const totalAssets = (profile.assets || []).reduce((sum, asset) => sum + (asset.value || 0), 0);
  const totalDebts = (profile.debts || []).reduce((sum, debt) => sum + (debt.balance || 0), 0);
  if (totalAssets > 0 || totalDebts > 0) {
    const netWorth = totalAssets - totalDebts;
    summary += `Their net worth is approximately $${netWorth.toLocaleString()} (assets: $${totalAssets.toLocaleString()}, debts: $${totalDebts.toLocaleString()}).\n\n`;
  }

  // Assets and Debts details (if available)
  if (profile.assets && profile.assets.length > 0) {
    const majorAssets = profile.assets.filter(a => a.value > 10000);
    if (majorAssets.length > 0) {
      const assetList = majorAssets.map(a => `${a.name} (${a.type}): $${a.value.toLocaleString()}`).join(', ');
      summary += `Major assets include: ${assetList}.\n\n`;
    }
  } else if (profile.assets === null) {
    // Assets not entered yet
  } else if (profile.assets && profile.assets.length === 0) {
    summary += "They confirmed they have no major assets.\n\n";
  }

  if (profile.debts && profile.debts.length > 0) {
    const majorDebts = profile.debts.filter(d => d.balance > 5000);
    if (majorDebts.length > 0) {
      const debtList = majorDebts.map(d => 
        `${d.name} (${d.type}): $${d.balance.toLocaleString()}${d.interestRate ? ` at ${d.interestRate}%` : ''}`
      ).join(', ');
      summary += `Major debts include: ${debtList}.\n\n`;
    }
  } else if (profile.debts === null) {
    // Debts not entered yet
  } else if (profile.debts && profile.debts.length === 0) {
    summary += "They confirmed they have no debts.\n\n";
  }

  // Financial Goal/Target
  if (profile.financialGoal.targetAmount) {
    const goalDetails = [`Their goal is to reach $${profile.financialGoal.targetAmount.toLocaleString()}`];
    if (profile.financialGoal.targetYear) {
      goalDetails.push(`by ${profile.financialGoal.targetYear}`);
    }
    if (profile.financialGoal.riskTolerance) {
      goalDetails.push(`with a ${profile.financialGoal.riskTolerance} risk tolerance`);
    }
    if (profile.financialGoal.primaryStrategy) {
      goalDetails.push(`focusing on ${profile.financialGoal.primaryStrategy}`);
    }
    summary += goalDetails.join(' ') + ".\n\n";
  }

  // Current Goals (if any)
  if (profile.currentGoals && profile.currentGoals.length > 0) {
    const activeGoals = profile.currentGoals.filter(g => g.status !== 'Completed');
    if (activeGoals.length > 0) {
      const goalSummary = activeGoals.slice(0, 3).map(goal => {
        let goalText = goal.title;
        if (goal.targetAmount) goalText += ` ($${goal.targetAmount.toLocaleString()})`;
        if (goal.progress) goalText += ` - ${goal.progress}% complete`;
        return goalText;
      }).join(', ');
      summary += `Current goals: ${goalSummary}.\n\n`;
    }
  } else if (profile.currentGoals === null) {
    // Goals not entered yet
  } else if (profile.currentGoals && profile.currentGoals.length === 0) {
    summary += "They haven't set any specific intermediate goals yet.\n\n";
  }

  // Skills and Interests (if available)
  if (profile.skills.length > 0 || profile.interests.length > 0) {
    const backgroundInfo = [];
    if (profile.skills.length > 0) {
      backgroundInfo.push(`their skills include ${profile.skills.join(', ')}`);
    }
    if (profile.interests.length > 0) {
      backgroundInfo.push(`they're interested in ${profile.interests.join(', ')}`);
    }
    summary += "Additional background: " + backgroundInfo.join(' and ') + ".\n\n";
  }

  // What information is missing (for context, not to force collection)
  const missingInfo = [];
  if (!profile.dataCompleteness.hasBasicInfo) missingInfo.push("basic personal info");
  if (!profile.dataCompleteness.hasFinancialInfo) missingInfo.push("financial details");
  if (!profile.dataCompleteness.assetsEntered) missingInfo.push("asset information");
  if (!profile.dataCompleteness.debtsEntered) missingInfo.push("debt information");
  if (!profile.dataCompleteness.goalsEntered) missingInfo.push("specific goals");
  
  if (missingInfo.length > 0) {
    summary += `Note: Missing ${missingInfo.join(', ')} - but only collect this naturally through conversation, don't interrogate.\n\n`;
  }

    summary += "Remember: Be conversational and helpful. Only extract information that's naturally mentioned in conversation.";

  return summary;
}; 