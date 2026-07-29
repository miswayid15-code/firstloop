const { Banner, Page, Receptionist, Merchant, Customer, AppSetting, Support } = require('../../models');
const CommonMailTemplate = require('../../helpers/CommonMailTemplate');
const sendMail = require('../../helpers/sendMail');
const { deleteFile } = require('../../helpers/fileHelper');
const { bool } = require('sharp');


exports.banner_list = async (req, res) => {
    try {

        const banners = await Banner.findAll({
            where: {
                del_status: 0
            },
            order: [['id', 'DESC']]
        });

        const baseUrl = process.env.APP_URL;

        const data = banners.map(item => {

            const banner = item.toJSON();

            banner.image = banner.image
                ? `${baseUrl}/uploads/Banner/${banner.image.replace(/\\/g, '/')}`
                : null;

            return banner;
        });

        return res.json({
            status: 1,
            message: "Banner list fetched successfully",
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

exports.create_banner = async (req, res) => {
    try {
        console.log("Body", req.body)
        const { title, country_code } = req.body;

        if (!title) {
            return res.status(400).json({
                status: 0,
                message: "Banner title is required"
            });
        }

        if (!country_code) {
            return res.status(400).json({
                status: 0,
                message: "Country code is required"
            });
        }

        const imageFile = req.files?.find(
            file => file.fieldname === 'image'
        );

        const image = imageFile ? imageFile.filename : null;

        const banner = await Banner.create({
            title,
            status: 1,
            image,
            country_code
        });

        return res.status(201).json({
            status: 1,
            message: "Banner created successfully",
            data: banner
        });

    } catch (err) {

        console.log("CREATE ERROR:", err);

        return res.status(500).json({
            status: 0,
            message: err.message
        });
    }
};

exports.update_banner = async (req, res) => {
    try {

        const { id, title, status, country_code } = req.body;

        if (!id) {
            return res.status(400).json({
                status: 0,
                message: "Banner ID is required"
            });
        }

        if (!country_code) {
            return res.status(400).json({
                status: 0,
                message: "Country code is required"
            });
        }

        const banner = await Banner.findOne({
            where: {
                id,
                del_status: 0
            }
        });

        if (!banner) {
            return res.status(404).json({
                status: 0,
                message: "Banner not found"
            });
        }

        const imageFile = req.files?.find(
            file => file.fieldname === 'image'
        );

        // Delete old image if new image uploaded
        if (imageFile && banner.image) {
            deleteFile('Banner', banner.image);
        }

        await banner.update({
            title: title ?? banner.title,
            status: status ?? banner.status,
            country_code: country_code ?? banner.country_code,
            image: imageFile ? imageFile.filename : banner.image
        });

        return res.status(200).json({
            status: 1,
            message: "Banner updated successfully",
            data: banner
        });

    } catch (err) {

        console.log("UPDATE ERROR:", err);

        return res.status(500).json({
            status: 0,
            message: err.message
        });
    }
};

exports.banner_details = async (req, res) => {
    try {

        const { id } = req.params;

        const banner = await Banner.findOne({
            where: {
                id,
                del_status: 0
            }
        });

        if (!banner) {
            return res.status(404).json({
                status: 0,
                message: "Banner not found"
            });
        }

        const data = banner.toJSON();

        data.image = data.image
            ? `${process.env.APP_URL}/uploads/Banner/${data.image.replace(/\\/g, '/')}`
            : null;

        return res.status(200).json({
            status: 1,
            data
        });

    } catch (err) {

        console.log("DETAIL ERROR:", err);

        return res.status(500).json({
            status: 0,
            message: err.message
        });
    }
};

exports.delete_banner = async (req, res) => {
    try {

        const { id } = req.params;

        const banner = await Banner.findByPk(id);

        if (!banner) {
            return res.status(404).json({
                status: 0,
                message: "Banner not found"
            });
        }

        // Delete image physically
        if (banner.image) {
            deleteFile('Banner', banner.image);
        }

        // Delete record permanently
        await banner.destroy();

        return res.status(200).json({
            status: 1,
            message: "Banner deleted successfully"
        });

    } catch (err) {

        console.log("DELETE ERROR:", err);

        return res.status(500).json({
            status: 0,
            message: err.message
        });
    }
};



exports.create_page = async (req, res) => {
    try {

        const { page_type, title, content } = req.body;

        if (!page_type || !title || !content) {
            return res.status(400).json({
                status: 0,
                message: 'Page type, title and content are required'
            });
        }

        const page = await Page.create({
            page_type,
            title,
            content,
            status: 1
        });

        return res.status(201).json({
            status: 1,
            message: 'Page created successfully',
            data: page
        });

    } catch (error) {

        return res.status(500).json({
            status: 0,
            message: error.message
        });
    }
};
exports.update_page = async (req, res) => {
    try {

        const { id, page_type, title, content, status } = req.body;

        const page = await Page.findByPk(id);

        if (!page) {
            return res.status(404).json({
                status: 0,
                message: 'Page not found'
            });
        }

        await page.update({
            page_type: page_type ?? page.page_type,
            title: title ?? page.title,
            content: content ?? page.content,
            status: status ?? page.status
        });

        return res.status(200).json({
            status: 1,
            message: 'Page updated successfully',
            data: page
        });

    } catch (error) {

        return res.status(500).json({
            status: 0,
            message: error.message
        });
    }
};

exports.page_list = async (req, res) => {
    try {

        const pages = await Page.findAll({
            order: [['id', 'DESC']]
        });

        return res.status(200).json({
            status: 1,
            data: pages
        });

    }
    catch (error) {
        return res.json({
            status: 0,
            message: "Something went wrong"
        });
    }
};

exports.page_details = async (req, res) => {
    try {

        const { id } = req.params;

        const page = await Page.findByPk(id);

        if (!page) {
            return res.status(404).json({
                status: 0,
                message: 'Page not found'
            });
        }

        return res.status(200).json({
            status: 1,
            data: page
        });

    } catch (error) {

        return res.status(500).json({
            status: 0,
            message: error.message
        });
    }
};






exports.get_app_status = async (req, res) => {
    try {
        const appSetting = await AppSetting.findOne({
            where: { id: 1 },
            attributes: ['id', 'app_status']
        });

        return res.json({
            status: 1,
            data: appSetting
        });
    } catch (err) {
        console.log("Error:", err);
        return res.status(500).json({
            status: 0,
            message: "An error occurred while fetching the app status"
        });
    }
};

exports.update_app_status = async (req, res) => {
    try {
        const { id, app_status } = req.body;

        if (!id) {
            return res.status(400).json({
                status: 0,
                message: "id is required"
            });
        }

        if (typeof app_status !== "boolean") {
            return res.status(400).json({
                status: 0,
                message: "app_status must be a boolean value"
            });
        }

        const appSetting = await AppSetting.findByPk(id);

        if (!appSetting) {
            return res.status(404).json({
                status: 0,
                message: "App setting not found"
            });
        }

        await appSetting.update({
            app_status
        });
        let appName = "";

        if (id == 1) {
            appName = "Merchant App";
        } else if (id == 2) {
            appName = "Customer App";
        } else {
            appName = "FirstPass App";
        }

        let subject = "";
        let title = "";
        let message = "";

        if (app_status) {
            subject = `${appName} Enabled`;
            title = `${appName} Enabled`;
            message = `The ${appName} has been enabled successfully. Users can now access the application.`;
        } else {
            subject = `${appName} Disabled`;
            title = `${appName} Disabled`;
            message = `The ${appName} has been disabled successfully. Users will no longer be able to access the application until it is enabled again.`;
        }
        try {
            await sendMail(
                "minsway01@gmail.com",
                subject,
                CommonMailTemplate({
                    userType: 1, // 1 = Merchant, 2 = Receptionist, 3 = Customer
                    name: "ADMIN",
                    title,
                    message
                })
            );
        } catch (mailErr) {
            console.log("MAIL ERROR:", mailErr);
        }
        return res.json({
            status: 1,
            message: "App status updated successfully",
            // data: appSetting
        });

    } catch (err) {
        console.log("Error:", err);
        return res.status(500).json({
            status: 0,
            message: "An error occurred while updating the app status"
        });
    }
};

exports.merchant_app_status = async (req, res) => {
    try {
        const { id, app_status } = req.body;

        if (!id) {
            return res.status(400).json({
                status: 0,
                message: "id is required"
            });
        }

        if (typeof app_status !== "boolean") {
            return res.status(400).json({
                status: 0,
                message: "app_status must be a boolean value"
            });
        }

        const appSetting = await AppSetting.findByPk(id);

        if (!appSetting) {
            return res.status(404).json({
                status: 0,
                message: "App setting not found"
            });
        }

        await appSetting.update({
            app_status
        });

        return res.json({
            status: 1,
            message: "App status updated successfully",
            // data: appSetting
        });

    } catch (err) {
        console.log("Error:", err);
        return res.status(500).json({
            status: 0,
            message: "An error occurred while updating the app status"
        });
    }
};


exports.customer_list = async (req, res) => {
    try {
        const customers = await Customer.findAll({
            where: {
                del_status: 0
            },
            attributes: ['id', 'name', 'dob', 'gender'],
            order: [['id', 'DESC']]
        });

        const customerList = customers.map(customer => {
            const data = customer.toJSON();

            let age = null;
            if (data.dob) {
                const dob = new Date(data.dob);
                const today = new Date();

                age = today.getFullYear() - dob.getFullYear();

                const monthDiff = today.getMonth() - dob.getMonth();
                if (
                    monthDiff < 0 ||
                    (monthDiff === 0 && today.getDate() < dob.getDate())
                ) {
                    age--;
                }
            }

            return {
                id: data.id,
                name: data.name,
                age,
                gender: data.gender
            };
        });

        return res.json({
            status: 1,
            customers: customerList
        });

    } catch (err) {
        console.log("Error:", err);

        return res.status(500).json({
            status: 0,
            message: "An error occurred while fetching the customer list"
        });
    }
};
exports.merchant_list = async (req, res) => {
    try {
        const merchants = await Merchant.findAll({
            where: {
                del_status: 0
            },
            attributes: ['id', 'name', 'cat_id'],
            order: [['id', 'DESC']]
        });
        return res.json({
            status: 1,
            merchants: merchants
        });
    }
    catch (err) {
        console.log("Error:", err);

        return res.status(500).json({
            status: 0,
            message: "An error occurred while fetching the customer list"
        });
    }
}
exports.reception_list = async (req, res) => {
    try {
        const receptionists = await Receptionist.findAll({
            where: {
                del_status: 0
            },
            attributes: ['id', 'name'],
            order: [['id', 'DESC']]
        });
        return res.json({
            status: 1,
            receptionists: receptionists
        });
    }
    catch (err) {
        console.log("Error:", err);

        return res.status(500).json({
            status: 0,
            message: "An error occurred while fetching the customer list"
        });
    }
}



exports.support_list = async (req, res) => {
    try {
        const support = await Support.findAll({
            order: [
                ['status', 'ASC'],      // 0 (Pending) first, 1 (Approved) next
                ['created_at', 'DESC']  // Latest records first within each status
            ]
        });

        return res.json({
            status: 1,
            message: "Support list fetched successfully.",
            data: support
        });
    } catch (err) {
        console.log("Err", err);

        return res.status(500).json({
            status: 0,
            message: "Something went wrong.",
            error: err.message
        });
    }
};

exports.update_status = async (req, res) => {
    try {
        // console.log("Body:", req.body);

        const { support_id, status, reply } = req.body;

        if (!support_id || status === undefined) {
            return res.json({
                status: 0,
                message: "Support ID and status are required."
            });
        }

        const support = await Support.findByPk(support_id);

        if (!support) {
            return res.json({
                status: 0,
                message: "Support not found."
            });
        }

        await support.update({ status, reply });

        let subject = "";
        let title = "";
        let message = "";

        if (Number(status) === 0) {
            subject = "Support Request Pending";
            title = "Support Request Pending";
            message = "Your support request is currently under review. Our support team will get back to you shortly.";
        } else if (Number(status) === 1) {
            subject = "Support Request Resolved";
            title = "Support Request Resolved";
            message = "Your support request has been reviewed and resolved successfully. If you have any further questions, feel free to contact us.";
        } else if (Number(status) === 2) {
            subject = "Support Request Rejected";
            title = "Support Request Rejected";
            message = "We have reviewed your support request. Unfortunately, it could not be approved. Please contact our support team if you need further clarification.";
        }

        // Append reply if available
        if (reply && reply.trim() !== "") {
            message += `<br><br><strong>Reply from Support Team:</strong><br>${reply}`;
        }

        try {
            await sendMail(
                support.email,
                subject,
                CommonMailTemplate({
                    userType: support.type, // 1 = Merchant, 2 = Receptionist, 3 = Customer
                    name: support.name,
                    title,
                    message
                })
            );
        } catch (mailErr) {
            console.log("MAIL ERROR:", mailErr);
        }

        return res.json({
            status: 1,
            message: "Support status updated successfully.",
            data: support
        });

    } catch (err) {
        console.log("UPDATE SUPPORT STATUS ERROR:", err);

        return res.json({
            status: 0,
            message: "Something went wrong.",
            error: err.message
        });
    }
};

exports.send_mails = async (req, res) => {
    try {
        const {
            type,
            name,
            mail,
            subject,
            title,
            message
        } = req.body;

        // Validate required fields
        if (!mail || !subject || !title || !message) {
            return res.status(400).json({
                status: 0,
                message: "Mail, subject, title and message are required."
            });
        }
const mailType = Number(type) === 3 ? "customer" : "merchant";
        try {
            await sendMail(
                mailType,
                mail,
                subject,
                CommonMailTemplate({
                    userType: type, // 1 = Merchant, 2 = Receptionist, 3 = Customer
                    name: name,
                    title: title,
                    message: message
                })
            );
        } catch (mailErr) {
            console.error("MAIL ERROR:", mailErr);

            return res.status(500).json({
                status: 0,
                message: "Failed to send mail."
            });
        }

        return res.json({
            status: 1,
            message: "Mail sent successfully.",
            data: {
                type,
                name,
                mail,
                subject,
                title,
                message
            }
        });

    } catch (err) {
        console.error(err);

        return res.status(500).json({
            status: 0,
            message: "Internal server error."
        });
    }
};