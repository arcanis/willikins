import { basename }          from 'node/path';

import { Sequelize }         from 'willikins/vendors/sequelize';
import { merge }             from 'willikins/vendors/lodash';

import { getProfile }        from 'willikins/profile';
import { getProjectModules } from 'willikins/project';
import { toStream }          from 'willikins/streams';

async function applyRelation( instance, relation ) {

    if ( relation.hasOwnProperty( 'through' ) && typeof relation.through === 'function' )
        relation.through = await relation.through.instance( );

    if ( relation.hasOwnProperty( 'belongsTo' ) )
        return instance.belongsTo( await relation.belongsTo.instance( ), relation );

    if ( relation.hasOwnProperty( 'belongsToMany' ) )
        return instance.belongsToMany( await relation.belongsToMany.instance( ), relation );

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

        let { DB_NAME, DB_USER, DB_PASS, DB_DIALECT, DB_STORAGE, DB_PORT, LOGS_SQL } = getProfile( );

        let sequelize = new Sequelize( DB_NAME, DB_USER, DB_PASS, {
            logging : makeLogger( toStream( LOGS_SQL ) ),
            dialect : DB_DIALECT,
            storage : DB_STORAGE,
            port : DB_PORT
        } );

        let paths = await getProjectModules( 'models' );
        let models = [ ];

        for ( let path of paths ) {

            let module = await System.import( path );
            let name = basename( path );

            if ( ! module[ name ] )
                throw new Error( `Missing exported class ${name}` );

            models.push( module[ name ] );

        }

        for ( let model of models )
            await model.register( sequelize );

        for ( let model of models )
            await model.link( );

        return sequelize;

    }

    static async instance( ) {

        if ( ! this._instancePromise )
            this._instancePromise = this._setup( );

        return await this._instancePromise;

    }

    static async drop( ... argv ) {

        let db = await this.instance( );

        return await db.drop( ... argv );

    }

    static async sync( ... argv ) {

        let db = await this.instance( );

        return await db.sync( ... argv );

    }

    static async transaction( ... argv ) {

        let db = await this.instance( );

        return await db.transaction( ... argv );

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

        let schema = this.schema( );

        let plugins = schema.plugins || [ ];
        delete schema.plugins;

        for ( let plugin of plugins )
            if ( plugin.patchSchema )
                await plugin.patchSchema( schema );

        let { table, fields, instanceMethods, options } = schema;

        this._instance = await sequelize.define( table, fields, merge( {
            freezeTableName : true, instanceMethods
        }, options ) );

        for ( let plugin of plugins ) {
            if ( plugin.bindHooks ) {
                await plugin.bindHooks( this._instance );
            }
        }

    }

    static async link( ) {

        let relations = this.relations( );

        for ( let relation of relations ) {
            await applyRelation( this._instance, relation );
        }

    }

    static async instance( ) {

        if ( ! this._instance )
            await Database.instance( );

        return this._instance;

    }

    static async sync( ... argv ) {

        let db = await this.instance( );

        return await db.sync( ... argv );

    }

    static async count( ... argv ) {

        let db = await this.instance( );

        return await db.count( ... argv );

    }

    static async findAll( ... argv ) {

        let db = await this.instance( );

        return await db.findAll( ... argv );

    }

    static async find( ... argv ) {

        let db = await this.instance( );

        return await db.find( ... argv );

    }

    static async create( ... argv ) {

        let db = await this.instance( );

        return await db.create( ... argv );

    }

    static async bulkCreate( ... argv ) {

        let db = await this.instance( );

        return await db.bulkCreate( ... argv );

    }

    static async findOrCreate( ... argv ) {

        let db = await this.instance( );

        return await db.findOrCreate( ... argv );

    }

    static async destroy( ... argv ) {

        let db = await this.instance( );

        return await db.destroy( ... argv );

    }

}
