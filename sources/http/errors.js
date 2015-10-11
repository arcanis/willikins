import { merge } from 'willikins/vendors/lodash';

export class HttpError extends Error {

    constructor( status, data = { } ) {

        super( );

        this.name = 'HttpError';
        this.message = data.message || `${status} error`;

        this.status = status;
        this.data = data;

    }

}

export class ServerError extends HttpError {

    constructor( details = null ) {

        super( 500, merge( { message : 'Internal server error' }, details ) );

    }

}

export class Unimplemented extends HttpError {

    constructor( details = null ) {

        super( 501, merge( { message : 'Unimplemented' }, details ) );

    }

}

export class Unauthorized extends HttpError {

    constructor( details = null ) {

        super( 401, merge( { message : 'Unauthorized' }, details ) );

    }

}

export class Forbidden extends HttpError {

    constructor( details = null ) {

        super( 403, merge( { message : 'Forbidden' }, details ) );

    }

}

export class UnsupportedMethod extends HttpError {

    constructor( details = null ) {

        super( 405, merge( { message : 'Unsupported method' }, details ) );

    }

}

export class Incomplete extends HttpError {

    constructor( details = null ) {

        super( 422, merge( { message : 'Incomplete' }, details ) );

    }

}

export class Invalid extends HttpError {

    static checkValues( checks ) {

        let errors = [ ];

        for ( let [ message, status ] of Object.entries( checks ) )
            if ( ! status ) errors.push( message );

        if ( errors.length === 0 )
            return ;

        throw new this( { errors } );

    }

    constructor( details = null ) {

        super( 422, merge( { message : 'Invalid' }, details ) );

    }

}

export class Conflicting extends HttpError {

    constructor( details = null ) {

        super( 409, merge( { message : 'Conflict' }, details ) );

    }

}

export class NotFound extends HttpError {

    constructor( details = null ) {

        super( 404, merge( { message : 'Not found' }, details ) );

    }

}
