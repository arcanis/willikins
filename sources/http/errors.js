export class HttpError extends Error {

    constructor( status, data ) {

        this.name = 'HttpError';
        this.message = `${status} error`;

        this.status = status;
        this.data = data;

    }

}

export class Unimplemented extends HttpError {

    constructor( ) {

        super( 500, { message : 'Unimplemented' } );

        this.message = this.data.message;

    }

}

export class AccessDenied extends HttpError {

    constructor( ) {

        super( 401, { message : 'Access denied' } );

        this.message = this.data.message;

    }

}

export class MissingField extends HttpError {

    constructor( field ) {

        super( 422, { message : `Missing field (expected ${field})` } );

        this.message = this.data.message;

    }

}

export class ConflictingRequest extends HttpError {

    constructor( ) {

        super( 409, { message : 'Conflicting request' } );

        this.message = this.data.message;

    }

}

export class NotFound extends HttpError {

    constructor( ) {

        super( 404, { message : 'Not found' } );

        this.message = this.data.message;

    }

}
