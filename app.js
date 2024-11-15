require('dotenv').config();
const express = require('express');
const path = require('path');
const { connectDB } = require("./src/database/db");

const app = express();
const port = process.env.PORT || 3000;

// Routes
const registerRoutes = require('./src/routes/registerRoutes');
const loginRoutes = require('./src/routes/loginRoutes');
const dashboardRoutes = require('./src/routes/dashboardRoutes');
const itemsRoutes = require('./src/routes/itemsRoutes');
const queueRoutes = require('./src/routes/queueRoutes');
const playersQueue = require('./src/routes/playersQueue');
const verifyLogIn = require('./src/routes/verifyLogIn');



connectDB();

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

app.use(verifyLogIn);
app.use(registerRoutes);
app.use(loginRoutes);
app.use(dashboardRoutes);
app.use(itemsRoutes);
app.use(queueRoutes);
app.use(playersQueue);

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});


app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
