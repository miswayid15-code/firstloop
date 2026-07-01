const { Appointment } = require("../models");

async function generateRefId(branchName) {
    // Get first letter of first two words
    const prefix = branchName
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map(word => word.charAt(0).toUpperCase())
        .join("");

    let refId;
    let exists = true;

    while (exists) {
        const random = Math.floor(100000 + Math.random() * 900000);

        refId = `${prefix}${random}`;

        exists = await Appointment.findOne({
            where: {
                ref_id: refId,
            },
        });
    }

    return refId;
}

module.exports = generateRefId;