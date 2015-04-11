import { basename }          from 'willikins/node/path';

import { Database }          from 'willikins/db';
import { Server }            from 'willikins/http';
import { getProjectModules } from 'willikins/project';

export var help = 'Run application tests';

export var options = [

    {
        definition : '-o,--only COMPONENTS ...',
        help : 'Only run specified components tests'
    },

    {
        definition : '-k,--stacks',
        help : 'Display the full error stacks when errors happen'
    },

    {
        definition : '-s,--stats',
        help : 'Display handful stats about http requests after the tests have been executed'
    }

];

export async function command( options ) {

    await Server.start( );

    var tests = await getProjectModules( 'tests' );
    var succeed = true;

    if ( options.only )
        tests = tests.filter( module => options.only.indexOf( basename( module ) ) !== -1 );

    for ( var t = 0; t < tests.length; ++ t ) {

        if ( t > 0 )
            process.stdout.write( '\n' );

        var module = await System.import( tests[ t ] );

        await Database.drop( );
        await Database.sync( );

        if ( ! await module.testSuite.run( { showStack : options.stacks } ) ) {
            succeed = false;
        }

    }

    process.exit( succeed ? 0 : 1 );

}
