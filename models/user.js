const mongoose = require('mongoose');
const Schema = mongoose.Schema;
// const bcrypt = require('bcrypt');
const passportLocalMongoose = require('passport-local-mongoose');

const UserSchema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true
    }
});
// const userSchema = new Schema({
//     username: {
//         type: String,
//         required: true
//     },
//     password: {
//         type: String, 
//         required: true
//     }
// });

// userSchema.statics.findAndValidate = async function (username, password) {
//     const foundUser = await this.findOne({ username });
//     const isValid = await bcrypt.compare(password, foundUser.password);
//     return isValid ? foundUser : false;
// }

// userSchema.pre('save', async function (next) {
//     if (!this.isModified('password')) return next();
//     this.password = await bcrypt.hash(this.password, 12);
//     next();
// })

UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', UserSchema);