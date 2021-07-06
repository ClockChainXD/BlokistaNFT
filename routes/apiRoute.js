let express = require('express');
let router = express.Router();
let multer = require('multer');
let stroage = multer.memoryStorage();
let upload = multer({ storage: stroage });


let api_controller = require('../controllers/ApiController');

router.get('/getNFTUserProfile/:walletAddress', function (req, res, next) {
    api_controller.getNFTUserProfile(req, res, next);
});
router.post('/updateNFTUserProfile', upload.single('file'), function (req, res, next) {
    api_controller.updateNFTUserProfile(req, res, next);
});
router.get('/getNFTUserList', function (req, res, next) {
    api_controller.getNFTUserList(req, res, next);
});


router.post('/addNFTMetaData', upload.single('file'), function (req, res, next) {
    api_controller.addNFTMetaData(req, res, next);
});

router.get('/getNFTObjectList', function (req, res, next) {
    api_controller.getNFTObjectList(req, res, next);
});


router.get('/getNFTUserFullDetail/:walletAddress', function (req, res, next) {
    api_controller.getNFTUserFullDetail(req, res, next);
});
router.get('/getNFTTopUserList', function (req, res, next) {
    api_controller.getNFTTopUserList(req, res, next);
});

router.get('/nfts/:baseID', function (req, res, next) {
    api_controller.getNFTObjectDetail(req, res, next);
});

router.get('/syncBlock', function (req, res, next) {
    api_controller.syncBlock(req, res, next);
});

module.exports = router;