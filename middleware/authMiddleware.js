const jwt = require("jsonwebtoken");

module.exports = (req,res,next) =>{
    const authHeader = req.header('Authorization');

    if(!authHeader){
        return res.status(401).json({msg:"No token provided, Authorization denied"});
    }
    const parts = authHeader.split(" ");
    if(parts.length!==2 || parts[0]!== "Bearer"){
        return res.status(401).json({msg:"Invalid token format"});
    }
    const token = parts[1];

    try{
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET || "devsecret"
        );
        req.user = decoded;
        next();
    }catch(err){
        console.error("JWT verification failed:",err.message);
        return res.status(401).json({msg:"Token is invalid or expired"});
    }
};