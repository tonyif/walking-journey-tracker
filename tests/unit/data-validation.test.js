/**
 * Unit Tests for Data Validation and Formatting
 * Tests input validation, date formatting, and data sanitization
 */

/**
 * Format date to readable string
 */
function formatDate(dateString) {
  const date = new Date(dateString);
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return date.toLocaleDateString('en-US', options);
}

/**
 * Get total distance from walks array
 */
function getTotalDistance(walks) {
  return walks.reduce((sum, walk) => sum + parseFloat(walk.distance), 0);
}

/**
 * Validate walk data
 */
function validateWalkData(distance, date) {
  const errors = [];

  // Validate distance
  if (distance === null || distance === undefined || distance === '') {
    errors.push('Distance is required');
  } else if (isNaN(distance)) {
    errors.push('Distance must be a number');
  } else if (parseFloat(distance) < 0) {
    errors.push('Distance cannot be negative');
  } else if (parseFloat(distance) > 200) {
    errors.push('Distance seems unrealistic (>200 km)');
  }

  // Validate date
  if (!date) {
    errors.push('Date is required');
  } else {
    const walkDate = new Date(date);
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    if (isNaN(walkDate.getTime())) {
      errors.push('Invalid date format');
    } else if (walkDate > today) {
      errors.push('Date cannot be in the future');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

describe('formatDate', () => {
  test('should format date correctly', () => {
    const formatted = formatDate('2024-12-25');
    expect(formatted).toMatch(/Dec.*25.*2024/);
  });

  test('should handle different date formats', () => {
    const formatted = formatDate('2024-01-01');
    expect(formatted).toMatch(/Jan.*1.*2024/);
  });

  test('should handle ISO date strings', () => {
    const formatted = formatDate('2024-12-25T10:30:00.000Z');
    expect(formatted).toMatch(/Dec.*25.*2024/);
  });
});

describe('getTotalDistance', () => {
  test('should calculate total distance correctly', () => {
    const walks = [
      { distance: 5.5 },
      { distance: 6.2 },
      { distance: 4.8 },
    ];
    const total = getTotalDistance(walks);
    expect(total).toBeCloseTo(16.5, 1);
  });

  test('should return 0 for empty array', () => {
    const total = getTotalDistance([]);
    expect(total).toBe(0);
  });

  test('should handle string distances', () => {
    const walks = [
      { distance: '5.5' },
      { distance: '6.2' },
    ];
    const total = getTotalDistance(walks);
    expect(total).toBeCloseTo(11.7, 1);
  });

  test('should handle single walk', () => {
    const walks = [{ distance: 10.5 }];
    const total = getTotalDistance(walks);
    expect(total).toBe(10.5);
  });
});

describe('validateWalkData - Distance Validation', () => {
  test('should accept valid distance', () => {
    const result = validateWalkData(5.5, '2024-12-25');
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('should reject missing distance', () => {
    const result = validateWalkData(null, '2024-12-25');
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Distance is required');
  });

  test('should reject negative distance', () => {
    const result = validateWalkData(-5, '2024-12-25');
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Distance cannot be negative');
  });

  test('should reject non-numeric distance', () => {
    const result = validateWalkData('abc', '2024-12-25');
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Distance must be a number');
  });

  test('should warn about unrealistic distance', () => {
    const result = validateWalkData(250, '2024-12-25');
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Distance seems unrealistic (>200 km)');
  });

  test('should accept zero distance', () => {
    const result = validateWalkData(0, '2024-12-25');
    expect(result.isValid).toBe(true);
  });

  test('should accept decimal distances', () => {
    const result = validateWalkData(5.75, '2024-12-25');
    expect(result.isValid).toBe(true);
  });
});

describe('validateWalkData - Date Validation', () => {
  test('should accept valid past date', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateString = yesterday.toISOString().split('T')[0];

    const result = validateWalkData(5, dateString);
    expect(result.isValid).toBe(true);
  });

  test('should accept today\'s date', () => {
    const today = new Date().toISOString().split('T')[0];
    const result = validateWalkData(5, today);
    expect(result.isValid).toBe(true);
  });

  test('should reject missing date', () => {
    const result = validateWalkData(5, null);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Date is required');
  });

  test('should reject future date', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateString = tomorrow.toISOString().split('T')[0];

    const result = validateWalkData(5, dateString);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Date cannot be in the future');
  });

  test('should reject invalid date format', () => {
    const result = validateWalkData(5, 'invalid-date');
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Invalid date format');
  });
});

describe('validateWalkData - Multiple Errors', () => {
  test('should return multiple errors when both fields invalid', () => {
    const result = validateWalkData(-5, 'invalid-date');
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(1);
  });

  test('should return all validation errors', () => {
    const result = validateWalkData(null, null);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Distance is required');
    expect(result.errors).toContain('Date is required');
  });
});

describe('Data Sanitization', () => {
  test('should handle walks with extra properties', () => {
    const walks = [
      { distance: 5, extraProp: 'value' },
      { distance: 6 },
    ];
    const total = getTotalDistance(walks);
    expect(total).toBe(11);
  });

  test('should handle edge case distances', () => {
    const walks = [
      { distance: 0.1 },
      { distance: 100 },
      { distance: 0.01 },
    ];
    const total = getTotalDistance(walks);
    expect(total).toBeCloseTo(100.11, 2);
  });
});

describe('Bulk Import Validation', () => {
  test('should validate bulk import line format', () => {
    const line = '2024-12-25, 5.5, Evening walk';
    const parts = line.split(',').map((p) => p.trim());

    expect(parts).toHaveLength(3);
    expect(parts[0]).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(parseFloat(parts[1])).toBeCloseTo(5.5, 1);
  });

  test('should handle line with missing notes', () => {
    const line = '2024-12-25, 5.5';
    const parts = line.split(',').map((p) => p.trim());

    expect(parts).toHaveLength(2);
    expect(parts[0]).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  test('should detect invalid bulk import format', () => {
    const line = 'invalid line';
    const parts = line.split(',').map((p) => p.trim());

    expect(parts.length).toBeLessThan(2);
  });
});

