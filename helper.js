const { writeFile, readFile } = require('fs/promises');

function parseBodyJson(req, cb) {
    let body = [];

    req.on('data', function(chunk) {
        body.push(chunk);
    }).on('end', function() {
        body = Buffer.concat(body).toString();

        try {
            const result = JSON.parse(body); 

            cb(null, result); 
        } catch (error) {
            console.error(`
                endpoint:${req.url} 
                message: Failed to parse JSON.
            `);
            cb(new Error(error.message)); 
        }
    });
}

function parseUrl(url) {
    const [parsedUrl, paramsString] = url.split('?');
    let parsedParams = null;
    
    if (paramsString) {
        const params = paramsString.split('&')
        parsedParams = params.reduce((acc, curr) => {
            const [key, value] = curr.split('=');
            acc[key] = value;
    
            return acc;
        }, {});
    }
    
    return {
        url: parsedUrl,
        params: parsedParams
    }
}

async function readFromFile(filePath) {
    try {
        const fileData = await readFile(filePath, 'utf-8');
        const parsedData = JSON.parse(fileData);

        return parsedData;
      } catch (err) {
        console.error(err);
        throw new Error('Failed to read data from file.');
      }
}

async function writeToFile(filePath, data) {
    try {
        await writeFile(filePath, data, 'utf-8');
    } catch (err) {
        console.error(err);
        throw new Error('Failed to write data to file.');
    }
}

function appendLog(url, payload=null, params=null) {
    console.log(`
        timestamps: ${new Date().toString()}
        endpoint: ${url}
        params: ${JSON.stringify(params)}
        body: ${JSON.stringify(payload)}
    `)
}

function validateJson(scheme, json) {
	for (let key in scheme) {
        if (!json.hasOwnProperty(key)) {
            throw new Error(`Missing field: ${key}`);
        } else if (typeof json[key] !== scheme[key]) {
            throw new Error(`Invalid type for field "${key}". Expected '${scheme[key]}', got '${typeof json[key]}'`);
        }
    }
}

module.exports = { 
    parseBodyJson, 
    parseUrl, 
    writeToFile, 
    readFromFile, 
    appendLog, 
    validateJson
};