import { basename }          from 'willikins/node/path';
import { Database }          from 'willikins/db';
import { getProjectModules } from 'willikins/project';

export var help = 'Synchronize the database to match the application schemas';

export var options = [

    { definition : '-f,--force F', type : 'boolean' }

];

export async function command( options ) {

    var modulePaths = await getProjectModules( 'models' );

    for ( var path of modulePaths ) {

        var modelName = basename( path );

        var module = await System.import( path );
        module[ modelName ].instance( );

    }

    await Database.sync( { force : options.force } );

}
