"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContentModel = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const contentSchema = new mongoose_1.default.Schema({
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
        type: mongoose_1.default.Schema.ObjectId,
        ref: "TagsModel"
    },
    userID: {
        type: mongoose_1.default.Schema.ObjectId,
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
        type: [mongoose_1.default.Schema.ObjectId],
        default: []
    },
    role: {
        type: String,
        enum: ["View", "Edit"],
        default: "Edit"
    }
});
exports.ContentModel = mongoose_1.default.model("ContentModel", contentSchema);
