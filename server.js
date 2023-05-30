const express = require('express');
const cors = require('cors');
const { notFound, errorHandler } = require('./middlewares/error');
const scrapperRouter = require('./routes/scrapperRoutes');
const app = express();


//Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
	cors({
		origin: '*',
	})
);

app.get('/favicon.ico', (req, res) => {
    res.sendStatus(404);
})

app.use('/api/scrapper', scrapperRouter);

//error handlers
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, console.log(`Servidor rodando na porta ${PORT}`));