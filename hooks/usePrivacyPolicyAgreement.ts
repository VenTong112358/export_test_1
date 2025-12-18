import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

const PRIVACY_POLICY_ACCEPTED_KEY = 'privacy_policy_accepted_v1';

export const usePrivacyPolicyAgreement = () => {
  const [hasAccepted, setHasAccepted] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user has already accepted the privacy policy
  useEffect(() => {
    const checkPrivacyPolicyStatus = async () => {
      try {
        const accepted = await AsyncStorage.getItem(PRIVACY_POLICY_ACCEPTED_KEY);
        setHasAccepted(accepted === 'true');
      } catch (error) {
        console.error('Error checking privacy policy status:', error);
        setHasAccepted(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkPrivacyPolicyStatus();
  }, []);

  // Mark privacy policy as accepted
  const acceptPrivacyPolicy = async () => {
    try {
      await AsyncStorage.setItem(PRIVACY_POLICY_ACCEPTED_KEY, 'true');
      setHasAccepted(true);
    } catch (error) {
      console.error('Error saving privacy policy acceptance:', error);
      throw error;
    }
  };

  // Reset privacy policy (for testing purposes)
  const resetPrivacyPolicyStatus = async () => {
    try {
      await AsyncStorage.removeItem(PRIVACY_POLICY_ACCEPTED_KEY);
      setHasAccepted(false);
    } catch (error) {
      console.error('Error resetting privacy policy status:', error);
      throw error;
    }
  };

  return {
    hasAccepted,
    isLoading,
    acceptPrivacyPolicy,
    resetPrivacyPolicyStatus,
  };
};

