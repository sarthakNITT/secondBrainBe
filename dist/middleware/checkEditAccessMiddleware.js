"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkEditAccessMiddleware = void 0;
const path_1 = __importDefault(require("path"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config({ path: path_1.default.resolve("../../.env") });
const SHARE_LINK_SECRET = String(process.env.SHARE_LINK_SECRET);
const ACCESS_JWT_SECRET = String(process.env.ACCESS_JWT_SECRET);
const checkEditAccessMiddleware = (req, res, next) => {
    if (res.locals.skipAccessCheck) {
        next();
        return;
    }
    const getToken = req.params.token;
    const decode = jsonwebtoken_1.default.verify(getToken, SHARE_LINK_SECRET);
    const assignedRole = decode.role;
    if (assignedRole == "Edit") {
        next();
        return;
    }
    else {
        console.log("You don't have access to edit");
        res.status(403).json({
            message: "You don't have access to edit"
        });
        return;
    }
};
exports.checkEditAccessMiddleware = checkEditAccessMiddleware;
