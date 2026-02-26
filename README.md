# QuizMaker

A quiz-creating application designed for teachers. QuizMaker allows educators to create multiple choice questions (MCQs) with the assistance of an AI assistant that helps align quiz content with specific state standards (such as TEKS).

## Technology Stack

- **Next.js 15.4.6** - React framework with App Router
- **Cloudflare Workers** - Serverless deployment platform
- **@opennextjs/cloudflare** - Integration layer for Next.js on Cloudflare Workers
- **Cloudflare D1** - SQLite database for data persistence
- **Tailwind CSS 4** - Utility-first CSS framework
- **shadcn/ui** - UI component library
- **TypeScript** - Type safety
- **Vercel AI SDK** - AI-powered MCQ generation with OpenAI

## Key Features

### ✅ Authentication System
- User registration and login
- Session-based authentication with secure cookies
- Password hashing with PBKDF2
- Route protection middleware

**Documentation**: See [docs/BASIC_AUTHENTICATION.md](docs/BASIC_AUTHENTICATION.md)

### ✅ MCQ Management
- Create, edit, delete multiple choice questions
- Dynamic choice management (2-6 choices per question)
- MCQ listing with search and pagination
- Preview mode with attempt recording
- User ownership validation

**Documentation**: See [docs/MCQ_CRUD.md](docs/MCQ_CRUD.md)

### ✅ TEKS-Aligned AI Generation
- AI-powered MCQ generation based on TEKS standards
- Cascading dropdown selection (Subject → Grade → Strand → Standard)
- Topic-specific question generation
- Seamless integration with MCQ creation workflow

**Documentation**: See [docs/TEKS_ALIGNED_MCQ.md](docs/TEKS_ALIGNED_MCQ.md)

## Getting Started

### Prerequisites

- Node.js 20+
- Cloudflare account
- OpenAI API key (for AI generation feature)

### Installation

```bash
npm install
```

### Environment Setup

Create a `.dev.vars` file for local development:

```bash
NEXTJS_ENV=development
SESSION_SECRET=your-secret-key-here
OPENAI_API_KEY=your-openai-api-key
OPENAI_MODEL=gpt-4o-mini
```

### Database Setup

1. Create a D1 database:
```bash
wrangler d1 create quizmaker-app-database
```

2. Update `wrangler.jsonc` with your database configuration

3. Apply migrations:
```bash
wrangler d1 migrations apply quizmaker-app-database --local
```

### Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Deploy to Cloudflare Workers
npm run deploy
```

## Project Structure

```
quizmaker-app/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   ├── auth/         # Authentication endpoints
│   │   └── mcqs/         # MCQ management endpoints
│   ├── mcqs/             # MCQ management pages
│   └── ...
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   └── ...
├── lib/                   # Utility functions and services
│   ├── services/         # Business logic layer
│   └── ...
├── migrations/            # Database migrations
└── docs/                 # Technical documentation
```

## Technical Documentation

- **[Basic Authentication PRD](docs/BASIC_AUTHENTICATION.md)** - Authentication system implementation
- **[MCQ CRUD PRD](docs/MCQ_CRUD.md)** - MCQ management system implementation
- **[TEKS-Aligned MCQ Generation PRD](docs/TEKS_ALIGNED_MCQ.md)** - AI-powered question generation

## Database

- **Database Name**: `quizmaker-app-database`
- **Binding**: `quizmaker_app_database`
- **Migrations**: Managed via Wrangler commands

## Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build the application
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run deploy` - Build and deploy to Cloudflare Workers
- `npm run preview` - Build and preview locally
- `npm run cf-typegen` - Generate Cloudflare TypeScript definitions

## Development Workflow

1. **Local Development**: Use `npm run dev` for local development
2. **Database Changes**: Create and apply migrations using Wrangler commands
3. **Deployment**: Use `npm run deploy` to deploy to Cloudflare Workers
4. **Environment Updates**: Modify `.dev.vars` for local changes, use Wrangler secrets for production

## Key Implementation Notes

### SQLite Boolean Handling

SQLite does not have a native boolean type. Always convert JavaScript booleans to integers (0/1) before storage:

```typescript
// Storage
const isCorrect = choice.is_correct ? 1 : 0;

// Retrieval - handle multiple types
const isCorrect = 
  choice.is_correct === 1 || 
  choice.is_correct === "true" || 
  choice.is_correct === true;
```

See [MCQ CRUD PRD](docs/MCQ_CRUD.md#critical-sqlite-boolean-gotcha) for details.

### Database Access

Always use `getCloudflareContext().env` to access the D1 database:

```typescript
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getDatabase } from "@/lib/d1-client";

const { env } = getCloudflareContext();
const db = getDatabase(env);
```

### Parameter Binding

Use the D1 client helpers which automatically normalize placeholders:

```typescript
import { executeQueryFirst } from "@/lib/d1-client";

const user = await executeQueryFirst(
  db,
  "SELECT * FROM users WHERE email = ?",
  email
);
```

## License

MIT
