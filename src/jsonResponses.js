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

const getTracks = (request, response, queryParams) => {
    let filteredTracks = musicData;

    // Filter by name (case-insensitive substring match)
    if (queryParams.name) {
        const nameQuery = queryParams.name.toLowerCase();
        filteredTracks = filteredTracks.filter(track =>
            track.name.toLowerCase().includes(nameQuery)
        );
    }

    // Filter by artist (case-insensitive match)
    if (queryParams.artist) {
        const artistQuery = queryParams.artist.toLowerCase();
        filteredTracks = filteredTracks.filter(track =>
            track.artist.toLowerCase().includes(artistQuery)
        );
    }

    // Filter by minimum danceability
    if (queryParams.danceability_min) {
        const minDanceability = parseFloat(queryParams.danceability_min);
        if (!isNaN(minDanceability)) {
            filteredTracks = filteredTracks.filter(track =>
                parseFloat(track.danceability) >= minDanceability
            );
        }
    }

    // **Trim down response to only return necessary fields**
    const simplifiedTracks = filteredTracks.map(track => ({
        name: track.name,
        artist: track.artist, // Already stored as a string
        danceability: parseFloat(track.danceability) // Convert to number
    }));

    respondJSON(request, response, 200, { tracks: simplifiedTracks });
};

const getArtists = (request, response, queryParams) => {
    // Group tracks by artist
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

    // Convert to array with calculated average danceability
    let artistsArray = Object.keys(artistData).map(artist => ({
        name: artist,
        songCount: artistData[artist].songCount,
        avgDanceability: artistData[artist].totalDanceability / artistData[artist].songCount
    }));

    // Filter by artist name (case-insensitive substring match)
    if (queryParams.name) {
        const nameQuery = queryParams.name.toLowerCase();
        artistsArray = artistsArray.filter(artist => artist.name.toLowerCase().includes(nameQuery));
    }

    // Filter by minimum song count
    if (queryParams.songCountMin) {
        const minSongs = parseInt(queryParams.songCountMin, 10);
        if (!isNaN(minSongs)) {
            artistsArray = artistsArray.filter(artist => artist.songCount >= minSongs);
        }
    }

    // Filter by minimum average danceability
    if (queryParams.danceMin) {
        const minDance = parseFloat(queryParams.danceMin);
        if (!isNaN(minDance)) {
            artistsArray = artistsArray.filter(artist => artist.avgDanceability >= minDance);
        }
    }

    respondJSON(request, response, 200, { artists: artistsArray });
};

module.exports = {
    getTracks,
    getArtists, // Make sure this is exported
};
