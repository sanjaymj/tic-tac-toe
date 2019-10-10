import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { HomeScreenComponent } from './components/home-screen/home-screen.component';
import { CellComponent } from './components/home-screen/cell/cell.component';
import { GameService } from './services/game.service';
import { environment } from '../environments/environment';
import { AngularFireModule } from 'angularfire2';
import { AngularFirestoreModule } from 'angularfire2/firestore';
import { FireStoreService } from './services/fireStore.service';

@NgModule({
  declarations: [
    AppComponent,
    HomeScreenComponent,
    CellComponent
  ],
  imports: [
    BrowserModule,
    AngularFireModule.initializeApp(environment.firebase, 'tic-tac-toe'),
    AngularFirestoreModule
  ],
  providers: [GameService, FireStoreService],
  bootstrap: [AppComponent]
})
export class AppModule { }
