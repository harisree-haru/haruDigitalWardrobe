require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

const seedUsers = async () => {
  try {
    // Clear existing users
    await User.deleteMany({});
    console.log('Cleared existing users');

    const salt = await bcrypt.genSalt(10);

    const users = [
      {
        username: 'customeruser',
        email: 'customer@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        role: 'customer',
        bio: 'Fashion enthusiast looking for styling tips'
      },
      {
        username: 'stylist_pro',
        email: 'stylist@example.com',
        password: 'password123',
        firstName: 'Jane',
        lastName: 'Smith',
        role: 'stylist',
        bio: 'Professional stylist with 5+ years experience'
      },
      {
        username: 'fashionista',
        email: 'fashion@example.com',
        password: 'password123',
        firstName: 'Sarah',
        lastName: 'Johnson',
        role: 'customer',
        bio: 'Love trying new outfit combinations'
      },
      {
        username: 'style_expert',
        email: 'expert@example.com',
        password: 'password123',
        firstName: 'Michael',
        lastName: 'Brown',
        role: 'stylist',
        bio: 'Specializing in personal wardrobe consultation'
      },
      {
        username: 'admin_user',
        email: 'admin@example.com',
        password: 'password123',
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
        bio: 'System administrator'
      }
    ];

    // Hash passwords and create users
    const hashedUsers = await Promise.all(
      users.map(async (user) => {
        const hashedPassword = await bcrypt.hash(user.password, salt);
        return { ...user, password: hashedPassword };
      })
    );

    await User.insertMany(hashedUsers);
    console.log('✓ Seeded 5 users successfully');
    console.log('\nSeeded Users:');
    console.log('1. Customer - Email: customer@example.com, Password: password123');
    console.log('2. Stylist - Email: stylist@example.com, Password: password123');
    console.log('3. Customer - Email: fashion@example.com, Password: password123');
    console.log('4. Stylist - Email: expert@example.com, Password: password123');
    console.log('5. Admin - Email: admin@example.com, Password: password123');

  } catch (error) {
    console.error('Error seeding users:', error.message);
  } finally {
    mongoose.connection.close();
  }
};

connectDB().then(() => {
  seedUsers();
});
