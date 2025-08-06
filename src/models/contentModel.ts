import mongoose from "mongoose";

const contentSchema = new mongoose.Schema({
    type: {
        type: String, 
        required: true, 
        enum: ["document", "text", "youtube", "link"]
    },
    link: {
        type: String, 
        unique: true, 
        required: true
    },
    title: {
        type: String, 
        required: true,
        unique: true
    },
    tagsID: {
        type: mongoose.Schema.ObjectId, 
        ref: "TagsModel"
    },
    userID: {
        type: mongoose.Schema.ObjectId, 
        ref: "UserModel", 
        required: true
    },
    shareLink: {
        type: String, 
        default: null
    },
    visibility: {
        type: String, 
        enum: ["Private", "Anyone with the link", "Restricted"], 
        required: true,
        default: "Private"
    },
    sharedWith: {
        type: [mongoose.Schema.ObjectId],
        default: []
    },
    role: {
        type: String,
        enum: ["View", "Edit"],
        default: "Edit"
    }
})

export const ContentModel = mongoose.model("ContentModel", contentSchema)