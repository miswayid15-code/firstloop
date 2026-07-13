import React, { useState, useRef, useEffect } from 'react';

const INITIAL_FORM = {
  name: '',
  phone: '',
  email: '',
  description: '',
  type: '',
};

export default function ReachUs() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [typeOpen, setTypeOpen] = useState(false);
  const typeRef = useRef(null);

  const TYPE_OPTIONS = [
    { value: '1', label: 'Merchant' },
    { value: '2', label: 'Reception' },
    { value: '3', label: 'Customer' },
  ];

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
          submit_type: 1,
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
      setError(err.message?.includes('unexpected response')
        ? err.message
        : 'Unable to send your message. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Hero Banner */}
      <div className="section-hero v1">
        <div className="hero-image"></div>
        <div className="container">
          <div className="content-wrap text-center">
            <div className="title text-display-2 effectFade fadeRotateX">
              <span className="title1 fw-semibold text-gradient-1" style={{ fontSize: '60px' }}>We're Here to Help</span>
            </div>
            <p className="text effectFade fadeUp">
              Reach out to our team today.
            </p>
          </div>
        </div>
      </div>
      {/* /Hero Banner */}

      {/* section-contact */}
      <div id="contact" className="flat-spacing">
        <div className="section-contact p-0">
          <div className="container">
            <div className="row mb-60">
              <div className="col-md-4 md-mb-24">
                <div className="box-contact-item text-center effectFade fadeUp">
                  <i className="icon icon-envelope-solid"></i>
                  <h6 className="title fw-semibold">E-mail address</h6>
                  <a className="text" href="mailto:info@firstpassapp.co">
                    info@firstpassapp.co
                  </a>
                </div>
              </div>
              <div className="col-md-4 md-mb-24">
                <div className="box-contact-item text-center effectFade fadeUp" data-delay="0.1">
                  <i className="icon icon-headset-solid"></i>
                  <h6 className="title fw-semibold">Phone number</h6>
                  <a href="tel:+919876543210" className="text">
                    +91 98765 43210
                  </a>
                </div>
              </div>
              <div className="col-md-4">
                <div className="box-contact-item text-center effectFade fadeUp" data-delay="0.2">
                  <i className="icon icon-globe-solid" style={{ color: 'white' }}></i>
                  <h6 className="title fw-semibold">Website</h6>
                  <a href="https://firstpassapp.co/" className="text" target="_blank" rel="noopener noreferrer">
                    www.firstpassapp.co
                  </a>
                </div>
              </div>
            </div>

            {/* Form + Info Section */}
            <div id="contact-form" className="flat-spacing pt-0">
              <div className="section-contact">
                <div className="contact-image">
                  <img src="asset/images/section/contact-image-bg.jpg" alt="" />
                </div>
                <div className="container">
                  <div className="row">
                    <div className="col-lg-6">
                      <div className="col-left">
                        <div className="heading-section mb-48">
                          <div className="heading-sub fw-semibold effectFade fadeUp">Contact Us</div>
                          <div className="heading-title text-gradient-3 effectFade fadeRotateX">
                            Your Questions, <br />Our Priority
                          </div>
                        </div>
                        <div>
                          <div className="contact-item mb-20 effectFade fadeRotateX">
                            <i className="icon icon-map-marker-solid"></i>
                            <div className="content">
                              <div className="title fw-semibold mb-2">Office Location</div>
                              <div className="text"></div>
                            </div>
                          </div>
                          <div className="contact-item mb-20 effectFade fadeRotateX" data-delay="0.1">
                            <i className="icon icon-headset-solid"></i>
                            <div className="content">
                              <div className="title fw-semibold mb-2">Phone number</div>
                              <div className="text"></div>
                            </div>
                          </div>
                          <div className="contact-item mb-20 effectFade fadeRotateX" data-delay="0.2">
                            <i className="icon icon-envelope-solid"></i>
                            <div className="content">
                              <div className="title fw-semibold mb-2">E-mail address</div>
                              <div className="text"></div>
                            </div>
                          </div>
                          <div className="contact-item effectFade fadeRotateX" data-delay="0.3">
                            <i className="icon icon-clock-solid"></i>
                            <div className="content">
                              <div className="title fw-semibold mb-2">Working Hours</div>
                              <div className="text">09:00AM to 06:00PM</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="col-lg-6">
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

                        <fieldset className="mb-21" ref={typeRef} style={{ position: 'relative' }}>
                          <label className="fw-semibold text-body-3 mb-20">Type</label>
                          {/* Custom dropdown trigger */}
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
                            <span>{form.type ? TYPE_OPTIONS.find(o => o.value === form.type)?.label : 'Select type'}</span>
                            <svg
                              width="12" height="8" viewBox="0 0 12 8"
                              style={{ transform: typeOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', flexShrink: 0 }}
                            >
                              <path d="M1 1l5 5 5-5" stroke="#888" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                            </svg>
                          </div>
                          {/* Hidden input for form validation */}
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
                                    if (form.type !== opt.value) {
                                      e.currentTarget.style.background = '#f5f5f5';
                                    }
                                  }}
                                  onMouseLeave={(e) => {
                                    if (form.type !== opt.value) {
                                      e.currentTarget.style.background = '#fff';
                                    }
                                  }}
                                >
                                  {opt.label}
                                </div>
                              ))}
                            </div>
                          )}
                        </fieldset>

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
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
      {/* /section-contact */}

      {/* map */}
      <div className="wg-map">
        <iframe
          src="https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d317859.6089702069!2d-0.075949!3d51.508112!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x48760349331f38dd%3A0xa8bf49dde1d56467!2sTower%20of%20London!5e0!3m2!1sen!2sus!4v1719221598456!5m2!1sen!2sus"
          height="660"
          style={{ border: 0 }}
          allowFullScreen={true}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
      {/* /map */}
    </>
  );
}
