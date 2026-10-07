const { MongoClient } = require('mongodb');
const uri = "mongodb+srv://natasharuth255_db_user:e0JVGUyszyzkiPny@ruth.tmhfj1q.mongodb.net/VHMS?retryWrites=true&w=majority&appName=Ruth";
async function run() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('VHMS');
    
    const docs = await db.collection('doctors').find({}).toArray();
    console.log("Valid Doctor IDs/StaffIDs:", docs.map(d => d.staffId || d._id.toString()));
    
    const appointments = await db.collection('appointments').find({}).toArray();
    const invalidAppts = appointments.filter(a => a.doctorId && !docs.some(d => d.staffId === a.doctorId || d._id.toString() === a.doctorId));
    console.log("Dangling Doctor IDs in Appointments:", invalidAppts.map(a => `${a.id || a._id}: ${a.doctorId}`));
  } finally {
    await client.close();
  }
}
run();
