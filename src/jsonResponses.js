const fs = require('fs');

const dataPath = `${__dirname}/../data/music.json`;
let musicData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

// responds with content based on method type
const respondJSON = (request, response, status, object) => {
    const content = JSON.stringify(object);
    response.writeHead(status, {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(content, 'utf8'),
    });

    if (request.method !== 'HEAD' && status !== 204) {
        response.write(content);
    }

    response.end();
};

// get all track names
const getAllTracks = (request, response) => {
    const trackNames = musicData.map(track => track.name);
    respondJSON(request, response, 200, { tracks: trackNames });
};

// get all tracks w filtering
const getTracks = (request, response, queryParams) => {
    console.log("Received query params:", queryParams); // Debugging line

    let filteredTracks = musicData;

    if (queryParams.name) {
        const nameQuery = queryParams.name.toLowerCase();
        filteredTracks = filteredTracks.filter(track =>
            track.name.toLowerCase().includes(nameQuery)
        );
    }

    if (queryParams.artist) {
        const artistQuery = queryParams.artist.toLowerCase();
        filteredTracks = filteredTracks.filter(track =>
            track.artist.toLowerCase().includes(artistQuery)
        );
    }

    if (queryParams.danceMin) {
        const minDanceability = parseFloat(queryParams.danceMin);
        if (!isNaN(minDanceability)) {
            filteredTracks = filteredTracks.filter(track =>
                parseFloat(track.danceability) >= minDanceability
            );
        }
    }

    // formats the data in a neat, clean way
    const simplifiedTracks = filteredTracks.map(track => ({
        name: track.name,
        artist: track.artist,
        danceability: parseFloat(track.danceability).toFixed(2),
    }));

    respondJSON(request, response, 200, { tracks: simplifiedTracks });
};

// get all artist names
const getAllArtists = (request, response) => {
    const artistNames = musicData.map(track => track.artist);
    respondJSON(request, response, 200, { tracks: artistNames });
};

// get artists w filtering
const getArtists = (request, response, queryParams) => {
    console.log("Received query params:", queryParams); // Debugging line

    const artistData = {};

    musicData.forEach(track => {
        const artist = track.artist;
        const danceability = parseFloat(track.danceability);

        if (!artistData[artist]) {
            artistData[artist] = { songCount: 0, totalDanceability: 0 };
        }

        artistData[artist].songCount += 1;
        artistData[artist].totalDanceability += danceability;
    });

    // needed some help on only displaying certain values, referenced stackoverflow/ chatgpt for help here
    let artistsArray = Object.keys(artistData).map(artist => ({
        name: artist,
        songCount: artistData[artist].songCount,
        avgDanceability: (artistData[artist].totalDanceability / artistData[artist].songCount).toFixed(2),
    }));

    if (queryParams.name) {
        const nameQuery = queryParams.name.toLowerCase();
        artistsArray = artistsArray.filter(artist => artist.name.toLowerCase().includes(nameQuery));
    }

    if (queryParams.songCountMin) {
        const minSongs = parseInt(queryParams.songCountMin, 10);
        if (!isNaN(minSongs)) {
            artistsArray = artistsArray.filter(artist => artist.songCount >= minSongs);
        }
    }

    if (queryParams.danceMin) {
        const minDance = parseFloat(queryParams.danceMin);
        if (!isNaN(minDance)) {
            artistsArray = artistsArray.filter(artist => artist.avgDanceability >= minDance);
        }
    }

    respondJSON(request, response, 200, { artists: artistsArray });
};

// add a new track
const addTrack = (request, response) => {
    console.log("Received Body:", request.body);

    let responseJSON = {
        message: 'Name, artist, and danceability are required.',
    };

    const { name, artist, danceability } = request.body || {};

    // ensures all params are valid
    if (!name || !artist || danceability === undefined) {
        responseJSON.id = 'missingParams';
        return respondJSON(request, response, 400, responseJSON);
    }

    const parsedDanceability = parseFloat(danceability);
    if (isNaN(parsedDanceability)) {
        responseJSON.message = 'Danceability must be a valid number.';
        responseJSON.id = 'invalidDanceability';
        return respondJSON(request, response, 400, responseJSON);
    }

    const trackExists = musicData.some(track =>
        track.name.toLowerCase() === name.toLowerCase() &&
        track.artist.toLowerCase() === artist.toLowerCase()
    );

    // checks for duplicate tracks 
    if (trackExists) {
        responseJSON.message = 'Track already exists.';
        responseJSON.id = 'duplicateTrack';
        return respondJSON(request, response, 409, responseJSON);
    }

    const newTrack = {
        name,
        artist,
        danceability: parsedDanceability,
    };

    // attempts to add new track
    musicData.push(newTrack);

    try {
        fs.writeFileSync(dataPath, JSON.stringify(musicData, null, 2), 'utf8');
        responseJSON.message = 'Track added successfully!';
        return respondJSON(request, response, 201, responseJSON);
    } catch (err) {
        console.error('Error writing to file:', err);
        responseJSON.message = 'Internal server error.';
        return respondJSON(request, response, 500, responseJSON);
    }
};


// make sure favorites exist
if (!musicData.favorites) {
    musicData.favorites = [];
}

// get all favorites
const getFavorites = (request, response) => {
    console.log("Favorites Data:", musicData.favorites); // Debugging
    respondJSON(request, response, 200, { favorites: musicData.favorites });
};

// add favorite track
const addFavorite = (request, response) => {
    const { name } = request.body || {};

    const responseJSON = {
        message: 'Track name is required.',
    };

    if (!name) {
        responseJSON.id = 'missingParams';
        return respondJSON(request, response, 400, responseJSON);
    }

    const trackExists = musicData.some(track => track.name === name);

    if (!trackExists) {
        responseJSON.message = 'Track not found in the dataset.';
        responseJSON.id = 'notFound';
        return respondJSON(request, response, 404, responseJSON);
    }

    // prevent dupes
    if (!musicData.favorites.includes(name)) {
        musicData.favorites.push(name);
        fs.writeFileSync(dataPath, JSON.stringify(musicData, null, 2), 'utf8');
    }

    responseJSON.message = 'Track added to favorites!';
    return respondJSON(request, response, 201, responseJSON);
};

module.exports = {
    getTracks,
    getArtists,
    addTrack,
    getAllTracks,
    getAllArtists,
    getFavorites,
    addFavorite,
};