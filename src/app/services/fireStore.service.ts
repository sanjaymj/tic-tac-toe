import { Injectable } from '@angular/core';
import { AngularFirestoreCollection, AngularFirestoreDocument, AngularFirestore } from 'angularfire2/firestore';
import { Cell, DBState, Player, NextPlayer } from '../models/config';
import { Observable, BehaviorSubject, Subscriber, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class FireStoreService {
    public boardItemsCollection: AngularFirestoreCollection<Cell>;
    public boardItems$: Observable<Cell[]>;
    public boardItemDoc: AngularFirestoreDocument<Cell>;
    private static DOCUMENT_NAME = 'Board2';

    public playerTurnCollection: AngularFirestoreCollection<NextPlayer>;
    public playerTurnItems$: Observable<NextPlayer[]>;
    public playerTurnDoc: AngularFirestoreDocument<NextPlayer>;
    private static DOCUMENT_NAME1 = 'nextPlayer';
    
    public dbState$$:BehaviorSubject<DBState> = new BehaviorSubject<DBState>(DBState.DEFAULT);
    public dbState$ = this.dbState$$.asObservable();

    constructor(public afs: AngularFirestore) { 
        this.boardItemsCollection = this.afs.collection(FireStoreService.DOCUMENT_NAME);
        this.notifyDatabaseState();
            this.boardItems$ = this.boardItemsCollection.snapshotChanges().pipe(map(changes => {
                this.notifyDatabaseState();
                return changes.map(a => {
                    const data = a.payload.doc.data() as Cell;
                    data.id = a.payload.doc.id;
                    return data;
                });
            }));

            this.playerTurnCollection = this.afs.collection(FireStoreService.DOCUMENT_NAME1);
            this.playerTurnItems$ = this.playerTurnCollection.snapshotChanges().pipe(map(changes => {
                return changes.map(a => {
                    const data = a.payload.doc.data() as NextPlayer;
                    data.id = a.payload.doc.id;
                    return data;
                });
            }));
    }

    public notifyDatabaseState() {
        this.boardItemsCollection.get().subscribe(docSnapshot => {
          if (docSnapshot.docs.length === 0) {
              this.dbState$$.next(DBState.EMPTY);
          } else if (docSnapshot.docs.length === 9) {
            this.dbState$$.next(DBState.FILLED);
          } else {
              this.dbState$$.next(DBState.INVALID);
          }
      });
    }

    public addItemsToBoard() {
        for(let i = 0; i<9; i++) {
            const cell: Cell = new Cell();
            cell.occupiedBy = Player.NONE;
            cell.index = i;
            cell.playerIndication = '-';
            this.boardItemsCollection.add({...cell});
        }
        this.dbState$$.next(DBState.FILLED);
    }


    public updateBoardItems(cell: Cell, curPlayer: Player) {
        this.boardItemDoc = this.afs.doc(`Board2/${cell.id}`);
        cell.occupiedBy =  curPlayer;
        this.boardItemDoc.update({...cell});
        this.boardItemsCollection.doc(cell.id).update(cell);
    } 

    public updateNextPlayerInfo(player: NextPlayer) {
        this.playerTurnDoc = this.afs.doc(`nextPlayer/${player.id}`); 
        this.playerTurnDoc.update({...player});
    }

    public deleteAll(board: Cell[][]) {
        console.log('FireStoreService: deleteAll()');
        for(const row of board) {
            for (const item of row) {
                this.delete(item);
            }
        }
        //window.location.reload();
    }

    public delete(cell: Cell) {
        console.log('FireStoreService: delete()');
        if (cell) {
            this.boardItemDoc = this.afs.doc(`Board2/${cell.id}`);
            this.boardItemDoc.delete();
        }
    }
}