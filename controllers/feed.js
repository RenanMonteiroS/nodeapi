const {validationResult} = require('express-validator');

const Post = require('../models/post');

exports.getPosts = (req, res, next) => {
    res.status(200).json({
        posts: [{
            _id: '1',
            title: 'Post', 
            content: "FirstPost", 
            imageUrl: "images/black.jpeg", 
            creator: {
                name: 'Creator'
            },
            createdAt: new Date()
        }]
    });
};

exports.getPost = (req, res, next) => {
    const productId = req.param.productId
}

exports.postPosts = (req, res, next) => {
    const title = req.body.title;
    const content = req.body.content;
    const errors = validationResult(req).errors;
    if(errors[0]) {
        const error = new Error("Post wasn't created. Error: " + errors[0].msg);
        error.statusCode = 422;
        return next(error);
    }
    const post = new Post({title: title, image: "images/black.jpeg", content: content, creator: {name: 'Creator'}});

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