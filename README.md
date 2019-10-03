# ObsQueue

The idea is to have "magic" requests that hold all other incoming requests until they're done, so..

## Example

A = magic call, B = normal call

// Incoming Stream: -B-B-B-B-B-A-B-B-B-B-A-A-B-A-B-B-B-|

would result in (each line is parallel calls):

    BBBBB
    A
    BBBB
    A
    A
    B
    A
    BBB

## Potential Solutions

### No Actual Queue

1.  There's a "waitForMagic()" method that returns either a current
    magic observable or noop()
2.  when an incoming call comes in and it's "norma", the calling code gets:

    ```typescript
    waitForMagic().pipe(map(_x => defer(actualHttpCall)));
    ```

3.  If the incoming call is a magic one, it is wrapped with:

    ```typescript
    waitForMagic().pipe(
      map(_x => defer(actualHttpCall)),
      tap(x => setThisOneAsTheMagicOne(x))
    );
    ```

asdf
