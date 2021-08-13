let mongoose = require('mongoose');
let Schema = mongoose.Schema;

let NFTEventSchema = new Schema({
    doneOn: Number,
    /*
    ----- eventType -----
    0 : MINT,
    1: SALE,
    2: PRICE_UPDATE,
    3: UPDATE_STATUS,
    4: BURN,
    5: BID_CREATE,
    6: BID_CANCEL,
    7: SELL_ON_BID
    8: AUCTION_START

    ----- nftType -----
    0: Fixed Token
    1: Auction Token
    2: Unlimited Auction Token

    */

    eventType: Number,
    nftIDSold: Number,
    transactionHash: String,

    minter: String,
    nftType: String,
    price: Number,
    minBidPrice: Number,
    instBuyPrice: Number,
    startTime: String,
    endTime: String,

    seller: String,
    buyer: String,
    nftSoldAtPrice: Number,

    priceUpdater: String,
    newNftPrice: Number,
    oldNftPrice: Number,

    auctionStarter: String,

    statusUpdater: String,
    isListed: Boolean,

    bidder: String,
    bidPrice: Number
});

module.exports = mongoose.model('nft_events', NFTEventSchema);