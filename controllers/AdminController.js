let View = require('../views/base');
let path = require('path');
let fs = require('fs');
let crypto = require('crypto');
let config = require('../config/index')();
let ejs = require('ejs');
let delay = require('delay');
let gravatar = require('gravatar');

let BaseController = require('./BaseController');
let UserModel = require('../models/admin_ms/UserModel');

let NFTObjectModel = require('../models/blockchain_ms/NFTObjectModel');
let NFTUserModel = require('../models/blockchain_ms/NFTUserModel');
let NFTEventModel = require('../models/blockchain_ms/NFTEventModel');

let isValidUsername = function (username) {
    return !/[~`!#$%\^&*+=\-\[\]\\';,/{}|\\":<>\?]/g.test(username);
}

module.exports = BaseController.extend({
    name: 'UserController',

    account_settings: async function (req, res, next) {
        let user = await UserModel.findOne({ id: req.session.user.id });
        // console.log(user);
        let v = new View(res, 'settings/account_settings');
        v.render({
            title: 'TestNFTs|Profile',
            session: req.session,
            i18n: res,
            tab_text: 'settings',
            sub_text: 'settings_profile',
            user: user,
        })
    },
    editProfile: async function (req, res, next) {
        let username = req.body.username,
            email = req.body.email.toLowerCase(),
            old_password = req.body.old_password,
            new_password = req.body.new_password;
        let user = await UserModel.findOne({ id: req.session.user.id });
        if (user.email !== email) return res.send({ status: 'error', message: res.cookie().__('Undefined user') });
        if (!user.verifyPassword(old_password)) return res.send({
            status: 'error',
            message: res.cookie().__('Old password is not correct')
        });
        user.username = username;
        user.password = new_password;
        await user.save();
        req.session.user = user;
        return res.send({ status: 'success', message: res.cookie().__('Updated user profile successfully') });
    },
    changeAvatar: async function (req, res, next) {
        let user = await UserModel.findOne({ id: req.session.user.id });
        let avatarPath = user.avatar;
        if (req.body.avatarImg.length > 1000) {
            let avatarData = req.body.avatarImg.replace(/^data:image\/\w+;base64,/, "");
            let file_extension = '.png';
            if (avatarData.charAt(0) === '/') file_extension = '.jpg';
            else if (avatarData.charAt(0) === 'R') file_extension = '.gif';
            let public_path = path.resolve('public');
            avatarPath = '/avatars/avatar_' + user.id + file_extension;
            let avatarUploadPath = path.resolve('public') + avatarPath;
            fs.writeFileSync(avatarUploadPath, avatarData, 'base64');
        }
        await user.updateOne({ avatar: avatarPath });
        req.session.user.avatar = avatarPath;
        return res.send({
            status: 'success',
            message: res.cookie().__('Changed avatar successfully'),
            avatarPath: avatarPath
        });
    },
    error: function (req, res, next) {
        let v = new View(res, 'partials/error');
        v.render({
            title: 'TestNFTs|Error',
            session: req.session,
            i18n: res,
        })
    },

    dashboard: async function (req, res, next) {
        let user = req.session.user;
        let v = new View(res, 'admin_vs/dashboard');
        v.render({
            title: 'TestNFTs|Dashboard',
            session: req.session,
            i18n: res,
            tab_text: 'admin_dashboard',
            sub_text: '',
            user: user,
        })
    },

    nft_users: async function (req, res, next) {
        let user = req.session.user;
        let nft_users = await NFTUserModel.find();
        let v = new View(res, 'admin_vs/nft_users');
        v.render({
            title: 'TestNFTs|User Management',
            session: req.session,
            i18n: res,
            tab_text: 'nft_user_management',
            sub_text: '',
            user: user,
            nft_users: nft_users
        })
    },

    verifyNFTUser: async function (req, res, next) {
        let walletAddress = req.body.walletAddress;
        let verifyFlag = req.body.verifyFlag;

        await NFTUserModel.findOneAndUpdate({ walletAddress: walletAddress }, {
            verified: verifyFlag
        })

        return res.send({ status: 'success', message: res.cookie().__('User Verify Status Updated Successfully') });
    },
});