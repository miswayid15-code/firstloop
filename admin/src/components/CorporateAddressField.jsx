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
    isMerchant = false
}) {
    const showRequired = isBranch || isMerchant;

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
                        required={!showRequired}
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
                        required={!showRequired}
                    />

                    <label className="form-label">State</label>
                </div>

                <div className="form-group">
                    <input
                        name="country"
                        type="text"
                        value={form.country}
                        onChange={onInputChange}
                        className="form-control"
                        placeholder=" "
                        required
                    />

                    <label className="form-label">Country {showRequired && <span style={{ color: '#ef4444' }}>*</span>}</label>
                </div>

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
                        type="text"
                        value={form.latitude}
                        className="form-control"
                        placeholder=" "
                        readOnly
                    />

                    <label className="form-label">Latitude</label>
                </div>

                <div className="form-group">
                    <input
                        type="text"
                        value={form.longitude}
                        className="form-control"
                        placeholder=" "
                        readOnly
                    />

                    <label className="form-label">Longitude</label>
                </div>
            </div>
        </>
    )
}
