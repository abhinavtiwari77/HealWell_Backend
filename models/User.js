const mongoose  = require("mongoose");

const userSchema = new mongoose.Schema({
    name:{
        type:String,
        required:[true,'Name is required'],
        trim:true,
        minlength: 2,
        maxlength: 100
    },
    email:{
        type:String,
        required:[true,"Email is required"],
        unique:true,
        trim:true,
        lowercase:true,
        match:[/^\S+@\S+\.\S+$/, "Please provide a valid email address"]
    },
    passwordHash:{
        type:String,
        required:[true,"Password is required"]
    },
    bio:{
        type:String,
        trim:true,
        maxlength: 500
    },
    profilePicUrl: {
    type: String,
    default: null
    },
    interests:{
        type:[String],
        default:[]
    },
    isAdmin:{
        type:Boolean,
        default:false
    },
    followers: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
    ],

  following: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
    ],
    createdAt:{
        type:Date,
        default:Date.now
    },
});

userSchema.methods.toJSON = function(){
    const obj = this.toObject();
    delete obj.passwordHash;
    return obj;
};

userSchema.methods.comparePassword = async function (plainPassword, bcrypt) {
    if(!bcrypt) throw new Error("bcrypt is required for comparing the password");
    return bcrypt.compare(plainPassword , this.passwordHash);    
};

module.exports = mongoose.model('User',userSchema);