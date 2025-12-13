import BlogsModel from "../models/Blogs.model.js"

// Create New Blog
export const creatBlog= async (req,res)=>{
    try {
        const {title,content,slug}=req.body
        if(!title|| !content){
            res.status(400).json({message:"Fill missing fields"})
            return 
        }
        const record= new BlogsModel({title,content,slug})
        await record.save()
      return  res.status(200).json({message:"Blog saved successfully"})
    } catch (error) {
        console.error(error);
    res.status(500).json({ message: "Server error" });
    }
}
//Fetch all blog
export const fetchBlog=async (req,res)=>{
    try {
    const data=await BlogsModel.find()
    if(data.length<1){
        res.status(200).json({message:"No Post Found"})
    }
    res.status(200).json(data)
    } catch (error) {
        console.error(error);
    return res.status(500).json({ message: "Server error" });
    }

}
