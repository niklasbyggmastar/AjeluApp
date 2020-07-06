import { Component, OnInit } from '@angular/core';
import { SettingsService } from 'src/app/services/settings.service';
import { PopoverController, NavParams } from '@ionic/angular';
import { ToastService } from '../../services/toast.service';
import { CommonService } from '../../services/common.service';

@Component({
	selector: 'app-routeInfo',
	templateUrl: './routeInfo.component.html',
	styleUrls: ['./routeInfo.component.scss'],
})
export class RouteInfoComponent implements OnInit {
	
	isSaving: boolean = false;
	data: any;

	constructor(
		public settingsService: SettingsService,
		private popoverCtrl: PopoverController,
		private toastService: ToastService,
		private commonService: CommonService,
		private navParams: NavParams
	) {
		this.data = this.navParams.data;
	}

	ngOnInit() {
		console.log(this.data);
	}

	close() {
		this.popoverCtrl.dismiss();
	}
}
