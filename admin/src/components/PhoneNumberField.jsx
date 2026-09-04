import PhoneInput from 'react-phone-input-2'
import 'react-phone-input-2/lib/style.css'

export default function PhoneNumberField({
    value,
    countryCode,
    onChange,
    required = false,
    isRequired = false,
    showAsterisk = false,
    label = "Phone Number",
    disabled = false,
    placeholder = "Enter phone number",
    className = ""
}) {
    const isFieldRequired = Boolean(required || isRequired || showAsterisk)
    const safeCountryCode = countryCode != null ? String(countryCode).trim() : ''
    const cleanDialCode = safeCountryCode ? safeCountryCode.replace('+', '') : ''

    return (
        <div className={`form-group phone-number-field-wrapper ${className}`.trim()}>
            <label
                className="form-label-classic"
                style={{ marginBottom: 8, display: 'block' }}
            >
                {label} {isFieldRequired && <span style={{ color: '#ef4444' }}>*</span>}
            </label>

            <PhoneInput
                country={cleanDialCode || 'in'}
                value={safeCountryCode && value ? `${safeCountryCode}${value}` : (value || '')}
                onChange={(phoneValue, country) => {
                    const rawPhone = String(phoneValue || '')
                    const dialCode = String(country?.dialCode || cleanDialCode || '')
                    const cleanPhone = dialCode && rawPhone.startsWith(`+${dialCode}`)
                        ? rawPhone.slice(dialCode.length + 1)
                        : rawPhone.replace(/^\+/, '').replace(new RegExp(`^${dialCode}`), '')

                    onChange?.(cleanPhone, `+${dialCode}`)
                }}
                disabled={disabled}
                enableSearch
                preferredCountries={[
                    'in',
                    'us',
                    'gb'
                ]}
                inputProps={{
                    name: 'phone',
                    required: isFieldRequired,
                    disabled: disabled
                }}
                inputClass="phone-input-custom"
                dropdownClass="phone-input-dropdown"
                containerClass="phone-input-container"
                buttonClass="phone-input-button"
                placeholder={placeholder}
            />
        </div>
    )
}


