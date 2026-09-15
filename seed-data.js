const { MongoClient } = require('mongodb');

// URI matches application.properties
const uri = "mongodb+srv://natasharuth255_db_user:e0JVGUyszyzkiPny@ruth.tmhfj1q.mongodb.net/VHMS?retryWrites=true&w=majority&appName=Ruth";
const client = new MongoClient(uri);

async function run() {
  try {
    await client.connect();
    const db = client.db('VHMS');
    
    // Seed a dummy appointment for the doctor UI
    const appointmentsCollection = db.collection('appointments');
    await appointmentsCollection.deleteMany({ _id: "APP-101" });
    await appointmentsCollection.insertOne({
      _id: "APP-101",
      petId: "PET-101",
      petName: "Buddy",
      ownerName: "John Doe",
      doctorId: "DOC-001",
      doctorName: "Dr. Smith",
      appointmentDate: new Date(),
      status: "SCHEDULED",
      reason: "Annual checkup and vaccination"
    });
    
    // Seed the doctor
    const doctorsCollection = db.collection('doctors');
    await doctorsCollection.deleteMany({ _id: "DOC-001" });
    await doctorsCollection.insertOne({
      _id: "DOC-001",
      name: "Dr. Smith",
      specialization: "General Practice"
    });
    
    console.log("Seed data inserted successfully!");
  } finally {
    await client.close();
  }
}

run().catch(console.dir);
