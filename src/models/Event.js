const mongoose= require('mongoose')


const eventSchema = mongoose.Schema({
    text:{
        type:String,
        required:true
    },
    tgId:{
        type:String,
        required:true
    }
},
{timestamps:true}
);

 module.exports  =mongoose.model('Event',eventSchema);