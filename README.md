# ObsQueue

The idea is to have "magic" requests that hold all other incoming requests until they're done, so..

    A = magic, B = normal

    // Stream: -B-B-B-B-B-A-B-B-B-B-A-A-B-A-B-B-B-|

    would result in (each line is parallel calls):

    BBBBB
    A
    BBBB
    A
    A
    B
    A
    BBB
