import express from 'express'
import { authMiddleware } from '../middleware/authMiddleware'
import { checkEditAccessMiddleware } from '../middleware/checkEditAccessMiddleware'
import { checkOwnerUsingContentIDMiddleware } from '../middleware/checkOwnerUsingContentIDMiddleware'
import { checkOwnerUsingParamsTokenMiddleware } from '../middleware/checkOwnerUsingParamsTokenMiddleware'
import { checkshareTypeAuthMiddleware } from '../middleware/checkshareTypeAuthMiddleware'
const contentRouter = express.Router()
import { addContent, getContent, deleteContent, shareContent, fetchLinkContent, updateContent, deleteTags } from '../controller/contentController'

contentRouter.post("/addContent", authMiddleware, addContent)
contentRouter.get("/getContent", authMiddleware, getContent)
contentRouter.delete("/deleteContent/:contentID", authMiddleware, checkOwnerUsingContentIDMiddleware, checkEditAccessMiddleware, checkshareTypeAuthMiddleware, deleteContent)
contentRouter.post("/shareLink/:contentID", authMiddleware, checkOwnerUsingContentIDMiddleware, checkEditAccessMiddleware, checkshareTypeAuthMiddleware, shareContent)
contentRouter.get("/fetchLinkContent/:token", authMiddleware, checkOwnerUsingParamsTokenMiddleware, checkshareTypeAuthMiddleware, fetchLinkContent)
contentRouter.put("/updateContent/:token", authMiddleware, checkOwnerUsingParamsTokenMiddleware, checkEditAccessMiddleware, checkshareTypeAuthMiddleware, updateContent)
contentRouter.put("/deleteTags/:token", authMiddleware, checkOwnerUsingParamsTokenMiddleware, checkEditAccessMiddleware, checkshareTypeAuthMiddleware, deleteTags)

export {contentRouter}