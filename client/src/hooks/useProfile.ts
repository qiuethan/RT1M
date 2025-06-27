import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useChatContext } from '../contexts/ChatContext';
import { 
  getUserProfile,
  getUserSkills,
  updateUserProfileSection,
  saveUserSkills,
  UserProfile,
  UserSkills
} from '../services/firestore';

export interface UseProfileReturn {
  // State
  loading: boolean;
  profile: UserProfile | null;
  skills: UserSkills | null;
  
  // Actions
  refreshData: () => Promise<void>;
  updateProfile: (section: string, data: any) => Promise<void>;
  updateSkills: (skillsData: Partial<UserSkills>) => Promise<void>;
}

export const useProfile = (): UseProfileReturn => {
  const { currentUser } = useAuth();
  const { registerDataRefreshCallback, unregisterDataRefreshCallback } = useChatContext();
  
  // State
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [skills, setSkills] = useState<UserSkills | null>(null);

  // Refresh data function
  const refreshData = useCallback(async () => {
    if (!currentUser) return;
    
    try {
      console.log('Refreshing profile data due to AI update');
      const [profileData, skillsData] = await Promise.all([
        getUserProfile(),
        getUserSkills()
      ]);
      
      setProfile(profileData);
      setSkills(skillsData);
      
      console.log('Profile data refreshed successfully');
    } catch (error) {
      console.error('Error refreshing profile data:', error);
    }
  }, [currentUser]);

  // Load profile data on component mount
  useEffect(() => {
    const loadData = async () => {
      if (!currentUser) return;
      
      try {
        setLoading(true);
        const [profileData, skillsData] = await Promise.all([
          getUserProfile(),
          getUserSkills()
        ]);
        setProfile(profileData);
        setSkills(skillsData);
      } catch (error) {
        console.error('Error loading profile data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [currentUser]);

  // Register for data refresh callbacks from chat
  useEffect(() => {
    registerDataRefreshCallback(refreshData);
    
    return () => {
      unregisterDataRefreshCallback(refreshData);
    };
  }, [refreshData, registerDataRefreshCallback, unregisterDataRefreshCallback]);

  // Actions
  const updateProfileData = async (section: string, data: any) => {
    try {
      await updateUserProfileSection(section, data);
      // Refresh data to get latest from server
      await refreshData();
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  const updateSkillsData = async (skillsData: Partial<UserSkills>) => {
    try {
      await saveUserSkills(skillsData);
      // Refresh data to get latest from server
      await refreshData();
    } catch (error) {
      console.error('Error updating skills:', error);
      throw error;
    }
  };

  return {
    // State
    loading,
    profile,
    skills,
    
    // Actions
    refreshData,
    updateProfile: updateProfileData,
    updateSkills: updateSkillsData,
  };
}; 