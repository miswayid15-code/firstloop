const { Banner } = require('../../models');

exports.banner_list = async (req, res) => {

    try {

        const baseUrl = process.env.APP_URL;

        const banners = await Banner.findAll({

            where: {
                status: 1,
                del_status: 0
            },

         
            attributes: [
                'id',
                'title',
                'image'
            ],

            order: [['id', 'DESC']]

        });

        if (banners.length === 0) {

            return res.json({
                status: 0,
                message: "Banner list not found"
            });

        }

        const data = banners.map(banner => {

            const item = banner.toJSON();

            item.image = item.image
                ? baseUrl + '/' + item.image.replace(/\\/g, '/')
                : null;

            return item;

        });

        return res.json({

            status: 1,
            data

        });

    } catch (err) {

        console.log(err);

        return res.json({
            status: 0,
            message: err.message
        });

    }

};