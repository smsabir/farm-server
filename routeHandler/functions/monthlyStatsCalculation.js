// Main function to claculate monthly stats
export default function calculateStats(passedArray) {
    const { sensor_type } = passedArray[0];
    const { farm_id } = passedArray[0];
    const allStats = [];

    for (let i = 0; i < passedArray.length; i++) {
        const refData = passedArray[i];
        const startCompare = 1 + i;

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

console.log(calculateStats(passedArray));

// Helper function of Main function
function getMonthlyData(refData, dateArray, index) {
    const startDate = refData.datetime.split('T')[0];
    const date = new Date(startDate);

    const array = [refData.value];

    for (let j = index; j < dateArray.length; ) {
        const compareTo = dateArray[j].datetime.split('T')[0];
        const { value } = dateArray[j];

        if (startDate === compareTo) {
            array.push(value);
            j++;

            if (j === dateArray.length) {
                return [monthlyStats(array, date), { newRef: compareTo }, { index: 18 }];
            }
        } else {
            return [monthlyStats(array, date), { newRef: compareTo }, { index: j }];
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
