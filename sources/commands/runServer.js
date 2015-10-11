import { Database } from 'willikins/db';
import { Server }   from 'willikins/http';

export let help = `

    Run the server - does not return

`;

export let options = [

];

export async function command( options ) {

    await Database.instance( );
    await Server.instance( );

    process.stdout.write( 'The server is now running.\n' );

    // Will never return
    await new Promise( ( ) => { } );

}
