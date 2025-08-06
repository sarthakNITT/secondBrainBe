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
exports.authMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const userModel_1 = require("../models/userModel");
const envPath = path_1.default.resolve("../../.env");
dotenv_1.default.config({ path: envPath });
const ACCESS_JWT_SECRET = String(process.env.ACCESS_JWT_SECRET);
const authMiddleware = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const getAccessTokenFromHeaders = req.headers.authorization;
    if (!getAccessTokenFromHeaders) {
        console.log("Authentication Required");
        res.
            status(401)
            .json({
            error: "Authentication Required"
        });
        return;
    }
    if (!getAccessTokenFromHeaders.startsWith("Bearer")) {
        console.log("Invalid Bearer Format");
        res
            .status(401)
            .json({
            error: "Invalid Bearer Format"
        });
        return;
    }
    try {
        const extractAccessToken = getAccessTokenFromHeaders.split(" ")[1];
        if (!extractAccessToken) {
            console.log("Invalid Bearer Format");
            res.status(403).json({ error: "Invalid Bearer Format" });
            return;
        }
        const verifyAccessToken = jsonwebtoken_1.default.verify(extractAccessToken, ACCESS_JWT_SECRET);
        if (!verifyAccessToken) {
            console.log(("Invalid Token"));
            res
                .status(403)
                .json({
                error: "Invalid Tokens"
            });
            return;
        }
        const checkTokenVersion = yield userModel_1.UserModel.findOne({ _id: verifyAccessToken.id, tokenVersion: verifyAccessToken.tokenVersion });
        if (!checkTokenVersion) {
            console.log("Expiry Token");
            res
                .status(403)
                .json({
                message: "Expiry Token"
            });
            return;
        }
        req.user = verifyAccessToken;
        next();
    }
    catch (e) {
        if (e.name === "TokenExpiredError") {
            console.log("AccessTokenExpired");
            res.status(401).json({ message: "AccessTokenExpired" });
            return;
        }
        console.error("AuthMiddleware");
        console.error(e);
        res
            .status(500)
            .json({
            error: "Error: ", e
        });
        return;
    }
});
exports.authMiddleware = authMiddleware;
