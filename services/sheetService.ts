
import { UserProfile, DayRecord } from "../types";

const SHEET_API_URL = "https://sheetdb.io/api/v1/kftdyehurnhwz";

export const sheetService = {
  // Fetch all users from the sheet
  async getAllUsers(): Promise<UserProfile[]> {
    try {
      const response = await fetch(SHEET_API_URL);
      if (!response.ok) throw new Error("Network response was not ok");
      const data = await response.json();
      
      // Ensure data is an array and parse the nested records JSON
      if (!Array.isArray(data)) return [];
      
      return data.map((row: any) => ({
        id: row.id,
        name: row.name,
        password: row.password,
        records: row.records ? JSON.parse(row.records) : [],
        isCurrentUser: false
      }));
    } catch (error) {
      console.error("Failed to fetch users from SheetDB:", error);
      return [];
    }
  },

  // Register a new user with password
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
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      return response.ok;
    } catch (error) {
      console.error("Registration failed:", error);
      return false;
    }
  },

  // Sync user records to the sheet
  async syncUserRecords(userId: string, records: DayRecord[]): Promise<boolean> {
    try {
      const response = await fetch(`${SHEET_API_URL}/id/${userId}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
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
