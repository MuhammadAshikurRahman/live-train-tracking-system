// Initialize map and related variables
const map = L.map('map').setView([0, 0], 13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);
let userMarker = null;
let railwayData = [];

// Fetch train data
async function fetchTrainData() {
    try {
        const response = await fetch('/getTrain');
        const data = await response.json();
        document.getElementById('trainName').textContent = data.trainName || 'Unknown Train';
    } catch (error) {
        document.getElementById('trainName').textContent = 'Data not available';
    }
}




// Fetch railway lines data
async function fetchRailwayLines() {
    try {
        const bbox = map.getBounds();
        const query = `
            [out:json];
            way["railway"](${bbox.getSouth()},${bbox.getWest()},${bbox.getNorth()},${bbox.getEast()});
            out geom;
        `;
        const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;
        const response = await fetch(url);
        const data = await response.json();
        railwayData = data.elements || [];
    } catch (error) {
        console.error("Error fetching railway lines:", error);
    }
  //  setTimeout(fetchRailwayLines, 5000);
}

// Check proximity to railway
async function checkProximity(position) {
    const { latitude, longitude } = position.coords;
    const userLocation = L.latLng(latitude, longitude);
    let nearRailway = false;

    railwayData.forEach((line) => {
        if (line.type === "way" && line.geometry) {
            const railwayPoints = line.geometry.map((point) => L.latLng(point.lat, point.lon));
            railwayPoints.forEach((railPoint) => {
            const distance = userLocation.distanceTo(railPoint);
            console.log(`Distance to railway point: ${distance} meters`);
            if (distance <= 70000) { // Change based on your requirement
                nearRailway = true;
            }
        });

        }
    });

// ডায়নামিক মেসেজ আপডেট
const statusElement = document.getElementById("status");

    if (nearRailway) {
        statusElement.textContent = "আপনি রেলে আছেন";
        await updateDatabase(true);
    } else {
        statusElement.innerText = "আপনি রেলে নেই";
        await updateDatabase(false);
    }

    setTimeout(checkProximity, 5000); // Continuously check every 5 seconds
}





// Update location
async function updateLocation(position) {
    const { latitude, longitude, speed } = position.coords;
    map.setView([latitude, longitude], 15);
    document.getElementById('location').value = `Lat: ${latitude.toFixed(6)}, Lon: ${longitude.toFixed(6)}`;
    document.getElementById('speedValue').textContent = `${speed ? (speed * 3.6).toFixed(2) : 0} km/h`;

    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
        const data = await response.json();
        const district = data.address.state || 'Unknown District';
        const upazila = data.address.city || data.address.town || 'Unknown Upazila';
        document.getElementById('areaInfo').value = `${district}, ${upazila}`;
    } catch {
        document.getElementById('areaInfo').value = 'Area info not available';
    }

    if (!userMarker) {
        userMarker = L.marker([latitude, longitude]).addTo(map).bindPopup('You are here!').openPopup();
    } else {
        userMarker.setLatLng([latitude, longitude]);
    }

    await checkProximity(position);
    setTimeout(updateLocation, 5000); // Continuously check every 5 seconds
}

// Track location
function trackLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.watchPosition(updateLocation, () => alert('Location services are disabled.'), { enableHighAccuracy: true });
    } else {
        alert('Geolocation is not supported.');
    }
}





// Update database
async function updateDatabase(isNearRailway) {
if (isNearRailway) {
const location = document.getElementById('location').value;
const speed = document.getElementById('speedValue').textContent.replace(' km/h', '');

try {
    await fetch('/updateTrainInfo', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            location: location,
            speed: speed
        })
    });
} catch (error) {
    console.error("Failed to update database:", error);
}
} else {
try {
    // If not near railway, send empty or null values
    await fetch('/updateTrainInfo', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            location: null,
            speed: null
        })
    });
} catch (error) {
    console.error("Failed to update database with null values:", error);
}
}

}
// Update every 5 seconds
setInterval(() => {updateDatabase(isNearRailway);}, 5000); // 5000 ms = 5 seconds



// Chat functionality
document.getElementById('chatButton').addEventListener('click', () => {
    const chatInput = document.getElementById('chatInput');
    chatInput.style.display = chatInput.style.display === 'block' ? 'none' : 'block';
});

document.getElementById('chatInput').querySelector('button').addEventListener('click', async () => {
    const message = document.getElementById('webChat').value.trim();
    if (message) {
        try {
            const response = await fetch('/updateMessage', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message })
            });

            if (response.ok) {
                document.getElementById('webChat').value = '';
            } else {
                console.error('Failed to update message:', response.statusText);
            }
        } catch (error) {
            console.error('Error updating message:', error);
        }
    }
});

// Initialize map and features
window.onload = () => {
    fetchTrainData();
    trackLocation();
    map.on('moveend', fetchRailwayLines);
};
