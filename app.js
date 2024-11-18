require('dotenv').config();
const express = require('express');
const path = require('path');
const { connectDB } = require("./src/database/db");

const app = express();
const port = process.env.PORT || 3000;

connectDB();

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Routes
app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'dashboard.html'));
});
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'register.html'));
});
app.get('/game', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'game.html'));
});
app.get('/gamequeue', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'gamequeue.html'));
});
app.get('/storie', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'storie.html'));
});
app.get('/classifiche', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'classifiche.html'));
});


const registerRoutes = require('./src/routes/registerRoutes');
const loginRoutes = require('./src/routes/loginRoutes');
const dashboardRoutes = require('./src/routes/dashboardRoutes');
const itemsRoutes = require('./src/routes/itemsRoutes');
const queueRoutes = require('./src/routes/queueRoutes');
const playersQueue = require('./src/routes/playersQueue');
const verifyLogIn = require('./src/routes/verifyLogIn');


app.use(verifyLogIn);
app.use(registerRoutes);
app.use(loginRoutes);
app.use(dashboardRoutes);
app.use(itemsRoutes);
app.use(queueRoutes);
app.use(playersQueue);



app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
