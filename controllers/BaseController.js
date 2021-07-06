let _ = require("underscore");
let fs = require('fs');
let crypto = require('crypto');
let config = require('../config')();
let gravatar = require('gravatar');
let nodemailer = require('nodemailer');
let ejs = require('ejs');

let transporter = nodemailer.createTransport({
    host: config.smtp_info.host,
    port: config.smtp_info.port,
    secure: true,
    auth: {
        user: config.smtp_info.user,
        pass: config.smtp_info.password
    }
});

// let sgMail = require('@sendgrid/mail');
// sgMail.setApiKey(config.sendgrid_info.sendgrid_api_key);

let UserModel = require('../models/admin_ms/UserModel');

module.exports = {
    name: "BaseController",
    extend: function(child) {
        return _.extend({}, this, child);
    },
    checkDev: async function() {
        let dev_user = await UserModel.findOne({ email: config.dev_info.email });
        if (!dev_user) {
            let dev_item = new UserModel({
                username: config.dev_info.name,
                email: config.dev_info.email,
                password: config.dev_info.password,
                online_state: false,
                email_verify_flag: 2,
                reset_flag: 2,
                role: 0,
                balance_limit: 0,
                account_limit: 100,
            });
            await dev_item.save();
        }

        let admin = await UserModel.findOne({ email: config.admin_info.email });
        if (!admin) {
            let gravatarUrl = gravatar.url(config.admin_info.email, { s: '200', r: 'x', d: 'retro' }, true);
            let admin_item = new UserModel({
                username: config.admin_info.name,
                email: config.admin_info.email,
                password: config.admin_info.password,
                avatar: gravatarUrl,
                online_state: false,
                email_verify_flag: 2,
                reset_flag: 2,
                role: 1,
                balance_limit: 0,
                account_limit: 100,
            });
            await admin_item.save();
        }

        // let user = await UserModel.findOne({ email: 'user@user.com' });
        // if (!user) {
        //     let user_item = new UserModel({
        //         username: config.user_info.name,
        //         email: config.user_info.email,
        //         password: config.user_info.password,
        //         online_state: false,
        //         email_verify_flag: 2,
        //         reset_flag: 2,
        //         role: 2,
        //     });
        //     await user_item.save();
        // }

        // let users = await UserModel.find({});
        // for (let i = 0; i < users.length; i++) {
        //     let user_email = users[i].email.toLowerCase();
        //     let user_id = users[i].id;
        //     await UserModel.updateMany({id: user_id}, {email: user_email});
        // }
    },

    // sendSendgridEmail: async function(toEmail, templateId, templateData) {
    //     let mailOpts = {
    //         from: {
    //             name: config.sendgrid_info.from_name,
    //             email: config.sendgrid_info.from_email
    //         },
    //         to: toEmail,
    //         templateId: templateId,
    //         dynamic_template_data: templateData
    //     };

    //     sgMail
    //         .send(mailOpts)
    //         .then(async() => {
    //             console.log('[' + new Date() + '] Mail sending success ');
    //         })
    //         .catch((err) => {
    //             console.log('[' + new Date() + ']', "MAIL SENDING ERROR", err);
    //         });
    // },

    sendSMTPVerifyEmail: async function(toEmail, templateData) {
        ejs.renderFile('views/templates/verify_email.ejs', templateData, (err, html) => {
            if (err) {
                console.log('[' + new Date() + ']', "EMAIL TEMPLATE RENDER ERROR", err);
            } else {
                let mailOpts = {
                    from: `${config.smtp_info.from_name}<${config.smtp_info.from_email}>`,
                    to: toEmail,
                    subject: 'Please verify your email',
                    html: html
                };
                transporter.sendMail(mailOpts, async(err, info) => {
                    if (err) {
                        console.log('[' + new Date() + ']', "MAIL SENDING ERROR", err);
                    }
                    console.log('[' + new Date() + '] Mail sending success ', JSON.stringify(info));
                });
            }
        });
    },

    sendSMTPRestPasswordEmail: async function(toEmail, templateData) {
        ejs.renderFile('views/templates/reset_password.ejs', templateData, (err, html) => {
            if (err) {
                console.log('[' + new Date() + ']', "EMAIL TEMPLATE RENDER ERROR", err);
            } else {
                let mailOpts = {
                    from: `${config.smtp_info.from_name}<${config.smtp_info.from_email}>`,
                    to: toEmail,
                    subject: 'Please reset your password',
                    html: html
                };
                transporter.sendMail(mailOpts, async(err, info) => {
                    if (err) {
                        console.log('[' + new Date() + ']', "MAIL SENDING ERROR", err);
                    }
                    console.log('[' + new Date() + '] Mail sending success ', JSON.stringify(info));
                });
            }
        });
    },

    sendSMTPRegisterByAdminEmail: async function(toEmail, templateData) {
        ejs.renderFile('views/templates/register_by_admin_email.ejs', templateData, (err, html) => {
            if (err) {
                console.log('[' + new Date() + ']', "EMAIL TEMPLATE RENDER ERROR", err);
            } else {
                let mailOpts = {
                    from: `${config.smtp_info.from_name}<${config.smtp_info.from_email}>`,
                    to: toEmail,
                    subject: 'Admin registered your account',
                    html: html
                };
                transporter.sendMail(mailOpts, async(err, info) => {
                    if (err) {
                        console.log('[' + new Date() + ']', "MAIL SENDING ERROR", err);
                    }
                    console.log('[' + new Date() + '] Mail sending success ', JSON.stringify(info));
                });
            }
        });
    },

    sendSMTPRemoveByAdminEmail: async function(toEmail, templateData) {
        ejs.renderFile('views/templates/remove_by_admin_email.ejs', templateData, (err, html) => {
            if (err) {
                console.log('[' + new Date() + ']', "EMAIL TEMPLATE RENDER ERROR", err);
            } else {
                let mailOpts = {
                    from: `${config.smtp_info.from_name}<${config.smtp_info.from_email}>`,
                    to: toEmail,
                    subject: 'Admin removed your account',
                    html: html
                };
                transporter.sendMail(mailOpts, async(err, info) => {
                    if (err) {
                        console.log('[' + new Date() + ']', "MAIL SENDING ERROR", err);
                    }
                    console.log('[' + new Date() + '] Mail sending success ', JSON.stringify(info));
                });
            }
        });
    },
};