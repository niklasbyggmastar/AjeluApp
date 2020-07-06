import { Component, AfterViewInit } from '@angular/core';
import { ToastService } from '../../services/toast.service';
import { Platform } from '@ionic/angular';
import { SettingsService } from '../../services/settings.service';
import { CommonService } from '../../services/common.service';
import { Router } from '@angular/router';

@Component({
	selector: 'app-settings',
	templateUrl: 'settings.page.html',
	styleUrls: ['settings.page.scss']
})
export class SettingsPage implements AfterViewInit {

	settings: any;
	isLoading: boolean = true;
	isSaving: boolean = false;

	constructor(
		private toastService: ToastService,
		private platform: Platform,
		public settingsService: SettingsService,
		private commonService: CommonService,
		private router: Router
	) {}

	ngAfterViewInit() {
		this.platform.ready().then(() => {
			this.settingsService.getSettings().then(res => {
				this.isLoading = false;
			}).catch(error => {
				console.warn(error);
				this.toastService.showNotification("Error", error);
				this.isLoading = false;
			});
		}).catch(error => {
			console.warn(error);
			this.toastService.showNotification("Error", error);
		});
	}

	saveSettings() {
		this.isSaving = true;
		this.settingsService.setSettings(this.settingsService.settings).then(() => {
			this.isSaving = false;
			this.toastService.showNotification("Settings saved successfully", null, "success");
		}).catch(error => {
			console.warn(error);
			this.toastService.showNotification("Error", error);
		});
	}

	setCustomLocation() {
		this.router.navigateByUrl("home");
		this.commonService.setCustomDestination = true;
	}

	resetSettings() {
		console.log("Reset settings");
	}

}
