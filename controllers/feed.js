const {validationResult} = require('express-validator');
const fs = require('fs');
const path = require('path');

const io = require('../socket');

const Post = require('../models/post');
const User = require('../models/user');

exports.getPosts = async (req, res, next) => {
    const page = req.query.page || 1;
    const perPage = 2;
    try {
        const totalItems = await Post.find().countDocuments();
        const posts = await Post.find().populate('creator').sort({ createdAt: -1 }).skip(perPage * (page - 1)).limit(perPage);
        return res.status(200).json({message: 'Posts fetched', posts: posts, totalItems: totalItems});
    }
    catch(err) {
        if(!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
    
};

exports.getPost = async (req, res, next) => {
    const postId = req.params.postId;
    const post = await Post.findById(postId);
    try {
        if(!post) {
            const error = new Error('Post not found.');
            error.statusCode = 404;
            throw error;
        }
        return res.status(200).json({message: 'Post fetched!', post: post});
    }
    catch(err) {
        if(!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
}

exports.postPosts = async (req, res, next) => {
    if(!req.file) {
        const error = new Error('Invalid image');
        error.statusCode = 422;
        throw error;
    }

    const errors = validationResult(req).errors;

    if(errors[0]) {
        const error = new Error("Post wasn't created. Error: " + errors[0].msg);
        error.statusCode = 422;
        return next(error);
    }

    const title = req.body.title;
    const content = req.body.content;

    const image = req.file.path.replace("\\" ,"/");
    
    const post = new Post({title: title, image: image, content: content, creator: req.userId});
    
    try {
        const user = await User.findById(req.userId);
        user.posts.push(post);

        await post.save();
        await user.save();
        io.getIO().emit('posts', { action: 'create', post: {...post._doc, creator: {_id: user._id, name: user.name} }});

        return res.status(201).json({
            message: 'Post created with success',
            post: post,
            creator: { _id: user._id, name: user.name}
        });
    }
    catch (err) {
        if(!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
    
};

exports.editPosts = async (req, res, next) => {
    const postId = req.params.postId;
    const errors = validationResult(req).errors;

    if(errors[0]) {
        const error = new Error("Post wasn't created. Error: " + errors[0].msg);
        error.statusCode = 422;
        return next(error);
    }

    let image = req.body.image;
    if(req.file) {
        image = req.file.path.replace("\\" ,"/");
    }
    if (!image) {
        const error = new Error('Invalid image.');
        error.statusCode = 422;
        throw error;
    }
    const title = req.body.title;
    const content = req.body.content;
    

    try {
        const post = await Post.findById(postId).populate('creator');

        if(!post) {
            const error = new Error('Post not found');
            error.statusCode = 404;
            throw error;
        }
        if(post.creator._id.toString() !== req.userId) {
            const error = new Error("You're not the post creator.");
            error.statusCode = 403;
            throw error;
        }
        if(image !== post.image) {
            clearImage(post.image);
        }

        post.title = title;
        post.content = content;
        post.image = image;
        const result = await post.save();

        io.getIO().emit('posts', { action: 'update', post: result});
        res.status(200).json({
            message: 'Post edited with success',
            post: result,
        })

    }
    catch (err) {
        if(!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
    
};

exports.deletePosts = async (req, res, next) => {
    const postId = req.params.postId;

    try {
        const post = await Post.findById(postId);
        
        if(!post) {
            const error = new Error('No post found');
            error.statusCode = 404;
            throw error;
        }

        if(post.creator.toString() !== req.userId) {
            const error = new Error("You're not the post creator")
            error.statusCode = 403;
            throw error;
        }

        clearImage(post.image);
        
        deletedPost = post._id;

        const user = await User.findById(post.creator);

        user.posts.pull(postId)
        await user.save();

        await Post.deleteOne({_id: postId});

        io.getIO().emit('posts', { action: 'delete', post: postId });
        res.status(200).json({message: 'Post ' + postId + ' deleted!'});

    }
    catch(err) {
        if(!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }

}

const clearImage = filePath => {
    filePath = path.join(__dirname, '..', filePath)
    fs.unlinkSync(filePath, err => {
        throw err;
    });
}