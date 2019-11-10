import { Directive, OnInit, OnChanges, Input, SimpleChanges } from '@angular/core';
import { Location } from '../models/location.model';
import { GoogleMapsAPIWrapper } from '@agm/core';

declare var google: any;

@Directive({
	selector: '[appMapDirections]'
})
export class MapDirectionsDirective implements OnInit, OnChanges {
    @Input() origin: Location;
    @Input() waypoints?: Location[];
	@Input() destination: Location;
    @Input() showDirection: boolean;
    @Input() optimizeWaypoints: boolean;

	private directionsRenderer: any;

	constructor(private mapsApi: GoogleMapsAPIWrapper) { }

	ngOnInit() {
        this.drawDirectionsRoute();
	}

	drawDirectionsRoute() {
      this.mapsApi.getNativeMap().then(map => {
        if (!this.directionsRenderer) {
          // if you already have a marker at the coordinate location on the map, use suppressMarkers option
          // suppressMarkers prevents google maps from automatically adding a marker for you
          this.directionsRenderer = new google.maps.DirectionsRenderer({suppressMarkers: true});
        }
        const directionsRenderer = this.directionsRenderer;
        let points = [];
        for(let point of this.waypoints) {
            points.push({ 
                location: {
                    lat: point.lat, lng: point.lng
                }
            });
        }

        if ( this.showDirection && this.destination ) {
            const directionsService = new google.maps.DirectionsService;
            directionsRenderer.setMap(map);
            console.log(points);
            directionsService.route({
                origin: {lat: this.origin.lat, lng: this.origin.lng},
                waypoints: points,
                destination: {lat: this.destination.lat, lng: this.destination.lng},
                optimizeWaypoints: this.optimizeWaypoints,
                travelMode: 'DRIVING'
            }, (response, status) => {
                console.log(response);
                if (status === 'OK') {
                    directionsRenderer.setDirections(response);
                    // If you'll like to display an info window along the route
                    // middleStep is used to estimate the midpoint on the route where the info window will appear
                    // const middleStep = (response.routes[0].legs[0].steps.length / 2).toFixed();
                    // const infowindow2 = new google.maps.InfoWindow();
                    // infowindow2.setContent(`${response.routes[0].legs[0].distance.text} <br> ${response.routes[0].legs[0].duration.text}  `);
                    // infowindow2.setPosition(response.routes[0].legs[0].steps[middleStep].end_location);
                    // infowindow2.open(map);
                } else {
                    console.log('Directions request failed due to ' + status);
                }
            });
        }

      });
  }

  ngOnChanges(changes: SimpleChanges) {
      if (changes.destination || changes.showDirection) {
          // this checks if the show directions input changed, if so the directions are removed
          // else we redraw the directions
          if (changes.showDirection && !changes.showDirection.currentValue) {
              if (this.directionsRenderer !== undefined) { // check this value is not undefined
                  this.directionsRenderer.setDirections({routes: []});
                  return;
              }
          } else {
              this.drawDirectionsRoute();
          }
      }
  }

}
