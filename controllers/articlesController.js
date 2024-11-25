const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const console = require('../util/Logger.js').console;
const {
    parseUrl, 
    parseBodyJson, 
    writeToFile, 
    readFromFile, 
    appendLog,
    validateJson } = require('../helper.js');


const articleScheme = {
    title: 'string',
    text: 'string',
    date: 'string',
    author: 'string',
};

const articlesController = {
    '/api/articles/readall': getArticles,
    '/api/articles/read': getSingleArticle,
    '/api/articles/create': addArticle,
    '/api/articles/update': updateArticle,
    '/api/articles/delete': removeArticle
}

function getArticles(req, res, cb) {
    readFromFile('./articles.json').then((data) => {
        cb(null, data.articles);
    })
    .then(() => appendLog(req.url));
}

function getSingleArticle(req, res, cb) {
    const {params} = parseUrl(req.url);

    readFromFile('./articles.json').then((data) => {
        const article = data.articles.filter((item) => item.id == params.id);

        if (article.length == 0) {
            return Promise.reject(new Error(`Article with id: ${params.id} does not exist.`));
        }

        cb(null, article[0]); 
    })
    .then(() => appendLog(req.url))
    .catch((err) => cb(err));
}

function addArticle(req, res) {
    parseBodyJson(req, (err, body) => {
        if (err) {
            res.statusCode = 404;
            res.end(err.message);

            return;
        } 

        try {
            validateJson(articleScheme, body);

            readFromFile('./articles.json').then((data) => {
                const newItem = {
                    id: uuidv4(),
                    title: body.title,
                    text: body.text,
                    date: body.date,
                    author: body.author,
                    comments: []
                };
    
                const updatedData = {articles: [...data.articles, newItem]};
                const updatedJson = JSON.stringify(updatedData, null, 2);
        
                writeToFile('./articles.json', updatedJson);
        
                res.statusCode = 201;
                res.end(JSON.stringify(newItem));

            })
            .then(() => appendLog(req.url, body));

        } catch (error) {
            console.error(error);
            res.statusCode = 400;
            res.end(error.message);
        }
    });
}

function updateArticle(req, res) {
    const { params } = parseUrl(req.url);

    parseBodyJson(req, (err, body) => {
        if (err) {
            res.statusCode = 404;
            res.end(err.message);

            return;
        } 

        try {
            validateJson(articleScheme, body);

            readFromFile('./articles.json').then((data) => {
                let articleExist = false; 

                const updatedData = data.articles.map((item) => {
                    if (item.id === params.id) {
                        articleExist = true; 

                        return {
                            id: item.id,
                            title: body.title || item.title,
                            text: body.text || item.text,
                            date: body.date || item.date,
                            author: body.author || item.author,
                            comments: item.comments,
                        };
                    }
                    return item;
                });

                if (!articleExist) {
                    return Promise.reject(new Error(`Article with id: ${params.id} does not exist.`));
                }
    
                const updatedJson = JSON.stringify({articles: [...updatedData]}, null, 2);
    
                writeToFile('./articles.json', updatedJson);
    
                res.statusCode = 204;
                res.end();
            })
            .then(() => appendLog(req.url, body, params))
            .catch((err) => {
                console.error(err);
                res.statusCode = 404; 
                res.end(err.message);
            });
        } catch (error) {
            console.error(error);
            res.statusCode = 400;
            res.end(error.message);
        }
    });
}

function removeArticle(req, res) {
    const { params } = parseUrl(req.url);

    readFromFile('./articles.json').then((data) => {
        const initLength = data.articles.length;

        const updatedData = data.articles.filter((item) => item.id != params.id);

        if (updatedData.length == initLength) {
            return Promise.reject(new Error(`Article with id: ${params.id} does not exist.`));
        }

        const updatedJson = JSON.stringify({articles: [...updatedData]}, null, 2);

        writeToFile('./articles.json', updatedJson);

        res.end('Article was successfully removed.');
    })
    .then(() => appendLog(req.url, body=null, params))
    .catch((err) => {
        console.error(err);
        res.statusCode = 404; 
        res.end(err.message);
    });
}

module.exports = { articlesController }