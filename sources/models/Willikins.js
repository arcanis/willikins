import { STRING } from 'willikins/db/types';
import { Model }  from 'willikins/db';

export class Willikins extends Model {

    static schema( ) { return { name : 'Willikins', fields : {

        name : { type : STRING, allowNull : false, primaryKey : true },

        value : { type : STRING }

    } } }

}
