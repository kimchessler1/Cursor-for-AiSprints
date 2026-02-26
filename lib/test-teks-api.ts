/**
 * Test script for TEKS MCQ generation API
 * This script tests the API endpoint with sample TEKS data
 */

import { MCQGeneration } from "./mcq-generation-schema";

const SAMPLE_TEKS_DATA = {
  subject: "Mathematics",
  grade_level: "Grade 3",
  strand_name: "Number and operations",
  standard_code: "TEKS.MA.3.2.A",
  standard_description:
    "Compose and decompose numbers up to 100,000 as a sum of so many ten thousands, so many thousands, so many hundreds, so many tens, and so many ones.",
  topic_specifics: "Place value understanding and number composition",
};

async function testTeksGeneration() {
  try {
    console.log("Testing TEKS MCQ generation API...");
    console.log("Sample data:", SAMPLE_TEKS_DATA);

    const response = await fetch("/api/mcqs/generate-teks", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(SAMPLE_TEKS_DATA),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("API Error:", response.status, errorData);
      return;
    }

    const generatedMCQ = (await response.json()) as MCQGeneration;
    console.log("✅ Successfully generated MCQ:");
    console.log("Title:", generatedMCQ.title);
    console.log("Description:", generatedMCQ.description);
    console.log("Question:", generatedMCQ.question);
    console.log("Choices:");
    generatedMCQ.choices.forEach((choice, index) => {
      console.log(
        `  ${index + 1}. ${choice.choice_text} ${
          choice.is_correct ? "(CORRECT)" : ""
        }`
      );
    });
  } catch (error) {
    console.error("Test failed:", error);
  }
}

// Export for use in browser console or testing
if (typeof window !== "undefined") {
  (window as unknown as Record<string, unknown>).testTeksGeneration =
    testTeksGeneration;
}

export { testTeksGeneration, SAMPLE_TEKS_DATA };
