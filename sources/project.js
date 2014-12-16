import { relative as relativePath, join as joinPaths, dirname, basename } from 'willikins/node/path';
import { readdir }                                                        from 'willikins/node/fs';

async function getFolderFiles( path ) {

    var directory = dirname( await System.locate( { name : joinPaths( path, 'index' ) } ) );

    if ( directory.indexOf( 'file:' ) === 0 )
        directory = directory.substr( 5 );

    try {
        var files = await readdir( directory );
    } catch ( error ) {
        var files = [ ];
    }

    return files.map( file => joinPaths( path, file ) );

}

async function getFolderModules( path ) {

    var projectFiles = await getFolderFiles( path );

    var projectModules = projectFiles.filter( file => file.match( /\.js$/ ) );

    return projectModules.map( file => joinPaths( dirname( file ), basename( file, '.js' ) ) );

}

var gProjectPaths = [ ];

export function addPathToProject( path ) {

    gProjectPaths.push( path );

}

export async function getProjectFiles( path ) {

    var files = [ ];

    for ( var projectPath of gProjectPaths )
        files = files.concat( await getFolderFiles( joinPaths( projectPath, path ) ) );

    return files;

}

export async function getProjectModules( path ) {

    var modules = [ ];

    for ( var projectPath of gProjectPaths )
        modules = modules.concat( await getFolderModules( joinPaths( projectPath, path ) ) );

    return modules;

}

export async function importExternal( path ) {

    var baseURL = System.baseURL;

    if ( baseURL[ 0 ].indexOf( 'file:' ) === 0 )
        baseURL = baseURL.substr( 5 );

    var relativeProfilePath = relativePath( System.baseURL, joinPaths( dirname( path ), basename( path, '.js' ) ) );
    var module = await System.import( relativeProfilePath );

    return module;

}
