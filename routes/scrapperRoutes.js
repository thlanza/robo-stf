const express = require('express');
const { scrapper } = require('../controllers/scrapperController');

const scrapperRouter = express.Router();

scrapperRouter.post('/', scrapper);

module.exports = scrapperRouter;