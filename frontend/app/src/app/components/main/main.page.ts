import { Component, AfterViewInit } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from "../../../environments/environment";
import { Location } from "../../models/location.model";
import { RouteInfo } from '../../models/route.model';
import { Geolocation } from '@ionic-native/geolocation/ngx';
import { PopoverController, Platform } from '@ionic/angular';
import { PopoverComponent } from '../popover/popover.component';
import { SettingsService } from '../../services/settings.service';
import { ToastService } from '../../services/toast.service';

@Component({
	selector: 'app-main',
	templateUrl: 'main.page.html',
	styleUrls: ['main.page.scss']
})
export class MainPage implements AfterViewInit {

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
		private popoverController: PopoverController,
		private settingsService: SettingsService,
		private platform: Platform,
		private toastService: ToastService
	) { }

	ngAfterViewInit() {
		this.platform.ready().then((res) => {
			// Get settings + location right away
			this.settingsService.getSettings();
			this.getCurrentLocation();
		}).catch(error => {
			console.warn(error);
			this.toastService.showNotification("Error", error);
		});
	}

	start() {
		console.log(this.formattedWaypoints);
		window.open(`https://www.google.com/maps/dir/?api=1
		&origin=${ this.currentLocation.lat}, ${this.currentLocation.lng}
		&waypoints=${ this.formattedWaypoints}
		&destination=${ this.waypoints[this.indexOfLastWaypoint].lat}, ${this.waypoints[this.indexOfLastWaypoint].lng}
		`, "_system");
	}

	generate() {
		this.platform.ready().then((res) => {
			this.generateLoading = true;
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
		for (let point of this.waypoints) {
			this.formattedWaypoints += point.lat + ", " + point.lng + "%7C"
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
		this.routeInfo.distance.text = (this.routeInfo.distance.value).toFixed(2).toString() + " km";
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

	setHttpParams() {
		this.httpParams = new HttpParams().set("latitude", this.currentLocation.lat.toString()).set("longitude", this.currentLocation.lng.toString());
	}

	async openSettings(event) {
		const popover = await this.popoverController.create({
			component: PopoverComponent,
			event: event,
			translucent: true
		});
		return await popover.present();
	}
}
