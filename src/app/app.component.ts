import { Component } from '@angular/core';
import { GameState, Player } from './models/config';
import { GameService } from './services/game.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'tic-tac-toe';
  public gameState = GameState;
  public player = Player;

  constructor(public gameService: GameService) {
  }

  ngOnInit() {

  }

  public startGame() {
    this.gameService.startGame();
  }

  public restartGame() {
    this.gameService.stopGame();
    this.gameService.startGame();
  }

  public stopGame() {
    this.gameService.stopGame();
  }
}
