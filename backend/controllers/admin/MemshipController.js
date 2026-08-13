const {
    MembershipCard
} = require('../../models');
const fs = require('fs');
const path = require('path');

// =====================================================
// LIST MEMBERSHIP CARDS
// =====================================================
exports.list = async (req, res) => {
    try {
        const baseUrl = process.env.APP_URL;

        const membershipCards = await MembershipCard.findAll({
            where: {
                del_status: 0
            },
            attributes: [
                'id',
                'name',
                'image',
                'status',
                'del_status',
                'createdAt',
            ],
            order: [['id', 'DESC']]
        });

        membershipCards.forEach(card => {
            if (card.image) {
                card.image = baseUrl + '/' + card.image.replace(/\\/g, '/');
            } else {
                card.image = null;
            }
        });

        return res.json({
            status: 1,
            message: "Card Design List",
            data: membershipCards
        });

    } catch (err) {

        console.error("MEMBERSHIP CARD LIST ERROR:", err);

        return res.status(500).json({
            status: 0,
            message: "Something went wrong",
            error: err.message
        });
    }
};


// =====================================================
// CREATE MEMBERSHIP CARD
// =====================================================
exports.register = async (req, res) => {
    try {

        const {
            name
        } = req.body || {};

        console.log("BODY:", req.body);
        console.log("NAME:", name);

        if (!name || !name.trim()) {
            return res.json({
                status: 0,
                message: "Card design name is required"
            });
        }

        // =========================
        // GET UPLOADED IMAGE
        // =========================
        const files = req.files || [];

        const imageFile = files.find(
            file => file.fieldname === 'image'
        );

        const cardImage = imageFile
            ? imageFile.path.replace(/\\/g, '/')
            : null;

        // =========================
        // CREATE MEMBERSHIP CARD
        // =========================
        const membershipCard = await MembershipCard.create({
            name: name.trim(),
            image: cardImage,
            status: 1,
            del_status: 0
        });

        return res.json({
            status: 1,
            message: "New Card Design created successfully",
            data: membershipCard
        });

    } catch (err) {

        console.error("MEMBERSHIP CARD CREATE ERROR:", err);

        return res.status(500).json({
            status: 0,
            message: err.message
        });
    }
};


// =====================================================
// UPDATE MEMBERSHIP CARD
// =====================================================
exports.update = async (req, res) => {
    try {

        const {
            id,
            name
        } = req.body;

        if (!id) {
            return res.json({
                status: 0,
                message: "Card Design ID is required"
            });
        }

        // =========================
        // FIND CARD
        // =========================
        const membershipCard = await MembershipCard.findOne({
            where: {
                id,
                del_status: 0
            }
        });

        if (!membershipCard) {
            return res.json({
                status: 0,
                message: "Card Design is not found"
            });
        }

        // =========================
        // GET NEW IMAGE
        // =========================
        const files = req.files || [];

        const imageFile = files.find(
            file => file.fieldname === 'image'
        );

        const updateData = {
            name: name !== undefined
                ? name.trim()
                : membershipCard.name
        };

        // Only update image if a new image is uploaded
        if (imageFile) {
            updateData.image = imageFile.path.replace(/\\/g, '/');
        }

        // =========================
        // UPDATE
        // =========================
        await membershipCard.update(updateData);

        // Get updated record
        const updatedMembershipCard = await MembershipCard.findByPk(id);

        return res.json({
            status: 1,
            message: "Card Design updated successfully",
            data: updatedMembershipCard
        });

    } catch (err) {

        console.error("MEMBERSHIP CARD UPDATE ERROR:", err);

        return res.status(500).json({
            status: 0,
            message: err.message
        });
    }
};


// =====================================================
// FETCH SINGLE MEMBERSHIP CARD
// =====================================================
exports.fetch_list = async (req, res) => {
    try {

        const {
            id
        } = req.body;

        if (!id) {
            return res.json({
                status: 0,
                message: "Card Design ID is required"
            });
        }

        const membershipCard = await MembershipCard.findOne({
            where: {
                id,
                del_status: 0
            },
            attributes: [
                'id',
                'name',
                'image',
                'status',
                'del_status',
                'createdAt',
                'updatedAt'
            ]
        });

        if (!membershipCard) {
            return res.json({
                status: 0,
                message: "Card Design is not found"
            });
        }

        return res.json({
            status: 1,
            message: "Card Design Details",
            data: membershipCard
        });

    } catch (err) {

        console.error("MEMBERSHIP CARD FETCH ERROR:", err);

        return res.status(500).json({
            status: 0,
            message: err.message
        });
    }
};


// =====================================================
// UPDATE STATUS
// =====================================================
exports.update_status = async (req, res) => {
    try {

        const {
            id,
            status
        } = req.body;

        if (!id) {
            return res.json({
                status: 0,
                message: "Card Design ID is required"
            });
        }

        if (status === undefined || status === null) {
            return res.json({
                status: 0,
                message: "Status is required"
            });
        }

        const membershipCard = await MembershipCard.findOne({
            where: {
                id,
                del_status: 0
            }
        });

        if (!membershipCard) {
            return res.json({
                status: 0,
                message: "Card Design is not found"
            });
        }

        await membershipCard.update({
            status: Number(status)
        });

        return res.json({
            status: 1,
            message: "Card Design status updated successfully"
        });

    } catch (err) {

        console.error("MEMBERSHIP CARD STATUS ERROR:", err);

        return res.status(500).json({
            status: 0,
            message: "Issue with status update",
            error: err.message
        });
    }
};


// =====================================================
// DELETE MEMBERSHIP CARD
// =====================================================
exports.delete = async (req, res) => {
    try {

        const { id } = req.body || {};

        if (!id) {
            return res.json({
                status: 0,
                message: "Card Design ID is required"
            });
        }

        const membershipCard = await MembershipCard.findOne({
            where: {
                id,
                del_status: 0
            }
        });

        if (!membershipCard) {
            return res.json({
                status: 0,
                message: "Card Design is not found"
            });
        }

        // =========================
        // DELETE IMAGE FROM SERVER
        // =========================
        if (membershipCard.image) {

            const imagePath = path.resolve(membershipCard.image);

            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
                // console.log("Deleted image:", imagePath);
            }
        }

        // =========================
        // SOFT DELETE
        // =========================
        await membershipCard.update({
            del_status: 1
        });

        return res.json({
            status: 1,
            message: "Card Design deleted successfully"
        });

    } catch (err) {

        console.error("MEMBERSHIP CARD DELETE ERROR:", err);

        return res.status(500).json({
            status: 0,
            message: "Issue with deleting Card Design",
            error: err.message
        });
    }
};