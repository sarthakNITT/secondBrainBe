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
exports.logout = exports.refresh = exports.login = exports.register = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const userModel_1 = require("../models/userModel");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const zod_1 = require("zod");
const envPath = path_1.default.resolve("../../.env");
dotenv_1.default.config({ path: envPath });
const userInputSchema = zod_1.z.object({
    username: zod_1.z
        .string()
        .min(3, { message: "Username must be atleast 3 characters long" }),
    password: zod_1.z
        .string()
        .min(6, { message: "Password must be atleast 6 characters long" })
        .regex(/[A-Z]/, { message: "Password must contain at least one uppercase character" })
        .regex(/[0-9]/, { message: "Password must contain at least one number" })
        .regex(/[!@#$%^&*(),.?":{}|<>]/, { message: "Password must contain at least one special character" })
});
const ACCESS_JWT_SECRET = String(process.env.ACCESS_JWT_SECRET);
const REFRESH_JWT_SECRET = String(process.env.REFRESH_JWT_SECRET);
const register = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { username, password } = userInputSchema.parse(req.body);
        const checkExistingUser = yield userModel_1.UserModel.findOne({
            username: username
        });
        if (checkExistingUser) {
            res
                .status(403)
                .json({
                error: "Username already exists"
            });
            return;
        }
        const salt = yield bcrypt_1.default.genSalt(10);
        const hashedPassword = yield bcrypt_1.default.hash(password, salt);
        yield userModel_1.UserModel.create({
            username: username,
            password: hashedPassword,
        });
        res
            .status(200)
            .json({
            message: "Registration Successfull"
        });
    }
    catch (e) {
        if (e instanceof zod_1.ZodError) {
            const errorFromZod = ((_a = e.errors[0]) === null || _a === void 0 ? void 0 : _a.message) || "Input instructions not followed";
            console.error("Validation Error:", errorFromZod);
            res
                .status(400)
                .json({
                error: errorFromZod
            });
            return;
        }
        else {
            console.error("Internal Error:", e);
            res
                .status(500)
                .json({
                error: "Something went wrong", details: e
            });
            return;
        }
    }
});
exports.register = register;
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { username, password } = userInputSchema.parse(req.body);
        const existingUser = yield userModel_1.UserModel.findOne({
            username: username
        });
        if (!existingUser) {
            res
                .status(401)
                .json({
                error: "User doesn't exists"
            });
            return;
        }
        const checkCorrectPassword = yield bcrypt_1.default.compare(password, existingUser.password);
        if (!checkCorrectPassword) {
            res
                .status(403)
                .json({
                error: "Password Incorrect"
            });
            return;
        }
        const generateAccessToken = jsonwebtoken_1.default.sign({
            id: existingUser._id,
            username: username,
            tokenVersion: 1
        }, ACCESS_JWT_SECRET, {
            expiresIn: "15m"
        });
        const generateRefreshToken = jsonwebtoken_1.default.sign({
            id: existingUser._id,
            username: username,
            tokenVersion: 1
        }, REFRESH_JWT_SECRET, {
            expiresIn: "7d"
        });
        existingUser.refreshToken.push(generateRefreshToken);
        yield existingUser.save();
        res
            .cookie("refreshToken", generateRefreshToken, { httpOnly: true, sameSite: "strict", maxAge: 7 * 24 * 60 * 60 * 1000 })
            .status(200)
            .json({
            message: "Login Successfull",
            accessToken: generateAccessToken
        });
    }
    catch (e) {
        console.log(e);
        res
            .status(500)
            .json({
            error: "Error while loggin In: ", e
        });
        return;
    }
});
exports.login = login;
const refresh = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const getRefreshTokenFromCookies = req.cookies.refreshToken;
    if (!getRefreshTokenFromCookies) {
        console.log("Refresh Token not in the cookie");
        res
            .status(401)
            .json({
            error: "Refresh Token not in the cookie"
        });
        return;
    }
    try {
        console.log(getRefreshTokenFromCookies);
        const decodeRefreshToken = jsonwebtoken_1.default.verify(getRefreshTokenFromCookies, REFRESH_JWT_SECRET);
        if (!decodeRefreshToken) {
            console.log("Invalid Refresh Token");
            res
                .status(403)
                .json({
                error: "Invalid Refresh Token"
            });
            return;
        }
        const checkExistingUserByID = yield userModel_1.UserModel.findById(decodeRefreshToken.id);
        if (!checkExistingUserByID) {
            console.log("Invalid User");
            res
                .status(403)
                .json({
                error: "Invalid User"
            });
            return;
        }
        checkExistingUserByID.tokenVersion = checkExistingUserByID.tokenVersion + 1;
        const generateNewAccessToken = jsonwebtoken_1.default.sign({
            id: checkExistingUserByID.id,
            username: checkExistingUserByID.username,
            tokenVersion: checkExistingUserByID.tokenVersion
        }, ACCESS_JWT_SECRET, {
            expiresIn: '15m'
        });
        const generateNewRefreshToken = jsonwebtoken_1.default.sign({
            id: checkExistingUserByID.id,
            username: checkExistingUserByID.username,
            tokenVersion: checkExistingUserByID.tokenVersion
        }, REFRESH_JWT_SECRET, {
            expiresIn: '7d'
        });
        if (!checkExistingUserByID.refreshToken.includes(getRefreshTokenFromCookies)) {
            res.status(403).json({ error: "Refresh token not recognized" });
            return;
        }
        checkExistingUserByID.refreshToken = checkExistingUserByID.refreshToken.map((token) => token === getRefreshTokenFromCookies ? generateNewRefreshToken : token);
        yield checkExistingUserByID.save();
        console.log(generateNewRefreshToken);
        res
            .cookie("refreshToken", generateNewRefreshToken, { httpOnly: true, sameSite: "strict" })
            .status(200)
            .json({
            message: "New access token generated",
            accessToken: generateNewAccessToken
        });
    }
    catch (e) {
        console.log(e);
        res
            .status(500)
            .json({
            error: "Error while refreshing token: ", e
        });
        return;
    }
});
exports.refresh = refresh;
const logout = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const getAccessTokenFromHeaders = req.headers.authorization;
    const getRefreshTokenFromCookies = req.cookies.refreshToken;
    if (!getAccessTokenFromHeaders) {
        console.log("Not Authorised");
        res
            .status(401)
            .json({
            error: "Not Authorised"
        });
        return;
    }
    if (!getRefreshTokenFromCookies) {
        console.log("Refresh Token not found in Cookies");
        res
            .status(401)
            .json({
            error: "Refresh Token not found in Cookies"
        });
        return;
    }
    if (!getAccessTokenFromHeaders.startsWith("Bearer")) {
        console.log("Token doesn't starts with Bearer");
        res
            .status(403)
            .json({
            error: "Invalid Bearer Format"
        });
        return;
    }
    try {
        const extractAccessToken = getAccessTokenFromHeaders === null || getAccessTokenFromHeaders === void 0 ? void 0 : getAccessTokenFromHeaders.split(" ")[1];
        if (!extractAccessToken) {
            console.log("Token is not splitting with space");
            res
                .status(403)
                .json({
                error: "Invalid Bearer Format"
            });
            return;
        }
        const verifyingAccessToken = jsonwebtoken_1.default.verify(extractAccessToken, ACCESS_JWT_SECRET);
        const verifyingRefreshToken = jsonwebtoken_1.default.verify(getRefreshTokenFromCookies, REFRESH_JWT_SECRET);
        if (!verifyingAccessToken) {
            console.log("Invalid Token: Not verified");
            res
                .status(403)
                .json({
                error: "Invalid Token: Not verified"
            });
            return;
        }
        if (!verifyingRefreshToken) {
            console.log("Invalid Token: Not verified");
            res
                .status(403)
                .json({
                error: "Invalid Token: Not verified"
            });
            return;
        }
        const checkUser = yield userModel_1.UserModel.findOne({ _id: verifyingAccessToken.id });
        if (!checkUser) {
            console.log("Invalid Token: Not verified");
            res
                .status(403)
                .json({
                error: "Invalid Token: Not verified"
            });
            return;
        }
        checkUser.refreshToken = checkUser.refreshToken.filter(token => token !== getRefreshTokenFromCookies);
        yield checkUser.save();
        delete req.headers["authorization"];
        console.log("Access Token removed from header");
        res
            .clearCookie("refreshToken")
            .json({
            message: "logged Out successfully"
        });
        console.log("Logged Out successfully");
    }
    catch (e) {
        console.log(e);
        res
            .status(500)
            .json({
            error: "error while logging out: ", e
        });
        return;
    }
});
exports.logout = logout;
