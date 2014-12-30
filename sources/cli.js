import { errorString } from 'willikins/errors';

export var NameError              = errorString `NameError: "${0}" is not a valid option name`;
export var InvalidDefinitionError = errorString `InvalidDefinitionError: Invalid definition "${0}"`;
export var RedefinitionError      = errorString `RedefinitionError: Cannot redefine option "${0}"`;
export var UnknownOptionError     = errorString `UnknownOptionError: Unknown option "${0}"`;
export var GlobalValidationError  = errorString `GlobalValidationError: ${0}`;
export var ValidationError        = errorString `ValidationError: Cannot validate "${0}": ${1}`;
export var MissingCommandError    = errorString `MissingCommandError: Missing command`;
export var BadCommandError        = errorString `BadCommandError: "${0}" is not a valid command`;

class Bag extends Array {

    constructor( ) {

        this._options = { };

        this._lastOption = null;
        this._valueCount = 0;

    }

    addOptions( options ) {

        for ( var attributes of options ) {

            var match = attributes.definition.match( /^(?:-([^=]),\s*)?--([a-z0-9:-]+)(?:\s+([A-Z0-9:_]+)?(?:\s+...)?)?$/ );

            if ( ! match )
                throw new InvalidDefinitionError( attributes.definition );

            var [ , abbr, full, parameter, ellipsis ] = match;

            if ( full in this )
                throw new NameError( full );

            if ( Object.prototype.hasOwnProperty.call( this._options, full ) )
                throw new RedefinitionError( full );

            if ( abbr && Object.prototype.hasOwnProperty.call( this._options, abbr ) )
                throw new RedefinitionError( abbr );

            var option = { };

            option.name = full;
            option.type = attributes.type;
            option.parameter = parameter;

            option.required = attributes.required;
            option.minValueCount = attributes.minValueCount;
            option.maxValueCount = attributes.maxValueCount;

            if ( typeof attributes.valueCount !== 'undefined' )
                option.minValueCount = option.maxValueCount = attributes.valueCount;

            if ( typeof option.type === 'undefined' )
                option.type = typeof option.parameter === 'undefined' ? 'boolean' : 'string';

            if ( typeof option.minValueCount === 'undefined' )
                option.minValueCount = parameter && ! ellipsis ? 1 : 0;

            if ( typeof option.maxValueCount === 'undefined' )
                option.maxValueCount = parameter && ellipsis ? Infinity : parameter ? 1 : 0;

            this._options[ full ] = option;

            if ( abbr ) {
                this._options[ abbr ] = option;
            }

        }

    }

    add( name, value = null ) {

        name = this._translate( name );

        if ( ! this._options[ name ] )
            throw new UnknownOptionError( name );

        this._lastOption = name;

        if ( this._options[ name ].maxValueCount > 1 ) {

            this[ name ] = value ? [ this._castValue( name, value ) ] : [ ];

            this._valueCount = value === null ? this._options[ name ].maxValueCount : 0;

        } else {

            this[ name ] = this._castValue( name, value );

            this._valueCount = this._options[ name ].maxValueCount;

        }

    }

    push( argument ) {

        if ( this._valueCount > 0 ) {

            if ( this._options[ this._lastOption ].maxValueCount > 1 ) {
                this[ this._lastOption ].push( argument );
            } else {
                this[ this._lastOption ] = argument;
            }

            this._valueCount -= 1;

        } else {

            super.push( argument );

        }

    }

    close( ) {

        this._valueCount = 0;

    }

    validate( { ignoreRequired = false } = { } ) {

        for ( var name of Object.keys( this._options ) ) {

            var option = this._options[ name ];

            if ( option.name !== name )
                continue ;

            if ( option.required && ! this.hasOwnProperty( name ) && ! ignoreRequired )
                throw new GlobalValidationError( `Missing required property "${name}"` );

            if ( this.hasOwnProperty( name ) ) {

                if ( option.maxValueCount > 1 ) {

                    if ( this[ name ].length < option.minValueCount )
                        throw new ValidationError( name, `expecting at least ${option.maxValueCount} ${option.parameter} arguments` );

                    if ( this[ name ].length > option.maxValueCount )
                        throw new ValidationError( name, `expecting at most ${option.maxValueCount} ${option.parameter} arguments` );

                } else if ( option.minValueCount > 0 && this[ name ] === null ) {

                    throw new ValidationError( name, `missing ${option.parameter} argument` );

                }

            }

        }

    }

    _translate( name ) {

        if ( this._options[ name ] && this._options[ name ].name !== name ) {
            return this._options[ name ].name;
        } else {
            return name;
        }

    }

    _castValue( name, value ) {

        switch ( this._options[ name ].type ) {

            case 'string':
                return value;

            case 'boolean':
                if ( value === null ) return true; // If no parameter, assume true
                return [ false, 'no', 'false' ].indexOf( value ) === -1 && Number( value ) !== 0;

            case 'integer':
                return Math.floor( value );

            case 'number':
                return Number( value );

        }

    }

}

class Command {

    constructor( ) {

        this._help = null;

        this._runner = null;

        this._options = [ ];

    }

    setHelp( help ) {

        this._help = help;

    }

    setRunner( runner ) {

        this._runner = runner;

    }

    addOption( option ) {

        this._options.push( option );

    }

}

export class CommandSet {

    constructor( ) {

        this._options = [ ];

        this._commands = { };

    }

    addOption( option ) {

        this._options.push( option );

    }

    createCommand( name ) {

        var command = new Command( );
        this._commands[ name ] = command;

        return command;

    }

    async run( argv ) {

        var bag = new Bag( );
        var index = 0;

        // First parsing : only options up to the first positional argument

        bag.addOptions( this._options );

        for ( ; index < argv.length && bag.length === 0; ++ index )
            this._parseArgument( bag, argv[ index ] );

        bag.validate( { ignoreRequired : true } );

        // If we've got no command, we're sad

        if ( bag.length === 0 )
            throw new MissingCommandError( );

        // Yeay ! We've got the command. Maybe.

        var commandName = bag.pop( );
        var command = this._commands[ commandName ];

        if ( ! command )
            throw new BadCommandError( commandName );

        // Second parsing : all others options

        bag.addOptions( command._options );

        for ( ; index < argv.length && argv[ index ] !== '--'; ++ index )
            this._parseArgument( bag, argv[ index ] );

        bag.close( );

        if ( argv[ index ] === '--' )
            for ( index += 1; index < argv.length; ++ index )
                bag.push( argv[ index ] );

        bag.validate( );

        // And finally run !

        return await command._runner( bag );

    }

    _parseArgument( bag, argument ) {

        var match;

        if ( match = argument.match( /^--no-([^=]+)$/ ) ) {
            bag.add( match[ 1 ], false );
        } else if ( match = argument.match( /^--([^=]+)$/ ) ) {
            bag.add( match[ 1 ] );
        } else if ( match = argument.match( /^--([^=]+)=(.*)$/ ) ) {
            bag.add( match[ 1 ], match[ 2 ] );
        } else if ( match = argument.match( /^-([^=]+)$/ ) ) {
            match[ 1 ].split( '' ).forEach( opt => { bag.add( opt ); } );
        } else {
            bag.push( argument );
        }

    }

}
