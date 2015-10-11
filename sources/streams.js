import { createWriteStream } from 'node/fs';
import { Writable }          from 'node/stream';

export class NullStream extends Writable {

    _write( chunk, encoding, callback ) {
        setImmediate( callback );
    }

}

export class CallStream extends Writable {

    constructor( fn ) {

        super( );

        this._fn = fn;

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
        return createWriteStream( target );

    throw new Error( 'Cannot cast ' + target + ' to a stream' );

}
