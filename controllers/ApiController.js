let path = require('path');
let fs = require('fs');
let config = require('../config/index')();
let slugify = require('slugify');
let axios = require('axios');
let ethers = require('ethers');

let BaseController = require('./BaseController');

let NFTObjectModel = require('../models/blockchain_ms/NFTObjectModel');
let NFTBidModel = require('../models/blockchain_ms/NFTBidModel');
let NFTUserModel = require('../models/blockchain_ms/NFTUserModel');
let NFTEventModel = require('../models/blockchain_ms/NFTEventModel');


module.exports = BaseController.extend({
    name: 'ApiController',

    getNFTUserProfile: async function (req, res, next) {
        try {
            const walletAddress = req.params.walletAddress.toLowerCase();

            if (!walletAddress) return res.send({ status: 'failed', exception: "Invalid Wallet Address" });

            let nftUserProfile = await NFTUserModel.findOne({ walletAddress: walletAddress });
            if (!nftUserProfile) {
                const newNFTUserProfile = new NFTUserModel({
                    walletAddress: walletAddress,
                    accountCreatedAt: Date.now()
                });
                await newNFTUserProfile.save();
            }
            nftUserProfile = await NFTUserModel.findOne({ walletAddress: walletAddress });

            return res.send({ status: 'success', nftUserProfile: nftUserProfile });
        }
        catch (ex) {
            console.log(ex);
            return res.send({ status: 'failed', exception: ex });
        }
    },

    updateNFTUserProfile: async function (req, res, next) {
        try {
            const walletAddress = req.body.walletAddress.toLowerCase();
            const customUrl = req.body.customUrl;
            const displayName = req.body.displayName;
            const userBio = req.body.userBio;
            const userAvatarUrl = req.body.userAvatarUrl;
            const userBackgroupUrl = req.body.userBackgroupUrl;

            const socialPortfolioUrl = req.body.socialPortfolioUrl;
            const socialTwitterUrl = req.body.socialTwitterUrl;

            if (!walletAddress) return res.send({ status: 'failed', exception: "Invalid Wallet Address" });

            let nftUserProfile = await NFTUserModel.findOneAndUpdate({ walletAddress: walletAddress }, {
                updatedAt: Date.now(),
                displayName: displayName,
                customUrl: customUrl,
                userBio: userBio,
                userAvatarUrl: userAvatarUrl,
                userBackgroupUrl: userBackgroupUrl,

                socialPortfolioUrl: socialPortfolioUrl,
                socialTwitterUrl: socialTwitterUrl,
            }, { upsert: true, new: true });

            return res.send({ status: 'success', nftUserProfile: nftUserProfile });
        }
        catch (ex) {
            return res.send({ status: 'failed', exception: ex });
        }
    },

    getNFTUserList: async function (req, res, next) {
        try {
            const nftUserList = await NFTUserModel.find();

            return res.send({ status: 'success', nftUserList: nftUserList });
        }
        catch (ex) {
            return res.send({ status: 'failed', exception: ex });
        }
    },


    addNFTMetaData: async function (req, res, next) {
        try {
            //------------------------- Image File Upload To IPFS --------------------------
            const name = req.body.name;
            const description = req.body.description;
            const image = req.body.image;
            
            const assetUrl=req.body.assetUrl;
            const assetType=req.body.assetType;

            //------------------------- NFT Object Create --------------------------        
            const baseID = await slugify(`${name} ${Date.now()}`, { replacement: '_' });

            const nftObject = await NFTObjectModel.findOneAndUpdate({ baseID: baseID }, {
                name: name,
                description: description,
                image: image,
                assetUrl: assetUrl,
                assetType: assetType
            }, { upsert: true, new: true });

            return res.send({ status: 'success', baseID: nftObject.baseID });
        }
        catch (ex) {
            return res.send({ status: 'failed', exception: ex });
        }
    },

    getNFTObjectList: async function (req, res, next) {
        try {
            let start = Number(req.query.start);
            let count = Number(req.query.count);
            const category = req.query.category;
            const sortField = req.query.sortField;
            const sortOrder = req.query.sortOrder;
            const nftType = req.query.nftType;

            let nfts = [];
            let findOpt = { approved: true };
            let sortOpt = {};

            if (category && category != "undefined") {
                findOpt.category = category;
            }
            if (nftType && nftType != "undefined") {
                if (nftType == "fixed") findOpt.nftType = 0;
                if (nftType == "auction") findOpt.nftType = 1;
                if (nftType == "unlimited") findOpt.nftType = 2;
            }

            if (sortField && sortOrder) {
                if (sortOrder == "asc") {
                    sortOpt[`${sortField}`] = 1;
                }
                else if (sortOrder == "desc") {
                    sortOpt[`${sortField}`] = -1;
                }
            }

            nftList = await NFTObjectModel.find(findOpt).sort(sortOpt).skip(start).limit(count);
            let totalNftList = await NFTObjectModel.find(findOpt);

            return res.send({ status: 'success', totalCount: totalNftList.length, nftList: nftList });
        }
        catch (ex) {
            return res.send({ status: 'failed', exception: ex });
        }
    },



    getNFTUserFullDetail: async function (req, res, next) {
        try {
            const walletAddress = req.params.walletAddress.toLowerCase();

            const userProfile = await NFTUserModel.findOne({ walletAddress: walletAddress });

            let createdNfts = [];
            let currentNfts = [];
            let boughtNfts = [];
            let soldNfts = [];

            createdNfts = await NFTObjectModel.find({ initialCreatorAddress: walletAddress });
            currentNfts = await NFTObjectModel.find({ ownerAddress: walletAddress });

            let boughtEvents = await NFTEventModel.find({ buyer: walletAddress });
            for (let i = 0; i < boughtEvents.length; i++) {
                const nftIDSold = boughtEvents[i].nftIDSold;
                const nftObjectList = await NFTObjectModel.findOne({ tokenID: nftIDSold });
                if (nftObjectList) boughtNfts.push(nftObjectList);
            }

            let soldEvents = await NFTEventModel.find({ seller: walletAddress });
            for (let i = 0; i < soldEvents.length; i++) {
                const nftIDSold = soldEvents[i].nftIDSold;
                const nftObjectList = await NFTObjectModel.findOne({ tokenID: nftIDSold });
                if (nftObjectList) soldNfts.push(nftObjectList);
            }

            let userNfts = {
                createdNfts: createdNfts,
                currentNfts: currentNfts,
                boughtNfts: boughtNfts,
                soldNfts: soldNfts
            }

            let retData = {
                userProfile: userProfile, userNfts: userNfts
            }

            return res.send({ status: 'success', data: retData });
        }
        catch (ex) {
            return res.send({ status: 'failed', exception: ex });
        }
    },

    getNFTTopUserList: async function (req, res, next) {
        try {
            let sellerList = [];
            const nftUserList = await NFTUserModel.find();

            for (var i = 0; i < nftUserList.length; i++) {
                let soldAmount = 0;
                let soldEvents = await NFTEventModel.find({ seller: nftUserList[i].walletAddress });
                for (var j = 0; j < soldEvents.length; j++) {
                    soldAmount += soldEvents[j].nftSoldAtPrice;
                }
                let createdNFTs = await NFTObjectModel.find({ initialCreatorAddress: nftUserList[i].walletAddress });

                if (createdNFTs.length > 0) {
                    sellerList.push({
                        user: nftUserList[i],
                        soldAmount: soldAmount,
                        createdNFTs: createdNFTs
                    })
                }
            }

            const sortedSellerList = sellerList.sort((seller1, seller2) => {
                if (seller1.soldAmount > seller2.soldAmount) return -1;
                if (seller1.soldAmount < seller2.soldAmount) return 1;
                return 0;
            })

            return res.send({ status: 'success', data: sortedSellerList });
        }
        catch (ex) {
            return res.send({ status: 'failed', exception: ex });
        }
    },

    getNFTObjectDetail: async function (req, res, next) {
        try {
            const baseID = req.params.baseID;

            let nftDetail = {};

            const nft = await NFTObjectModel.findOne({ baseID: baseID });
            if (nft) {
                const initialCreatorAddress = nft.initialCreatorAddress;
                const ownerAddress = nft.ownerAddress;
                const tokenID = nft.tokenID;

                const creator = await NFTUserModel.findOne({ walletAddress: initialCreatorAddress });
                const owner = await NFTUserModel.findOne({ walletAddress: ownerAddress });
                const historyEvents = await NFTEventModel.find({ nftIDSold: tokenID });
                const bids = await NFTBidModel.find({ tokenID: tokenID });

                nftDetail.nft = nft;
                nftDetail.creator = creator;
                nftDetail.owner = owner;
                nftDetail.historyEvents = historyEvents;
                nftDetail.bids = bids;
            }

            return res.send({ status: 'success', nftDetail: nftDetail });
        }
        catch (ex) {
            return res.send({ status: 'failed', exception: ex });
        }
    },

    syncBlock: async function (req, res, next) {
        try {
            console.log("------------- SYNC BLOCK ----------------");
            var lastTimeStamp = 0;
            var searchData = await NFTEventModel.aggregate([{
                "$group": {
                    "_id": null,
                    "lastTimeStamp": { "$max": "$doneOn" }
                }
            }]);
           // if (searchData.length > 0 && searchData[0].lastTimeStamp) lastTimeStamp = searchData[0].lastTimeStamp;

            var data = JSON.stringify({
                query: `{
                            minteds(first: 1000, where:{timestamp_gt:${lastTimeStamp}}) {
                                id
                                eventType
                                timestamp
                                txhash
                                logIndex

                                minter
                                loyaltyFee
                                nftType
                                category
                                subcategory
                                nftID
                                uri
                            }
                            purchases(first: 1000, where:{timestamp_gt:${lastTimeStamp}}) {
                                id
                                eventType
                                timestamp
                                txhash
                                logIndex

                                previousOwner
                                newOwner
                                price
                                nftID
                                uri
                            }
                            priceUpdates(first: 1000, where:{timestamp_gt:${lastTimeStamp}}) {
                                id
                                eventType
                                timestamp
                                txhash
                                logIndex

                                owner
                                oldPrice
                                newPrice
                                nftID
                            }
                            auctionStarts(first: 1000, where:{timestamp_gt:${lastTimeStamp}}) {
                                id
                                eventType
                                timestamp
                                txhash
                                logIndex

                                owner
                                minBidPrice
                                minBidInc
                                instBuyPrice
                                startTime
                                endTime
                                nftID
                            }
                            nftListingStatuses(first: 1000, where:{timestamp_gt:${lastTimeStamp}}) {
                                id
                                eventType
                                timestamp
                                txhash
                                logIndex

                                owner
                                nftID
                                isListed
                            }
                            burneds(first: 1000, where:{timestamp_gt:${lastTimeStamp}}) {
                                id
                                eventType
                                timestamp
                                txhash
                                logIndex

                                nftID
                            }
                            bidCreates(first: 1000, where:{timestamp_gt:${lastTimeStamp}}) {
                                id
                                eventType
                                timestamp
                                txhash
                                logIndex

                                buyer
                                nftID
                                price
                            }
                    
                            solds(first: 1000, where:{timestamp_gt:${lastTimeStamp}}) {
                                id
                                eventType
                                timestamp
                                txhash
                                logIndex

                                previousOwner
                                newOwner
                                price
                                nftID
                                uri
                            }
                            listedToSells(first: 1000, where:{timestamp_gt:${lastTimeStamp}}) {
                                id
                                eventType
                                timestamp
                                txhash
                                logIndex

                                owner
                                price
                                nftID
                            }

                        }`,
                variables: {}
            });

            var axios_config = {
                method: 'post',
                url: config.sub_graph_url,
                headers: {
                    'Content-Type': 'application/json'
                },
                data: data
            };

            const result = await axios(axios_config);

            const mintEntities = result.data.data.minteds;
            const purchaseEntities = result.data.data.purchases;
            const priceUpdateEntities = result.data.data.priceUpdates;
            const auctionStartEntities = result.data.data.auctionStarts;
            const nftListStatusEntities = result.data.data.nftListingStatuses;
            const burnEntities = result.data.data.burneds;
            const bidCreateEntities = result.data.data.bidCreates;
           const justSale=result.data.data.listedToSells;
            const sellEntities = result.data.data.solds;

            var eventEntityList = [];
            var sortedEventEntityList = [];
            for (var i = 0; i < (mintEntities===undefined ? 0:mintEntities.length); i++) {
                eventEntityList.push(mintEntities[i]);
            }
            for (var i = 0; i < (purchaseEntities===undefined ? 0:purchaseEntities.length); i++) {
                eventEntityList.push(purchaseEntities[i]);
            }
        
       
            for (var i = 0; i < (priceUpdateEntities===undefined ? 0:priceUpdateEntities.length) ; i++) {
                eventEntityList.push(priceUpdateEntities[i]);
            }
        
            for (var i = 0; i < (auctionStartEntities===undefined ? 0:auctionStartEntities.length); i++) {
                eventEntityList.push(auctionStartEntities[i]);
            }
            for (var i = 0; i < (nftListStatusEntities===undefined ? 0:nftListStatusEntities.length); i++) {
                eventEntityList.push(nftListStatusEntities[i]);
            }
            for (var i = 0; i < (burnEntities===undefined ? 0:burnEntities.length); i++) {
                eventEntityList.push(burnEntities[i]);
            }
            for (var i = 0; i <(bidCreateEntities===undefined ? 0:bidCreateEntities.length); i++) {
                eventEntityList.push(bidCreateEntities[i]);
            }
            for (var i = 0; i <(justSale===undefined ? 0:justSale.length); i++) {
                eventEntityList.push(justSale[i]);
            }
            for (var i = 0; i < (sellEntities===undefined ? 0:sellEntities.length); i++) {
                eventEntityList.push(sellEntities[i]);
            }

            sortedEventEntityList = eventEntityList.sort((evt1, evt2) => {
                if (evt1.timestamp > evt2.timestamp) return 1;
                if (evt1.timestamp < evt2.timestamp) return -1;
                return 0;
            })

            for (var i = 0; i < sortedEventEntityList.length; i++) {
                if (sortedEventEntityList[i].eventType == 0) {
                    ////////////////////////// Mint Event /////////////////////////
                    const timestamp = sortedEventEntityList[i].timestamp;
                    const txhash = sortedEventEntityList[i].txhash;
                    const nftID = sortedEventEntityList[i].nftID;
                    const minter = sortedEventEntityList[i].minter;
                    const nftType = sortedEventEntityList[i].nftType;
                    const uri = sortedEventEntityList[i].uri;
                    const base_id = uri.split('/').pop();
                    const loyaltyFee=sortedEventEntityList[i].loyaltyFee;
                    const category=sortedEventEntityList[i].category;
                    const subcategory=sortedEventEntityList[i].subcategory;

                    await NFTObjectModel.findOneAndUpdate({ baseID: base_id }, {
                        nftType: nftType,
                        loyaltyFee:loyaltyFee,
                        category:category,
                        subcategory:subcategory,
                        mintTransactionHash: txhash,
                        updatedAt: timestamp,
                        createdAt: timestamp,
                        initialCreatorAddress: minter,
                        ownerAddress: minter,
                        tokenID: nftID,
                        listed: false,
                        approved: true
                    });

                    await NFTEventModel.findOneAndUpdate({
                        doneOn: timestamp,
                        eventType: 0, //0 : MINT, 1 : SALE, 2 : PRICE_UPDATE
                        nftIDSold: nftID,
                        transactionHash: txhash,
                    }, {
                        minter: minter,
                        nftType: nftType,
                    
                    }, { upsert: true });
                }
                
                    else if (sortedEventEntityList[i].eventType == 10) {
                        ////////////////////////// MultipleMint Event /////////////////////////
                        const timestamp = sortedEventEntityList[i].timestamp;
                        const txhash = sortedEventEntityList[i].txhash;
                        const nftID = sortedEventEntityList[i].nftID;
                        const minter = sortedEventEntityList[i].minter;
                        const nftType = sortedEventEntityList[i].nftType;
                        const price = ethers.utils.formatEther(sortedEventEntityList[i].price);
                        const minBidPrice = ethers.utils.formatEther(sortedEventEntityList[i].minBidPrice);
                        const startTime = sortedEventEntityList[i].startTime;
                        const endTime = sortedEventEntityList[i].endTime;
                        const uri = sortedEventEntityList[i].uri;
                        const base_id = uri.split('/').pop();
    
                        await NFTObjectModel.findOneAndUpdate({ baseID: base_id }, {
                            nftType: nftType,
                            price: price,
                            minBidPrice: minBidPrice,
                            startTime: startTime,
                            endTime: endTime,
    
                            mintTransactionHash: txhash,
                            updatedAt: timestamp,
                            createdAt: timestamp,
                            initialCreatorAddress: minter,
                            ownerAddress: minter,
                            tokenID: nftID,
                            listed: false,
                            approved: true
                        });
    
                        await NFTEventModel.findOneAndUpdate({
                            doneOn: timestamp,
                            eventType: 10, //0 : MINT, 1 : SALE, 2 : PRICE_UPDATE
                            nftIDSold: nftID,
                            transactionHash: txhash,
                        }, {
                            minter: minter,
                            nftType: nftType,
                            price: price,
                            minBidPrice: minBidPrice,
                            startTime: startTime,
                            endTime: endTime,
                        }, { upsert: true });
                    }
                else if (sortedEventEntityList[i].eventType == 1 || sortedEventEntityList[i].eventType == 12  ) {
                    ////////////////////////// Purchase Event /////////////////////////
                    const timestamp = sortedEventEntityList[i].timestamp;
                    const txhash = sortedEventEntityList[i].txhash;
                    const nftID = sortedEventEntityList[i].nftID;
                    const uri = sortedEventEntityList[i].uri;
                    const price = ethers.utils.formatEther(sortedEventEntityList[i].price);
                    const previousOwner = sortedEventEntityList[i].previousOwner;
                    const newOwner = sortedEventEntityList[i].newOwner;
                    const evntype=sortedEventEntityList[i].eventType;
                    await NFTBidModel.deleteMany({ tokenID: nftID });
                   
                    await NFTObjectModel.findOneAndUpdate({ tokenID: nftID }, {
                        price: price,
                        updatedAt: timestamp,
                        ownerAddress: newOwner,
                        listed: false
                    });

                    await NFTEventModel.findOneAndUpdate({
                        doneOn: timestamp,
                        eventType: evntype, //0 : MINT, 1 : SALE, 2 : PRICE_UPDATE
                        nftIDSold: nftID,
                        transactionHash: txhash,
                    }, {
                        seller: previousOwner,
                        buyer: newOwner,
                        nftSoldAtPrice: price
                    }, { upsert: true });
                }
                else if (sortedEventEntityList[i].eventType == 2) {
                    ////////////////////////// Price Update Event /////////////////////////
                    const timestamp = sortedEventEntityList[i].timestamp;
                    const txhash = sortedEventEntityList[i].txhash;
                    const nftID = sortedEventEntityList[i].nftID;
                    const owner = sortedEventEntityList[i].owner;
                    const oldPrice = ethers.utils.formatEther(sortedEventEntityList[i].oldPrice);
                    const newPrice = ethers.utils.formatEther(sortedEventEntityList[i].newPrice);

                    await NFTObjectModel.findOneAndUpdate({ tokenID: nftID }, {
                        price: newPrice,
                        updatedAt: timestamp
                    });

                    await NFTEventModel.findOneAndUpdate({
                        doneOn: timestamp,
                        eventType: 2, //0 : MINT, 1 : SALE, 2 : PRICE_UPDATE
                        nftIDSold: nftID,
                        transactionHash: txhash,
                    }, {
                        priceUpdater: owner,
                        oldNftPrice: oldPrice,
                        newNftPrice: newPrice
                    }, { upsert: true });
                }
                else if (sortedEventEntityList[i].eventType == 8) {
                    ////////////////////////// Auction Start Event /////////////////////////
                    const timestamp = sortedEventEntityList[i].timestamp;
                    const txhash = sortedEventEntityList[i].txhash;
                    const nftID = sortedEventEntityList[i].nftID;
                    const owner = sortedEventEntityList[i].owner;
                    const minBidPrice =ethers.utils.formatEther(sortedEventEntityList[i].minBidPrice);
                    const minBidInc=sortedEventEntityList[i].minBidInc;
                    const startTime = Date.now();
                    const endTime = sortedEventEntityList[i].endTime;
                    const instBuyPrice=ethers.utils.formatEther(sortedEventEntityList[i].instBuyPrice);
                    await NFTBidModel.deleteMany({ tokenID: nftID });

                    await NFTObjectModel.findOneAndUpdate({ tokenID: nftID }, {
                        updatedAt: timestamp,
                        listed: true,
                        minBidPrice: minBidPrice,
                        instBuyPrice: instBuyPrice,
                        minBidInc: minBidInc,
                        startTime: startTime,
                        endTime: endTime,
                        nftType: 1
                    });

                    await NFTEventModel.findOneAndUpdate({
                        doneOn: timestamp,
                        eventType: 8, //0 : MINT, 1 : SALE, 2 : PRICE_UPDATE, 3 : UPDATE_STATUS
                        nftIDSold: nftID,
                        transactionHash: txhash,
                    }, {
                        auctionStarter: owner,
                        minBidPrice: minBidPrice,
                        instBuyPrice: instBuyPrice,
                        startTime: startTime,
                        endTime: endTime
                    }, { upsert: true });
                }
                else if (sortedEventEntityList[i].eventType == 11) {
                    ////////////////////////// Start Sale Event /////////////////////////
                    const timestamp = sortedEventEntityList[i].timestamp;
                    const txhash = sortedEventEntityList[i].txhash;
                    const nftID = sortedEventEntityList[i].nftID;
                    const owner = sortedEventEntityList[i].owner;
                    const price = ethers.utils.formatEther(sortedEventEntityList[i].price);
                    
                    

                    await NFTBidModel.deleteMany({ tokenID: nftID });

                    await NFTObjectModel.findOneAndUpdate({ tokenID: nftID }, {
                        updatedAt: timestamp,
                        listed: true,
                        price: price,
                    
                        nftType: 0,
                    });

                    await NFTEventModel.findOneAndUpdate({
                        doneOn: timestamp,
                        eventType: 11, //0 : MINT, 1 : SALE, 2 : PRICE_UPDATE, 3 : UPDATE_STATUS
                        nftIDSold: nftID,
                        transactionHash: txhash,
                    }, {
                        seller: owner
                    }, { upsert: true });
                }
                else if (sortedEventEntityList[i].eventType == 9) {
                    ////////////////////////// Auction with Deadline Start Event /////////////////////////
                    const timestamp = sortedEventEntityList[i].timestamp;
                    const txhash = sortedEventEntityList[i].txhash;
                    const nftID = sortedEventEntityList[i].nftID;
                    const owner = sortedEventEntityList[i].owner;
                    const minBidPrice = ethers.utils.formatEther(sortedEventEntityList[i].minBidPrice);
                    const instBuyPrice=ethers.utils.formatEther(sortedEventEntityList[i].instBuyPrice);

                    const minBidInc=sortedEventEntityList[i].minBidInc;
                    const startTime = Date.now();
                    const endTime = sortedEventEntityList[i].endTime;

                    await NFTBidModel.deleteMany({ tokenID: nftID });

                    await NFTObjectModel.findOneAndUpdate({ tokenID: nftID }, {
                        updatedAt: timestamp,
                        listed: true,
                        minBidPrice: minBidPrice,
                        instBuyPrice: instBuyPrice,
                        minBidInc: minBidInc,
                        startTime: startTime,
                        endTime: endTime,
                        nftType: 2
                    });

                    await NFTEventModel.findOneAndUpdate({
                        doneOn: timestamp,
                        eventType: 9, //0 : MINT, 1 : SALE, 2 : PRICE_UPDATE, 3 : UPDATE_STATUS
                        nftIDSold: nftID,
                        transactionHash: txhash,
                    }, {
                        auctionStarter: owner,
                        minBidPrice: minBidPrice,
                        instBuyPrice: instBuyPrice,
                        startTime: startTime,
                        endTime: endTime
                    }, { upsert: true });
                }
                else if (sortedEventEntityList[i].eventType == 3) {
                    ////////////////////////// Status Update Event /////////////////////////
                    const timestamp = sortedEventEntityList[i].timestamp;
                    const txhash = sortedEventEntityList[i].txhash;
                    const nftID = sortedEventEntityList[i].nftID;
                    const owner = sortedEventEntityList[i].owner;
                    const isListed = sortedEventEntityList[i].isListed;

                    await NFTBidModel.deleteMany({ tokenID: nftID });

                    await NFTObjectModel.findOneAndUpdate({ tokenID: nftID }, {
                        updatedAt: timestamp,
                        listed: isListed
                    });

                    await NFTEventModel.findOneAndUpdate({
                        doneOn: timestamp,
                        eventType: 3, //0 : MINT, 1 : SALE, 2 : PRICE_UPDATE, 3 : UPDATE_STATUS
                        nftIDSold: nftID,
                        transactionHash: txhash,
                    }, {
                        statusUpdater: owner,
                        isListed: isListed,
                    }, { upsert: true });
                }
                else if (sortedEventEntityList[i].eventType == 4) {
                    ////////////////////////// Burn Event /////////////////////////
                    const timestamp = sortedEventEntityList[i].timestamp;
                    const txhash = sortedEventEntityList[i].txhash;
                    const nftID = sortedEventEntityList[i].nftID;
                    const owner = sortedEventEntityList[i].owner;

                    await NFTBidModel.deleteMany({ tokenID: nftID });

                    await NFTObjectModel.deleteMany({ tokenID: nftID });

                    await NFTEventModel.findOneAndUpdate({
                        doneOn: timestamp,
                        eventType: 4, //0 : MINT, 1 : SALE, 2 : PRICE_UPDATE, 3 : UPDATE_STATUS, 4 : BURN
                        nftIDSold: nftID,
                        transactionHash: txhash,
                    }, {
                    }, { upsert: true });
                }
                else if (sortedEventEntityList[i].eventType == 5) {
                    ////////////////////////// Bid Create Event /////////////////////////
                    const timestamp = sortedEventEntityList[i].timestamp;
                    const txhash = sortedEventEntityList[i].txhash;
                    const nftID = sortedEventEntityList[i].nftID;
                    const buyer = sortedEventEntityList[i].buyer;
                    const price = ethers.utils.formatEther(sortedEventEntityList[i].price);

                    await NFTBidModel.findOneAndUpdate({ tokenID: nftID, bidder: buyer }, {
                        doneOn: timestamp,
                        price: price
                    }, { upsert: true });

                    await NFTEventModel.findOneAndUpdate({
                        doneOn: timestamp,
                        eventType: 5,
                        nftIDSold: nftID,
                        transactionHash: txhash,
                    }, {
                        bidder: buyer,
                        bidPrice: price
                    }, { upsert: true });
                }
              
                else if (sortedEventEntityList[i].eventType == 7) {
                    ////////////////////////// Sell Event /////////////////////////
                    const timestamp = sortedEventEntityList[i].timestamp;
                    const txhash = sortedEventEntityList[i].txhash;
                    const nftID = sortedEventEntityList[i].nftID;
                    const uri = sortedEventEntityList[i].uri;
                    const price = ethers.utils.formatEther(sortedEventEntityList[i].price);
                    const previousOwner = sortedEventEntityList[i].previousOwner;
                    const newOwner = sortedEventEntityList[i].newOwner;

                    await NFTBidModel.deleteMany({ tokenID: nftID });

                    await NFTObjectModel.findOneAndUpdate({ tokenID: nftID }, {
                        price: price,
                        updatedAt: timestamp,
                        ownerAddress: newOwner,
                        listed: false
                    });

                    await NFTEventModel.findOneAndUpdate({
                        doneOn: timestamp,
                        eventType: 7,
                        nftIDSold: nftID,
                        transactionHash: txhash,
                    }, {
                        seller: previousOwner,
                        buyer: newOwner,
                        nftSoldAtPrice: price
                    }, { upsert: true });
                }
            }

            return res.send({ status: 'success' });
        }
        catch (ex) {
            console.log(ex);
            return res.send({ status: 'failed', exception: ex });
        }
    },

});