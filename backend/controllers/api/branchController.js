const { Branch, Merchant, BranchImage, MenuImage, Receptionist, Appointment } = require('../../models');
const { parsePhoneNumber } = require('libphonenumber-js');

const fs = require('fs');
const path = require('path');

exports.register = async (req, res) => {

    try {

        const {
            name,
            email,
            phone,
            lat,
            lon,
            address,
            description,
            open_time,
            close_time,
            country_code
        } = req.body;

        const merchant_id = req.user.id;

        // ✅ Required Fields
        if (
            !name ||
            !email ||
            !phone
        ) {

            return res.json({
                status: 0,
                message: "Required fields missing"
            });

        }

        // ✅ Time Validation
        if (
            open_time &&
            close_time &&
            open_time >= close_time
        ) {

            return res.json({
                status: 0,
                message: "Close time must be greater than open time"
            });

        }

        // ✅ Phone Validation
        let nationalNumber;
        let callingCode;
        let phoneNumber;

        try {

            const cleanPhone =
                phone.replace(/\s+/g, '');

            const fullPhone =
                cleanPhone.startsWith('+')
                    ? cleanPhone
                    : country_code + cleanPhone;

            const num =
                parsePhoneNumber(fullPhone);

            if (!num.isValid()) {

                return res.json({
                    status: 0,
                    message: "Invalid phone number"
                });

            }

            callingCode =
                `+${num.countryCallingCode}`;

            nationalNumber =
                num.nationalNumber;

            phoneNumber =
                num.number;

        } catch (err) {

            console.log(
                "PHONE ERROR:",
                err
            );

            return res.json({
                status: 0,
                message: "Invalid phone format"
            });

        }

        // ✅ Email Exists Check
        const emailExists =
            await Branch.findOne({

                where: { email }

            });

        if (emailExists) {

            return res.json({

                status: 0,

                message: "Email already exists"

            });

        }

        // ✅ Phone Exists Check
        const phoneExists =
            await Branch.findOne({

                where: {

                    country_code: callingCode,

                    phone: nationalNumber

                }

            });

        if (phoneExists) {

            return res.json({

                status: 0,

                message: "Phone already exists"

            });

        }

        // ✅ Merchant Check
        const merchant =
            await Merchant.findByPk(
                merchant_id
            );

        if (!merchant) {

            return res.json({

                status: 0,

                message: "Invalid merchant"

            });

        }

        // ✅ Files
        const files =
            req.files || [];

        console.log("FILES:", files);

        // ✅ First image as profile image
        const profile_image =
            files.length > 0
                ? files[0].path.replace(/\\/g, '/')
                : null;

        // ✅ Create Branch
        const branch =
            await Branch.create({

                name,

                email,

                country_code: callingCode,

                phone: nationalNumber,

                profile_image,

                lat,

                lon,

                address,

                description,

                open_time,

                close_time,

                merchant_id,

                status: 1,

                del_status: 0

            });

        // ✅ Save Multiple Images
        if (files.length > 0) {

            const imageData =
                files.map(file => ({

                    branch_id: branch.id,

                    image:
                        file.path.replace(/\\/g, '/')

                }));

            await BranchImage.bulkCreate(
                imageData
            );

        }

        return res.json({

            status: 1,

            message:
                "Branch created successfully",

            branch_id: branch.id

        });

    } catch (err) {

        console.log(
            "BRANCH ERROR:",
            err
        );

        return res.json({

            status: 0,

            message: err.message

        });

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
                'profile_image',
                'lat',
                'lon',
                'address',
                'merchant_id',
                'description',
                'open_time',
                'close_time'
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

            // ✅ profile image url
            branchData.profile_image = branchData.profile_image
                ? baseUrl + '/' + branchData.profile_image.replace(/\\/g, '/')
                : null;

            // ✅ branch images
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

        return res.json({
            status: 0,
            message: err.message
        });

    }

};

exports.delete_branch = async (req, res) => {

    try {

        const merchant_id = req.user.id;

        const branch_id = req.body.branch_id;

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

        // ✅ delete profile image
        if (branch.profile_image) {

            const profilePath = path.join(__dirname, '../../', branch.profile_image);

            if (fs.existsSync(profilePath)) {

                try {

                    fs.unlinkSync(profilePath);

                } catch (err) {

                    console.log("Profile delete error:", err.message);

                }

            }

        }

        // ✅ get branch images
        const images = await BranchImage.findAll({
            where: { branch_id }
        });

        // ✅ delete image files
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

        // ✅ delete image records
        await BranchImage.destroy({
            where: { branch_id }
        });

        // ✅ soft delete branch
        await branch.update({
            del_status: 1
        });

        return res.json({
            status: 1,
            message: "Branch deleted successfully"
        });

    } catch (err) {

        console.log("BRANCH ERROR:", err);

        return res.json({
            status: 0,
            message: err.message
        });

    }

};

exports.update_branch = async (req, res) => {

    try {

        const {
            branch_id,
            name,
            email,
            phone,
            lat,
            lon,
            address,
            description,
            open_time,
            close_time
        } = req.body;

        const merchant_id = req.user.id;

        // ✅ Branch ID Check
        if (!branch_id) {

            return res.json({
                status: 0,
                message: "Branch ID required"
            });

        }

        // ✅ Find Branch
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

        // ✅ Email Check
        if (email) {

            const exists = await Branch.findOne({

                where: {
                    email,
                    id: {
                        [require('sequelize').Op.ne]: branch_id
                    }
                }

            });

            if (exists) {

                return res.json({
                    status: 0,
                    message: "Email already exists"
                });

            }

        }

        // ✅ Phone Validation
        let phoneNumber = branch.phone;

        if (phone) {

            try {

                const num = parsePhoneNumber(phone);

                if (!num.isValid()) {

                    return res.json({
                        status: 0,
                        message: "Invalid phone"
                    });

                }

                phoneNumber = num.number;

            } catch {

                return res.json({
                    status: 0,
                    message: "Invalid phone format"
                });

            }

        }

        // ✅ Time Validation
        if (
            open_time &&
            close_time &&
            open_time >= close_time
        ) {

            return res.json({
                status: 0,
                message: "Close time must be greater than open time"
            });

        }

        const files = req.files || [];

        let profile_image = branch.profile_image;

        // ✅ Update Profile Image
        if (files.length > 0) {

            // delete old profile image
            if (branch.profile_image) {

                const oldProfile = path.join(
                    __dirname,
                    '../../',
                    branch.profile_image
                );

                if (fs.existsSync(oldProfile)) {

                    try {

                        fs.unlinkSync(oldProfile);

                    } catch (err) {

                        console.log(
                            "Profile delete error:",
                            err.message
                        );

                    }

                }

            }

            profile_image =
                files[0].path.replace(/\\/g, '/');

        }

        // ✅ Update Branch
        await branch.update({

            name: name || branch.name,

            email: email || branch.email,

            phone: phoneNumber,

            profile_image,

            lat: lat || branch.lat,

            lon: lon || branch.lon,

            address: address || branch.address,

            description:
                description || branch.description,

            open_time:
                open_time || branch.open_time,

            close_time:
                close_time || branch.close_time

        });

        // ✅ Replace Branch Images
        if (files.length > 0) {

            const oldImages =
                await BranchImage.findAll({

                    where: { branch_id }

                });

            oldImages.forEach(img => {

                const filePath = path.join(
                    __dirname,
                    '../../',
                    img.image
                );

                if (fs.existsSync(filePath)) {

                    try {

                        fs.unlinkSync(filePath);

                    } catch (err) {

                        console.log(
                            "Delete error:",
                            err.message
                        );

                    }

                }

            });

            await BranchImage.destroy({

                where: { branch_id }

            });

            const imageData = files.map(f => ({

                branch_id,

                image:
                    f.path.replace(/\\/g, '/')

            }));

            await BranchImage.bulkCreate(
                imageData
            );

        }

        return res.json({

            status: 1,
            message: "Branch updated successfully"

        });

    } catch (err) {

        console.log(
            "UPDATE ERROR:",
            err
        );

        return res.json({

            status: 0,
            message: err.message

        });

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
                'profile_image',
                'lat',
                'lon',
                'address',
                'merchant_id',
                'description',
                'open_time',
                'close_time'
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

        // ✅ profile image url
        data.profile_image = data.profile_image
            ? baseUrl + '/' + data.profile_image.replace(/\\/g, '/')
            : null;

        // ✅ branch images url
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

        return res.json({
            status: 0,
            message: err.message
        });

    }

};


// ================= REGISTER MENU IMAGE =================

exports.register_menu_image = async (req, res) => {

    try {

        const merchant_id = req.user.id;

        const branch_id = req.body?.branch_id;

        if (!branch_id) {

            return res.json({
                status: 0,
                message: "Branch ID required"
            });

        }


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
                message: "Branch not found or unauthorized"
            });

        }

        const files = req.files || [];

        if (files.length === 0) {

            return res.json({
                status: 0,
                message: "Images required"
            });

        }

        const imageData = files.map(file => ({

            branch_id,

            image: file.path.replace(/\\/g, '/'),

            status: 1

        }));

        await MenuImage.bulkCreate(imageData);

        return res.json({
            status: 1,
            message: "Menu images added successfully"
        });

    } catch (err) {

        console.log("MENU IMAGE ERROR:", err);

        return res.json({
            status: 0,
            message: err.message
        });

    }

};


// ================= FETCH MENU IMAGES =================

exports.fetch_menu_images = async (req, res) => {

    try {

        const merchant_id = req.user.id;

        const branch_id = req.params.branch_id;

        if (!branch_id) {

            return res.json({
                status: 0,
                message: "Branch ID required"
            });

        }

        // check branch belongs to merchant
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
                message: "Branch not found or unauthorized"
            });

        }

        const baseUrl = process.env.APP_URL;

        const images = await MenuImage.findAll({

            where: {
                branch_id
            },

            attributes: [
                'id',
                'branch_id',
                'image',
                'status'
            ],

            order: [['id', 'DESC']]

        });

        const data = images.map(item => ({

            id: item.id,

            branch_id: item.branch_id,

            image: item.image
                ? baseUrl + '/' + item.image.replace(/\\/g, '/')
                : null,

            status: item.status

        }));

        return res.json({
            status: 1,
            data
        });

    } catch (err) {

        console.log("FETCH MENU ERROR:", err);

        return res.json({
            status: 0,
            message: err.message
        });

    }

};


// ================= UPDATE MENU IMAGE =================

exports.update_menu_image = async (req, res) => {

    try {

        const merchant_id = req.user.id;

        const branch_id = req.body?.branch_id;

        let update_ids = req.body?.update_ids || [];

        // convert string array
        if (typeof update_ids === 'string') {

            update_ids = JSON.parse(update_ids);

        }

        if (!branch_id) {

            return res.json({
                status: 0,
                message: "Branch ID required"
            });

        }

        // check branch belongs to merchant
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
                message: "Branch not found or unauthorized"
            });

        }

        const files = req.files || [];

        if (files.length === 0) {

            return res.json({
                status: 0,
                message: "Images required"
            });

        }

        // update existing images
        for (let i = 0; i < update_ids.length; i++) {

            const image_id = update_ids[i];

            const file = files[i];

            if (!file) {
                continue;
            }

            const menuImage = await MenuImage.findOne({

                where: {
                    id: image_id,
                    branch_id
                }

            });

            if (!menuImage) {
                continue;
            }

            // delete old image
            if (menuImage.image) {

                const oldPath = path.join(
                    __dirname,
                    '../../',
                    menuImage.image
                );

                if (fs.existsSync(oldPath)) {

                    try {

                        fs.unlinkSync(oldPath);

                    } catch (err) {

                        console.log(err.message);

                    }

                }

            }

            // update image
            await menuImage.update({

                image: file.path.replace(/\\/g, '/')

            });

        }

        // insert extra new images
        if (files.length > update_ids.length) {

            const newFiles = files.slice(update_ids.length);

            const imageData = newFiles.map(file => ({

                branch_id,

                image: file.path.replace(/\\/g, '/'),

                status: 1

            }));

            await MenuImage.bulkCreate(imageData);

        }

        return res.json({
            status: 1,
            message: "Menu images updated successfully"
        });

    } catch (err) {

        console.log("UPDATE MENU ERROR:", err);

        return res.json({
            status: 0,
            message: err.message
        });

    }

};

// ================= DELETE MENU IMAGE =================

exports.delete_menu_image = async (req, res) => {

    try {

        const merchant_id = req.user.id;


        const { id, branch_id } = req.body;

        // check image id
        if (!id) {

            return res.json({
                status: 0,
                message: "Image ID required"
            });

        }

        // check branch id
        if (!branch_id) {

            return res.json({
                status: 0,
                message: "Branch ID required"
            });

        }

        // check branch belongs to merchant
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
                message: "Branch not found or unauthorized"
            });

        }

        // check image exists
        const menu = await MenuImage.findOne({

            where: {
                id,
                branch_id
            }

        });

        if (!menu) {

            return res.json({
                status: 0,
                message: "Image not found"
            });

        }

        // image full path
        const filePath = path.join(
            __dirname,
            '../../',
            menu.image
        );

        // delete image file
        if (menu.image && fs.existsSync(filePath)) {

            try {

                fs.unlinkSync(filePath);

            } catch (err) {

                console.log("FILE DELETE ERROR:", err.message);

            }

        }

        // delete db row
        await menu.destroy();

        return res.json({
            status: 1,
            message: "Image deleted successfully"
        });

    } catch (err) {

        console.log("DELETE MENU ERROR:", err);

        return res.json({
            status: 0,
            message: err.message
        });

    }

};


exports.appointment_list = async (req, res) => {

    try {


        const receptionist_id = req.user.id;


        const receptionist =
            await Receptionist.findOne({

                where: {

                    id: receptionist_id,

                    status: 1,

                    del_status: 0

                }

            });

        if (!receptionist) {

            return res.json({

                status: 0,
                message: "Invalid receptionist"

            });

        }


        const branch_id =
            receptionist.branch_id;
        // console.log("BRANCH ID:", branch_id);

        const appointments =
            await Appointment.findAll({

                where: {
                    br_id: branch_id
                },
                attributes: [
                    'id',
                    'cus_id',
                    'br_id',
                    'br_name',
                    'appointment_date',
                    'slot',
                    'status',
                    'cancel_by',
                    'cancel_reason',
                    'approved_by',
                    'approved_by_id',

                ],

                order: [['id', 'DESC']]

            });
        // console.log("APPOINTMENTS:", appointments);

        if (
            !appointments ||
            appointments.length === 0
        ) {

            return res.json({

                status: 0,
                message: "No appointments found",
                data: []

            });

        }


        const formattedAppointments =
            appointments.map(item => {

                const data =
                    item.toJSON();

                return {

                    ...data,

                    appointment_date:
                        new Date(data.appointment_date)
                            .toLocaleDateString('en-US', {

                                month: 'long',
                                day: '2-digit',
                                year: 'numeric'

                            }),

                    slot:
                        new Date(`1970-01-01T${data.slot}`)
                            .toLocaleTimeString('en-US', {

                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: true

                            })

                };

            });

        return res.json({

            status: 1,

            message: "Successfully fetched",

            data: formattedAppointments

        });

    } catch (err) {

        console.log(
            "APPOINTMENT ERROR:",
            err
        );

        return res.json({

            status: 0,
            message: err.message

        });

    }

};


exports.update_appointment_status = async (req, res) => {

    try {

        const receptionist_id = req.user.id;

        const {
            appointment_id,
            status,
            cancel_reason
        } = req.body;


        if (
            !appointment_id ||
            status === undefined
        ) {

            return res.json({

                status: 0,
                message: "Appointment ID and status are required"

            });

        }


        const receptionist =
            await Receptionist.findOne({

                where: {

                    id: receptionist_id,
                    status: 1,
                    del_status: 0

                }

            });

        if (!receptionist) {

            return res.json({

                status: 0,
                message: "Invalid receptionist"

            });

        }


        const appointment =
            await Appointment.findOne({

                where: {

                    id: appointment_id,
                    br_id: receptionist.branch_id

                }

            });

        if (!appointment) {

            return res.json({

                status: 0,
                message: "Appointment not found"

            });

        }


        const updateData = {

            status: status

        };


        if (Number(status) === 1) {

            updateData.approved_by =
                'receptionist';

            updateData.approved_by_id =
                receptionist_id;

        }


        if (Number(status) === 3) {

            updateData.cancel_by =
                'receptionist';

            updateData.cancel_reason =
                cancel_reason || null;

        }


        await appointment.update(updateData);

        return res.json({

            status: 1,

            message: "Appointment status updated successfully",

            data: appointment

        });

    }

    catch (err) {

        console.log(
            "APPOINTMENT UPDATE ERROR:",
            err
        );

        return res.json({

            status: 0,
            message: err.message

        });

    }

};