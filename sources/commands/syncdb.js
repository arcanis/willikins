import { compare, rcompare, maxSatisfying } from 'willikins/vendors/semver';

import { Willikins }                        from 'willikins/models/Willikins';
import { basename }                         from 'willikins/node/path';
import { Database }                         from 'willikins/db';
import { getProjectModules }                from 'willikins/project';

export var help = 'Synchronize the database to match the application schemas';

export var options = [

    { definition : '-f,--force', type : 'boolean' }

];

export async function command( options ) {

    await Database.sync( { force : options.force } );

    let migrationFiles = await getProjectModules( 'migrations' );
    let migrationList = migrationFiles.map( path => ( { version : basename( path ), path } ) );

    let versions = [ '0.0.0' ].concat( migrationList.map( migration => migration.version ) );
    let target = maxSatisfying( versions, options.length > 0 ? options[ 0 ] : '*' );

    await Willikins.findOrCreate( { where : { name : 'dbVersion' }, default : { value : target } } );

}
