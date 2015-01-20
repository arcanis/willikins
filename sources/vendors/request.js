var actualRequest = require( 'request' );

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
