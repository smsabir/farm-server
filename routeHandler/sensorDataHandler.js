const express = require('express');

const router = express.Router();
const mongoose = require('mongoose');
const csv = require('csv-parser');
const fs = require('fs');

const { json } = require('express');
const sensorDataSchema = require('../schemas/sensorDataSchema');

const SensorData = new mongoose.model('SensorData', sensorDataSchema);

//  GET sensor data by id
router.get('/:id/stats', (req, res) => {
    let { id } = req.params;
    id = id.toString();
    SensorData.find({ farm_id: id })
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

// GET stats by Farm id and Sensor type
router.get('/:id/stats/:sensorType/monthly', async (req, res) => {
    const param = req.params;
    let { id, sensorType } = param;
    id = id.toString();

    const aggData = await SensorData.aggregate([
        {
            $match: {
                farm_id: id,
                sensor_type: sensorType,
            },
        },

        {
            $group: {
                _id: { year: { $year: '$datetime' }, month: { $month: '$datetime' } },

                average: { $avg: '$value' },
                standardDeviation: { $stdDevSamp: '$value' },
                count: {
                    $sum: 1,
                },
                values: {
                    $push: '$value',
                },
            },
        },
        { $sort: { _id: 1 } },
    ]);

    const stats = await monthlyStats(aggData);
    console.log({ farm_id: id, sensor_type: sensorType, stats });

    res.status(200).send({ farm_id: id, sensor_type: sensorType, stats });
});

// POST sensor data from CSV
router.post('/convert_csv', (req, res) => {
    const results = [];
    const finalResults = [];
    const uploadedCSV = req.files.file;
    const { id, name } = req.body;
    console.log(id, name, uploadedCSV);

    if (
        uploadedCSV.mimetype !== 'application/vnd.ms-excel'
        && uploadedCSV.mimetype !== 'text/csv'
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
                        let passedData = {};
                        switch (singleData.sensorType.toLowerCase()) {
                            case 'temperature':
                                sensor = 'temperature';
                                lowerLimit = -50;
                                upperLimit = 50;

                                passedData = validateAndAddData(
                                    sensor,
                                    lowerLimit,
                                    upperLimit,
                                    singleData,
                                    id,
                                );
                                finalResults.push(passedData);
                                break;

                            case 'ph':
                                sensor = 'ph';
                                lowerLimit = 0;
                                upperLimit = 14;

                                passedData = validateAndAddData(
                                    sensor,
                                    lowerLimit,
                                    upperLimit,
                                    singleData,
                                    id,
                                );
                                finalResults.push(passedData);
                                break;

                            case 'rainfall':
                                sensor = 'rainfall';
                                lowerLimit = 0;
                                upperLimit = 500;

                                passedData = validateAndAddData(
                                    sensor,
                                    lowerLimit,
                                    upperLimit,
                                    singleData,
                                    id,
                                );
                                finalResults.push(passedData);
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
                }
                // res.status(200).send(finalResults);
                SensorData.insertMany(finalResults, (err) => {
                    if (err) {
                        res.status(500).json({
                            error: err,
                        });
                    } else {
                        res.status(200).json({
                            message: 'Data were inserted successfully!',
                        });
                    }
                });
            });
    });
});

// function for data validation
async function validateAndAddData(sensor, lowerLimit, UpperLimit, singleData, farmId) {
    const { value, location, sensorType, datetime } = singleData;
    const date = new Date(datetime);
    const blank = '';
    const sensorToLower = sensorType.toLowerCase();

    if (value >= lowerLimit && value <= UpperLimit && value !== blank) {
        const thisData = {
            location,
            datetime: date,
            sensor_type: sensorToLower,
            value,
            farm_id: farmId,
        };

        return thisData;
    }
    console.log(`${sensor} data does not match!`);
}

// Function to calculate median and organize the stats
async function monthlyStats(aggData) {
    const totalMonths = aggData.length;
    const stats = [];

    for (let i = 0; i < totalMonths;) {
        let thisData = {};
        const { average, standardDeviation } = aggData[i];
        const { year, month } = aggData[i]._id;
        const valueArray = aggData[i].values.sort();
        const middle = valueArray.length / 2;

        const newMedian = median(valueArray, middle);

        thisData = {
            month,
            year,
            average,
            median: newMedian,
            standard_deviation: standardDeviation,
        };
        stats.push(thisData);
        i++;
    }
    return stats;
}

// median calculator
function median(valueArray, middle) {
    if (valueArray.length % 2) {
        return valueArray[middle];
    }
    return (valueArray[middle - 1] + valueArray[middle]) / 2;
}

module.exports = router;
