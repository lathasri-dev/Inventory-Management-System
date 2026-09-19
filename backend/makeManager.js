const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const makeManager = async () => {
  try {
    const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/inventory_db';
    console.log('Connecting to database...');
    
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected successfully');

    // Find srinu@gmail.com
    const user = await User.findOne({ email: 'srinu@gmail.com' });

    if (!user) {
      console.log('User srinu@gmail.com not found!');
    } else {
      user.role = 'manager';
      await user.save();
      console.log(`Success! Updated user ${user.email} to Manager role.`);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
    process.exit(0);
  }
};

makeManager();
