import { basename }                         from 'node/path';

import { compare, rcompare, maxSatisfying } from 'willikins/vendors/semver';

import { Willikins }                        from 'willikins/models/Willikins';
import { Database }                         from 'willikins/db';
import { getProjectModules }                from 'willikins/project';

export let help = `

    Synchronize the database to match the application schemas

    This command creates missing tables in the database. If the "--force" option is toggled on, the table will be systematically erased if they exist, then rebuilt.

    It is heavily advised to not use this command except in a development environment - use the migrate command instead to safely upgrade your database schema.

    Once this command returns, the database version will be the highest available version from your migrations.

`;

export let options = [

    { definition : '-f,--force', type : 'boolean' }

];

export async function command( options ) {

    await Database.sync( { force : options.force } );

    let migrationFiles = await getProjectModules( 'migrations' );
    let migrationList = migrationFiles.map( path => ( { version : basename( path ), path } ) );

    let versions = [ '0.0.0' ].concat( migrationList.map( migration => migration.version ) );
    let target = maxSatisfying( versions, options.length > 0 ? options[ 0 ] : '*' );

    await Willikins.findOrCreate( { where : { name : 'dbVersion' }, defaults : { value : target } } );

}
