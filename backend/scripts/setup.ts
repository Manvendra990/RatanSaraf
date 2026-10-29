/** Compatibility entry point; schema creation now belongs to Prisma Migrate. */
import { spawnSync } from 'node:child_process';
const result=spawnSync(process.execPath,[require.resolve('prisma/build/index.js'),'migrate','deploy'],{stdio:'inherit',env:process.env});
if(result.status!==0) process.exit(result.status||1);
void import('../prisma/seed');
