/**
 * Virtual Walking Journey Tracker - Main Application
 * Corp QA Compliant Code with JSDoc Documentation
 */

// ============================================
// APP STATE
// ============================================

/** @type {Array<{date: string, distance: number}>} Array of walk entries */
let walks = JSON.parse(localStorage.getItem('walks')) || [];

/** @type {Object|null} Route configuration with start and end points */
let routeConfig = JSON.parse(localStorage.getItem('routeConfig')) || null;

/** @type {number} Total distance of the route in kilometers */
let TOTAL_ROUTE_DISTANCE = 0;

// ============================================
// ROUTE DATA
// ============================================

/** @type {Array<Array<number>>} Full route coordinates [[lat, lng], ...] */
let fullRouteCoordinates = [];

/** @type {Array<Object>} Route segments with start/end/distance */
const routeSegments = [];

/** @type {boolean} Whether route calculation is complete */
let isRoutingComplete = false;

/** @type {Object|null} Start point with lat, lng, name */
let startPoint = null;

/** @type {Object|null} End point with lat, lng, name */
let endPoint = null;

// ============================================
// MAP ELEMENTS
// ============================================

/** @type {L.Map|null} Leaflet map instance */
let map;

/** @type {L.Marker|null} Current position marker */
let currentMarker;

/** @type {L.Polyline|null} Completed route line (green) */
let completedRouteLine;

/** @type {L.Polyline|null} Pending route line (blue) */
let pendingRouteLine;

/** @type {L.Polyline|null} Highlighted route segment for a specific period */
let periodHighlight = null;

/** @type {Array<L.Marker>} Array of checkpoint markers for date range visualization */
let checkpointMarkers = [];

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Calculates distance between two GPS coordinates using Haversine formula
 * @param {number} lat1 - Latitude of first point (decimal degrees)
 * @param {number} lon1 - Longitude of first point (decimal degrees)
 * @param {number} lat2 - Latitude of second point (decimal degrees)
 * @param {number} lon2 - Longitude of second point (decimal degrees)
 * @returns {number} Distance in kilometers
 *
 * @example
 * const distance = calculateDistance(8.0883, 77.5385, 34.1526, 77.5771);
 * // Returns distance from Kanyakumari to Leh in km
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
    + Math.cos((lat1 * Math.PI) / 180)
      * Math.cos((lat2 * Math.PI) / 180)
      * Math.sin(dLon / 2)
      * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Geocodes a location string to GPS coordinates using Nominatim (OpenStreetMap)
 * @async
 * @param {string} locationString - Location name to geocode (e.g., "Kanyakumari, India")
 * @returns {Promise<Object|null>} Object with lat, lng, name properties or null if not found
 *
 * @example
 * const location = await geocodeLocation("Delhi, India");
 * // Returns: { lat: 28.6139, lng: 77.2090, name: "Delhi, India" }
 */
async function geocodeLocation(locationString) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationString)}&limit=1`;

  try {
    logger.debug('Geocoding location', { location: locationString });
    const response = await fetch(url);
    const data = await response.json();

    if (data && data.length > 0) {
      const result = {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
        name: data[0].display_name,
      };
      logger.info('Location geocoded successfully', {
        location: locationString,
        coordinates: result,
      });
      return result;
    }
    logger.warn('Location not found', { location: locationString });
  } catch (error) {
    logger.error('Error geocoding location', { location: locationString, error: error.message });
  }

  return null;
}

/**
 * Fetches driving route from OSRM (Open Source Routing Machine)
 * @async
 * @param {Object} start - Start point with lat, lng properties
 * @param {Object} end - End point with lat, lng properties
 * @returns {Promise<Object|null>} Route object with coordinates array and distance, or null on error
 *
 * @example
 * const route = await fetchRoute(
 *   { lat: 8.0883, lng: 77.5385 },
 *   { lat: 34.1526, lng: 77.5771 }
 * );
 * // Returns: { coordinates: [[lat,lng],...], distance: 3500 }
 */
async function fetchRoute(start, end) {
  const url = `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson&steps=true`;

  try {
    logger.debug('Fetching route from OSRM', { start, end });
    const response = await fetch(url);
    const data = await response.json();

    if (data.routes && data.routes.length > 0) {
      const coords = data.routes[0].geometry.coordinates;
      const distance = data.routes[0].distance / 1000; // Convert to km

      // Convert from [lng, lat] to [lat, lng] for Leaflet
      const leafletCoords = coords.map((coord) => [coord[1], coord[0]]);

      logger.info('Route fetched successfully', {
        points: leafletCoords.length,
        distance: `${distance.toFixed(2)} km`,
      });

      return {
        coordinates: leafletCoords,
        distance,
      };
    }
    logger.warn('No routes found', { start, end });
  } catch (error) {
    logger.error('Error fetching route', { start, end, error: error.message });
  }

  return null;
}

/**
 * Builds complete route along actual roads using OSRM
 * @async
 * @param {Object} start - Start point with lat, lng, name
 * @param {Object} end - End point with lat, lng, name
 * @returns {Promise<void>}
 */
async function buildCompleteRoute(start, end) {
  logger.info('Building route along actual roads', { start: start.name, end: end.name });

  const loadingMessage = document.createElement('div');
  loadingMessage.id = 'loading-message';
  loadingMessage.innerHTML = '🗺️ Calculating route along real roads... Please wait...';
  loadingMessage.style.cssText = 'position: fixed; top: 20px; left: 50%; transform: translateX(-50%); background: #667eea; color: white; padding: 15px 30px; border-radius: 10px; box-shadow: 0 4px 12px rgba(0,0,0,0.3); z-index: 10000; font-weight: bold;';
  document.body.appendChild(loadingMessage);

  fullRouteCoordinates = [];
  TOTAL_ROUTE_DISTANCE = 0;

  const route = await fetchRoute(start, end);

  if (route) {
    fullRouteCoordinates = route.coordinates;
    TOTAL_ROUTE_DISTANCE = route.distance;
    isRoutingComplete = true;

    document.body.removeChild(loadingMessage);

    logger.info('Route complete', {
      totalDistance: `${TOTAL_ROUTE_DISTANCE.toFixed(0)} km`,
      totalCoordinates: fullRouteCoordinates.length,
    });

    // Update display
    document.getElementById('remainingDistance').textContent = TOTAL_ROUTE_DISTANCE.toFixed(0);
    updateStats();
    updateRouteVisualization();
  } else {
    document.body.removeChild(loadingMessage);
    logger.error('Unable to calculate route', { start: start.name, end: end.name });
    alert('Unable to calculate route. Please try different locations.');
  }
}

/**
 * Calculates GPS position on actual road route based on distance covered
 * Uses linear interpolation between route coordinates
 * @param {number} distanceCovered - Total distance covered in kilometers
 * @returns {Object} Position object with lat, lng, name properties
 *
 * @example
 * const position = getPositionOnRoute(450);
 * // Returns: { lat: 20.5937, lng: 78.9629, name: "45% towards destination" }
 */
function getPositionOnRoute(distanceCovered) {
  if (!isRoutingComplete || fullRouteCoordinates.length === 0) {
    return { lat: startPoint.lat, lng: startPoint.lng, name: startPoint.name };
  }

  let remainingDistance = distanceCovered;

  for (let i = 0; i < fullRouteCoordinates.length - 1; i++) {
    const segmentDistance = calculateDistance(
      fullRouteCoordinates[i][0],
      fullRouteCoordinates[i][1],
      fullRouteCoordinates[i + 1][0],
      fullRouteCoordinates[i + 1][1],
    );

    if (remainingDistance <= segmentDistance) {
      const ratio = remainingDistance / segmentDistance;
      const lat = fullRouteCoordinates[i][0]
        + (fullRouteCoordinates[i + 1][0] - fullRouteCoordinates[i][0]) * ratio;
      const lng = fullRouteCoordinates[i][1]
        + (fullRouteCoordinates[i + 1][1] - fullRouteCoordinates[i][1]) * ratio;

      // Calculate progress
      const totalCovered = distanceCovered;
      const percentComplete = (totalCovered / TOTAL_ROUTE_DISTANCE) * 100;

      const locationName = `${percentComplete.toFixed(0)}% towards destination`;

      return { lat, lng, name: locationName };
    }

    remainingDistance -= segmentDistance;
  }

  // If distance covered exceeds route, return end point
  const lastCoord = fullRouteCoordinates[fullRouteCoordinates.length - 1];
  return { lat: lastCoord[0], lng: lastCoord[1], name: endPoint.name };
}

function initMap() {
  if (map) {
    map.remove();
  }

  map = L.map('map').setView([20.5937, 78.9629], 5);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 18,
  }).addTo(map);

  if (startPoint && endPoint) {
    // Add start marker
    const startIcon = L.divIcon({
      className: 'start-marker',
      html: '<div style="background: #22c55e; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>',
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    });

    L.marker([startPoint.lat, startPoint.lng], { icon: startIcon })
      .addTo(map)
      .bindPopup(`<b>🏁 Start: ${routeConfig.startName}</b>`);

    // Add end marker
    const endIcon = L.divIcon({
      className: 'end-marker',
      html: '<div style="background: #3b82f6; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>',
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    });

    L.marker([endPoint.lat, endPoint.lng], { icon: endIcon })
      .addTo(map)
      .bindPopup(`<b>🏔️ Destination: ${routeConfig.endName}</b>`);

    // Build the route
    buildCompleteRoute(startPoint, endPoint);
  }
}

function updateRouteVisualization() {
  if (!isRoutingComplete) return;

  const totalDistance = getTotalDistance();

  // Remove old route lines if they exist
  if (completedRouteLine) {
    map.removeLayer(completedRouteLine);
  }
  if (pendingRouteLine) {
    map.removeLayer(pendingRouteLine);
  }

  // Find the position on route
  let remainingDistance = totalDistance;
  let splitIndex = 0;

  for (let i = 0; i < fullRouteCoordinates.length - 1; i++) {
    const segmentDistance = calculateDistance(
      fullRouteCoordinates[i][0],
      fullRouteCoordinates[i][1],
      fullRouteCoordinates[i + 1][0],
      fullRouteCoordinates[i + 1][1],
    );

    if (remainingDistance <= segmentDistance) {
      splitIndex = i;
      break;
    }

    remainingDistance -= segmentDistance;
  }

  if (totalDistance > 0 && splitIndex > 0) {
    // Draw completed route (green)
    const completedCoordinates = fullRouteCoordinates.slice(0, splitIndex + 1);

    completedRouteLine = L.polyline(completedCoordinates, {
      color: '#22c55e',
      weight: 6,
      opacity: 0.8,
      lineJoin: 'round',
      lineCap: 'round',
    }).addTo(map);

    // Draw pending route (blue)
    const pendingCoordinates = fullRouteCoordinates.slice(splitIndex);

    pendingRouteLine = L.polyline(pendingCoordinates, {
      color: '#3b82f6',
      weight: 6,
      opacity: 0.5,
      dashArray: '10, 10',
      lineJoin: 'round',
      lineCap: 'round',
    }).addTo(map);
  } else {
    // No progress yet, draw entire route in blue
    pendingRouteLine = L.polyline(fullRouteCoordinates, {
      color: '#3b82f6',
      weight: 6,
      opacity: 0.5,
      dashArray: '10, 10',
      lineJoin: 'round',
      lineCap: 'round',
    }).addTo(map);
  }
}

function updateCurrentPosition() {
  const totalDistance = getTotalDistance();

  if (currentMarker) {
    map.removeLayer(currentMarker);
  }

  const position = totalDistance > 0 ? getPositionOnRoute(totalDistance) : startPoint;

  if (!position) return;

  // Create custom icon for current position
  const currentIcon = L.divIcon({
    className: 'current-position-marker',
    html: `<div style="position: relative;">
                <div style="background: #ef4444; width: 24px; height: 24px; border-radius: 50%; border: 4px solid white; box-shadow: 0 2px 12px rgba(0,0,0,0.4); position: relative; z-index: 2;"></div>
                <div style="position: absolute; top: 0; left: 0; background: #ef4444; width: 24px; height: 24px; border-radius: 50%; opacity: 0.3; animation: pulse 2s infinite;"></div>
               </div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });

  currentMarker = L.marker([position.lat, position.lng], { icon: currentIcon })
    .addTo(map)
    .bindPopup(
      `<b>📍 You are here!</b><br>${position.name}<br>Distance covered: ${totalDistance.toFixed(1)} km`,
    )
    .openPopup();

  // Center map on current position
  const zoom = totalDistance > 0 ? 9 : 6;
  map.setView([position.lat, position.lng], zoom);
}

function getTotalDistance() {
  return walks.reduce((sum, walk) => sum + parseFloat(walk.distance), 0);
}

function updateStats() {
  const totalDistance = getTotalDistance();
  const remainingDistance = Math.max(0, TOTAL_ROUTE_DISTANCE - totalDistance);
  const progressPercent = TOTAL_ROUTE_DISTANCE > 0 ? Math.min(100, (totalDistance / TOTAL_ROUTE_DISTANCE) * 100) : 0;
  const position = getPositionOnRoute(totalDistance);

  document.getElementById('totalDistance').textContent = totalDistance.toFixed(1);
  document.getElementById('remainingDistance').textContent = remainingDistance.toFixed(0);
  document.getElementById('progressPercent').textContent = `${progressPercent.toFixed(1)}%`;
  document.getElementById('currentLocation').textContent = position ? position.name : 'Not Started';

  if (routeConfig) {
    document.getElementById('routeInfo').textContent = `${routeConfig.startName} → ${routeConfig.endName}`;
  }

  document.getElementById('progressFill').style.width = `${progressPercent}%`;

  updateCurrentPosition();
  updateNearbyPlaces();
}

function updateHistory() {
  const historyList = document.getElementById('historyList');

  if (walks.length === 0) {
    historyList.innerHTML = '<div class="empty-message">No walks logged yet. Start your journey!</div>';
    return;
  }

  const sortedWalks = [...walks].sort((a, b) => new Date(b.date) - new Date(a.date));

  historyList.innerHTML = sortedWalks
    .map(
      (walk) => `
        <div class="history-item">
            <div class="history-date">${formatDate(walk.date)}</div>
            <div class="history-details">
                <div class="history-distance">🚶 ${walk.distance} km</div>
                ${walk.notes ? `<div class="history-notes">${walk.notes}</div>` : ''}
            </div>
            <button class="history-delete" onclick="deleteWalk('${walk.id}')">Delete</button>
        </div>
    `,
    )
    .join('');
}

function formatDate(dateString) {
  const date = new Date(dateString);
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return date.toLocaleDateString('en-US', options);
}

// Quick route setter
function setQuickRoute(start, end) {
  document.getElementById('startLocation').value = start;
  document.getElementById('endLocation').value = end;
}

// Fetch interesting places near current position
async function fetchNearbyPlaces(lat, lng, radius = 30) {
  // Use Overpass API to get interesting places from OpenStreetMap
  const query = `
        [out:json][timeout:25];
        (
            node["tourism"](around:${radius * 1000},${lat},${lng});
            node["historic"](around:${radius * 1000},${lat},${lng});
            node["amenity"="place_of_worship"](around:${radius * 1000},${lat},${lng});
            node["natural"="peak"](around:${radius * 1000},${lat},${lng});
            node["place"="town"](around:${radius * 1000},${lat},${lng});
            node["place"="city"](around:${radius * 1000},${lat},${lng});
        );
        out body;
    `;

  const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.elements && data.elements.length > 0) {
      // Sort by distance and get unique places
      const places = data.elements
        .filter((el) => el.tags && el.tags.name)
        .map((el) => {
          const dist = calculateDistance(lat, lng, el.lat, el.lon);
          return {
            name: el.tags.name,
            type:
              el.tags.tourism
              || el.tags.historic
              || el.tags.amenity
              || el.tags.natural
              || el.tags.place
              || 'place',
            distance: dist,
            lat: el.lat,
            lon: el.lon,
            description: el.tags.description || el.tags.wikipedia || '',
          };
        })
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 10); // Top 10 closest places

      return places;
    }
  } catch (error) {
    logger.error('Error fetching nearby places', { error: error.message });
  }

  return [];
}

// Display nearby places
async function updateNearbyPlaces() {
  const totalDistance = getTotalDistance();

  if (totalDistance === 0 || !isRoutingComplete) {
    document.getElementById('nearbyPlaces').style.display = 'none';
    return;
  }

  const position = getPositionOnRoute(totalDistance);
  const placesList = document.getElementById('placesList');
  const nearbySection = document.getElementById('nearbyPlaces');

  nearbySection.style.display = 'block';
  placesList.innerHTML = '<div style="text-align: center; color: #999;">🔍 Searching for interesting places...</div>';

  const places = await fetchNearbyPlaces(position.lat, position.lng);

  if (places.length === 0) {
    placesList.innerHTML = '<div style="color: #999; font-style: italic;">No major landmarks found nearby. You might be in a rural or remote area!</div>';
    return;
  }

  // Create icon map
  const iconMap = {
    attraction: '🎭',
    museum: '🏛️',
    monument: '🗿',
    castle: '🏰',
    fort: '⚔️',
    ruins: '🏚️',
    temple: '🛕',
    church: '⛪',
    mosque: '🕌',
    place_of_worship: '🙏',
    peak: '⛰️',
    town: '🏘️',
    city: '🏙️',
    archaeological_site: '🏛️',
    memorial: '🗿',
    place: '📍',
  };

  const html = places
    .map((place) => {
      const icon = iconMap[place.type] || '📍';
      const distKm = place.distance.toFixed(1);
      return `
            <div style="padding: 8px; margin: 5px 0; background: white; border-radius: 8px; border-left: 3px solid #667eea;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div style="flex: 1;">
                        <span style="font-size: 1.2em;">${icon}</span>
                        <strong style="margin-left: 5px;">${place.name}</strong>
                        <span style="color: #999; font-size: 0.85em; margin-left: 8px;">${distKm} km away</span>
                    </div>
                </div>
                ${place.description ? `<div style="color: #666; font-size: 0.85em; margin-top: 5px;">${place.description}</div>` : ''}
            </div>
        `;
    })
    .join('');

  placesList.innerHTML = html;
}

// Setup form submission
document.getElementById('setupForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const startLocationInput = document.getElementById('startLocation').value;
  const endLocationInput = document.getElementById('endLocation').value;

  if (!startLocationInput || !endLocationInput) {
    alert('Please enter both start and end locations!');
    return;
  }

  const loadingMessage = document.createElement('div');
  loadingMessage.id = 'geocode-loading';
  loadingMessage.innerHTML = '🌍 Finding locations...';
  loadingMessage.style.cssText = 'position: fixed; top: 20px; left: 50%; transform: translateX(-50%); background: #667eea; color: white; padding: 15px 30px; border-radius: 10px; box-shadow: 0 4px 12px rgba(0,0,0,0.3); z-index: 10000; font-weight: bold;';
  document.body.appendChild(loadingMessage);

  // Geocode locations
  const start = await geocodeLocation(startLocationInput);
  const end = await geocodeLocation(endLocationInput);

  document.body.removeChild(loadingMessage);

  if (!start || !end) {
    alert('Could not find one or both locations. Please try again with different search terms.');
    return;
  }

  // Save route configuration
  routeConfig = {
    startName: startLocationInput,
    endName: endLocationInput,
    startCoords: start,
    endCoords: end,
  };
  localStorage.setItem('routeConfig', JSON.stringify(routeConfig));

  // Keep existing walks - just recalculate progress on new route
  const totalKm = getTotalDistance();
  const walkCount = walks.length;

  // Update UI
  startPoint = start;
  endPoint = end;

  document.getElementById('setupSection').style.display = 'none';
  document.getElementById('routeSubtitle').textContent = `${startLocationInput} to ${endLocationInput}`;

  initMap();
  updateStats();
  updateHistory();

  if (walkCount > 0) {
    setTimeout(() => {
      alert(
        `✅ Route changed!\n\n📊 Your ${walkCount} walk(s) totaling ${totalKm.toFixed(1)} km have been kept\n🗺️ Progress recalculated on new route`,
      );
    }, 500);
  }
});

// Change route button
document.getElementById('changeRouteBtn').addEventListener('click', () => {
  const totalKm = getTotalDistance();
  const walkCount = walks.length;

  let message = 'Change your virtual route?\n\n';
  if (walkCount > 0) {
    message += `✅ Your ${walkCount} walk(s) totaling ${totalKm.toFixed(1)} km will be KEPT\n`;
    message += '📊 Progress will be recalculated on the new route\n\n';
    message += 'Continue?';
  } else {
    message = 'Set up a new route?';
  }

  if (confirm(message)) {
    document.getElementById('setupSection').style.display = 'block';
    document.getElementById('startLocation').value = '';
    document.getElementById('endLocation').value = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
});

// Walk form submission
document.getElementById('walkForm').addEventListener('submit', function (e) {
  e.preventDefault();

  const distance = document.getElementById('distance').value;
  const date = document.getElementById('date').value;
  const notes = document.getElementById('notes').value;

  const walk = {
    id: Date.now().toString(),
    distance: parseFloat(distance),
    date,
    notes,
    timestamp: new Date().toISOString(),
  };

  walks.push(walk);
  localStorage.setItem('walks', JSON.stringify(walks));

  this.reset();
  document.getElementById('date').valueAsDate = new Date();

  updateRouteVisualization();
  updateStats();
  updateHistory();

  // Sync to cloud if enabled
  if (window.firebaseSync && typeof window.firebaseSync.syncToCloud === 'function') {
    window.firebaseSync.syncToCloud();
  }

  alert('Walk logged successfully! 🎉');
});

// Bulk import functionality
document.getElementById('toggleBulkImport').addEventListener('click', function () {
  const bulkForm = document.getElementById('bulkImportForm');
  if (bulkForm.style.display === 'none') {
    bulkForm.style.display = 'block';
    this.textContent = '❌ Cancel Bulk Import';
  } else {
    bulkForm.style.display = 'none';
    this.textContent = '📊 Bulk Import Walks';
    document.getElementById('bulkImportData').value = '';
  }
});

document.getElementById('cancelImport').addEventListener('click', () => {
  document.getElementById('bulkImportForm').style.display = 'none';
  document.getElementById('toggleBulkImport').textContent = '📊 Bulk Import Walks';
  document.getElementById('bulkImportData').value = '';
});

document.getElementById('importWalks').addEventListener('click', () => {
  const bulkData = document.getElementById('bulkImportData').value.trim();

  if (!bulkData) {
    alert('Please enter some walk data to import!');
    return;
  }

  const lines = bulkData.split('\n');
  let imported = 0;
  const errors = [];

  lines.forEach((line, index) => {
    line = line.trim();
    if (!line) return;

    const parts = line.split(',').map((p) => p.trim());

    if (parts.length < 2) {
      errors.push(`Line ${index + 1}: Invalid format`);
      return;
    }

    const date = parts[0];
    const distance = parseFloat(parts[1]);
    const notes = parts[2] || '';

    if (!date || isNaN(distance)) {
      errors.push(`Line ${index + 1}: Invalid date or distance`);
      return;
    }

    const walk = {
      id: `${Date.now().toString()}_${index}`,
      distance,
      date,
      notes,
      timestamp: new Date(date).toISOString(),
    };

    walks.push(walk);
    imported++;
  });

  if (imported > 0) {
    localStorage.setItem('walks', JSON.stringify(walks));
    updateRouteVisualization();
    updateStats();
    updateHistory();

    document.getElementById('bulkImportForm').style.display = 'none';
    document.getElementById('toggleBulkImport').textContent = '📊 Bulk Import Walks';
    document.getElementById('bulkImportData').value = '';

    let message = `✅ Successfully imported ${imported} walk(s)!`;
    if (errors.length > 0) {
      message += `\n\n⚠️ Errors:\n${errors.join('\n')}`;
    }
    alert(message);
  } else {
    alert(`❌ No walks were imported. Please check your data format.\n\n${errors.join('\n')}`);
  }
});

function deleteWalk(id) {
  if (confirm('Are you sure you want to delete this walk entry?')) {
    walks = walks.filter((walk) => walk.id !== id);
    localStorage.setItem('walks', JSON.stringify(walks));
    updateRouteVisualization();
    updateStats();
    updateHistory();
  }
}

document.getElementById('clearHistory').addEventListener('click', () => {
  if (confirm('Are you sure you want to clear all your walking data? This cannot be undone!')) {
    walks = [];
    localStorage.removeItem('walks');
    updateRouteVisualization();
    updateStats();
    updateHistory();
    alert('All data cleared!');
  }
});

// Export data functionality
document.getElementById('exportData').addEventListener('click', () => {
  const exportData = {
    walks,
    routeConfig,
    exportDate: new Date().toISOString(),
    version: '1.0',
  };

  const dataStr = JSON.stringify(exportData, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `walking-journey-${new Date().toISOString().split('T')[0]}.json`;
  link.click();

  URL.revokeObjectURL(url);

  alert(
    `✅ Data exported!\n\n📊 ${walks.length} walks\n📍 Route: ${routeConfig ? `${routeConfig.startName} → ${routeConfig.endName}` : 'Not set'}\n\n💡 Import this file on another device to sync!`,
  );
});

// Import data functionality
document.getElementById('importData').addEventListener('click', () => {
  document.getElementById('fileInput').click();
});

document.getElementById('fileInput').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (event) {
    try {
      const importedData = JSON.parse(event.target.result);

      // Validate data
      if (!importedData.walks || !Array.isArray(importedData.walks)) {
        alert('❌ Invalid data file format!');
        return;
      }

      const importWalkCount = importedData.walks.length;
      const importRoute = importedData.routeConfig
        ? `${importedData.routeConfig.startName} → ${importedData.routeConfig.endName}`
        : 'No route';

      const message = `Import data?\n\n📊 ${importWalkCount} walks\n📍 Route: ${importRoute}\n\n⚠️ This will REPLACE your current data!`;

      if (confirm(message)) {
        // Import walks
        walks = importedData.walks;
        localStorage.setItem('walks', JSON.stringify(walks));

        // Import route config if exists
        if (importedData.routeConfig) {
          routeConfig = importedData.routeConfig;
          localStorage.setItem('routeConfig', JSON.stringify(routeConfig));

          startPoint = routeConfig.startCoords;
          endPoint = routeConfig.endCoords;

          document.getElementById('routeSubtitle').textContent = `${routeConfig.startName} to ${routeConfig.endName}`;
          document.getElementById('setupSection').style.display = 'none';

          // Reinitialize map with new route
          initMap();
        }

        // Update UI
        updateStats();
        updateHistory();

        alert(
          `✅ Data imported successfully!\n\n📊 ${importWalkCount} walks loaded\n🗺️ ${importRoute}`,
        );
      }
    } catch (error) {
      alert("❌ Error reading file. Make sure it's a valid export file!");
      logger.error('Import error', { error: error.message, stack: error.stack });
    }

    // Reset file input
    e.target.value = '';
  };

  reader.readAsText(file);
});

/**
 * Toggle collapsible sections (history/places)
 * @param {string} section - Section identifier ('history' or 'places')
 */
function toggleSection(section) {
  const contentId = section === 'history' ? 'historyList' : 'placesList';
  const toggleId = section === 'history' ? 'historyToggle' : 'placesToggle';
  
  const content = document.getElementById(contentId);
  const toggle = document.getElementById(toggleId);
  
  if (content.style.display === 'none') {
    content.style.display = section === 'history' ? 'grid' : 'block';
    toggle.textContent = '▼';
    logger.info(`Expanded ${section} section`);
  } else {
    content.style.display = 'none';
    toggle.textContent = '▶';
    logger.info(`Collapsed ${section} section`);
  }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('date').valueAsDate = new Date();

  // Initialize Firebase sync
  if (window.firebaseSync) {
    window.firebaseSync.init();
  }

  // Setup sync button
  const syncButton = document.getElementById('syncButton');
  if (syncButton) {
    syncButton.addEventListener('click', () => {
      if (window.firebaseSync) {
        window.firebaseSync.handleSyncButton();
      } else {
        alert('Cloud sync not available. Check your internet connection.');
      }
    });
  }

  // Setup refresh places button
  const refreshBtn = document.getElementById('refreshPlaces');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      updateNearbyPlaces();
    });
  }

  // Check if route is already configured
  if (routeConfig) {
    startPoint = routeConfig.startCoords;
    endPoint = routeConfig.endCoords;

    document.getElementById('routeSubtitle').textContent = `${routeConfig.startName} to ${routeConfig.endName}`;

    initMap();
    updateStats();
    updateHistory();
  } else {
    // Show setup screen
    document.getElementById('setupSection').style.display = 'block';
  }
});

// ===== DATE RANGE FILTER FUNCTIONALITY =====

let currentDateFilter = 'all';
let customStartDate = null;
let customEndDate = null;

/**
 * Select date range mode (all/last/custom)
 * @param {string} mode - Mode selection ('all', 'last', 'custom')
 */
function selectMode(mode) {
  logger.info('Mode selected', { mode });

  // Update active mode button
  document.querySelectorAll('.mode-btn').forEach((btn) => {
    btn.classList.remove('active');
  });
  
  if (mode === 'all') {
    document.getElementById('modeAllTime').classList.add('active');
  } else if (mode === 'last') {
    document.getElementById('modeLastDays').classList.add('active');
  } else if (mode === 'custom') {
    document.getElementById('modeCustom').classList.add('active');
  }

  // Show/hide appropriate sections
  const sliderSection = document.getElementById('sliderSection');
  const customSection = document.getElementById('customDateRange');

  if (mode === 'all') {
    sliderSection.style.display = 'none';
    customSection.style.display = 'none';
    filterByDateRange('all');
  } else if (mode === 'last') {
    sliderSection.style.display = 'block';
    customSection.style.display = 'none';
    const sliderValue = document.getElementById('daysSlider').value;
    filterByDateRange(parseInt(sliderValue));
  } else if (mode === 'custom') {
    sliderSection.style.display = 'none';
    customSection.style.display = 'flex';
    // Set default dates
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    document.getElementById('endDate').valueAsDate = today;
    document.getElementById('startDate').valueAsDate = thirtyDaysAgo;
  }
}

/**
 * Update slider value display
 * @param {string|number} value - Slider value (days)
 */
function updateSliderValue(value) {
  document.getElementById('sliderValue').textContent = value;
}

/**
 * Apply slider filter when user finishes sliding
 * @param {string|number} value - Slider value (days)
 */
function applySliderFilter(value) {
  const days = parseInt(value);
  logger.info('Applying slider filter', { days });
  filterByDateRange(days);
}

/**
 * Filter walks by date range
 * @param {string|number} range - 'all', or number of days
 * @param {HTMLElement} button - The button that was clicked
 */
function filterByDateRange(range, button) {
  logger.info('Filtering by date range', { range });
  currentDateFilter = range;

  // Update active button
  document.querySelectorAll('.date-range-btn').forEach((btn) => {
    btn.classList.remove('active');
  });
  if (button) {
    button.classList.add('active');
  }

  // Hide custom date range
  document.getElementById('customDateRange').style.display = 'none';

  // Calculate and display period stats
  calculatePeriodStats(range);
  updateMapForPeriod(range);
}

/**
 * Show custom date range picker
 * @param {HTMLElement} button - The button that was clicked
 */
function showCustomDateRange(button) {
  logger.info('Showing custom date range picker');
  
  // Update active button
  document.querySelectorAll('.date-range-btn').forEach((btn) => {
    btn.classList.remove('active');
  });
  if (button) {
    button.classList.add('active');
  }

  const customRange = document.getElementById('customDateRange');
  customRange.style.display = 'flex';

  // Set default dates
  const today = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(today.getDate() - 30);

  document.getElementById('endDate').valueAsDate = today;
  document.getElementById('startDate').valueAsDate = thirtyDaysAgo;
}

/**
 * Apply custom date range
 */
function applyCustomDateRange() {
  const startDate = document.getElementById('startDate').value;
  const endDate = document.getElementById('endDate').value;

  if (!startDate || !endDate) {
    alert('Please select both start and end dates');
    return;
  }

  if (new Date(startDate) > new Date(endDate)) {
    alert('Start date must be before end date');
    return;
  }

  logger.info('Applying custom date range', { startDate, endDate });
  
  customStartDate = new Date(startDate);
  customEndDate = new Date(endDate);
  currentDateFilter = 'custom';

  calculatePeriodStats('custom');
  updateMapForPeriod('custom');
}

/**
 * Calculate statistics for the selected period
 * @param {string|number} range - Date range to calculate
 */
function calculatePeriodStats(range) {
  logger.debug('Calculating period stats', { range });

  let startDate, endDate;
  const today = new Date();
  today.setHours(23, 59, 59, 999);

  if (range === 'all') {
    // All time
    const allDates = walks.map((w) => new Date(w.date));
    startDate = allDates.length > 0 ? new Date(Math.min(...allDates)) : today;
    endDate = today;
  } else if (range === 'custom') {
    startDate = customStartDate;
    endDate = customEndDate;
  } else {
    // Last N days
    startDate = new Date();
    startDate.setDate(today.getDate() - range);
    startDate.setHours(0, 0, 0, 0);
    endDate = today;
  }

  // Filter walks in this period
  const periodWalks = walks.filter((walk) => {
    const walkDate = new Date(walk.date);
    return walkDate >= startDate && walkDate <= endDate;
  });

  // Calculate stats
  const totalDistance = periodWalks.reduce((sum, walk) => sum + walk.distance, 0);
  const walkDays = periodWalks.length;
  const avgPerDay = walkDays > 0 ? totalDistance / walkDays : 0;

  // Display stats
  document.getElementById('periodDistance').textContent = `${totalDistance.toFixed(2)} km`;
  document.getElementById('periodDays').textContent = walkDays;
  document.getElementById('periodAvg').textContent = `${avgPerDay.toFixed(2)} km`;
  document.getElementById('periodStats').style.display = 'flex';

  logger.info('Period stats calculated', {
    totalDistance,
    walkDays,
    avgPerDay,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
  });

  return { periodWalks, totalDistance, walkDays, avgPerDay };
}

/**
 * Clears all checkpoint markers from the map
 */
function clearCheckpointMarkers() {
  checkpointMarkers.forEach((marker) => {
    try {
      if (map && marker) {
        map.removeLayer(marker);
      }
    } catch (error) {
      logger.warn('Error removing checkpoint marker', { error: error.message });
    }
  });
  checkpointMarkers = [];
  logger.debug('Cleared checkpoint markers');
}

/**
 * Finds GPS position at a specific distance along the route
 * @param {number} targetDistance - Distance in km
 * @returns {Object|null} Object with lat, lng properties or null
 */
function findPositionAtDistance(targetDistance) {
  if (!fullRouteCoordinates || fullRouteCoordinates.length === 0) {
    return null;
  }

  let coveredDistance = 0;

  for (let i = 0; i < fullRouteCoordinates.length - 1; i++) {
    const lat1 = fullRouteCoordinates[i][0];
    const lng1 = fullRouteCoordinates[i][1];
    const lat2 = fullRouteCoordinates[i + 1][0];
    const lng2 = fullRouteCoordinates[i + 1][1];

    const segmentDist = calculateDistance(lat1, lng1, lat2, lng2);

    if (coveredDistance + segmentDist >= targetDistance) {
      // Interpolate exact position
      const ratio = (targetDistance - coveredDistance) / segmentDist;
      const lat = lat1 + ratio * (lat2 - lat1);
      const lng = lng1 + ratio * (lng2 - lng1);
      return { lat, lng };
    }

    coveredDistance += segmentDist;
  }

  // If we've reached the end, return the last point
  const lastPoint = fullRouteCoordinates[fullRouteCoordinates.length - 1];
  return { lat: lastPoint[0], lng: lastPoint[1] };
}

/**
 * Adds checkpoint markers for each day in the period
 * @param {Array} periodWalks - Array of walks in the selected period
 * @param {number} distanceBeforePeriod - Distance covered before this period
 */
function addCheckpointMarkers(periodWalks, distanceBeforePeriod) {
  if (!periodWalks || periodWalks.length === 0) {
    return;
  }

  // Group walks by date and calculate cumulative distance
  const dailyCheckpoints = [];
  let cumulativeDistance = distanceBeforePeriod;

  // Sort walks by date
  const sortedWalks = [...periodWalks].sort((a, b) => new Date(a.date) - new Date(b.date));

  // Create checkpoints for each unique day
  const walksByDay = {};
  sortedWalks.forEach((walk) => {
    const dateStr = walk.date;
    if (!walksByDay[dateStr]) {
      walksByDay[dateStr] = { date: dateStr, distance: 0 };
    }
    walksByDay[dateStr].distance += walk.distance;
  });

  // Calculate cumulative position for each day
  Object.values(walksByDay).forEach((day, index) => {
    cumulativeDistance += day.distance;
    dailyCheckpoints.push({
      date: day.date,
      distance: day.distance,
      cumulativeDistance: cumulativeDistance,
      dayNumber: index + 1,
    });
  });

  // Add markers for each checkpoint
  dailyCheckpoints.forEach((checkpoint) => {
    try {
      const position = findPositionAtDistance(checkpoint.cumulativeDistance);

      if (position) {
        const dateObj = new Date(checkpoint.date);
        const formattedDate = dateObj.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        });

        // Create custom marker with day number
        const markerIcon = L.divIcon({
          className: 'checkpoint-marker',
          html: `
            <div class="checkpoint-icon">
              <div class="checkpoint-number">${checkpoint.dayNumber}</div>
              <div class="checkpoint-label">${formattedDate}</div>
              <div class="checkpoint-distance">${checkpoint.distance.toFixed(1)} km</div>
            </div>
          `,
          iconSize: [60, 80],
          iconAnchor: [30, 40],
        });

        const marker = L.marker([position.lat, position.lng], {
          icon: markerIcon,
        }).addTo(map);

        checkpointMarkers.push(marker);

        logger.debug('Added checkpoint marker', {
          day: checkpoint.dayNumber,
          date: checkpoint.date,
          distance: checkpoint.distance,
          position: position,
        });
      } else {
        logger.warn('Could not find position for checkpoint', { checkpoint });
      }
    } catch (error) {
      logger.error('Error adding checkpoint marker', {
        checkpoint,
        error: error.message,
      });
    }
  });

  logger.info('Added checkpoint markers', { count: checkpointMarkers.length });
}

/**
 * Update map to show only the segment covered in the selected period
 * @param {string|number} range - Date range
 */
function updateMapForPeriod(range) {
  try {
    logger.debug('Updating map for period', { range });

    if (!map || !fullRouteCoordinates || fullRouteCoordinates.length === 0) {
      logger.warn('Cannot update map for period - map or route not ready');
      return;
    }

    if (!isRoutingComplete) {
      logger.warn('Cannot update map for period - routing not complete yet');
      return;
    }

    // Ensure base route lines exist before manipulating them
    if (!completedRouteLine && !pendingRouteLine) {
      logger.debug('Base route lines not created yet, creating them now');
      updateRouteVisualization();
    }

    // Calculate period stats to get filtered walks
    const { periodWalks, totalDistance } = calculatePeriodStats(range);

  if (range === 'all') {
    // Remove period highlight and restore normal view
    if (window.periodHighlight) {
      map.removeLayer(window.periodHighlight);
      window.periodHighlight = null;
    }
    
    // Clear checkpoint markers
    clearCheckpointMarkers();
    
    // Restore full route visualization
    updateRouteVisualization();
    updatePosition(totalDistanceCovered);
    
    logger.info('Restored full route view');
    return;
  }

  // Dim the base routes to make period stand out
  if (completedRouteLine) {
    completedRouteLine.setStyle({ opacity: 0.2, weight: 4 });
  }
  if (pendingRouteLine) {
    pendingRouteLine.setStyle({ opacity: 0.2, weight: 4 });
  }

  // Calculate distance covered BEFORE this period
  let distanceBeforePeriod = 0;
  const periodStartDate = range === 'custom' ? customStartDate : new Date(Date.now() - range * 24 * 60 * 60 * 1000);
  
  const walksBeforePeriod = walks.filter((w) => new Date(w.date) < periodStartDate);
  distanceBeforePeriod = walksBeforePeriod.reduce((sum, walk) => sum + walk.distance, 0);

  // Draw a highlighted segment for this period
  const startDistanceForPeriod = distanceBeforePeriod;
  const endDistanceForPeriod = distanceBeforePeriod + totalDistance;

  // Remove existing period highlight and checkpoint markers
  if (window.periodHighlight) {
    map.removeLayer(window.periodHighlight);
  }
  clearCheckpointMarkers();

  // Get route segment for this period
  const periodSegment = getRouteSegment(startDistanceForPeriod, endDistanceForPeriod);

  if (periodSegment.length > 0) {
    // Draw highlighted segment (bright and thick)
    window.periodHighlight = L.polyline(periodSegment, {
      color: '#ff4444',
      weight: 8,
      opacity: 1.0,
      lineJoin: 'round',
      lineCap: 'round',
    }).addTo(map);

    // Add checkpoint markers for each day in the period
    addCheckpointMarkers(periodWalks, distanceBeforePeriod);

    // Fit map to this segment
    map.fitBounds(window.periodHighlight.getBounds(), { padding: [50, 50] });

    logger.info('Period segment highlighted on map', {
      startDistance: startDistanceForPeriod,
      endDistance: endDistanceForPeriod,
      segmentPoints: periodSegment.length,
      checkpointCount: checkpointMarkers.length,
    });
  } else {
    logger.warn('No segment found for this period - might be no walks in range');
  }
  } catch (error) {
    logger.error('Error updating map for period', {
      range,
      error: error.message,
      stack: error.stack,
    });
    // Try to restore normal view on error
    try {
      if (completedRouteLine) {
        completedRouteLine.setStyle({ opacity: 0.8, weight: 6 });
      }
      if (pendingRouteLine) {
        pendingRouteLine.setStyle({ opacity: 0.5, weight: 6 });
      }
    } catch (restoreError) {
      logger.error('Error restoring route visualization', { error: restoreError.message });
    }
  }
}

/**
 * Get route coordinates segment between two distances
 * @param {number} startDist - Start distance in km
 * @param {number} endDist - End distance in km
 * @returns {Array} Array of [lat, lng] coordinates
 */
function getRouteSegment(startDist, endDist) {
  const segment = [];
  let coveredDistance = 0;
  let startFound = false;

  for (let i = 0; i < fullRouteCoordinates.length - 1; i++) {
    const lat1 = fullRouteCoordinates[i][0];
    const lng1 = fullRouteCoordinates[i][1];
    const lat2 = fullRouteCoordinates[i + 1][0];
    const lng2 = fullRouteCoordinates[i + 1][1];

    const segmentDist = calculateDistance(lat1, lng1, lat2, lng2);

    if (coveredDistance + segmentDist >= startDist && !startFound) {
      startFound = true;
      // Calculate exact start point
      const ratio = (startDist - coveredDistance) / segmentDist;
      const startLat = lat1 + ratio * (lat2 - lat1);
      const startLng = lng1 + ratio * (lng2 - lng1);
      segment.push([startLat, startLng]);
    }

    if (startFound) {
      segment.push([lat2, lng2]);
    }

    coveredDistance += segmentDist;

    if (coveredDistance >= endDist) {
      // Calculate exact end point
      const ratio = (endDist - (coveredDistance - segmentDist)) / segmentDist;
      const endLat = lat1 + ratio * (lat2 - lat1);
      const endLng = lng1 + ratio * (lng2 - lng1);
      segment[segment.length - 1] = [endLat, endLng];
      break;
    }
  }

  return segment;
}

