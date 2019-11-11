import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class SettingsService {

    settings: any;

    constructor(private http: HttpClient) {}

    getSettings() {
        this.http.get(environment.apiUrl + "/settings").toPromise().then((settings) => {
            if (settings) {
                console.log(settings);
                this.settings = settings;
            }
        });
    }

    getSetting(key) {
        return this.http.get(environment.apiUrl + `/settings/${key}`).toPromise();
    }

    saveSettings() {
        return this.http.post(environment.apiUrl + "/settings", this.settings).toPromise().then((res) => {
            console.log("Settings saved!");
        });
    }

    // Update local settings variable after updating stored values
    setSettings(newSettings) {
        return this.http.post(environment.apiUrl + "/settings", newSettings).toPromise().then((res) => {
            this.settings = res;
        });
    }

    setSetting(key, newSetting) {
        return this.http.post(environment.apiUrl + `/settings/${key}`, newSetting).toPromise().then((res) => {
            this.settings = res;
        });
    }
}