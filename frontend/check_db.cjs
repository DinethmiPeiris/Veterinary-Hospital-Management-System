const { MongoClient } = require('mongodb');

async function checkDB() {
    const uri = 'mongodb+srv://natasharuth255_db_user:e0JVGUyszyzkiPny@ruth.tmhfj1q.mongodb.net/VHMS?retryWrites=true&w=majority&appName=Ruth';
    const client = new MongoClient(uri);

    try {
        await client.connect();
        const db = client.db('VHMS');

        const pets = await db.collection('pets').find({}).toArray();
        console.log('--- ALL PETS IN DB ---');
        pets.forEach(p => console.log(`[${p._id}] Name: ${p.name}, Owner: ${p.ownerName} / ${p.ownerId[0]}`));

        const appts = await db.collection('appointments').find({}).toArray();
        console.log('\n--- ALL APPOINTMENTS IN DB ---');
        appts.forEach(a => console.log(`[${a._id}] PetName: ${a.petName}, Date: ${a.date}, Doctor: ${a.doctorName}`));

    } finally {
        await client.close();
    }
}
checkDB().catch(console.error);
