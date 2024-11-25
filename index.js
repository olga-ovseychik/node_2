const http = require('http');
const console = require('./util/Logger.js').console;
const { articlesController } = require('./controllers/articlesController.js');
const { commentsController } = require('./controllers/commentsController.js');
const { parseBodyJson, parseUrl } = require('./helper.js');

const hostname = '127.0.0.1';
const port = 3000;

const endpointMapper = {
    '/sum': sum,
    ...articlesController,
    ...commentsController
};

const server = http.createServer((req, res) => {
        const {url} = parseUrl(req.url);
        const handler = getHandler(url);

        handler(req, res, (err, result) => {
            if (err) {
                res.statusCode = 404;
                res.setHeader('Content-Type', 'application/json');
                res.end(err.message);

                return;
            }

            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(result));
        });
    }
);
     
server.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}/`);
});

function getHandler(url) {
    return endpointMapper[url] || notFound;
}

function sum(req, res, cb) {
    parseBodyJson(req, (err, payload) => {
        const result = { c: payload.a + payload.b };
        cb(null, result); 
    });
}

function notFound(req, res, cb) {
    cb({ code: 404, message: 'Not found'});
}
