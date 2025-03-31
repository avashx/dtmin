
// Initialize the map
const map = L.map('map', {
    center: [28.6139, 77.2090], // Default to Delhi
    zoom: 12
});

// Add OpenStreetMap tiles
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// Ensure map is rendered after DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        map.invalidateSize();
    }, 300);
});

// Custom bus icon
const baseIconSize = [35, 18];
const busIcon = L.icon({
    iconUrl: '/bus-icon.png',
    iconSize: baseIconSize,
    iconAnchor: [baseIconSize[0] / 2, baseIconSize[1] / 2],
    popupAnchor: [0, -baseIconSize[1] / 2]
});

// Custom bus stop icon
const stopIcon = L.icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/3082/3082383.png',
    iconSize: [25, 25],
    iconAnchor: [12.5, 25],
    popupAnchor: [0, -25]
});

// Custom user location icon
const userIcon = L.icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
    iconSize: [38, 38],
    iconAnchor: [19, 38],
    popupAnchor: [0, -38]
});

// Variables
let userMarker = null;
const busMarkers = {};
let allBuses = [];
const busStopMarkers = {};

// Function to calculate distance between coordinates (in kilometers)
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

// Function to find nearest locations
function findNearestLocations(userLat, userLon, buses, stops) {
    const stopsWithDistance = stops.map(stop => ({
        ...stop,
        distance: calculateDistance(userLat, userLon, stop.latitude, stop.longitude)
    })).sort((a, b) => a.distance - b.distance);

    const busesWithDistance = buses.map(bus => ({
        ...bus,
        distance: calculateDistance(userLat, userLon, bus.latitude, bus.longitude)
    })).sort((a, b) => a.distance - b.distance);

    return {
        nearestStop: stopsWithDistance[0],
        nearestBuses: busesWithDistance.slice(0, 4)
    };
}

// Function to update nearest display
function updateNearestDisplay(nearestStop, nearestBuses) {
    const displayElement = document.querySelector('.data');
    if (!displayElement || !nearestStop) return;
    
    let html = `
        <h3>Nearest Stop: ${nearestStop.name}</h3>
        <p>Distance: ${nearestStop.distance.toFixed(2)} km</p>
        <h3>Nearest Buses:</h3>
        <ul style="list-style: none; padding: 0;">
    `;
    
    nearestBuses.forEach(bus => {
        html += `
            <li>
                Bus ${bus.busNo} (Route: ${bus.routeNo})<br>
                Distance: ${bus.distance.toFixed(2)} km
            </li>
        `;
    });
    
    html += '</ul>';
    displayElement.innerHTML = html;
}

// Function to adjust marker sizes based on zoom
function adjustMarkerSize(zoom) {
    const scale = zoom < 12 ? 0.5 : zoom < 14 ? 0.75 : 1;
    const newIconSize = [baseIconSize[0] * scale, baseIconSize[1] * scale];
    const newLabelSize = [30 * scale, 15 * scale];

    Object.values(busMarkers).forEach(({ marker, label }) => {
        marker.setIcon(L.icon({
            iconUrl: '/bus-icon.png',
            iconSize: newIconSize,
            iconAnchor: [newIconSize[0] / 2, newIconSize[1] / 2],
            popupAnchor: [0, -newIconSize[1] / 2]
        }));
        
        if (label && label.getElement) {
            label.setIcon(L.divIcon({
                className: 'bus-label',
                html: label.getElement().innerHTML,
                iconSize: newLabelSize,
                iconAnchor: [newLabelSize[0] / 2, newLabelSize[1] + 5 * scale]
            }));
        }
    });

    const stopScale = zoom < 12 ? 0.5 : zoom < 14 ? 0.75 : 1;
    const newStopSize = [25 * stopScale, 25 * stopScale];
    Object.values(busStopMarkers).forEach(marker => {
        marker.setIcon(L.icon({
            iconUrl: 'https://cdn-icons-png.flaticon.com/512/3082/3082383.png',
            iconSize: newStopSize,
            iconAnchor: [newStopSize[0] / 2, newStopSize[1]],
            popupAnchor: [0, -newStopSize[1]]
        }));
    });
}

// Function to filter buses within bounds
function filterBusesInBounds(buses) {
    const bounds = map.getBounds();
    return buses.filter(bus => bounds.contains([bus.latitude, bus.longitude]));
}

// Function to update bus markers
function updateBusMarkers(buses) {
    allBuses = buses;
    const visibleBuses = filterBusesInBounds(buses);

    Object.keys(busMarkers).forEach(busNo => {
        if (!visibleBuses.find(bus => bus.busNo === busNo)) {
            map.removeLayer(busMarkers[busNo].marker);
            if (busMarkers[busNo].label) {
                map.removeLayer(busMarkers[busNo].label);
            }
            delete busMarkers[busNo];
        }
    });

    visibleBuses.forEach(bus => {
        const { busNo, latitude, longitude, routeNo } = bus;

        if (busMarkers[busNo]) {
            const marker = busMarkers[busNo].marker;
            const label = busMarkers[busNo].label;
            const newLatLng = new L.LatLng(latitude, longitude);

            animateMarker(marker, marker.getLatLng(), newLatLng);
            if (label) {
                label.setLatLng(newLatLng);
            }
            
            if (marker._popup) {
                marker.setPopupContent(`Bus: ${busNo}<br>Route: ${routeNo}<br>Lat: ${latitude}<br>Lon: ${longitude}`);
            }
            
            if (label && label.getElement) {
                label.getElement().innerHTML = routeNo;
            }
        } else {
            const marker = L.marker([latitude, longitude], { icon: busIcon })
                .addTo(map)
                .bindPopup(`Bus: ${busNo}<br>Route: ${routeNo}<br>Lat: ${latitude}<br>Lon: ${longitude}`);

            const label = L.marker([latitude, longitude], {
                icon: L.divIcon({
                    className: 'bus-label',
                    html: routeNo,
                    iconSize: [30, 15],
                    iconAnchor: [15, 20]
                })
            }).addTo(map);

            busMarkers[busNo] = { marker, label };
        }
    });

    adjustMarkerSize(map.getZoom());
}

// Function to update bus stop markers
function updateBusStopMarkers(stops) {
    const bounds = map.getBounds();

    stops.forEach(stop => {
        const { name, latitude, longitude } = stop;
        const key = `${latitude},${longitude}`;

        if (bounds.contains([latitude, longitude]) && !busStopMarkers[key]) {
            const marker = L.marker([latitude, longitude], { icon: stopIcon })
                .addTo(map)
                .bindPopup(`Stop: ${name}<br>Lat: ${latitude}<br>Lon: ${longitude}`);
            busStopMarkers[key] = marker;
        }
    });

    Object.keys(busStopMarkers).forEach(key => {
        const [lat, lng] = key.split(',').map(Number);
        if (!bounds.contains([lat, lng])) {
            map.removeLayer(busStopMarkers[key]);
            delete busStopMarkers[key];
        }
    });

    adjustMarkerSize(map.getZoom());
}

// Function to animate marker movement
function animateMarker(marker, startLatLng, endLatLng) {
    let startTime = null;
    const duration = 1000;

    function animate(timestamp) {
        if (!startTime) startTime = timestamp;
        const progress = (timestamp - startTime) / duration;
        if (progress < 1) {
            const lat = startLatLng.lat + (endLatLng.lat - startLatLng.lat) * progress;
            const lng = startLatLng.lng + (endLatLng.lng - startLatLng.lng) * progress;
            marker.setLatLng([lat, lng]);
            
            if (marker._popup && marker._popup._content) {
                const busId = marker._popup._content.split('<br>')[0].replace('Bus: ', '');
                const label = busMarkers[busId] && busMarkers[busId].label;
                if (label) {
                    label.setLatLng([lat, lng]);
                }
            }
            
            requestAnimationFrame(animate);
        } else {
            marker.setLatLng(endLatLng);
        }
    }
    requestAnimationFrame(animate);
}

// Function to toggle fullscreen
function toggleFullscreen() {
    const mapContainer = document.querySelector('.map-container');
    if (!document.fullscreenElement) {
        if (mapContainer.requestFullscreen) {
            mapContainer.classList.add('fullscreen');
            mapContainer.requestFullscreen().then(() => {
                map.invalidateSize();
            }).catch(err => {
                console.error('Fullscreen request failed:', err);
            });
        }
    } else {
        if (document.exitFullscreen) {
            mapContainer.classList.remove('fullscreen');
            document.exitFullscreen().then(() => {
                map.invalidateSize();
            }).catch(err => {
                console.error('Exit fullscreen failed:', err);
            });
        }
    }
}

// Custom control for exit zoom
const ExitZoomControl = L.Control.extend({
    options: { position: 'topright' },
    onAdd: function(map) {
        const container = L.DomUtil.create('div', 'leaflet-control-exit-zoom');
        container.innerHTML = 'X';
        container.onclick = () => {
            map.setZoom(12);
        };
        return container;
    }
});
const exitZoomControl = new ExitZoomControl().addTo(map);

// Function to toggle exit zoom button visibility
function toggleExitZoomButton() {
    const zoomLevel = map.getZoom();
    const button = document.querySelector('.leaflet-control-exit-zoom');
    if (button) {
        if (zoomLevel > 12) {
            button.classList.add('visible');
        } else {
            button.classList.remove('visible');
        }
    }
}

// Geolocation handling
if (navigator.geolocation) {
    navigator.geolocation.watchPosition(
        (position) => {
            const { latitude, longitude } = position.coords;
            map.setView([latitude, longitude], 15);
            map.invalidateSize();

            if (userMarker) {
                userMarker.setLatLng([latitude, longitude]);
            } else {
                userMarker = L.marker([latitude, longitude], { icon: userIcon })
                    .addTo(map)
                    .bindPopup('You are here');
            }

            if (allBuses.length > 0 && allStops && allStops.length > 0) {
                const nearest = findNearestLocations(latitude, longitude, allBuses, allStops);
                updateNearestDisplay(nearest.nearestStop, nearest.nearestBuses);
            }
        },
        (error) => {
            console.error('Geolocation error:', error);
        },
        {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
        }
    );
}

// Socket.IO connection and data
let allStops = [];
const socket = io();

socket.on('connect', () => {
    console.log('Connected to server');
});

socket.on('busUpdate', (data) => {
    console.log('Received update:', data);
    allStops = data.busStops;
    updateBusMarkers(data.buses);
    updateBusStopMarkers(data.busStops);
    
    if (userMarker) {
        const userLatLng = userMarker.getLatLng();
        const nearest = findNearestLocations(userLatLng.lat, userLatLng.lng, data.buses, data.busStops);
        updateNearestDisplay(nearest.nearestStop, nearest.nearestBuses);
    }
});

socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error);
    
    // Show error message
    const displayElement = document.querySelector('.data');
    if (displayElement) {
        displayElement.innerHTML = `
            <h3>Connection Error</h3>
            <p>Could not connect to the server. Using demo data.</p>
        `;
    }
    
    // Load demo data
    const demoStops = [
        { id: 1, name: 'Central Station', latitude: 28.6139, longitude: 77.2090, buses: ['1A', '2B', '3C'] },
        { id: 2, name: 'Town Hall', latitude: 28.6180, longitude: 77.2150, buses: ['2B', '4D', '6F'] },
        { id: 3, name: 'University', latitude: 28.6100, longitude: 77.2030, buses: ['1A', '5E', '7G'] },
    ];
    
    const demoBuses = [
        { busNo: '1A', routeNo: '1A', latitude: 28.6150, longitude: 77.2095 },
        { busNo: '2B', routeNo: '2B', latitude: 28.6170, longitude: 77.2140 },
        { busNo: '3C', routeNo: '3C', latitude: 28.6260, longitude: 77.2070 },
    ];
    
    allStops = demoStops;
    updateBusMarkers(demoBuses);
    updateBusStopMarkers(demoStops);
});

// Map events
map.on('moveend', () => {
    updateBusMarkers(allBuses);
    updateBusStopMarkers(allStops);
});

map.on('zoomend', () => {
    toggleExitZoomButton();
    adjustMarkerSize(map.getZoom());
});

// Initial setup
toggleExitZoomButton();
