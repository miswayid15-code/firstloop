import PhoneInput from 'react-phone-input-2'
import 'react-phone-input-2/lib/style.css'

export default function PhoneNumberField({
    value,
    countryCode,
    onChange
}) {

    return (

        <div className="form-group">

            <label
                className="form-label-classic"
                style={{ marginBottom: 8 }}
            >
                Phone Number
            </label>

            <PhoneInput
                country={countryCode ? countryCode.replace('+', '') : 'in'}
                value={countryCode && value ? `${countryCode}${value}` : value}
                onChange={(phoneValue, country) => {
                    const rawPhone = String(phoneValue || '')
                    const dialCode = String(country?.dialCode || countryCode?.replace('+', '') || '')
                    const cleanPhone = dialCode && rawPhone.startsWith(`+${dialCode}`)
                        ? rawPhone.slice(dialCode.length + 1)
                        : rawPhone.replace(/^\+/, '').replace(new RegExp(`^${dialCode}`), '')

                    onChange?.(cleanPhone, `+${dialCode}`)
                }}

                enableSearch

                preferredCountries={[
                    'in',
                    'us',
                    'gb'
                ]}

                inputProps={{
                    name: 'phone',
                    required: true
                }}

                inputClass="phone-input-custom"

                dropdownClass="phone-input-dropdown"

                containerClass="phone-input-container"

                buttonClass="phone-input-button"

                placeholder="Enter phone number"
            />

        </div>

    )

}


