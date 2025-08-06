"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkOwnerUsingParamsTokenMiddleware = void 0;
const path_1 = __importDefault(require("path"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
const contentModel_1 = require("../models/contentModel");
const mongoose_1 = __importDefault(require("mongoose"));
dotenv_1.default.config({ path: path_1.default.resolve("../../.env") });
const SHARE_LINK_SECRET = String(process.env.SHARE_LINK_SECRET);
const ACCESS_JWT_SECRET = String(process.env.ACCESS_JWT_SECRET);
const checkOwnerUsingParamsTokenMiddleware = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    if (res.locals.skipAccessCheck)
        return next();
    const getTokenFromParams = req.params.token;
    const verifySharedLink = jsonwebtoken_1.default.verify(getTokenFromParams, SHARE_LINK_SECRET);
    if (!verifySharedLink) {
        console.log("Invalid URL");
        res.status(404).json({
            message: "Invalid URL"
        });
        return;
    }
    const contentID = verifySharedLink.id;
    if (req.user == undefined) {
        console.log("Middleware passing undefined inplace of user");
        res.status(500).json({
            message: "Middleware not passing the user"
        });
        return;
    }
    const userID = String(req.user.id);
    try {
        const checkContent = yield contentModel_1.ContentModel.findOne({ _id: new mongoose_1.default.Types.ObjectId(contentID) });
        if (!checkContent) {
            console.log("Content not found");
            res.status(404).json({
                message: "Content not found"
            });
            return;
        }
        console.log(checkContent.userID);
        console.log(new mongoose_1.default.Types.ObjectId(userID));
        if (!checkContent.userID.equals(new mongoose_1.default.Types.ObjectId(userID))) {
            console.log("Not an Owner: Only owner can access this");
            // res.status(404).json({
            //     message: "Not an Owner: Only owner can access this"
            // })
            return next();
        }
        req.user = req.user;
        req.content = checkContent;
        res.locals.skipAccessCheck = true;
        next();
    }
    catch (e) {
        console.error("checkOwnerUsingParamsTokenMiddleware");
        console.log(e);
        res.status(500).json({ error: e });
        return;
    }
});
exports.checkOwnerUsingParamsTokenMiddleware = checkOwnerUsingParamsTokenMiddleware;
