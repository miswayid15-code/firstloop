import './About.css';

const roles = [
  {
    icon: '🏪',
    title: 'Merchant',
    color: '#7C3AED',
    desc: 'Full control over your business',
    perks: [
      'Create & manage multiple branches',
      'Issue & manage coupons',
      'Manage receptionist accounts',
      'View all appointment bookings',
      'Access customer coupon claim reports',
    ],
  },
  {
    icon: '🧑‍💼',
    title: 'Receptionist',
    color: '#F59E0B',
    desc: 'Branch-level operations',
    perks: [
      'Access assigned branch details',
      'View coupon claim lists',
      'Manage branch appointments',
      'Communicate via live chat',
    ],
  },
  {
    icon: '🛍️',
    title: 'Customer',
    color: '#10B981',
    desc: 'Discover deals & book services',
    perks: [
      'Browse & claim exclusive coupons',
      'Book appointments effortlessly',
      'Chat directly with branches',
    ],
  },
];

const features = [
  { icon: '🏷️', title: 'Smart Coupons',     desc: 'Merchants create targeted coupon campaigns; customers discover and claim them with one tap.' },
  { icon: '📅', title: 'Appointment System', desc: 'Streamlined booking for customers with full calendar management for merchants and receptionists.' },
  { icon: '💬', title: 'Live Chat',          desc: 'Real-time messaging between customers and branch receptionists for seamless support.' },
  { icon: '🏢', title: 'Multi-Branch',       desc: 'Merchants manage unlimited branches from a single dashboard with role-based access.' },
  { icon: '📊', title: 'Analytics',          desc: 'Detailed insights on coupon claims, booking trends, and customer engagement.' },
  { icon: '🔐', title: 'Role-Based Access',  desc: 'Granular permissions ensure everyone sees only what they need — securely.' },
];

export default function About() {
  return (
    <div className="page-wrapper">
      <div className="ab-hero">
        <div className="ab-blob ab-blob-1" aria-hidden="true" />
        <div className="ab-blob ab-blob-2" aria-hidden="true" />
        <div className="container">
          <div className="ab-hero-inner animate-fade-up">
            <div className="ab-logo-wrap">
              <img src="/logo.png" alt="Dealora" className="ab-logo" />
            </div>
            <h1 className="ab-hero-title">
              About <span className="gradient-text">Dealora</span>
            </h1>
            <p className="ab-hero-sub">
              Dealora bridges merchants and customers through smart coupons, seamless booking,
              and real-time communication — all inside one powerful platform.
            </p>
          </div>
        </div>
      </div>

      {/* Mission */}
      <section className="ab-section">
        <div className="container">
          <div className="ab-mission animate-fade-up">
            <div className="ab-mission-text">
              <div className="ab-tag">Our Mission</div>
              <h2>Connecting businesses<br />with their customers</h2>
              <p>
                Dealora is an application built for both merchants and customers. We empower
                businesses of all sizes to digitize their coupon strategies, manage appointments,
                and communicate with customers — while giving customers a single app to discover
                deals, book services, and stay connected with their favourite local businesses.
              </p>
              <p>
                With Dealora's role-based system, merchants retain full business control while
                receptionists handle day-to-day branch operations efficiently.
              </p>
            </div>
            <div className="ab-mission-visual">
              <div className="ab-stat-grid">
                {[
                  { num: '3',    label: 'App Roles' },
                  { num: '∞',    label: 'Branches' },
                  { num: '100%', label: 'Secure' },
                  { num: '24/7', label: 'Live Chat' },
                ].map(s => (
                  <div key={s.label} className="ab-stat">
                    <span className="ab-stat-num gradient-text">{s.num}</span>
                    <span className="ab-stat-label">{s.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="ab-section ab-section-alt">
        <div className="container">
          <div className="ab-section-header animate-fade-up">
            <div className="ab-tag">Platform Features</div>
            <h2>Everything you need, in one place</h2>
          </div>
          <div className="ab-features-grid animate-fade-up-2">
            {features.map(f => (
              <div key={f.title} className="ab-feature-card">
                <span className="ab-feature-icon">{f.icon}</span>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Roles */}
      <section className="ab-section">
        <div className="container">
          <div className="ab-section-header animate-fade-up">
            <div className="ab-tag">Role-Based System</div>
            <h2>Built for every stakeholder</h2>
            <p className="ab-section-sub">
              Dealora's role-based system ensures the right people have the right tools.
            </p>
          </div>
          <div className="ab-roles animate-fade-up-2">
            {roles.map(r => (
              <div key={r.title} className="ab-role-card" style={{ '--role-color': r.color }}>
                <div className="ab-role-header">
                  <span className="ab-role-icon">{r.icon}</span>
                  <div>
                    <h3>{r.title}</h3>
                    <p className="ab-role-desc">{r.desc}</p>
                  </div>
                </div>
                <ul className="ab-role-perks">
                  {r.perks.map(p => (
                    <li key={p}>
                      <span className="ab-role-check" aria-hidden="true">✓</span>
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="ab-cta animate-fade-up">
        <div className="container">
          <div className="ab-cta-inner">
            <div className="ab-blob ab-blob-cta" aria-hidden="true" />
            <h2>Ready to transform your business?</h2>
            <p>Join Dealora and connect with customers like never before.</p>
            <a href="/" className="ab-cta-btn">Get Early Access</a>
          </div>
        </div>
      </section>
    </div>
  );
}
