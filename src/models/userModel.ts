import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    username: {type: String, required: true, unique: true},
    password: {type: String, required: true},
    refreshToken: [{type: String}],
    tokenVersion: {type: Number, required: true, default: 1}
},{
    timestamps: true
})

export const UserModel = mongoose.model("UserModel", userSchema)