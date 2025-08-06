import { Request, RequestHandler, Response } from "express"
import bcrypt from "bcrypt"
import { UserModel } from "../models/userModel"
import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'
import pathOfFile from 'path'
import {z, ZodError} from 'zod'

const envPath = pathOfFile.resolve("../../.env")
dotenv.config({path: envPath})

const userInputSchema = z.object({
    username: z
      .string()
      .min(3, { message: "Username must be atleast 3 characters long" }),
    password: z
      .string()
      .min(6, { message: "Password must be atleast 6 characters long" })
      .regex(/[A-Z]/, { message: "Password must contain at least one uppercase character" })
      .regex(/[0-9]/, { message: "Password must contain at least one number" })
      .regex(/[!@#$%^&*(),.?":{}|<>]/, { message: "Password must contain at least one special character" })
})  

const ACCESS_JWT_SECRET = String(process.env.ACCESS_JWT_SECRET)
const REFRESH_JWT_SECRET = String(process.env.REFRESH_JWT_SECRET)

const register: RequestHandler = async (req: Request,res: Response) => {
    
    try {
        const {
            username, 
            password
        } = userInputSchema.parse(req.body)

        const checkExistingUser = await UserModel.findOne({
            username: username
        })

        if(checkExistingUser){
            res
            .status(403)
            .json({
                error: "Username already exists"
            })
            return;
        }
    
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(
            password, 
            salt
        )
    
        await UserModel.create({
            username: username,
            password: hashedPassword,
        })
    
        res
        .status(200)
        .json({
            message: "Registration Successfull"
        })   
             
    } catch (e) {

        if (e instanceof ZodError) {
            const errorFromZod = e.errors[0]?.message || "Input instructions not followed"
            console.error("Validation Error:", errorFromZod)
            res
            .status(400)
            .json({
                error: errorFromZod 
            })
            return;
        } else {
            console.error("Internal Error:", e)
            res
            .status(500)
            .json({
                error: "Something went wrong", details: e 
            })
            return;
        }
        
    }    
}

const login: RequestHandler = async (req: Request,res: Response) => {
    
    try {
        const {
            username, 
            password
        } = userInputSchema.parse(req.body)

        const existingUser = await UserModel.findOne({
            username: username
        })

        if(!existingUser){
            res
            .status(401)
            .json({
                error: "User doesn't exists"
            })
            return;
        }

        const checkCorrectPassword = await bcrypt.compare(
            password, existingUser.password
        )

        if(!checkCorrectPassword){
            res
            .status(403)
            .json({
                error: "Password Incorrect"
            })
            return;
        }

        const generateAccessToken = jwt.sign({
            id: existingUser._id,
            username: username,
            tokenVersion: 1
        }, ACCESS_JWT_SECRET, {
            expiresIn: "15m"
        })

        const generateRefreshToken = jwt.sign({
            id: existingUser._id,
            username: username,
            tokenVersion: 1
        }, REFRESH_JWT_SECRET, {
            expiresIn: "7d"
        })

        existingUser.refreshToken.push(generateRefreshToken)
        await existingUser.save()

        res
        .cookie("refreshToken", generateRefreshToken, {httpOnly: true, sameSite: "strict", maxAge: 7 * 24 * 60 * 60 * 1000})
        .status(200)
        .json({
            message: "Login Successfull",
            accessToken: generateAccessToken
        })

    } catch (e) {
        console.log(e);
        res
        .status(500)
        .json({
            error: "Error while loggin In: ",e
        })
        return;
    }
}

const refresh: RequestHandler = async (req: Request,res: Response) => {
    const getRefreshTokenFromCookies = req.cookies.refreshToken

    if(!getRefreshTokenFromCookies){
        console.log("Refresh Token not in the cookie");
        res
        .status(401)
        .json({
            error: "Refresh Token not in the cookie"
        })
        return;
    }

    try {

        console.log(getRefreshTokenFromCookies);
        
        const decodeRefreshToken = jwt.verify(getRefreshTokenFromCookies, REFRESH_JWT_SECRET) as jwt.JwtPayload

        if(!decodeRefreshToken){
            console.log("Invalid Refresh Token");
            res
            .status(403)
            .json({
                error: "Invalid Refresh Token"
            })
            return;
        }

        const checkExistingUserByID = await UserModel.findById(decodeRefreshToken.id)

        if(!checkExistingUserByID){
            console.log("Invalid User");
            res
            .status(403)
            .json({
                error: "Invalid User"
            })
            return;
        }

        checkExistingUserByID.tokenVersion = checkExistingUserByID.tokenVersion + 1;

        const generateNewAccessToken = jwt.sign({
            id: checkExistingUserByID.id,
            username: checkExistingUserByID.username,
            tokenVersion: checkExistingUserByID.tokenVersion
        }, ACCESS_JWT_SECRET, {
            expiresIn: '15m'
        })

        const generateNewRefreshToken = jwt.sign({
            id: checkExistingUserByID.id,
            username: checkExistingUserByID.username,
            tokenVersion: checkExistingUserByID.tokenVersion
        }, REFRESH_JWT_SECRET, {
            expiresIn: '7d'
        })

        if (!checkExistingUserByID.refreshToken.includes(getRefreshTokenFromCookies)) {
            res.status(403).json({ error: "Refresh token not recognized" });
            return ;
        }          

        checkExistingUserByID.refreshToken = checkExistingUserByID.refreshToken.map((token) => token === getRefreshTokenFromCookies ? generateNewRefreshToken : token )
        await checkExistingUserByID.save()

        console.log(generateNewRefreshToken);

        res
        .cookie("refreshToken", generateNewRefreshToken, {httpOnly: true, sameSite: "strict"})
        .status(200)
        .json({
            message: "New access token generated",
            accessToken: generateNewAccessToken
        })

    } catch (e) {
        console.log(e);
        res
        .status(500)
        .json({
            error: "Error while refreshing token: ",e
        })
        return;
    }
}

const logout: RequestHandler = async (req: Request,res: Response) => {
    const getAccessTokenFromHeaders = req.headers.authorization
    const getRefreshTokenFromCookies = req.cookies.refreshToken

    if(!getAccessTokenFromHeaders){
        console.log("Not Authorised");
        res
        .status(401)
        .json({
            error: "Not Authorised"
        })
        return;
    }

    if(!getRefreshTokenFromCookies){
        console.log("Refresh Token not found in Cookies");
        res
        .status(401)
        .json({
            error: "Refresh Token not found in Cookies"
        })
        return;
    }
    
    if(!getAccessTokenFromHeaders.startsWith("Bearer")){
        console.log("Token doesn't starts with Bearer");
        res
        .status(403)
        .json({
            error: "Invalid Bearer Format"
        })
        return;
    }

    try {

        const extractAccessToken = getAccessTokenFromHeaders?.split(" ")[1] 

        if(!extractAccessToken){
            console.log("Token is not splitting with space");
            res
            .status(403)
            .json({
                error: "Invalid Bearer Format"
            })
            return;
        }
    
        const verifyingAccessToken = jwt.verify(extractAccessToken, ACCESS_JWT_SECRET) as jwt.JwtPayload
        const verifyingRefreshToken = jwt.verify(getRefreshTokenFromCookies, REFRESH_JWT_SECRET) as jwt.JwtPayload
    
        if(!verifyingAccessToken){
            console.log("Invalid Token: Not verified");
            res
            .status(403)
            .json({
                error: "Invalid Token: Not verified"
            })
            return;
        }

        if(!verifyingRefreshToken){
            console.log("Invalid Token: Not verified");
            res
            .status(403)
            .json({
                error: "Invalid Token: Not verified"
            })
            return;
        }
        
        const checkUser = await UserModel.findOne({_id: verifyingAccessToken.id})

        if(!checkUser){
            console.log("Invalid Token: Not verified");
            res
            .status(403)
            .json({
                error: "Invalid Token: Not verified"
            })
            return;
        }

        checkUser.refreshToken = checkUser.refreshToken.filter(token => token !== getRefreshTokenFromCookies)
        await checkUser.save()

        delete req.headers["authorization"]
        console.log("Access Token removed from header");
        
        res
        .clearCookie("refreshToken")
        .json({
            message: "logged Out successfully"
        })   
        console.log("Logged Out successfully");
        
    } catch (e) {
        console.log(e);
        res
        .status(500)
        .json({
            error: "error while logging out: ",e
        })
        return;
    }
}

export {register, login, refresh, logout}