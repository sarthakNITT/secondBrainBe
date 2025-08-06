import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import ConnectDB from './db';
import { userRouter } from './routes/authRoutes';
import { contentRouter } from './routes/contentRoutes';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 5002;

app.use(cors({
    origin: "http://localhost:5173", 
    credentials: true                
}));
app.use(express.json());
app.use(cookieParser());

app.use("/api/v1/auth", userRouter);
app.use("/api/v1/content", contentRouter);

ConnectDB().then(() => {
    try {
        app.listen(PORT, "0.0.0.0", () => {
            console.log(`Server connected: http://localhost:${PORT}`);
        });
    } catch (error) {
        console.log(`Error while connecting: ${error}`);
    }
});
