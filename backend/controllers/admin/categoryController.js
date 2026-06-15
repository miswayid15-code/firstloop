const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Sequelize } = require("sequelize");
const { Op } = require('sequelize');
const { Category, CouponCat,RefreshToken,admins, Merchant, Branch, Receptionist, Coupon, CouponApplied } = require('../../models');


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
exports.create_cat = async (req, res) => {
    try {

        const { name } = req.body;

        if (!name) {
            return res.status(400).json({
                status: 0,
                message: "Category name is required"
            });
        }

        const imageFile = req.files?.find(
            file => file.fieldname === 'image'
        );

        const image = imageFile ? imageFile.filename : null;

        const cat = await Category.create({
            name,
            status: 1,
            image
        });

        return res.status(201).json({
            status: 1,
            message: "Category created successfully",
            data: cat
        });

    } catch (err) {

        console.log("Err:", err);

        return res.status(500).json({
            status: 0,
            message: "Failed to create Category"
        });

    }
};
exports.update_cat = async (req, res) => {
    try {

        
        const { name, status ,id} = req.body;

        const cat = await Category.findByPk(id);

        if (!cat) {
            return res.status(404).json({
                status: 0,
                message: "Category not found"
            });
        }

        const imageFile = req.files?.find(
            file => file.fieldname === 'image'
        );

        await cat.update({
            name: name || cat.name,
            status: status || cat.status,
            image: imageFile ? imageFile.filename : cat.image
        });

        return res.status(200).json({
            status: 1,
            message: "Category updated successfully",
            data: cat
        });

    } catch (err) {

        console.log(err);

        return res.status(500).json({
            status: 0,
            message: "Failed to update category"
        });

    }
};
exports.delete_cat = async (req, res) => {
    try {

        const { id } = req.params;

        const cat = await Category.findByPk(id);

        if (!cat) {
            return res.status(404).json({
                status: 0,
                message: "Category not found"
            });
        }

        await cat.destroy();

        return res.status(200).json({
            status: 1,
            message: "Category deleted successfully"
        });

    } catch (err) {

        console.log(err);

        return res.status(500).json({
            status: 0,
            message: "Failed to delete category"
        });

    }
};


exports.fetch_coupon_cat = async (req, res) => {
    try {
        const data = await CouponCat.findAll({
            where: {
                del_status: 0
            },
            order: [['id', 'DESC']]
        });

        return res.json({
            status: 1,
            message: "Coupon category list fetched successfully",
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


exports.create_coupon_cat = async (req, res) => {
    try {

        const { name } = req.body;

        if (!name) {

            return res.status(400).json({
                status: 0,
                message: "Coupon category name is required"
            });

        }

        const cat = await CouponCat.create({
            name,
            status: 1
        });

        return res.status(201).json({
            status: 1,
            message: "Coupon category created successfully",
            data: cat
        });

    } catch (err) {

        console.log(err);

        return res.status(500).json({
            status: 0,
            message: "Failed to create coupon category"
        });

    }
};

exports.update_coupon_cat = async (req, res) => {
    try {

        const { id, name, status } = req.body;

        const cat = await CouponCat.findByPk(id);

        if (!cat) {

            return res.status(404).json({
                status: 0,
                message: "Coupon category not found"
            });

        }

        await cat.update({
            name: name || cat.name,
            status: status ?? cat.status
        });

        return res.status(200).json({
            status: 1,
            message: "Coupon category updated successfully",
            data: cat
        });

    } catch (err) {

        console.log(err);

        return res.status(500).json({
            status: 0,
            message: "Failed to update coupon category"
        });

    }
};

exports.delete_coupon_cat = async (req, res) => {
    try {

        const { id } = req.params;

        const cat = await CouponCat.findByPk(id);

        if (!cat) {

            return res.status(404).json({
                status: 0,
                message: "Coupon category not found"
            });

        }

        await cat.update({
            del_status: 1
        });

        return res.status(200).json({
            status: 1,
            message: "Coupon category deleted successfully"
        });

    } catch (err) {

        console.log(err);

        return res.status(500).json({
            status: 0,
            message: "Failed to delete coupon category"
        });

    }
};