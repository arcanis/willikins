import { getProfile } from 'willikins/profile';

export class Server {

    static async _setup( ) {

        let { SERVER_BUILDER } = getProfile( );

        return await SERVER_BUILDER( );

    }

    static async instance( ) {

        if ( ! this._serverPromise )
            this._serverPromise = this._setup( );

        return await this._serverPromise;

    }

}

export function runServer( app, ... args ) {

    return new Promise( ( resolve, reject ) => {

        let server = app.listen( ... args );

        function onError( error ) {
            unbind( );
            reject( error );
        }

        function onSuccess( ) {
            unbind( );
            resolve( );
        }

        function bind( ) {
            server.addListener( 'error', onError );
            server.addListener( 'listening', onSuccess );
        }

        function unbind( ) {
            server.removeListener( 'error', onError );
            server.removeListener( 'listening', onSuccess );
        }

        bind( );

    } );

}
