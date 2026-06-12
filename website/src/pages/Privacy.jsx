import './Legal.css';

const sections = [
  {
    icon: '📋',
    title: 'Information We Collect',
    content: [
      {
        sub: 'Account Information',
        text: 'When you register for Dealora, we collect your name, email address, phone number, and account credentials. Merchant accounts additionally provide business name, branch details, and business contact information.',
      },
      {
        sub: 'Usage Data',
        text: 'We automatically collect information about how you interact with our platform, including coupon views and claims, appointment bookings, chat messages, pages visited, device information, IP address, and browser type.',
      },
      {
        sub: 'Transaction Data',
        text: 'We record details of coupon claims, appointment bookings, and other interactions within the platform to provide our services and generate analytics for merchants.',
      },
    ],
  },
  {
    icon: '⚙️',
    title: 'How We Use Your Information',
    content: [
      {
        sub: 'Service Delivery',
        text: 'To provide, maintain, and improve the Dealora platform, including processing appointments, managing coupon claims, and facilitating chat between customers and branches.',
      },
      {
        sub: 'Communications',
        text: 'To send you service-related notifications, updates about your bookings or coupons, and (with your consent) promotional communications.',
      },
      {
        sub: 'Analytics & Improvement',
        text: 'To analyse usage patterns and improve our platform features, user experience, and merchant tools.',
      },
    ],
  },
  {
    icon: '🤝',
    title: 'Sharing of Information',
    content: [
      {
        sub: 'Between Users',
        text: 'Customer coupon claim details and appointment information are shared with the relevant merchant and their assigned receptionists within the Dealora platform. Chat messages are shared between the customer and the branch they communicate with.',
      },
      {
        sub: 'Third-Party Services',
        text: 'We may share data with trusted service providers who assist in operating our platform (e.g., hosting, analytics). These parties are bound by confidentiality agreements.',
      },
      {
        sub: 'Legal Requirements',
        text: 'We may disclose information when required by law, regulation, legal process, or governmental request.',
      },
    ],
  },
  {
    icon: '🔐',
    title: 'Data Security',
    content: [
      {
        sub: 'Our Measures',
        text: 'We implement industry-standard security measures including encryption in transit and at rest, secure authentication, and regular security audits to protect your information from unauthorised access, disclosure, or loss.',
      },
      {
        sub: 'Role-Based Access',
        text: 'Our platform enforces strict role-based access controls: merchants access all their business data; receptionists access only their assigned branch data; customers access only their own account data.',
      },
    ],
  },
  {
    icon: '⏳',
    title: 'Data Retention',
    content: [
      {
        sub: 'Retention Periods',
        text: 'We retain your personal information for as long as your account is active or as needed to provide services. You may request deletion of your account and associated data at any time.',
      },
    ],
  },
  {
    icon: '✅',
    title: 'Your Rights',
    content: [
      {
        sub: 'Access & Correction',
        text: 'You have the right to access, correct, or update your personal information through your account settings at any time.',
      },
      {
        sub: 'Deletion',
        text: 'You may request deletion of your account and personal data. Note that some information may be retained where required by law or for legitimate business purposes.',
      },
      {
        sub: 'Opt-Out',
        text: 'You may opt out of promotional communications at any time by updating your notification preferences or contacting us.',
      },
    ],
  },
  {
    icon: '🍪',
    title: 'Cookies & Tracking',
    content: [
      {
        sub: 'Usage',
        text: 'Dealora uses cookies and similar tracking technologies to maintain your session, remember preferences, and analyse usage. You can control cookie settings through your browser; however, disabling cookies may affect certain platform features.',
      },
    ],
  },
  {
    icon: '👶',
    title: "Children's Privacy",
    content: [
      {
        sub: 'Age Restriction',
        text: 'Dealora is not intended for users under the age of 13. We do not knowingly collect personal information from children. If you believe a child has provided us with personal data, please contact us immediately.',
      },
    ],
  },
  {
    icon: '🔄',
    title: 'Changes to This Policy',
    content: [
      {
        sub: 'Updates',
        text: 'We may update this Privacy Policy from time to time. We will notify you of significant changes via email or in-app notification. Continued use of Dealora after changes constitutes acceptance of the updated policy.',
      },
    ],
  },
  {
    icon: '📬',
    title: 'Contact Us',
    content: [
      {
        sub: 'Privacy Questions',
        text: 'If you have any questions about this Privacy Policy or our data practices, please contact us. We are committed to addressing your concerns promptly and transparently.',
      },
    ],
  },
];

export default function Privacy() {
  return (
    <div className="page-wrapper">
      <div className="legal-hero">
        <div className="legal-blob legal-blob-1" aria-hidden="true" />
        <div className="container">
          <div className="legal-hero-inner animate-fade-up">
            <div className="legal-tag">Legal</div>
            <h1>Privacy <span className="gradient-text">Policy</span></h1>
            <p>Last updated: June 2025</p>
            <p className="legal-hero-sub">
              At Dealora, your privacy matters. This policy explains what data we collect,
              how we use it, and your rights — clearly and transparently.
            </p>
          </div>
        </div>
      </div>

      <div className="legal-body">
        <div className="container">
          <div className="legal-layout">
            {/* Sidebar TOC */}
            <aside className="legal-toc" aria-label="Table of contents">
              <div className="legal-toc-inner">
                <p className="legal-toc-title">Contents</p>
                <nav>
                  {sections.map((s, i) => (
                    <a key={s.title} href={`#section-${i}`} className="legal-toc-item">
                      <span className="legal-toc-icon">{s.icon}</span>
                      {s.title}
                    </a>
                  ))}
                </nav>
              </div>
            </aside>

            {/* Content */}
            <main className="legal-content">
              <div className="legal-intro">
                <p>
                  This Privacy Policy applies to the Dealora mobile and web application
                  and governs the collection, use, and protection of personal information
                  for all users — customers, merchants, and receptionists.
                </p>
              </div>

              {sections.map((s, i) => (
                <article key={s.title} id={`section-${i}`} className="legal-section animate-fade-up">
                  <div className="legal-section-header">
                    <span className="legal-section-icon">{s.icon}</span>
                    <h2>{s.title}</h2>
                  </div>
                  {s.content.map(c => (
                    <div key={c.sub} className="legal-block">
                      {c.sub && <h3>{c.sub}</h3>}
                      <p>{c.text}</p>
                    </div>
                  ))}
                </article>
              ))}
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
