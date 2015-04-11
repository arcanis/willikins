var actualRequest = require( __willikins_core_modules + '/request' );

export var jar = actualRequest.jar;

export function request( options ) {

    return new Promise( ( resolve, reject ) => {

        actualRequest( options, ( error, response, body ) => {

            if ( ! error ) {
                resolve( { response, body } );
            } else {
                reject( error );
            }

        } );

    } );

}
