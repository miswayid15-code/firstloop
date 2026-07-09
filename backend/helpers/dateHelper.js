const moment = require('moment-timezone');

const formatIST = (
    date,
    format = 'DD-MM-YYYY hh:mm A'
) => {
    if (!date) return null;

    return moment(date)
        .tz('Asia/Kolkata')
        .format(format);
};

module.exports = {
    formatIST
};