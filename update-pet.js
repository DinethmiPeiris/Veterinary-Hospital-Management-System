const { MongoClient } = require('mongodb');

async function main() {
    const uri = "mongodb+srv://natasharuth255_db_user:e0JVGUyszyzkiPny@ruth.tmhfj1q.mongodb.net/VHMS?retryWrites=true&w=majority&appName=Ruth";
    const client = new MongoClient(uri);

    try {
        await client.connect();
        const db = client.db('VHMS');
        
        // Find if collection is pets or pet
        const collections = await db.listCollections().toArray();
        console.log("Collections:", collections.map(c => c.name));
        
        const petsCol = db.collection('pet'); // Usually singular in Spring Data unless specified
        const result = await petsCol.updateMany(
            { ownerId: "PO-2222" },
            { $set: { ownerId: "PO-2490" } }
        );
        
        console.log(`Matched ${result.matchedCount} and modified ${result.modifiedCount} pet(s)`);

        const petsCol2 = db.collection('pets');
        const result2 = await petsCol2.updateMany(
            { ownerId: "PO-2222" },
            { $set: { ownerId: "PO-2490" } }
        );
        console.log(`Matched ${result2.matchedCount} and modified ${result2.modifiedCount} pets(s)`);

    } finally {
        await client.close();
    }
}

main().catch(console.error);
