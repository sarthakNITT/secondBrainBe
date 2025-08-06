import mongoose from "mongoose"
import dotenv from 'dotenv'
dotenv.config()

const MONGO_URL = String(process.env.MONGO_URL)

async function ConnectDB(){
    try {
        await mongoose
        .connect(MONGO_URL)
        console.log("Database connected to MongoDB Atlas")
    } catch (error) {
        console.error("Error while connecting with database: ",error)
    }
}

export default ConnectDB;