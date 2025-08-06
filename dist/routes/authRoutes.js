"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRouter = void 0;
const express_1 = __importDefault(require("express"));
const userRouter = express_1.default.Router();
exports.userRouter = userRouter;
const userController_1 = require("../controller/userController");
const authMiddleware_1 = require("../middleware/authMiddleware");
userRouter.post("/register", userController_1.register);
userRouter.post("/login", userController_1.login);
userRouter.get("/refresh", userController_1.refresh);
userRouter.post("/logout", authMiddleware_1.authMiddleware, userController_1.logout);
