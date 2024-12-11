const {validationResult} = require('express-validator');
const fs = require('fs');
const path = require('path');

const Post = require('../models/post');

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
       console.log(posts);
       res.status(200).json({message: 'Posts fetched', posts: posts, totalItems: totalItems});
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
        console.log(post);
        if(!post) {
            const error = new Error('Post not found.');
            error.statusCode = 404;
            throw error;
        }
        res.status(200).json({message: 'Post fetched!', post: post});
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
    const post = new Post({title: title, image: image, content: content, creator: {name: 'Creator'}});
    console.log(post);
    post.save()
    .then(result => {
        console.log(result);
        res.status(201).json({
            message: 'Post created with success',
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

        return Post.deleteOne({_id: postId});
    })
    .then(result => {
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