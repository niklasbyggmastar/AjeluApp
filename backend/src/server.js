const apiConfig = require("../ApiConfig.json");
const express = require('express');
const bodyParser = require('body-parser');
const logger = require('morgan');
const methodOverride = require('method-override')
const cors = require('cors');
const app = express();
const fetch = require('node-fetch');
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(methodOverride());
app.use(cors());
app.disable('etag');
const port = 8000;

let localSettings = [];
let localFavorites = [];
// Database
const low = require('lowdb');
const FileAsync = require('lowdb/adapters/FileAsync');
const adapter = new FileAsync('./db.json');

low(adapter).then(db => {
    // Initially get all settings+favorites (Works on localhost but not Heroku)
    localSettings = db.get("settings").value();
    localFavorites = db.get("favorites").value();

    // Request to get all settings
    app.get("/settings", (request, response) => {
        const settings = db.get("settings").value();
        localSettings = settings;
        response.json(settings);
    });

    // Request to update settings (all)
    app.post("/settings", (request, response) => {
        const newSettings = request.body;
        console.log("NEW", newSettings);
        db.get("settings")
            .assign(newSettings)
            .write()
            .then((res) => {
                console.log("RES", res);
                localSettings = res;
                response.json(res);
            })
    });

    // Request to get all favorites
    app.get("/favorites", (request, response) => {
        const favorites = db.get("favorites").value();
        localFavorites = favorites;
        response.json(favorites);
    });

    // Request to update favorites (all)
    app.post("/favorites", (request, response) => {
        const newFavorite = request.body;
        console.log("NEW", newFavorite);
        localFavorites = db.get("favorites").value();
        localFavorites.push(newFavorite);
        db.get("favorites")
            .assign({ localFavorites })
            .write()
            .then((res) => {
                localFavorites = res;
                response.json(res);
            })
    });

    return db.defaults({ settings: {} }).write();
}).then(() => {
    app.listen(process.env.PORT || port, () => {
        console.log("Running on port", port);
    });
})

// -------------------------

const googleMapsClient = require('@google/maps').createClient({
    key: apiConfig.apiKey,
    Promise: Promise
});

let minBoundary = { lat: 60.423985, lng: 22.095139 };
let maxBoundary = { lat: 60.654825, lng: 22.539923 };

// Random waypoints within set boundaries
let waypoints = [];
const initNumOfWaypoints = 4;
let numberOfWaypoints = initNumOfWaypoints;

let currentLocation = {};

// Random route that has some waypoints and ends up in the current location
app.get("/drive", (request, response) => {
    // Current user location
    currentLocation = {
        lat: parseFloat(request.query.latitude),
        lng: parseFloat(request.query.longitude)
    };

    let destination = null;
    if (request.query.destination_lat && request.query.destination_lng) {
        destination = {
            lat: parseFloat(request.query.destination_lat),
            lng: parseFloat(request.query.destination_lng)
        }
    }
    console.log("DESTINATION------------->", destination);

    numberOfWaypoints = initNumOfWaypoints; // Reset after each request
    generateRandomWaypoints(numberOfWaypoints);
    
    let retryFunction = () => {
        console.log("WAYPOINTS", waypoints);
        googleMapsClient.directions({
            origin: currentLocation,
            waypoints: waypoints,
            destination: destination != null ? destination : currentLocation,
            mode: "driving",
            avoid: "ferries"
        }).asPromise().then((res) => {
            console.log("\n\n\n\n\n\n\n\nRES",res.json.routes[0])
            if (res.json.routes && res.json.routes.length > 0) {
                let legs = res.json.routes[0].legs;
                let totalDuration = 0;
                let totalDistance = 0;
                if (legs.length > 0) {
                    for (let leg of legs) {
                        totalDuration += leg.duration.value;
                        totalDistance += leg.distance.value;
                    }
                }
                totalDuration = totalDuration / 3600; // Convert total duration to full hours
                totalDistance = totalDistance / 1000; // Convert total distance to km

                // If route too long for duration and/or distance
                if (totalDuration > localSettings.duration.max || totalDistance > localSettings.distance.max) {
                    console.log("\n\nROUTE IS TOO LONG\n\ndistance:", totalDistance, "\nduration:", totalDuration);
                    // Keep at least one waypoint
                    if (numberOfWaypoints >= 2) {
                        numberOfWaypoints -= 1;
                        generateRandomWaypoints(numberOfWaypoints);
                    }
                    //editRouteLength(totalDuration, totalDistance, "shorten");
                    retryFunction();
                    return;
                }
                // If route too short for duration and/or distance
                else if (totalDuration < localSettings.duration.min || totalDistance < localSettings.distance.min) {
                    console.log("\n\nROUTE IS TOO SHORT\n\ndistance:", totalDistance, "\nduration:", totalDuration);
                    numberOfWaypoints += 1;
                    generateRandomWaypoints(numberOfWaypoints);
                    //editRouteLength(totalDuration, totalDistance, "extend");
                    retryFunction();
                    return;
                }
                res.json.routes[0].totalDistance = totalDistance;
                res.json.routes[0].totalDuration = totalDuration;
                response.json(res.json.routes);
            } else {
                setTimeout(() => {
                    console.log("\n\nNO ROUTE\n\n");
                    //retryFunction();
                    throw new Error("Route not found");
                }, 1000);
            }
        })
        .catch((err) => {
            console.log(err);
            response.status(err.status).send(err.status + " error");
        });
    }
    retryFunction();
});

// Increase or decrease the min / max ranges for coordinates
function editRouteLength(totalDuration, totalDistance, action) {
    console.log(action);
    //let durationDelta = 0;
    let distanceDelta = 0;
    if (action == "shorten") {
      //  durationDelta = Math.abs(totalDuration - localSettings.duration.max);
        distanceDelta = Math.abs(totalDistance - localSettings.distance.max); // delta in km
        console.log("total distance", totalDistance, " local max distance", localSettings.distance.max);
        console.log("delta:", distanceDelta);
        maxBoundary.lat -= maxBoundary.lat/(100 * distanceDelta);
        maxBoundary.lng -= maxBoundary.lng/(100 * distanceDelta);
    } else if (action == "extend") {
        //durationDelta = Math.abs(totalDuration - localSettings.duration.min);
        distanceDelta = Math.abs(totalDistance - localSettings.distance.min); // delta in km
        console.log("total distance", totalDistance, " local min distance", localSettings.distance.min);
        console.log("delta:", distanceDelta);
        minBoundary.lat += minBoundary.lat/(100 * distanceDelta);
        minBoundary.lng += minBoundary.lng/(100 * distanceDelta);
    }
    
    console.log("boundaries (min, max):\n", minBoundary, "\n", maxBoundary);
    generateRandomWaypoints(numberOfWaypoints);
}

function generateRandomWaypoints(number) {
    waypoints = [];
    for (let i = 0; i < number; i++) {
        waypoints.push(
            {
                lat: parseFloat(randomBetween(minBoundary.lat, maxBoundary.lat)),
                lng: parseFloat(randomBetween(minBoundary.lng, maxBoundary.lng))
            }
        )
    }
}

// Directions to one random location
app.get("/directions", (request, response) => {
    // Current user location
    let origin = {
        lat: request.query.latitude,
        lng: request.query.longitude
    };

    // Random destination within set boundaries
    let destination = {
        lat: randomBetween(minBoundary.lat, maxBoundary.lat),
        lng: randomBetween(minBoundary.lng, maxBoundary.lng)
    };
    console.log("DESTINATION", destination);
    
    googleMapsClient.directions({
        origin: origin,
        destination: destination
    }).asPromise().then((res) => {
        response.json(res.json.routes);
    })
    .catch((err) => {
        console.log(err);
        response.status(err.status).send(err.status + " error");
    });
});

// Reverse geolocation: get location data using its coordinates
app.get("/location", (request, response) => {
    googleMapsClient.reverseGeocode({latlng: request.query}).asPromise().then((res) => {
        console.log("RES", res.json.results[0]);
        response.json(res.json.results[0]);
    }).catch(error => {
        console.warn(error);
    })
});


// Generate a random number between range
function randomBetween(min, max) {
    return (Math.random() * (max - min) + min).toFixed(6);
}