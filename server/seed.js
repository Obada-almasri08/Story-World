const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('Mr@0797488558', 10);
  await prisma.user.upsert({
    where: { email: 'hala.ito.jo@gmail.com' },
    update: {
      password: password
    },
    create: {
      name: 'المدير',
      email: 'hala.ito.jo@gmail.com',
      password: password,
      role: 'manager',
    },
  });
  console.log('Database seeded with custom admin account.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
