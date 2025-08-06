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
exports.checkshareTypeAuthMiddleware = void 0;
const path_1 = __importDefault(require("path"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
const contentModel_1 = require("../models/contentModel");
dotenv_1.default.config({ path: path_1.default.resolve("../../.env") });
const SHARE_LINK_SECRET = String(process.env.SHARE_LINK_SECRET);
const ACCESS_JWT_SECRET = String(process.env.ACCESS_JWT_SECRET);
const checkshareTypeAuthMiddleware = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    if (res.locals.skipAccessCheck) {
        req.shareToken = {
            id: (_a = req.content) === null || _a === void 0 ? void 0 : _a._id,
            userID: (_b = req.content) === null || _b === void 0 ? void 0 : _b.userID,
            visibility: (_c = req.content) === null || _c === void 0 ? void 0 : _c.visibility,
            role: (_d = req.content) === null || _d === void 0 ? void 0 : _d.role
        };
        next();
        return;
    }
    const getTokenFromParams = req.params.token;
    try {
        const verifySharedLink = jsonwebtoken_1.default.verify(getTokenFromParams, SHARE_LINK_SECRET);
        if (!verifySharedLink) {
            console.log("Invalid URL");
            res.status(404).json({
                message: "Invalid URL"
            });
            return;
        }
        const shareType = verifySharedLink.visibility;
        if (shareType == "Anyone with the link") {
            req.shareToken = verifySharedLink;
            next();
            return;
        }
        else if (shareType == "Restricted") {
            const getTokenFromHeader = req.headers.authorization;
            if (!getTokenFromHeader) {
                console.log("Authentication Required");
                res.status(500).json({
                    message: "Authentication Required"
                });
                return;
            }
            const extractToken = getTokenFromHeader.split(" ")[1];
            if (!extractToken || !getTokenFromHeader.startsWith("Bearer")) {
                console.log("Incorrect Bearer Format");
                res.status(500).json({
                    message: "Incorrect Bearer Format"
                });
                return;
            }
            const verifyExtractedToken = jsonwebtoken_1.default.verify(extractToken, ACCESS_JWT_SECRET);
            const content = yield contentModel_1.ContentModel.findById(verifySharedLink.id);
            if (!content) {
                res.status(404).json({ message: "Content not found" });
                return;
            }
            const sharedUsers = content.sharedWith || [];
            console.log("Shared Users:", sharedUsers);
            console.log("User Token ID:", verifyExtractedToken.id);
            if (sharedUsers.some((id) => id && id.equals(String(verifyExtractedToken.id)))) {
                req.shareToken = verifySharedLink;
                next();
                return;
            }
            console.log("You cannot access this content");
            res.status(500).json({
                message: "you cannot access this content"
            });
            return;
        }
        else {
            console.log("You cannot access this content");
            res.status(500).json({
                message: "you cannot access this content"
            });
            return;
        }
    }
    catch (e) {
        console.log("Access Denied");
        console.log(e);
        res.status(403).json({
            error: e
        });
        return;
    }
});
exports.checkshareTypeAuthMiddleware = checkshareTypeAuthMiddleware;
