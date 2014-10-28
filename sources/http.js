import { getProfile } from 'willikins/profile';

var express = require( 'express' );

function runServer( app, port ) {

    return new Promise( ( resolve, reject ) => {

        app.listen( port, ( error, result ) => {

            if ( error ) reject( error );
            else         resolve( result );

        } );

    } );

}

export class Server {

    static async instance( ) {

        if ( this._instance )
            return this._instance;

        var { SERVER_BUILDER, HTTP_PORT } = getProfile( );

        var app = await SERVER_BUILDER( express( ) );

        this._instance = await runServer( app, HTTP_PORT );

        return this._instance;

    }

    static start( ) {

        return this.instance( );

    }

}
