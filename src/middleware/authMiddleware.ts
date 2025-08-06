import { NextFunction, Request, RequestHandler, Response } from "express"
import jwt from "jsonwebtoken"
import dotenv from 'dotenv'
import pathOfFile from 'path'
import { UserModel } from "../models/userModel"

const envPath = pathOfFile.resolve("../../.env")
dotenv.config({path: envPath})

declare module "express-serve-static-core" {
    interface Request {
      user?: jwt.JwtPayload;
    }
}

const ACCESS_JWT_SECRET = String(process.env.ACCESS_JWT_SECRET)

const authMiddleware: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
    const getAccessTokenFromHeaders = req.headers.authorization

    if(!getAccessTokenFromHeaders){
        console.log("Authentication Required");
        res.
        status(401)
        .json({
            error: "Authentication Required"
        })
        return;
    }

    if(!getAccessTokenFromHeaders.startsWith("Bearer")){
        console.log("Invalid Bearer Format");
        res
        .status(401)
        .json({
            error: "Invalid Bearer Format"
        })
        return;
    }

    try {
        const extractAccessToken = getAccessTokenFromHeaders.split(" ")[1]

        if(!extractAccessToken){
            console.log("Invalid Bearer Format");
            res.status(403).json({error: "Invalid Bearer Format"})
            return;
        }

        const verifyAccessToken = jwt.verify(extractAccessToken, ACCESS_JWT_SECRET) as jwt.JwtPayload

        if(!verifyAccessToken){
            console.log(("Invalid Token"));
            res
            .status(403)
            .json({
                error: "Invalid Tokens"
            })
            return;
        }

        const checkTokenVersion = await UserModel.findOne({_id: verifyAccessToken.id, tokenVersion: verifyAccessToken.tokenVersion})

        if(!checkTokenVersion){
            console.log("Expiry Token");
            res
            .status(403)
            .json({
                message: "Expiry Token"
            })
            return;
        }

        req.user = verifyAccessToken
        next()

    } catch (e: any) {
        if (e.name === "TokenExpiredError") {
            console.log("AccessTokenExpired");
            res.status(401).json({ message: "AccessTokenExpired" });
            return 
        }
        console.error("AuthMiddleware")
        console.error(e)
        res
        .status(500)
        .json({
            error: "Error: ",e
        })
        return;
    }
    
}

export {authMiddleware}