const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static('uploads'));

app.get('/', (req, res) => {
    res.send('Dealora API Running 🚀');
});
app.get('/backend', (req, res) => {
    res.send('Dealora API Running 🚀');
});

app.use('/admin', require('./routes/admin/adminAuthRoutes'));















app.use('/api', require('./routes/api/testRoutes'));
app.use('/api', require('./routes/api/merchantRoutes'));
app.use('/api', require('./routes/api/branchRoutes'));
app.use('/api', require('./routes/api/receptionistRoutes'));
app.use('/api', require('./routes/api/categoryRoutes'));
app.use('/api', require('./routes/api/couponRoute'));
app.use('/api', require('./routes/api/customerRoute'));
app.use('/api', require('./routes/api/additionalRoute'));

module.exports = app;