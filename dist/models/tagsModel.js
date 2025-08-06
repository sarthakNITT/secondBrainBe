"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.tagsModel = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const tagsSchema = new mongoose_1.default.Schema({
    tagTitle: { type: [String], required: true }
});
exports.tagsModel = mongoose_1.default.model("TagsModel", tagsSchema);
