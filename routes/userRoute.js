let express = require('express');
let router = express.Router();

let MiddlewareController = require('../controllers/MiddlewareController');
let UserController = require('../controllers/UserController');
let AdminController = require('../controllers/AdminController');

/**
 * Multi-language Support
 * */
router.get('/lang/en', function(req, res) {
    res.cookie('i18n', 'EN');
    res.redirect(req.headers.referer)
});
router.get('/lang/pl', function(req, res) {
    res.cookie('i18n', 'PL');
    res.redirect(req.headers.referer)
});

router.get('/', MiddlewareController.m_checkLogin, function(req, res, next) {
    if (req.session.user.role == 0 || req.session.user.role == 1)
        AdminController.dashboard(req, res, next);
    else
        UserController.dashboard(req, res, next);
});


// router.get('/dashboard', MiddlewareController.m_checkLogin, function(req, res, next) {
//     UserController.dashboard(req, res, next);
// });

module.exports = router;