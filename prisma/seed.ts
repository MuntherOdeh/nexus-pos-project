import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create default admin user
  const adminPassword = await bcrypt.hash('NexusPoint@Admin2026!', 12);

  const admin = await prisma.admin.upsert({
    where: { email: 'admin@nexuspoint.ae' },
    update: {},
    create: {
      email: 'admin@nexuspoint.ae',
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
      subject: 'POS System Inquiry',
      message: 'This is a sample contact form submission for testing purposes.',
      status: 'NEW',
    },
  });

  console.log('✅ Created sample contact:', contact.email);

  // ==========================================
  // CREATE TEST TENANT WITH FULL DATA
  // ==========================================
  console.log('');
  console.log('🏪 Creating test tenant: demo-restaurant...');

  const tenantPassword = await bcrypt.hash('Demo@2026!', 12);

  // Create or update the test tenant
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'demo-restaurant' },
    update: {},
    create: {
      name: 'Demo Restaurant & Cafe',
      slug: 'demo-restaurant',
      country: 'AE',
      language: 'en',
      companySize: 'S6_20',
      industry: 'RESTAURANT',
      currency: 'AED',
      timezone: 'Asia/Dubai',
      theme: 'EMERALD',
      ownerFirstName: 'John',
      ownerLastName: 'Smith',
      ownerEmail: 'john@demo-restaurant.com',
      ownerPhone: '+971501234567',
    },
  });

  console.log('✅ Created tenant:', tenant.name);

  // Create tenant users (employees)
  const users = [
    { firstName: 'John', lastName: 'Smith', email: 'john@demo-restaurant.com', role: 'OWNER' as const },
    { firstName: 'Sarah', lastName: 'Johnson', email: 'sarah@demo-restaurant.com', role: 'MANAGER' as const },
    { firstName: 'Mike', lastName: 'Williams', email: 'mike@demo-restaurant.com', role: 'STAFF' as const },
    { firstName: 'Emily', lastName: 'Brown', email: 'emily@demo-restaurant.com', role: 'STAFF' as const },
    { firstName: 'Chef', lastName: 'Antonio', email: 'chef@demo-restaurant.com', role: 'KITCHEN' as const },
  ];

  const createdUsers: { [key: string]: string } = {};

  for (const user of users) {
    const existing = await prisma.tenantUser.findFirst({
      where: { tenantId: tenant.id, email: user.email },
    });
    if (!existing) {
      const created = await prisma.tenantUser.create({
        data: {
          tenantId: tenant.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          passwordHash: tenantPassword,
          isActive: true,
        },
      });
      createdUsers[user.email] = created.id;
    } else {
      createdUsers[user.email] = existing.id;
    }
  }

  console.log('✅ Created 5 employees');

  // Create product categories
  const categories = [
    { name: 'Burgers', sortOrder: 1 },
    { name: 'Pizza', sortOrder: 2 },
    { name: 'Pasta', sortOrder: 3 },
    { name: 'Salads', sortOrder: 4 },
    { name: 'Drinks', sortOrder: 5 },
    { name: 'Desserts', sortOrder: 6 },
  ];

  const categoryMap: { [key: string]: string } = {};

  for (const cat of categories) {
    const existing = await prisma.productCategory.findFirst({
      where: { tenantId: tenant.id, name: cat.name },
    });
    if (!existing) {
      const created = await prisma.productCategory.create({
        data: {
          tenantId: tenant.id,
          name: cat.name,
          sortOrder: cat.sortOrder,
        },
      });
      categoryMap[cat.name] = created.id;
    } else {
      categoryMap[cat.name] = existing.id;
    }
  }

  console.log('✅ Created 6 categories');

  // Create products
  const products = [
    // Burgers
    { name: 'Classic Burger', price: 3500, category: 'Burgers' },
    { name: 'Cheese Burger', price: 4000, category: 'Burgers' },
    { name: 'Bacon Burger', price: 4500, category: 'Burgers' },
    { name: 'Veggie Burger', price: 3800, category: 'Burgers' },
    { name: 'Double Burger', price: 5500, category: 'Burgers' },
    // Pizza
    { name: 'Margherita Pizza', price: 4500, category: 'Pizza' },
    { name: 'Pepperoni Pizza', price: 5500, category: 'Pizza' },
    { name: 'BBQ Chicken Pizza', price: 5800, category: 'Pizza' },
    { name: 'Vegetarian Pizza', price: 5000, category: 'Pizza' },
    { name: 'Four Cheese Pizza', price: 6000, category: 'Pizza' },
    // Pasta
    { name: 'Spaghetti Bolognese', price: 4200, category: 'Pasta' },
    { name: 'Penne Arrabiata', price: 3800, category: 'Pasta' },
    { name: 'Carbonara', price: 4500, category: 'Pasta' },
    { name: 'Alfredo Pasta', price: 4300, category: 'Pasta' },
    // Salads
    { name: 'Caesar Salad', price: 2800, category: 'Salads' },
    { name: 'Greek Salad', price: 2500, category: 'Salads' },
    { name: 'Garden Salad', price: 2200, category: 'Salads' },
    // Drinks
    { name: 'Coca-Cola', price: 800, category: 'Drinks' },
    { name: 'Fresh Orange Juice', price: 1500, category: 'Drinks' },
    { name: 'Water', price: 500, category: 'Drinks' },
    { name: 'Iced Tea', price: 1000, category: 'Drinks' },
    { name: 'Coffee', price: 1200, category: 'Drinks' },
    { name: 'Cappuccino', price: 1500, category: 'Drinks' },
    // Desserts
    { name: 'Chocolate Cake', price: 2500, category: 'Desserts' },
    { name: 'Cheesecake', price: 2800, category: 'Desserts' },
    { name: 'Tiramisu', price: 3000, category: 'Desserts' },
    { name: 'Ice Cream', price: 1500, category: 'Desserts' },
  ];

  const productMap: { [key: string]: { id: string; price: number; name: string } } = {};

  for (const prod of products) {
    const existing = await prisma.product.findFirst({
      where: { tenantId: tenant.id, name: prod.name },
      select: { id: true, priceCents: true },
    });
    if (!existing) {
      const created = await prisma.product.create({
        data: {
          tenantId: tenant.id,
          categoryId: categoryMap[prod.category],
          name: prod.name,
          priceCents: prod.price,
          currency: 'AED',
          isActive: true,
        },
      });
      productMap[prod.name] = { id: created.id, price: prod.price, name: prod.name };
    } else {
      productMap[prod.name] = { id: existing.id, price: existing.priceCents, name: prod.name };
    }
  }

  console.log('✅ Created 27 products');

  // Create a floor with tables
  const existingFloor = await prisma.posFloor.findFirst({
    where: { tenantId: tenant.id, name: 'Main Floor' },
  });

  const floor = existingFloor || await prisma.posFloor.create({
    data: {
      tenantId: tenant.id,
      name: 'Main Floor',
      sortOrder: 1,
    },
  });

  // Create tables
  const tableConfigs = [
    { name: 'Table 1', capacity: 4, x: 50, y: 50 },
    { name: 'Table 2', capacity: 4, x: 250, y: 50 },
    { name: 'Table 3', capacity: 6, x: 450, y: 50 },
    { name: 'Table 4', capacity: 2, x: 50, y: 200 },
    { name: 'Table 5', capacity: 2, x: 250, y: 200 },
    { name: 'Table 6', capacity: 8, x: 450, y: 200 },
    { name: 'Table 7', capacity: 4, x: 50, y: 350, shape: 'ROUND' as const },
    { name: 'Table 8', capacity: 4, x: 250, y: 350, shape: 'ROUND' as const },
    { name: 'Bar 1', capacity: 1, x: 450, y: 350, width: 80, height: 80 },
    { name: 'Bar 2', capacity: 1, x: 550, y: 350, width: 80, height: 80 },
  ];

  const tableMap: { [key: string]: string } = {};

  for (const tbl of tableConfigs) {
    const existing = await prisma.posTable.findFirst({
      where: { tenantId: tenant.id, floorId: floor.id, name: tbl.name },
    });
    if (!existing) {
      const created = await prisma.posTable.create({
        data: {
          tenantId: tenant.id,
          floorId: floor.id,
          name: tbl.name,
          capacity: tbl.capacity,
          x: tbl.x,
          y: tbl.y,
          width: tbl.width || 140,
          height: tbl.height || 110,
          shape: tbl.shape || 'RECT',
        },
      });
      tableMap[tbl.name] = created.id;
    } else {
      tableMap[tbl.name] = existing.id;
    }
  }

  console.log('✅ Created 10 tables');

  // Create customers
  const customers = [
    { firstName: 'Ahmed', lastName: 'Al-Rashid', email: 'ahmed@example.com', phone: '+971501111111', points: 150, spent: 45000, visits: 12 },
    { firstName: 'Fatima', lastName: 'Hassan', email: 'fatima@example.com', phone: '+971502222222', points: 320, spent: 89000, visits: 24 },
    { firstName: 'Mohammed', lastName: 'Khan', email: 'mohammed@example.com', phone: '+971503333333', points: 85, spent: 25000, visits: 8 },
    { firstName: 'Layla', lastName: 'Ibrahim', email: 'layla@example.com', phone: '+971504444444', points: 500, spent: 125000, visits: 35 },
    { firstName: 'Omar', lastName: 'Malik', email: 'omar@example.com', phone: '+971505555555', points: 45, spent: 12000, visits: 4 },
    { firstName: 'Sara', lastName: 'Ahmed', email: 'sara@example.com', phone: '+971506666666', points: 210, spent: 58000, visits: 18 },
    { firstName: 'Yusuf', lastName: 'Rahman', email: 'yusuf@example.com', phone: '+971507777777', points: 95, spent: 28000, visits: 9 },
    { firstName: 'Aisha', lastName: 'Qureshi', email: 'aisha@example.com', phone: '+971508888888', points: 180, spent: 52000, visits: 15 },
  ];

  const customerMap: { [key: string]: string } = {};

  for (const cust of customers) {
    const existing = await prisma.customer.findFirst({
      where: { tenantId: tenant.id, email: cust.email },
    });
    if (!existing) {
      const created = await prisma.customer.create({
        data: {
          tenantId: tenant.id,
          firstName: cust.firstName,
          lastName: cust.lastName,
          email: cust.email,
          phone: cust.phone,
          loyaltyPoints: cust.points,
          totalSpentCents: cust.spent,
          visitCount: cust.visits,
          lastVisitAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
          tags: ['Regular'],
        },
      });
      customerMap[cust.email] = created.id;
    } else {
      customerMap[cust.email] = existing.id;
    }
  }

  console.log('✅ Created 8 customers');

  // Create a cash session
  const ownerId = createdUsers['john@demo-restaurant.com'];
  const existingSession = await prisma.posCashSession.findFirst({
    where: { tenantId: tenant.id, status: 'OPEN' },
  });

  const cashSession = existingSession || await prisma.posCashSession.create({
    data: {
      tenantId: tenant.id,
      openedById: ownerId,
      status: 'OPEN',
      openingCashCents: 50000, // 500 AED
      currency: 'AED',
      notes: 'Morning shift opening',
    },
  });

  console.log('✅ Created cash session with 500 AED opening');

  // Create orders (mix of active and completed)
  const orderStatuses = ['OPEN', 'IN_KITCHEN', 'READY', 'FOR_PAYMENT', 'PAID', 'PAID', 'PAID'] as const;
  const productNames = Object.keys(productMap);

  // Check existing orders count
  const existingOrdersCount = await prisma.posOrder.count({
    where: { tenantId: tenant.id },
  });

  if (existingOrdersCount < 15) {
    for (let i = existingOrdersCount; i < 15; i++) {
      const status = orderStatuses[i % orderStatuses.length];
      const tableKeys = Object.keys(tableMap);
      const tableId = status !== 'PAID' ? tableMap[tableKeys[i % tableKeys.length]] : null;
      const customerKey = Object.keys(customerMap)[i % Object.keys(customerMap).length];

      // Random items (2-5 items per order)
      const itemCount = 2 + Math.floor(Math.random() * 4);
      const selectedProducts: { id: string; price: number; name: string }[] = [];
      for (let j = 0; j < itemCount; j++) {
        const prodName = productNames[Math.floor(Math.random() * productNames.length)];
        selectedProducts.push(productMap[prodName]);
      }

      const subtotal = selectedProducts.reduce((sum, p) => sum + p.price, 0);
      const tax = Math.round(subtotal * 0.05);
      const total = subtotal + tax;

      const orderDate = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000);

      await prisma.posOrder.create({
        data: {
          tenantId: tenant.id,
          tableId: tableId,
          openedById: ownerId,
          customerId: customerMap[customerKey],
          status: status,
          orderNumber: `ORD-${String(i + 1).padStart(6, '0')}`,
          subtotalCents: subtotal,
          taxCents: tax,
          totalCents: total,
          currency: 'AED',
          openedAt: orderDate,
          closedAt: status === 'PAID' ? new Date(orderDate.getTime() + 30 * 60 * 1000) : null,
          items: {
            create: selectedProducts.map((prod) => ({
              productId: prod.id,
              productName: prod.name,
              unitPriceCents: prod.price,
              quantity: 1,
              status: status === 'PAID' ? 'SERVED' : (status === 'READY' ? 'READY' : 'NEW'),
            })),
          },
        },
      });
    }
    console.log('✅ Created 15 orders');
  } else {
    console.log('✅ Orders already exist');
  }

  // Create discounts
  const discounts = [
    { name: 'Happy Hour 20%', code: 'HAPPY20', type: 'PERCENTAGE' as const, value: 2000, isActive: true },
    { name: 'New Customer 10%', code: 'NEW10', type: 'PERCENTAGE' as const, value: 1000, isActive: true },
    { name: 'Flat 50 AED Off', code: 'FLAT50', type: 'FIXED' as const, value: 5000, isActive: true },
    { name: 'Staff Discount', code: 'STAFF25', type: 'PERCENTAGE' as const, value: 2500, isActive: true },
  ];

  for (const disc of discounts) {
    const existing = await prisma.discount.findFirst({
      where: { tenantId: tenant.id, code: disc.code },
    });
    if (!existing) {
      await prisma.discount.create({
        data: {
          tenantId: tenant.id,
          name: disc.name,
          code: disc.code,
          type: disc.type,
          value: disc.value,
          isActive: disc.isActive,
        },
      });
    }
  }

  console.log('✅ Created 4 discounts');

  // Create invoices
  const existingInvoicesCount = await prisma.invoice.count({
    where: { tenantId: tenant.id },
  });

  if (existingInvoicesCount < 5) {
    const invoiceCustomers = [
      { name: 'ABC Corporation', email: 'accounts@abc-corp.com' },
      { name: 'XYZ Industries', email: 'billing@xyz.com' },
      { name: 'Tech Solutions LLC', email: 'finance@techsol.com' },
    ];

    for (let i = existingInvoicesCount; i < 5; i++) {
      const cust = invoiceCustomers[i % invoiceCustomers.length];
      const subtotal = 15000 + Math.floor(Math.random() * 35000);
      const tax = Math.round(subtotal * 0.05);

      await prisma.invoice.create({
        data: {
          tenantId: tenant.id,
          number: `INV-${String(i + 1).padStart(6, '0')}`,
          status: i === 0 ? 'DRAFT' : (i === 1 ? 'SENT' : 'PAID'),
          customerName: cust.name,
          customerEmail: cust.email,
          subtotalCents: subtotal,
          taxCents: tax,
          totalCents: subtotal + tax,
          currency: 'AED',
          dueAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          lines: {
            create: [
              {
                description: 'Catering Services - Event',
                quantity: 1,
                unitPriceCents: Math.round(subtotal * 0.6),
                lineTotalCents: Math.round(subtotal * 0.6),
              },
              {
                description: 'Additional items and beverages',
                quantity: 1,
                unitPriceCents: Math.round(subtotal * 0.4),
                lineTotalCents: Math.round(subtotal * 0.4),
              },
            ],
          },
        },
      });
    }
    console.log('✅ Created 5 invoices');
  } else {
    console.log('✅ Invoices already exist');
  }

  // Create time clock entries
  const now = new Date();
  const staffId = createdUsers['mike@demo-restaurant.com'];

  const existingTimeClock = await prisma.timeClockEntry.findFirst({
    where: { tenantId: tenant.id, employeeId: staffId, status: 'CLOCKED_IN' },
  });

  if (!existingTimeClock && staffId) {
    await prisma.timeClockEntry.create({
      data: {
        tenantId: tenant.id,
        employeeId: staffId,
        clockInAt: new Date(now.getTime() - 4 * 60 * 60 * 1000), // 4 hours ago
        status: 'CLOCKED_IN',
        notes: 'Morning shift',
      },
    });
    console.log('✅ Created time clock entry');
  }

  // Create warehouse and stock
  const existingWarehouse = await prisma.warehouse.findFirst({
    where: { tenantId: tenant.id, name: 'Main Storage' },
  });

  const warehouse = existingWarehouse || await prisma.warehouse.create({
    data: {
      tenantId: tenant.id,
      name: 'Main Storage',
      code: 'WH-01',
    },
  });

  // Add some stock items
  const stockProducts = Object.values(productMap).slice(0, 10);
  for (const prod of stockProducts) {
    const existing = await prisma.stockItem.findFirst({
      where: { warehouseId: warehouse.id, productId: prod.id },
    });
    if (!existing) {
      await prisma.stockItem.create({
        data: {
          tenantId: tenant.id,
          warehouseId: warehouse.id,
          productId: prod.id,
          onHand: Math.floor(Math.random() * 50) + 10,
          reorderPoint: 5,
        },
      });
    }
  }

  console.log('✅ Created warehouse with stock items');

  // Create tax rate
  const existingTax = await prisma.taxRate.findFirst({
    where: { tenantId: tenant.id, name: 'VAT 5%' },
  });

  if (!existingTax) {
    await prisma.taxRate.create({
      data: {
        tenantId: tenant.id,
        name: 'VAT 5%',
        rate: 500, // 5% in basis points
        isDefault: true,
        isInclusive: false,
      },
    });
    console.log('✅ Created VAT tax rate');
  }

  console.log('');
  console.log('🎉 Database seeded successfully!');
  console.log('');
  console.log('📝 Admin Login Credentials:');
  console.log('   Email: admin@nexuspoint.ae');
  console.log('   Password: NexusPoint@Admin2026!');
  console.log('');
  console.log('🏪 Test Tenant: demo-restaurant');
  console.log('   URL: /t/demo-restaurant/pos');
  console.log('   Owner Email: john@demo-restaurant.com');
  console.log('   Password: Demo@2026!');
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