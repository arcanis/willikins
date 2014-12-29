import { STRING } from 'willikins/db/types';
import { Model }  from 'willikins/db';

export class Willikins extends Model {

    static schema( ) { return { table : 'Willikins', fields : {

        name : { type : STRING, allowNull : false, primaryKey : true },

        value : { type : STRING }

    } } }

}
