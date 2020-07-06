import { Component, AfterViewInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { RouteInfo } from '../../models/route.model';
import { ToastService } from '../../services/toast.service';
import { Platform, PopoverController } from '@ionic/angular';
import { RouteInfoComponent } from '../../components/routeInfo/routeInfo.component';

@Component({
	selector: 'app-favorites',
	templateUrl: 'favorites.page.html',
	styleUrls: ['favorites.page.scss']
})
export class FavoritesPage implements AfterViewInit {

	favorites: Array<RouteInfo> = [];
	isLoading: boolean = true;

	constructor(
		private http: HttpClient,
		private toastService: ToastService,
		private platform: Platform,
		private popoverController: PopoverController
	) {}

	ngAfterViewInit() {
		this.platform.ready().then(() => {
			this.http.get(environment.apiUrl + "/favorites").toPromise().then((res: any) => {
				console.log(res);
				if (res && res.length > 0) {
					this.favorites = res;
					this.isLoading = false;
				}
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

	startNavigation(index) {
		let data = this.favorites[index];
		console.log(data);
	}

	async showInfo(index) {
		const data = this.favorites[index];
		console.log(data);
		const popover = await this.popoverController.create({
			component: RouteInfoComponent,
			event: event,
			translucent: true,
			componentProps: {
				data: data
			}
		});
		return await popover.present();
	}
}
