var gProfile = null;

export function setProfile( profile ) {

    if ( gProfile !== null )
        throw new Error( 'Cannot redefine the profile' );

    gProfile = profile;

}

export function getProfile( ) {

    if ( gProfile === null )
        throw new Error( 'No profile set' );

    return gProfile;

}
