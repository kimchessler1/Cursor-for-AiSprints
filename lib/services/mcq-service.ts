/**
 * MCQ Service Layer
 * Handles all MCQ-related database operations
 */

import { D1Database } from "@/lib/d1-client";
import {
  executeQuery,
  executeQueryFirst,
  executeMutation,
  executeBatch,
  generateId,
} from "@/lib/d1-client";

// Types for MCQ data structures
export interface MCQ {
  id: string;
  title: string;
  description: string | null;
  question: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface MCQChoice {
  id: string;
  mcq_id: string;
  choice_text: string;
  is_correct: boolean | string | number;
  order_index: number;
  created_at: string;
}

export interface MCQAttempt {
  id: string;
  mcq_id: string;
  user_id: string;
  selected_choice_id: string;
  is_correct: boolean;
  attempted_at: string;
}

export interface CreateMCQData {
  title: string;
  description?: string;
  question: string;
  choices: {
    choice_text: string;
    is_correct: boolean;
    order_index: number;
  }[];
}

export type UpdateMCQData = CreateMCQData;

export interface MCQWithChoices extends MCQ {
  choices: MCQChoice[];
}

export interface PaginationParams {
  page: number;
  limit: number;
  search?: string;
  created_by?: string;
}

export interface PaginatedMCQs {
  mcqs: MCQ[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export class MCQService {
  private db: D1Database;

  constructor(db: D1Database) {
    this.db = db;
  }

  /**
   * Create a new MCQ with choices
   */
  async createMCQ(
    mcqData: CreateMCQData,
    userId: string
  ): Promise<MCQWithChoices> {
    const mcqId = generateId();
    const now = new Date().toISOString();

    // Validate choices
    if (mcqData.choices.length < 2 || mcqData.choices.length > 6) {
      throw new Error("MCQ must have between 2 and 6 choices");
    }

    const correctChoices = mcqData.choices.filter(
      (choice) => choice.is_correct
    );
    if (correctChoices.length !== 1) {
      throw new Error("MCQ must have exactly one correct choice");
    }

    // Create MCQ
    await executeMutation(
      this.db,
      `INSERT INTO mcqs (id, title, description, question, created_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      mcqId,
      mcqData.title,
      mcqData.description || null,
      mcqData.question,
      userId,
      now,
      now
    );

    // Create choices individually
    for (const choice of mcqData.choices) {
      console.log("Creating choice:", {
        text: choice.choice_text,
        is_correct: choice.is_correct,
        type: typeof choice.is_correct,
      });

      await executeMutation(
        this.db,
        `INSERT INTO mcq_choices (id, mcq_id, choice_text, is_correct, order_index, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        generateId(),
        mcqId,
        choice.choice_text,
        choice.is_correct ? 1 : 0, // Convert boolean to integer for SQLite
        choice.order_index,
        now
      );
    }

    // Return the created MCQ with choices
    const mcq = await this.getMCQById(mcqId);
    if (!mcq) {
      throw new Error("Failed to retrieve created MCQ");
    }
    return mcq;
  }

  /**
   * Get MCQ by ID with choices
   */
  async getMCQById(id: string): Promise<MCQWithChoices | null> {
    const mcq = await executeQueryFirst<MCQ>(
      this.db,
      "SELECT * FROM mcqs WHERE id = ?",
      id
    );

    if (!mcq) {
      return null;
    }

    const choices = await executeQuery<MCQChoice>(
      this.db,
      "SELECT * FROM mcq_choices WHERE mcq_id = ? ORDER BY order_index",
      id
    );

    console.log("Raw choices from database:", choices);
    console.log(
      "Choice is_correct values:",
      choices.map((c) => ({
        text: c.choice_text,
        is_correct: c.is_correct,
        type: typeof c.is_correct,
      }))
    );

    // Convert SQLite boolean values to JavaScript booleans
    // Handle integer (0/1), string ('true'/'false'), and boolean values from database
    const normalizedChoices = choices.map((choice) => ({
      ...choice,
      is_correct:
        choice.is_correct === 1 ||
        choice.is_correct === "true" ||
        choice.is_correct === true,
    }));

    console.log("Normalized choices:", normalizedChoices);
    console.log(
      "Normalized is_correct values:",
      normalizedChoices.map((c) => ({
        text: c.choice_text,
        is_correct: c.is_correct,
        type: typeof c.is_correct,
      }))
    );

    return {
      ...mcq,
      choices: normalizedChoices,
    };
  }

  /**
   * Get paginated list of MCQs
   */
  async getMCQs(params: PaginationParams): Promise<PaginatedMCQs> {
    const { page, limit, search, created_by } = params;
    const offset = (page - 1) * limit;

    // Build WHERE clause
    let whereClause = "WHERE 1=1";
    const queryParams: unknown[] = [];

    if (created_by) {
      whereClause += " AND created_by = ?";
      queryParams.push(created_by);
    }

    if (search) {
      whereClause +=
        " AND (title LIKE ? OR description LIKE ? OR question LIKE ?)";
      const searchTerm = `%${search}%`;
      queryParams.push(searchTerm, searchTerm, searchTerm);
    }

    // Get total count
    const countResult = await executeQueryFirst<{ count: number }>(
      this.db,
      `SELECT COUNT(*) as count FROM mcqs ${whereClause}`,
      ...queryParams
    );
    const total = countResult?.count || 0;

    // Get MCQs
    const mcqs = await executeQuery<MCQ>(
      this.db,
      `SELECT * FROM mcqs ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      ...queryParams,
      limit,
      offset
    );

    return {
      mcqs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Update MCQ and its choices
   */
  async updateMCQ(
    id: string,
    mcqData: UpdateMCQData,
    userId: string
  ): Promise<MCQWithChoices> {
    // Check if MCQ exists and belongs to user
    const existingMCQ = await executeQueryFirst<MCQ>(
      this.db,
      "SELECT * FROM mcqs WHERE id = ? AND created_by = ?",
      id,
      userId
    );

    if (!existingMCQ) {
      throw new Error("MCQ not found or access denied");
    }

    // Validate choices
    if (mcqData.choices.length < 2 || mcqData.choices.length > 6) {
      throw new Error("MCQ must have between 2 and 6 choices");
    }

    const correctChoices = mcqData.choices.filter(
      (choice) => choice.is_correct
    );
    if (correctChoices.length !== 1) {
      throw new Error("MCQ must have exactly one correct choice");
    }

    const now = new Date().toISOString();

    // Update MCQ
    await executeMutation(
      this.db,
      `UPDATE mcqs SET title = ?, description = ?, question = ?, updated_at = ?
       WHERE id = ?`,
      mcqData.title,
      mcqData.description || null,
      mcqData.question,
      now,
      id
    );

    // Delete existing choices
    await executeMutation(
      this.db,
      "DELETE FROM mcq_choices WHERE mcq_id = ?",
      id
    );

    // Create new choices
    const choiceStatements = mcqData.choices.map((choice) => ({
      query: `INSERT INTO mcq_choices (id, mcq_id, choice_text, is_correct, order_index, created_at)
               VALUES (?, ?, ?, ?, ?, ?)`,
      params: [
        generateId(),
        id,
        choice.choice_text,
        choice.is_correct ? 1 : 0, // Convert boolean to integer for SQLite
        choice.order_index,
        now,
      ],
    }));

    await executeBatch(this.db, choiceStatements);

    // Return updated MCQ with choices
    const mcq = await this.getMCQById(id);
    if (!mcq) {
      throw new Error("Failed to retrieve updated MCQ");
    }
    return mcq;
  }

  /**
   * Delete MCQ and all related data
   */
  async deleteMCQ(id: string, userId: string): Promise<boolean> {
    // Check if MCQ exists and belongs to user
    const existingMCQ = await executeQueryFirst<MCQ>(
      this.db,
      "SELECT * FROM mcqs WHERE id = ? AND created_by = ?",
      id,
      userId
    );

    if (!existingMCQ) {
      throw new Error("MCQ not found or access denied");
    }

    // Delete MCQ (choices and attempts will be cascade deleted)
    await executeMutation(this.db, "DELETE FROM mcqs WHERE id = ?", id);

    return true;
  }

  /**
   * Record an attempt for an MCQ
   */
  async recordAttempt(
    mcqId: string,
    userId: string,
    selectedChoiceId: string
  ): Promise<{
    attempt_id: string;
    is_correct: boolean;
    selected_choice: MCQChoice;
    correct_choice: MCQChoice;
  }> {
    // Get MCQ with choices
    const mcq = await this.getMCQById(mcqId);
    if (!mcq) {
      throw new Error("MCQ not found");
    }

    // Find selected choice
    const selectedChoice = mcq.choices.find(
      (choice) => choice.id === selectedChoiceId
    );
    if (!selectedChoice) {
      throw new Error("Selected choice not found");
    }

    // Find correct choice
    const correctChoice = mcq.choices.find(
      (choice) =>
        choice.is_correct === 1 ||
        choice.is_correct === "true" ||
        choice.is_correct === true
    );
    if (!correctChoice) {
      throw new Error("No correct choice found for MCQ");
    }

    const isCorrect =
      selectedChoice.is_correct === 1 ||
      selectedChoice.is_correct === "true" ||
      selectedChoice.is_correct === true;
    const attemptId = generateId();
    const now = new Date().toISOString();

    // Record attempt
    await executeMutation(
      this.db,
      `INSERT INTO mcq_attempts (id, mcq_id, user_id, selected_choice_id, is_correct, attempted_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      attemptId,
      mcqId,
      userId,
      selectedChoiceId,
      isCorrect,
      now
    );

    return {
      attempt_id: attemptId,
      is_correct: isCorrect,
      selected_choice: selectedChoice,
      correct_choice: correctChoice,
    };
  }

  /**
   * Get user's attempts for an MCQ
   */
  async getUserAttempts(mcqId: string, userId: string): Promise<MCQAttempt[]> {
    return await executeQuery<MCQAttempt>(
      this.db,
      `SELECT * FROM mcq_attempts 
       WHERE mcq_id = ? AND user_id = ? 
       ORDER BY attempted_at DESC`,
      mcqId,
      userId
    );
  }

  /**
   * Check if user owns an MCQ
   */
  async userOwnsMCQ(mcqId: string, userId: string): Promise<boolean> {
    const mcq = await executeQueryFirst<MCQ>(
      this.db,
      "SELECT id FROM mcqs WHERE id = ? AND created_by = ?",
      mcqId,
      userId
    );
    return !!mcq;
  }

  /**
   * Get MCQ statistics
   */
  async getMCQStats(mcqId: string): Promise<{
    total_attempts: number;
    correct_attempts: number;
    accuracy_percentage: number;
  }> {
    const stats = await executeQueryFirst<{
      total_attempts: number;
      correct_attempts: number;
    }>(
      this.db,
      `SELECT 
         COUNT(*) as total_attempts,
         SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as correct_attempts
       FROM mcq_attempts 
       WHERE mcq_id = ?`,
      mcqId
    );

    const total = stats?.total_attempts || 0;
    const correct = stats?.correct_attempts || 0;
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

    return {
      total_attempts: total,
      correct_attempts: correct,
      accuracy_percentage: accuracy,
    };
  }
}
