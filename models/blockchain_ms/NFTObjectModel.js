let mongoose = require('mongoose');
let Schema = mongoose.Schema;

/*
----- nftType -----
0: Fixed Token
1: Auction Token
2: Unlimited Auction Token
*/

let NFTObjectSchema = new Schema({
    baseID: String,

    name: String,
    description: String,
    image: String,

    nftType: Number,
    price: String,
    minBidPrice: String,
    startTime: String,
    endTime: String,

    mintTransactionHash: String,
    updatedAt: Number,
    createdAt: Number,
    initialCreatorAddress: String,
    ownerAddress: String,
    tokenID: Number,

    voteCount: Number,
    listed: { type: Boolean, default: false },
    attributes: [{ trait_type: String, value: Number }],
    category: [String],

    approved: { type: Boolean, default: false },
    verified: { type: Boolean, default: false }
});

module.exports = mongoose.model('nft_objects', NFTObjectSchema);