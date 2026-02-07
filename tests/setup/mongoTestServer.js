/**
 * MongoDB Memory Server Helper
 * Provides in-memory MongoDB instance for integration tests
 */
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

let mongoServer;

/**
 * Connect to in-memory MongoDB before tests
 */
async function connect() {
    // Create in-memory MongoDB instance
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();

    // Configure mongoose
    await mongoose.connect(mongoUri, {
        // Mongoose 8+ doesn't need these options
    });

    return mongoUri;
}

/**
 * Clear all collections between tests
 */
async function clearDatabase() {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
        await collections[key].deleteMany({});
    }
}

/**
 * Close connection and stop MongoDB server
 */
async function disconnect() {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    if (mongoServer) {
        await mongoServer.stop();
    }
}

module.exports = {
    connect,
    clearDatabase,
    disconnect,
};
