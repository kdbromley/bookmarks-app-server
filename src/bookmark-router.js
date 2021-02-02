const express = require('express');
const logger = require('./logger');
const { v4: uuid } = require('uuid');
const { PORT } = require('./config'); 

const bookmarks = [{
    id: '875d3650-2225-4144-b9ab-652df8772421',
    title: 'Google',
    url: 'https://www.google.com/',
    desc: 'Google search homepage'
}]

const bookmarkRouter = express.Router();
const bodyParser = express.json();

bookmarkRouter
    .route('/bookmarks')
    .get((req, res) => {
        res.json(bookmarks)
    })
    .post(bodyParser, (req, res) => {
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
    });

bookmarkRouter
    .route('/bookmarks/:id')
    .get((req, res) => {
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
    .delete((req, res) => {
        const  { id } = req.params;

    const bookmarkIndex = bookmarks.findIndex(bm => bm.id == id);
    if(bookmarkIndex === -1) {
        logger.error(`Bookmark ${id} not found.`);
        return res
            .status(404)
            .send('Bookmark not found.');
    };

    bookmarks.splice(bookmarkIndex, 1);

    logger.info(`Bookmark ${id} deleted.`);

    res.status(204).end();
    });

module.exports = bookmarkRouter;