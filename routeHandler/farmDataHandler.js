const express = require('express');

const router = express.Router();
const mongoose = require('mongoose');

const farmDataSchema = require('../schemas/farmDataSchema');

const Farm = new mongoose.model('Farm', farmDataSchema);

// GET for all farm data
router.get('/', (req, res) => {
    Farm.find({})
        .select({
            _id: 0,
            __v: 0,
            creator: 0,
            zip: 0,
        })
        .exec((err, data) => {
            if (err) {
                res.status(500).json({
                    error: 'There was a server side error!',
                });
            } else {
                res.status(200).json(data);
            }
        });
});

// POST for fetching user specified farm data
router.post('/', (req, res) => {
    const { email } = req.body;
    console.log(email);
    const getUsersFarms = (id) => {
        const gID = { gID: id };
        Farm.find({ creator: email })
            .select({
                __v: 0,
            })
            .exec((err, data) => {
                if (err) {
                    res.status(500).json({
                        error: 'There was a server side error!',
                    });
                } else {
                    res.status(200).json([gID, [...data]]);
                }
            });
    };

    // generating ID for new farm registration
    Farm.find({})
        .then((data) => {
            const IDs = data.map((farm) => farm.id);
            const generatedID = Math.max(...IDs) + 1;
            getUsersFarms(generatedID);
        })
        .catch((err) => console.log(err));
});

// POST for registering farms
router.post('/add', (req, res) => {
    const newFarm = new Farm(req.body);

    newFarm.save((err) => {
        if (err) {
            res.status(500).json({
                error: err,
            });
        } else {
            res.status(200).json({
                message: 'Farm was Registered successfully!',
            });
        }
    });
});
// POST Router For Update
router.put('/update', (req, res) => {
    const data = req.body;
    const { _id } = data;
    const result = Farm.findByIdAndUpdate(
        _id,
        data,

        {
            new: true,
            upsert: true,
            rawResult: true,
        },

        (err) => {
            if (err) {
                res.status(500).json({
                    error: 'There was a server side error!',
                });
            } else {
                res.status(200).json({
                    message: 'Farm Data was updated successfully!',
                });
            }
        },
    );
    // console.log(data, _id);
});

module.exports = router;
