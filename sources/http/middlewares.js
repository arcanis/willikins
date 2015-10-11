import { express }                                    from 'willikins/vendors/express';
import { Instance as SequelizeInstance }              from 'willikins/vendors/sequelize';

import { wrapAsyncController }                        from 'willikins/http/controllers';
import { UnsupportedMethod, NotFound, Unimplemented } from 'willikins/http/errors';

export class ModelActions {

    static async normalize( request, data ) {

        if ( data instanceof SequelizeInstance )
            return await this.fetch( request, data );

        return data;

    }

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

    return express( )

        .get( '/', wrapAsyncController( async ( request, response ) => {

            let data = await actions.index( request );

            if ( ! data.results )
                throw new Error( `Missing required "results" property` );

            data.results = await Promise.all( data.results.map( model => actions.normalize( request, model ) ) );

            return { status : 200, data };

        }, { defaultContentType : 'application/json' } ) )

        .post( '/', wrapAsyncController( async ( request, response ) => {

            let data = await actions.create( request );

            return { status : 201, data : await actions.normalize( request, data ) };

        }, { defaultContentType : 'application/json' } ) )

        .get( '/:id', wrapAsyncController( async ( request, response ) => {

            let data = await actions.get( request, request.params.id );

            if ( ! data )
                throw new NotFound( );

            return { status : 200, data : await actions.normalize( request, data ) };

        }, { defaultContentType : 'application/json' } ) )

        .patch( '/:id', wrapAsyncController( async ( request, response ) => {

            let data = await actions.get( request, request.params.id );

            if ( ! data )
                throw new NotFound( );

            await actions.update( request, data );

            return { status : 200, data : await actions.normalize( request, data ) };

        }, { defaultContentType : 'application/json' } ) )

        .delete( '/:id', wrapAsyncController( async ( request, response ) => {

            let data = await actions.get( request, request.params.id );

            if ( ! data )
                throw new NotFound( );

            await actions.destroy( request, data );

            return { status : 200, data : { } };

        }, { defaultContentType : 'application/json' } ) )

        .all( '/:id/:action', wrapAsyncController( async ( request, response ) => {

            let method = request.method.toLowerCase( );
            let camelcase = request.params.action.replace( /(?:^|-)([a-z])/g, ( all, letter ) => letter.toUpperCase( ) );
            let fnName = method + camelcase;

            if ( [ 'get', 'post', 'patch', 'delete' ].indexOf( method ) === -1 )
                throw new UnsupportedMethod( );

            if ( ! fnName in actions || fnName in Object.prototype )
                throw new NotFound( );

            let model = await actions.get( request, request.params.id );

            if ( ! model )
                throw new NotFound( );

            return await actions[ fnName ]( request, model );

        }, { defaultContentType : 'application/json' } ) )

     ;

}

export function wrapAsyncMiddleware( fn ) {

    return ( request, response, next ) => {

        Promise.resolve( ).then( ( ) => {

            return fn( request, response, next );

        } ).catch( error => {

            next( error );

        } );

    };


}
