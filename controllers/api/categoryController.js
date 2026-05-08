const { Category } = require('../../models');

exports.fetch_list = async (req, res) => {
    try {

        const cat = await Category.findAll({
            where: {
                del_status: 0
            },
            order: [['id', 'DESC']]
        });

        const baseUrl = process.env.APP_URL;

        const data = cat.map(item => {

            const category = item.toJSON();

            category.image = category.image
                ? baseUrl + '/uploads/Category/' + category.image.replace(/\\/g, '/')
                : null;

            return category;
        });

        return res.json({
            status: 1,
            message: "Category list fetched successfully",
            data: data
        });

    } catch (err) {

        console.log("FETCH ERROR:", err);

        return res.json({
            status: 0,
            message: err.message
        });
    }
};