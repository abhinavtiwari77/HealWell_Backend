const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
    author:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true,
    },
    community:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Community',
        default:null
    },
    content:{
        type:String,
        trim:true,
        maxlength:2000
    },
    mediaUrl:{
        type:String,
        default:null
    },
    likes:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User'
    }],
    commentsCount:{
        type:Number,
        default:0
    },
    createdAt:{
        type:Date,
        default: Date.now
    }
});

postSchema.virtual('likesCount').get(function(){
    return this.likes?this.likes.length:0;
});

postSchema.set('toJSON',{virtuals:true});
postSchema.set('toObject',{virtuals:true});
module.exports = mongoose.model('Post',postSchema);