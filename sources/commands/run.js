import { Database }   from 'willikins/db';
import { Server }     from 'willikins/http';

export var help = 'Run the server';

export var options = [

];

export async function command( options ) {

    await Database.instance( );
    await Server.instance( );

    process.stdout.write( 'Server launched\n' );

}
