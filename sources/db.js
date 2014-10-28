import { Sequelize }                      from 'willikins/vendors/sequelize';

import { WriteStream, createWriteStream } from 'willikins/node/fs';
import { basename }                       from 'willikins/node/path';
import { getProfile }                     from 'willikins/profile';
import { getProjectModules }              from 'willikins/project';

async function applyRelation( instance, relation ) {

    if ( relation.hasOwnProperty( 'belongsTo' ) )
        return instance.belongsTo( await relation.belongsTo.instance( ), relation );

    if ( relation.hasOwnProperty( 'hasMany' ) )
        return instance.hasMany( await relation.hasMany.instance( ), relation );

    if ( relation.hasOwnProperty( 'hasOne' ) )
        return instance.hasOne( await relation.hasOne.instance( ), relation );

    throw new Error( 'Invalid relation' );

}

function makeLogger( target ) {

    if ( ! target )
        return false;

    if ( typeof target === 'function' )
        return target;

    var stream = target instanceof WriteStream ? createWriteStream( target ) : target;

    return data => { stream.write( data + '\n' ); };

}

export class Database {

    constructor( ) {

        throw new Error( 'This class is not instanciable' );

    }

    static async instance( ) {

        if ( this._instance )
            return this._instance;

        var profile = getProfile( );

        var { DB_NAME, DB_USER, DB_PASS, DB_DIALECT, DB_STORAGE, LOGS_SQL } = getProfile( );

        this._instance = new Sequelize( DB_NAME, DB_USER, DB_PASS, {
            logging : makeLogger( LOGS_SQL ),
            dialect : DB_DIALECT,
            storage : DB_STORAGE
        } );

        for ( var path of await getProjectModules( 'models' ) ) {
            var module = await System.import( path );
            await module[ basename( path ) ].instance( );
        }

        return this._instance;

    }

    static async drop( ... argv ) {

        var db = await this.instance( );

        return await db.drop( ... argv );

    }

    static async sync( ... argv ) {

        var db = await this.instance( );

        return await db.sync( ... argv );

    }

    static async define( ... argv ) {

        var db = await this.instance( );

        return db.define( ... argv );

    }

}

export class Model {

    constructor( ) {

        throw new Error( 'This class is not instanciable' );

    }

    static relations( ) { return [

    ] }

    static async instance( ) {

        if ( this._instance )
            return this._instance;

        var schema = this.schema( );

        this._instance = await Database.define( schema.name, schema.fields, schema.options );

        for ( var relation of this.relations( ) )
            await applyRelation( this._instance, relation );

        return this._instance;

    }

    static async findAll( ... argv ) {

        var db = await this.instance( );

        return await db.findAll( ... argv );

    }

    static async find( ... argv ) {

        var db = await this.instance( );

        return await db.find( ... argv );

    }

    static async create( ... argv ) {

        var db = await this.instance( );

        return await db.create( ... argv );

    }

    static async findOrCreate( ... argv ) {

        var db = await this.instance( );

        return await db.findOrCreate( ... argv );

    }

}
