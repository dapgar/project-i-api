const fs = require('fs');

// Load JSON data
const musicData = JSON.parse(fs.readFileSync(`${__dirname}/../data/music.json`, 'utf8'));

// Function to respond with JSON
const respondJSON = (request, response, status, object) => {
    const content = JSON.stringify(object);
    response.writeHead(status, { 'Content-Type': 'application/json' });
    response.write(content);
    response.end();
};

// Get all music tracks
const getTracks = (request, response) => {
    respondJSON(request, response, 200, { tracks: musicData });
};

// Get track by ID
const getTrackById = (request, response, queryParams) => {
    if (!queryParams.id) {
        return respondJSON(request, response, 400, { message: 'Missing track ID' });
    }

    const track = musicData.find((t) => t.spotify_id === queryParams.id);
    if (!track) {
        return respondJSON(request, response, 404, { message: 'Track not found' });
    }

    respondJSON(request, response, 200, { track });
};

module.exports = {
    getTracks,
    getTrackById,
};
