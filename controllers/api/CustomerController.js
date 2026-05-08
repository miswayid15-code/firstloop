const { Coupon, Merchant, Branch } = require('../../models');

exports.register =async (req, res) =>
{
const { name, email, phone, password, branch_id } = req.body;

};