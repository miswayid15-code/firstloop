const { Branch, Merchant, BranchImage } = require('../../models');
const { parsePhoneNumber } = require('libphonenumber-js');

const fs = require('fs');
const path = require('path');
exports.register = async (req, res) => {
    try {

        const { name, email, phone, lat, lon, address } = req.body;
        const merchant_id = req.user.id;

        if (!name || !email || !phone) {
            return res.json({
                status: 0,
                message: "Required fields missing"
            });
        }

        // ✅ phone validation
        let phoneNumber;
        try {
            const num = parsePhoneNumber(phone);
            if (!num.isValid()) {
                return res.json({ status: 0, message: "Invalid phone" });
            }
            phoneNumber = num.number;
        } catch {
            return res.json({ status: 0, message: "Invalid phone format" });
        }

        // ✅ check email
        const exists = await Branch.findOne({ where: { email } });
        if (exists) {
            return res.json({ status: 0, message: "Email already exists" });
        }

        // ✅ check merchant
        const merchant = await Merchant.findByPk(merchant_id);
        if (!merchant) {
            return res.json({ status: 0, message: "Invalid merchant" });
        }

        // ✅ create branch
        const branch = await Branch.create({
            name,
            email,
            phone: phoneNumber,
            lat,
            lon,
            address,
            merchant_id,
            status: 1,
            del_status: 0
        });

        // ✅ use uploaded files directly
        const files = req.files || [];

        if (files.length > 0) {

            const imageData = files.map(f => ({
                branch_id: branch.id,
                image: f.path.replace(/\\/g, '/')
            }));

            await BranchImage.bulkCreate(imageData);
        }

        return res.json({
            status: 1,
            message: "Branch created successfully",
            branch_id: branch.id
        });

    } catch (err) {
        console.log("BRANCH ERROR:", err);
        return res.json({ status: 0, message: err.message });
    }
};



exports.fetch_list = async (req, res) => {
    try {

        const merchant_id = req.user.id;
        const baseUrl = process.env.APP_URL;

        const branches = await Branch.findAll({
            where: {
                merchant_id,
                del_status: 0
            },
            include: [{
                model: BranchImage,
                attributes: ['id', 'image']
            }],
            attributes: [
                'id',
                'name',
                'email',
                'phone',
                'lat',
                'lon',
                'address',
                'merchant_id'
            ],
            order: [['id', 'DESC']]
        });

        if (!branches || branches.length === 0) {
            return res.json({
                status: 0,
                message: "Branch list not found"
            });
        }


        const data = branches.map(branch => {

            const branchData = branch.toJSON();

            if (branchData.BranchImages && branchData.BranchImages.length > 0) {
                branchData.BranchImages = branchData.BranchImages.map(img => ({
                    ...img,
                    image: img.image
                        ? baseUrl + '/' + img.image.replace(/\\/g, '/')
                        : null
                }));
            }

            return branchData;
        });

        return res.json({
            status: 1,
            data
        });

    } catch (err) {
        console.log("FETCH ERROR:", err);
        return res.json({ status: 0, message: err.message });
    }
};

exports.delete_branch = async (req, res) => {
    try {

        const merchant_id = req.user.id;
        const branch_id = req.body.branch_id; // or req.params.id

        if (!branch_id) {
            return res.json({
                status: 0,
                message: "Branch ID is required"
            });
        }

        // ✅ check branch
        const branch = await Branch.findOne({
            where: {
                id: branch_id,
                merchant_id,
                del_status: 0
            }
        });

        if (!branch) {
            return res.json({
                status: 0,
                message: "Branch not found"
            });
        }

        // ✅ get images
        const images = await BranchImage.findAll({
            where: { branch_id }
        });

        // ✅ delete files from server
        images.forEach(img => {
            if (img.image) {
                const filePath = path.join(__dirname, '../../', img.image);

                if (fs.existsSync(filePath)) {
                    try {
                        fs.unlinkSync(filePath);
                    } catch (err) {
                        console.log("File delete error:", err.message);
                    }
                }
            }
        });

        // ✅ delete image records (or use soft delete if you have column)
        await BranchImage.destroy({
            where: { branch_id }
        });

        // ✅ soft delete branch
        await branch.update({
            del_status: 1
        });

        return res.json({
            status: 1,
            message: "Branch and images deleted successfully"
        });

    } catch (err) {
        console.log("BRANCH ERROR:", err);
        return res.json({ status: 0, message: err.message });
    }
};
0

exports.update_branch = async (req, res) => {
    try {

        const { branch_id, name, email, phone, lat, lon, address } = req.body;
        const merchant_id = req.user.id;

        if (!branch_id) {
            return res.json({
                status: 0,
                message: "Branch ID required"
            });
        }

        // ✅ find branch
        const branch = await Branch.findOne({
            where: {
                id: branch_id,
                merchant_id,
                del_status: 0
            }
        });

        if (!branch) {
            return res.json({
                status: 0,
                message: "Branch not found"
            });
        }

        // ✅ email check (exclude current)
        if (email) {
            const exists = await Branch.findOne({
                where: {
                    email,
                    id: { [require('sequelize').Op.ne]: branch_id }
                }
            });

            if (exists) {
                return res.json({
                    status: 0,
                    message: "Email already exists"
                });
            }
        }

        // ✅ phone validation
        let phoneNumber = branch.phone;
        if (phone) {
            try {
                const num = parsePhoneNumber(phone);
                if (!num.isValid()) {
                    return res.json({ status: 0, message: "Invalid phone" });
                }
                phoneNumber = num.number;
            } catch {
                return res.json({ status: 0, message: "Invalid phone format" });
            }
        }

        // ✅ update branch
        await branch.update({
            name: name || branch.name,
            email: email || branch.email,
            phone: phoneNumber,
            lat: lat || branch.lat,
            lon: lon || branch.lon,
            address: address || branch.address
        });


        const files = req.files || [];

        if (files.length > 0) {

            // 🔥 OPTION: delete old images (replace mode)
            const oldImages = await BranchImage.findAll({
                where: { branch_id }
            });

            oldImages.forEach(img => {
                const filePath = path.join(__dirname, '../../', img.image);
                if (fs.existsSync(filePath)) {
                    try {
                        fs.unlinkSync(filePath);
                    } catch (err) {
                        console.log("Delete error:", err.message);
                    }
                }
            });

            await BranchImage.destroy({ where: { branch_id } });

            // ✅ insert new images
            const imageData = files.map(f => ({
                branch_id,
                image: f.path.replace(/\\/g, '/')
            }));

            await BranchImage.bulkCreate(imageData);
        }

        return res.json({
            status: 1,
            message: "Branch updated successfully"
        });

    } catch (err) {
        console.log("UPDATE ERROR:", err);
        return res.json({ status: 0, message: err.message });
    }
};


exports.branch_id = async (req, res) => {
    try {

        const branch_id = req.params.id;
        

        if (!branch_id) {
            return res.json({
                status: 0,
                message: "Branch ID required"
            });
        }

        const branch = await Branch.findOne({
            where: {
                id: branch_id,
                del_status: 0
            },
            include: [{
                model: BranchImage,
                attributes: ['id', 'image']
            }],
            attributes: [
                'id',
                'name',
                'email',
                'phone',
                'lat',
                'lon',
                'address',
                'merchant_id'
            ]
        });

        if (!branch) {
            return res.json({
                status: 0,
                message: "Branch not found"
            });
        }

        const baseUrl = process.env.APP_URL;
        const data = branch.toJSON();

        // ✅ format image URL
        if (data.BranchImages) {
            data.BranchImages = data.BranchImages.map(img => ({
                ...img,
                image: img.image
                    ? baseUrl + '/' + img.image.replace(/\\/g, '/')
                    : null
            }));
        }

        return res.json({
            status: 1,
            data
        });

    } catch (err) {
        console.log("BRANCH FETCH ERROR:", err);
        return res.json({ status: 0, message: err.message });
    }
};