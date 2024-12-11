const express = require('express');
const router = express.Router();
const { body } = require('express-validator');

const User = require('../models/user');

const authController = require('../controllers/auth');

router.put('/signup', [
    body('name')
    .isAlphanumeric().withMessage("There's invalid characters")
    .isLength({min:4}).withMessage('Name too short')
    .trim(),

    body('email')
    .isEmail().withMessage("This isn't an e-mail")
    .isLength({min: 1}).withMessage("E-mail can't be empty")
    .normalizeEmail({gmail_remove_dots: false})
    .trim()
    .custom((value, { req }) => {
        return User.findOne({ email: value })
        .then(userDoc => {
            if (userDoc) {
                //Throws an error and "cancel" the promise
                return Promise.reject('This e-mail already exists');
            }
        });
    }),

    body("password")
    .isLength({min: 5}).withMessage("Password too short")
    .trim()

], authController.signup);

router.post('/login', authController.login);

module.exports = router;