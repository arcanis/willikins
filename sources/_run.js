import { basename, dirname, join, relative, resolve }                                                  from 'node/path';

import { CommandSet }                                                                                  from 'willikins/cli';
import { getProfile, setProfile }                                                                      from 'willikins/profile';
import { addPathToProject, evaluateWillikinsrc, getProjectModules, importExternal, stripFileProtocol } from 'willikins/project';

export default async function ( argv ) {

    // First we load the .willikinsrc file, if any
    let willikinsrc = await evaluateWillikinsrc( );

    // Willikins will load commands & models from its own directory
    addPathToProject( 'willikins' );

    // We create a basic commandline descriptor, with only the --profile option
    let commandSet = new CommandSet( ).addOption( { definition : '--profile PATH', required : ! willikinsrc.WILLIKINS_APPLICATION_PROFILES_DEFAULT } );

    // Then we parse it a first time in order to extract the profile
    let { profile } = await commandSet.parse( argv );

    // Resolve the profile directory based on the willikinsrc options
    if ( willikinsrc.WILLIKINS_APPLICATION_PROFILES_DEFAULT && ! profile )
        profile = willikinsrc.WILLIKINS_APPLICATION_PROFILES_DEFAULT;
    if ( willikinsrc.WILLIKINS_APPLICATION_PROFILES_BASE && profile[ 0 ] !== '/' )
        profile = resolve( stripFileProtocol( willikinsrc.WILLIKINS_APPLICATION_PROFILES_BASE ), profile );

    // We load the profile from wherever it is located
    setProfile( await importExternal( profile ) );

    // We will keep a reference on the 'help' command runner
    let helpRunner = null;

    // We iterate over each of the project commands to register them
    for ( let path of await getProjectModules( 'commands' ) ) {

        let name = basename( path ).replace( /[A-Z]/g, letter => `-${letter.toLowerCase()}` );
        let command = commandSet.createCommand( name );

        let { help, command : runner, options = [ ] } = await System.import( path );

        // Save the 'help' command reference
        if ( name === 'help' ) helpRunner = runner;

        // Set the command help text
        command.setHelp( help ? help : 'Missing help entry' );

        // Add a "-h" option as a shortcut to "willikins help <command>"
        command.addOption( { definition : '-h,--help', type : 'boolean' } );

        // Add every defined option to the command definition
        for ( let option of options ) command.addOption( option );

        // Wrap the actual runner to check if the "-h" option is there
        command.setRunner( options => options.help ? helpRunner( Object.assign( [ ], { profile : options.profile, command : name } ) ) : runner( options.validate( ) ) );

    }

    // And finally we can run the command line
    return await commandSet.run( argv );

}
