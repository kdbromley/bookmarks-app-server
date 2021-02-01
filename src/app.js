require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');
const { NODE_ENV } = require('./config');
const winston = require('winston');
const { v4: uuid } = require('uuid'); 
const { PORT } = require('./config');


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

app.get('/bookmarks', (req, res) => {
    res.json(bookmarks)
});

app.get('/bookmarks/:id', (req, res) => {
    const { id } = req.params;
    const bookmark = bookmarks.find(b => b.id == id);

    if(!bookmark) {
        logger.error(`Bookmark ${id} not found.`);
        return res
            .status(404)
            .send('Bookmark not found');
    };
    
    res.json(bookmark)
})

app.post('/bookmarks', (req, res) => {
    const { title, url, rating=0, desc='' } = req.body;
    if(!title) {
        logger.error('Title is required');
        return res.status(400).send('Invalid data');
    }
    if(!url) {
        logger.error('URL is required');
        return res.status(400).send('Invalid data');
    };
    if (!url.match(/^(?:(?:https?|ftp):\/\/)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:\/\S*)?$/)) {
        logger.error('Invalid url');
        return res.status(400).send('Invalid data')
    }

    const id = uuid();

    const bookmark = {
        id,
        title,
        url,
        rating,
        desc
    };

    bookmarks.push(bookmark);

    logger.info(`Bookmark ${id} for ${title} created.`);

    res
        .status(201)
        .location(`http://localhost:${PORT}/card/${id}`)
        .json(bookmark)
})

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