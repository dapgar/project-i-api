const http = require('http');
const query = require('querystring');
const htmlHandler = require('./htmlResponses.js');
const jsonHandler = require('./jsonResponses.js');

const port = process.env.PORT || process.env.NODE_PORT || 3000;

// Helper function to parse POST request body
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
        request.body = query.parse(bodyString);

        handler(request, response);
    });
};

// Handle POST requests
const handlePost = (request, response, parsedUrl) => {
    if (parsedUrl.pathname === '/addUser') {
        parseBody(request, response, jsonHandler.addUser);
    } else {
        response.writeHead(404, { 'Content-Type': 'application/json' });
        response.end(JSON.stringify({ message: 'Endpoint not found' }));
    }
};

const handleGet = (request, response, parsedUrl) => {
    console.log(`Received GET request for: ${parsedUrl.pathname}`);

    // Extract query parameters
    const queryParams = Object.fromEntries(parsedUrl.searchParams);

    if (parsedUrl.pathname === '/style.css') {
        htmlHandler.getCSS(request, response);
    } else if (parsedUrl.pathname === '/getTracks') {
        console.log('Serving track data with filters:', queryParams);
        jsonHandler.getTracks(request, response, queryParams); // Pass queryParams
    } else if (parsedUrl.pathname === '/getTrackById') {
        console.log(`Fetching track with ID: ${queryParams.id}`);
        jsonHandler.getTrackById(request, response, queryParams);
    } else if (parsedUrl.pathname === '/getArtists') {  // NEW ENDPOINT
        console.log('Serving artist data');
        jsonHandler.getArtists(request, response, queryParams);
    } else {
        response.writeHead(404, { 'Content-Type': 'application/json' });
        response.end(JSON.stringify({ message: 'Endpoint not found' }));
    }
};

// Main request handler
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

// Start server
http.createServer(onRequest).listen(port, () => {
    console.log(`Listening on 127.0.0.1:${port}`);
});
