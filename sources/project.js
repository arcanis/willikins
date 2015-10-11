import { readdir }                                   from 'node/fs';
import { basename, dirname, extname, join, resolve } from 'node/path';

import { rc }                                        from 'willikins/vendors/rc';

async function getFolderFiles( path ) {

    let resolvedPath = await System.normalize( path + '/index' );

    if ( resolvedPath.indexOf( 'file:' ) === 0 )
	resolvedPath = resolvedPath.substr( 5 );

    let directory = dirname( resolvedPath );
    let files = null;

    try {
        files = await readdir( directory );
    } catch ( error ) {
        files = [ ];
    }

    return files.map( file => path + '/' + file );

}

async function getFolderModules( path ) {

    let projectFiles = await getFolderFiles( path );

    let projectModules = projectFiles.filter( file => file.match( /\.js$/ ) );

    return projectModules.map( file => dirname( file ) + '/' + basename( file, '.js' ) );

}

let gProjectPaths = [ ];

export function registerProjectAlias( alias, target ) {

    if ( ! target.startsWith( 'file://' ) )
        target = 'file://' + target;

    System.paths[ alias ] = target;

}

export function addPathToProject( path ) {

    gProjectPaths.push( path );

}

export async function getProjectFiles( path ) {

    let files = [ ];

    for ( let projectPath of gProjectPaths )
        files = files.concat( await getFolderFiles( projectPath + '/' + path ) );

    return files;

}

export async function getProjectModules( path ) {

    let modules = [ ];

    for ( let projectPath of gProjectPaths )
        modules = modules.concat( await getFolderModules( projectPath + '/' + path ) );

    return modules;

}

export async function importExternal( target ) {

    let base = stripFileProtocol( System.baseURL );
    let path = stripFileProtocol( target );

    if ( ! basename( path ).includes( '.' ) )
        path += '.js';

    if ( path[ 0 ] !== '/' )
        path = join( process.cwd( ), path );

    let relativeProfilePath = resolve( base, path );
    let module = await System.import( relativeProfilePath );

    return module;

}

export async function evaluateWillikinsrc( ) {

    let files = rc( 'willikins', { }, { }, ( ) => ( { } ) ).configs || [ ];
    let configuration = { };

    while ( files.length > 0 )
        Object.assign( configuration, await importExternal( files.shift( ) ) );

    return configuration;

}

export function stripFileProtocol( path ) {

    if ( ! path )
        return path;

    if ( path.startsWith( 'file://' ) )
        path = path.substr( 7 );

    return path;

}
