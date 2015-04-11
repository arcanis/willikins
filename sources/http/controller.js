import { Readable }                                              from 'node/stream';

import { BaseError as SequelizeBaseError }                       from 'willikins/db/errors';
import { DatabaseError, UniqueConstraintError, ValidationError } from 'willikins/db/errors';
import { HttpError, ServerError }                                from 'willikins/http/errors';
import { getProfile }                                            from 'willikins/profile';

function convertSequelizeErrorToHttp( error ) {

    switch ( true ) {

    case error instanceof ValidationError :
        return new ServerError( { message : error.message, errors : error.errors } );

    case error instanceof UniqueConstraintError :
        return new ServerError( { message : error.message, errors : error.errors } );

    case error instanceof DatabaseError :
        return new ServerError( { message : error.message, sql : error.sql } );

    default: return new ServerError( { message : error.message } );

    }

}

function convertErrorToHttp( error ) {

    if ( error instanceof SequelizeBaseError ) {

        return convertSequelizeErrorToHttp( error );

    } else if ( ! ( error instanceof Error ) ) {

        return new ServerError( { message : error } );

    } else if ( ! ( error instanceof HttpError ) ) {

        return new ServerError( { message : error.message } );

    } else {

        return error;

    }

}

export function controller( fn, { defaultContentType = 'text/plain' } = { } ) {

    let { DEV_MODE } = getProfile( );

    return async function ( request, response ) {

        var status, contentType, data;

        try {

            var { status, contentType, data } = await fn( request, response );

        } catch ( error ) {

            error = convertErrorToHttp( error );

            if ( error instanceof ServerError && ! DEV_MODE )
                error = new ServerError( );

            status = error.status;
            data = error.data;

        }

        response.header( 'Content-Type', contentType || defaultContentType );
        response.status( status );

        if ( data instanceof Readable ) {
            data.pipe( response );
        } else if ( typeof data === 'object' && ! ( data instanceof Buffer ) ) {
            response.send( JSON.stringify( data ) );
        } else {
            response.send( data );
        }

    };

}
