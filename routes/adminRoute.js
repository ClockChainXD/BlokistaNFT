let express = require('express');
let router = express.Router();

let MiddlewareController = require('../controllers/MiddlewareController');
let AdminController = require('../controllers/AdminController');


router.get('/account-settings', MiddlewareController.m_checkLogin, function(req, res, next) {
    AdminController.account_settings(req, res, next);
});
router.post('/account-settings/edit-profile', MiddlewareController.m_checkLoginPost, function(req, res, next) {
    AdminController.editProfile(req, res, next);
});
router.post('/account-settings/change-avatar', MiddlewareController.m_checkLoginPost, function(req, res, next) {
    AdminController.changeAvatar(req, res, next);
});


router.post('/verify-nft-user', MiddlewareController.m_checkLoginPost, MiddlewareController.m_checkAdmin,function(req, res, next) {
    AdminController.verifyNFTUser(req, res, next);
});

router.get('/nft_users', MiddlewareController.m_checkLogin, MiddlewareController.m_checkAdmin, function(req, res, next) {
    AdminController.nft_users(req, res, next);
});


module.exports = router;