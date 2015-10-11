export function errorString( strings, ... values ) {

    strings = Array.prototype.slice.call( strings );

    let name = 'Error';
    let match = strings[ 0 ].match( /^([^:]+)\s*:\s*/ );

    if ( match ) {
        strings[ 0 ] = strings[ 0 ].substr( match[ 0 ].length );
        name = match[ 1 ];
    }

    return class extends Error {

        constructor( ... parameters ) {

            super( );

            this.name = name;

            this.message = strings[ 0 ];

            for ( let u = 1, v = 0; u < strings.length; ++ u ) {
                this.message += parameters[ values[ v ++ ] ];
                this.message += strings[ u ];
            }

        }

    };

}
