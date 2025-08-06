import mongoose, { mongo } from "mongoose";

const tagsSchema = new mongoose.Schema({
    tagTitle: {type: [String], required: true}
})

export const tagsModel = mongoose.model("TagsModel", tagsSchema)