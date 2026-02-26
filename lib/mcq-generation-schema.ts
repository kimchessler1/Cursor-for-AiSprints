import { z } from "zod";

/**
 * Zod Schema for TEKS MCQ Generation Request
 * Defines the structure for the request sent to the AI generation endpoint
 */
export const TeksGenerationRequestSchema = z.object({
  subject: z.string().min(1, "Subject is required"),
  grade_level: z.string().min(1, "Grade level is required"),
  strand_name: z.string().min(1, "Strand is required"),
  standard_code: z.string().min(1, "Standard code is required"),
  standard_description: z.string().min(1, "Standard description is required"),
  topic_specifics: z.string().min(1, "Topic specifics are required"),
});

/**
 * Zod Schema for AI-Generated MCQ Response
 * Defines the structure for the AI-generated MCQ content
 */
export const MCQGenerationSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title must be 200 characters or less")
    .describe("A concise, descriptive title for the MCQ"),
  description: z
    .string()
    .max(500, "Description must be 500 characters or less")
    .describe("A brief description of the learning objective"),
  question: z
    .string()
    .min(20, "Question must be at least 20 characters")
    .max(1000, "Question must be 1000 characters or less")
    .describe("The main question text that tests the TEKS standard"),
  choices: z
    .array(
      z.object({
        choice_text: z
          .string()
          .min(1, "Choice text is required")
          .describe("The text for this answer choice"),
        is_correct: z
          .boolean()
          .describe("Whether this choice is the correct answer"),
        order_index: z
          .number()
          .int()
          .min(0)
          .max(3)
          .describe("The order of this choice (0-based index)"),
      })
    )
    .length(4, "Exactly 4 choices are required")
    .refine(
      (choices) => choices.filter((c) => c.is_correct).length === 1,
      "Exactly one choice must be marked as correct"
    )
    .describe("Exactly 4 answer choices with one marked as correct"),
});

/**
 * TypeScript types inferred from Zod schemas
 */
export type TeksGenerationRequest = z.infer<typeof TeksGenerationRequestSchema>;
export type MCQGeneration = z.infer<typeof MCQGenerationSchema>;

/**
 * System prompt for AI generation
 */
export const SYSTEM_PROMPT = `You are an expert educational content creator specializing in TEKS-aligned assessments. Your expertise includes:

1. Creating age-appropriate questions that accurately test TEKS standards
2. Developing plausible distractors that help identify misconceptions
3. Using real-world contexts that engage students
4. Ensuring questions are clear, unambiguous, and educationally valuable

You must generate high-quality multiple choice questions that:
- Directly assess the specified TEKS standard
- Use appropriate difficulty for the grade level
- Include engaging, real-world contexts when possible
- Have exactly 4 answer choices with one clearly correct answer
- Include distractors that are plausible but clearly incorrect
- Use age-appropriate language and concepts

Focus on creating questions that help teachers assess student understanding of the specific TEKS standard.`;

/**
 * Prompt template for AI generation
 */
export const generateTeksPrompt = (data: TeksGenerationRequest): string => {
  return `Generate a multiple choice question for the following TEKS standard:

**TEKS Standard Information:**
- Subject: ${data.subject}
- Grade Level: ${data.grade_level}
- Strand: ${data.strand_name}
- Standard Code: ${data.standard_code}
- Standard Description: ${data.standard_description}
- Topic/Specifics: ${data.topic_specifics}

**Requirements:**
- Create a question that directly tests the TEKS standard: "${data.standard_description}"
- Make it appropriate for ${data.grade_level} students
- Focus on the specific topic: ${data.topic_specifics}
- Include exactly 4 answer choices
- Mark exactly one choice as correct
- Use engaging, real-world context when appropriate
- Ensure distractors are plausible but clearly incorrect

**Question Guidelines:**
- Use clear, age-appropriate language
- Avoid trick questions or ambiguous wording
- Include relevant context or scenarios
- Make the question educationally valuable
- Ensure the correct answer tests the specific TEKS standard

Generate a question that would help a teacher assess whether ${data.grade_level} students understand the concept described in "${data.standard_description}" within the context of ${data.topic_specifics}.`;
};

/**
 * Validation helper functions
 */
export const validateTeksRequest = (data: TeksGenerationRequest): string[] => {
  const errors: string[] = [];

  if (!data.subject || data.subject.trim() === "") {
    errors.push("Subject is required");
  }

  if (!data.grade_level || data.grade_level.trim() === "") {
    errors.push("Grade level is required");
  }

  if (!data.strand_name || data.strand_name.trim() === "") {
    errors.push("Strand is required");
  }

  if (!data.standard_code || data.standard_code.trim() === "") {
    errors.push("Standard code is required");
  }

  if (!data.standard_description || data.standard_description.trim() === "") {
    errors.push("Standard description is required");
  }

  if (!data.topic_specifics || data.topic_specifics.trim() === "") {
    errors.push("Topic specifics are required");
  }

  return errors;
};

export const validateGeneratedMCQ = (mcq: MCQGeneration): string[] => {
  const errors: string[] = [];

  if (!mcq.title || mcq.title.trim() === "") {
    errors.push("Title is required");
  } else if (mcq.title.length > 200) {
    errors.push("Title must be 200 characters or less");
  }

  if (mcq.description && mcq.description.length > 500) {
    errors.push("Description must be 500 characters or less");
  }

  if (!mcq.question || mcq.question.trim() === "") {
    errors.push("Question is required");
  } else if (mcq.question.length < 20) {
    errors.push("Question must be at least 20 characters");
  } else if (mcq.question.length > 1000) {
    errors.push("Question must be 1000 characters or less");
  }

  if (!mcq.choices || mcq.choices.length !== 4) {
    errors.push("Exactly 4 choices are required");
  } else {
    const correctChoices = mcq.choices.filter((c) => c.is_correct);
    if (correctChoices.length !== 1) {
      errors.push("Exactly one choice must be marked as correct");
    }

    mcq.choices.forEach((choice, index) => {
      if (!choice.choice_text || choice.choice_text.trim() === "") {
        errors.push(`Choice ${index + 1} text is required`);
      }
      if (choice.order_index !== index) {
        errors.push(`Choice ${index + 1} order index must be ${index}`);
      }
    });
  }

  return errors;
};
