import { getProfile } from 'willikins/profile';

export class Server {

    static async _setup( ) {

        let { SERVER_BUILDER } = getProfile( );

        return await SERVER_BUILDER( );

    }

    static async instance( ) {

        if ( ! this._serverPromise )
            this._serverPromise = this._setup( );

        return await this._serverPromise;

    }

}
