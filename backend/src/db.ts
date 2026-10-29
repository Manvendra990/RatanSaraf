import { Prisma } from '@prisma/client';
import { prisma } from './prisma.service';
export { prisma } from './prisma.service';
export type Transaction = Prisma.TransactionClient;

/** Preserve the existing HTTP contract: MySQL BIGINT/DECIMAL values are strings. */
export function normalize(value: any): any {
  if (typeof value === 'bigint') return value.toString();
  if (value instanceof Uint8Array) return Buffer.from(value);
  if (value instanceof Date || value === null || value === undefined) return value;
  if (Prisma.Decimal.isDecimal(value)) return value.toString();
  if (Array.isArray(value)) return value.map(normalize);
  if (typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k,v]) => [k,normalize(v)]));
  return value;
}

/** Internal SQL only. Every ? value becomes a bound Prisma parameter, never SQL text. */
export function boundSql(sql: string, args: any[] = []) {
  const chunks = sql.split('?');
  if (chunks.length !== args.length + 1) throw new Error('SQL parameter count mismatch');
  return Prisma.sql(chunks, ...args);
}
async function execute(sql: string, args: any[], db: Transaction): Promise<any[]> {
  const query = boundSql(sql, args);
  if (/^\s*(SELECT|SHOW|WITH)\b/i.test(sql)) return normalize(await db.$queryRaw<any[]>(query));
  await db.$executeRaw(query);
  return [];
}
export async function rows(sql: string, args: any[] = [], db?: Transaction): Promise<any[]> {
  if (db) return execute(sql, args, db);
  return tx(session => execute(sql, args, session));
}
export function tx<T>(run: (db: Transaction) => Promise<T>): Promise<T> {
  return prisma.$transaction(async session => {
    // Retain the old UTC session policy on this leased Prisma transaction connection.
    await session.$executeRaw`SET time_zone = '+00:00'`;
    return run(session);
  }, { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted, maxWait: 10000, timeout: 30000 });
}
