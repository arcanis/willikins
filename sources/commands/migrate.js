import { compare, rcompare, eq, lt, gt, maxSatisfying } from 'willikins/vendors/semver';

import { Willikins }                                    from 'willikins/models/Willikins';
import { basename }                                     from 'willikins/node/path';
import { Database }                                     from 'willikins/db';
import { getProjectModules }                            from 'willikins/project';

export var help = 'Run every migration until the specified version';

export var options = [

    { definition : '-f,--force', type : 'boolean' }

];

export async function command( options ) {

    await Willikins.sync( );

    var dbVersionEntry = await Willikins.find( { where : { name : 'dbVersion' } } );

    if ( ! dbVersionEntry )
        dbVersionEntry = await Willikins.create( { name : 'dbVersion', value : '0.0.0' } );

    var dbVersion = dbVersionEntry.value;

    var migrationFiles = await getProjectModules( 'migrations' );
    var migrationList = migrationFiles.map( path => ( { version : basename( path ), path } ) );

    var versions = [ '0.0.0' ].concat( migrationList.map( migration => migration.version ) );
    var target = maxSatisfying( versions, options.length > 0 ? options[ 0 ] : '*' );

    if ( eq( dbVersion, target ) ) {
        process.stdout.write( 'Already up-to-date.\n' );
        return ;
    }

    if ( gt( dbVersion, target ) && ! options.force ) {
        process.stdout.write( `The database is already set up against ${dbVersion}. Use --force if you really wish to downgrade.\n` );
        return ;
    }

    var goForward = gt( target, dbVersion );

    var filter = goForward ? migration => gt( migration.version, dbVersion ) : version => lt( migration.version, dbVersion );
    var comparator = goForward ? ( a, b ) => compare( a.version, b.version ) : ( a, b ) => rcompare( a.version, b.version );
    var method = goForward ? 'up' : 'down';

    var migrations = migrationList.filter( filter ).sort( comparator );

    var database = await Database.instance( );
    var queryInterface = database.getQueryInterface( );

    for ( var migration of migrations ) {

        process.stdout.write( `Applying ${migration.version} migration...\n` );

        var module = await System.import( migration.path );
        var fn = module[ method ];

        await fn( queryInterface );

    }

    dbVersionEntry.value = target;
    await dbVersionEntry.save( );

    process.stdout.write( `The database has been migrated into ${target}.` );

}
