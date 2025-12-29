/**
 * Unit Tests for Distance Calculation Functions
 * Tests Haversine formula and position calculation
 */

// Import the functions (we'll need to export them from app.js)
// For now, we'll copy the function for testing

/**
 * Calculate distance between two GPS coordinates using Haversine formula
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

describe('calculateDistance (Haversine Formula)', () => {
  test('should calculate distance between two points correctly', () => {
    // Kanyakumari to Leh (approximate)
    const distance = calculateDistance(8.0883, 77.5385, 34.1526, 77.5771);
    // Expected distance is approximately 2900-3000 km
    expect(distance).toBeGreaterThan(2800);
    expect(distance).toBeLessThan(3100);
  });

  test('should return 0 for same coordinates', () => {
    const distance = calculateDistance(20.5937, 78.9629, 20.5937, 78.9629);
    expect(distance).toBe(0);
  });

  test('should calculate small distances accurately', () => {
    // 1 degree of latitude is approximately 111 km
    const distance = calculateDistance(0, 0, 1, 0);
    expect(distance).toBeCloseTo(111.19, 1);
  });

  test('should handle negative coordinates', () => {
    // Distance should always be positive
    const distance = calculateDistance(-33.8688, 151.2093, -37.8136, 144.9631);
    expect(distance).toBeGreaterThan(0);
    expect(distance).toBeCloseTo(713.4, 1); // Sydney to Melbourne ~713km
  });

  test('should handle coordinates across international date line', () => {
    // Should work across date line
    const distance = calculateDistance(0, 179, 0, -179);
    expect(distance).toBeGreaterThan(0);
    expect(distance).toBeLessThan(250); // Should be ~222 km
  });

  test('should calculate distance at equator vs poles differently', () => {
    // 1 degree longitude at equator
    const equatorDist = calculateDistance(0, 0, 0, 1);
    // 1 degree longitude near pole
    const poleDist = calculateDistance(89, 0, 89, 1);

    expect(equatorDist).toBeGreaterThan(poleDist);
  });
});

describe('calculateDistance - Edge Cases', () => {
  test('should handle maximum distance (antipodal points)', () => {
    // Opposite sides of Earth
    const distance = calculateDistance(0, 0, 0, 180);
    // Should be approximately half Earth's circumference (~20,000 km)
    expect(distance).toBeGreaterThan(19000);
    expect(distance).toBeLessThan(21000);
  });

  test('should be symmetric (distance A to B = distance B to A)', () => {
    const dist1 = calculateDistance(28.6139, 77.209, 19.076, 72.8777);
    const dist2 = calculateDistance(19.076, 72.8777, 28.6139, 77.209);
    expect(dist1).toEqual(dist2);
  });

  test('should handle decimal precision', () => {
    // Very close points (approximately 1 meter apart)
    const distance = calculateDistance(
      28.6139,
      77.209,
      28.61391,
      77.209,
    );
    expect(distance).toBeCloseTo(0.0011, 4); // ~1.1 meters
  });
});

describe('Distance Calculation - Real World Examples', () => {
  test('Mumbai to Delhi distance', () => {
    // Mumbai: 19.0760° N, 72.8777° E
    // Delhi: 28.6139° N, 77.2090° E
    const distance = calculateDistance(19.076, 72.8777, 28.6139, 77.209);
    expect(distance).toBeGreaterThan(1100);
    expect(distance).toBeLessThan(1200); // Real distance ~1150 km
  });

  test('Chennai to Kolkata distance', () => {
    // Chennai: 13.0827° N, 80.2707° E
    // Kolkata: 22.5726° N, 88.3639° E
    const distance = calculateDistance(13.0827, 80.2707, 22.5726, 88.3639);
    expect(distance).toBeGreaterThan(1300);
    expect(distance).toBeLessThan(1400); // Real distance ~1300 km
  });

  test('Bangalore to Goa distance', () => {
    // Bangalore: 12.9716° N, 77.5946° E
    // Goa: 15.2993° N, 74.1240° E
    const distance = calculateDistance(12.9716, 77.5946, 15.2993, 74.124);
    expect(distance).toBeGreaterThan(400);
    expect(distance).toBeLessThan(500); // Real distance ~450 km
  });
});

