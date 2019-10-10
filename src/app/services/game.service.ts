import { Injectable } from '@angular/core';
import { BehaviorSubject, combineLatest, Observable, merge, pipe } from 'rxjs';
import { map, distinctUntilChanged, take } from 'rxjs/operators';
import { Player, Cell, GameState, DBState, NextPlayer } from '../models/config';
import { AngularFirestore, AngularFirestoreCollection, AngularFirestoreDocument } from 'angularfire2/firestore';
import { FireStoreService } from './fireStore.service';

@Injectable()
export class GameService {
    
    itemsCollection: AngularFirestoreCollection<Cell>;
    items$: Observable<Cell[]>;
    itemDoc: AngularFirestoreDocument<Cell>;


    public ticTacToeBoard1D:  Cell[] = [];
    public ticTacToeBoard2D:  Cell[][] = [];

    private playerTurn$$: BehaviorSubject<Player> = new BehaviorSubject<Player>(Player.ONE);
    public playerTurn$ = this.playerTurn$$.asObservable();
    

    public ticTacToeBoard$$: BehaviorSubject<Cell[][]> =  new BehaviorSubject<Cell[][]>(this.ticTacToeBoard2D);
    public ticTacToeBoard$ =  this.ticTacToeBoard$$.asObservable();

    public gameState$$:BehaviorSubject<GameState> = new BehaviorSubject<GameState>(GameState.DORMANT);
    public gameState$ = this.gameState$$.asObservable();

    public boardFilled$$:BehaviorSubject<DBState> = new BehaviorSubject<DBState>(DBState.FILLED);
    public boardFilled$ = this.boardFilled$$.asObservable();
    
    public nextPlayer: NextPlayer;
    constructor(public afs: AngularFirestore, public fireStore: FireStoreService) {
        combineLatest(this.ticTacToeBoard$, this.fireStore.dbState$, this.gameState$, this.fireStore.playerTurnItems$).pipe(
            distinctUntilChanged()).subscribe(([board, dbstate, gameState, playerTurn]) => {
            if (gameState === GameState.PLAYING) {
                if (dbstate === DBState.EMPTY) {
                    console.log('Firestore database is empty. Add items');
                    this.fireStore.addItemsToBoard();
                } else if(dbstate === DBState.FILLED) {
                    console.log('Firestore database is correctly filled. Start reading from database');
                    this.fireStore.boardItems$.subscribe((val: Cell[]) => {
                        this.ticTacToeBoard2D = this.mapTo2DArray(val);
                        this.ticTacToeBoard$$.next(this.ticTacToeBoard2D);
                        this.applyRules();
                    });
                } else if(dbstate == DBState.INVALID) {
                    console.log('Database is incorrectly filled. Delete database');
                    this.fireStore.boardItems$.subscribe((val: Cell[]) => {
                        this.ticTacToeBoard2D = this.mapTo2DArray(val);
                        this.fireStore.deleteAll(this.ticTacToeBoard2D);
                    });
                }
                this.updatePlayerTurn(playerTurn[0]);
            }
            
        }); 
    }

    private updatePlayerTurn(player: NextPlayer) {
        console.log('GameService: updatePlayerTurn(), next player info', player);
        this.nextPlayer = new NextPlayer();
        this.nextPlayer.id = player.id;
        this.nextPlayer.playerTurn = player.playerTurn;
        this.playerTurn$$.next(this.nextPlayer.playerTurn);
    }

    private mapTo2DArray(boardArray :Cell[]) {
        boardArray = boardArray.sort(this.compare);
        
        let mappedRowToCell : Cell[] = [];
        const twoDimensionArray: Cell[][] = [];
        for(let i = 0; i< 9; i++) {
            mappedRowToCell.push(boardArray[i]);
            if (i === 2 || i === 5 || i === 8) {
                twoDimensionArray.push(mappedRowToCell);
                mappedRowToCell = [];
            }
        }
        console.log('GameService:mapTo2DArray . val is ', twoDimensionArray);
        return twoDimensionArray;
    }

    
    public update1(cell: Cell) {
        const i = Math.floor(cell.index/3);
        const j = cell.index % 3;

        const curPlayer = this.playerTurn$$.value;
        console.log('GameService: update() . current Player is ', curPlayer);
        if (this.ticTacToeBoard2D[i][j].occupiedBy === Player.NONE) {
            if (curPlayer === Player.ONE) {
                this.ticTacToeBoard2D[i][j].occupiedBy = Player.ONE;
                this.ticTacToeBoard2D[i][j].playerIndication = "X";
                this.playerTurn$$.next(Player.TWO);
            } else {
                this.ticTacToeBoard2D[i][j].occupiedBy = Player.TWO;
                this.ticTacToeBoard2D[i][j].playerIndication = "O";
                this.playerTurn$$.next(Player.ONE);
            }
            this.ticTacToeBoard$$.next(this.ticTacToeBoard2D);
            this.fireStore.updateBoardItems(cell, curPlayer);
            this.nextPlayer.playerTurn = (curPlayer === Player.ONE) ? Player.TWO : Player.ONE;
            console.log('GameService: update() . Player turn is ', this.nextPlayer.playerTurn);
            this.fireStore.updateNextPlayerInfo(this.nextPlayer);
        } else {
            console.log('Cell already occupied');
        }
    }

    public startGame() {
        console.log('GameService:startGame()');
        this.gameState$$.next(GameState.PLAYING);
    }

    public stopGame() {
        console.log('GameService:stopGame()');
        this.fireStore.deleteAll(this.ticTacToeBoard2D);
        this.gameState$$.next(GameState.DORMANT);
    }

    private applyRules() {
        console.log('GameService:applyRules()');
            if (!this.winningRowFound()) {
                if (!this.winningColumnFound()) {
                    if (!this.winningDiagonalElementsFound()) {
                        if (this.allCellsFilled()) {
                            this.gameState$$.next(GameState.DRAW);
                        }
                    }
                }
            }
    }

    private allCellsFilled() {
        return ![].concat(...this.ticTacToeBoard2D).some(cell => cell.occupiedBy === Player.NONE);
    }

    private winningRowFound() {
        for(const row of this.ticTacToeBoard2D) {
            if (this.markedBySamePlayer(row)) {
                if (row[0].occupiedBy === Player.ONE) {
                    this.gameState$$.next(GameState.PLAYER_ONE_WINS);
                } else {
                    this.gameState$$.next(GameState.PLAYER_TWO_WINS);
                }
                console.log('winner in row ', row[0].occupiedBy);
                return true;
            }
        }
        return false;
    }

    private winningColumnFound() {
        for(const row of this.transpose()) {
            if (this.markedBySamePlayer(row)) {
                if (row[0].occupiedBy === Player.ONE) {
                    this.gameState$$.next(GameState.PLAYER_ONE_WINS);
                } else {
                    this.gameState$$.next(GameState.PLAYER_TWO_WINS);
                }
                console.log('winner in columns', row[0].occupiedBy);
                return true;
            }
        }
        return false;
    }

    private winningDiagonalElementsFound() {
        const topLeftToBottomRight: Cell[] = [];
        topLeftToBottomRight.push(this.ticTacToeBoard2D[0][0]);
        topLeftToBottomRight.push(this.ticTacToeBoard2D[1][1]);
        topLeftToBottomRight.push(this.ticTacToeBoard2D[2][2]);
        
        if (this.markedBySamePlayer(topLeftToBottomRight)) {
            if (topLeftToBottomRight[0].occupiedBy === Player.ONE) {
                this.gameState$$.next(GameState.PLAYER_ONE_WINS);
            } else {
                this.gameState$$.next(GameState.PLAYER_TWO_WINS);
            }
            console.log('winner in diagonal left to right', topLeftToBottomRight[0].occupiedBy);
            return true;
        }
      
        const topRightToBottomLeft: Cell[] = [];
        topRightToBottomLeft.push(this.ticTacToeBoard2D[0][2]);
        topRightToBottomLeft.push(this.ticTacToeBoard2D[1][1]);
        topRightToBottomLeft.push(this.ticTacToeBoard2D[2][0]);
        
        if (this.markedBySamePlayer(topRightToBottomLeft)) {
            if (topRightToBottomLeft[0].occupiedBy === Player.ONE) {
                this.gameState$$.next(GameState.PLAYER_ONE_WINS);
            } else {
                this.gameState$$.next(GameState.PLAYER_TWO_WINS);
            }
            console.log('winner in diagonal left to right', topRightToBottomLeft[0].occupiedBy);
            return true;
        }
        return false;
    }

    private transpose() {
        let transposedArray = [];
        for(var i = 0; i < this.ticTacToeBoard2D.length; i++){
            transposedArray.push([]);
        };

        for(var i = 0; i < this.ticTacToeBoard2D.length; i++){
            for(var j = 0; j < this.ticTacToeBoard2D.length; j++){
                transposedArray[j].push(this.ticTacToeBoard2D[i][j]);
            };
        };
        return transposedArray;
    }

    private markedBySamePlayer(row: Cell[]) {
        if (row.includes(undefined)) {
            return false;
        }
        if (row.some(cell => cell.occupiedBy === Player.NONE)) {
            return false;
        }
        const cellValueArray = []
        row.forEach((cell : Cell) => {
            cellValueArray.push(cell.occupiedBy);
        });
        return (new Set(cellValueArray)).size === 1;
    }

    public compare(cell1: Cell, cell2: Cell) {
        if (cell1.index > cell2.index) {
            return 1;
        }
        if (cell1.index < cell2.index) {
            return -1;
        }
        return 0;
    }
}