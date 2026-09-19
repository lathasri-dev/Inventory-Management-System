const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const makeAdmin = async () => {
  try {
    const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/inventory_db';
    console.log('Connecting to database...');
    
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected successfully');

    const users = await User.find({});
    console.log(`Found ${users.length} users in the database.`);

    if (users.length === 0) {
      console.log('No users found in the database. Please register an account first!');
    } else {
      // Make the first user an admin
      const user = users[0];
      user.role = 'admin';
      await user.save();
      console.log(`Success! Updated user ${user.email} to Admin role.`);
      
      // If there are more users, list them
      if (users.length > 1) {
        console.log('Other users in the database:');
        users.slice(1).forEach(u => console.log(`- ${u.email} (${u.role})`));
      }
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
    process.exit(0);
  }
};

makeAdmin();
