import mongoose from 'mongoose';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/signet';

let isConnected = false;

export async function connectDB() {
  if (isConnected) return;

  try {
    await mongoose.connect(MONGO_URI);
    isConnected = true;
    console.log(`[SIGNET] MongoDB connected: ${mongoose.connection.host}`);
  } catch (err) {
    console.error('[SIGNET] MongoDB connection failed:', err.message);
    // Don't crash the server — allow it to run without DB for development
    console.warn('[SIGNET] Running without database persistence. Validation results will not be saved.');
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  if (isConnected) {
    await mongoose.connection.close();
    console.log('[SIGNET] MongoDB disconnected on app termination');
  }
  process.exit(0);
});

export default mongoose;
