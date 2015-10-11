import { basename, dirname } from 'node/path';

import { clr }               from 'willikins/vendors/clicolor';
import { BadCommandError }   from 'willikins/cli';
import { getProjectModules } from 'willikins/project';

export let help = `

    Print a summary of all available commands

    If the [command] parameter is specified, print the full help of the specified command instead.

`;

export let options = [

    { definition : 'command' }

];

function formatShortHelp( text ) {

    if ( ! text )
        return null;

    // Remove empty lines
    text = text.replace( /^\s*[\r\n]/gm, '' );

    // Select the first line only
    text = text.split( /[\r\n]+/ )[ 0 ];

    // Trim it
    text = text.trim( );

    if ( ! text )
        return null;

    return text;

}

function formatFullHelp( text, prefix = '' ) {

    if ( ! text )
        return null;

    let splitSize = 80 - prefix.length;

    // Trim the text
    text = text.trim( );

    if ( ! text )
        return null;

    // Split the lines
    let lines = text.split( /\n/g );

    // Splits the line in segments of less than NN characters
    for ( text = ''; lines.length > 0; ) {

        // Shift the front line
        let line = lines.shift( ).trim( );

        if ( line.length <= 80 ) {

            // If it is less than the desired size, we just push it unmodified.
            text += prefix + line + '\n';

        } else {

            // Otherwise, we break it in two and loop.
            let sub = line.substr( 0, splitSize );
            let index = sub.lastIndexOf( ' ' );

            if ( index < splitSize * .8 )
                index = sub.length;

            lines.unshift( line.substr( index ) );
            lines.unshift( line.substr( 0, index ) );

        }

    }

    return text;


}

export async function generic( options ) {

    let sections = new Map( );

    for ( let path of await getProjectModules( 'commands' ) ) {

        let section = dirname( path );
        let file = basename( path );

        if ( ! sections.has( section ) )
            sections.set( section, [ ] );

        let name = file.replace( /[A-Z]/g, letter => `-${letter.toLowerCase()}` );
        let help = ( await System.import( path ) ).help;

        sections.get( section ).push( { name, help } );

    }

    let profileString = options.profile ? `--profile ${options.profile} ` : '';

    process.stdout.write( `\n` );
    process.stdout.write( `  willikins ${profileString}<command> [args...]\n` );
    process.stdout.write( `\n` );
    process.stdout.write( clr.bold( `Available commands:\n` ) );
    process.stdout.write( `\n` );

    let maxLength = Math.max( ... [ for ( commands of sections.values( ) ) commands.reduce( ( max, { name } ) => Math.max( max, name.length ), 0 ) ] );

    for ( let [ section, commands ] of sections ) {

        process.stdout.write( `  ${clr.cyan.bold(section)}\n` );
        process.stdout.write( `\n` );

        for ( let { name, help } of commands )
            process.stdout.write( `    ${clr.bold(name)}${' '.repeat(maxLength - name.length)}   ${formatShortHelp(help)}\n` );

        process.stdout.write( `\n` );

    }

    return 0;

}

export async function specific( options ) {

    let expectedCommand = options.command;

    let command = null;

    for ( let path of await getProjectModules( 'commands' ) ) {

        let section = dirname( path );
        let file = basename( path );

        let name = file.replace( /[A-Z]/g, letter => `-${letter.toLowerCase()}` );

        if ( name !== expectedCommand )
            continue ;

        let { help, options } = ( await System.import( path ) );
        command = { help, options };

        break ;

    }

    if ( ! command )
        throw new BadCommandError( expectedCommand );

    let isPositional = definition => definition.match( /^[a-z:-]+$/ );

    let optString = command.options.slice( ).sort( ( a, b ) => {

        if ( isPositional( b.definition ) && ! isPositional( a.definition ) ) return -1;
        if ( isPositional( a.definition ) && ! isPositional( b.definition ) ) return +1;

        if ( a.required && ! b.required ) return -1;
        if ( b.required && ! a.required ) return +1;

        if ( a.definition < b.definition ) return -1;
        if ( a.definition > b.definition ) return +1;

        return 0;

    } ).map( ( { definition, positional, required } ) => {

        if ( ! required )
            definition = `[${definition}]`;

        if ( required && isPositional( definition ) )
            definition = `<${definition}>`;

        return definition;

    } ).join( ' ' );

    if ( optString !== '' )
        optString = ' ' + optString;

    let profileString = options.profile ? `--profile ${options.profile} ` : '';

    process.stdout.write( `\n` );
    process.stdout.write( `  willikins ${profileString}${expectedCommand}${optString}\n` );
    process.stdout.write( `\n` );

    let commandOptions = command.options.map( option => [ option, formatShortHelp( option.help ) ] ).filter( ( [ option, help ] ) => Boolean( help ) );
    let commandDetails = formatFullHelp( command.help, '  ' );

    if ( commandOptions.length > 0 ) {

        let maxLength = Math.max( ... commandOptions.map( ( [ option, help ] ) => option.definition.length ) );

        process.stdout.write( clr.bold( `Noteworthy options:\n` ) );
        process.stdout.write( `\n` );
        process.stdout.write( [ for ( [ option, help ] of commandOptions ) `  ${option.definition}${' '.repeat(maxLength - option.definition.length)}   ${help}` ].join( '\n' ) + '\n' );
        process.stdout.write( `\n` );

    }

    if ( commandDetails ) {

        process.stdout.write( clr.bold( `Full details:\n` ) );
        process.stdout.write( `\n` );
        process.stdout.write( commandDetails );
        process.stdout.write( `\n` );

    }

    return 0;

}

export async function command( options ) {

    if ( ! options.command ) {

        return generic( options );

    } else {

        return specific( options );

    }

}
