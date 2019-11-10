import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { MainPage } from './main.page';
import { AgmCoreModule } from '@agm/core';
import { environment } from "../../../environments/environment";
import { MapDirectionsDirective } from '../../directives/map-directions.directive';
import { PopoverComponent } from '../popover/popover.component';
import { SettingsService } from '../../services/settings.service';
import { ToastService } from '../../services/toast.service';

@NgModule({
	imports: [
		IonicModule,
		CommonModule,
		FormsModule,
		HttpClientModule,
		RouterModule.forChild([{ path: '', component: MainPage }]),
		AgmCoreModule.forRoot({
			apiKey: environment.apiKey
		})
	],
	providers: [
		SettingsService,
		ToastService
	],
	declarations: [MainPage, MapDirectionsDirective, PopoverComponent],
	exports: [PopoverComponent],
	entryComponents: [PopoverComponent]
})
export class MainPageModule { }
