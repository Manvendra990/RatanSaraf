import 'dotenv/config';
import { spawnSync } from 'node:child_process';
import { prisma } from '../src/prisma.service';
async function main() {
  const tables = await prisma.$queryRaw<{ TABLE_NAME: string }[]>`SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE()`;
  await prisma.$disconnect();
  if (tables.length && !tables.some(t => t.TABLE_NAME === '_prisma_migrations')) {
    console.log('Checking existing tables before recording the Prisma baseline. No reset will run.');
    const baseline = spawnSync(process.execPath, ['--import', 'tsx', 'scripts/check-baseline.ts', '--apply'], { stdio: 'inherit', env: process.env });
    if (baseline.status !== 0) throw new Error('Baseline failed. Existing data was not reset. Share the output before continuing.');
  }
  const migration = spawnSync(process.execPath, [require.resolve('prisma/build/index.js'), 'migrate', 'deploy'], { stdio: 'inherit', env: process.env });
  if (migration.status !== 0) throw new Error('Migration did not complete. Do not reset the database; inspect the error.');
  console.log('Database upgrade completed. Existing records were preserved.');
}
main().catch(e => { console.error(e.message); process.exitCode = 1; }).finally(() => prisma.$disconnect());
