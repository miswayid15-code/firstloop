const axios = require('axios');

exports.getDistanceDuration = async (
    originLat,
    originLon,
    destLat,
    destLon,
        
) => {

    try {
const googleApiKey =
    process.env.GOOGLE_MAP_KEY;
        const url =
            `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${originLat},${originLon}&destinations=${destLat},${destLon}&key=${googleApiKey}`;
            // console.log("===============")
            // console.log(url);
            // console.log("===============")

        const response =
            await axios.get(url);

        if (
            response.data &&
            response.data.status === "OK" &&
            response.data.rows &&
            response.data.rows.length > 0 &&
            response.data.rows[0].elements &&
            response.data.rows[0].elements.length > 0
        ) {

            const element =
                response.data
                    .rows[0]
                    .elements[0];

            if (
                element.status === "OK"
            ) {

                return {

                    distance:
                        element.distance.text,

                    duration:
                        element.duration.text,

                    distance_value:
                        element.distance.value

                };

            }

        }

        return {

            distance: null,
            duration: null,
            distance_value: null

        };

    } catch (err) {

        console.log(
            "DISTANCE HELPER ERROR:",
            err.message
        );

        return {

            distance: null,
            duration: null,
            distance_value: null

        };

    }

};