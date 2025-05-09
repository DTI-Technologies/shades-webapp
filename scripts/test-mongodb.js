// Simple script to test MongoDB connection
require('dotenv').config({ path: '.env.local' });
const { MongoClient } = require('mongodb');

// Use the MongoDB URI directly from .env.local
const MONGODB_URI = 'mongodb+srv://invent:u2II1eDc6PKzqoNo@cluster0.vqo1iqt.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

async function main() {
  console.log('Testing MongoDB connection...');

  console.log(`Connecting to MongoDB: ${MONGODB_URI.substring(0, 20)}...`);

  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('Connected successfully to MongoDB');

    const db = client.db();
    console.log(`Database name: ${db.databaseName}`);

    // Get database stats
    const stats = await db.stats();
    console.log('Database stats:', {
      collections: stats.collections,
      views: stats.views,
      objects: stats.objects,
      dataSize: `${(stats.dataSize / (1024 * 1024)).toFixed(2)} MB`,
      storageSize: `${(stats.storageSize / (1024 * 1024)).toFixed(2)} MB`,
      indexes: stats.indexes,
      indexSize: `${(stats.indexSize / (1024 * 1024)).toFixed(2)} MB`,
    });

    // List collections
    const collections = await db.listCollections().toArray();
    console.log('Collections:', collections.map(col => col.name));

  } catch (err) {
    console.error('Error connecting to MongoDB:', err);
  } finally {
    await client.close();
    console.log('MongoDB connection closed');
  }
}

main().catch(console.error);
