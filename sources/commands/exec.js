import { basename, relative as relativePath } from 'willikins/node/path';
import { CommandSet }                         from 'willikins/cli';
import { importExternal }                     from 'willikins/project';

export var help = 'Execute any command on the filesystem';

export var options = [

];

export async function command( options ) {

    var commandSet = new CommandSet( );

    var name = basename( options[ 0 ], '.js' );
    var command = commandSet.createCommand( name );

    var module = await importExternal( options[ 0 ] );

    if ( module.help )
        command.setHelp( module.help );

    if ( module.command )
        command.setRunner( module.command );

    for ( var option of ( module.options || [ ] ) )
        command.addOption( option );

    var argv = options.slice( 1 );
    argv.unshift( name );

    await commandSet.run( argv );

}
