const express = require('express');
const app = express();
const PORT = process.env.PORT || 4000;
const mongoose = require('mongoose');

// DB connection
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ctdrv.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;

mongoose
    .connect(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(() => console.log('connection successful'))
    .catch((err) => console.log(err));

app.get("/", (req, res) => {
    res.status(200).send({
        status: 1,
        message: `🚀 App Running on port http://localhost:${PORT}`
    })
})

app.listen(PORT, () => {
    console.log(`app listening at port ${PORT}`);
});