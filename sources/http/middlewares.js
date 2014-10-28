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

        }, { json : true } ) )

        .post( '/', databaseController( async function ( request, response ) {

            var model = await actions.create( request, request.body );

            return { status : 201, data : await actions.fetch( request, model ) };

        }, { json : true } ) )

        .get( '/:id', databaseController( async function ( request, response ) {

            var model = await Model.find( { where : { [identifier] : request.params.id } } );

            if ( ! model )
                throw new AccessDenied( );

            return { status : 200, data : await actions.fetch( request, model ) };

        }, { json : true } ) )

        .patch( '/:id', databaseController( async function ( request, response ) {

            var model = await Model.find( { where : { [identifier] : request.params.id } } );

            if ( ! model )
                throw new AccessDenied( );

            await actions.update( request, model, request.body );

            return { status : 200, data : await actions.fetch( request, model ) };

        }, { json : true } ) )

        .delete( '/:id', databaseController( async function ( request, response ) {

            var model = await Model.find( { where : { [identifier] : request.params.id } } );

            if ( ! model )
                throw new AccessDenied( );

            await actions.destroy( request, model );

            return { status : 200, data : { } };

        }, { json : true } ) )

     ;

}

export function middleware( fn ) {

    return function ( request, response, next ) {

        Promise.resolve( fn( request, response, next ) ).catch( error => {

            setImmediate( ( ) => { throw error; } );

        } );

    };

}
