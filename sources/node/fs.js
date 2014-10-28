import { wrapAsync } from 'willikins/node';

var fs = require( 'fs' );

export var WriteStream = fs.WriteStream;
export var createWriteStream = fs.createWriteStream;
export var readdir = wrapAsync( fs.readdir );
