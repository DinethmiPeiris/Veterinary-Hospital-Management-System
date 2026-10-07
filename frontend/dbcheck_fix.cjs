const { MongoClient } = require('mongodb');
const uri = "mongodb+srv://natasharuth255_db_user:e0JVGUyszyzkiPny@ruth.tmhfj1q.mongodb.net/VHMS?retryWrites=true&w=majority&appName=Ruth";
async function run() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('VHMS');
    
    // Fix dangling Doctor IDs
    const result = await db.collection('appointments').updateMany(
      { doctorId: 'DOC-001' },
      { $set: { doctorId: 'SJAH-DOC-001' } }
    );
    console.log(`Updated ${result.modifiedCount} appointments from DOC-001 to SJAH-DOC-001.`);
    
  } finally {
    await client.close();
  }
}
run();
