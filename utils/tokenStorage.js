import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEYS = {
  ACCESS_TOKEN: '@skillswap_access_token',
  REFRESH_TOKEN: '@skillswap_refresh_token',
  USER_ROLE: '@skillswap_user_role',
  USER_ID: '@skillswap_user_id',
};

export const tokenStorage = {
  // Store tokens
  async setTokens(accessToken, refreshToken, role = null, userId = null) {
    try {
      const MultiSetArgs = [
        [TOKEN_KEYS.ACCESS_TOKEN, accessToken],
        [TOKEN_KEYS.REFRESH_TOKEN, refreshToken],
      ];
      if (role) {
        MultiSetArgs.push([TOKEN_KEYS.USER_ROLE, role]);
      }
      if (userId) {
        MultiSetArgs.push([TOKEN_KEYS.USER_ID, userId]);
      }
      await AsyncStorage.multiSet(MultiSetArgs);
    } catch (error) {
      console.error('Error storing tokens:', error);
      throw error;
    }
  },

  // Get access token
  async getAccessToken() {
    try {
      return await AsyncStorage.getItem(TOKEN_KEYS.ACCESS_TOKEN);
    } catch (error) {
      console.error('Error getting access token:', error);
      return null;
    }
  },

  // Get refresh token
  async getRefreshToken() {
    try {
      return await AsyncStorage.getItem(TOKEN_KEYS.REFRESH_TOKEN);
    } catch (error) {
      console.error('Error getting refresh token:', error);
      return null;
    }
  },

  // Get user role
  async getUserRole() {
    try {
      return await AsyncStorage.getItem(TOKEN_KEYS.USER_ROLE);
    } catch (error) {
      console.error('Error getting user role:', error);
      return null;
    }
  },

  // Get user ID
  async getUserId() {
    try {
      return await AsyncStorage.getItem(TOKEN_KEYS.USER_ID);
    } catch (error) {
      console.error('Error getting user ID:', error);
      return null;
    }
  },

  // Get both tokens
  async getTokens() {
    try {
      const [accessToken, refreshToken] = await AsyncStorage.multiGet([
        TOKEN_KEYS.ACCESS_TOKEN,
        TOKEN_KEYS.REFRESH_TOKEN,
      ]);
      return {
        accessToken: accessToken[1],
        refreshToken: refreshToken[1],
      };
    } catch (error) {
      console.error('Error getting tokens:', error);
      return { accessToken: null, refreshToken: null };
    }
  },

  // Check if user is authenticated
  async isAuthenticated() {
    try {
      const accessToken = await this.getAccessToken();
      return accessToken !== null;
    } catch (error) {
      return false;
    }
  },

  // Clear all tokens (logout)
  async clearTokens() {
    try {
      await AsyncStorage.multiRemove([
        TOKEN_KEYS.ACCESS_TOKEN,
        TOKEN_KEYS.REFRESH_TOKEN,
        TOKEN_KEYS.USER_ROLE,
        TOKEN_KEYS.USER_ID,
      ]);
    } catch (error) {
      console.error('Error clearing tokens:', error);
      throw error;
    }
  },
};

