const express = require('express');
const router = express.Router();
const songs = require('../controllers/songs');
const { isLoggedIn, isAuthor, catchAsync } = require('../middleware');
const multer = require('multer');
const { storage } = require('../cloudinary');
const upload = multer({ storage });
const Song = require('../models/song');

router.route('/songs')
    .get(songs.index)
    .post(isLoggedIn, upload.single('image'), (songs.createNewRiff))

router.get('/songs/new', (songs.renderNewForm))

router.route('/songs/:id')
    .get(songs.showRiff)
    .put(isLoggedIn, upload.single('image'), (songs.editRiff))
    .delete(isLoggedIn, (songs.deleteRiff))

router.get('/songs/:id/edit', (songs.renderEditForm))

module.exports = router;