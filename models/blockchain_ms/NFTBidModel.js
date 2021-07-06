let mongoose = require('mongoose');
let Schema = mongoose.Schema;

let NFTBidSchema = new Schema({
    doneOn: Number,
    tokenID: Number,
    transactionHash: String,

    bidder: String,
    price: Number
});

module.exports = mongoose.model('nft_bids', NFTBidSchema);