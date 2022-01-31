const mongoose = require('mongoose');

const sensorDataSchema = mongoose.Schema({
    location: {
        type: String,
        required: true,
    },
    datetime: {
        type: String,
        required: true,
    },
    sensor_type: {
        type: String,
        required: true,
    },
    value: {
        type: Number,
        required: true,
    },
    farm_id: {
        type: String,
        required: true,
    },
});

module.exports = sensorDataSchema;
