const express = require('express');
const router = express.Router();
const {body} = require('express-validator');
const feedController = require('../controllers/feed');

router.get('/posts', feedController.getPosts);

router.get('/post', feedController.getPost)

router.post('/post', [
    body('title').trim().isAlphanumeric().withMessage("There's a invalid character!").isLength({min: 2}).withMessage("Title's too short"),
    body('content').trim().isAlphanumeric().withMessage("There's a invalid character!").isLength({min: 2}).withMessage("Content's too short")
], feedController.postPosts);

module.exports = router;