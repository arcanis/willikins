import { databaseController }          from 'willikins/http/controller';
import { AccessDenied, Unimplemented } from 'willikins/http/errors';

var express = require( 'express' );

export class ModelActions {

    static index( request ) {

        throw new Unimplemented( );

        // ex: return { results : await Model.findAll( ) }

    }

    static fetch( request, model ) {

        throw new Unimplemented( );

        // ex: return model.toJSON( )

    }

    static create( request, body ) {

        throw new Unimplemented( );

        // ex: return await Model.create( { } )

    }

    static update( request, model, body ) {

        throw new Unimplemented( );

        // ex: return await model.updateAttributes( { } )

    }

    static destroy( request, model ) {

        throw new Unimplemented( );

        // ex: await model.delete( );

    }

}

export function model( Model, actions, { identifier = 'id' } = { } ) {

    return express( )

        .get( '/', databaseController( async function ( request, response ) {

            var data = await actions.index( request );

            data.results = await Promise.all( data.results.map( model => actions.fetch( request, model ) ) );

            return { status : 200, data };

        } ) )

        .post( '/', databaseController( async function ( request, response ) {

            var model = await actions.create( request, request.body );

            return { status : 201, data : await actions.fetch( request, model ) };

        } ) )

        .get( '/:id', databaseController( async function ( request, response ) {

            var model = await Model.find( { where : { [identifier] : request.params.id } } );

            if ( ! model )
                throw new AccessDenied( );

            return { status : 200, data : await actions.fetch( request, model ) };

        } ) )

        .patch( '/:id', databaseController( async function ( request, response ) {

            var model = await Model.find( { where : { [identifier] : request.params.id } } );

            if ( ! model )
                throw new AccessDenied( );

            await actions.update( request, model, request.body );

            return { status : 200, data : await actions.fetch( request, model ) };

        } ) )

        .delete( '/:id', databaseController( async function ( request, response ) {

            var model = await Model.find( { where : { [identifier] : request.params.id } } );

            if ( ! model )
                throw new AccessDenied( );

            await actions.destroy( request, model );

            return { status : 200, data : { } };

        } ) )

        .all( '/:id/:action', databaseController( async function ( request, response ) {

            var method = request.method.toLowerCase( );
            var camelcase = request.params.action.replace( /(?:^|-)([a-z])/g, ( all, letter ) => letter.toUpperCase( ) );

            var normalized = method + camelcase;

            if ( [ 'get', 'post', 'patch', 'delete' ].indexOf( method ) === -1 )
                throw new AccessDenied( );

            if ( ! normalized in actions || normalized in Object.prototype )
                throw new AccessDenied( );

            var model = await Model.find( { where : { [identifier] : request.params.id } } );

            if ( ! model )
                throw new AccessDenied( );

            return await actions[ normalized ]( request, model );

        } ) )

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
