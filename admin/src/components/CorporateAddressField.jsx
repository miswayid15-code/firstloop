import { useEffect } from 'react'
import { GoogleMap, Marker, Autocomplete } from '@react-google-maps/api'

export default function CorporateAddressField({
    form,
    onInputChange,
    onAutocompleteLoad,
    onPlaceChanged,
    onMapClick,
    onMarkerDragEnd,
    center,
    mapContainerStyle,
    isBranch = false,
    isMerchant = false,
    required = false,
    errors = {}
}) {
    const showRequired = isBranch || isMerchant || required;

    // Helper to geocode country name and get its ISO-2 code using Google Maps Geocoder
    const geocodeCountryToIso = (countryName) => {
        if (!countryName || !window.google?.maps?.Geocoder) return;

        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ address: countryName }, (results, status) => {
            if (status === 'OK' && results?.[0]) {
                const place = results[0];
                let country_iso = '';
                place.address_components?.forEach((component) => {
                    if (component.types.includes('country')) {
                        country_iso = component.short_name; // e.g., 'OM', 'IN'
                    }
                });
                if (country_iso) {
                    onInputChange({
                        target: {
                            name: 'country_iso',
                            value: country_iso.toUpperCase()
                        }
                    });
                }
            }
        });
    };

    // Auto-resolve country ISO code using Google Maps on load/mount if country exists but country_iso is empty
    useEffect(() => {
        if (isBranch && form.country && !form.country_iso) {
            geocodeCountryToIso(form.country);
        }
    }, [isBranch, form.country, form.country_iso]);

    return (
        <>
            <div className="form-group" style={{ marginBottom: 14 }}>
                <label className="form-label-classic" htmlFor="address">
                    Business Address {showRequired && <span style={{ color: '#ef4444' }}>*</span>}
                </label>

                <Autocomplete
                    onLoad={onAutocompleteLoad}
                    onPlaceChanged={onPlaceChanged}
                >
                    <input
                        id="address"
                        name="address"
                        type="text"
                        value={form.address}
                        onChange={onInputChange}
                        className="form-control"
                        placeholder="Search and choose business address"
                        required
                    />
                </Autocomplete>
            </div>

            <div style={{ marginBottom: 20 }}>
                <GoogleMap
                    mapContainerStyle={mapContainerStyle}
                    center={center}
                    zoom={15}
                    onClick={onMapClick}
                >
                    {form.latitude && form.longitude && (
                        <Marker
                            position={{
                                lat: Number(form.latitude),
                                lng: Number(form.longitude)
                            }}
                            draggable
                            onDragEnd={onMarkerDragEnd}
                        />
                    )}
                </GoogleMap>
            </div>

            <div className="form-row" style={{ marginTop: 10 }}>
                <div className="form-group">
                    <input
                        name="city"
                        type="text"
                        value={form.city}
                        onChange={onInputChange}
                        className="form-control"
                        placeholder=" "
                    />

                    <label className="form-label">City</label>
                </div>

                <div className="form-group">
                    <input
                        name="state"
                        type="text"
                        value={form.state}
                        onChange={onInputChange}
                        className="form-control"
                        placeholder=" "
                    />

                    <label className="form-label">State</label>
                </div>

                <div className="form-group">
                    <input
                        name="country"
                        type="text"
                        value={form.country}
                        onChange={onInputChange}
                        onBlur={(e) => {
                            if (isBranch) {
                                geocodeCountryToIso(e.target.value);
                            }
                        }}
                        className="form-control"
                        placeholder=" "
                        required
                    />

                    <label className="form-label">Country {showRequired && <span style={{ color: '#ef4444' }}>*</span>}</label>
                </div>

                {isBranch && (
                    <div className="form-group">
                        <input
                            name="country_iso"
                            type="text"
                            value={form.country_iso || ''}
                            onChange={(e) => {
                                const val = (e.target.value || '').toUpperCase();
                                onInputChange({
                                    target: {
                                        name: 'country_iso',
                                        value: val
                                    }
                                });
                            }}
                            className="form-control"
                            placeholder=" "
                            maxLength={2}
                            style={{ textTransform: 'uppercase' }}
                        />

                        <label className="form-label">Country ISO Code {showRequired && <span style={{ color: '#ef4444' }}>*</span>}</label>
                    </div>
                )}

                <div className="form-group">
                    <input
                        name="zipcode"
                        type="text"
                        value={form.zipcode}
                        onChange={onInputChange}
                        className="form-control"
                        placeholder=" "
                        required={!showRequired}
                    />

                    <label className="form-label">Zipcode / PO Box Code</label>
                </div>
            </div>

            <div className="form-row">
                <div className="form-group">
                    <input
                        name="latitude"
                        type="text"
                        value={form.latitude}
                        onChange={onInputChange}
                        className="form-control"
                        placeholder=" "
                    />

                    <label className="form-label">Latitude</label>
                </div>

                <div className="form-group">
                    <input
                        name="longitude"
                        type="text"
                        value={form.longitude}
                        onChange={onInputChange}
                        className="form-control"
                        placeholder=" "
                    />

                    <label className="form-label">Longitude</label>
                </div>
            </div>
        </>
    )
}
