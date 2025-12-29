module.exports = {
  env: {
    browser: true,
    es2022: true,
  },
  extends: ['airbnb-base'],
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
  rules: {
    // Enforce const for variables that are never reassigned
    'prefer-const': 'error',

    // Disallow var
    'no-var': 'error',

    // Require JSDoc comments for functions
    'require-jsdoc': [
      'warn',
      {
        require: {
          FunctionDeclaration: true,
          MethodDefinition: false,
          ClassDeclaration: false,
        },
      },
    ],

    // Error handling
    'no-throw-literal': 'error',
    'prefer-promise-reject-errors': 'error',

    // Console - allow console.warn and console.error
    'no-console': ['warn', { allow: ['warn', 'error'] }],

    // Allow unused vars starting with underscore
    'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],

    // Complexity
    complexity: ['warn', 15],
    'max-depth': ['warn', 4],
    'max-lines-per-function': ['warn', { max: 100, skipBlankLines: true, skipComments: true }],

    // Import order
    'import/order': [
      'error',
      {
        groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
        'newlines-between': 'always',
        alphabetize: { order: 'asc', caseInsensitive: true },
      },
    ],

    // Allow functions to be used before they are defined (common in this codebase)
    'no-use-before-define': ['error', { functions: false, classes: true, variables: true }],

    // Disable some rules that are too strict for this project
    'no-alert': 'warn',
    'no-restricted-globals': 'off',
    'import/prefer-default-export': 'off',
  },
  globals: {
    L: 'readonly',
    firebase: 'readonly',
    logger: 'readonly',
    // App global variables
    walks: 'writable',
    routeConfig: 'writable',
    TOTAL_ROUTE_DISTANCE: 'writable',
    fullRouteCoordinates: 'writable',
    routeSegments: 'writable',
    isRoutingComplete: 'writable',
    startPoint: 'writable',
    endPoint: 'writable',
    map: 'writable',
    currentMarker: 'writable',
    completedRouteLine: 'writable',
    pendingRouteLine: 'writable',
    // Functions
    calculateDistance: 'readonly',
    geocodeLocation: 'readonly',
    fetchRoute: 'readonly',
    buildCompleteRoute: 'readonly',
    getPositionOnRoute: 'readonly',
    updateStats: 'readonly',
    updateHistory: 'readonly',
    updateRouteVisualization: 'readonly',
    initMap: 'readonly',
    getTotalDistance: 'readonly',
  },
};
