// tslint:disable no-console
import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  BehaviorSubject,
  empty,
  interval,
  merge,
  ReplaySubject,
  Subject
} from 'rxjs';
import {
  bufferToggle,
  concatAll,
  map,
  mapTo,
  scan,
  share,
  shareReplay,
  startWith,
  switchMap,
  switchMapTo,
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
    <button *ngIf="!running" type="button" (click)="start()">
       Start
    </button>
    <button *ngIf="running" type="button" (click)="stop()">
      Stop
    </button>

    <div *ngFor="let c of calls$ | async">
     {{ c.message }}
    </div>
  `
})
export class AppComponent implements OnInit, OnDestroy {
  private counter = 0;
  private onDestroy = new Subject<void>();

  // tslint:disable member-ordering
  public running = false;
  public callSubject = new Subject<ICall>();
  public calls$ = this.callSubject.pipe(
    takeUntil(this.onDestroy),
    scan((arr: ICall[], call: ICall) => {
      return [...arr, call];
    }, [])
  );

  private pause$ = new Subject<false>();
  private resume$ = new Subject<true>();

  constructor() {
    /**
     * NOTES:
     *
     * All incoming requests go into a Queue, regardless
     * There's an internal consumer of this queue.
     * this consumer "loops" over these and executes them in parallel until it finds a "magic" call
     * Once it his a "magic" one, it
     *
     */
    // start/stop should turn on/off the incoming regular url requests
    // another button (addMagicCall) should add something that requires the custom queue logic.
  }

  ngOnInit() {
    const interval$ = interval(1000).pipe(share());

    // interval$.pipe(takeUntil(this.onDestroy)).subscribe((x: number) => {
    //   console.log(`Interval ${x}`);
    // });

    const enabled$ = merge(this.pause$, this.resume$).pipe(
      startWith(false),
      tap(x => {
        console.log('True?: ', x);
      })
      // bufferToggle(this.resume$, () => this.pause$),
      // tap(x => {
      //   console.log('POST-buffer: ', x);
      // }),
      // concatAll() // flatten the buffered array
      // // This is causing it to re-subscribe to $interval, which is not what we want.
      // switchMap((paused: boolean) => (paused ? interval$ : empty()))
      // switchMap(b => interval$.pipe(map(num => `${b} - ${num}`)))
    );

    // just log out the ongoing interval with current status
    interval$
      .pipe(
        withLatestFrom(enabled$),
        map(([num, isEnabled]) => {
          return `${isEnabled} ${num}`;
        })
      )
      .subscribe(console.log);
  }

  ngOnDestroy() {
    this.onDestroy.next();
  }

  start() {
    console.info('Starting!');
    this.running = true;
    this.resume$.next(true);
  }

  stop() {
    console.info('Stopping!');
    this.running = false;
    this.pause$.next(false);
  }

  private addCall(msg: string, isMagic: boolean) {
    this.callSubject.next({
      isMagic,
      message: msg
    });
  }
}
