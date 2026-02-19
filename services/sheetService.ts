
import { UserProfile, DayRecord } from "../types";

const SHEET_API_URL = "https://sheetdb.io/api/v1/kftdyehurnhwz";

export const sheetService = {
  // Fetch all users for the Leaderboard
  async getAllUsers(): Promise<UserProfile[]> {
    try {
      const response = await fetch(SHEET_API_URL);
      const data = await response.json();
      return data.map((row: any) => ({
        ...row,
        records: JSON.parse(row.records)
      }));
    } catch (error) {
      console.error("Failed to fetch users from SheetDB:", error);
      return [];
    }
  },

  // Search for a specific user by name (Login)
  async findUserByName(name: string): Promise<UserProfile | null> {
    try {
      const response = await fetch(`${SHEET_API_URL}/search?name=${encodeURIComponent(name)}`);
      const data = await response.json();
      if (data && data.length > 0) {
        return {
          ...data[0],
          records: JSON.parse(data[0].records)
        };
      }
      return null;
    } catch (error) {
      console.error("Login fetch failed:", error);
      return null;
    }
  },

  // Register a new user
  async registerUser(user: UserProfile): Promise<boolean> {
    try {
      const payload = {
        data: [{
          id: user.id,
          name: user.name,
          password: user.password,
          records: JSON.stringify(user.records)
        }]
      };
      const response = await fetch(SHEET_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return response.ok;
    } catch (error) {
      console.error("Registration failed:", error);
      return false;
    }
  },

  // Update user records (Sync)
  async syncUserRecords(userId: string, records: DayRecord[]): Promise<boolean> {
    try {
      const response = await fetch(`${SHEET_API_URL}/id/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: {
            records: JSON.stringify(records)
          }
        })
      });
      return response.ok;
    } catch (error) {
      console.error("Sync failed:", error);
      return false;
    }
  }
};
