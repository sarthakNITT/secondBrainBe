import express from "express"
const userRouter = express.Router()
import { register, login, refresh, logout } from "../controller/userController"
import {authMiddleware} from '../middleware/authMiddleware'

userRouter.post("/register", register)
userRouter.post("/login", login)
userRouter.get("/refresh", refresh)
userRouter.post("/logout", authMiddleware, logout)

export {userRouter}