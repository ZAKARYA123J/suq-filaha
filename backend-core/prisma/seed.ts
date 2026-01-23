import { UserType, OrderStatus, NegotiationStatus } from '../src/generated/prisma';
import * as argon2 from 'argon2';
import prisma from '../src/config/database';

/* ----------------------------- helpers ----------------------------- */

function getRandomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomItems<T>(array: T[], count: number): T[] {
  return [...array].sort(() => 0.5 - Math.random()).slice(0, count);
}

/* ----------------------------- constants ---------------------------- */

const moroccanCities = [
  'Casablanca', 'Rabat', 'Marrakech', 'Fes', 'Tangier',
  'Agadir', 'Meknes', 'Oujda', 'Kenitra', 'Tetouan',
  'Safi', 'El Jadida', 'Nador', 'Beni Mellal', 'Khouribga',
];

/**
 * HARVEST / BULK IMAGES ONLY
 * (field, crates, sacks, farms — no retail food photography)
 */
const harvestImages = {
  Vegetables: [
    'https://images.unsplash.com/photo-1592924357228-91a4daadcfea', // tomato crates
    'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37', // carrot harvest
    'https://images.unsplash.com/photo-1604977042946-1eecc30f269e', // cucumber harvest
  ],
  Fruits: [
    'https://images.unsplash.com/photo-1547514701-42782101795e', // orange harvest
    'https://images.unsplash.com/photo-1580052614034-c55d20bfee3b', // fruit crates
  ],
  Grains: [
    'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b', // wheat harvest
    'https://images.unsplash.com/photo-1595855759920-86582396756a', // grain sacks
  ],
  Herbs: [
    'https://images.unsplash.com/photo-1628556270448-4d4e4148e1b1', // mint harvest
    'https://images.unsplash.com/photo-1566281796817-93bc94d7dbd2', // herbs farm
  ],
  Dairy: [
    'https://images.unsplash.com/photo-1563636619-e9143da7973b', // milk farm
    'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d', // cheese production
  ],
};

const productTemplates = [
  { name: 'Tomatoes', category: 'Vegetables' },
  { name: 'Carrots', category: 'Vegetables' },
  { name: 'Cucumbers', category: 'Vegetables' },
  { name: 'Oranges', category: 'Fruits' },
  { name: 'Apples', category: 'Fruits' },
  { name: 'Wheat', category: 'Grains' },
  { name: 'Barley', category: 'Grains' },
  { name: 'Mint', category: 'Herbs' },
  { name: 'Parsley', category: 'Herbs' },
  { name: 'Fresh Milk', category: 'Dairy' },
];

const farmerNames = [
  'Ahmed El Amrani', 'Hassan Benali', 'Khalid Mansouri', 'Rachid Alaoui',
  'Omar Fassi', 'Youssef Idrissi', 'Karim Berrada', 'Said Bennani',
  'Mohammed Tazi', 'Abdelaziz Kettani',
];

const buyerNames = [
  'Fatima Zahra', 'Salma Benjelloun', 'Nadia Chraibi', 'Amina Lahlou',
  'Khadija Alami', 'Meryem Iraqi', 'Leila Skalli', 'Zineb Lazrak',
  'Sara Sekkouri', 'Hanane Tazi',
];

/* ------------------------------ seed ------------------------------- */

async function main() {
  console.log('🌱 Seeding database...');

  await prisma.message.deleteMany();
  await prisma.chat.deleteMany();
  await prisma.review.deleteMany();
  await prisma.negotiationMessage.deleteMany();
  await prisma.negotiation.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();

  const farmerPassword = await argon2.hash('farmer123');
  const buyerPassword = await argon2.hash('buyer123');
  const adminPassword = await argon2.hash('admin123');

  /* --------------------------- users --------------------------- */

  const farmers = [];
  for (let i = 0; i < 10; i++) {
    farmers.push(
      await prisma.user.create({
        data: {
          name: farmerNames[i],
          phoneNumber: `+21260000${String(i + 1).padStart(4, '0')}`,
          password: farmerPassword,
          location: getRandomItem(moroccanCities),
          userType: UserType.FARMER,
          rating: Math.round((3.5 + Math.random() * 1.5) * 10) / 10,
        },
      })
    );
  }

  const buyers = [];
  for (let i = 0; i < 10; i++) {
    buyers.push(
      await prisma.user.create({
        data: {
          name: buyerNames[i],
          phoneNumber: `+21261000${String(i + 1).padStart(4, '0')}`,
          password: buyerPassword,
          location: getRandomItem(moroccanCities),
          userType: UserType.BUYER,
          rating: Math.round((3.5 + Math.random() * 1.5) * 10) / 10,
        },
      })
    );
  }

  await prisma.user.create({
    data: {
      name: 'Admin',
      phoneNumber: '+212600000000',
      password: adminPassword,
      userType: UserType.ADMIN,
    },
  });

  /* -------------------------- products -------------------------- */

  const products = [];
  for (let i = 0; i < 100; i++) {
    const template = getRandomItem(productTemplates);
    const farmer = getRandomItem(farmers);

    products.push(
      await prisma.product.create({
        data: {
          name: `Farm ${template.name}`,
          category: template.category,
          quantity: Math.floor(Math.random() * 500) + 50,
          unit: getRandomItem(['kg', 'ton']),
          price: Math.round((Math.random() * 40 + 5) * 100) / 100,
          quality: getRandomItem(['Premium', 'Grade A', 'Standard']),
          harvestDate: new Date(
            Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000
          ),
          images: getRandomItems(
            harvestImages[template.category as keyof typeof harvestImages],
            2
          ).map(img => `${img}?w=1200&q=80`),
          isAvailable: true,
          farmerId: farmer.id,
        },
      })
    );
  }

  /* --------------------------- orders --------------------------- */

  const orders = [];
  for (let i = 0; i < 30; i++) {
    const buyer = getRandomItem(buyers);
    const items = getRandomItems(products, 2);

    let total = 0;
    const orderItems = items.map(p => {
      const qty = Math.floor(Math.random() * 40) + 10;
      total += qty * p.price;
      return {
        productId: p.id,
        quantity: qty,
        price: p.price,
        total: qty * p.price,
      };
    });

    orders.push(
      await prisma.order.create({
        data: {
          buyerId: buyer.id,
          farmerId: items[0].farmerId,
          status: getRandomItem([
            OrderStatus.PENDING,
            OrderStatus.CONFIRMED,
            OrderStatus.CANCELLED,
          ]),
          totalAmount: Math.round(total * 100) / 100,
          deliveryAddress: `${buyer.location}, Morocco`,
          deliveryDate: new Date(Date.now() + 7 * 86400000),
          items: { create: orderItems },
        },
      })
    );
  }

  /* ------------------------ negotiations ------------------------ */

  for (let i = 0; i < 40; i++) {
    const product = getRandomItem(products);
    const buyer = getRandomItem(buyers);

    await prisma.negotiation.create({
      data: {
        productId: product.id,
        buyerId: buyer.id,
        farmerId: product.farmerId,
        originalPrice: product.price,
        proposedPrice: product.price * 0.85,
        status: getRandomItem(Object.values(NegotiationStatus)),
        messages: {
          create: [
            {
              content: 'Interested in bulk purchase. Can we negotiate?',
              senderId: buyer.id,
              senderType: UserType.BUYER,
            },
          ],
        },
      },
    });
  }

  /* ---------------------------- reviews --------------------------- */

  for (const order of orders.filter(o => o.status === OrderStatus.CONFIRMED)) {
    await prisma.review.create({
      data: {
        rating: Math.round((4 + Math.random()) * 10) / 10,
        comment: 'Good harvest quality and reliable delivery.',
        reviewerId: order.buyerId,
        reviewedId: order.farmerId,
        orderId: order.id,
      },
    });
  }

  console.log('✅ Seed completed successfully');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
