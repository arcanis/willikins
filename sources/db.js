import { Sequelize }         from 'willikins/vendors/sequelize';
import { merge }             from 'willikins/vendors/lodash';

import { basename }          from 'willikins/node/path';
import { getProfile }        from 'willikins/profile';
import { getProjectModules } from 'willikins/project';
import { toStream }          from 'willikins/streams';

async function applyRelation( instance, relation ) {

    if ( relation.hasOwnProperty( 'through' ) && typeof relation.through === 'function' )
        relation.through = await relation.through.instance( );

    if ( relation.hasOwnProperty( 'belongsTo' ) )
        return instance.belongsTo( await relation.belongsTo.instance( ), relation );

    if ( relation.hasOwnProperty( 'hasMany' ) )
        return instance.hasMany( await relation.hasMany.instance( ), relation );

    if ( relation.hasOwnProperty( 'hasOne' ) )
        return instance.hasOne( await relation.hasOne.instance( ), relation );

    throw new Error( 'Invalid relation' );

}

function makeLogger( stream ) {

    return function ( data ) {
        stream.write( data + '\n' );
    };

}

export class Database {

    constructor( ) {

        throw new Error( 'This class is not instanciable' );

    }

    static async _setup( ) {

        if ( this._setupLock )
            throw new Error( 'Cannot setup multiple database contexts' );

        var { DB_NAME, DB_USER, DB_PASS, DB_DIALECT, DB_STORAGE, DB_PORT, LOGS_SQL } = getProfile( );

        var sequelize = new Sequelize( DB_NAME, DB_USER, DB_PASS, {
            logging : makeLogger( toStream( LOGS_SQL ) ),
            dialect : DB_DIALECT,
            storage : DB_STORAGE,
            port : DB_PORT
        } );

        var paths = await getProjectModules( 'models' );
        var models = [ ];

        for ( var path of paths ) {
            var module = await System.import( path );
            models.push( module[ basename( path ) ] );
        }

        for ( var model of models )
            await model.register( sequelize );

        for ( var model of models )
            await model.link( );

        return sequelize;

    }

    static async instance( ) {

        if ( ! this._instancePromise )
            this._instancePromise = this._setup( );

        return await this._instancePromise;

    }

    static async define( ... argv ) {

        var db = await this.sequelize( );

        return db.define( ... argv );

    }

    static async drop( ... argv ) {

        var db = await this.instance( );

        return await db.drop( ... argv );

    }

    static async sync( ... argv ) {

        var db = await this.instance( );

        return await db.sync( ... argv );

    }

}

export class Model {

    constructor( ) {

        throw new Error( 'This class is not instanciable' );

    }

    static schema( ) {

        throw new Error( 'The model schema is missing' );

    }

    static relations( ) { return [

    ] }

    static async register( sequelize ) {

        var schema = this.schema( );

        this._instance = await sequelize.define( schema.table, schema.fields, merge( {
            freezeTableName : true
        }, schema.options ) );

    }

    static async link( ) {

        var relations = this.relations( );

        for ( var relation of relations ) {
            await applyRelation( this._instance, relation );
        }

    }

    static async instance( ) {

        if ( ! this._instance )
            await Database.instance( );

        return this._instance;

    }

    static async sync( ... argv ) {

        var db = await this.instance( );

        return await db.sync( ... argv );

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

    static async destroy( ... argv ) {

        var db = await this.instance( );

        return await db.destroy( ... argv );

    }

}
