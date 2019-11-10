import { Component, OnInit } from '@angular/core';
import { SettingsService } from 'src/app/services/settings.service';
import { PopoverController } from '@ionic/angular';
import { ToastService } from '../../services/toast.service';

@Component({
	selector: 'app-popover',
	templateUrl: './popover.component.html',
	styleUrls: ['./popover.component.scss'],
})
export class PopoverComponent implements OnInit {
	
	isSaving: boolean = false;

	constructor(public settingsService: SettingsService, private popoverCtrl: PopoverController, private toastService: ToastService) { }

	ngOnInit() {}

	saveSettings() {
		this.isSaving = true;
		this.settingsService.setSettings(this.settingsService.settings).then(() => {
			this.isSaving = false;
			this.popoverCtrl.dismiss();
		}).catch(error => {
			console.warn(error);
			this.toastService.showNotification("Error", error);
		});
	}

	resetSettings() {
		console.log("Reset settings");
		this.popoverCtrl.dismiss();
	}

}
