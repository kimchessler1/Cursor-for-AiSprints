import {
  D1Database,
  executeQuery,
  executeQueryFirst,
  executeMutation,
  generateId,
} from "@/lib/d1-client";

/**
 * User Service
 * Handles all user-related database operations
 */

export interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  password_hash: string;
  created_at: string;
  updated_at: string;
}

export interface CreateUserData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface UpdateUserData {
  firstName?: string;
  lastName?: string;
  email?: string;
}

export class UserService {
  constructor(private db: D1Database) {}

  /**
   * Create a new user
   */
  async createUser(
    userData: CreateUserData,
    passwordHash: string
  ): Promise<User> {
    const id = generateId();
    const now = new Date().toISOString();

    await executeMutation(
      this.db,
      `INSERT INTO users (id, first_name, last_name, email, password_hash, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      id,
      userData.firstName,
      userData.lastName,
      userData.email,
      passwordHash,
      now,
      now
    );

    return this.getUserById(id);
  }

  /**
   * Get user by ID
   */
  async getUserById(id: string): Promise<User> {
    const user = await executeQueryFirst<User>(
      this.db,
      "SELECT * FROM users WHERE id = ?",
      id
    );

    if (!user) {
      throw new Error("User not found");
    }

    return user;
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email: string): Promise<User | null> {
    return await executeQueryFirst<User>(
      this.db,
      "SELECT * FROM users WHERE email = ?",
      email
    );
  }

  /**
   * Update user information
   */
  async updateUser(id: string, userData: UpdateUserData): Promise<User> {
    const now = new Date().toISOString();
    const fields = [];
    const values = [];

    if (userData.firstName !== undefined) {
      fields.push("first_name = ?");
      values.push(userData.firstName);
    }
    if (userData.lastName !== undefined) {
      fields.push("last_name = ?");
      values.push(userData.lastName);
    }
    if (userData.email !== undefined) {
      fields.push("email = ?");
      values.push(userData.email);
    }

    if (fields.length === 0) {
      throw new Error("No fields to update");
    }

    fields.push("updated_at = ?");
    values.push(now);
    values.push(id);

    await executeMutation(
      this.db,
      `UPDATE users SET ${fields.join(", ")} WHERE id = ?`,
      ...values
    );

    return this.getUserById(id);
  }

  /**
   * Delete user
   */
  async deleteUser(id: string): Promise<void> {
    await executeMutation(this.db, "DELETE FROM users WHERE id = ?", id);
  }

  /**
   * Check if email already exists
   */
  async emailExists(email: string): Promise<boolean> {
    const user = await this.getUserByEmail(email);
    return user !== null;
  }

  /**
   * Get all users (for admin purposes)
   */
  async getAllUsers(): Promise<User[]> {
    return await executeQuery<User>(
      this.db,
      "SELECT * FROM users ORDER BY created_at DESC"
    );
  }

  /**
   * Get user count
   */
  async getUserCount(): Promise<number> {
    const result = await executeQueryFirst<{ count: number }>(
      this.db,
      "SELECT COUNT(*) as count FROM users"
    );
    return result?.count || 0;
  }

  /**
   * Search users by name or email
   */
  async searchUsers(query: string): Promise<User[]> {
    return await executeQuery<User>(
      this.db,
      `SELECT * FROM users 
       WHERE first_name LIKE ? OR last_name LIKE ? OR email LIKE ?
       ORDER BY created_at DESC`,
      `%${query}%`,
      `%${query}%`,
      `%${query}%`
    );
  }

  /**
   * Get users created in a date range
   */
  async getUsersByDateRange(
    startDate: string,
    endDate: string
  ): Promise<User[]> {
    return await executeQuery<User>(
      this.db,
      "SELECT * FROM users WHERE created_at BETWEEN ? AND ? ORDER BY created_at DESC",
      startDate,
      endDate
    );
  }
}
