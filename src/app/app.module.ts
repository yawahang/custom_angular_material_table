import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { MatGridModule } from './shared/mat-grid/mat-grid.module';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    // Custom
    MatGridModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
