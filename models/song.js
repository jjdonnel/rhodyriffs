const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const SongSchema = new Schema({
    title: String,
    image: String,
    description: String,
    author: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    }
}); 

module.exports = mongoose.model('Song', SongSchema);