require('dotenv').config();
const mongoose = require('mongoose');
const Outfit = require('./models/Outfit');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

const removeAllOutfits = async () => {
  try {
    console.log('\n🗑️  Removing all outfits from database...\n');

    const result = await Outfit.deleteMany({});
    
    console.log(`✅ Successfully deleted ${result.deletedCount} outfits\n`);
    console.log('💡 This was necessary because the Outfit schema was updated with new fields.\n');

  } catch (error) {
    console.error('❌ Error removing outfits:', error.message);
    console.error(error.stack);
  } finally {
    mongoose.connection.close();
    console.log('✅ Database connection closed.\n');
  }
};

connectDB().then(() => {
  removeAllOutfits();
});
