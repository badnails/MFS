import fetch from 'node-fetch';

export const getLocationInfo = async (req) => {
    const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    let locationInfo = req.headers['x-user-location'];

    if (!locationInfo) {
        try {
            const geoResponse = await fetch(`http://ip-api.com/json/${ipAddress}`);
            const geoData = await geoResponse.json();
            if (geoData.status === 'success') {
                locationInfo = {"latitude": `${geoData.lat}`,"longitude": `${geoData.lon}`};
            } else {
                locationInfo = null;
            }
        } catch (geoError) {
            console.error('Geolocation API error:', geoError);
            locationInfo = null;
        }
    }
    return { ipAddress, locationInfo};
};