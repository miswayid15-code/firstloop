const { Merchant } = require('../../models');

exports.testDB = async (req, res) => {
  try {

    const data = await Merchant.findAll();

    res.json({
      status: 1,
      data: data
    });

  } catch (err) {
    console.log(err);
    res.json({
      status: 0,
      message: "Error"
    });
  }
};