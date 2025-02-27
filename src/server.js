const http = require('http');
const query = require('querystring');
const htmlHandler = require('./htmlResponses.js');
const jsonHandler = require('./jsonResponses.js');

const port = process.env.PORT || process.env.NODE_PORT || 3000;

const parseBody = (request, response, handler) => {
    const body = [];

    request.on('error', (err) => {
        console.error(err);
        response.statusCode = 400;
        response.end();
    });

    request.on('data', (chunk) => {
        body.push(chunk);
    });

    request.on('end', () => {
        const bodyString = Buffer.concat(body).toString();

        try {
            request.body = JSON.parse(bodyString); // Parse JSON correctly
        } catch (err) {
            console.error("JSON parsing error:", err);
            request.body = {}; // Set to empty object on failure
        }

        handler(request, response);
    });
}

// handle POST requests
const handlePost = (request, response, parsedUrl) => {
    if (parsedUrl.pathname === '/addUser') {
        parseBody(request, response, jsonHandler.addUser);
    }
    else if (parsedUrl.pathname === '/addFavorite') {
        parseBody(request, response, jsonHandler.addFavorite);
    }
    else if (parsedUrl.pathname === '/addTrack') {
        parseBody(request, response, jsonHandler.addTrack);
    }
    else {
        response.writeHead(404, { 'Content-Type': 'application/json' });
        response.end(JSON.stringify({ message: 'Endpoint not found' }));
    }
};

// handle GET requests
const handleGet = (request, response, parsedUrl) => {
    console.log(`Received GET request for: ${parsedUrl.pathname}`);

    const queryParams = Object.fromEntries(parsedUrl.searchParams);

    if (parsedUrl.pathname === '/' || parsedUrl.pathname === '/client.html') {
        htmlHandler.getIndex(request, response);
    }
    else if (parsedUrl.pathname === '/style.css') {
        htmlHandler.getCSS(request, response); // style
    }
    else if (parsedUrl.pathname === '/getAllTracks') {
        jsonHandler.getAllTracks(request, response); // getAllTracks
    }
    else if (parsedUrl.pathname === '/getTracks') {
        jsonHandler.getTracks(request, response, queryParams); // getTracks
    }
    else if (parsedUrl.pathname === '/getAllArtists') {
        jsonHandler.getAllArtists(request, response); // getAllArtists
    }
    else if (parsedUrl.pathname === '/getArtists') {
        jsonHandler.getArtists(request, response, queryParams); // getArtists
    }
    else if (parsedUrl.pathname === '/getFavorites') {
        jsonHandler.getFavorites(request, response); // getFavorites
    }
    else {
        response.writeHead(404, { 'Content-Type': 'application/json' });
        response.end(JSON.stringify({ message: 'Endpoint not found' }));
    }
};

const onRequest = (request, response) => {
    const protocol = request.connection.encrypted ? 'https' : 'http';
    const parsedUrl = new URL(request.url, `${protocol}://${request.headers.host}`);

    if (request.method === 'POST') {
        handlePost(request, response, parsedUrl);
    } else if (request.method === 'GET') {
        handleGet(request, response, parsedUrl);
    } else {
        response.writeHead(405, { 'Content-Type': 'application/json' });
        response.end(JSON.stringify({ message: 'Method not allowed' }));
    }
};

http.createServer(onRequest).listen(port, () => {
    console.log(`Listening on 127.0.0.1:${port}`);
});
