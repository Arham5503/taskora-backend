import mongoose from "mongoose";
const mongo=mongoose

const signupSchema=new mongo.Schema({

        username: {
         type: String,
         required: true,
          unique: true,
          trim: true
             },
        email:{
            type:String,
            required:true,
            unique:true,
            trim:true
        },
        password:{
            type:String,
            required:true,
            minLength:8
        },
        // profile:{
        //     type:String,
        //     default:""
        // },
         createdAt: {
    type: Date,
    default: Date.now
  }
})

const Signup = mongoose.model("SignUp", signupSchema);
export default Signup
