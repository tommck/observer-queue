// tslint:disable no-console
import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  BehaviorSubject,
  empty,
  from,
  interval,
  merge,
  Observable,
  ReplaySubject,
  Subject
} from 'rxjs';
import {
  bufferToggle,
  concatAll,
  map,
  mapTo,
  mergeMap,
  publish,
  scan,
  share,
  shareReplay,
  startWith,
  switchMap,
  switchMapTo,
  take,
  takeUntil,
  tap,
  withLatestFrom
} from 'rxjs/operators';

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
  `
})
export class AppComponent implements OnInit, OnDestroy {
  private onDestroy = new Subject<void>();

  // AKA "source"
  public callSubject = new Subject<ICall>();

  constructor() {
    // start the "normal" calls coming in
    interval(1000)
      .pipe(
        take(500), // limit to 500 so it doesn't run forever
        takeUntil(this.onDestroy)
      )
      .subscribe(n => this.addCall(`Call ${n}`, false));
  }

  ngOnInit() {
    const bufferEndSignal = new Subject<ICall>();

    const source: Observable<ICall> = this.callSubject.pipe(
      publish(multicastedCalls$ =>
        bufferToggle(multicastedCalls$, () => bufferEndSignal)
      )
    );

    source.pipe(
      mergeMap(arr =>
        from(arr).pipe(
          map(val => [val, this.processCall(val)]),
          tap(result => {
            if (val.isMagic) {
              bufferEndSignal.next(val);
            }
          }),
          map(([val, result]) => result)
        )
      )
    );
  }

  ngOnDestroy() {
    this.onDestroy.next();
  }

  addMagicCall() {
    this.addCall('MAGIC!', true);
  }

  private addCall(msg: string, isMagic: boolean) {
    this.callSubject.next({
      isMagic,
      message: msg
    });
  }
}
