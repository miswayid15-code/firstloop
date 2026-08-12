const express = require('express');
const cors = require('cors');
const requestContext = require("./helpers/requestContext");
const app = express();

app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => {
    req.language =
        req.headers["accept-language"] ||
        req.headers["x-language"] ||
        "en";

    next();
});
app.use((req, res, next) => {
    requestContext.run(
        {
            language: req.language || "en"
        },
        () => next()
    );
});
app.use('/uploads', express.static('uploads'));

app.get('/', (req, res) => {
    res.send('FirstPass API Running 🚀');
});
app.get('/backend', (req, res) => {
    res.send('FirstPass API Running 🚀');
});

app.use('/admin', require('./routes/admin/adminAuthRoutes'));
app.use('/admin', require('./routes/admin/merchantRoutes'));
app.use('/admin', require('./routes/admin/customerRoutes'));
app.use('/admin', require('./routes/admin/dashboardRoutes'));
app.use('/admin', require('./routes/admin/categoryRoutes'));
app.use('/admin', require('./routes/admin/chatRoutes'));
app.use('/admin', require('./routes/admin/additionalRoute'));
app.use('/admin', require('./routes/admin/reportRoutes'));
app.use('/admin', require('./routes/admin/notificationRoute'));
app.use('/admin', require('./routes/admin/salepersonRoute'));














app.use('/api', require('./routes/api/notificationRoutes'));
app.use('/api', require('./routes/api/testRoutes'));
app.use('/api', require('./routes/api/merchantRoutes'));
app.use('/api', require('./routes/api/branchRoutes'));
app.use('/api', require('./routes/api/receptionistRoutes'));
app.use('/api', require('./routes/api/categoryRoutes'));
app.use('/api', require('./routes/api/couponRoute'));
app.use('/api', require('./routes/api/customerRoute'));
app.use('/api', require('./routes/api/additionalRoute'));
app.use('/api/chats', require('./routes/api/chatRoute'));

module.exports = app;