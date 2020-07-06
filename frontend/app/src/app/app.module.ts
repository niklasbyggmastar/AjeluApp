import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';
import { Geolocation } from "@ionic-native/geolocation/ngx";

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { MainPage } from './components/main/main.page';
import { FavoritesPage } from './components/favorites/favorites.page';
import { MapDirectionsDirective } from './directives/map-directions.directive';
import { AgmCoreModule } from '@agm/core';
import { environment } from '../environments/environment';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { SettingsService } from './services/settings.service';
import { ToastService } from './services/toast.service';
import { CommonService } from './services/common.service';
import { RouteInfoComponent } from './components/routeInfo/routeInfo.component';
import { SettingsPage } from './components/settings/settings.page';

@NgModule({
	declarations: [
		AppComponent,
		MainPage,
		FavoritesPage,
		SettingsPage,
		MapDirectionsDirective,
		RouteInfoComponent
	],
	entryComponents: [
		RouteInfoComponent
	],
	imports: [
		BrowserModule,
		IonicModule.forRoot(),
		AppRoutingModule,
		AgmCoreModule.forRoot({
			apiKey: environment.apiKey
		}),
		IonicModule,
		CommonModule,
		FormsModule,
		HttpClientModule
	],
	providers: [
		StatusBar,
		SplashScreen,
		Geolocation,
		SettingsService,
		ToastService,
		CommonService,
		{ provide: RouteReuseStrategy, useClass: IonicRouteStrategy }
	],
	bootstrap: [AppComponent],
})
export class AppModule { }
