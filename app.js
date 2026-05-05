const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));
// test route
app.get('/', (req, res) => {
    res.send('Dealora API Running 🚀');
});

app.use('/admin/auth', require('./routes/admin/adminAuthRoutes'));
app.use('/api', require('./routes/api/testRoutes'));
app.use('/api', require('./routes/api/merchantRoutes'));
app.use('/api', require('./routes/api/branchRoutes'));
module.exports = app;