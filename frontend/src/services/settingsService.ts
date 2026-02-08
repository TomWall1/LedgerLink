import { apiClient } from './api';

export interface MatchingRules {
  dateToleranceDays: number;
  amountTolerancePercent: number;
  requireExactMatch: boolean;
  autoProcessMatches: boolean;
  confidenceThreshold: number;
  enableFuzzyMatching: boolean;
}

export interface NotificationSettings {
  emailMatches: boolean;
  emailDiscrepancies: boolean;
  emailSystemUpdates: boolean;
  emailReports: boolean;
  pushEnabled: boolean;
  weeklyDigest: boolean;
}

export interface UserSettings {
  matchingRules: MatchingRules;
  notifications: NotificationSettings;
}

export interface ProfileData {
  name?: string;
  email?: string;
  phone?: string;
  timezone?: string;
}

class SettingsService {
  async getSettings(): Promise<UserSettings> {
    const response = await apiClient.get('users/settings');
    return response.data.settings;
  }

  async updateSettings(data: { matchingRules?: Partial<MatchingRules>; notifications?: Partial<NotificationSettings> }): Promise<UserSettings> {
    const response = await apiClient.put('users/settings', data);
    return response.data.settings;
  }

  async updateProfile(data: ProfileData): Promise<any> {
    const response = await apiClient.put('users/profile', data);
    return response.data;
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await apiClient.put('users/password', { currentPassword, newPassword });
  }

  async deleteAccount(password: string): Promise<void> {
    await apiClient.delete('users/account', { data: { password } });
  }
}

const settingsService = new SettingsService();
export default settingsService;
