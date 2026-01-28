require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const { generateRSAKeyPair, encryptPrivateKey } = require('./services/encryptionService');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

const seedStylists = async () => {
  try {
    console.log('\n🎨 Seeding Stylists with Encryption Keys...\n');

    // Define stylist accounts
    const stylists = [
      {
        username: 'stylist_emma',
        email: 'emma.stylist@example.com',
        password: 'password123',
        firstName: 'Emma',
        lastName: 'Wilson',
        role: 'stylist',
        bio: 'Professional fashion stylist specializing in modern and minimalist aesthetics. 8+ years experience.',
        isAvailable: true,
        maxAssignments: 15,
        currentAssignments: 0
      },
      {
        username: 'stylist_james',
        email: 'james.stylist@example.com',
        password: 'password123',
        firstName: 'James',
        lastName: 'Rodriguez',
        role: 'stylist',
        bio: 'Expert in formal wear and business attire. Helping professionals look their best.',
        isAvailable: true,
        maxAssignments: 12,
        currentAssignments: 0
      },
      {
        username: 'stylist_sophia',
        email: 'sophia.stylist@example.com',
        password: 'password123',
        firstName: 'Sophia',
        lastName: 'Chen',
        role: 'stylist',
        bio: 'Casual and streetwear specialist. Creating effortlessly cool everyday looks.',
        isAvailable: true,
        maxAssignments: 20,
        currentAssignments: 0
      },
      {
        username: 'stylist_michael',
        email: 'michael.stylist@example.com',
        password: 'password123',
        firstName: 'Michael',
        lastName: 'Thompson',
        role: 'stylist',
        bio: 'Luxury fashion consultant with expertise in high-end designer pieces.',
        isAvailable: true,
        maxAssignments: 10,
        currentAssignments: 0
      },
      {
        username: 'stylist_olivia',
        email: 'olivia.stylist@example.com',
        password: 'password123',
        firstName: 'Olivia',
        lastName: 'Martinez',
        role: 'stylist',
        bio: 'Sustainable fashion advocate. Eco-friendly styling with a modern twist.',
        isAvailable: true,
        maxAssignments: 15,
        currentAssignments: 0
      }
    ];

    // Check if stylists already exist
    const existingStylists = await User.find({ role: 'stylist' });
    if (existingStylists.length > 0) {
      console.log(`⚠️  Found ${existingStylists.length} existing stylists. Clearing...`);
      await User.deleteMany({ role: 'stylist' });
    }

    console.log('📝 Creating stylists with RSA key pairs...\n');

    for (const stylistData of stylists) {
      // Generate RSA key pair for stylist
      console.log(`🔑 Generating keys for ${stylistData.firstName} ${stylistData.lastName}...`);
      const { publicKey, privateKey } = generateRSAKeyPair();
      
      // Encrypt private key with stylist's password
      const encryptedPrivateKey = encryptPrivateKey(privateKey, stylistData.password);
      
      // Create stylist user
      const stylist = new User({
        ...stylistData,
        publicKey,
        encryptedPrivateKey,
        keyGeneratedAt: new Date()
      });
      
      await stylist.save();
      
      console.log(`✅ Created: ${stylist.firstName} ${stylist.lastName}`);
      console.log(`   Email: ${stylist.email}`);
      console.log(`   Max Assignments: ${stylist.maxAssignments}`);
      console.log(`   Public Key: ${publicKey.substring(0, 50)}...`);
      console.log('');
    }

    console.log(`\n✨ Successfully seeded ${stylists.length} stylists!\n`);
    console.log('📋 Stylist Accounts:\n');
    
    stylists.forEach((s, index) => {
      console.log(`${index + 1}. ${s.firstName} ${s.lastName}`);
      console.log(`   Email: ${s.email}`);
      console.log(`   Password: password123`);
      console.log(`   Specialization: ${s.bio.split('.')[0]}`);
      console.log('');
    });

    console.log('🔐 All stylists have been assigned RSA-2048 key pairs for secure communication.\n');

  } catch (error) {
    console.error('❌ Error seeding stylists:', error.message);
    console.error(error.stack);
  } finally {
    mongoose.connection.close();
    console.log('✅ Database connection closed.\n');
  }
};

connectDB().then(() => {
  seedStylists();
});
