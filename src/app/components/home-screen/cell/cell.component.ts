import { Component, OnInit, HostListener, Input } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Player, Cell } from 'src/app/models/config';
import { GameService } from 'src/app/services/game.service';

@Component({
  selector: 'app-cell',
  templateUrl: './cell.component.html',
  styleUrls: ['./cell.component.scss']
})
export class CellComponent{
  public Player = Player;

  @Input()
  public cell: Cell;

  constructor(public gameService: GameService) { }

  @HostListener("click") onClick(){
   this.gameService.update1(this.cell);
  }
}
