import { PrismaClient } from '../generated/prisma';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

console.log(process.env["DATABASE_URL"])
const pool = new Pool({ 
  connectionString:"postgresql://ocean_dev1:root@localhost:5432/suqfilaha"
});
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
  log: ['query', 'error', 'warn'],
});

export default prisma;