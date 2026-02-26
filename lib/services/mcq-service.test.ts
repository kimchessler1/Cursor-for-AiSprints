/**
 * MCQ Service Unit Tests
 * Tests for MCQ CRUD operations and business logic
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { MCQService, CreateMCQData } from "./mcq-service";
import { D1Database } from "@/lib/d1-client";

// Mock the D1 client functions
vi.mock("@/lib/d1-client", () => ({
  executeQuery: vi.fn(),
  executeQueryFirst: vi.fn(),
  executeMutation: vi.fn(),
  executeBatch: vi.fn(),
  generateId: vi.fn(() => "mock-id-123"),
  getDatabase: vi.fn(),
}));

import {
  executeQuery,
  executeQueryFirst,
  executeMutation,
  generateId,
} from "@/lib/d1-client";

describe("MCQService", () => {
  let mcqService: MCQService;
  let mockDb: D1Database;

  beforeEach(() => {
    vi.clearAllMocks();

    // Create mock database
    mockDb = {
      prepare: vi.fn(),
      exec: vi.fn(),
      batch: vi.fn(),
    } as unknown as D1Database;

    mcqService = new MCQService(mockDb);
  });

  describe("createMCQ", () => {
    const validMCQData: CreateMCQData = {
      title: "Test Question",
      description: "Test Description",
      question: "What is the capital of France?",
      choices: [
        {
          choice_text: "Paris",
          is_correct: true,
          order_index: 0,
        },
        {
          choice_text: "London",
          is_correct: false,
          order_index: 1,
        },
      ],
    };

    const userId = "test-user-id";

    it("should create MCQ with proper boolean conversion", async () => {
      // Mock successful MCQ creation
      const mockMCQ = {
        id: "mock-mcq-id",
        title: validMCQData.title,
        description: validMCQData.description,
        question: validMCQData.question,
        created_by: userId,
        created_at: "2025-01-01T00:00:00Z",
        updated_at: "2025-01-01T00:00:00Z",
      };

      const mockChoices = [
        {
          id: "choice-1",
          mcq_id: "mock-mcq-id",
          choice_text: "Paris",
          is_correct: 1, // Integer for SQLite
          order_index: 0,
          created_at: "2025-01-01T00:00:00Z",
        },
        {
          id: "choice-2",
          mcq_id: "mock-mcq-id",
          choice_text: "London",
          is_correct: 0, // Integer for SQLite
          order_index: 1,
          created_at: "2025-01-01T00:00:00Z",
        },
      ];

      // Mock the MCQ creation mutation
      vi.mocked(executeMutation).mockResolvedValue({
        success: true,
        meta: { changes: 1, last_row_id: 0, duration: 1 },
      });

      // Mock the MCQ retrieval after creation
      vi.mocked(executeQueryFirst).mockResolvedValue(mockMCQ);
      vi.mocked(executeQuery).mockResolvedValue(mockChoices);

      // Mock generateId to return predictable IDs
      vi.mocked(generateId)
        .mockReturnValueOnce("mock-mcq-id")
        .mockReturnValueOnce("choice-1")
        .mockReturnValueOnce("choice-2");

      const result = await mcqService.createMCQ(validMCQData, userId);

      // Verify MCQ creation was called
      expect(executeMutation).toHaveBeenCalledWith(
        mockDb,
        `INSERT INTO mcqs (id, title, description, question, created_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
        "mock-mcq-id",
        validMCQData.title,
        validMCQData.description,
        validMCQData.question,
        userId,
        expect.any(String), // created_at
        expect.any(String) // updated_at
      );

      // Verify choice creation with boolean conversion
      expect(executeMutation).toHaveBeenCalledWith(
        mockDb,
        `INSERT INTO mcq_choices (id, mcq_id, choice_text, is_correct, order_index, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        "choice-1",
        "mock-mcq-id",
        "Paris",
        1, // Converted boolean to integer
        0,
        expect.any(String)
      );

      expect(executeMutation).toHaveBeenCalledWith(
        mockDb,
        `INSERT INTO mcq_choices (id, mcq_id, choice_text, is_correct, order_index, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        "choice-2",
        "mock-mcq-id",
        "London",
        0, // Converted boolean to integer
        1,
        expect.any(String)
      );

      // Verify the result
      expect(result).toEqual({
        ...mockMCQ,
        choices: [
          {
            ...mockChoices[0],
            is_correct: true, // Normalized back to boolean
          },
          {
            ...mockChoices[1],
            is_correct: false, // Normalized back to boolean
          },
        ],
      });
    });

    it("should throw error for too few choices", async () => {
      const invalidData = {
        ...validMCQData,
        choices: [
          {
            choice_text: "Only one choice",
            is_correct: true,
            order_index: 0,
          },
        ],
      };

      await expect(mcqService.createMCQ(invalidData, userId)).rejects.toThrow(
        "MCQ must have between 2 and 6 choices"
      );
    });

    it("should throw error for too many choices", async () => {
      const invalidData = {
        ...validMCQData,
        choices: Array.from({ length: 7 }, (_, i) => ({
          choice_text: `Choice ${i + 1}`,
          is_correct: i === 0,
          order_index: i,
        })),
      };

      await expect(mcqService.createMCQ(invalidData, userId)).rejects.toThrow(
        "MCQ must have between 2 and 6 choices"
      );
    });

    it("should throw error for no correct choice", async () => {
      const invalidData = {
        ...validMCQData,
        choices: [
          {
            choice_text: "Wrong answer 1",
            is_correct: false,
            order_index: 0,
          },
          {
            choice_text: "Wrong answer 2",
            is_correct: false,
            order_index: 1,
          },
        ],
      };

      await expect(mcqService.createMCQ(invalidData, userId)).rejects.toThrow(
        "MCQ must have exactly one correct choice"
      );
    });

    it("should throw error for multiple correct choices", async () => {
      const invalidData = {
        ...validMCQData,
        choices: [
          {
            choice_text: "Correct answer 1",
            is_correct: true,
            order_index: 0,
          },
          {
            choice_text: "Correct answer 2",
            is_correct: true,
            order_index: 1,
          },
        ],
      };

      await expect(mcqService.createMCQ(invalidData, userId)).rejects.toThrow(
        "MCQ must have exactly one correct choice"
      );
    });

    it("should handle database errors during MCQ creation", async () => {
      vi.mocked(executeMutation).mockRejectedValue(
        new Error("Database connection failed")
      );

      await expect(mcqService.createMCQ(validMCQData, userId)).rejects.toThrow(
        "Database connection failed"
      );
    });

    it("should handle database errors during choice creation", async () => {
      // Mock successful MCQ creation
      vi.mocked(executeMutation)
        .mockResolvedValueOnce({
          success: true,
          meta: { changes: 1, last_row_id: 0, duration: 1 },
        })
        .mockRejectedValueOnce(new Error("Choice creation failed"));

      vi.mocked(generateId)
        .mockReturnValueOnce("mock-mcq-id")
        .mockReturnValueOnce("choice-1");

      await expect(mcqService.createMCQ(validMCQData, userId)).rejects.toThrow(
        "Choice creation failed"
      );
    });
  });
});
