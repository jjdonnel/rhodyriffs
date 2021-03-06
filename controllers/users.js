const User = require('../models/user');

module.exports.home = (req, res) => {
    res.render('home');
}

module.exports.registerForm = (req, res) => {
    res.render('register');
}

module.exports.registerNewUser = async (req, res) => {
    try {
        const { email, username, password } = req.body;
        const user = new User({ email, username });
        const registeredUser = await User.register(user, password);
        req.login(registeredUser, err => {
            if (err) return next(err);
            req.flash('Success', 'Welcome to RhodyRiffs!');
            res.redirect('/songs');
        })
    } catch (e) {
        // req.session.user_id = user._id;
        req.flash('error', e.message);
        res.redirect('register');
    }
    }

    module.exports.loginForm = (req, res) => {
        res.render('login');
    }

    module.exports.login = (req, res) => {
        req.flash('success', 'Welcome back!');
        // const { username, password } = req.body;
        // const foundUser = await User.findAndValidate(username, password);
        // console.log(username);
        // if (foundUser) {
        //     req.session.user_id = foundUser._id;
        const redirectUrl = req.session.returnTo || '/songs';
        delete req.session.returnTo;
            res.redirect(redirectUrl);
        // } else {
        //     res.redirect('login');
        // }
    }

    module.exports.logout = (req, res) => {
        req.logout();
        req.flash('success', 'Goodbye!');
        // req.session.user_id = null;
        res.redirect('/songs');
    }