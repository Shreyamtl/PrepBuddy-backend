const jwt = require("jsonwebtoken");
const User = require("../models/User");

const generateToken = (id) => jwt.sign(
    { id }, 
    process.env.JWT_SECRET, 
    { expiresIn: "7d" }
);
const handleregister = async(req, res)=>{
    try{
        const{username, email , password} = req.body ;

        const exists = await User.findOne({email});
        if(exists) return res.status(400).json({message : "Email already in use"});

        const user = await User.create({username, email , password});
        res.status(201).json({
            _id: user._id,
            username: user.username,
            email: user.email,
            token: generateToken(user._id),
        });
        
    }catch(err){
        console.log(err);
        res.status(500).json({message: err.message});
    }
};

const handlelogin = async(req, res)=>{
    try{
        const{email , password} = req.body ;
        const user = await User.findOne({email});
        if(!user || !(await user.matchPassword(password))) {
            return res.status(401).json({message : " Invalid email or password"});
        }
        res.json({
            _id: user._id,
            username: user.username,
            email: user.email,
            skills: user.skills || [] ,
            token: generateToken(user._id),
        });
    }catch(err){
        res.status(500).json({message: err.message});
    }
};

const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select("-password");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.json({
            _id: user._id,
            username: user.username,
            email: user.email,
            skills: user.skills || [],
        });
    } catch (err) {
        console.error("getProfile error:", err);
        res.status(500).json({ message: err.message });
    }
};
const updateSkills = async (req, res) => {
    try {
        const { skills } = req.body; 
        // Validate skills is an array
        if (!Array.isArray(skills)) {
            return res.status(400).json({ message: "Skills must be an array" });
        }
        const user = await User.findByIdAndUpdate(
            req.user._id,
            { skills },
            { new: true }
        ).select("-password");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.json({
            _id: user._id,
            username: user.username,
            email: user.email,
            skills: user.skills || [],
        });
    } catch (err) {
        console.error("updateSkills error:", err);
        res.status(500).json({ message: err.message });
    }
};
module.exports = {handleregister,handlelogin,getProfile,updateSkills };