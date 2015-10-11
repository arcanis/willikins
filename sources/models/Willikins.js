import { STRING } from 'willikins/vendors/sequelize';

import { Model }  from 'willikins/db';

export class Willikins extends Model {

    static schema( ) { return { table : 'Willikins', fields : {

        name : { type : STRING, allowNull : false, primaryKey : true },

        value : { type : STRING }

    } }; }

};
