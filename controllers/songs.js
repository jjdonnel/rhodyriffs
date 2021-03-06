const Song = require('../models/song');
const cloudinary = require('cloudinary').v2;

module.exports.index = async (req, res) => {
    const songs = await (await Song.find({})).reverse();
    res.render('songs/index', { songs });
}

module.exports.renderNewForm = async (req, res) => {
    res.render('songs/new');
}

module.exports.createNewRiff = async (req, res) => {
    const song = new Song(req.body.song);
    console.log(song._id);
    song.author = req.user._id;
    song.image = req.file.path;
    // console.log(song.image);
    await song.save();
    req.flash('success', 'You just added a new riff!');
    // console.log(req.body.song);
    res.redirect(`/songs/${song._id}`);
}

module.exports.showRiff = async function(req, res) {
    const song = await Song.findById(req.params.id).populate('author');
    if (!song) {
        req.flash('error', 'Cannot find that riff!');
        return res.redirect('/songs');
    }
    // console.log(song);
    // console.log(song.user.username);
    res.render('songs/show', { song });
}

module.exports.renderEditForm = async (req, res) => {
    const song = await Song.findById(req.params.id);
    if (!song) {
        req.flash('error', 'Cannot find that riff!');
        return res.redirect('/songs');
    }
    // res.send("It Worked!")
    res.render('songs/edit', { song });
}

module.exports.editRiff = async (req, res) => {
    try {
     let song = await Song.findById(req.params.id);
     let music = req.body.song;
     console.log(req.body.song);
    await cloudinary.uploader.destroy(song._id);
        const result = await cloudinary.uploader.upload(req.file.path, { resource_type: 'video' });
        const data = {
            image: result.secure_url,
            imageId: result.public_id
        };
        // const { id } = req.params;
        song = await Song.findByIdAndUpdate(req.params.id, data, { ...req.body.song });
        song.title = music.title;
        song.description = music.description;
        await song.save();
        req.flash('success', 'You just edited your riff!');
        res.redirect(`/songs/${song._id}`); 
        
    } catch (err) {
        console.log(err);
    }
}

module.exports.deleteRiff = async (req, res) => {
    const { id } = req.params;
    await Song.findByIdAndDelete(id);
    req.flash('success', 'You removed your riff!');
    res.redirect('/songs');
}