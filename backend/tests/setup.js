const mongoose = require('mongoose');

process.env.JWT_SECRET = 'test-secret-key';

beforeAll(async () => {
  const mongoUri = 'mongodb://127.0.0.1:27017/netbots-crm-test';
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  await mongoose.disconnect();
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany();
  }
});
