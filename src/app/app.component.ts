// tslint:disable no-console
import { Component, OnDestroy, OnInit } from '@angular/core';
import { interval, Observable, of, Subject } from 'rxjs';
import { take, takeUntil, tap } from 'rxjs/operators';
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
  `
})
export class AppComponent implements OnInit, OnDestroy {
  private onDestroy = new Subject<void>();

  // AKA "source"
  public callSubject = new Subject<ICall>();
  public calls$ = new Subject<string>();

  ngOnInit() {
    console.warn('------------- BEGIN ----------------- ');
    // start the "normal" calls coming in
    interval(1000)
      .pipe(
        take(500), // limit to 500 so it doesn't run forever
        takeUntil(this.onDestroy),
        tap(n => console.debug(`tap: ${n}`))
      )
      .subscribe(n => this.addCall(`Call ${n}`, false));

    this.callSubject
      .pipe(
        magicConcat((c: ICall) => c.isMagic, (c: ICall) => this.processCall(c))
      )
      .subscribe(c => {
        this.processCall(c);
      });
  }

  private processCall(call: ICall): Observable<any> {
    const msg = `>>>>>> Processing ${call.isMagic ? 'MAGIC ' : ''}${
      call.message
    }`;
    this.calls$.next(msg);

    return of(msg);
  }

  ngOnDestroy() {
    this.onDestroy.next();
  }

  addMagicCall() {
    this.addCall('MAGIC!', true);
  }

  private addCall(msg: string, isMagic: boolean) {
    console.debug(`Adding Call: ${msg}${isMagic ? ' - MAGIC' : ''}`);
    this.callSubject.next({
      isMagic,
      message: msg
    });
  }
}
