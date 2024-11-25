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


const commentScheme = {
    articleId: 'string',
    text: 'string',
    date: 'string',
    author: 'string',
};

const commentsController = {
    '/api/comments/create': addComment,
    '/api/comments/delete': removeComment
}

function addComment(req, res) {
    parseBodyJson(req, (err, body) => {
        if (err) {
            console.error(err)
            res.statusCode = 400;
            res.end('Request invalid.');

            return;
        } 

        try {
            validateJson(commentScheme, body);

            readFromFile('./articles.json').then((data) => {
                const newItem = {
                    id: uuidv4(),
                    articleId: body.articleId,
                    text: body.text,
                    date: body.date,
                    author: body.author
                };
    
                const updatedData = data.articles.map((item) => {
                    if (item.id === newItem.articleId) {
                        return {
                            ...item, 
                            comments: [...item.comments, newItem],
                        };
                    }
    
                    return item;
                });
    
                const updatedJson = JSON.stringify({articles: [...updatedData]}, null, 2);
    
                writeToFile('./articles.json', updatedJson);
    
                res.statusCode = 201;
                res.end(JSON.stringify(newItem));
            })
            .then(() => appendLog(req.url, body));
            
        } catch (error) {
            console.error(error);
            res.statusCode = 400;
            res.end(JSON.stringify(error.message));
        }
    });  
}

function removeComment(req, res) {
    const readFile = readFromFile('./articles.json');
    const { params } = parseUrl(req.url);
   
        readFile.then((data) => {
            let commentExist = false;

            const updatedData = data.articles.map((item) => {
                if (item.comments) {
                    const initialLength = item.comments.length;

                    item.comments = item.comments.filter((comment) => comment.id !== params.id);

                    if (item.comments.length < initialLength) {
                        commentExist = true; 
                    }
                } 

                return item;
            });

            if (!commentExist) {
                return Promise.reject(new Error(`Comment with id: ${params.id} does not exist.`));
            }
    
            const updatedJson = JSON.stringify({articles: [...updatedData]}, null, 2);
    
            writeToFile('./articles.json', updatedJson);
    
            res.end('Comment was successfully removed.');
        })
        .then(() => appendLog(req.url, body=null, params))
        .catch((err) => {
            console.error(err);
            res.statusCode = 404; 
            res.end(err.message);
        });
}

module.exports = { commentsController }