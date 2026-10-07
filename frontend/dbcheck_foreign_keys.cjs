const { MongoClient } = require('mongodb');
const uri = "mongodb+srv://natasharuth255_db_user:e0JVGUyszyzkiPny@ruth.tmhfj1q.mongodb.net/VHMS?retryWrites=true&w=majority&appName=Ruth";
async function run() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('VHMS');
    
    const users = await db.collection('users').find({}).toArray();
    const ownerCache = new Set(users.map(u => u._id.toString()));
    
    const pets = await db.collection('pets').find({}).toArray();
    const petCache = new Set(pets.map(p => p._id.toString()));
    
    const appointments = await db.collection('appointments').find({}).toArray();
    
    const invalidOwners = [];
    const invalidPets = [];
    
    for (let appt of appointments) {
       // Only checking ObjectId format, since mock data often uses string "PO-XXXX" or "PET-XXX" 
       // which isn't linked to real User/Pet _ids. Let's see how many are standard strings vs objectIds.
       if (appt.ownerId && !ownerCache.has(appt.ownerId)) {
           invalidOwners.push(appt.ownerId);
       }
       if (appt.petId && !petCache.has(appt.petId)) {
           invalidPets.push(appt.petId);
       }
    }
    
    console.log(`Appointments with unmatched ownerId: ${invalidOwners.length}`);
    if (invalidOwners.length > 0) console.log("Sample missing ownerIds:", [...new Set(invalidOwners)].slice(0, 5));
    
    console.log(`Appointments with unmatched petId: ${invalidPets.length}`);
    if (invalidPets.length > 0) console.log("Sample missing petIds:", [...new Set(invalidPets)].slice(0, 5));
    
  } finally {
    await client.close();
  }
}
run();
