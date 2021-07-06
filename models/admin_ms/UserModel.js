let mongoose = require('mongoose');
let Schema = mongoose.Schema;
let crypto = require('crypto');

let UserSchema = new Schema({
    id: String,
    username: String,
    email: String,
    password: String,
    email_verify_flag: Number, // 1: non-verified, 2: verified
    email_verify_token: String,
    reset_flag: Number, // 1: usable token,  2: unusable token
    reset_token: String,
    avatar: {
        type: String,
        default: '/images/profiles/default.png',
    },
    online_state: Number, // 1: offline, 2: online
    role: Number,
    aprove_status: {
        type: String,
        default: "ACTIVE",
    },
});
// event
UserSchema.pre('save', function (next) {
    this.id = this._id.toString();
    this.password = crypto.createHash('md5').update(this.password).digest('hex');
    next();
});
// Methods
UserSchema.methods.verifyPassword = function (password) {
    return this.password === crypto.createHash('md5').update(password).digest("hex")
};
module.exports = mongoose.model('users', UserSchema);