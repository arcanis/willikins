import { relative as relativePath, dirname, basename } from 'willikins/node/path';
import { readdir }                                     from 'willikins/node/fs';

async function getFolderFiles( path ) {

    var resolvedPath = await System.locate( { name : path + '/index' } );

    if ( resolvedPath.indexOf( 'file:' ) === 0 )
	resolvedPath = resolvedPath.substr( 5 );

    var directory = dirname( resolvedPath );

    try {
        var files = await readdir( directory );
    } catch ( error ) {
        var files = [ ];
    }

    return files.map( file => path + '/' + file );

}

async function getFolderModules( path ) {

    var projectFiles = await getFolderFiles( path );

    var projectModules = projectFiles.filter( file => file.match( /\.js$/ ) );

    return projectModules.map( file => dirname( file ) + '/' + basename( file, '.js' ) );

}

var gProjectPaths = [ ];

export function addPathToProject( path ) {

    gProjectPaths.push( path );

}

export async function getProjectFiles( path ) {

    var files = [ ];

    for ( var projectPath of gProjectPaths )
        files = files.concat( await getFolderFiles( projectPath + '/' + path ) );

    return files;

}

export async function getProjectModules( path ) {

    var modules = [ ];

    for ( var projectPath of gProjectPaths )
        modules = modules.concat( await getFolderModules( projectPath + '/' + path ) );

    return modules;

}

export async function importExternal( path ) {

    var baseURL = System.baseURL;

    if ( baseURL.indexOf( 'file:' ) === 0 )
        baseURL = baseURL.substr( 5 );

    var relativeProfilePath = relativePath( baseURL, dirname( path ) + '/' + basename( path, '.js' ) );
    var module = await System.import( relativeProfilePath );

    return module;

}
