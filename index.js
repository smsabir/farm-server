const express = require('express');
const app = express();
const PORT = 4000;

app.get("/", (req, res) => {
    res.status(200).send({
        status: 1,
        message: `🚀 App Running on port http://localhost:${PORT}`
    })
})

app.listen(PORT, () => {
    console.log(`app listening at port ${PORT}`);
});