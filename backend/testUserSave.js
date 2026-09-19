const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const testUserCreation = async () => {
  try {
    const MONGO_URI = process.env.MONGO_URI;
    console.log('Connecting to database...');
    
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected successfully');

    const email = `testmanager${Date.now()}@example.com`;
    const user = new User({
      fullName: 'Test Manager',
      email: email,
      password: 'Password123!',
      phone: '1234567890',
      role: 'manager'
    });

    await user.save();
    console.log(`Success! Created user ${user.email} with role: ${user.role}`);

    const foundUser = await User.findOne({ email });
    console.log(`Found in DB: ${foundUser.email}, Role: ${foundUser.role}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
    process.exit(0);
  }
};

testUserCreation();
