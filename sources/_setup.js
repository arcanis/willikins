var Path = require( 'path' );

// Running a node server as root is bad, and you should (probably) feel bad
if ( ( process.getuid && process.getuid( ) ) === 0 || ( process.getgid && process.getgid( ) === 0 ) )
    throw new Error( 'Please don\'t run Willikins as root - use authbind instead' );

// We define here a few constants that may be used if necessary (but it would be better to avoid using them)
GLOBAL.__willikins_core_dir = Path.resolve( process.argv[ 1 ] );
GLOBAL.__willikins_core_modules = Path.join( __willikins_core_dir, 'node_modules' );

// We load the Core.js shim, which will hook the missing ES6 functions inside the environment
require( __willikins_core_modules + '/babel/polyfill' );

// We use SystemJS to manage our ES6 modules
var System = require( __willikins_core_modules + '/systemjs' );

// The system-node-sourcemap module allows us to get the real stack trace
var transformError = require( __willikins_core_modules + '/system-node-sourcemap' );

// Babel gives better error messages than Traceur
System.transpiler = 'babel';
System.babelOptions = { stage : 0 };

// SystemJS apparently cannot load modules that are outside of the baseURL. Since we need to load modules from everywhere on the disk, we set the baseURL as being at the root of the filesystem
System.baseURL = '/';

var Yaml = require( __willikins_core_modules + '/js-yaml' );

// Automatically adds a way to load JSON and YAML files
System.set( 'json', System.newModule( { translate( load ) { return 'module.exports = ' + load.source; } } ) );
System.set( 'yml', System.newModule( { translate( load ) { return 'module.exports = ' + JSON.stringify( Yaml.safeLoad( load.source ) ); } } ) );

// And register these extensions in the SystemJS loader
System.meta[ '*.json' ] = { loader : 'yml' };
System.meta[ '*.yml' ] = { loader : 'yml' };

// We setup an alias for Willikins modules so that users can require them without knowing their exact location on the filesystem
System.paths[ 'willikins/*' ] = 'file:' + Path.join( __willikins_core_dir, 'sources', '*.js' );

// We create a promisified module entry for each node builtin module

require( __willikins_core_modules + '/builtins' ).forEach( function ( name ) {

    try {
        var nodeModule = require( __willikins_core_modules + '/mz/' + name );
    } catch ( e ) {
        var nodeModule = require( name );
    }

    var es6Module = Object.assign( { defaults : nodeModule }, nodeModule );
    System.set( 'node/' + name, System.newModule( es6Module ) );

} );

// And finally we can run the application. We strip the first two parameter, which are the node binary name and the Willikins binary module path. We catch any error to print it properly, and voilà.

System.import( 'willikins/_run' ).then( function ( m ) {

    return m.default( process.argv.slice( 2 ) );

} ).catch( function ( error ) {

    if ( error instanceof Error )
        error = transformError( error );

    console.log( error.stack || error );

    return 1;

} ).then( function ( exitStatus ) {

    process.exit( exitStatus );

} );
