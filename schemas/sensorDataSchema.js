const mongoose = require('mongoose');

const sensorDataSchema = mongoose.Schema({
    location: {
        type: String,
        required: true,
    },
    datetime: {
        type: Date,
        required: true,
    },
    sensorType: {
        type: String,
        required: true,
    },
    value: {
        type: Number,
        required: true,
    },
    id: {
        type: String,
        required: true,
    },
});

module.exports = sensorDataSchema;
