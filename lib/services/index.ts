/**
 * Services Index
 * Central export for all database services
 */

export { UserService } from "./user-service";
export type { User, CreateUserData, UpdateUserData } from "./user-service";

export { MCQService } from "./mcq-service";
export type {
  MCQ,
  MCQChoice,
  MCQAttempt,
  CreateMCQData,
  UpdateMCQData,
  MCQWithChoices,
  PaginationParams,
  PaginatedMCQs,
} from "./mcq-service";
