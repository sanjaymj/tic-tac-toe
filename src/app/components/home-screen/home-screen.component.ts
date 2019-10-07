import { Component, OnInit, OnDestroy } from '@angular/core';
import { GameService } from 'src/app/services/game.service';
import { Cell, GameState } from 'src/app/models/config';
import { FireStoreService } from 'src/app/services/fireStore.service';
import { distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-home-screen',
  templateUrl: './home-screen.component.html',
  styleUrls: ['./home-screen.component.scss']
})
export class HomeScreenComponent implements OnInit {
  public boardArray: Cell[][] = [];
  public gameState = GameState;


  constructor(public gameService: GameService, public fireStore: FireStoreService) {
    this.gameService.ticTacToeBoard$.pipe(distinctUntilChanged()).subscribe((val) => {
     this.boardArray = val;
    });
  }

  ngOnInit() {
  }

  public startGame() {
    this.gameService.startGame();
  }

  public stopGame() {
    this.gameService.stopGame();
  }

}
