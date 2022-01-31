const express = require('express');

const router = express.Router();
const mongoose = require('mongoose');
const csv = require('csv-parser');
const fs = require('fs');

const sensorDataSchema = require('../schemas/sensorDataSchema');

const SensorData = new mongoose.model('SensorData', sensorDataSchema);
//  GET sensor data by id
router.get('/:id/stats', (req, res) => {
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

// POST sensor data from CSV
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

                                validateAndAddData(sensor, lowerLimit, upperLimit, singleData, id);
                                break;

                            case 'ph':
                                sensor = 'ph';
                                lowerLimit = 0;
                                upperLimit = 14;
                                validateAndAddData(sensor, lowerLimit, upperLimit, singleData, id);
                                break;

                            case 'rainfall':
                                sensor = 'rainfall';
                                lowerLimit = 0;
                                upperLimit = 500;
                                validateAndAddData(sensor, lowerLimit, upperLimit, singleData, id);
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

    async function validateAndAddData(sensor, lowerLimit, UpperLimit, singleData, farmId) {
        const {
 value, location, sensorType, datetime 
} = singleData;
        const date = datetime.toString();
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

            finalResults.push(thisData);
        } else {
            console.log(`${sensor} data does not match!`);
        }
    }
});

// GET stats by Farm id and Sensor type
router.get('/:farm_id/stats/:sensor_type/monthly', async (req, res) => {
    const param = req.params;
    const { farm_id, sensor_type } = param;

    // console.log(id, sensorType);

    const fetchedData = await SensorData.find({ farm_id, sensor_type })
        .select({
            _id: 0,
            __v: 0,
        })
        .exec()
        .catch((err) => {
            res.status(500).json({
                error: 'There was a server side error!',
            });
        });
    const sortedData = fetchedData.sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

    const stats = await calculateStats(sortedData, param);

    // const finalData = [await stats];
    res.status(200).send({ stats });
    // .exec((err, data) => {
    //     if (err) {
    //         res.status(500).json({
    //             error: 'There was a server side error!',
    //         });
    //     } else {
    //         fetchedData = data;
    //         });
    //     }
    // });
});

// shorting the monthly data
function sortFunction(a, b) {
    const c = new Date(a.date);
    const d = new Date(b.date);
    return c - d;
}

// Main function to calculate monthly stats
function calculateStats(passedArray, param) {
    const { farm_id, sensor_type } = param;

    const allStats = [];

    for (let i = 0; i < passedArray.length; ) {
        const refData = passedArray[i];
        const startCompare = i + 1;

        const returnedData = getMonthlyData(refData, passedArray, startCompare);

        if (returnedData !== undefined && returnedData[2].index !== undefined) {
            // console.log(returnedData);
            allStats.push(returnedData[0]);
            i = returnedData[2].index;
        } else {
            i = passedArray.length;
        }
    }

    // return final data
    return { farm_id, sensor_type, stats: allStats };
}
// Helper function of Main function
function getMonthlyData(refData, dateArray, index) {
    const startDate = refData.datetime.split('T')[0];
    const date = new Date(startDate);

    // Splitting the Date
    let compareThisDate = startDate.split('-');
    compareThisDate = `${compareThisDate[0]}-${compareThisDate[1]}`;

    const array = [refData.value];

    // console.log(`start from ---: ${startDate} index: ${index - 1}`);
    // console.log(`compare from ---: ${dateArray[index].datetime.split('T')[0]} index: ${index}`);

    for (let j = index; j < dateArray.length;) {
        const { length } = dateArray;

        const flag = 0;

        // splitting date for compare with
        const compareTo = dateArray[j].datetime.split('T')[0];
        let compareWith = compareTo.split('-');
        compareWith = `${compareWith[0]}-${compareWith[1]}`;

        const { value } = dateArray[j];

        if (compareThisDate === compareWith) {
            // console.log(`comp: ${compareTo}`);
            array.push(value);
            j++;
        } else {
            // console.log(`Did not comp: ${compareTo} index: ${j}`);
            const i = j;
            return [monthlyStats(array, date), { newRef: compareWith }, { index: i }];
        }
        if (j === dateArray.length - 1) {
            console.log(`J reached array size: ${compareTo} index: ${length}`);
            return [monthlyStats(array, date), { newRef: compareWith }, { index: length }];
        }
    }
}

// Helper function of first Helper function
function monthlyStats(array, date) {
    const stats = {};
    stats.month = date.getMonth() + 1;
    stats.year = date.getFullYear();
    const { length } = array;
    const average = array.reduce((a, b) => a + b) / length;
    const index = Math.floor(length / 2);

    stats.average = average;

    if (length % 2) {
        stats.median = array[index];
    } else {
        stats.median = (array[index - 1] + array[index]) / 2;
    }

    const standardDeviation = Math.sqrt(
        array.reduce((s, n) => s + (n - average) ** 2, 0) / (length - 1)
    );

    stats.standardDeviation = standardDeviation;

    return stats;
}

module.exports = router;
