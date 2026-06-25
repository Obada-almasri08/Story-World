const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
  // تشفير كلمة المرور قبل الحفظ في قاعدة البيانات
  const hashedPassword = await bcrypt.hash('123456', 10); 
  
  const user = await prisma.user.create({
    data: {
      email: 'admin@test.com',
      password: hashedPassword, // تخزين النسخة المشفرة
      role: 'manager',
      name: 'Admin User'
    },
  });
  console.log('Admin added successfully:', user);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
  