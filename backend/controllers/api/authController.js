const pool = require('../../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.vendorRegister = async (req, res) => {
    try {
        const {
            name,
            email,
            phone,
            password,
            address,
            id_proof_name,
            id_proof_type
        } = req.body;

        // check existing vendor
        const check = await pool.query(
            "SELECT * FROM vendors WHERE email=$1",
            [email]
        );

        if (check.rows.length > 0) {
            return res.json({
                success: 0,
                message: "Vendor already exists"
            });
        }

        // hash password
        const hash = await bcrypt.hash(password, 10);

        // insert vendor
        const result = await pool.query(
            `INSERT INTO vendors 
            (name, email, phone, password, address, id_proof_name, id_proof_type)
            VALUES ($1,$2,$3,$4,$5,$6,$7)
            RETURNING *`,
            [name, email, phone, hash, address, id_proof_name, id_proof_type]
        );

        const vendor = result.rows[0];

        // create JWT
        const token = jwt.sign(
            { id: vendor.id, role: "vendor" },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        res.json({
            success: 1,
            message: "Vendor registered",
            token,
            vendor
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: 0,
            message: "Server error"
        });
    }
};