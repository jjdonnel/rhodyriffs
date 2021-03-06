const express = require('express');
const router = express.Router();
const { isLoggedIn, isAuthor, catchAsync } = require('../middleware');
const users = require('../controllers/users');
const User = require('../models/user');
const passport = require('passport');
const LocalStrategy = require('passport-local');

router.get('/', (users.home))

router.route('/register')
    .get(users.registerForm)
    .post(users.registerNewUser)

router.route('/login')
    .get(users.loginForm)
    .post(passport.authenticate('local', { failureRedirect: '/login' }), (users.login))

router.get('/logout', (users.logout))

module.exports = router;