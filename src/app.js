require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');
const { NODE_ENV } = require('./config');
const winston = require('winston');


const app = express();

const morganSetting = (NODE_ENV === 'production')
    ? 'tiny'
    : 'common';

app.use(morgan(morganSetting));
app.use(helmet());
app.use(cors());
app.use(express.json());

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.File({ filename: 'info.log' })
    ]
});

if (NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.simple()
    }));
};

app.use(function validateBearerToken(req, res, next) {
    const apiToken = process.env.API_TOKEN;
    const authToken = req.get('Authorization');

    if(!authToken || authToken.split(' ')[1] !== apiToken) {
        logger.error(`Unauthorized request to path ${req.path}`)
        return res.status(401).json({ error: 'Unauthorized request' });
    };
    next()
});

const bookmarks = [{
    id: '875d3650-2225-4144-b9ab-652df8772421',
    title: 'Google',
    url: 'https://www.google.com/',
    desc: 'Google search homepage'
}]

app.get('/', (req, res) => {
    res.json(bookmarks)
});


app.use(function errorHandler(error, req, res, next) {
    let response;
    if (NODE_ENV === 'production') {
        response = { error: { message: 'Server error' } };
    } else {
        console.error(error);
        response = { message: error.message, error };
    }
    res.status(500).json(response);
})

module.exports = app;