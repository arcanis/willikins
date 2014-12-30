import { createWriteStream } from 'willikins/node/fs';
import { Writable }          from 'willikins/node/stream';

export class NullStream extends Writable {

    _write( chunk, encoding, callback ) {
        setImmediate( callback );
    }

}

export class CallStream extends Writable {

    constructor( fn ) {

        this._fn = fn;

        super( );

    }

    _write( chunk, encoding, callback ) {

        setImmediate( ( ) => {
            this._fn( chunk, encoding );
            callback( );
        } );

    }

}

export function toStream( target ) {

    if ( ! target )
        return new NullStream( );

    if ( target._write )
        return target;

    if ( typeof target === 'function' )
        return new CallStream( target );

    if ( typeof target === 'string' )
        target = createWriteStream( target );

    throw new Error( 'Cannot cast ' + target + ' to a stream' );

}
