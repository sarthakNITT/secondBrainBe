"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteTags = exports.updateContent = exports.fetchLinkContent = exports.shareContent = exports.deleteContent = exports.getContent = exports.addContent = void 0;
const contentModel_1 = require("../models/contentModel");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
const tagsModel_1 = require("../models/tagsModel");
dotenv_1.default.config({ path: path_1.default.resolve("../../.env") });
const SHARE_LINK_SECRET = String(process.env.SHARE_LINK_SECRET);
const ACCESS_JWT_SECRET = String(process.env.ACCESS_JWT_SECRET);
const addContent = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { title, type, link, tags } = req.body;
    if (req.user == undefined) {
        console.log("Middleware passing undefined inplace of user");
        res.status(500).json({
            message: "Middleware not passing the user"
        });
        return;
    }
    const userID = req.user.id;
    try {
        const checkDuplicateLink = yield contentModel_1.ContentModel.findOne({ link: link });
        const checkDuplicateTitle = yield contentModel_1.ContentModel.findOne({ title: title });
        if (checkDuplicateLink) {
            console.log("Content with this link already exists");
            res
                .status(401)
                .json({
                message: "duplicate link"
            });
            return;
        }
        if (checkDuplicateTitle) {
            console.log("Content with this Title already exists");
            res
                .status(401)
                .json({
                message: "duplicate title"
            });
            return;
        }
        let tagsID = null;
        if (tags && tags.length > 0) {
            const createTags = yield tagsModel_1.tagsModel.create({ tagTitle: tags });
            tagsID = createTags._id;
        }
        yield contentModel_1.ContentModel.create({
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
    }
    catch (e) {
        console.error(e);
        res.status(500).json({ error: e });
    }
});
exports.addContent = addContent;
const getContent = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (req.user == undefined) {
        console.log("Middleware passing undefined inplace of user");
        res.status(500).json({
            message: "Middleware not passing the user"
        });
        return;
    }
    const userID = req.user.id;
    try {
        const contents = yield contentModel_1.ContentModel.find({ userID: userID });
        if (contents.length == 0) {
            console.log("No contents to show");
            res.status(403).json({
                message: "Create your first content"
            });
            return;
        }
        console.log("contents Found");
        res.status(200).json({ contents });
    }
    catch (e) {
        console.log(e);
        res.status(500).json({
            error: e
        });
        return;
    }
});
exports.getContent = getContent;
const deleteContent = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const contentID = req.params.contentID;
    try {
        const content = yield contentModel_1.ContentModel.findOne({
            _id: contentID
        });
        if (!content) {
            console.log("Content doesn't exists");
            res
                .status(403)
                .json({
                message: "Content doesn't exists"
            });
            return;
        }
        const tagID = content.tagsID;
        yield tagsModel_1.tagsModel.deleteOne({
            _id: tagID
        });
        yield contentModel_1.ContentModel.deleteOne({
            _id: contentID
        });
        res
            .status(200)
            .json({
            message: "Content got deleted successfully"
        });
    }
    catch (e) {
        console.log(e);
        res
            .status(500)
            .json({
            error: e
        });
    }
});
exports.deleteContent = deleteContent;
const shareContent = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { share, role, shareWithUser = null } = req.body;
    const contentID = req.params.contentID;
    if (req.content == undefined) {
        console.log("Middleware passing undefined in place of content");
        res
            .status(500)
            .json({
            message: "Middleware not passing the content"
        });
        return;
    }
    const ownerContent = req.content;
    try {
        if (share == "Anyone with the link") {
            const linkTokenAnyone = jsonwebtoken_1.default.sign({
                id: ownerContent._id,
                userID: ownerContent.userID,
                title: ownerContent.title,
                visibility: share,
                role: role
            }, SHARE_LINK_SECRET);
            yield contentModel_1.ContentModel.updateOne({
                _id: contentID
            }, {
                visibility: share,
                role: role,
                shareLink: `http://localhost:3003/api/v1/content/fetchLinkContent/${linkTokenAnyone}`
            });
            const updated = yield contentModel_1.ContentModel.findById(contentID);
            res
                .status(200)
                .json({
                link: updated === null || updated === void 0 ? void 0 : updated.shareLink,
                role: updated === null || updated === void 0 ? void 0 : updated.role
            });
            return;
        }
        else if (share == "Restricted") {
            const linkTokenRestricted = jsonwebtoken_1.default.sign({
                id: ownerContent._id,
                userID: ownerContent.userID,
                title: ownerContent.title,
                visibility: share,
                role: role,
                sharedWith: shareWithUser
            }, SHARE_LINK_SECRET);
            yield contentModel_1.ContentModel.updateOne({
                _id: contentID
            }, {
                $set: {
                    shareLink: `http://localhost:3003/api/v1/content/fetchLinkContent/${linkTokenRestricted}`,
                    visibility: share,
                    role: role,
                },
                $addToSet: {
                    sharedWith: shareWithUser
                }
            });
            const updated = yield contentModel_1.ContentModel.findById(contentID);
            res
                .status(200)
                .json({
                link: updated === null || updated === void 0 ? void 0 : updated.shareLink,
                shareWith: updated === null || updated === void 0 ? void 0 : updated.sharedWith,
                role: updated === null || updated === void 0 ? void 0 : updated.role
            });
        }
        else {
            yield contentModel_1.ContentModel.updateOne({
                _id: contentID
            }, {
                $set: { visibility: "Private", role: "Edit" },
                $unset: { sharedWith: null, shareLink: null }
            });
            res
                .status(200)
                .json({
                message: "Link Removed"
            });
        }
    }
    catch (e) {
        console.log(e);
        res
            .status(500)
            .json({
            error: e
        });
        return;
    }
});
exports.shareContent = shareContent;
const fetchLinkContent = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const getToken = req.shareToken;
    const contentID = getToken.id;
    try {
        const content = yield contentModel_1.ContentModel.findOne({
            _id: contentID
        });
        if (!content) {
            res.status(404).json({ message: "Content not found" });
            return;
        }
        res
            .status(200)
            .json({
            content
        });
    }
    catch (e) {
        console.log("fetchContent");
        console.log(e);
        res
            .status(500)
            .json({
            error: e
        });
        return;
    }
});
exports.fetchLinkContent = fetchLinkContent;
const updateContent = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const needsToUpdate = {
        type: req.body.type,
        link: req.body.link,
        title: req.body.title,
        tags: req.body.tags
    };
    const TokenFromParams = req.shareToken;
    try {
        const content = yield contentModel_1.ContentModel.findOne({
            _id: TokenFromParams.id
        });
        if (!content) {
            res
                .status(404)
                .json({
                message: "Content not found"
            });
            return;
        }
        const tagID = content.tagsID;
        if (needsToUpdate.tags && needsToUpdate.tags.length > 0) {
            yield tagsModel_1.tagsModel.updateOne({
                _id: tagID
            }, {
                $addToSet: {
                    tagTitle: {
                        $each: needsToUpdate.tags
                    }
                }
            });
        }
        yield contentModel_1.ContentModel.updateOne({
            _id: TokenFromParams.id
        }, {
            $set: Object.assign({}, needsToUpdate)
        });
        res
            .status(200)
            .json({
            message: "Content updated successfully"
        });
    }
    catch (e) {
        console.log(e);
        res
            .status(500)
            .json({
            error: e
        });
        return;
    }
});
exports.updateContent = updateContent;
const deleteTags = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const tagName = req.body.tagName;
    const getTokenFromParams = req.shareToken;
    try {
        const content = yield contentModel_1.ContentModel.findOne({
            _id: getTokenFromParams.id
        });
        if (!content) {
            res
                .status(404)
                .json({
                message: "Content not found"
            });
            return;
        }
        const tagID = content.tagsID;
        yield tagsModel_1.tagsModel.updateOne({
            _id: tagID
        }, {
            $pull: {
                tagTitle: tagName
            }
        });
        res
            .status(200)
            .json({
            message: "Tag removed successfully"
        });
    }
    catch (e) {
        console.log(e);
        res
            .status(500)
            .json({
            error: e
        });
        return;
    }
});
exports.deleteTags = deleteTags;
