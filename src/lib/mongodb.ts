import { MongoClient } from 'mongodb';

// Connection options
const options = {
  maxPoolSize: 10, // Maintain up to 10 socket connections
  serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
  socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
  connectTimeoutMS: 10000, // Give up initial connection after 10 seconds
  retryWrites: true,
  retryReads: true,
};

// Check if we're in a build environment (Vercel build)
const isBuildEnvironment = process.env.VERCEL_ENV === 'preview' ||
                          (process.env.NODE_ENV === 'production' && typeof window === 'undefined' && process.env.NEXT_PUBLIC_SKIP_API_CALLS === 'true');

let clientPromise: Promise<MongoClient>;

if (isBuildEnvironment) {
  // During build time, we don't want to connect to MongoDB
  // This is a special case for Vercel's build process
  console.log('Build environment detected, using a dummy MongoDB client');

  // Create a dummy client that won't actually connect
  clientPromise = Promise.resolve({} as unknown as MongoClient);
} else {
  // For actual development and production environments
  if (!process.env.MONGODB_URI) {
    throw new Error('Please add your MongoDB URI to environment variables');
  }

  const uri = process.env.MONGODB_URI;

  if (process.env.NODE_ENV === 'development') {
    // In development mode, use a global variable so that the value
    // is preserved across module reloads caused by HMR (Hot Module Replacement).
    let globalWithMongo = global as typeof globalThis & {
      _mongoClientPromise?: Promise<MongoClient>;
    };

    if (!globalWithMongo._mongoClientPromise) {
      const client = new MongoClient(uri, options);
      globalWithMongo._mongoClientPromise = client.connect()
        .catch(err => {
          console.error('Failed to connect to MongoDB:', err);
          throw err;
        });
    }
    clientPromise = globalWithMongo._mongoClientPromise;
  } else {
    // In production mode, it's best to not use a global variable.
    const client = new MongoClient(uri, options);
    clientPromise = client.connect()
      .catch(err => {
        console.error('Failed to connect to MongoDB in production:', err);
        throw err;
      });
  }
}

// Export a module-scoped MongoClient promise. By doing this in a
// separate module, the client can be shared across functions.
export default clientPromise;
