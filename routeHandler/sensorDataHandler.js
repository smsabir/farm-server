const express = require('express');

const router = express.Router();
const mongoose = require('mongoose');
const fs = require('fs');
const csv = require('csv-parse');

const sensorDataSchema = require('../schemas/sensorDataSchema');

const SensorData = new mongoose.model('SensorData', sensorDataSchema);

router.get('/:id/status', (req, res) => {
    const { id } = req.params;
    SensorData.find({ id })
        .select({
            _id: 0,
            __v: 0,
        })
        .exec((err, data) => {
            if (err) {
                res.status(500).json({
                    error: 'There was a server side error!',
                });
            } else {
                res.status(200).json({
                    measurements: data,
                });
            }
        });
});

router.post('/convert_csv', (req, res) => {
    const results = [];
    const finalResults = [];
    const uploadedCSV = req.files.file;
    const { id, name } = req.body;
    console.log(id, name, uploadedCSV);

    if (
        uploadedCSV.mimetype !== 'application/vnd.ms-excel' &&
        uploadedCSV.mimetype !== 'text/csv'
    ) {
        return res.status(406).send({ status: 0, message: 'Please upload csv file only' });
    }

    uploadedCSV.mv(`previousCSV/${uploadedCSV.name}`, (err) => {
        if (err) return res.status(400).send({ status: 0, message: 'Upload failed' });
        fs.createReadStream(`./previousCSV/${uploadedCSV.name}`)
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', () => {
                if (results.length <= 0) {
                    return res
                        .status(200)
                        .send({ status: 0, message: 'File is empty, No data in csv.' });
                }

                for (let index = 0; index < results.length; index++) {
                    const singleData = results[index];
                    let sensor = '';
                    let lowerLimit = 0;
                    let upperLimit = 0;
                    if (singleData.location.toLowerCase() === name.toLowerCase()) {
                        switch (singleData.sensorType.toLowerCase()) {
                            case 'temperature':
                                sensor = 'temperature';
                                lowerLimit = -50;
                                upperLimit = 50;

                                validateAndAddData(sensor, lowerLimit, upperLimit, singleData);
                                break;

                            case 'ph':
                                sensor = 'ph';
                                lowerLimit = 0;
                                upperLimit = 14;
                                validateAndAddData(sensor, lowerLimit, upperLimit, singleData);
                                break;

                            case 'rainfall':
                                sensor = 'rainfall';
                                lowerLimit = 0;
                                upperLimit = 500;
                                validateAndAddData(sensor, lowerLimit, upperLimit, singleData);
                                break;

                            default:
                                break;
                        }
                    } else {
                        const message = singleData.hasOwnProperty('datetime')
                            ? `${singleData.datetime} has wrong location name`
                            : 'Selected Farm and File Location does not match!';
                        console.log(message);
                    }

                    // eslint-disable-next-line no-inner-declarations
                }
                // res.status(200).send(finalResults);
                SensorData.insertMany(finalResults, (err) => {
                    if (err) {
                        res.status(500).json({
                            error: 'There was a server side error!',
                        });
                    } else {
                        res.status(200).json({
                            message: 'Todos were inserted successfully!',
                        });
                    }
                });
            });
    });

    function validateAndAddData(sensor, lowerLimit, UpperLimit, singleData) {
        const { value } = singleData;
        const blank = '';
        if (value >= lowerLimit && value <= UpperLimit && value !== blank) {
            finalResults.push({ ...singleData, id });
        } else {
            console.log(`${sensor} data does not match!`);
        }
    }
});

module.exports = router;
