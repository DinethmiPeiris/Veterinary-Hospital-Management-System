const { MongoClient } = require('mongodb');

const uri = "mongodb+srv://natasharuth255_db_user:e0JVGUyszyzkiPny@ruth.tmhfj1q.mongodb.net/VHMS?retryWrites=true&w=majority&appName=Ruth";

async function run() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db('VHMS');
    
    console.log("Connected to MongoDB VHMS");
    
    const collections = await db.listCollections().toArray();
    console.log("Collections:", collections.map(c => c.name));

    // Check Appointments
    console.log("\n--- Checking Appointments ---");
    const appointments = await db.collection('appointments').find({}).toArray();
    console.log(`Total appointments: ${appointments.length}`);
    
    const statusCounts = {};
    const invalidAppointments = [];
    const missingDoctors = [];
    
    const docCache = {};
    const docs = await db.collection('doctors').find({}).toArray();
    docs.forEach(d => docCache[d.staffId || d._id.toString()] = true);
    
    for (let appt of appointments) {
        // count statuses
        statusCounts[appt.status] = (statusCounts[appt.status] || 0) + 1;
        
        // check dangling doctors
        if (appt.doctorId && !docCache[appt.doctorId]) {
            missingDoctors.push(appt.doctorId);
        }
        
        if (!appt.status) {
            invalidAppointments.push(`Appt ${appt.id || appt._id} has NO status!`);
        }
    }
    
    console.log("Appointment Statuses:", statusCounts);
    if (missingDoctors.length > 0) {
        console.log(`Found ${missingDoctors.length} appointments with non-existent doctor IDs (e.g. ${missingDoctors[0]})`);
    } else {
        console.log("All assigned doctorIds exist in the doctors collection.");
    }
    
    if (invalidAppointments.length > 0) {
        console.log("Invalid Appointments:", invalidAppointments.slice(0, 5));
    }
    
    // Check Invoices
    console.log("\n--- Checking Invoices ---");
    const invoices = await db.collection('invoices').find({}).toArray();
    console.log(`Total invoices: ${invoices.length}`);
    let missingApptForInvoice = 0;
    const apptIds = appointments.map(a => a.appointmentNumber || a.id || a._id.toString());
    
    for (let inv of invoices) {
        if (inv.appointmentNumber && !apptIds.includes(inv.appointmentNumber)) {
             missingApptForInvoice++;
        }
    }
    
    if (missingApptForInvoice > 0) {
        console.log(`Found ${missingApptForInvoice} invoices with an appointmentNumber that doesn't exist in DB.`);
    }

  } catch (err) {
    console.error(err);
  } finally {
    await client.close();
  }
}

run();
