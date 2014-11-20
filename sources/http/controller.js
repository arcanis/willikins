import { UniqueConstraintError }         from 'willikins/vendors/sequelize';

import { ConflictingRequest, HttpError } from 'willikins/http/errors';

export function controller( fn ) {

    return async function ( request, response ) {

        var status, contentType, data;

        try {

            var { status, contentType, data } = await fn( request, response );

        } catch ( error ) {

            if ( error instanceof HttpError ) {

                status = error.status;
                data = error.data;

            } else if ( error instanceof Error ) {

                status = 500;
                data = { message : error.toString( ) };

            } else {

                status = 500;
                data = { message : ( '' + error ) };

            }

        }

        if ( contentType )
            response.header( 'Content-Type', contentType );

        response.status( status );
        response.send( data );

    };

}

export function databaseController( fn, options ) {

    return controller( async function ( request, response ) {

        try {

            return await fn( request, response );

        } catch ( error ) {

            if ( error instanceof UniqueConstraintError )
                throw new ConflictingRequest( );

            throw error;

        }

    }, options );

}
