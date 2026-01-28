const mongoose = require('mongoose');
require('dotenv').config();

const Design = require('./models/Design');

const removeAllDesigns = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected successfully');

    console.log('🔍 Searching for all designs...\n');

    const designs = await Design.find({});
    
    if (designs.length === 0) {
      console.log('No designs found in the database.\n');
      await mongoose.connection.close();
      console.log('✓ Database connection closed.');
      return;
    }

    console.log(`Found ${designs.length} design(s):\n`);
    designs.forEach((design, index) => {
      console.log(`${index + 1}. Design ID: ${design._id}`);
      console.log(`   Type: ${design.designType}`);
      console.log(`   Status: ${design.status}\n`);
    });

    const result = await Design.deleteMany({});
    console.log(`✓ Successfully deleted ${result.deletedCount} design(s) from the database.\n`);

    await mongoose.connection.close();
    console.log('✓ Database connection closed.');

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
};

removeAllDesigns();
