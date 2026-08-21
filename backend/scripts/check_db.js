const mongoose = require('mongoose');

const mongoURI = 'mongodb://localhost:27017/inventory_db';

async function main() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    console.log('URL:', mongoURI);
    await mongoose.connect(mongoURI);
    console.log('✅ Connected successfully!');
    
    const db = mongoose.connection.db;
    
    // Check database info
    console.log('\n📊 Database Information:');
    console.log('Name:', db.databaseName);
    
    // List all collections
    const collections = await db.listCollections().toArray();
    console.log('\n📁 Collections:');
    if (collections.length === 0) {
      console.log('No collections found');
    } else {
      collections.forEach(col => console.log(`- ${col.name}`));
    }
    
    // Check products collection
    const productsCollection = db.collection('products');
    const count = await productsCollection.countDocuments();
    console.log('\n🛍️  Products Collection:');
    console.log(`Total documents: ${count}`);
    
    if (count > 0) {
      console.log('\nSample Products:');
      const samples = await productsCollection.find({}).limit(3).toArray();
      samples.forEach(product => {
        console.log(`- ${product.name} (${product.item_number}): $${product.price}`);
      });
    }

    await mongoose.disconnect();
    console.log('\n🔌 Connection closed');
  } catch (err) {
    console.error('Error checking DB:', err.message);
    process.exit(2);
  }
}

main();
