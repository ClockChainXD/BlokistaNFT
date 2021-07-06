let View = require('../views/base');
let path = require('path');
let fs = require('fs');
let crypto = require('crypto');
let config = require('../config/index')();
let ejs = require('ejs');
let gravatar = require('gravatar');

let BaseController = require('./BaseController');
let UserModel = require('../models/admin_ms/UserModel');

let isValidUsername = function (username) {
    return !/[~`!#$%\^&*+=\-\[\]\\';,/{}|\\":<>\?]/g.test(username);
}

module.exports = BaseController.extend({
    name: 'AuthController',
    login: async function (req, res, next) {
        if (req.session.login === 1) return res.redirect('/');
        await this.checkDev();
        let v = new View(res, 'auth/login');
        v.render({
            title: 'TestNFTs | Login',
            session: req.session,
            i18n: res,
        })
    },
    register: async function (req, res, next) {
        if (req.session.login === 1) return res.redirect('/');
        let v = new View(res, 'auth/register');
        v.render({
            title: 'TestNFTs | Register',
            session: req.session,
            i18n: res,
        })
    },
    forgotPassword: async function (req, res, next) {
        if (req.session.login === 1) return res.redirect('/');
        let v = new View(res, 'auth/forgot_password');
        v.render({
            title: 'TestNFTs | Forgot password',
            session: req.session,
            i18n: res,
        })
    },
    resetPassword: async function (req, res, next) {
        if (req.session.login === 1) return res.redirect('/');
        let token = req.query.token;
        if (!token) return res.redirect('/404');
        let user = await UserModel.findOne({ reset_token: token });
        if (!user) return res.redirect('/404');
        req.session.user = user;
        let v = new View(res, 'auth/reset_password');
        v.render({
            title: 'TestNFTs | Forgot password',
            session: req.session,
            i18n: res,
        })
    },
    logout: async function (req, res, next) {
        req.session.login = 0;
        req.session.user = null;
        req.session.save();
        return res.redirect('/');
    },
    postLogin: async function (req, res, next) {
        let login_email = req.body.login_email.toLowerCase();
        let login_password = req.body.login_password;
        if (login_email === '' || login_password === '' || login_email.indexOf('@') <= 0) {
            return res.send({ status: 'error', message: res.cookie().__('Login information is not valid') });
        }
        let user = await UserModel.findOne({ email: login_email });
        if (!user) return res.send({ status: 'error', message: res.cookie().__('Unknown user') });
        if (user.email_verify_flag !== 2) return res.send({
            status: 'error',
            message: res.cookie().__('Verify your email')
        });
        if (!user.verifyPassword(login_password)) return res.send({
            status: 'error',
            message: res.cookie().__('Password is not correct')
        });
        req.session.user = user;
        if (user.aprove_status != 'ACTIVE') return res.send({
            status: 'aprove_status',
            message: res.cookie().__('Your account is blocked!')
        });
        req.session.login = 1;

        return res.send({ status: 'success', message: res.cookie().__('Login success') });
    },
    postRegister: async function (req, res, next) {
        let register_f_name = req.body.register_f_name;
        if (!isValidUsername(register_f_name))
            return res.send({ status: 'error', message: res.cookie().__('Username contains special characters') });

        let register_email = req.body.register_email.toLowerCase();
        let register_password = req.body.register_password;
        if (register_f_name === '' || register_email === '' || register_password === '')
            return res.send({ status: 'error', message: res.cookie().__('Register fields are not valid') });
        let check_user = await UserModel.findOne({ email: register_email });
        if (check_user) return res.send({ status: 'error', message: res.cookie().__('Email is registered already') });
        let email_token_str = "ecat" + Date.now().toString() + (Math.random() * 101).toString() + 'email';
        let email_verify_token = crypto.createHash('md5').update(email_token_str).digest('hex');
        let gravatarUrl = gravatar.url(register_email, { s: '200', r: 'x', d: 'retro' }, true);

        let new_user = new UserModel({
            username: register_f_name,
            email: register_email,
            password: register_password,
            email_verify_flag: 1,
            email_verify_token: email_verify_token,
            avatar: gravatarUrl,
            role: 2,
            online_state: 1,
        });
        let user = await new_user.save();

        let verify_email_link = config.base_url + "/auth/verification-email?token=" + email_verify_token;
        //let template = 'views/templates/verify_email.ejs';
        let templateData = {
            verify_email_link: verify_email_link,
            base_url: config.base_url
        };
        console.log(verify_email_link);
        //await this.sendSendgridEmail(register_email, config.sendgrid_info.verify_template_email_id, templateData);
        await this.sendSMTPVerifyEmail(register_email, templateData);
        return res.send({
            status: 'success',
            message: res.cookie().__('Registered successfully. Please check your email verification')
        });
    },
    postForgotPassword: async function (req, res, next) {
        let forgot_email = req.body.forgot_email.toLowerCase();
        let user = await UserModel.findOne({ email: forgot_email });
        if (!user) return res.send({ status: 'error', message: res.cookie().__('Unknown user') });
        let forgot_token_str = "ecat" + Date.now().toString() + (Math.random() * 101).toString() + 'forgot';
        let forgot_token = crypto.createHash('md5').update(forgot_token_str).digest('hex');

        let verify_email_link = config.base_url + "/auth/reset-password?token=" + forgot_token;
        //let template = 'views/templates/reset_password.ejs';
        let templateData = {
            reset_password_link: verify_email_link,
            base_url: config.base_url
        };
        //await this.sendSendgridEmail(forgot_email, config.sendgrid_info.reset_template_email_id, templateData);
        await this.sendSMTPRestPasswordEmail(forgot_email, templateData);
        await user.updateOne({ reset_flag: 1, reset_token: forgot_token });
        return res.send({ status: 'success', message: res.cookie().__('Please check your email') });
    },
    postResetPassword: async function (req, res, next) {
        if (!req.session.user) return res.send({ status: 'error', message: res.cookie().__('Unknown user') });
        let user = await UserModel.findOne({ id: req.session.user.id });
        if (!user) return res.send({ status: 'error', message: res.cookie().__('Unknown user') });
        user.password = req.body.new_password;
        await user.save();
        return res.send({ status: 'success', message: res.cookie().__('Updated password successfully') });
    },
    verify_email: async function (req, res, next) {
        let token = req.query.token;
        if (!token) {
            let v = new View(res, 'auth/email_verify');
            v.render({
                title: 'TestNFTs | Phone verify',
                session: req.session,
                i18n: res,
            })
        } else {
            let user = await UserModel.findOne({ email_verify_token: token });
            if (!user) return res.redirect('/404');
            await user.updateOne({ email_verify_flag: 2, email_verify_token: '' });
            return res.redirect('/');
        }

    },
    postVerifyEmail: async function (req, res, next) {
        let verify_email = req.body.verify_email.toLowerCase();
        let user = await UserModel.findOne({ email: verify_email });
        if (!user) return res.send({ status: 'error', message: res.cookie().__('Unknown user') });
        let email_token_str = "ecat" + Date.now().toString() + (Math.random() * 101).toString() + 'email';
        let email_verify_token = crypto.createHash('md5').update(email_token_str).digest('hex');

        let verify_email_link = config.base_url + "/auth/verification-email?token=" + email_verify_token;
        // let template = 'views/templates/verify_email.ejs';
        let templateData = {
            verify_email_link: verify_email_link,
            base_url: config.base_url
        };

        //await this.sendSendgridEmail(verify_email, config.sendgrid_info.verify_template_email_id, templateData);
        await this.sendSMTPVerifyEmail(verify_email, templateData);
        await user.updateOne({ email_verify_flag: 1, email_verify_token: email_verify_token });
        return res.send({
            status: 'success',
            message: res.cookie().__('Please check your email verification')
        });
    },
});