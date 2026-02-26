import { z } from "zod";

/**
 * Zod Schemas for TEKS Data Structure
 */
export const StandardSchema = z.object({
  code: z.string(),
  description: z.string(),
});

export const StrandSchema = z.object({
  strand_name: z.string(),
  code_prefix: z.string(),
  standards: z.array(StandardSchema),
});

export const GradeSchema = z.object({
  grade_level: z.string(),
  strands: z.array(StrandSchema),
});

export const SubjectSchema = z.object({
  subject: z.string(),
  grades: z.array(GradeSchema),
});

export const TeksDataSchema = z.object({
  subjects: z.array(SubjectSchema),
});

/**
 * Inferred TypeScript types from Zod schemas
 */
export type Standard = z.infer<typeof StandardSchema>;
export type Strand = z.infer<typeof StrandSchema>;
export type Grade = z.infer<typeof GradeSchema>;
export type Subject = z.infer<typeof SubjectSchema>;
export type TeksData = z.infer<typeof TeksDataSchema>;

/**
 * Sample TEKS data for populating dropdown menus.
 * This is a hierarchical structure representing subjects, grades, strands, and standards.
 */
export const TEKS_DATA = {
  subjects: [
    {
      subject: "Mathematics",
      grades: [
        {
          grade_level: "Grade 3",
          strands: [
            {
              strand_name: "Number and operations",
              code_prefix: "TEKS.MA.3.2",
              standards: [
                {
                  code: "TEKS.MA.3.2.A",
                  description:
                    "Compose and decompose numbers up to 100,000 as a sum of so many ten thousands, so many thousands, so many hundreds, so many tens, and so many ones.",
                },
                {
                  code: "TEKS.MA.3.2.B",
                  description:
                    "Describe the mathematical relationships found in the base-10 place value system through the hundred thousands place.",
                },
                {
                  code: "TEKS.MA.3.2.C",
                  description:
                    "Represent a number on a number line as being between two consecutive multiples of 10; 100; 1,000; or 10,000.",
                },
              ],
            },
            {
              strand_name: "Algebraic reasoning",
              code_prefix: "TEKS.MA.3.5",
              standards: [
                {
                  code: "TEKS.MA.3.5.A",
                  description:
                    "Represent one- and two-step problems involving addition and subtraction of whole numbers to 1,000 using pictorial models, number lines, and equations.",
                },
                {
                  code: "TEKS.MA.3.5.B",
                  description:
                    "Represent and solve one- and two-step multiplication and division problems within 100 using arrays, strip diagrams, and equations.",
                },
                {
                  code: "TEKS.MA.3.5.C",
                  description:
                    "Represent real-world relationships using number pairs in a table and verbal descriptions.",
                },
              ],
            },
            {
              strand_name: "Geometry and measurement",
              code_prefix: "TEKS.MA.3.6",
              standards: [
                {
                  code: "TEKS.MA.3.6.A",
                  description:
                    "Classify and sort two- and three-dimensional figures, including cones, cylinders, spheres, triangular and rectangular prisms, and cubes, based on attributes.",
                },
                {
                  code: "TEKS.MA.3.6.B",
                  description:
                    "Use attributes to recognize rhombuses, parallelograms, trapezoids, rectangles, and squares as examples of quadrilaterals.",
                },
                {
                  code: "TEKS.MA.3.6.C",
                  description:
                    "Determine the area of rectangles with whole number side lengths in problems using multiplication related to the number of rows times the number of unit squares.",
                },
              ],
            },
          ],
        },
        {
          grade_level: "Grade 4",
          strands: [
            {
              strand_name: "Number and operations",
              code_prefix: "TEKS.MA.4.2",
              standards: [
                {
                  code: "TEKS.MA.4.2.A",
                  description:
                    "Interpret the value of each place-value position as 10 times the position to the right and as one-tenth the value of the place to its left.",
                },
                {
                  code: "TEKS.MA.4.2.B",
                  description:
                    "Represent the value of the digit in whole numbers through 1,000,000,000 and decimals to the hundredths using expanded notation and numerals.",
                },
                {
                  code: "TEKS.MA.4.2.C",
                  description:
                    "Compare and order whole numbers to 1,000,000,000 and represent comparisons using >, <, or =.",
                },
              ],
            },
            {
              strand_name: "Algebraic reasoning",
              code_prefix: "TEKS.MA.4.5",
              standards: [
                {
                  code: "TEKS.MA.4.5.A",
                  description:
                    "Represent multi-step problems involving the four operations with whole numbers using strip diagrams and equations with a letter standing for the unknown quantity.",
                },
                {
                  code: "TEKS.MA.4.5.B",
                  description:
                    "Represent problems using an input-output table and numerical expressions to generate a number pattern that follows a given rule.",
                },
                {
                  code: "TEKS.MA.4.5.C",
                  description:
                    "Use models to determine the formulas for the perimeter of a rectangle (l + w + l + w or 2l + 2w), including the special form for perimeter of a square (4s).",
                },
              ],
            },
            {
              strand_name: "Data analysis",
              code_prefix: "TEKS.MA.4.9",
              standards: [
                {
                  code: "TEKS.MA.4.9.A",
                  description:
                    "Represent data on a frequency table, dot plot, or stem-and-leaf plot marked with whole numbers and fractions.",
                },
                {
                  code: "TEKS.MA.4.9.B",
                  description:
                    "Solve one- and two-step problems using data in whole number, decimal, and fraction form in a frequency table, dot plot, or stem-and-leaf plot.",
                },
                {
                  code: "TEKS.MA.4.9.C",
                  description:
                    "Determine the corresponding decimal to the tenths or hundredths place of a specified point on a number line.",
                },
              ],
            },
          ],
        },
      ],
    },
    {
      subject: "Science",
      grades: [
        {
          grade_level: "Grade 5",
          strands: [
            {
              strand_name: "Scientific investigation and reasoning",
              code_prefix: "TEKS.SCI.5.2",
              standards: [
                {
                  code: "TEKS.SCI.5.2.A",
                  description:
                    "Describe, plan, and implement simple experimental investigations testing one variable.",
                },
                {
                  code: "TEKS.SCI.5.2.B",
                  description:
                    "Ask well-defined questions, formulate testable hypotheses, and select and use appropriate equipment and technology.",
                },
                {
                  code: "TEKS.SCI.5.2.C",
                  description:
                    "Collect and record information using detailed observations and accurate measurements.",
                },
              ],
            },
            {
              strand_name: "Physical science",
              code_prefix: "TEKS.SCI.5.5",
              standards: [
                {
                  code: "TEKS.SCI.5.5.A",
                  description:
                    "Classify matter based on measurable, testable, and observable physical properties, including mass, magnetism, physical state (solid, liquid, and gas), relative density (sinking and floating), solubility in water, and the ability to conduct or insulate thermal or electrical energy.",
                },
                {
                  code: "TEKS.SCI.5.5.B",
                  description:
                    "Identify the boiling and freezing/melting points of water on the Celsius scale.",
                },
                {
                  code: "TEKS.SCI.5.5.C",
                  description:
                    "Demonstrate that some mixtures maintain physical properties of their ingredients such as iron filings and sand or sand and water.",
                },
              ],
            },
            {
              strand_name: "Earth and space",
              code_prefix: "TEKS.SCI.5.8",
              standards: [
                {
                  code: "TEKS.SCI.5.8.A",
                  description: "Differentiate between weather and climate.",
                },
                {
                  code: "TEKS.SCI.5.8.B",
                  description:
                    "Explain how the Sun and the ocean interact in the water cycle.",
                },
                {
                  code: "TEKS.SCI.5.8.C",
                  description:
                    "Demonstrate that the Earth rotates on its axis once approximately every 24 hours causing the day/night cycle and the apparent movement of the Sun across the sky.",
                },
              ],
            },
          ],
        },
        {
          grade_level: "Grade 6",
          strands: [
            {
              strand_name: "Scientific investigation and reasoning",
              code_prefix: "TEKS.SCI.6.2",
              standards: [
                {
                  code: "TEKS.SCI.6.2.A",
                  description:
                    "Design and implement experimental investigations testing one variable.",
                },
                {
                  code: "TEKS.SCI.6.2.B",
                  description:
                    "Formulate testable hypotheses based on observations and prior knowledge.",
                },
                {
                  code: "TEKS.SCI.6.2.C",
                  description:
                    "Use appropriate tools to collect, record, and analyze information, including journals/notebooks, beakers, Petri dishes, meter sticks, graduated cylinders, and balances.",
                },
              ],
            },
            {
              strand_name: "Life science",
              code_prefix: "TEKS.SCI.6.12",
              standards: [
                {
                  code: "TEKS.SCI.6.12.A",
                  description:
                    "Understand that all organisms are composed of one or more cells.",
                },
                {
                  code: "TEKS.SCI.6.12.B",
                  description:
                    "Recognize that the presence of a nucleus determines whether a cell is prokaryotic or eukaryotic.",
                },
                {
                  code: "TEKS.SCI.6.12.C",
                  description:
                    "Identify the main functions of the cell membrane, nucleus, and cytoplasm.",
                },
              ],
            },
            {
              strand_name: "Earth and space",
              code_prefix: "TEKS.SCI.6.11",
              standards: [
                {
                  code: "TEKS.SCI.6.11.A",
                  description:
                    "Describe the physical properties, locations, and movements of the Sun, planets, moons, meteors, asteroids, and comets.",
                },
                {
                  code: "TEKS.SCI.6.11.B",
                  description:
                    "Understand that gravity is the force that governs the motion of our solar system.",
                },
                {
                  code: "TEKS.SCI.6.11.C",
                  description:
                    "Describe the history and future of space exploration, including the types of equipment and transportation needed for space travel.",
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};
