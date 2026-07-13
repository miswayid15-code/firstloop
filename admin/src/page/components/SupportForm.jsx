import React, { useState, useRef, useEffect } from 'react';

const INITIAL_FORM = {
  name: '',
  phone: '',
  email: '',
  description: '',
  type: '',
};

const TYPE_OPTIONS = [
  { value: '1', label: 'Merchant' },
  { value: '2', label: 'Reception' },
  { value: '3', label: 'Customer' },
];

/**
 * SupportForm – reusable support/contact form.
 * @param {number} submitType - 1 for website, 2 for app
 */
export default function SupportForm({ submitType = 1 }) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [typeOpen, setTypeOpen] = useState(false);
  const typeRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (typeRef.current && !typeRef.current.contains(e.target)) {
        setTypeOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const baseUrl = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
      const response = await fetch(`${baseUrl}/api/create_support`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          phone: form.phone.trim(),
          email: form.email.trim(),
          description: form.description.trim(),
          type: form.type,
          submit_type: submitType,
        }),
      });

      // Guard: parse JSON only if Content-Type is application/json
      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        throw new Error(`Server returned unexpected response (status ${response.status})`);
      }

      const data = await response.json();

      if (data.status === 1 || data.success) {
        setSuccess(true);
        setForm(INITIAL_FORM);
      } else {
        setError(data.message || 'Something went wrong. Please try again.');
      }
    } catch (err) {
      console.log('Contact form error:', err);
      setError(
        err.message?.includes('unexpected response')
          ? err.message
          : 'Unable to send your message. Please check your connection and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="form-contact effectFade fadeUp" onSubmit={handleSubmit}>
      <h4 className="heading fw-semibold">Fill this form below</h4>

      {/* Success message */}
      {success && (
        <div style={{
          background: 'rgba(16,185,129,0.12)',
          border: '1px solid #10b981',
          borderRadius: 10,
          padding: '14px 18px',
          marginBottom: 20,
          color: '#10b981',
          fontWeight: 600,
          fontSize: '0.9rem',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}>
          <i className="icon icon-check-circle-solid" style={{ fontSize: 18 }} />
          Your message has been sent successfully! We'll get back to you soon.
        </div>
      )}

      {/* Error message */}
      {error && (
        <div style={{
          background: 'rgba(239,68,68,0.1)',
          border: '1px solid #ef4444',
          borderRadius: 10,
          padding: '14px 18px',
          marginBottom: 20,
          color: '#ef4444',
          fontWeight: 600,
          fontSize: '0.9rem',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}>
          <i className="icon icon-exclamation-circle-solid" style={{ fontSize: 18 }} />
          {error}
        </div>
      )}

      {/* Name */}
      <fieldset className="mb-21">
        <label className="fw-semibold text-body-3 mb-20">Your Name</label>
        <input
          type="text"
          name="name"
          placeholder="Enter your full name"
          value={form.name}
          onChange={handleChange}
          disabled={loading}
          required
        />
      </fieldset>

      {/* Phone */}
      <fieldset className="mb-21">
        <label className="fw-semibold text-body-3 mb-20">Your Phone</label>
        <input
          type="tel"
          name="phone"
          placeholder="Enter your phone number"
          value={form.phone}
          onChange={handleChange}
          disabled={loading}
          required
        />
      </fieldset>

      {/* Email */}
      <fieldset className="mb-21">
        <label className="fw-semibold text-body-3 mb-20">Your E-Mail</label>
        <input
          type="email"
          name="email"
          placeholder="Enter your e-mail"
          value={form.email}
          onChange={handleChange}
          disabled={loading}
          required
        />
      </fieldset>

      {/* Type – custom dropdown */}
      <fieldset className="mb-21" ref={typeRef} style={{ position: 'relative' }}>
        <label className="fw-semibold text-body-3 mb-20">Type</label>

        {/* Trigger */}
        <div
          onClick={() => !loading && setTypeOpen((o) => !o)}
          style={{
            width: '100%',
            boxSizing: 'border-box',
            height: '48px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 16px',
            border: `1px solid ${typeOpen ? 'var(--primary, #e53935)' : 'var(--line, #e0e0e0)'}`,
            borderRadius: '8px',
            background: 'var(--bg-3, #fff)',
            fontSize: '14px',
            color: form.type ? 'var(--text, #222)' : '#aaa',
            cursor: loading ? 'not-allowed' : 'pointer',
            userSelect: 'none',
            transition: 'border-color 0.2s',
          }}
        >
          <span>{form.type ? TYPE_OPTIONS.find((o) => o.value === form.type)?.label : 'Select type'}</span>
          <svg
            width="12" height="8" viewBox="0 0 12 8"
            style={{ transform: typeOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', flexShrink: 0 }}
          >
            <path d="M1 1l5 5 5-5" stroke="#888" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          </svg>
        </div>

        {/* Hidden input for native form validation */}
        <input
          type="text"
          name="type"
          value={form.type}
          onChange={() => {}}
          required
          tabIndex={-1}
          style={{ position: 'absolute', opacity: 0, width: 0, height: 0, pointerEvents: 'none' }}
        />

        {/* Dropdown panel */}
        {typeOpen && (
          <div style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            background: '#fff',
            border: '1px solid var(--line, #e0e0e0)',
            borderRadius: '8px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            zIndex: 999,
            overflow: 'hidden',
          }}>
            {TYPE_OPTIONS.map((opt) => (
              <div
                key={opt.value}
                onClick={() => {
                  setForm((prev) => ({ ...prev, type: opt.value }));
                  setTypeOpen(false);
                  if (error) setError('');
                }}
                style={{
                  padding: '12px 16px',
                  fontSize: '14px',
                  color: form.type === opt.value ? '#fff' : '#222',
                  background: form.type === opt.value ? 'var(--primary, #e53935)' : '#fff',
                  cursor: 'pointer',
                  transition: 'background 0.15s, color 0.15s',
                }}
                onMouseEnter={(e) => {
                  if (form.type !== opt.value) e.currentTarget.style.background = '#f5f5f5';
                }}
                onMouseLeave={(e) => {
                  if (form.type !== opt.value) e.currentTarget.style.background = '#fff';
                }}
              >
                {opt.label}
              </div>
            ))}
          </div>
        )}
      </fieldset>

      {/* Description */}
      <fieldset className="mb-18">
        <label className="fw-semibold text-body-3 mb-0">More about the enquiry</label>
        <textarea
          name="description"
          placeholder="Describe your issue or question..."
          value={form.description}
          onChange={handleChange}
          disabled={loading}
          required
        />
      </fieldset>

      {/* Submit */}
      <button
        type="submit"
        className="tf-btn w-100"
        disabled={loading}
        style={{ opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
      >
        {loading ? (
          <>
            <i className="icon icon-spinner-solid" style={{ marginRight: 8, animation: 'spin 1s linear infinite' }} />
            Sending...
          </>
        ) : (
          'Submit Message'
        )}
      </button>
    </form>
  );
}
