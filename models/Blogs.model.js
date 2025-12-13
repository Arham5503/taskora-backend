import mongoose from "mongoose";

const blogSchema=mongoose.Schema({
    date:{
        type:Date,
        default:Date.now
    },
    slug:{
        type:String
    },
    title:{
        type:String
    },
    content:{
        type:String
    }
})

const BlogsModel = mongoose.model("blog",blogSchema)
export default BlogsModel