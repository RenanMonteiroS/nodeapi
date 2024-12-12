const {validationResult} = require('express-validator');
const fs = require('fs');
const path = require('path');

const Post = require('../models/post');
const User = require('../models/user');

exports.getPosts = (req, res, next) => {
    const page = req.query.page || 1;
    const perPage = 2;
    let totalItems;

    Post.find().countDocuments()
    .then(result => {
        totalItems = result;
        return Post.find().skip(perPage * (page - 1)).limit(perPage);
    })
    .then(posts => {
       return res.status(200).json({message: 'Posts fetched', posts: posts, totalItems: totalItems});
    })
    .catch(err => {
        if(!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    })

    
    .catch(err => {
        if(!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    });
    
};

exports.getPost = (req, res, next) => {
    const postId = req.params.postId;
    
    Post.findById(postId)
    .then(post => {
        if(!post) {
            const error = new Error('Post not found.');
            error.statusCode = 404;
            throw error;
        }
        return res.status(200).json({message: 'Post fetched!', post: post});
    })
    .catch(err => {
        if(!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    })
}

exports.postPosts = (req, res, next) => {
    const title = req.body.title;
    const content = req.body.content;

    let creator;

    if(!req.file) {
        const error = new Error('Invalid image');
        error.statusCode = 422;
        throw error;
    }
    const image = req.file.path.replace("\\" ,"/");
    
    
    const errors = validationResult(req).errors;

    if(errors[0]) {
        const error = new Error("Post wasn't created. Error: " + errors[0].msg);
        error.statusCode = 422;
        return next(error);
    }
    const post = new Post({title: title, image: image, content: content, creator: req.userId});
    
    post.save()
    .then(result => {
        return User.findById(req.userId);
    })
    .then(user => {
        user.posts.push(post);
        creator = user;
        return user.save();
    })
    .then(result => {
        return res.status(201).json({
            message: 'Post created with success',
            post: post,
        });
    })
    .catch(err => {
        if(!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    })
    
};

exports.editPosts = (req, res, next) => {
    const postId = req.params.postId;
    const errors = validationResult(req).errors;

    if(errors[0]) {
        const error = new Error("Post wasn't created. Error: " + errors[0].msg);
        error.statusCode = 422;
        return next(error);
    }

    const title = req.body.title;
    const content = req.body.content;
    let image = req.body.image;
    if(req.file) {
        image = req.file.path.replace("\\" ,"/");
    }
    if (!image) {
        const error = new Error('Invalid image.');
        error.statusCode = 422;
        throw error;
    }

    Post.findById(postId)
    .then(post => {
        if(!post) {
            const error = new Error('Post not found');
            error.statusCode = 404;
            throw error;
        }
        if(post.creator.toString() !== req.userId) {
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
        return post.save();
    })
    .then(result => {
        res.status(200).json({
            message: 'Post edited with success',
            post: result
        })
    })
    .catch(err => {
        if(!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    })
    
};

exports.deletePosts = (req, res, next) => {
    const postId = req.params.postId;

    Post.findById(postId)
    .then(post => {
        if(!post) {
            const error = new Error('No post found');
            error.statusCode = 404;
            throw error;
        }
        clearImage(post.image);
        if(post.creator.toString() !== req.userId) {
            const error = new Error("You're not the post creator")
            error.statusCode = 403;
            throw error;
        }
        deletedPost = post._id;
        return User.findById(post.creator)
    })
    .then(user => {
        user.posts.pull(postId)
        return user.save();
    })
    .then(resultUsr => {
        return Post.deleteOne({_id: postId});    
    }) 
    .then(resultPost => {
        return res.status(200).json({message: 'Post ' + postId + ' deleted!'});
    })
    .catch(err => {
        if(!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    })
}

const clearImage = filePath => {
    filePath = path.join(__dirname, '..', filePath)
    fs.unlinkSync(filePath, err => {
        throw err;
    });
}