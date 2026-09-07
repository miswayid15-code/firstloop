import React, { useState } from 'react';

export default function Conditions() {
  const [activeTab, setActiveTab] = useState('customer');

  const customerContent = (
    <div>
      <h3 className="fw-semibold mb-12" style={{ color: '#0f172a', fontSize: '28px' }}>FIRST PASS CUSTOMER TERMS & CONDITIONS</h3>
      <p className="text-neutral-500 mb-32" style={{ fontSize: '14px' }}>Effective Date: June 16, 2026</p>

      <h5 className="fw-semibold mb-16" style={{ color: '#D30000', fontSize: '20px' }}>1. Acceptance</h5>
      <p className="mb-32" style={{ color: '#475569', fontSize: '15px', lineHeight: '1.7' }}>
        By creating an account or using First Pass, you agree to these Terms and Conditions.
      </p>

      <h5 className="fw-semibold mb-16" style={{ color: '#D30000', fontSize: '20px' }}>2. Service Description</h5>
      <p className="mb-32" style={{ color: '#475569', fontSize: '15px', lineHeight: '1.7' }}>
        First Pass is a platform that allows users to discover, claim, and redeem offers provided by participating merchants. First Pass is not the provider of the products or services offered by merchants.
      </p>

      <h5 className="fw-semibold mb-16" style={{ color: '#D30000', fontSize: '20px' }}>3. Membership & Subscription</h5>
      <p className="mb-32" style={{ color: '#475569', fontSize: '15px', lineHeight: '1.7' }}>
        Some features may require a paid subscription. Subscription fees are charged according to the selected plan. Unless otherwise stated, subscriptions may renew automatically until cancelled.
      </p>

      <h5 className="fw-semibold mb-16" style={{ color: '#D30000', fontSize: '20px' }}>4. Offer Redemption</h5>
      <ul className="mb-32 ps-20" style={{ color: '#475569', fontSize: '15px', lineHeight: '1.7', listStyleType: 'disc' }}>
        <li className="mb-8">Offers are subject to merchant-specific terms.</li>
        <li className="mb-8">Merchants may verify eligibility before redemption.</li>
        <li className="mb-8">Offer availability may change without notice.</li>
        <li className="mb-0">Claimed offers do not guarantee availability if the merchant has reached redemption limits or withdrawn the offer.</li>
      </ul>

      <h5 className="fw-semibold mb-16" style={{ color: '#D30000', fontSize: '20px' }}>5. User Conduct</h5>
      <p className="mb-12" style={{ color: '#475569', fontSize: '15px' }}>Users agree not to:</p>
      <ul className="mb-32 ps-20" style={{ color: '#475569', fontSize: '15px', lineHeight: '1.7', listStyleType: 'disc' }}>
        <li className="mb-8">Share accounts</li>
        <li className="mb-8">Misuse offers</li>
        <li className="mb-8">Attempt fraudulent redemptions</li>
        <li className="mb-8">Interfere with platform operations</li>
        <li className="mb-0">Violate applicable laws</li>
      </ul>

      <h5 className="fw-semibold mb-16" style={{ color: '#D30000', fontSize: '20px' }}>6. Merchant Responsibility</h5>
      <p className="mb-12" style={{ color: '#475569', fontSize: '15px' }}>Merchants are solely responsible for:</p>
      <ul className="mb-32 ps-20" style={{ color: '#475569', fontSize: '15px', lineHeight: '1.7', listStyleType: 'disc' }}>
        <li className="mb-8">Offer accuracy</li>
        <li className="mb-8">Product quality</li>
        <li className="mb-8">Service delivery</li>
        <li className="mb-0">Redemption decisions within platform rules</li>
      </ul>

      <h5 className="fw-semibold mb-16" style={{ color: '#D30000', fontSize: '20px' }}>7. Limitation of Liability</h5>
      <p className="mb-32" style={{ color: '#475569', fontSize: '15px', lineHeight: '1.7' }}>
        First Pass acts as a marketplace platform and is not liable for disputes regarding merchant products, services, pricing, availability, or customer experiences.
      </p>

      <h5 className="fw-semibold mb-16" style={{ color: '#D30000', fontSize: '20px' }}>8. Account Suspension</h5>
      <p className="mb-32" style={{ color: '#475569', fontSize: '15px', lineHeight: '1.7' }}>
        First Pass may suspend or terminate accounts involved in abuse, fraud, policy violations, or unlawful activities.
      </p>

      <h5 className="fw-semibold mb-16" style={{ color: '#D30000', fontSize: '20px' }}>9. Modifications</h5>
      <p className="mb-32" style={{ color: '#475569', fontSize: '15px', lineHeight: '1.7' }}>
        First Pass reserves the right to modify services, features, subscription plans, or these Terms at any time.
      </p>

      <h5 className="fw-semibold mb-16" style={{ color: '#D30000', fontSize: '20px' }}>10. Governing Law</h5>
      <p className="mb-0" style={{ color: '#475569', fontSize: '15px', lineHeight: '1.7' }}>
        These Terms shall be governed by the laws applicable in India unless otherwise specified.
      </p>
    </div>
  );

  const merchantContent = (
    <div>
      <h3 className="fw-semibold mb-12" style={{ color: '#0f172a', fontSize: '28px' }}>FIRST PASS MERCHANT TERMS & CONDITIONS</h3>
      <p className="text-neutral-500 mb-32" style={{ fontSize: '14px' }}>Effective Date: June 16, 2026</p>

      <h5 className="fw-semibold mb-16" style={{ color: '#D30000', fontSize: '20px' }}>1. Acceptance</h5>
      <p className="mb-32" style={{ color: '#475569', fontSize: '15px', lineHeight: '1.7' }}>
        By creating an account or using First Pass, you agree to these Terms and Conditions.
      </p>

      <h5 className="fw-semibold mb-16" style={{ color: '#D30000', fontSize: '20px' }}>2. Service Description</h5>
      <p className="mb-32" style={{ color: '#475569', fontSize: '15px', lineHeight: '1.7' }}>
        First Pass is a platform that allows users to discover, claim, and redeem offers provided by participating merchants. First Pass is not the provider of the products or services offered by merchants.
      </p>

      <h5 className="fw-semibold mb-16" style={{ color: '#D30000', fontSize: '20px' }}>3. Membership & Subscription</h5>
      <p className="mb-32" style={{ color: '#475569', fontSize: '15px', lineHeight: '1.7' }}>
        Some features may require a paid subscription. Subscription fees are charged according to the selected plan. Unless otherwise stated, subscriptions may renew automatically until cancelled.
      </p>

      <h5 className="fw-semibold mb-16" style={{ color: '#D30000', fontSize: '20px' }}>4. Offer Redemption</h5>
      <ul className="mb-32 ps-20" style={{ color: '#475569', fontSize: '15px', lineHeight: '1.7', listStyleType: 'disc' }}>
        <li className="mb-8">Offers are subject to merchant-specific terms.</li>
        <li className="mb-8">Merchants may verify eligibility before redemption.</li>
        <li className="mb-8">Offer availability may change without notice.</li>
        <li className="mb-0">Claimed offers do not guarantee availability if the merchant has reached redemption limits or withdrawn the offer.</li>
      </ul>

      <h5 className="fw-semibold mb-16" style={{ color: '#D30000', fontSize: '20px' }}>5. User Conduct</h5>
      <p className="mb-12" style={{ color: '#475569', fontSize: '15px' }}>Users agree not to:</p>
      <ul className="mb-32 ps-20" style={{ color: '#475569', fontSize: '15px', lineHeight: '1.7', listStyleType: 'disc' }}>
        <li className="mb-8">Share accounts</li>
        <li className="mb-8">Misuse offers</li>
        <li className="mb-8">Attempt fraudulent redemptions</li>
        <li className="mb-8">Interfere with platform operations</li>
        <li className="mb-0">Violate applicable laws</li>
      </ul>

      <h5 className="fw-semibold mb-16" style={{ color: '#D30000', fontSize: '20px' }}>6. Merchant Responsibility</h5>
      <p className="mb-12" style={{ color: '#475569', fontSize: '15px' }}>Merchants are solely responsible for:</p>
      <ul className="mb-32 ps-20" style={{ color: '#475569', fontSize: '15px', lineHeight: '1.7', listStyleType: 'disc' }}>
        <li className="mb-8">Offer accuracy</li>
        <li className="mb-8">Product quality</li>
        <li className="mb-8">Service delivery</li>
        <li className="mb-0">Redemption decisions within platform rules</li>
      </ul>

      <h5 className="fw-semibold mb-16" style={{ color: '#D30000', fontSize: '20px' }}>7. Limitation of Liability</h5>
      <p className="mb-32" style={{ color: '#475569', fontSize: '15px', lineHeight: '1.7' }}>
        First Pass acts as a marketplace platform and is not liable for disputes regarding merchant products, services, pricing, availability, or customer experiences.
      </p>

      <h5 className="fw-semibold mb-16" style={{ color: '#D30000', fontSize: '20px' }}>8. Account Suspension</h5>
      <p className="mb-32" style={{ color: '#475569', fontSize: '15px', lineHeight: '1.7' }}>
        First Pass may suspend or terminate accounts involved in abuse, fraud, policy violations, or unlawful activities.
      </p>

      <h5 className="fw-semibold mb-16" style={{ color: '#D30000', fontSize: '20px' }}>9. Modifications</h5>
      <p className="mb-32" style={{ color: '#475569', fontSize: '15px', lineHeight: '1.7' }}>
        First Pass reserves the right to modify services, features, subscription plans, or these Terms at any time.
      </p>

      <h5 className="fw-semibold mb-16" style={{ color: '#D30000', fontSize: '20px' }}>10. Governing Law</h5>
      <p className="mb-0" style={{ color: '#475569', fontSize: '15px', lineHeight: '1.7' }}>
        These Terms shall be governed by the laws applicable in India unless otherwise specified.
      </p>
    </div>
  );

  return (
    <>
      {/* Hero Banner */}
      <div className="section-hero v1">
        <div className="hero-image"></div>
        <div className="container">
          <div className="content-wrap text-center">
            <div className="title text-display-2 effectFade fadeRotateX">
              <span className="title1 fw-semibold text-gradient-1">Terms & Conditions</span>
            </div>
            <p className="text effectFade fadeUp">
              Terms & Conditions
            </p>
          </div>
        </div>
      </div>
      {/* /Hero Banner */}

      <div className="flat-spacing">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-12 text-start effectFade fadeUp">
              <div className="card p-48" style={{
                background: '#ffffff',
                borderRadius: '24px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.04)',
                color: '#1e293b'
              }}>
                
                {/* Tab Switcher */}
                <div className="d-flex justify-content-center gap-16 mb-40 pb-24" style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <button 
                    className="fw-semibold"
                    style={{
                      background: activeTab === 'customer' ? '#D30000' : '#f1f5f9',
                      color: activeTab === 'customer' ? '#FFFFFF' : '#475569',
                      border: activeTab === 'customer' ? '1px solid #D30000' : '1px solid #cbd5e1',
                      borderRadius: '9999px',
                      padding: '12px 24px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      transition: 'all 0.2s ease',
                      boxShadow: activeTab === 'customer' ? '0 4px 12px rgba(211,0,0,0.2)' : 'none'
                    }}
                    onClick={() => setActiveTab('customer')}
                  >
                    Customer Terms
                  </button>
                  <button 
                    className="fw-semibold"
                    style={{
                      background: activeTab === 'merchant' ? '#D30000' : '#f1f5f9',
                      color: activeTab === 'merchant' ? '#FFFFFF' : '#475569',
                      border: activeTab === 'merchant' ? '1px solid #D30000' : '1px solid #cbd5e1',
                      borderRadius: '9999px',
                      padding: '12px 24px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      transition: 'all 0.2s ease',
                      boxShadow: activeTab === 'merchant' ? '0 4px 12px rgba(211,0,0,0.2)' : 'none'
                    }}
                    onClick={() => setActiveTab('merchant')}
                  >
                    Merchant Terms
                  </button>
                </div>

                {activeTab === 'customer' ? customerContent : merchantContent}

              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
