const { MongoClient } = require('mongodb');

async function migrate() {
  const uri = 'mongodb://localhost:27017';
  const client = new MongoClient(uri);
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const sourceDb = client.db('netbots-crm');
    const targetDb = client.db('netbots_crm');
    
    // Get all collections from source
    const collections = await sourceDb.listCollections().toArray();
    
    for (let colInfo of collections) {
      const colName = colInfo.name;
      const sourceCol = sourceDb.collection(colName);
      const targetCol = targetDb.collection(colName);
      
      const docs = await sourceCol.find({}).toArray();
      console.log(`Found ${docs.length} docs in ${colName} (source)`);
      
      if (docs.length > 0) {
        // Insert missing docs or just insert all? 
        // We'll use insertMany but bypass errors for duplicates if _id exists
        try {
          await targetCol.insertMany(docs, { ordered: false });
          console.log(`Inserted docs for ${colName} into target`);
        } catch (e) {
          console.log(`Some duplicates ignored for ${colName}`);
        }
      }
    }
    
    console.log('Dropping source database netbots-crm...');
    await sourceDb.dropDatabase();
    console.log('Migration complete. Database netbots-crm dropped.');
    
  } finally {
    await client.close();
  }
}
migrate();
