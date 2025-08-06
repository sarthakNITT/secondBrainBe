import { NextFunction, Request, RequestHandler, Response } from "express"
import path from "path"
import jwt from "jsonwebtoken"
import dotenv from 'dotenv'
dotenv.config({path: path.resolve("../../.env")})

const SHARE_LINK_SECRET = String(process.env.SHARE_LINK_SECRET)
const ACCESS_JWT_SECRET = String(process.env.ACCESS_JWT_SECRET)

declare module "express-serve-static-core" {
    interface Request {
      content?: jwt.JwtPayload;
    }
}

const checkEditAccessMiddleware: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
    if(res.locals.skipAccessCheck){
        next()
        return 
    }
    const getToken = req.params.token
    const decode = jwt.verify(getToken, SHARE_LINK_SECRET) as jwt.JwtPayload
    const assignedRole = decode.role

    if(assignedRole == "Edit"){
        next()
        return 
    }else{
        console.log("You don't have access to edit");
        res.status(403).json({
            message: "You don't have access to edit"
        })
        return;
    }
}

export {checkEditAccessMiddleware}