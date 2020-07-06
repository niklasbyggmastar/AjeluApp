import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { MainPage } from './components/main/main.page';
import { FavoritesPage } from './components/favorites/favorites.page';
import { SettingsPage } from './components/settings/settings.page';

const routes: Routes = [
	{
		path: 'home',
		component: MainPage,
	},
	{
		path: 'favorites',
		component: FavoritesPage
	},
	{
		path: 'settings',		
		component: SettingsPage
	}
];
@NgModule({
	imports: [
		RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
	],
	exports: [RouterModule]
})
export class AppRoutingModule { }
