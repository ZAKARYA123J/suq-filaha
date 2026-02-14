import { UserType, OrderStatus, NegotiationStatus } from '../src/generated/prisma';
import * as argon2 from 'argon2';
import prisma from '../src/config/database';

// Helper function to get random items from array
function getRandomItems<T>(array: T[], count: number): T[] {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

// Helper function to get random item
function getRandomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

// Moroccan cities
const moroccanCities = [
  'Casablanca', 'Rabat', 'Marrakech', 'Fes', 'Tangier',
  'Agadir', 'Meknes', 'Oujda', 'Kenitra', 'Tetouan',
  'Safi', 'El Jadida', 'Nador', 'Beni Mellal', 'Khouribga'
];

// Product categories with realistic Unsplash images
const productCategories = {
  Vegetables: [
    { name: 'Fresh Tomatoes', images: ['https://images.unsplash.com/photo-1546094096-0df4bcaaa337', 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea'] },
    { name: 'Organic Carrots', images: ['https://images.unsplash.com/photo-1598170845058-32b9d6a5da37', 'https://images.unsplash.com/photo-1447175008436-054170c2e979'] },
    { name: 'Bell Peppers', images: ['https://images.unsplash.com/photo-1563565375-f3fdfdbefa83', 'https://images.unsplash.com/photo-1601493700631-2b16ec4b4716'] },
    { name: 'Fresh Cucumbers', images: ['https://images.unsplash.com/photo-1604977042946-1eecc30f269e', 'https://images.unsplash.com/photo-1589927986089-35812388d1f4'] },
    { name: 'Zucchini', images: ['https://images.unsplash.com/photo-1589927986089-35812388d1f4', 'https://images.unsplash.com/photo-1566385101042-1a0aa0c1268c'] },
    { name: 'Eggplant', images: ['https://images.unsplash.com/photo-1659261200833-ec8761558af7', 'https://images.unsplash.com/photo-1618907076164-8eaeda6056b2'] },
    { name: 'Green Beans', images: ['https://images.unsplash.com/photo-1603048588665-791ca8aea617', 'https://images.unsplash.com/photo-1607212012557-5f8c2e6c1f8d'] },
    { name: 'Lettuce', images: ['https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1', 'https://images.unsplash.com/photo-1556801712-76c8eb07bbc9'] },
  ],
  Fruits: [
    { name: 'Sweet Oranges', images: ['https://images.unsplash.com/photo-1580052614034-c55d20bfee3b', 'https://images.unsplash.com/photo-1547514701-42782101795e'] },
    { name: 'Fresh Apples', images: ['https://images.unsplash.com/photo-1568702846914-96b305d2aaeb', 'https://images.unsplash.com/photo-1619546813926-a78fa6372cd2'] },
    { name: 'Ripe Strawberries', images: ['https://images.unsplash.com/photo-1464965911861-746a04b4bca6', 'https://images.unsplash.com/photo-1518635017498-87f514b751ba'] },
    { name: 'Fresh Watermelon', images: ['https://images.unsplash.com/photo-1587049352846-4a222e784238', 'https://images.unsplash.com/photo-1582281298055-e25b2a3b03d6'] },
    { name: 'Grapes', images: ['https://images.unsplash.com/photo-1599819177615-3c2b6c48f65b', 'https://images.unsplash.com/photo-1596363505729-4190a9506133'] },
    { name: 'Peaches', images: ['https://images.unsplash.com/photo-1629828779980-ec8e1f1f6bc5', 'https://images.unsplash.com/photo-1528821128474-27f963b062bf'] },
    { name: 'Pears', images: ['https://images.unsplash.com/photo-1568523243755-ca9a67b29c5f', 'https://images.unsplash.com/photo-1548690596-f3ffcbc37b67'] },
  ],
  Grains: [
    { name: 'Organic Wheat', images: ['https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b', 'https://images.unsplash.com/photo-1595855759920-86582396756a'] },
    { name: 'Brown Rice', images: ['https://images.unsplash.com/photo-1586201375761-83865001e31c', 'https://images.unsplash.com/photo-1516684732162-798a0062be99'] },
    { name: 'Oats', images: ['https://images.unsplash.com/photo-1574635620108-93c1c1b75496', 'https://images.unsplash.com/photo-1517433670267-08bbd4be890f'] },
    { name: 'Barley', images: ['https://images.unsplash.com/photo-1612528443702-f6741f70a049', 'https://images.unsplash.com/photo-1603569283847-aa295f0d016a'] },
  ],
  Herbs: [
    { name: 'Fresh Mint', images: ['https://images.unsplash.com/photo-1628556270448-4d4e4148e1b1', 'https://images.unsplash.com/photo-1628556270448-4d4e4148e1b1'] },
    { name: 'Basil', images: ['https://images.unsplash.com/photo-1618375569909-3c8616cf7547', 'https://images.unsplash.com/photo-1618375569909-3c8616cf7547'] },
    { name: 'Parsley', images: ['https://images.unsplash.com/photo-1629194223147-f4e360a48d42', 'https://images.unsplash.com/photo-1583663848850-46af132dc08e'] },
    { name: 'Coriander', images: ['https://images.unsplash.com/photo-1566281796817-93bc94d7dbd2', 'https://images.unsplash.com/photo-1578916171728-46686eac8d58'] },
  ],
  Dairy: [
    { name: 'Fresh Milk', images: ['https://images.unsplash.com/photo-1563636619-e9143da7973b', 'https://images.unsplash.com/photo-1550583724-b2692b85b150'] },
    { name: 'Farm Cheese', images: ['https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d', 'https://images.unsplash.com/photo-1452195100486-9cc805987862'] },
    { name: 'Fresh Butter', images: ['https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d', 'https://images.unsplash.com/photo-1628088062854-d1870b4553da'] },
    { name: 'Yogurt', images: ['https://images.unsplash.com/photo-1571212515416-fca17c40c22c', 'https://images.unsplash.com/photo-1488477181946-6428a0291777'] },
  ],
};

// Farmer profile images (Unsplash - farmer/agriculture themed)
const farmerProfileImages = [
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7',
  'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2',
  'https://images.unsplash.com/photo-1599566150163-29194dcaad36',
  'https://images.unsplash.com/photo-1506277886164-e25aa3f4ef7f',
  'https://images.unsplash.com/photo-1531427186611-ecfd6d936c79',
  'https://images.unsplash.com/photo-1463453091185-61582044d556',
];

// Buyer profile images
const buyerProfileImages = [
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330',
  'https://images.unsplash.com/photo-1546961329-78bef0414d7c',
  'https://images.unsplash.com/photo-1552058544-f2b08422138a',
  'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9',
  'https://images.unsplash.com/photo-1531123897727-8f129e1688ce',
];

// Farmer names
const farmerNames = [
  'Ahmed El Amrani', 'Hassan Benali', 'Khalid Mansouri', 'Rachid Alaoui',
  'Omar Fassi', 'Youssef Idrissi', 'Karim Berrada', 'Said Bennani',
  'Mohammed Tazi', 'Abdelaziz Kettani'
];

// Buyer names
const buyerNames = [
  'Fatima Zahra', 'Salma Benjelloun', 'Nadia Chraibi', 'Amina Lahlou',
  'Khadija Alami', 'Meryem Iraqi', 'Leila Skalli', 'Zineb Lazrak',
  'Sara Sekkouri', 'Hanane Tazi'
];

async function main() {
  console.log('🌱 Seeding database...');

  // Clean database
  await prisma.message.deleteMany();
  await prisma.chat.deleteMany();
  await prisma.review.deleteMany();
  await prisma.negotiationMessage.deleteMany();
  await prisma.negotiation.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();

  // Hash passwords
  const farmerPassword = await argon2.hash('farmer123');
  const buyerPassword = await argon2.hash('buyer123');
  const adminPassword = await argon2.hash('admin123');

  console.log('👨‍🌾 Creating farmers...');
  // Create 10 farmers
  const farmers = [];
  for (let i = 0; i < 10; i++) {
    const farmer = await prisma.user.create({
      data: {
        name: farmerNames[i],
        phoneNumber: `+21260000${String(i + 1).padStart(4, '0')}`,
        password: farmerPassword,
        location: getRandomItem(moroccanCities),
        userType: UserType.FARMER,
        rating: Math.round((3.5 + Math.random() * 1.5) * 10) / 10,
        profileInfo: farmerProfileImages[i],
      },
    });
    farmers.push(farmer);
  }

  console.log('🛒 Creating buyers...');
  // Create 10 buyers
  const buyers = [];
  for (let i = 0; i < 10; i++) {
    const buyer = await prisma.user.create({
      data: {
        name: buyerNames[i],
        phoneNumber: `+21261000${String(i + 1).padStart(4, '0')}`,
        password: buyerPassword,
        location: getRandomItem(moroccanCities),
        userType: UserType.BUYER,
        rating: Math.round((3.5 + Math.random() * 1.5) * 10) / 10,
        profileInfo: buyerProfileImages[i],
      },
    });
    buyers.push(buyer);
  }

  console.log('👤 Creating admin...');
  // Create admin
  await prisma.user.create({
    data: {
      name: 'Admin User',
      phoneNumber: '+212600000000',
      password: adminPassword,
      userType: UserType.ADMIN,
      profileInfo: 'https://images.unsplash.com/photo-1560250097-0b93528c311a',
    },
  });

  console.log('🥬 Creating 100 products...');
  // Create 100 products
  const products = [];
  const allProducts = Object.entries(productCategories).flatMap(([category, items]) =>
    items.map(item => ({ ...item, category }))
  );

  for (let i = 0; i < 100; i++) {
    const productTemplate = getRandomItem(allProducts);
    const farmer = getRandomItem(farmers);
    
    // Add variety to product names
    const variants = ['Premium', 'Organic', 'Fresh', 'Grade A', 'Farm Fresh', ''];
    const variant = getRandomItem(variants);
    const productName = variant ? `${variant} ${productTemplate.name}` : productTemplate.name;

    const product = await prisma.product.create({
      data: {
        name: productName,
        category: productTemplate.category,
        quantity: Math.floor(Math.random() * 500) + 50,
        unit: ['kg', 'ton', 'units', 'boxes'][Math.floor(Math.random() * 4)],
        price: Math.round((Math.random() * 50 + 5) * 100) / 100,
        quality: getRandomItem(['Premium', 'Grade A', 'Standard', 'Organic']),
        harvestDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        images: productTemplate.images.map(img => `${img}?w=800&q=80`),
        isAvailable: Math.random() > 0.1,
        farmerId: farmer.id,
      },
    });
    products.push(product);
  }

  console.log('📦 Creating orders...');
  // Create 30 orders
  const orders = [];
  for (let i = 0; i < 30; i++) {
    const buyer = getRandomItem(buyers);
    const orderProducts = getRandomItems(products, Math.floor(Math.random() * 3) + 1);
    const farmer = await prisma.user.findUnique({ where: { id: orderProducts[0].farmerId } });

    let totalAmount = 0;
    const orderItems = orderProducts.map(product => {
      const quantity = Math.floor(Math.random() * 50) + 10;
      const total = quantity * product.price;
      totalAmount += total;
      return {
        productId: product.id,
        quantity,
        price: product.price,
        total,
      };
    });

    const order = await prisma.order.create({
      data: {
        buyerId: buyer.id,
        farmerId: farmer!.id,
        status: getRandomItem([OrderStatus.CONFIRMED, OrderStatus.PENDING, OrderStatus.CANCELLED]),
        totalAmount: Math.round(totalAmount * 100) / 100,
        deliveryAddress: `${Math.floor(Math.random() * 999) + 1} ${getRandomItem(['Rue', 'Avenue', 'Boulevard'])} ${getRandomItem(['Mohamed V', 'Hassan II', 'Zerktouni', 'Anfa'])}, ${buyer.location}`,
        deliveryDate: new Date(Date.now() + Math.random() * 14 * 24 * 60 * 60 * 1000),
        items: {
          create: orderItems,
        },
      },
    });
    orders.push(order);
  }

  console.log('💬 Creating negotiations...');
  for (let i = 0; i < 40; i++) {
    const product = getRandomItem(products);
    const buyer = getRandomItem(buyers);
    const farmer = await prisma.user.findUnique({ where: { id: product.farmerId } });

    const proposedPrice = product.price * (0.7 + Math.random() * 0.25);
    const status = getRandomItem([
      NegotiationStatus.PENDING,
      NegotiationStatus.ACCEPTED,
      NegotiationStatus.REJECTED,
      NegotiationStatus.CANCELLED,
    ]);

    const messages = [
      {
        content: `Hi, I'm interested in your ${product.name}. Can you offer ${Math.round(proposedPrice * 100) / 100} MAD per ${product.unit}?`,
        senderId: buyer.id,
        senderType: UserType.BUYER,
      },
    ];

    // if (status !== NegotiationStatus.PENDING) {
    //   if (status === NegotiationStatus.ACCEPTED) {
    //     messages.push({
    //       content: 'Yes, I can accept that price. When would you like to place the order?',
    //       senderId: farmer!.id,
    //       senderType: UserType.FARMER,
    //     });
    //   } else if (status === NegotiationStatus.REJECTED) {
    //     messages.push({
    //       content: `Sorry, the best I can do is ${Math.round(product.price * 0.95 * 100) / 100} MAD per ${product.unit}.`,
    //       senderId: farmer!.id,
    //       senderType: UserType.FARMER,
    //     });
    //   }
    // }

    await prisma.negotiation.create({
      data: {
        productId: product.id,
        buyerId: buyer.id,
        farmerId: farmer!.id,
        originalPrice: product.price,
        proposedPrice: Math.round(proposedPrice * 100) / 100,
        status,
        messages: {
          create: messages,
        },
      },
    });
  }

  console.log('⭐ Creating reviews...');
  // Create reviews for confirmed orders
  const confirmedOrders = orders.filter(o => o.status === OrderStatus.CONFIRMED);
  for (const order of confirmedOrders.slice(0, 15)) {
    const comments = [
      'Excellent quality and fast delivery!',
      'Very satisfied with the products.',
      'Great farmer, will order again.',
      'Fresh produce, exactly as described.',
      'Good communication and reliable service.',
      'Products arrived in perfect condition.',
      'Fair prices and good quality.',
      'Highly recommend this farmer!',
    ];

    await prisma.review.create({
      data: {
        rating: Math.round((3.5 + Math.random() * 1.5) * 10) / 10,
        comment: getRandomItem(comments),
        reviewerId: order.buyerId,
        reviewedId: order.farmerId,
        orderId: order.id,
      },
    });
  }

  console.log('💬 Creating chat conversations...');
  // Create some chats with unique user pairs
  const createdChatPairs = new Set<string>();
  let chatsCreated = 0;
  const targetChats = Math.min(15, buyers.length * farmers.length);
  
  while (chatsCreated < targetChats) {
    const buyer = getRandomItem(buyers);
    const farmer = getRandomItem(farmers);
    
    // Create a unique key for the user pair (sorted to avoid duplicate pairs in reverse order)
    const pairKey = [buyer.id, farmer.id].sort().join('-');
    
    if (!createdChatPairs.has(pairKey)) {
      createdChatPairs.add(pairKey);
      
      const chat = await prisma.chat.create({
        data: {
          user1Id: buyer.id,
          user2Id: farmer.id,
          lastMessage: 'Hello, I would like to inquire about your products.',
          lastMessageTime: new Date(),
        },
      });
      
      // Add some messages for this chat
      const messageContents = [
        { content: 'Hello, I would like to inquire about your products.', senderId: buyer.id },
        { content: 'Hello! Sure, what would you like to know?', senderId: farmer.id },
        { content: 'Do you have fresh tomatoes available?', senderId: buyer.id },
        { content: 'Yes, we have premium tomatoes. Would you like to place an order?', senderId: farmer.id },
      ];

      for (const msg of messageContents) {
        await prisma.message.create({
          data: {
            chatId: chat.id,
            content: msg.content,
            senderId: msg.senderId,
            isRead: Math.random() > 0.3,
          },
        });
      }
      
      chatsCreated++;
    }
  }

  console.log('✅ Database seeded successfully!');
  console.log(`
📊 Summary:
- Farmers: 10
- Buyers: 10
- Admin: 1
- Products: 100
- Orders: 30
- Negotiations: 40
- Reviews: ~15
- Chats: 15
  `);
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });