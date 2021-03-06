import { format }         from 'node/url';

import { merge, without } from 'willikins/vendors/lodash';
import { request, jar }   from 'willikins/vendors/request';
import { clr }            from 'willikins/vendors/clicolor';

import { Database }       from 'willikins/db';
import { getProfile }     from 'willikins/profile';

let gTestSuite = null;

let gQueryParameters = null;

function reindent( indent, string ) {

    return String( string ).replace( /(^|\n)/g, '$1' + indent );

}

function summary( string ) {

    return String( string ).replace( /\n.*/g, '' );

}

class TestSuite {

    constructor( name ) {

        this.name = name;

        this.inits = [ ];
        this.tests = [ ];

    }

    async run( { showStack = false } = { } ) {

        let name = this.name;
        let succeed = true;

        // Reset the global query parameters
        gQueryParameters = { };

        for ( let [ description, runner ] of this.tests ) {

            let error = null;

            await Database.drop( );
            await Database.sync( );

            try {

                for ( let initfn of this.inits )
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
                    process.stdout.write( clr.red(   `\n${reindent('        ', error.stack||JSON.stringify(error))}\n\n` ) );
                } else {
                    process.stdout.write( clr.red(   `        ${summary(error)}\n` ) );
                }

                succeed = false;

            }

        }

        return succeed;

    }

}

export function describe( component, builder ) {

    let testSuite = new TestSuite( component );

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

    constructor( { protocol = 'http', hostname = 'localhost', port = null } = { } ) {

        if ( ! port )
            port = getProfile( ).HTTP_EX_PORT;

        if ( ! port )
            port = getProfile( ).HTTP_PORT;

        this._protocol = protocol;
        this._hostname = hostname;
        this._port = port;

        this._jar = jar( );
        this._headers = { };

    }

    static registerInterceptor( fn ) {

        if ( ! this._interceptors )
            this._interceptors = [ ];

        this._interceptors.push( fn );

    }

    static unregisterInterceptor( fn ) {

        if ( ! this._interceptors )
            return ;

        let index = this._interceptors.indexOf( fn );
        this._interceptors.splice( index, 1 );

    }

    setHeader( name, value ) {

        this._headers[ name ] = value;

    }

    unsetHeader( name, value ) {

        this._headers[ name ] = value;

    }

    GET( path, parameters ) {

        return this._execute( { method : 'get', url : this._craftUrl( path ), qs : parameters } );

    }

    POST( path, data, parameters ) {

        return this._execute( { method : 'post', url : this._craftUrl( path ), qs : parameters, formData : data } );

    }

    PATCH( path, data, parameters ) {

        return this._execute( { method : 'patch', url : this._craftUrl( path ), qs : parameters, formData : data } );

    }

    DELETE( path, parameters ) {

        return this._execute( { method : 'delete', url : this._craftUrl( path ), qs : parameters } );

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

    _execute( options ) {

        let promise = new Promise( ( resolve, reject ) => {

            for ( let interceptor of RequestBag._interceptors || [ ] )
                interceptor( promise );

            this._request( options ).then( resolve, reject );

        } );

        return promise;

    }

    _request( options ) {

        return request( merge( { jar : this._jar, headers : this._headers }, options ) ).then( ( { response, body } ) => {

            if ( response.statusCode >= 500 && response.statusCode < 600 ) {

                let data = body; try { data = JSON.parse( data ); } catch ( error ) { }
                let extraKeys = without( Object.keys( data ), 'message' );

                let maxLength = extraKeys.reduce( ( previous, key ) => Math.max( previous, key.length ), 0 );
                let extraData = extraKeys.map( key => `     + ${key}${' '.repeat(maxLength - key.length)}: ${JSON.stringify(data[key])}` ).join( '\n' );

                if ( extraKeys.length )
                    extraData = '\n\n' + extraData + '\n';

                throw new Error( `Server returned an error on ${options.url}: HTTP ${response.statusCode}: ${data.message}` + extraData );

            } else {

                return { status : response.statusCode, data : this._parseResponse( body, response.headers[ 'content-type' ] ) };


            }

        } );

    }

    _parseResponse( body, contentType ) {

        if ( contentType && ( contentType.match( /^application\/octet-stream($|;)/ ) || contentType.startsWith( 'image/' ) ) )
            return new Buffer( body, 'binary' );

        if ( contentType && ( contentType.match( /^application\/json($|;)/ ) ) )
            return JSON.parse( body );

        return body;

    }

}
