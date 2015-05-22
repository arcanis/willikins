if ( ( process.getuid && process.getuid( ) ) === 0 || ( process.getgid && process.getgid( ) === 0 ) )
    throw new Error( 'Please don\'t run Willikins as root' );

var Path = require( 'path' );

// We define here a few constants that may be used if necessary (but it would be better to avoid using them)

GLOBAL.__willikins_core_dir = Path.resolve( process.argv[ 1 ] );
GLOBAL.__willikins_app_dir = Path.resolve( '.' );

GLOBAL.__willikins_core_modules = Path.join( __willikins_core_dir, 'node_modules' );
GLOBAL.__willikins_app_modules = Path.join( __willikins_app_dir, 'node_modules' );

// We load the Core.js shim, which will hook the missing ES6 functions inside the environment

require( __willikins_core_modules + '/babel/polyfill' );

var Builtins = require( __willikins_core_modules + '/builtins' );
var System = require( __willikins_core_modules + '/systemjs' );

System.transpiler = 'babel';

System.babelOptions = { stage : 1 };
System.traceurOptions = { asyncFunctions : true };

System.baseURL = '/';

System.paths[ 'willikins/*' ] = 'file:' + Path.join( __willikins_core_dir, 'sources', '*.js' );
System.paths[ 'vendors/*' ] = 'file:' + Path.join( __willikins_app_dir, 'vendors', '*.js' );
System.paths[ 'app/*' ] = 'file:' + Path.join( __willikins_app_dir, 'sources', '*.js' );

// We create a promisified module entry for each node builtin

Builtins.forEach( function ( name ) {

    var nodeModule, es6Module;

    try {
        nodeModule = require( __willikins_core_modules + '/mz/' + name );
    } catch ( e ) {
        nodeModule = require( name );
    }

    es6Module = Object.assign( { }, nodeModule );
    es6Module.defaults = nodeModule;

    System.set( 'node/' + name, System.newModule( es6Module ) );

} );

// Big hack ... Systemjs doesn't resolve properly the require call (they are resolved from the module-loader
// source file rather than the actual source file, so it will return the wrong dependency if there is a
// conflict somewhere), so we force it to be resolved from the application root directory. Pretty ugly but
// I need to sleep.

var Module = require( 'module' ), top = module;
var OrigRequire = Module.prototype.require;

Module.prototype.require = function ( what ) {

    var filename = this.filename;

    if ( ! filename.endsWith( '/es6-module-loader.src.js' ) )
        return OrigRequire.call( this, what );

    return OrigRequire.call( top, what );

};

// And finally we can run the application. We strip the first two parameter, which are the node binary name
// and the Willikins directory. We catch any error to print it properly, and voilà.

System.import( 'willikins/_run' ).then( function ( m ) {

    return m.default( process.argv.slice( 2 ) );

} ).catch( function ( error ) {

    console.log( error.stack || error );

    process.exit( 1 );

} );
