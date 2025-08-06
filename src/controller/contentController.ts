import { Request, RequestHandler, Response } from "express"
import { ContentModel } from "../models/contentModel"
import jwt from "jsonwebtoken"
import path from "path"
import dotenv from 'dotenv'
import { tagsModel } from "../models/tagsModel"
import { UserModel } from "../models/userModel"
dotenv.config({path: path.resolve("../../.env")})

const SHARE_LINK_SECRET = String(process.env.SHARE_LINK_SECRET)
const ACCESS_JWT_SECRET = String(process.env.ACCESS_JWT_SECRET)

interface UpdateContentDetails {
    type?: string;
    link?: string;
    title?: string;
    tags?: string[]
}

const addContent: RequestHandler = async (req: Request, res: Response) => {
    const {
        title, 
        type, 
        link, 
        tags 
    } = req.body;

    if(req.user == undefined){
        console.log("Middleware passing undefined inplace of user");
        res.status(500).json({
            message: "Middleware not passing the user"
        })
        return;
    }

    const userID = req.user.id;

    try {
        
        const checkDuplicateLink = await ContentModel.findOne({link: link})
        const checkDuplicateTitle = await ContentModel.findOne({title: title})
        
        if(checkDuplicateLink){
            console.log("Content with this link already exists");
            res
            .status(401)
            .json({
                message: "duplicate link"
            })
            return;
        }

        if(checkDuplicateTitle){
            console.log("Content with this Title already exists");
            res
            .status(401)
            .json({
                message: "duplicate title"
            })
            return;
        }

        let tagsID = null;

        if (tags && tags.length > 0) {
            const createTags = await tagsModel.create({ tagTitle: tags });
            tagsID = createTags._id;
        }

        await ContentModel.create({
            title,
            type,
            link,
            userID,
            tagsID: tagsID
        });

        res
        .status(200)
        .json({
            message: "Content created successfully" 
        });

    } catch (e) {
        console.error(e);
        res.status(500).json({ error: e });
    }
};

const getContent: RequestHandler = async (req: Request,res: Response) => {

    if(req.user == undefined){
        console.log("Middleware passing undefined inplace of user");
        res.status(500).json({
            message: "Middleware not passing the user"
        })
        return;
    }

    const userID = req.user.id

    try {

        const contents = await ContentModel.find({userID: userID})

        if(contents.length == 0){
            console.log("No contents to show");
            res.status(403).json({
                message: "Create your first content"
            })
            return;
        }
        console.log("contents Found");
        res.status(200).json({contents})

    } catch (e) {
        console.log(e);
        res.status(500).json({
            error: e
        })
        return;
    }
}

const deleteContent: RequestHandler = async (req: Request,res: Response) => {

    const contentID = req.params.contentID

    try {

        const content = await ContentModel.findOne({
            _id: contentID
        })
        
        if (!content) {
            console.log("Content doesn't exists");
            res
            .status(403)
            .json({ 
                message: "Content doesn't exists" 
            });
            return 
        }

        const tagID = content.tagsID
        await tagsModel.deleteOne({
            _id: tagID
        })
        await ContentModel.deleteOne({
            _id: contentID
        })

        res
        .status(200)
        .json({
            message: "Content got deleted successfully"
        }
        )
    } catch (e) {
        console.log(e);
        res
        .status(500)
        .json({
            error: e
        })
    }
}

const shareContent: RequestHandler = async (req: Request, res: Response) => {

    const {
        share, 
        role, 
        shareWithUser = null
    } = req.body
    
    const contentID = req.params.contentID

    if(req.content == undefined){
        console.log("Middleware passing undefined in place of content");
        res
        .status(500)
        .json({
            message: "Middleware not passing the content"
        })
        return;
    }

    const ownerContent = req.content

    try {

        if(share == "Anyone with the link"){
    
            const linkTokenAnyone = jwt.sign({
                id: ownerContent._id,
                userID: ownerContent.userID,
                title: ownerContent.title,
                visibility: share,
                role: role
            }, SHARE_LINK_SECRET)
    
            await ContentModel.updateOne({
                _id: contentID
            },{
                visibility: share,
                role: role,
                shareLink: `http://localhost:3003/api/v1/content/fetchLinkContent/${linkTokenAnyone}`
            })
    
            const updated = await ContentModel.findById(
                contentID
            );
    
            res
            .status(200)
            .json({
                link: updated?.shareLink,
                role: updated?.role
            })
            return;
    
        }else if(share == "Restricted"){
    
            const linkTokenRestricted = jwt.sign({
                id: ownerContent._id,
                userID: ownerContent.userID,
                title: ownerContent.title,
                visibility: share,
                role: role,
                sharedWith: shareWithUser
            },SHARE_LINK_SECRET)
    
            await ContentModel.updateOne({
                _id: contentID
            },{
                $set: {
                    shareLink: `http://localhost:3003/api/v1/content/fetchLinkContent/${linkTokenRestricted}`,
                    visibility: share,
                    role: role,
                },
                $addToSet: {
                    sharedWith: shareWithUser
                }
            })
    
            const updated = await ContentModel.findById(
                contentID
            );
    
            res
            .status(200)
            .json({
                link: updated?.shareLink,
                shareWith: updated?.sharedWith,
                role: updated?.role
            })
        }else{
    
            await ContentModel.updateOne({
                _id: contentID
            },{
                $set: {visibility: "Private", role: "Edit"},
                $unset: {sharedWith: null, shareLink: null}
            })
    
            res
            .status(200)
            .json({
                message: "Link Removed"
            })
        }   
    } catch (e) {
        console.log(e);
        res
        .status(500)
        .json({
            error: e
        })
        return;
    }
}

const fetchLinkContent: RequestHandler = async (req: Request,res: Response) => {
    const getToken = req.shareToken as jwt.JwtPayload
    const contentID = getToken.id

    try {
    
        const content = await ContentModel.findOne({
            _id: contentID
        })
        
        if (!content) {
            res.status(404).json({ message: "Content not found" });
            return 
        }

        res
        .status(200)
        .json({
            content
        })

    } catch (e) {
        console.log("fetchContent");
        console.log(e);
        res
        .status(500)
        .json({
            error: e
        })
        return;
    }
}

const updateContent:RequestHandler = async (req:Request, res: Response) => {
    const needsToUpdate: UpdateContentDetails = {
        type: req.body.type,
        link: req.body.link,
        title: req.body.title,
        tags: req.body.tags
    }
    const TokenFromParams = req.shareToken as jwt.JwtPayload
    
    try {
        const content = await ContentModel.findOne({
            _id: TokenFromParams.id
        })

        if (!content) {
            res
            .status(404)
            .json({
                message: "Content not found" 
            });
            return 
        }
        
        const tagID = content.tagsID

        if (needsToUpdate.tags && needsToUpdate.tags.length > 0) {
            await tagsModel.updateOne({ 
                _id: tagID 
            },{
                $addToSet: { 
                    tagTitle: { 
                        $each: needsToUpdate.tags 
                    } 
                }
            });
        }
            
        await ContentModel.updateOne({
            _id: TokenFromParams.id
        },{
            $set: {
                ...needsToUpdate
            }
        })
    
        res
        .status(200)
        .json({
            message: "Content updated successfully"
        })   

    } catch (e) {
        console.log(e);
        res
        .status(500)
        .json({
            error: e
        })
        return;
    }
}

const deleteTags: RequestHandler = async (req: Request, res: Response) => {
        const tagName = req.body.tagName
        const getTokenFromParams = req.shareToken as jwt.JwtPayload

        try {

            const content = await ContentModel.findOne({
                _id: getTokenFromParams.id
            })

            if (!content) {
                res
                .status(404)
                .json({
                    message: "Content not found" 
                });
                return 
            }
        
            const tagID = content.tagsID
            await tagsModel.updateOne({
                _id: tagID
            },{
                $pull:{
                    tagTitle: tagName
                }
            })
    
            res
            .status(200)
            .json({
                message: "Tag removed successfully"
            })   

        } catch (e) {
            console.log(e);
            res
            .status(500)
            .json({
                error: e
            })
            return;
        }
}

export {addContent, getContent, deleteContent, shareContent, fetchLinkContent, updateContent, deleteTags}