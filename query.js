// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  try {
    const acts = await prisma.$queryRawUnsafe('SELECT activityId, date FROM GarminActivity');
    console.log(acts);
  } catch(e) {
    console.error('Error:', e);
  }
}
main();
