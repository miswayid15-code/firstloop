const getDistance = (
    originLat,
    originLon,
    destLat,
    destLon
) => {

    const R = 6371; // Earth radius in KM

    const toRad = (degree) => degree * (Math.PI / 180);

    const lat1 = toRad(Number(originLat));
    const lat2 = toRad(Number(destLat));

    const dLat = toRad(Number(destLat) - Number(originLat));
    const dLon = toRad(Number(destLon) - Number(originLon));

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1) *
        Math.cos(lat2) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(
        Math.sqrt(a),
        Math.sqrt(1 - a)
    );

    const distanceKm = R * c;

    return {
        distance: `${distanceKm.toFixed(2)} km`,
        duration: null,
        distance_value: Math.round(distanceKm * 1000)
    };
};

module.exports = {
    getDistance
};