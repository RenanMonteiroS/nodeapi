const express = require('express');
const router = express.Router();
const {body} = require('express-validator');

const feedController = require('../controllers/feed');
const isAuth = require('../middleware/is-auth');

router.get('/posts', isAuth, feedController.getPosts);

router.get('/post/:postId', isAuth, feedController.getPost);

router.put('/post/:postId', isAuth, [
    body('title').trim().isAlphanumeric().withMessage("There's a invalid character!").isLength({min: 2}).withMessage("Title's too short"),
    body('content').trim().isAlphanumeric().withMessage("There's a invalid character!").isLength({min: 2}).withMessage("Content's too short")
], feedController.editPosts);

router.post('/post', isAuth, [
    body('title').trim().isAlphanumeric().withMessage("There's a invalid character!").isLength({min: 2}).withMessage("Title's too short"),
    body('content').trim().isAlphanumeric().withMessage("There's a invalid character!").isLength({min: 2}).withMessage("Content's too short")
], feedController.postPosts);

router.delete('/post/:postId', isAuth, feedController.deletePosts)

module.exports = router;