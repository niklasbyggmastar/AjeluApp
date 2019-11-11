import { Injectable } from '@angular/core';
import { ToastController } from '@ionic/angular';

@Injectable({
	providedIn: 'root'
})
export class ToastService {

	toast: any;

	constructor(private toastCtrl: ToastController) { }

	async showNotification(title: string, msg: any, color?: string) {
		this.toast = await this.toastCtrl.create({
			header: title,
			message: msg && msg.message ? msg.message : msg && !msg.message ? JSON.stringify(msg) : null,
			position: 'top',
			color: color ? color : 'danger',
			showCloseButton: true,
			duration: color == "danger" ? 0 : 3000
		});
		this.toast.present();
	}

}
