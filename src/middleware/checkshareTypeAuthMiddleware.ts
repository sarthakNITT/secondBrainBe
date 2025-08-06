import { NextFunction, Request, RequestHandler, Response } from "express"
import path from "path"
import jwt from "jsonwebtoken"
import dotenv from 'dotenv'
import { ContentModel } from "../models/contentModel"
import { forEachLeadingCommentRange } from "typescript"
import mongoose, { mongo } from "mongoose"
dotenv.config({path: path.resolve("../../.env")})

const SHARE_LINK_SECRET = String(process.env.SHARE_LINK_SECRET)
const ACCESS_JWT_SECRET = String(process.env.ACCESS_JWT_SECRET)

declare module "express-serve-static-core" {
    interface Request {
      shareToken?: jwt.JwtPayload;
      accessToken?: jwt.JwtPayload;
    }
}

const checkshareTypeAuthMiddleware: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
    if (res.locals.skipAccessCheck) {
        req.shareToken = {
            id: req.content?._id,
            userID: req.content?.userID,
            visibility: req.content?.visibility,
            role: req.content?.role
        } as jwt.JwtPayload
        next()
        return
    }
    
    const getTokenFromParams = req.params.token

    try {
        const verifySharedLink = jwt.verify(getTokenFromParams, SHARE_LINK_SECRET) as jwt.JwtPayload

        if(!verifySharedLink){
            console.log("Invalid URL");
            res.status(404).json({
                message: "Invalid URL"
            })
            return
        }
    
        const shareType = verifySharedLink.visibility
    
        if(shareType == "Anyone with the link"){
            req.shareToken = verifySharedLink
            next()
            return;
    
        }else if(shareType == "Restricted"){
    
            const getTokenFromHeader = req.headers.authorization
            
            if(!getTokenFromHeader){
                console.log("Authentication Required");
                res.status(500).json({
                    message: "Authentication Required"
                })
                return;
            }
            
            const extractToken = getTokenFromHeader.split(" ")[1]
            
            if(!extractToken || !getTokenFromHeader.startsWith("Bearer")){
                console.log("Incorrect Bearer Format");
                res.status(500).json({
                    message: "Incorrect Bearer Format"
                })
                return;
            }
            
            const verifyExtractedToken = jwt.verify(extractToken, ACCESS_JWT_SECRET) as jwt.JwtPayload
            const content = await ContentModel.findById(verifySharedLink.id);
            if (!content) {
                res.status(404).json({ message: "Content not found" });
                return
            }

            const sharedUsers = content.sharedWith || [];

            console.log("Shared Users:", sharedUsers);
            console.log("User Token ID:", verifyExtractedToken.id);
            
                        
            if (sharedUsers.some((id: mongoose.Types.ObjectId) => id && id.equals(String(verifyExtractedToken.id)))) {
                req.shareToken = verifySharedLink
                next()
                return
            }
            
            console.log("You cannot access this content");
            res.status(500).json({
                message: "you cannot access this content"
            })
            return
    
        }else{
            console.log("You cannot access this content");
            res.status(500).json({
                message: "you cannot access this content"
            })
            return
        }   
    } catch (e) {
        console.log("Access Denied");
        console.log(e);
        res.status(403).json({
            error: e
        })
        return;
    }
}

export {checkshareTypeAuthMiddleware}