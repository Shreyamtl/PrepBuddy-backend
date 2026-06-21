const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const bcrypt = require("bcryptjs");

const userSchema = new Schema({
    username:{
        type: String,
        required: true,
        trim: true
    },
    email:{
        type: String,
        required: true, 
        unique: true,
        lowercase: true
    },
    password:{
        type: String,
        required: true,
        minlength: 6
    }, 
    skills: { 
        type: [String], 
        default: [] 
    },
});
userSchema.pre("save", async function() {
  if (!this.isModified("password")) return ;
  this.password = await bcrypt.hash(this.password, 12);
  
});

userSchema.methods.matchPassword = async function(enteredpw){
    return await bcrypt.compare(enteredpw, this.password)
}
module.exports = mongoose.model('User' , userSchema);