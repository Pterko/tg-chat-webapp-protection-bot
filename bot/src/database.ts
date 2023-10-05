import mongoose from 'mongoose';



const db = mongoose.connection;

function connect(){
  mongoose.connect(String(process.env.MONGO_URI));
  db.on('error', console.error.bind(console, 'MongoDB connection error:'));
  db.once('open', function() {
  console.log("Connected to MongoDB successfully!");
});
}



export default connect;
