export function wrapAsync( fn ) {

    return function ( ... args ) {

        return new Promise( ( resolve, reject ) => {

            fn( ... args, ( error, result ) => {
                if ( error ) reject( error );
                else resolve( result );
            } );

        } );

    };

}
