import { UniqueConstraintError }         from 'willikins/vendors/sequelize';

import { ConflictingRequest, HttpError } from 'willikins/http/errors';

export function controller( fn, { json = false } = { } ) {

    return async function ( request, response ) {

        var status, data;

        try {

            var { status, data } = await fn( request, response );

        } catch ( error ) {

            console.log( 'hum', error );

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

        response.status( status );

        if ( json ) {

            response.json( data );

        } else {

            response.send( data );

        }

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
