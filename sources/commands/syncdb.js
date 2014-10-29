import { Database } from 'willikins/db';

export var help = 'Synchronize the database to match the application schemas';

export var options = [

    { definition : '-f,--force F', type : 'boolean' }

];

export async function command( options ) {

    await Database.sync( { force : options.force } );

}
