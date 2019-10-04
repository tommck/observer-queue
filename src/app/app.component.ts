// tslint:disable no-console
import { Component, OnDestroy, OnInit } from '@angular/core';
import { interval, Observable, of, ReplaySubject, Subject } from 'rxjs';
import {
  concatAll,
  delay,
  map,
  startWith,
  take,
  takeUntil,
  tap
} from 'rxjs/operators';
import { magicConcat } from './magicConcat';

export interface ICall {
  message: string;
  isMagic: boolean;
}

@Component({
  selector: 'app-root',
  template: `
    <div style="text-align:center" class="content">
      <h1>
        Observable Conditional Queuing
      </h1>
    </div>
    <button type="button" (click)="addMagicCall()">Add Magic!</button>
    <div *ngFor="let msg of messages">
      {{msg}}
    </div>
  `
})
export class AppComponent implements OnInit, OnDestroy {
  private onDestroy = new Subject<void>();

  // AKA "source"
  public incomingCallQueue = new Subject<{
    call: ICall;
    done: (result: any) => void;
  }>();

  public messages: string[] = [];

  ngOnInit() {
    console.warn('------------- BEGIN ----------------- ');
    // start the "normal" calls coming in
    interval(3000)
      .pipe(
        take(50), // limit to 500 so it doesn't run forever
        takeUntil(this.onDestroy)
      )
      .subscribe(n => {
        // NOTE: This simulates client code.. this.http.get().subscribe() ...
        const id = `Call ${n}`;
        // tslint:disable-next-line: variable-name
        this.addCall(id, false).subscribe(_result => {
          this.logMessage(`${id} - DONE`);
        });
      });

    this.incomingCallQueue
      .pipe(
        takeUntil(this.onDestroy),
        magicConcat(
          ({ call }) => call.isMagic,
          ({ call, done }) =>
            this.processCall(call).pipe(map(result => ({ result, done })))
        )
      )
      .subscribe(({ result, done }) => {
        done(result);
      });
  }

  private processCall(call: ICall): Observable<any> {
    const callId = `${call.isMagic ? 'MAGIC ' : ''}${call.message}`;

    this.logMessage(`${callId} - begin`);

    return of(callId).pipe(delay(call.isMagic ? 10000 : 1000));
  }

  ngOnDestroy() {
    this.onDestroy.next();
  }

  private magicCallCounter = 0;

  addMagicCall() {
    const id = `Magic Call ${this.magicCallCounter++}`;
    this.addCall(id, true).subscribe(_ => {
      this.logMessage(`${id} DONE`);
    });
  }

  private addCall(msg: string, isMagic: boolean): Observable<any> {
    this.logMessage(`Adding: ${msg}`);

    return new Observable<any>(callResult => {
      this.incomingCallQueue.next({
        call: {
          isMagic,
          message: msg
        },
        // tslint:disable-next-line: object-literal-sort-keys
        done: result => {
          callResult.next(result);
          callResult.complete();
        }
      });

      // TODO: c
      // return () => { ...teardown... };
      //   this.callSubject
      // .pipe(
      //   magicConcat(
      //     ({ val: ICall } ) => val.isMagic,
      //     ({ val: ICall, done, cancel$ }) => cancel$.getValue() ? this.processCall(val).pipe(
      //       takeUntil(cancel$.pipe(filter(e => e)))
      //       map(result => ({ result, done }))) : EMPTY
      //     )
      // ).subscribe(({result, done}) => {
      //   done(result);
      // });
    });
  }

  private logMessage(str: string) {
    this.messages.push(str);
  }
}
