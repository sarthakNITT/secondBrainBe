import { NextFunction, Request, RequestHandler, Response } from "express"
import path from "path"
import jwt from "jsonwebtoken"
import dotenv from 'dotenv'
import { ContentModel } from "../models/contentModel"
import mongoose, {ObjectId} from "mongoose"
dotenv.config({path: path.resolve("../../.env")})

const SHARE_LINK_SECRET = String(process.env.SHARE_LINK_SECRET)
const ACCESS_JWT_SECRET = String(process.env.ACCESS_JWT_SECRET)

declare module "express-serve-static-core" {
    interface Request {
      content?: jwt.JwtPayload;
    }
}

const checkOwnerUsingContentIDMiddleware: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
    
    const contentID = req.params.contentID
    
    if(req.user == undefined){
        console.log("Middleware passing undefined inplace of user");
        res.status(500).json({
            message: "Middleware not passing the user"
        })
        return;
    }

    const userID = String(req.user.id)

    try {

        const checkContent = await ContentModel.findOne({_id: new mongoose.Types.ObjectId(contentID)})
    
        if(!checkContent){
            console.log("Content not found");
            res.status(404).json({
                message: "Content not found"
            })
            return
        }

        console.log(checkContent.userID);
        console.log(new mongoose.Types.ObjectId(userID));

        if(!checkContent.userID.equals(new mongoose.Types.ObjectId(userID))){
            console.log("Not an Owner: Only owner can access this");
            res.status(404).json({
                message: "Not an Owner: Only owner can access this"
            })
            return next()
        }

        req.user = req.user
        req.content = checkContent
        res.locals.skipAccessCheck = true
        next()
        
    } catch (e) {
        console.log(e);
        res.status(500).json({error: e})
        return;
    }

}

export {checkOwnerUsingContentIDMiddleware}