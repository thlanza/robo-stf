const express = require("express");

//Not found
const notFound = (req, res, next) => {
    const error = new Error(`Não achado - ${req.originalUrl}`);
    res.status(404);
    next(error);
};

//Error handler
const errorHandler = (err, req, res, next) => {
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    res.status(statusCode);
    const stackErr = process.env.NODE_ENV === 'development' ? err.stack : null;
    res.json({
        message: err?.message,
        stack: stackErr
    });
    console.log("StackTrace: ", err?.stack)
};

module.exports = { errorHandler, notFound };