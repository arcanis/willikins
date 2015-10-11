import { basename, relative as relativePath } from 'node/path';

import { CommandSet }                         from 'willikins/cli';
import { importExternal }                     from 'willikins/project';

export let help = `

    Execute any command on the filesystem

    This command may execute any other command located on the filesystem as if it was part of the project. It is useful if you wish to create one-time-commands, that shouldn't be available from the regular command line.

    Note that you have to use the "--" separator before passing any parameter to the command - otherwise they will be interpreted as parameter of the exec command itself, and not your command.

    Ex: willikins exec /tmp/my-command.js -- --other-arg=10

`;

export let options = [

    { definition : 'command-path', required : true }

];

export async function command( options ) {

    let commandSet = new CommandSet( );

    let name = basename( options.commandPath, '.js' );
    let command = commandSet.createCommand( name );

    let module = await importExternal( options.commandPath );

    if ( module.help )
        command.setHelp( module.help );

    if ( module.command )
        command.setRunner( module.command );

    for ( let option of ( module.options || [ ] ) )
        command.addOption( option );

    let argv = options.slice( 1 );
    argv.unshift( name );

    return await commandSet.run( argv );

}
