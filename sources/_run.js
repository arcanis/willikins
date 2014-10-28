import { basename, dirname, relative as relativePath, join as joinPaths } from 'willikins/node/path';
import { CommandSet }                                                     from 'willikins/cli';
import { setProfile }                                                     from 'willikins/profile';
import { addPathToProject, getProjectModules }                            from 'willikins/project';

function wrapCommand( command ) {

    return async function ( options ) {

        var relativeProfilePath = relativePath( System.baseURL, joinPaths( dirname( options.profile ), basename( options.profile, '.js' ) ) );
        var profile = await System.import( relativeProfilePath );

        setProfile( profile );

        return command( options );

    };

}

export default async function( ) {

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

    return commandSet.run( process.argv.slice( 2 ) );

}
