var Path = require( 'path' );
var System = require( 'systemjs' );

var traceur = require( 'systemjs/node_modules/es6-module-loader/node_modules/traceur' );
traceur.options.experimental = true;

System.baseURL = '/';

System.paths[ 'willikins/*' ] = __dirname + '/*.js';
System.paths[ 'vendors/*' ] = Path.join( Path.resolve( '.' ), 'vendors', '*.js' );
System.paths[ 'app/*' ] = Path.join( Path.resolve( '.' ), 'sources', '*.js' );

GLOBAL.errlog = function ( error ) {

    if ( error instanceof Error ) {
        console.error( error.stack || error.toString( ) );
    } else {
        console.error( error );
    }

};

System.import( 'willikins/_run' ).then( function ( m ) {
    return m.default( );
} ).catch( errlog );
