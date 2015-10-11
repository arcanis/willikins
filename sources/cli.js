import { camelCase }   from 'willikins/vendors/lodash';

import { errorString } from 'willikins/errors';

export let TooMuchGreedinessError = errorString `TooMuchGreedinessError: A command cannot have multiple greedy positional options`;
export let NameError              = errorString `NameError: "${0}" is not a valid option name`;
export let InvalidDefinitionError = errorString `InvalidDefinitionError: Invalid definition "${0}"`;
export let TypeError              = errorString `TypeError: Invalid type "${0}" for option "${1}"`;
export let RedefinitionError      = errorString `RedefinitionError: Cannot redefine option "${0}"`;
export let UnknownOptionError     = errorString `UnknownOptionError: Unknown option "${0}"`;
export let GlobalValidationError  = errorString `GlobalValidationError: ${0}`;
export let ValidationError        = errorString `ValidationError: Cannot validate "${0}": ${1}`;
export let MissingCommandError    = errorString `MissingCommandError: Missing command`;
export let BadCommandError        = errorString `BadCommandError: "${0}" is not a valid command`;

class Bag extends Array {

    constructor( ) {

        super( );

        this._options = { };

        this._positionalOptions = [ ];
        this._positionalOptionRest = null;
        this._positionalOptionIndex = 0;

        this._lastOption = null;
        this._valueCount = 0;

    }

    addOptions( options ) {

        let regularOptionRegexp = /^(?:-([^=]),\s*)?--([a-z0-9:-]+)(?:\s+([A-Z0-9:_]+)?(\s+...)?)?$/;
        let positionalOptionRegexp = /^([a-z0-9:-]+)(\s+...)?$/;

        for ( let attributes of options ) {

            let match;
            let short, long, parameter, ellipsis, positional;

            if ( ( match = attributes.definition.match( positionalOptionRegexp ) ) ) {

                long = match[ 1 ];
                ellipsis = match[ 2 ];
                positional = true;

            } else if ( ( match = attributes.definition.match( regularOptionRegexp ) ) ) {

                short = match[ 1 ];
                long = match[ 2 ];
                parameter = match[ 3 ];
                ellipsis = match[ 4 ];

            } else {

                throw new InvalidDefinitionError( attributes.definition );

            }

            if ( long in this )
                throw new NameError( long );

            if ( Object.prototype.hasOwnProperty.call( this._options, long ) )
                throw new RedefinitionError( long );

            if ( short && Object.prototype.hasOwnProperty.call( this._options, short ) )
                throw new RedefinitionError( short );

            if ( positional && ellipsis && this._positionalOptionRest )
                throw new TooMuchGreedinessError( );

            let option = { };

            option.name = long;
            option.type = attributes.type;
            option.parameter = parameter;
            option.property = camelCase( long );

            option.required = attributes.required;
            option.minValueCount = attributes.minValueCount;
            option.maxValueCount = attributes.maxValueCount;

            if ( typeof attributes.valueCount !== 'undefined' )
                option.minValueCount = option.maxValueCount = attributes.valueCount;

            if ( typeof option.type === 'undefined' )
                option.type = typeof option.parameter === 'undefined' && ! positional ? 'boolean' : 'string';

            if ( typeof option.minValueCount === 'undefined' )
                option.minValueCount = parameter && ! ellipsis ? 1 : 0;

            if ( typeof option.maxValueCount === 'undefined' )
                option.maxValueCount = parameter && ellipsis ? Infinity : parameter ? 1 : 0;

            this._options[ long ] = option;

            if ( short )
                this._options[ short ] = option;

            if ( positional && ! ellipsis )
                this._positionalOptions.push( option );

            if ( positional && ellipsis ) {
                this._positionalOptionRest = option;
            }

        }

    }

    add( name, argument = null ) {

        name = this._translate( name );

        if ( ! this._options[ name ] )
            throw new UnknownOptionError( name );

        let option = this._lastOption = this._options[ name ];

        if ( option.maxValueCount > 1 ) {

            this[ option.property ] = argument ? [ this._castOption( name, argument ) ] : [ ];

            this._valueCount = argument === null ? option.maxValueCount : 0;

        } else {

            this[ option.property ] = this._castOption( name, argument );

            this._valueCount = option.maxValueCount;

        }

    }

    push( argument ) {

        if ( this._valueCount > 0 ) {

            let value = this._castOption( this._lastOption.name, argument );

            if ( this._lastOption.maxValueCount > 1 ) {
                this[ this._lastOption.property ].push( value );
            } else {
                this[ this._lastOption.property ] = value;
            }

            this._valueCount -= 1;

        } else {

            if ( this._positionalOptionIndex < this._positionalOptions.length ) {
                this.add( this._positionalOptions[ this._positionalOptionIndex ++ ].name, argument );
            } else {
                super.push( argument );
            }

        }

    }

    close( ) {

        this._valueCount = 0;

    }

    validate( { ignoreRequired = false } = { } ) {

        for ( let name of Object.keys( this._options ) ) {

            let option = this._options[ name ];

            if ( option.name !== name )
                continue ;

            if ( option.required && ! this.hasOwnProperty( option.property ) && ! ignoreRequired )
                throw new GlobalValidationError( `Missing required property "${name}"` );

            if ( this.hasOwnProperty( option.property ) ) {

                if ( option.maxValueCount > 1 ) {

                    if ( this[ option.property ].length < option.minValueCount )
                        throw new ValidationError( name, `expecting at least ${option.maxValueCount} ${option.parameter} arguments` );

                    if ( this[ option.property ].length > option.maxValueCount )
                        throw new ValidationError( name, `expecting at most ${option.maxValueCount} ${option.parameter} arguments` );

                } else if ( option.minValueCount > 0 && this[ option.property ] === null ) {

                    throw new ValidationError( name, `missing ${option.parameter} argument` );

                }

            }

        }

        return this;

    }

    _translate( name ) {

        if ( this._options[ name ] && this._options[ name ].name !== name ) {
            return this._options[ name ].name;
        } else {
            return name;
        }

    }

    _castOption( name, argument ) {

        let type = this._options[ name ].type;

        switch ( type ) {

            case 'string':
                return String( argument );

            case 'boolean':
                if ( argument === null ) return true; // If no parameter, assume true
                return [ false, 'no', 'false' ].indexOf( argument ) === -1 && Number( argument ) !== 0;

            case 'integer':
                return Math.floor( argument );

            case 'number':
                return Number( argument );

            default: {
                throw new TypeError( type, name );
            }

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

        return this;

    }

    setRunner( runner ) {

        this._runner = runner;

        return this;

    }

    addOption( option ) {

        this._options.push( option );

        return this;

    }

}

export class CommandSet {

    constructor( ) {

        this._options = [ ];

        this._commands = { };

    }

    addOption( option ) {

        this._options.push( option );

        return this;

    }

    createCommand( name ) {

        let command = new Command( );
        this._commands[ name ] = command;

        return command;

    }

    async parse( argv ) {

        let bag = new Bag( );
        let index = 0;

        bag.addOptions( this._options );

        for ( ; index < argv.length && bag.length === 0; ++ index )
            this._parseArgument( bag, argv[ index ] );

        bag.validate( );

        return bag;

    }

    async run( argv ) {

        let bag = new Bag( );
        let index = 0;

        // First parsing : only options up to the first positional argument

        bag.addOptions( this._options );

        for ( ; index < argv.length && bag.length === 0; ++ index )
            this._parseArgument( bag, argv[ index ] );

        bag.validate( { ignoreRequired : true } );

        // If we've got no command, we're sad

        if ( bag.length === 0 )
            throw new MissingCommandError( );

        // Yeay ! We've got the command. Maybe.

        let commandName = bag.pop( );
        let command = this._commands[ commandName ];

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

        bag.validate( { ignoreRequired : true } );

        // And finally run !

        return await command._runner( bag );

    }

    _parseArgument( bag, argument ) {

        let match;

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
