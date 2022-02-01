const express = require('express');
const cors = require('cors');
require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const csv = require('csv-parser');
const fileUpload = require('express-fileupload');

// Server Port
const PORT = process.env.PORT || 4000;

// Route handlers
const farmDataHandler = require('./routeHandler/farmDataHandler');
const sensorDataHandler = require('./routeHandler/sensorDataHandler');

// Express app initialization
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('previousCSV'));
app.use(fileUpload());

// Database connection with mongoose
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ctdrv.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;

mongoose
    .connect(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(() => console.log('connection successful'))
    .catch((err) => console.log(err));

// Server status check
app.get('/', (req, res) => {
    res.status(200).send({
        status: "OK",
        message: `🚀 Server Running!`,
    });
});

// Application routes
app.use('/v1/farms', farmDataHandler);
app.use('/v1/farms/', sensorDataHandler);

// Default error handler
function errorHandler(err, req, res, next) {
    if (res.headersSent) {
        return next(err);
    }
    res.status(500).json({ error: err });
}

app.listen(PORT, () => {
    console.log(`app listening at port ${PORT}`);
});
