/**
 * D1 Database Client
 * Centralized database access for QuizMaker application
 */

export interface D1Database {
  prepare(query: string): D1PreparedStatement;
  exec(query: string): Promise<D1ExecResult>;
  batch(statements: D1PreparedStatement[]): Promise<D1BatchResult[]>;
}

export interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = unknown>(): Promise<T | null>;
  run(): Promise<D1Result>;
  all<T = unknown>(): Promise<D1Result<T>>;
}

export interface D1Result<T = unknown> {
  success: boolean;
  meta: {
    changes: number;
    last_row_id: number;
    duration: number;
  };
  results?: T[];
}

export interface D1ExecResult {
  count: number;
  duration: number;
}

export interface D1BatchResult {
  success: boolean;
  meta: {
    changes: number;
    last_row_id: number;
    duration: number;
  };
  results?: unknown[];
}

/**
 * Get D1 database instance from Cloudflare environment
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getDatabase(env: any): D1Database {
  return env.quizmaker_app_database;
}

function normalizePlaceholders(sql: string, paramCount: number): string {
  if (paramCount === 0) return sql;
  let index = 0;
  return sql.replace(/\?/g, () => {
    index += 1;
    return `?${index}`;
  });
}

function escapeValue(value: unknown): string {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "number") return String(value);
  // default to string
  const s = String(value);
  // escape single quotes by doubling them
  return `'${s.replace(/'/g, "''")}'`;
}

function interpolateSql(sql: string, params: unknown[]): string {
  let i = 0;
  return sql.replace(/\?(\d+)?/g, () => {
    const val = params[i++];
    return escapeValue(val);
  });
}

const isBindingError = (e: unknown) =>
  e instanceof Error && /Wrong number of parameter bindings/i.test(e.message);

/**
 * Execute a prepared statement with error handling
 */
export async function executeQuery<T = unknown>(
  db: D1Database,
  query: string,
  ...params: unknown[]
): Promise<T[]> {
  const sql = normalizePlaceholders(query, params.length);
  try {
    const stmt = db.prepare(sql);
    if (params.length > 0) stmt.bind(...params);
    const result = await stmt.all<T>();
    return result.results || [];
  } catch (error) {
    console.error("Database query error:", error);
    console.error("Query:", query);
    console.error("Normalized:", sql);
    console.error("Params:", params);
    if (isBindingError(error) && params.length > 0) {
      try {
        const inlined = interpolateSql(sql, params);
        const result = await db.prepare(inlined).all<T>();
        return result.results || [];
      } catch (e2) {
        console.error("Fallback inline query failed:", e2);
      }
    }
    throw new Error(
      `Database query failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/**
 * Execute a single row query
 */
export async function executeQueryFirst<T = unknown>(
  db: D1Database,
  query: string,
  ...params: unknown[]
): Promise<T | null> {
  const sql = normalizePlaceholders(query, params.length);
  try {
    const stmt = db.prepare(sql);
    if (params.length > 0) stmt.bind(...params);
    const result = await stmt.all<T>();
    return (result.results && result.results[0]) || null;
  } catch (error) {
    console.error("Database query error:", error);
    console.error("Query:", query);
    console.error("Normalized:", sql);
    console.error("Params:", params);
    if (isBindingError(error) && params.length > 0) {
      try {
        const inlined = interpolateSql(sql, params);
        const result = await db.prepare(inlined).all<T>();
        return (result.results && result.results[0]) || null;
      } catch (e2) {
        console.error("Fallback inline query failed:", e2);
      }
    }
    throw new Error(
      `Database query failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/**
 * Execute an insert/update/delete query
 */
export async function executeMutation(
  db: D1Database,
  query: string,
  ...params: unknown[]
): Promise<D1Result> {
  const sql = normalizePlaceholders(query, params.length);
  try {
    const stmt = db.prepare(sql);
    if (params.length > 0) stmt.bind(...params);
    return await stmt.run();
  } catch (error) {
    console.error("Database mutation error:", error);
    console.error("Query:", query);
    console.error("Normalized:", sql);
    console.error("Params:", params);
    if (isBindingError(error) && params.length > 0) {
      try {
        const inlined = interpolateSql(sql, params);
        return await db.prepare(inlined).run();
      } catch (e2) {
        console.error("Fallback inline mutation failed:", e2);
      }
    }
    throw new Error(
      `Database mutation failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/**
 * Execute multiple statements in a transaction
 */
export async function executeBatch(
  db: D1Database,
  statements: { query: string; params?: unknown[] }[]
): Promise<D1BatchResult[]> {
  try {
    const preparedStatements = statements.map(({ query, params = [] }) => {
      const sql = normalizePlaceholders(query, params.length);
      const stmt = db.prepare(sql);
      if (params.length > 0) {
        stmt.bind(...params);
      }
      return stmt;
    });

    return await db.batch(preparedStatements);
  } catch (error) {
    console.error("Database batch error:", error);
    console.error("Statements:", statements);

    // Try fallback with inline queries
    if (isBindingError(error) && statements.length > 0) {
      try {
        console.log("Attempting fallback with inline queries");
        const fallbackResults = [];
        for (const { query, params = [] } of statements) {
          const inlined = interpolateSql(
            normalizePlaceholders(query, params.length),
            params
          );
          const result = await db.prepare(inlined).run();
          fallbackResults.push(result);
        }
        return fallbackResults;
      } catch (e2) {
        console.error("Fallback batch failed:", e2);
      }
    }

    throw new Error(
      `Database batch failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/**
 * Generate a random UUID for database IDs
 */
export function generateId(): string {
  return crypto.randomUUID().replace(/-/g, "");
}

/**
 * Database connection test
 */
export async function testConnection(db: D1Database): Promise<boolean> {
  try {
    await executeQuery(db, "SELECT 1 as test");
    return true;
  } catch (error) {
    console.error("Database connection test failed:", error);
    return false;
  }
}
