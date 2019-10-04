// tslint:disable no-console
import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  BehaviorSubject,
  EMPTY,
  interval,
  Observable,
  of,
  Subject
} from 'rxjs';
import { delay, filter, map, take, takeUntil } from 'rxjs/operators';
import { blockingMergeMap } from './blocking-merge-map';

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
    cancel$: BehaviorSubject<boolean>;
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
        blockingMergeMap(
          ({ call }) => call.isMagic,
          ({ call, done, cancel$ }) =>
            cancel$.getValue()
              ? EMPTY
              : this.processCall(call).pipe(
                  takeUntil(cancel$.pipe(filter(e => e))),
                  map(result => ({ result, done }))
                )
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

    return new Observable(r => {
      const cancel$ = new BehaviorSubject(false);
      this.incomingCallQueue.next({
        call: {
          isMagic,
          message: msg
        },
        cancel$,
        done: result => {
          r.next(result);
          r.complete();
        }
      });
      return () => {
        cancel$.next(true);
      };
    });
  }

  private logMessage(str: string) {
    this.messages.push(str);
  }
}
