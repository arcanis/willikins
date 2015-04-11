import { SequelizeInstance }                          from 'willikins/vendors/sequelize';

import { controller }                                 from 'willikins/http/controller';
import { UnsupportedMethod, NotFound, Unimplemented } from 'willikins/http/errors';

var express = require( 'express' );

export class ModelActions {

    static index( request ) {

        throw new Unimplemented( );

        // ex: return { results : await Model.findAll( ) }

    }

    static get( request, id ) {

        throw new Unimplemented( );

        // ex: return { results : await Model.find( { where : { id } } ) }

    }

    static fetch( request, model ) {

        throw new NotFound( );

        // ex: return model.toJSON( )

    }

    static create( request ) {

        throw new NotFound( );

        // ex: return await Model.create( { } )

    }

    static update( request, model ) {

        throw new NotFound( );

        // ex: return await model.updateAttributes( { } )

    }

    static destroy( request, model ) {

        throw new NotFound( );

        // ex: await model.delete( );

    }

}

export function restInterface( actions ) {

    var normalize = async ( request, data ) => data instanceof SequelizeInstance
        ? await actions.fetch( request, data ) : data;

    return express( )

        .get( '/', controller( async function ( request, response ) {

            var data = await actions.index( request );

            data.results = await Promise.all( data.results.map( model => normalize( request, model ) ) );

            return { status : 200, data };

        }, { defaultContentType : 'application/json' } ) )

        .post( '/', controller( async function ( request, response ) {

            var data = await actions.create( request );

            return { status : 201, data : await normalize( request, data ) };

        }, { defaultContentType : 'application/json' } ) )

        .get( '/:id', controller( async function ( request, response ) {

            var data = await actions.get( request, request.params.id );

            if ( ! data )
                throw new NotFound( );

            return { status : 200, data : await normalize( request, data ) };

        }, { defaultContentType : 'application/json' } ) )

        .patch( '/:id', controller( async function ( request, response ) {

            var data = await actions.get( request, request.params.id );

            if ( ! data )
                throw new NotFound( );

            await actions.update( request, data );

            return { status : 200, data : await normalize( request, data ) };

        }, { defaultContentType : 'application/json' } ) )

        .delete( '/:id', controller( async function ( request, response ) {

            var data = await actions.get( request, request.params.id );

            if ( ! data )
                throw new NotFound( );

            await actions.destroy( request, data );

            return { status : 200, data : { } };

        }, { defaultContentType : 'application/json' } ) )

        .all( '/:id/:action', controller( async function ( request, response ) {

            var method = request.method.toUpperCase( );
            var camelcase = request.params.action.replace( /(?:^|-)([a-z])/g, ( all, letter ) => letter.toUpperCase( ) );
            var fnName = method + '_' + camelcase;

            if ( [ 'GET', 'POST', 'PATCH', 'DELETE' ].indexOf( method ) === -1 )
                throw new MethodNotAllowed( );

            if ( ! fn in actions || fn in Object.prototype )
                throw new NotFound( );

            var model = actions.get( request, request.params.id );

            if ( ! model )
                throw new AccessDenied( );

            return await actions[ fn ]( request, model );

        }, { defaultContentType : 'application/json' } ) )

     ;

}

export function middleware( fn ) {

    var wrapper = function ( ... argv ) {

        Promise.resolve( fn( ... argv ) ).catch( error => {

            setImmediate( ( ) => { throw error; } );

        } );

    };

    switch ( fn.length ) {

    case 0: return ( ) => wrapper( );
    case 1: return ( a ) => wrapper( a );
    case 2: return ( a, b ) => wrapper( a, b );
    case 3: return ( a, b, c ) => wrapper( a, b, c );
    case 4: return ( a, b, c, d ) => wrapper( a, b, c, d );

    default: throw new Error( `Wrong parameter count (got ${fn.length})` );

    }

}
