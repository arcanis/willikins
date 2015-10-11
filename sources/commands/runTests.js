import { basename }          from 'node/path';

import { Database }          from 'willikins/db';
import { Server }            from 'willikins/http';
import { getProjectModules } from 'willikins/project';

export let help = `

    Run the application tests

    If [components] is specified, only the specified components will be tested.

`;

export let options = [

    {
        definition : '-k,--stacks',
        help : 'Display the full error stacks when errors happen'
    },

    {
        definition : '-s,--stats',
        help : 'Display handful stats about http requests after the tests have been executed'
    },

    {
        definition : 'components ...'
    }

];

export async function command( options ) {

    await Database.instance( );
    await Server.instance( );

    let tests = await getProjectModules( 'tests' );
    let succeed = true;

    if ( options.components )
        tests = tests.filter( module => options.components.includes( basename( module ) ) );

    for ( let t = 0; t < tests.length; ++ t ) {

        if ( t > 0 )
            process.stdout.write( '\n' );

        let module = await System.import( tests[ t ] );

        await Database.drop( );
        await Database.sync( );

        if ( ! await module.testSuite.run( { showStack : options.stacks } ) ) {
            succeed = false;
        }

    }

    process.exit( succeed ? 0 : 1 );

}
