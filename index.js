const express = require('express');
const bodyParser = require('body-parser');
const route = require('./route/route.js');
const mongoose = require('mongoose');
const multer = require("multer")
const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(multer().any())

mongoose.connect("mongodb+srv://vaibhu:vaibhu123@cluster0.gvjopnc.mongodb.net/MedPlus", {
    useNewUrlParser: true
})
    .then(() => console.log("MongoDb is connected"))
    .catch(err => console.log(err))


app.use('/', route)

app.listen(process.env.PORT || 3000, function () {
    console.log('Express app running on port ' + (process.env.PORT || 3000))
});