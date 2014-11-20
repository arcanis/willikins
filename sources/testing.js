import { stringify as stringifyQueryString } from 'willikins/vendors/qs';
import { Database }                          from 'willikins/db';
import { getProfile }                        from 'willikins/profile';

var clr = require( 'cli-color' );

var gTestSuite = null;

var gQueryParameters = null;

class TestSuite {

    constructor( name ) {

        this.name = name;

        this.inits = [ ];
        this.tests = [ ];

    }

    async run( { } = { } ) {

        var name = this.name;
        var succeed = true;

        // Reset the global query parameters
        gQueryParameters = { };

        for ( var [ description, runner ] of this.tests ) {

            var error = null;

            await Database.drop( );
            await Database.sync( );

            try {

                for ( var initfn of this.inits )
                    await initfn( );

                await runner( );

            } catch ( catched ) {

                error = catched;

            }

            if ( ! error ) {

                process.stdout.write( clr.green( `  ✓ ${name} ${description}\n` ) );

            } else {

                process.stdout.write( clr.red(   `  ✗ ${name} ${description}\n` ) );
                process.stdout.write( clr.red(   `        ${error}\n` ) );

                succeed = false;

            }

        }

        return succeed;

    }

}

function parseJson( body ) {

    try {
        return JSON.parse( body );
    } catch ( error ) {
        throw new Error( `Invalid JSON data ${JSON.stringify(body)}` );
    }

}

export function describe( component, builder ) {

    var testSuite = new TestSuite( component );

    gTestSuite = testSuite;
    builder( );
    gTestSuite = null;

    return testSuite;

}

export function init( initfn ) {

    if ( gTestSuite === null )
        throw new Error( 'Cannot use the `init` construction outside of a `describe` context' );

    gTestSuite.inits.push( initfn );

}

export function it( description, runner ) {

    if ( gTestSuite === null )
        throw new Error( 'Cannot use the `it` construction outside of a `describe` context' );

    gTestSuite.tests.push( [ description, runner ] );

}

function request( options ) {

    return new Promise( ( resolve, reject ) => {

        require( 'request' )( options, ( error, response, body ) => {

            if ( error ) {

                reject( error );

            } else if ( response.statusCode >= 500 && response.statusCode < 600 ) {

                var data = body; try { data = JSON.parse( data ); } catch ( error ) { }
                reject( new Error( `Server returned an error on ${options.url}: ${JSON.stringify(data.message || data)}` ) );

            } else {

                resolve( { response, body } );

            }

        } );

    } );

}

function craftUrl( url ) {

    var { HTTP_PORT } = getProfile( );

    if ( url.indexOf( ':' ) === -1 )
        url = `http://localhost:${HTTP_PORT}${url}`;

    url += '?' + stringifyQueryString( gQueryParameters );

    return url;

}

function parseResponse( type, body ) {

    if ( type.match( /^application\/octet-stream($|;)/ ) )
        return new Buffer( body, 'binary' );

    if ( type.match( /^application\/json($|;)/ ) )
        return JSON.parse( body );

    return body;

}

export function registerQueryParameter( name, value ) {

    if ( value == null ) {

        delete gQueryParameters[ value ];

    } else {

        gQueryParameters[ name ] = value;

    }

}

export async function GET( url, parameters ) {

    return await request( { method : 'get', url : craftUrl( url ), qs : parameters, jar : true } ).then( ( { response, body } ) => {
        return { status : response.statusCode, data : parseResponse( response.headers[ 'content-type' ], body ) };
    } );

}

export async function POST( url, parameters ) {

    return await request( { method : 'post', url : craftUrl( url ), formData : parameters, jar : true } ).then( ( { response, body } ) => {
        return { status : response.statusCode, data : parseResponse( response.headers[ 'content-type' ], body ) };
    } );

}

export async function PATCH( url, parameters ) {

    return await request( { method : 'patch', url : craftUrl( url ), formData : parameters, jar : true } ).then( ( { response, body } ) => {
        return { status : response.statusCode, data : parseResponse( response.headers[ 'content-type' ], body ) };
    } );

}

export async function DELETE( url ) {

    return await request( { method : 'delete', url : craftUrl( url ), jar : true } ).then( ( { response, body } ) => {
        return { status : response.statusCode, data : parseResponse( response.headers[ 'content-type' ], body ) };
    } );

}
