import 'dotenv/config';
import { spawnSync } from 'node:child_process';
import { prisma } from '../src/prisma.service';
async function main() {
  const [migrationTable] = await prisma.$queryRaw<any[]>`SELECT COUNT(*) AS n FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='_prisma_migrations'`;
  if (Number(migrationTable.n)>0) throw new Error('Prisma migration history already exists. Use npm run db:status; do not re-baseline it.');
  const diff=spawnSync(process.execPath,[require.resolve('prisma/build/index.js'),'migrate','diff','--from-schema-datasource','prisma/schema.prisma','--to-schema-datamodel','prisma/legacy-initial.prisma','--exit-code'],{stdio:'inherit',env:process.env});
  if(diff.status!==0) throw new Error('Existing database differs from the Prisma model or is unavailable. Baseline was NOT recorded. Review the difference; do not reset the database.');
  const checks=await prisma.$queryRaw<any[]>`SELECT CHECK_CLAUSE FROM information_schema.CHECK_CONSTRAINTS WHERE CONSTRAINT_SCHEMA=DATABASE()`;
  if(!checks.some(c=>String(c.CHECK_CLAUSE).toLowerCase().includes('reserved')&&String(c.CHECK_CLAUSE).toLowerCase().includes('grams')))throw new Error('Gold reservation CHECK constraint was not found. Baseline was NOT recorded.');
  if(process.argv.includes('--apply')) {
    const r=spawnSync(process.execPath,[require.resolve('prisma/build/index.js'),'migrate','resolve','--applied','202610270001_initial'],{stdio:'inherit',env:process.env});
    if(r.status!==0)throw new Error('Unable to record baseline');
  }else console.log('Baseline check passed. After backing up the database, run npm run db:baseline to record migration history without changing user tables.');
}
main().catch(e=>{console.error(e.message);process.exitCode=1;}).finally(()=>prisma.$disconnect());
