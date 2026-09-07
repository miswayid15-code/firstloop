import React from 'react';

export default function DataPolicy() {
  return (
    <>
      {/* Hero Banner */}
      <div className="section-hero v1">
        <div className="hero-image"></div>
        <div className="container">
          <div className="content-wrap text-center">
            <div className="title text-display-2 effectFade fadeRotateX">
              <span className="title1 fw-semibold text-gradient-1">Privacy Policy</span>
            </div>
            <p className="text effectFade fadeUp">
              Last updated: June 16, 2026
            </p>
          </div>
        </div>
      </div>
      {/* /Hero Banner */}

      {/* content section */}
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
                <h3 className="fw-semibold mb-24" style={{ color: '#0f172a', fontSize: '28px' }}>FIRST PASS PRIVACY POLICY</h3>
                <p className="mb-32" style={{ color: '#475569', fontSize: '16px', lineHeight: '1.8' }}>
                  Welcome to First Pass. We respect your privacy and are committed to protecting your personal information.
                </p>

                <h5 className="fw-semibold mb-16" style={{ color: '#D30000', fontSize: '20px' }}>1. Information We Collect</h5>
                
                <h6 className="fw-semibold mb-8" style={{ color: '#0f172a', fontSize: '16px' }}>Customer App</h6>
                <p className="mb-8" style={{ color: '#475569', fontSize: '15px' }}>We may collect:</p>
                <ul className="mb-24 ps-20" style={{ color: '#475569', fontSize: '15px', lineHeight: '1.7', listStyleType: 'disc' }}>
                  <li className="mb-4">Name</li>
                  <li className="mb-4">Mobile number</li>
                  <li className="mb-4">Email address</li>
                  <li className="mb-4">Profile information</li>
                  <li className="mb-4">Location information (if permitted)</li>
                  <li className="mb-4">Device and app usage information</li>
                  <li className="mb-0">Subscription and payment information</li>
                </ul>

                <h6 className="fw-semibold mb-8" style={{ color: '#0f172a', fontSize: '16px' }}>Merchant App</h6>
                <p className="mb-8" style={{ color: '#475569', fontSize: '15px' }}>We may collect:</p>
                <ul className="mb-32 ps-20" style={{ color: '#475569', fontSize: '15px', lineHeight: '1.7', listStyleType: 'disc' }}>
                  <li className="mb-4">Business name</li>
                  <li className="mb-4">Owner details</li>
                  <li className="mb-4">Contact information</li>
                  <li className="mb-4">Branch information</li>
                  <li className="mb-4">Staff account information</li>
                  <li className="mb-4">Offer and redemption data</li>
                  <li className="mb-0">Appointment and customer interaction records</li>
                </ul>

                <h5 className="fw-semibold mb-16" style={{ color: '#D30000', fontSize: '20px' }}>2. How We Use Information</h5>
                <p className="mb-8" style={{ color: '#475569', fontSize: '15px' }}>We use collected information to:</p>
                <ul className="mb-32 ps-20" style={{ color: '#475569', fontSize: '15px', lineHeight: '1.7', listStyleType: 'disc' }}>
                  <li className="mb-4">Provide and improve First Pass services</li>
                  <li className="mb-4">Manage customer accounts</li>
                  <li className="mb-4">Manage merchant accounts</li>
                  <li className="mb-4">Enable offer discovery and redemption</li>
                  <li className="mb-4">Facilitate appointments and customer communication</li>
                  <li className="mb-4">Process subscriptions and payments</li>
                  <li className="mb-4">Prevent fraud and misuse</li>
                  <li className="mb-0">Provide customer support</li>
                </ul>

                <h5 className="fw-semibold mb-16" style={{ color: '#D30000', fontSize: '20px' }}>3. Information Sharing</h5>
                <p className="mb-16" style={{ color: '#475569', fontSize: '15px', lineHeight: '1.7' }}>
                  First Pass does not sell personal information.
                </p>
                <p className="mb-8" style={{ color: '#475569', fontSize: '15px' }}>We may share information:</p>
                <ul className="mb-32 ps-20" style={{ color: '#475569', fontSize: '15px', lineHeight: '1.7', listStyleType: 'disc' }}>
                  <li className="mb-4">Between customers and merchants when necessary for offer redemption or appointments</li>
                  <li className="mb-4">With payment processors</li>
                  <li className="mb-4">With service providers supporting our platform</li>
                  <li className="mb-0">When required by law</li>
                </ul>

                <h5 className="fw-semibold mb-16" style={{ color: '#D30000', fontSize: '20px' }}>4. Data Security</h5>
                <p className="mb-32" style={{ color: '#475569', fontSize: '15px', lineHeight: '1.7' }}>
                  We implement reasonable technical and organizational measures to protect user information. However, no system can guarantee absolute security.
                </p>

                <h5 className="fw-semibold mb-16" style={{ color: '#D30000', fontSize: '20px' }}>5. User Responsibilities</h5>
                <p className="mb-32" style={{ color: '#475569', fontSize: '15px', lineHeight: '1.7' }}>
                  Users are responsible for maintaining the confidentiality of their account credentials.
                </p>

                <h5 className="fw-semibold mb-16" style={{ color: '#D30000', fontSize: '20px' }}>6. Data Retention</h5>
                <p className="mb-32" style={{ color: '#475569', fontSize: '15px', lineHeight: '1.7' }}>
                  We retain information as long as necessary to provide services, comply with legal obligations, resolve disputes, and enforce agreements.
                </p>

                <h5 className="fw-semibold mb-16" style={{ color: '#D30000', fontSize: '20px' }}>7. Children's Privacy</h5>
                <p className="mb-32" style={{ color: '#475569', fontSize: '15px', lineHeight: '1.7' }}>
                  First Pass is not intended for users under the age of 18 without parental or guardian consent.
                </p>

                <h5 className="fw-semibold mb-16" style={{ color: '#D30000', fontSize: '20px' }}>8. Changes to this Policy</h5>
                <p className="mb-32" style={{ color: '#475569', fontSize: '15px', lineHeight: '1.7' }}>
                  We may update this Privacy Policy from time to time. Continued use of First Pass constitutes acceptance of the updated policy.
                </p>

                <h5 className="fw-semibold mb-16" style={{ color: '#D30000', fontSize: '20px' }}>9. Contact Us</h5>
                <p className="mb-0" style={{ color: '#475569', fontSize: '15px', lineHeight: '1.8' }}>
                  For privacy-related questions, contact:<br />
                  <strong>Email:</strong> info.firstpassapp.co <br />
                  <strong>Company:</strong> Byte Nova
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
