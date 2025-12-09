const mongoose = require("mongoose");
const connectDB = async()=>{
    const uri = process.env.MONGODB_URI;
    if(!uri){
        console.log("MONGODB_URI not set in .env");
        process.exit(1);//basically a failure- kills the app
    }

    try{
        const conn = await mongoose.connect(uri);
        console.log("MongoDB connected");
    }
    catch(err){
        console.error("MONGODB connection error:",err.message);
        process.exit(1);
    }
};

module.exports = connectDB;