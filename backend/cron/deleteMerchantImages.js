const cron = require('node-cron');
const fs = require('fs');
const path = require('path');
const { Op } = require('sequelize');

const { Merchant, Branch, Receptionist } = require('../models');

cron.schedule('*/5 * * * *', async () => {

    try {

        const threeDaysAgo = new Date();

        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

        const merchants = await Merchant.findAll({
            where: {
                del_status: 1,
                deleted_at: {
                    [Op.lte]: threeDaysAgo
                }
            }
        });

        for (const merchant of merchants) {

            // Profile Image
            if (merchant.profile_image) {

                const imagePath = path.join(
                    __dirname,
                    '../uploads/merchant/profile',
                    merchant.profile_image
                );

                if (fs.existsSync(imagePath)) {
                    fs.unlinkSync(imagePath);
                }
            }

            // Brand Image
            if (merchant.brand_image) {

                const imagePath = path.join(
                    __dirname,
                    '../uploads/merchant/brand',
                    merchant.brand_image
                );

                if (fs.existsSync(imagePath)) {
                    fs.unlinkSync(imagePath);
                }
            }

            // Document
            if (merchant.document) {

                const documentPath = path.join(
                    __dirname,
                    '../uploads/merchant/document',
                    merchant.document
                );

                if (fs.existsSync(documentPath)) {
                    fs.unlinkSync(documentPath);
                }
            }

            console.log(`Merchant Files Deleted : ${merchant.id}`);
        }

    } catch (err) {

        console.log('CRON ERROR:', err);

    }

});