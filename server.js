require('dotenv').config()
const express = require("express");
const cors = require('cors');
const connectDB = require("./config/db");
const authRoutes = require('./routes/authRoutes');
const postRoutes = require('./routes/postRoutes');
const userRoutes = require('./routes/userRoutes');
const app = express();

app.use(cors());
app.use(express.json());

connectDB();

app.use('/api/auth',authRoutes);
app.use('/api/posts',postRoutes);
app.use('/api/user',userRoutes);


app.get('/',(req,res)=> res.send("Wellness api running"));

app.use((err,req,res,next)=>{
    console.error(err);
    res.status(err.status || 500).json({
        error:err.message || "Internal Server error"
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT,()=>{
    console.log(`Server listening on PORT ${PORT}`);
})