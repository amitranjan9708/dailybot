const  mongoose = require('mongoose')



const Userschema = mongoose.Schema({
    tgId :{
        type :String,
        required:true,
        unique : true
    },
    firstName :{
        type: String,
        required: true
    },
    lastName:{
        type:String,
        required:true,
    },
    username:{
        type:String,
        required:true,
        unique:true,
    },
    promptTokens:{
        type:Number,
        required : false
    },
    completionsTokens:{
        type:Number,
        required: false
    },
   

},
{timestamps :true}
)
module.exports =  mongoose.model('user',Userschema)