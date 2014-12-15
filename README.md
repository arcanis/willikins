# Willikins

A Node web framework.

Currently used for a personal project, and still in development.

## Directories

Willikins is opiniated, and expects a particular file structure for your application to work correctly.

| Name               | Description                                                    |
| ------------------ | -------------------------------------------------------------- |
| vendors            | ES6 modules available from your application using `vendors/*`. |
| sources/commands   | Custom command line commands.                                  |
| sources/models     | Application model definitions.                                 |
| sources/migrations | Database migration scripts.                                    |
| sources/tests      | Application tests.                                             |

## Profiles

Everytime you run Willikins, it will expect you to set a `--profile <path>` option, before the command. This 'profile' is a module which define the context your application should run in. And since it is an ES6 module, it can inherit from other profiles!

**profiles/common.js**
```js
import { getProfile } from 'willikins/profile';

export var SERVER_BUILDER = async function ( app ) {
    var { DB_DIALECT } = getProfile( );
    app.get( '/foo', function ( request, response ) {
        response.send( `I'm using the ${DB_DIALECT} engine :)` );
    } );
};
```

**profiles/test.js**
```js
export * from './common';

export var HTTP_PORT = 9000;

export var DB_DIALECT = 'sqlite';
export var DB_STORAGE = '/tmp/test.sqlite';
```

**profiles/prod.js**
```js
export * from './common';

export var HTTP_PORT = 80;

export var DB_DIALECT = 'postgres';
export var DB_PORT = 5432;
```

If you do not want to set this option every time, check the [protips](i-don-t-want-to-type-the-profile-everytime-what-can-i-do).

You can access the profile symbols by using the `getProfile()` method from the `willikins/profile` module (even from your profile itself, as long as you do it from inside a function which will be called later).

## Commands

### `willikins run`

Run the local webserver and wait for incoming requests.

### `willikins syncdb [--force]`

Setup the database. Iterates on each model, and creates the table if it doesn't exists. Use `--force` if you wish to destroy tables before creating them again.s

Do **NOT** use this method to migrate your database, because it will do nothing if the tables already exist, and will trash your data if you use the `-f` switch. Use [migrate](#willikins-migrate--f--force-version) instead.

### `willikins migrate [--force] [version]`

Setup the database by running the migration scripts. Check the [Migration](#migrations) section of this documentation for more information.

Used without arguments, it will apply every migration script, ensuring that the database is up-to-date. You can set the `version` argument to specify a semver range that the database should be setup against. If the database is already migrated beyond the highest version number allowed by your range, it will be downgraded, step by step, but **only if you use the `--force` option**.

### `willikins tests [-k/--stacks]`

Run all the tests.

If you specify the `--stacks` option, each exception thrown will print the full stacktrace. Otherwise, only a short message will be printed.

### `willikins exec <path>`

Execute a remote script inside the local willikins context. Think of it as a way to execute commands without having to put them into the `commands` directory, that's exactly what it is.

## Database

### Models

Each model from your application has to be located in one of the 'models' directory, and extend the Model class, available from the `willikins/db` module. They use the Sequelize library, but have another type of declaration.

Most of the most important functions from [Sequelize Models](http://sequelize.readthedocs.org/en/latest/api/model/) can be used directly on the model classes, but some of them may be missing. In such a case, you can use `Model.instance()`, which will return a promise which, when resolved, will be a reference to the actual Sequelize object.

```js
import { UUID, TEXT } from 'willikins/db/types';
import { UUIDV4 }     from 'willikins/db/values';
import { Model }      from 'willikins/db';

import { User }       from 'app/models/User';

export class TodoItem extends Model {

    static schema( ) { return { name : 'TodoItem', fields : {

        uid : { type : UUID, defaultValue : UUIDV4, primaryKey : true },

        content : { type : TEXT, allowNull : false }

    } } }

    static relations( ) { return [

        { belongsTo : User, onUpdate : 'CASCADE', onDelete : 'CASCADE' }

    ] }

}
```

### Migrations

A migration script is a module, executed inside your application context, which export two async functions: `up()` and `down()`. Both of them take a single argument, which is a [Sequelize QueryInterface](http://sequelize.readthedocs.org/en/latest/docs/migrations/#functions).

Use the [migrate](#willikins-migrate--f--force-version) command to migrate an application forward and backward.

```js
import { UUID, INTEGER, TEXT } from 'willikins/db/types';
import { UUIDV4 }              from 'willikins/db/values';

export async function up( queryInterface ) {

    await queryInterface.createTable( 'TodoItem', {
        uid : { type : UUID, defaultValue : UUIDV4, primaryKey : true },
        UserUid : { type : INTEGER, references : 'Users', referenceKey : 'uid', onUpdate : 'CASCADE', onDelete : 'CASCADE' },
        content : { type : TEXT, allowNull : false }
    } );

}

export async function down( queryInterface ) {

    await queryInterface.dropTable( 'TodoItem' );

}
```

## Custom commands

Willikins allows you to create custom CLI commands by adding ES6 modules into the `commands` directory of your application. These modules have to export three symbols:

  - *help* is used to display an help message in the Usage
  - *options* is an array where every element is an option descriptor (see below)
  - *command* is an asynchronous function (returning a promise) which will be runned when the command will be called. It can takes a parameter, which will contain the options used to call the command.

Each command can have multiple options. Every option has to be defined into the `options` array of the command. Each entry is an object with the following fields:

  - *definition* is a string formatted as such: `-o,--option VALUE`. It specifies both the short and large versions of a command (both are optional, but you have to specify at least one). You can suffix the string with an ellipsis (`...`), in which case the option will be an array containing all following, up to the next option begin.
  - *required* marks if the option is required or no. If true, the command won't be run if the option is missing.
  - *minValueCount* asks for at least N values to run the command. Similarly, *maxValueCount* asks for at most N values.

Here is a map of the default values of minValueCount and maxValueCount according to the definition formats.

| Definition             | minValueCount | maxValueCount |
| ---------------------- | ------------- | ------------- |
| `-o,--option`          | 0             | 0             |
| `-o,--option VALUE`    | 1             | 1             |
| `-o,--option VALUE...` | 0             | +∞            |

Note that every command located into the `commands` directory will be available from willikins by using its file name (ie. `willikins my-custom-command`), but that you can also use the `exec` method to launch commands from a different directory. If you do this, due to the way the option parsing works, you should use the `--` to tell willikins which are the custom command options. For example:

    $> willikins exec /home/mael/downloads/super-command.js -- --hello --world

Omitting the `--` wouldn't work, because the 'hello' and 'world' options would then be applied to the `exec` command rather than `my-super-command`.

## Pro Tips

### I don't want to type the profile everytime, what can I do?

If you really don't wish to type the profiles yourself, you can use a shell alias (`alias willikins="willikins --profile=<path>"`). You can also write a quick shellscript to wrap the command:

```sh
#!/usr/bin/env sh
willikins --profile=<path> "$@"
```

Then set it as executable:

```
$> chmod +x ./my-willikins
$> ./my-willikins run
```

### How can I bind my server on the 80 port? Do I have to run Willikins as super user?

Please don't use `sudo` (Willikins won't let you do that anyway).

Instead, you can use `authbind`:

```
$> touch /etc/authbind/byport/80
$> sudo chown $USER:root /etc/authbind/byport/80
$> sudo chmod 755 /etc/authbind/byport/80
```

You can know launch Willikins by using the following command:

```
$> authbind --deep willikins --profile prod.js run
```
