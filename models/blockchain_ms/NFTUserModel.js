let mongoose = require('mongoose');
let Schema = mongoose.Schema;

let NFTUserSchema = new Schema({
    walletAddress: String,

    displayName: String,
    customUrl: String,
    userBio: String,
    userAvatarUrl: String,
    userBackgroupUrl: String,

    socialPortfolioUrl: String,
    socialTwitterUrl: String,

    accountCreatedAt: Date,
    updatedAt: Date,
    banned: { type: Boolean, default: false },
    verified: { type: Boolean, default: false }
});

module.exports = mongoose.model('nft_users', NFTUserSchema);