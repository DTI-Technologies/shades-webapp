import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import clientPromise from '@/lib/mongodb';
import { MongoClient } from 'mongodb';

// This ensures the API route is not statically generated
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Test mongoose connection
    console.log('Testing mongoose connection...');
    await dbConnect();
    console.log('Mongoose connection successful!');

    // Test mongodb connection
    console.log('Testing mongodb connection...');
    const client: MongoClient = await clientPromise;
    const db = client.db();
    
    // Get database stats
    const stats = await db.stats();
    
    // Get collection names
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(col => col.name);

    return NextResponse.json({
      success: true,
      message: 'MongoDB connection successful',
      database: {
        name: db.databaseName,
        stats: {
          collections: stats.collections,
          views: stats.views,
          objects: stats.objects,
          avgObjSize: stats.avgObjSize,
          dataSize: stats.dataSize,
          storageSize: stats.storageSize,
          indexes: stats.indexes,
          indexSize: stats.indexSize,
        },
        collections: collectionNames
      }
    });
  } catch (error) {
    console.error('MongoDB connection error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: `Failed to connect to MongoDB: ${error instanceof Error ? error.message : String(error)}` 
      },
      { status: 500 }
    );
  }
}
