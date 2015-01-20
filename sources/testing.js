import { format }       from 'willikins/node/url';

import { merge }        from 'willikins/vendors/lodash';
import { request, jar } from 'willikins/vendors/request';

import { Database }     from 'willikins/db';
import { getProfile }   from 'willikins/profile';

var clr = require( 'cli-color' );

var gTestSuite = null;

var gQueryParameters = null;

function reindent( indent, string ) {

    return string.replace( /(^|\n)/g, '$1' + indent );

}

class TestSuite {

    constructor( name ) {

        this.name = name;

        this.inits = [ ];
        this.tests = [ ];

    }

    async run( { showStack = false } = { } ) {

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

                if ( showStack ) {
                    process.stdout.write( clr.red(   `\n${reindent('        ', error.stack)}\n\n` ) );
                } else {
                    process.stdout.write( clr.red(   `        ${error}\n` ) );
                }

                succeed = false;

            }

        }

        return succeed;

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

export function GET( url, parameters ) {

    return new RequestBag( ).GET( url, parameters );

}

export function POST( url, parameters ) {

    return new RequestBag( ).POST( url, parameters );

}

export function PATCH( url, parameters ) {

    return new RequestBag( ).PATCH( url, parameters );

}

export function DELETE( url ) {

    return new RequestBag( ).DELETE( url );

}

export class RequestBag {

    constructor( { protocol = 'http', hostname = 'localhost', port = getProfile( ).HTTP_PORT } = { } ) {

        this._protocol = protocol;
        this._hostname = hostname;
        this._port = port;

        this._jar = jar( );
        this._headers = { };

    }

    setHeader( name, value ) {

        this._headers[ name ] = value;

    }

    unsetHeader( name, value ) {

        this._headers[ name ] = value;

    }

    GET( path, parameters ) {

        return this._request( { method : 'get', url : this._craftUrl( path ), qs : parameters } );

    }

    POST( path, data ) {

        return this._request( { method : 'post', url : this._craftUrl( path ), formData : data } );

    }

    PATCH( path, data ) {

        return this._request( { method : 'patch', url : this._craftUrl( path ), formData : data } );

    }

    DELETE( path ) {

        return this._request( { method : 'delete', url : this._craftUrl( path ) } );

    }

    _craftUrl( path ) {

        if ( path.indexOf( ':' ) !== -1 )
            return path;

        return format( {
            protocol : this._protocol,
            hostname : this._hostname,
            port : this._port,
            pathname : path
        } );

    }

    _request( options ) {

        return request( merge( { jar : this._jar, headers : this._headers }, options ) ).then( ( { response, body } ) => {

            if ( response.statusCode >= 500 && response.statusCode < 600 ) {

                var data = body; try { data = JSON.parse( data ); } catch ( error ) { }
                throw new Error( `Server returned an error on ${options.url}: ${JSON.stringify(data.message || data)}` );

            } else {

                return { status : response.statusCode, data : this._parseResponse( body, response.headers[ 'content-type' ] ) };

            }

        } );

    }

    _parseResponse( body, type ) {

        if ( type && type.match( /^application\/octet-stream($|;)/ ) )
            return new Buffer( body, 'binary' );

        if ( type && type.match( /^application\/json($|;)/ ) )
            return JSON.parse( body );

        return body;

    }

}
