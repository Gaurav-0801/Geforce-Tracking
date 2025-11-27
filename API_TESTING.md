# API Testing Guide

## Using curl

### 1. Send a Location Event

\`\`\`bash
curl -X POST http://localhost:3000/api/locations \
  -H "Content-Type: application/json" \
  -d '{
    "vehicleId": "taxi-01",
    "lat": 40.7128,
    "lng": -74.006,
    "timestamp": '$(date +%s)'000'
  }'
\`\`\`

Expected response:
\`\`\`json
{
  "success": true,
  "location": {...},
  "geofenceEvents": [
    {
      "id": "taxi-01-enter-1699564800000",
      "vehicleId": "taxi-01",
      "eventType": "enter",
      "zone": {...},
      "timestamp": 1699564800000
    }
  ],
  "eventsDetected": 1
}
\`\`\`

### 2. Query Vehicle Zone Status

\`\`\`bash
curl http://localhost:3000/api/vehicles/taxi-01/zone
\`\`\`

### 3. List Zones

\`\`\`bash
curl http://localhost:3000/api/zones
\`\`\`

## Using Postman

1. Open Postman
2. Create new collection: "Geofence API"
3. Add three requests as shown in curl examples above

## Test Scenarios

### Scenario 1: Vehicle Enters Zone
\`\`\`bash
# Step 1: Vehicle outside all zones
curl -X POST http://localhost:3000/api/locations \
  -d '{"vehicleId":"test-01","lat":40.75,"lng":-73.98}'

# Step 2: Vehicle moves into Downtown Depot (40.7128, -74.006)
curl -X POST http://localhost:3000/api/locations \
  -d '{"vehicleId":"test-01","lat":40.7128,"lng":-74.006}'

# Expected: geofenceEvents array contains an "enter" event for zone-1
\`\`\`

### Scenario 2: Vehicle Exits Zone
\`\`\`bash
# Step 1: Vehicle inside Downtown Depot
curl -X POST http://localhost:3000/api/locations \
  -d '{"vehicleId":"test-02","lat":40.7128,"lng":-74.006}'

# Step 2: Vehicle moves outside all zones
curl -X POST http://localhost:3000/api/locations \
  -d '{"vehicleId":"test-02","lat":40.75,"lng":-73.98}'

# Expected: geofenceEvents array contains an "exit" event for zone-1
\`\`\`

### Scenario 3: Invalid Coordinates
\`\`\`bash
curl -X POST http://localhost:3000/api/locations \
  -d '{"vehicleId":"bad","lat":91,"lng":-74.006}'

# Expected: 400 error with message about invalid coordinates
\`\`\`

## Load Testing with k6

Create `load-test.js`:

\`\`\`javascript
import http from 'k6/http';
import { check } from 'k6';

export let options = {
  vus: 10,
  duration: '30s',
};

export default function () {
  let payload = JSON.stringify({
    vehicleId: 'vehicle-' + __VU,
    lat: 40.7128 + Math.random() * 0.1,
    lng: -74.006 + Math.random() * 0.1,
  });

  let params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  let res = http.post('http://localhost:3000/api/locations', payload, params);
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 100ms': (r) => r.timings.duration < 100,
  });
}
\`\`\`

Run with:
\`\`\`bash
k6 run load-test.js
