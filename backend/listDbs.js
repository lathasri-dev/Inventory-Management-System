const { MongoClient } = require('mongodb');
require('dotenv').config();

async function listDatabases() {
  const uri = process.env.MONGO_URI;
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    const adminDb = client.db().admin();
    const result = await adminDb.listDatabases();
    
    console.log("Databases in your MongoDB Atlas Cluster:");
    result.databases.forEach(db => console.log(` - ${db.name} (Size: ${db.sizeOnDisk} bytes)`));
    
  } catch (e) {
    console.error(e);
  } finally {
    await client.close();
  }
}

listDatabases();
