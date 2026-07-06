const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

require('dotenv').config();
require('./cron/deleteMerchantImages');
const app = require('./app');

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

process.env.TZ = "Asia/Kolkata";