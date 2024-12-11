const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require('../models/user');

exports.signup = (req, res, next) => {
    const errors = validationResult(req).errors
    if (errors[0]) {
        const error = new Error("Validation failed");
        error.statusCode = 422;
        error.data = errors;
        throw error;
    }

    const name = req.body.name;
    const email = req.body.email;
    const password = req.body.password;

    bcrypt.hash(password, 12)
    .then(cryptPwd => {
        const user = new User({
            name: name, 
            email: email, 
            password: cryptPwd
        });
        return user.save();
    })
    .then((result) => {
        res.status(201).json({message: 'User created', userId: result._id});
    })
    .catch(err => {
        if(!err.statusCode){
            err.statusCode = 500;
        }
        return next(err);
    });

};

exports.login = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password; 
    let loadedUser; 
    User.findOne({email: email})
    .then(user => {
        if(!user) {
            const error = new Error("User not found");
            error.statusCode = 401;
            throw error;
        }
        loadedUser = user;
        return bcrypt.compare(password, user.password);
    })
    .then(match => {
        if(!match) {
            const error = new Error("Wrong password");
            error.statusCode = 401;
            throw error;
        }
        const token = jwt.sign({email: loadedUser.email, userId: loadedUser._id.toString()}, 'r4toR0euAR@Upa', {expiresIn: '1h'});
        res.status(200).json({token: token, userId: loadedUser._id.toString()});
    })
    .catch(err => {
        if(!err.statusCode) {
            err.statusCode = 500;
        }
        next(err)
    })
}