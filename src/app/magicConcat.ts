import {
  ObservableInput,
  ObservedValueOf,
  OperatorFunction,
  ReplaySubject,
  Scheduler
} from 'rxjs';
import {
  concatMap,
  filter,
  map,
  mergeMap,
  publish,
  window
} from 'rxjs/operators';

// tslint:disable

export function magicConcat<T, O extends ObservableInput<any>>(
  isMagic: (value: T, index: number) => boolean,
  project: (value: T, index: number) => O,
  scheduler?: Scheduler
): OperatorFunction<T, ObservedValueOf<O>> {
  return source =>
    source.pipe(publish(src =>
      src.pipe(
        window(src.pipe(filter(isMagic))),
        map(win => {
          const r = new ReplaySubject<T>(undefined, undefined, scheduler);
          win.subscribe(r);
          return r.asObservable();
        }),
        concatMap((window, i) => window.pipe(mergeMap(project)))
      )
    ) as OperatorFunction<T, ObservedValueOf<O>>);
}
