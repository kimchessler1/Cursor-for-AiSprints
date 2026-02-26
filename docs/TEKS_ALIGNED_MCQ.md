# TEKS-Aligned MCQ Generation - Technical PRD

## Overview

This document outlines the requirements for implementing AI-powered TEKS (Texas Essential Knowledge and Skills) aligned MCQ generation in QuizMaker. The feature will allow teachers to generate multiple choice questions based on specific TEKS standards using OpenAI's language models.

## Business Requirements

### Core Functionality

- Teachers can generate MCQs aligned to specific TEKS standards
- AI generates questions, choices, and identifies correct answers
- Generated MCQs integrate seamlessly with existing MCQ creation workflow
- Support for Mathematics and Science subjects (Grades 3-6)
- Hierarchical selection: Subject → Grade → Strand → Standard

### User Experience

- Generate button on MCQ create form (top right)
- Modal dialog with cascading dropdowns for TEKS selection
- Topic/specifics text input for context
- Loading states and error handling
- Preview generated MCQ before saving

## Technical Requirements

### Frontend Components

#### TEKS Generation Dialog Component

**File**: `components/teks-generation-dialog.tsx`

**Features**:

- Modal dialog using shadcn/ui Dialog component
- Four cascading dropdowns (Subject → Grade → Strand → Standard)
- Topic/specifics text input
- Generate and Cancel buttons
- Loading spinner during generation
- Error handling and user feedback

**Dropdown Structure**:

```typescript
// Subject dropdown
["Mathematics", "Science"]

// Grade dropdown (filtered by subject)
["Grade 3", "Grade 4", "Grade 5", "Grade 6"]

// Strand dropdown (filtered by grade)
["Number and operations", "Algebraic reasoning", "Geometry and measurement", ...]

// Standard dropdown (filtered by strand)
["TEKS.MA.3.2.A", "TEKS.MA.3.2.B", "TEKS.MA.3.2.C", ...]
```

#### MCQ Create Form Integration

**File**: `app/mcqs/create/page.tsx`

**Integration**:

- Add "Generate with TEKS" button (top right)
- Handle generated MCQ data population
- Maintain existing manual creation workflow

### Backend API

#### TEKS MCQ Generation Endpoint

**File**: `app/api/mcqs/generate-teks/route.ts`

**Request Body**:

```typescript
{
  subject: string;
  grade_level: string;
  strand_name: string;
  standard_code: string;
  standard_description: string;
  topic_specifics: string;
}
```

**Response**:

```typescript
{
  title: string;
  description: string;
  question: string;
  choices: {
    choice_text: string;
    is_correct: boolean;
    order_index: number;
  }
  [];
}
```

### AI Schema Definition

#### MCQ Generation Schema

**File**: `lib/mcq-generation-schema.ts`

```typescript
import { z } from "zod";

export const MCQGenerationSchema = z.object({
  title: z
    .string()
    .describe("A concise, descriptive title for the MCQ (max 200 characters)"),
  description: z
    .string()
    .describe(
      "A brief description of the learning objective (max 500 characters)"
    ),
  question: z
    .string()
    .describe(
      "The main question text that tests the TEKS standard (max 1000 characters)"
    ),
  choices: z
    .array(
      z.object({
        choice_text: z.string().describe("The text for this answer choice"),
        is_correct: z
          .boolean()
          .describe("Whether this choice is the correct answer"),
        order_index: z
          .number()
          .describe("The order of this choice (0-based index)"),
      })
    )
    .length(4)
    .describe("Exactly 4 answer choices with one marked as correct"),
});

export type MCQGeneration = z.infer<typeof MCQGenerationSchema>;
```

### Data Integration

#### TEKS Data Usage

**File**: `lib/teks.ts` (existing)

**Integration**:

- Import TEKS_DATA for dropdown population
- Use existing Zod schemas for type safety
- Filter data based on user selections

## Implementation Phases

### Phase 1: Dependencies and Setup

**Objective**: Install required packages and set up AI SDK integration

**Tasks**:

1. Install AI SDK packages
2. Verify environment variables
3. Create MCQ generation schema
4. Set up API route structure

**Commands**:

```bash
npm install ai @ai-sdk/react @ai-sdk/openai zod
```

**Environment Variables**:

- `OPENAI_API_KEY` ✅ (already configured)
- `OPENAI_MODEL` ✅ (already configured)

**Step-by-Step Implementation Plan**:

**Step 1.1: Install Dependencies**

```bash
cd /Users/pnayak/dev/src/elves/quizmaker/quizmaker-app
npm install ai @ai-sdk/react @ai-sdk/openai zod
```

**Step 1.2: Verify Environment Variables**

- Confirm `OPENAI_API_KEY` is set in `.dev.vars`
- Confirm `OPENAI_MODEL` is set to `openai/gpt-4.1-nano`
- Test API key validity

**Step 1.3: Create MCQ Generation Schema**

- Create `lib/mcq-generation-schema.ts`
- Define Zod schema for AI response structure
- Export TypeScript types

**Step 1.4: Set Up API Route Structure**

- Create `app/api/mcqs/generate-teks/route.ts`
- Set up basic POST handler structure
- Add error handling framework

### Phase 2: Backend API Implementation

**Objective**: Create AI-powered MCQ generation endpoint

**Step-by-Step Implementation Plan**:

**Step 2.1: Implement MCQ Generation Schema**

- Create `lib/mcq-generation-schema.ts` with detailed Zod schema
- Define prompt templates for AI generation
- Add validation rules for generated content

**Step 2.2: Create API Route Handler**

- Implement `app/api/mcqs/generate-teks/route.ts`
- Add request validation using Zod
- Integrate OpenAI API with structured output
- Add comprehensive error handling

**Step 2.3: Test API Endpoint**

- Test with sample TEKS data
- Verify structured output format
- Test error scenarios
- Validate response quality

**Key Implementation Details**:

**API Route Structure**:

```typescript
// app/api/mcqs/generate-teks/route.ts
export async function POST(request: NextRequest) {
  try {
    // 1. Validate request body
    const body = await request.json();
    const validatedData = TeksGenerationRequestSchema.parse(body);

    // 2. Generate structured prompt
    const prompt = generateTeksPrompt(validatedData);

    // 3. Call OpenAI with structured output
    const { object } = await generateObject({
      model: openai(process.env.OPENAI_MODEL),
      schema: MCQGenerationSchema,
      prompt: prompt,
    });

    // 4. Return generated MCQ
    return NextResponse.json(object);
  } catch (error) {
    // Error handling
  }
}
```

**Prompt Engineering**:

```typescript
const generateTeksPrompt = (data: TeksGenerationRequest) => `
Generate a multiple choice question for:
Subject: ${data.subject}
Grade Level: ${data.grade_level}
Strand: ${data.strand_name}
Standard: ${data.standard_code}
Standard Description: ${data.standard_description}
Topic/Specifics: ${data.topic_specifics}

Requirements:
- Question must directly assess the TEKS standard
- Include exactly 4 answer choices
- Only one correct answer
- Use age-appropriate language for ${data.grade_level}
- Include real-world context when appropriate
`;
```

### Phase 3: Frontend Dialog Component

**Objective**: Build TEKS selection dialog with cascading dropdowns

**Step-by-Step Implementation Plan**:

**Step 3.1: Create Dialog Component Structure**

- Create `components/teks-generation-dialog.tsx`
- Set up shadcn/ui Dialog component
- Add form state management with React hooks
- Implement basic layout and styling

**Step 3.2: Implement Cascading Dropdowns**

- Add Subject dropdown (Mathematics, Science)
- Add Grade dropdown (filtered by subject)
- Add Strand dropdown (filtered by grade)
- Add Standard dropdown (filtered by strand)
- Implement filtering logic using TEKS_DATA

**Step 3.3: Add Form Validation**

- Add topic/specifics text input
- Implement Zod validation schema
- Add form submission handling
- Add error display and user feedback

**Step 3.4: Integrate API Calls**

- Add API call to generate-teks endpoint
- Implement loading states
- Add error handling for API failures
- Handle successful response data

**Key Implementation Details**:

**Dialog Component Structure**:

```typescript
// components/teks-generation-dialog.tsx
export function TeksGenerationDialog({
  open,
  onOpenChange,
  onGenerate,
}: TeksGenerationDialogProps) {
  const [formData, setFormData] = useState({
    subject: "",
    grade_level: "",
    strand_name: "",
    standard_code: "",
    topic_specifics: "",
  });

  const [filteredData, setFilteredData] = useState({
    grades: [],
    strands: [],
    standards: [],
  });

  // Cascading dropdown logic
  // Form validation
  // API integration
}
```

**Cascading Dropdown Logic**:

```typescript
// Filter grades based on selected subject
const filteredGrades =
  TEKS_DATA.subjects.find((s) => s.subject === formData.subject)?.grades || [];

// Filter strands based on selected grade
const filteredStrands =
  filteredGrades.find((g) => g.grade_level === formData.grade_level)?.strands ||
  [];

// Filter standards based on selected strand
const filteredStandards =
  filteredStrands.find((s) => s.strand_name === formData.strand_name)
    ?.standards || [];
```

### Phase 4: Integration and Testing

**Objective**: Integrate dialog with MCQ create form and test end-to-end

**Step-by-Step Implementation Plan**:

**Step 4.1: Integrate with MCQ Create Form**

- Add "Generate with TEKS" button to `app/mcqs/create/page.tsx`
- Implement dialog state management
- Handle generated MCQ data population
- Maintain existing manual creation workflow

**Step 4.2: Test End-to-End Workflow**

- Test TEKS selection and generation
- Verify generated MCQ quality
- Test error scenarios
- Validate form integration

**Step 4.3: Add Quality Assurance**

- Review generated content quality
- Add content validation rules
- Implement user feedback mechanisms
- Add fallback options

**Key Implementation Details**:

**MCQ Create Form Integration**:

```typescript
// app/mcqs/create/page.tsx
export default function CreateMCQPage() {
  const [showTeksDialog, setShowTeksDialog] = useState(false);
  const [generatedMCQ, setGeneratedMCQ] = useState(null);

  const handleTeksGenerate = (mcqData: MCQGeneration) => {
    // Populate form with generated data
    setGeneratedMCQ(mcqData);
    setShowTeksDialog(false);
  };

  return (
    <div>
      {/* Existing form */}
      <MCQForm initialData={generatedMCQ} isEditing={false} />

      {/* TEKS Generation Button */}
      <Button onClick={() => setShowTeksDialog(true)} variant="outline">
        Generate with TEKS
      </Button>

      {/* TEKS Dialog */}
      <TeksGenerationDialog
        open={showTeksDialog}
        onOpenChange={setShowTeksDialog}
        onGenerate={handleTeksGenerate}
      />
    </div>
  );
}
```

**Quality Validation**:

```typescript
const validateGeneratedMCQ = (mcq: MCQGeneration): boolean => {
  // Check question quality
  if (mcq.question.length < 20) return false;

  // Check choices quality
  const hasCorrectChoice = mcq.choices.some((c) => c.is_correct);
  if (!hasCorrectChoice) return false;

  // Check choice text quality
  const hasEmptyChoices = mcq.choices.some((c) => c.choice_text.trim() === "");
  if (hasEmptyChoices) return false;

  return true;
};
```

## Technical Specifications

### AI Prompt Engineering

**System Prompt**:

```
You are an expert educational content creator specializing in TEKS-aligned assessments.
Generate high-quality multiple choice questions that accurately test the specified TEKS standard.

Requirements:
- Question must directly assess the TEKS standard
- Include exactly 4 answer choices
- Only one correct answer
- Distractors should be plausible but clearly incorrect
- Use age-appropriate language for the grade level
- Include real-world context when appropriate
```

**User Prompt Template**:

```
Generate a multiple choice question for:
Subject: {subject}
Grade Level: {grade_level}
Strand: {strand_name}
Standard: {standard_code}
Standard Description: {standard_description}
Topic/Specifics: {topic_specifics}

Create a question that directly tests this standard with appropriate difficulty for {grade_level}.
```

### Error Handling

**API Errors**:

- OpenAI API failures
- Invalid TEKS selection
- Schema validation errors
- Network timeouts

**Frontend Errors**:

- Invalid form data
- API call failures
- Network connectivity issues
- Empty or invalid responses

### Performance Considerations

**API Optimization**:

- Structured output for faster processing
- Appropriate model selection (GPT-4o for quality)
- Request timeout handling
- Rate limiting considerations

**Frontend Optimization**:

- Lazy loading of TEKS data
- Debounced dropdown filtering
- Loading states for better UX
- Error boundary implementation

## Success Criteria

### Functional Requirements

- ✅ Teachers can select TEKS standards via cascading dropdowns
- ✅ AI generates high-quality, standards-aligned MCQs
- ✅ Generated MCQs integrate with existing creation workflow
- ✅ Error handling provides clear user feedback
- ✅ Loading states provide good user experience

### Quality Requirements

- ✅ Generated questions accurately test selected TEKS standards
- ✅ Answer choices are appropriate for grade level
- ✅ Distractors are plausible but clearly incorrect
- ✅ Questions use age-appropriate language
- ✅ Integration maintains existing MCQ functionality

### Technical Requirements

- ✅ API responses follow structured schema
- ✅ Frontend components use shadcn/ui consistently
- ✅ Error handling covers all failure scenarios
- ✅ Performance meets user experience standards
- ✅ Code follows established patterns and conventions

## Dependencies

### External Dependencies

- OpenAI API (GPT-4o model)
- Vercel AI SDK
- Zod for schema validation
- shadcn/ui components

### Internal Dependencies

- Existing MCQ service layer
- TEKS data structure (`lib/teks.ts`)
- Authentication system
- Form validation patterns

## Risks and Mitigation

### Technical Risks

- **Risk**: OpenAI API rate limits or failures
- **Mitigation**: Implement retry logic, fallback to manual creation

- **Risk**: AI-generated content quality inconsistency
- **Mitigation**: Structured prompts, validation, user review step

- **Risk**: Complex dropdown filtering logic
- **Mitigation**: Thorough testing, clear data structure

### User Experience Risks

- **Risk**: Complex TEKS selection process
- **Mitigation**: Intuitive cascading dropdowns, clear labels

- **Risk**: Generated content doesn't meet teacher needs
- **Mitigation**: Preview step, edit capability, manual fallback

## Future Enhancements

### Advanced Features

- Question difficulty customization
- Multiple question generation per standard
- Question bank and reuse functionality
- Custom topic/specifics suggestions
- Question quality scoring

### Integration Features

- Bulk question generation
- Question template system
- Standards alignment reporting
- Question difficulty analysis
- Teacher feedback collection

This TEKS-aligned MCQ generation feature will significantly enhance QuizMaker's value proposition by automating the creation of standards-aligned assessments while maintaining teacher control and quality.
