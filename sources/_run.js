import { basename }                                            from 'willikins/node/path';
import { CommandSet }                                          from 'willikins/cli';
import { setProfile }                                          from 'willikins/profile';
import { addPathToProject, getProjectModules, importExternal } from 'willikins/project';

function wrapCommand( command ) {

    return async function ( options ) {

        var profile = await importExternal( options.profile );

        setProfile( profile );

        return await command( options );

    };

}

export default async function( ) {

    if ( process.getuid( ) === 0 || process.getgid( ) === 0 )
        throw new Error( 'Please don\'t run Willikins as root' );

    addPathToProject( 'willikins' );
    addPathToProject( 'app' );

    var modulePaths = await getProjectModules( 'commands' );
    var commandSet = new CommandSet( );

    commandSet.addOption( {
        definition : '-p,--profile PATH',
        required : true
    } );

    for ( var path of modulePaths ) {

        var name = basename( path ).replace( /[A-Z]/, letter => `-${letter.toLowerCase()}` );
        var command = commandSet.createCommand( name );

        var module = await System.import( path );

        if ( module.help )
            command.setHelp( module.help );

        if ( module.command )
            command.setRunner( wrapCommand( module.command ) );

        for ( var option of ( module.options || [ ] ) ) {
            command.addOption( option );
        }

    }

    return await commandSet.run( process.argv.slice( 2 ) );

}
