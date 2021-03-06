const Song = require('./models/song');

module.exports.isLoggedIn = (req, res, next) => {
    req.session.returnTo = req.originalUrl;
    // console.log("REQ.USER...", req.user);
    if (!req.isAuthenticated()) {
        return res.redirect('/login');
    }
    next();
}
module.exports.isAuthor = async (req, res, next) => {
    const { id } = req.params;
    const song = await Song.findById(id);
    if (!song.author.equals(req.user._id)) {
        return res.redirect(`/songs/${id}`);
    }
    next();
}

module.exports.catchAsync = func => {
    return (req, res, next) => {
        func(req, res, next).catch(next);
    }
}