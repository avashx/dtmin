
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const axios = require('axios');
const protobuf = require('protobufjs');
const xml2js = require('xml2js');
const fs = require('fs');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve static files from the 'public' folder
app.use(express.static('public'));

// Set EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'public'));

// Load the GTFS-realtime proto file
const protoFile = 'gtfs-realtime.proto';
const root = protobuf.loadSync(protoFile);
const FeedMessage = root.lookupType('transit_realtime.FeedMessage');

// API endpoint
const url = 'https://otd.delhi.gov.in/api/realtime/VehiclePositions.pb?key=7pnJf5w6MCh0JWrdisnafk0YhnKfUqxx';

let busData = []; // Store the latest bus data
let busStops = []; // Store bus stop data from KML

// Function to parse KML data
const parseKML = (kmlString) => {
    return new Promise((resolve, reject) => {
        xml2js.parseString(kmlString, (err, result) => {
            if (err) return reject(err);

            const placemarks = result.kml.Document[0].Folder[0].Placemark;
            const stops = placemarks.map(placemark => {
                const coords = placemark.Point[0].coordinates[0].split(',').map(Number);
                const data = placemark.ExtendedData[0].SchemaData[0].SimpleData;
                const name = data.find(d => d.$.name === 'BS_NM_STND')?._;
                return {
                    name: name || 'Unknown Stop',
                    longitude: coords[0],
                    latitude: coords[1]
                };
            });
            resolve(stops);
        });
    });
};

// Read the KML file from the 'data' folder
const kmlFilePath = 'data/delhi_bus_stops.kml';
let kmlString;

try {
    kmlString = fs.readFileSync(kmlFilePath, 'utf8');
    
    // Parse KML data once on server start
    parseKML(kmlString).then(stops => {
        busStops = stops;
        console.log(`Parsed ${busStops.length} bus stops from KML`);
    }).catch(err => {
        console.error('Error parsing KML:', err);
        // Set up demo bus stops data as fallback
        busStops = [
            { name: 'Central Station', latitude: 28.6139, longitude: 77.2090 },
            { name: 'Town Hall', latitude: 28.6180, longitude: 77.2150 },
            { name: 'University', latitude: 28.6100, longitude: 77.2030 },
            { name: 'Market Square', latitude: 28.6250, longitude: 77.2080 },
            { name: 'Park South', latitude: 28.6190, longitude: 77.1990 },
        ];
    });
} catch (err) {
    console.error('Error reading KML file:', err);
    // Set up demo bus stops data as fallback
    busStops = [
        { name: 'Central Station', latitude: 28.6139, longitude: 77.2090 },
        { name: 'Town Hall', latitude: 28.6180, longitude: 77.2150 },
        { name: 'University', latitude: 28.6100, longitude: 77.2030 },
        { name: 'Market Square', latitude: 28.6250, longitude: 77.2080 },
        { name: 'Park South', latitude: 28.6190, longitude: 77.1990 },
    ];
}

// Fetch and parse vehicle position data
const fetchBusData = async () => {
    try {
        const response = await axios.get(url, { responseType: 'arraybuffer' });
        const buffer = response.data;
        const message = FeedMessage.decode(new Uint8Array(buffer));
        const data = FeedMessage.toObject(message, {
            longs: String,
            enums: String,
            bytes: String,
        });

        busData = data.entity
            .filter(entity => entity.vehicle && entity.vehicle.position)
            .map(entity => ({
                busNo: entity.vehicle.vehicle.id || 'Unknown',
                routeNo: entity.vehicle.trip?.routeId || 'Unknown',
                latitude: entity.vehicle.position.latitude,
                longitude: entity.vehicle.position.longitude,
            }));

        console.log(`Fetched ${busData.length} buses`);

        // Emit the updated bus data and bus stops to all connected clients
        io.emit('busUpdate', { buses: busData, busStops });
    } catch (error) {
        console.error('Error fetching bus data:', error.message);
        
        // Use demo data if API fails
        const demoBuses = [
            { busNo: '1A', routeNo: '1A', latitude: 28.6150, longitude: 77.2095 },
            { busNo: '2B', routeNo: '2B', latitude: 28.6170, longitude: 77.2140 },
            { busNo: '3C', routeNo: '3C', latitude: 28.6260, longitude: 77.2070 },
        ];
        
        io.emit('busUpdate', { buses: demoBuses, busStops });
    }
};

// Fetch data every 1 second (1000ms)
setInterval(fetchBusData, 1000);

// Serve the webpage
app.get('/', (req, res) => {
    res.render('index', { buses: busData, busStops });
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    fetchBusData(); // Initial fetch when server starts
});
