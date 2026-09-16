import React, { useMemo } from 'react'
import PhoneInput from 'react-phone-input-2'
import 'react-phone-input-2/lib/style.css'
import { getCountries, getCountryCallingCode } from 'react-phone-number-input'

// Resolve dial code or ISO code to a valid lowercase ISO-2 code for react-phone-input-2
const allIsoCountries = getCountries()

const resolveCountryIso = (code) => {
    if (!code) return 'in'
    const raw = String(code).trim().toLowerCase()

    // If it's already an ISO-2 code like 'sa', 'in', 'us', 'ae', 'gb', etc.
    if (raw.length === 2 && allIsoCountries.some(c => c.toLowerCase() === raw)) {
        return raw
    }

    // If it's a dial code like '+966', '966', '+91', '91', '+1', etc.
    const clean = raw.replace('+', '').trim()
    if (clean === '1') return 'us'
    if (clean === '44') return 'gb'
    if (clean === '91') return 'in'
    if (clean === '966') return 'sa'
    if (clean === '971') return 'ae'

    const matchedIso = allIsoCountries.find(iso => {
        try {
            return getCountryCallingCode(iso) === clean
        } catch (e) {
            return false
        }
    })

    return matchedIso ? matchedIso.toLowerCase() : 'in'
}

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
    const cleanDialCode = safeCountryCode ? safeCountryCode.replace('+', '').trim() : ''

    // Resolve ISO-2 country for PhoneInput (e.g. '+966' -> 'sa', '+91' -> 'in')
    const targetCountryIso = useMemo(() => {
        return resolveCountryIso(countryCode)
    }, [countryCode])

    // Format phone value with dial code prefix for PhoneInput
    const formattedValue = useMemo(() => {
        const rawVal = value != null ? String(value).trim() : ''
        if (!rawVal) {
            return safeCountryCode || ''
        }
        if (rawVal.startsWith('+')) {
            return rawVal
        }
        if (cleanDialCode && rawVal.startsWith(cleanDialCode)) {
            return `+${rawVal}`
        }
        return safeCountryCode ? `${safeCountryCode}${rawVal}` : rawVal
    }, [value, safeCountryCode, cleanDialCode])

    return (
        <div className={`form-group phone-number-field-wrapper ${className}`.trim()}>
            <label
                className="form-label-classic"
                style={{ marginBottom: 8, display: 'block' }}
            >
                {label} {isFieldRequired && <span style={{ color: '#ef4444' }}>*</span>}
            </label>

            <PhoneInput
                key={targetCountryIso}
                country={targetCountryIso}
                value={formattedValue}
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
                    targetCountryIso,
                    'in',
                    'sa',
                    'ae',
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


