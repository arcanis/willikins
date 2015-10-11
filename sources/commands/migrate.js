import { basename }                         from 'node/path';

import { compare, rcompare, maxSatisfying } from 'willikins/vendors/semver';
import { lt, lte, gt, gte, eq }             from 'willikins/vendors/semver';

import { Willikins }                        from 'willikins/models/Willikins';
import { Database }                         from 'willikins/db';
import { getProjectModules }                from 'willikins/project';

export let help = `

    Run every migration until the specified version

    If [target] is missing, it is assumed to be the highest possible version. Otherwise, it is interpreted as a semver version descriptor, and will try to migrate up to the highest matching version (so if missing, it is actually equal to '*').

    If the highest version resolved by [target] is still lower than the current database version, then it means that the database will have to downgrade. In such an event, you will have to explicitely pass the -f option to force the downgrade (since it might lead to data loss).

`;

export let options = [

    { definition : '-f,--force', type : 'boolean' },

    { definition : 'target' }

];

export async function command( options ) {

    await Willikins.sync( );

    let dbVersionEntry = await Willikins.find( { where : { name : 'dbVersion' } } );

    if ( ! dbVersionEntry )
        dbVersionEntry = await Willikins.create( { name : 'dbVersion', value : '0.0.0' } );

    let dbVersion = dbVersionEntry.value;

    let migrationFiles = await getProjectModules( 'migrations' );
    let migrationList = migrationFiles.map( path => ( { version : basename( path ), path } ) );

    let versions = [ '0.0.0' ].concat( migrationList.map( migration => migration.version ) );
    let target = maxSatisfying( versions, options.target || '*' );

    if ( eq( dbVersion, target ) ) {
        process.stdout.write( 'Already up-to-date.\n' );
        return 0;
    }

    if ( gt( dbVersion, target ) && ! options.force ) {
        process.stdout.write( `The database is already set up against ${dbVersion}. Use --force if you really wish to downgrade.\n` );
        return 1;
    }

    let goForward = gt( target, dbVersion );

    let filter = goForward ? migration => ( gt( migration.version, dbVersion ) && lte( migration.version, target ) ) : migration => ( lte( migration.version, dbVersion ) && gt( migration.version, target ) );
    let comparator = goForward ? ( a, b ) => compare( a.version, b.version ) : ( a, b ) => rcompare( a.version, b.version );
    let method = goForward ? 'up' : 'down';

    let migrations = migrationList.filter( filter ).sort( comparator );

    let sequelize = await Database.instance( );
    let queryInterface = sequelize.getQueryInterface( );

    for ( let t = 0, T = migrations.length; t < T; ++ t ) {

        let migration = migrations[ t ];
        let next = migrations[ t + 1 ];

        process.stdout.write( `Applying ${migration.version} ${method} migration...\n` );

        let module = await System.import( migration.path );
        let fn = module[ method ];

        await fn( sequelize, queryInterface );

        await dbVersionEntry.updateAttributes( {
            value : goForward ? migration.version : next ? next.version : target
        } );

    }

    process.stdout.write( `The database has been migrated into ${target}.\n` );

    return 0;

}
