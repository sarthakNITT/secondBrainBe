"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const db_1 = __importDefault(require("./db"));
const authRoutes_1 = require("./routes/authRoutes");
const contentRoutes_1 = require("./routes/contentRoutes");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = Number(process.env.PORT) || 5002;
app.use((0, cors_1.default)({
    origin: "http://localhost:5173",
    credentials: true
}));
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
app.use("/api/v1/auth", authRoutes_1.userRouter);
app.use("/api/v1/content", contentRoutes_1.contentRouter);
(0, db_1.default)().then(() => {
    try {
        app.listen(PORT, "0.0.0.0", () => {
            console.log(`Server connected: http://localhost:${PORT}`);
        });
    }
    catch (error) {
        console.log(`Error while connecting: ${error}`);
    }
});
