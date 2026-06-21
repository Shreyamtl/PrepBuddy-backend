const jwt = require("jsonwebtoken");
const User = require("../models/User");
 
const verifyJWT = async (req , res , next)=>{
    const authHeader = req.headers.authorization || req.headers.Authorization ;

    if(!authHeader?.startsWith('Bearer ')) return res.sendStatus(401);
    try{
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.id).select("-password");
        next();
    }catch{
        res.status(401).json({ message: "Not authorized,token failed" });
    }
};

module.exports = {verifyJWT} ;
