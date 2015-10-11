import { Readable }                                              from 'node/stream';

import { Error as SequelizeError }                               from 'willikins/vendors/sequelize';
import { DatabaseError, UniqueConstraintError, ValidationError } from 'willikins/vendors/sequelize';

import { HttpError, ServerError }                                from 'willikins/http/errors';
import { getProfile }                                            from 'willikins/profile';

function convertSequelizeErrorToHttp( error ) {

    switch ( true ) {

    case error instanceof ValidationError :
        return new ServerError( { message : error.message, errors : error.errors, stack : error.stack } );

    case error instanceof UniqueConstraintError :
        return new ServerError( { message : error.message, errors : error.errors, stack : error.stack } );

    default: return new ServerError( { message : error.message, sql : error.sql, stack : error.stack } );

    }

}

function convertErrorToHttp( error ) {

    if ( error instanceof SequelizeError ) {

        return convertSequelizeErrorToHttp( error );

    } else if ( ! ( error instanceof Error ) ) {

        return new ServerError( { message : error } );

    } else if ( ! ( error instanceof HttpError ) ) {

        return new ServerError( { message : error.message, stack : error.stack } );

    } else {

        return error;

    }

}

export function wrapAsyncController( fn, { defaultContentType = 'text/plain' } = { } ) {

    let { DEV_MODE } = getProfile( );

    function sendResponse( response, data ) {

        if ( data instanceof Readable ) {
            data.pipe( response );
        } else if ( typeof data === 'object' && ! ( data instanceof Buffer ) ) {
            response.send( JSON.stringify( data ) );
        } else {
            response.send( data );
        }

    }

    return ( request, response ) => {

        Promise.resolve( ).then( ( ) => {

            return fn( request, response );

        } ).then( ( { status, contentType, data } ) => {

            response.status( status ).header( 'Content-Type', contentType || defaultContentType );
            sendResponse( response, data );

        } ).catch( error => {

            error = convertErrorToHttp( error );

            if ( error instanceof ServerError )
                console.error( error.data.stack || error.stack || error );

            if ( error instanceof ServerError && ! DEV_MODE )
                error = new ServerError( );

            let data = { error : { message : error.message, data : error.data } };

            if ( data.error.data && data.error.data.stack )
                data.error.data.stack = data.error.data.stack.split( /\n/g );

            response.status( error.status ).header( 'Content-Type', defaultContentType );
            sendResponse( response, data );

        } );

    };

}
