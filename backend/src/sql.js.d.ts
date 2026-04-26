declare module 'sql.js' {
  export interface Database {
    run(sql: string, params?: unknown[]): void;
    exec(sql: string): QueryExecResult[];
    prepare(sql: string): Statement;
    export(): Uint8Array;
    getRowsModified(): number;
  }

  export interface Statement {
    bind(params?: unknown[]): void;
    step(): boolean;
    get(): unknown[];
    free(): void;
  }

  export interface QueryExecResult {
    columns: string[];
    values: unknown[][];
  }

  export default function initSqlJs(): Promise<typeof Database>;
}