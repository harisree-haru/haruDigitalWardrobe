require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

const removeCustomers = async () => {
  try {
    console.log('🔍 Searching for customer users...\n');

    // Find all customer users first
    const customers = await User.find({ role: 'customer' });
    
    if (customers.length === 0) {
      console.log('✓ No customer users found in the database.');
      return;
    }

    console.log(`Found ${customers.length} customer user(s):\n`);
    customers.forEach((customer, index) => {
      console.log(`${index + 1}. ${customer.firstName} ${customer.lastName}`);
      console.log(`   Email: ${customer.email}`);
      console.log(`   Username: ${customer.username}\n`);
    });

    // Delete all customer users
    const result = await User.deleteMany({ role: 'customer' });
    
    console.log(`\n✓ Successfully deleted ${result.deletedCount} customer user(s) from the database.`);
    console.log('\n📊 Remaining users:');
    
    // Show remaining users
    const remainingUsers = await User.find({});
    if (remainingUsers.length === 0) {
      console.log('   No users remaining in database.');
    } else {
      remainingUsers.forEach((user, index) => {
        console.log(`${index + 1}. ${user.firstName} ${user.lastName} (${user.role})`);
        console.log(`   Email: ${user.email}\n`);
      });
    }

  } catch (error) {
    console.error('❌ Error removing customers:', error.message);
  } finally {
    mongoose.connection.close();
    console.log('\n✓ Database connection closed.');
  }
};

connectDB().then(() => {
  removeCustomers();
});
