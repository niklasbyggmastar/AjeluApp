import { Component, AfterViewInit } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from "../../../environments/environment";
import { Location } from "../../models/location.model";
import { RouteInfo } from '../../models/route.model';
import { Geolocation } from '@ionic-native/geolocation/ngx';
import { Platform } from '@ionic/angular';
import { SettingsService } from '../../services/settings.service';
import { ToastService } from '../../services/toast.service';
import { CommonService } from '../../services/common.service';
import { Router } from '@angular/router';

@Component({
	selector: 'app-main',
	templateUrl: 'main.page.html',
	styleUrls: ['main.page.scss']
})
export class MainPage implements AfterViewInit {

	settingsLoading: boolean = true;
	generateLoading: boolean = false;
	goLoading: boolean = false;
	routeCreated: boolean = false;
	currentLocation: Location;
	waypoints: Location[] = [];
	formattedWaypoints: string = "";
	destination: Location;
	routeInfo: RouteInfo = {
		duration: { text: null, value: 0 },
		distance: { text: null, value: 0 }
	};
	indexOfLastWaypoint: number = 0;
	routeInfoInit: boolean = false;
	httpParams: HttpParams;

	constructor(
		private http: HttpClient,
		private geolocation: Geolocation,
		public settingsService: SettingsService,
		private platform: Platform,
		private toastService: ToastService,
		public commonService: CommonService,
		private router: Router
	) { }

	ngAfterViewInit() {
		this.platform.ready().then(() => {
			// Get settings + location right away
			this.settingsService.getSettings().then(() => {
				this.settingsLoading = false;
			}).catch(error => {
				console.warn(error);
				this.toastService.showNotification("Error", error);
			});
			this.getCurrentLocation();
		}).catch(error => {
			console.warn(error);
			this.toastService.showNotification("Error", error);
		});
	}

	addToFavorites() {
		let data = {
			origin: this.currentLocation,
			waypoints: this.waypoints,
			destination: this.waypoints[this.indexOfLastWaypoint],
			info: this.routeInfo
		}

		this.http.post(environment.apiUrl + "/favorites", data).toPromise().then((res) => {
			console.log(res);
			this.toastService.showNotification("Favorite added successfully", null, "success");
		}).catch(error => {
			console.warn(error);
			this.toastService.showNotification("Error", error);
		});
	}

	placeMarker(event) {
		if (event && event.coords) {
			let newLat = event.coords.lat;
			let newLng = event.coords.lng;
			this.settingsService.settings.destination.coordinates.lat = newLat;
			this.settingsService.settings.destination.coordinates.lng = newLng;
			this.getLocation(this.settingsService.settings.destination.coordinates);
		}
	}

	getLocation(data) {
		this.http.get(environment.apiUrl + "/location", { params: new HttpParams().set("latitude", data.lat.toString()).set("longitude", data.lng.toString()) }).toPromise().then((res) => {
			if (res) {
				this.settingsService.settings.destination.full_address = res['formatted_address'];
			}
		}).catch(error => {
			console.warn(error);
		});
	}
	
	saveDestination() {
		this.settingsService.saveSettings().then(() => {
			this.router.navigateByUrl("settings");
			this.commonService.setCustomDestination = false;
			this.clearRouteValues();
			this.routeCreated = false;
			this.toastService.showNotification("Settings saved successfully", null, "success");
		}).catch(error => {
			console.warn(error);
			this.toastService.showNotification("Error", error);
		});
	}

	start() {
		let destination = null;
		if (this.settingsService.settings.destination.useCurrentLocation == true) {
			destination = this.currentLocation;
		} else if (this.settingsService.settings.destination.useCurrentLocation == false) {
			destination = this.settingsService.settings.destination.coordinates;
		}
		window.open(`https://www.google.com/maps/dir/?api=1
		&origin=${ this.currentLocation.lat}, ${ this.currentLocation.lng }
		&waypoints=${ this.formattedWaypoints }
		&destination=${ destination.lat}, ${ destination.lng } 
		`, "_system");
	}

	generate() {
		this.platform.ready().then((res) => {
			this.generateLoading = true;
			if (this.settingsService.settings.destination.useCurrentLocation == true) {
				this.destination = this.currentLocation;
			 } else {
				this.destination = this.settingsService.settings.destination.coordinates;
			 } 
			if (!this.currentLocation) {
				this.getCurrentLocation(() => {
					this.requestDrive();
				});
			} else {
				this.requestDrive();
			}
		}).catch(error => {
			console.warn(error);
			this.toastService.showNotification("Error", error);
		});
	}

	requestDrive() {
		this.waypoints = [];
		this.clearRouteValues();
		this.setHttpParams();
		this.http.get(environment.apiUrl + "/drive", { params: this.httpParams }).toPromise().then((res) => {
			if (res && res[0]) {
				if (this.settingsService.settings.destination.useCurrentLocation == true) res[0].legs.pop();
				this.buildWaypointsInfo(res[0].legs);
				this.buildRouteInfo(res[0]);
				this.indexOfLastWaypoint = this.waypoints.length - 1;
				this.generateLoading = false;
				this.routeCreated = true;
				this.formatWaypoints();
			}
		}).catch((error) => {
			console.warn(error);
			this.toastService.showNotification("Error", error);
			if (error.status == 404 && error.statusText == "Not Found") {
				// Something went wrong trying to search for
				console.warn("Not found")
			}
			this.generateLoading = false;
		});
	}

	formatWaypoints() {
		this.formattedWaypoints = "";
		for (let point of this.waypoints) {
			this.formattedWaypoints += point.lat + ", " + point.lng + "|"
		}
	}

	buildWaypointsInfo(legs) {
		for (let leg of legs) {
			this.waypoints.push(
				{
					lat: leg.end_location.lat,
					lng: leg.end_location.lng
				}
			);
		}
	}

	buildRouteInfo(res) {
		// Drive route info
		this.routeInfo.distance.value = res.totalDistance;
		this.routeInfo.duration.value = res.totalDuration;
		this.routeInfo.distance.text = (this.routeInfo.distance.value).toFixed(0).toString() + " km";
		this.routeInfo.duration.text = this.convertToHoursAndMin();
	}

	async getCurrentLocation(callback?) {
		if (!this.platform.is("android")) {
			navigator.geolocation.getCurrentPosition((position) => {
				this.currentLocation = {
					lat: position.coords.latitude,
					lng: position.coords.longitude
				};
				if (callback) {
					callback();
				}
			});
		}
		else if (this.platform.is("android")) {
			this.geolocation.getCurrentPosition({ timeout: 30000, enableHighAccuracy: true }).then((res) => {
				this.currentLocation = {
					lat: res.coords.latitude,
					lng: res.coords.longitude
				}
				if (callback) {
					callback();
				}
			}).catch((error) => {
				console.warn('Error getting location', error);
				this.toastService.showNotification("Error", error);
			});
		}
	}

	convertToHoursAndMin(): string {
		let hours = this.routeInfo.duration.value;
		let rhours = Math.floor(hours);
		let minutes = (hours - rhours) * 60;
		let rminutes = Math.round(minutes);
		return rhours + " h " + rminutes + " min";
	}

	clearRouteValues() {
		this.routeInfo.duration.value = 0;
		this.routeInfo.distance.value = 0;
	}

	async setHttpParams() {
		if (!this.settingsService.settings) {
			await this.settingsService.getSettings().catch(error => {
				console.warn(error);
				this.toastService.showNotification("Error", error);
			});
		}
		if (this.settingsService.settings.destination.useCurrentLocation == true) {
			this.httpParams = new HttpParams().set("latitude", this.currentLocation.lat.toString()).set("longitude", this.currentLocation.lng.toString());
		} else if (this.settingsService.settings.destination.useCurrentLocation == false) {
			this.httpParams = new HttpParams()
				.set("latitude", this.currentLocation.lat.toString())
				.set("longitude", this.currentLocation.lng.toString())
				.set("destination_lat", this.settingsService.settings.destination.coordinates.lat.toString())
				.set("destination_lng", this.settingsService.settings.destination.coordinates.lng.toString());
		}
	}
}
