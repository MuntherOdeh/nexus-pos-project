import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create default admin user
  const adminPassword = await bcrypt.hash('ScopeCode@Admin2024!', 12);
  
  const admin = await prisma.admin.upsert({
    where: { email: 'admin@scopecode.ae' },
    update: {},
    create: {
      email: 'admin@scopecode.ae',
      passwordHash: adminPassword,
      name: 'Admin',
      role: 'SUPER_ADMIN',
      isActive: true,
    },
  });

  console.log('✅ Created admin user:', admin.email);

  // Create sample contact for testing
  const contact = await prisma.contact.upsert({
    where: { id: 'sample-contact-1' },
    update: {},
    create: {
      id: 'sample-contact-1',
      name: 'Test User',
      email: 'test@example.com',
      phone: '+971551234567',
      subject: 'Web Development Inquiry',
      message: 'This is a sample contact form submission for testing purposes.',
      status: 'NEW',
    },
  });

  console.log('✅ Created sample contact:', contact.email);

  console.log('');
  console.log('🎉 Database seeded successfully!');
  console.log('');
  console.log('📝 Admin Login Credentials:');
  console.log('   Email: admin@scopecode.ae');
  console.log('   Password: ScopeCode@Admin2024!');
  console.log('');
  console.log('⚠️  IMPORTANT: Change the admin password after first login!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });