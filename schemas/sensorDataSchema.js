const mongoose = require('mongoose');

const farmDataSchema = mongoose.Schema({
    creator: {
        type: String,
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    city: {
        type: String,
        required: true,
    },
    zip: {
        type: String,
        required: true,
    },
    country: {
        type: String,
        required: true,
    },
    established: {
        type: Date,
        required: true,
    },
    id: {
        type: Number,
        required: true,
    },
});

module.exports = farmDataSchema;
