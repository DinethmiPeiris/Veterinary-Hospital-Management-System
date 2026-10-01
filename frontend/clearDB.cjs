const { MongoClient } = require('mongodb');

const uri = "mongodb+srv://natasharuth255_db_user:e0JVGUyszyzkiPny@ruth.tmhfj1q.mongodb.net/VHMS?retryWrites=true&w=majority&appName=Ruth";
const client = new MongoClient(uri);

async function run() {
    try {
        await client.connect();
        const db = client.db("VHMS");

        const collections = await db.collections();
        if (collections.length === 0) {
            console.log("Database is already empty.");
            return;
        }

        for (let collection of collections) {
            await collection.drop();
            console.log(`Dropped collection: ${collection.collectionName}`);
        }

        console.log("All backend data cleared successfully.");
    } catch (error) {
        console.error("Error clearing DB:", error);
    } finally {
        await client.close();
    }
}

run();
