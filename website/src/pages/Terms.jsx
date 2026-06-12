import './Legal.css';

const sections = [
  {
    icon: '✅',
    title: 'Acceptance of Terms',
    content: [
      {
        sub: null,
        text: 'By downloading, accessing, or using the Dealora application ("the App"), you agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use the App. These terms apply to all users including customers, merchants, and receptionists.',
      },
    ],
  },
  {
    icon: '🎯',
    title: 'Description of Service',
    content: [
      {
        sub: 'Platform Overview',
        text: 'Dealora is a platform that connects merchants and customers. It provides tools for merchants to create and manage branches, issue coupons, and manage appointments; for receptionists to manage branch operations; and for customers to discover coupons, book appointments, and communicate with businesses.',
      },
      {
        sub: 'Service Availability',
        text: 'We strive to maintain platform availability, but do not guarantee uninterrupted access. We reserve the right to modify, suspend, or discontinue any part of the service at any time with reasonable notice.',
      },
    ],
  },
  {
    icon: '👤',
    title: 'Account Registration & Eligibility',
    content: [
      {
        sub: 'Eligibility',
        text: 'You must be at least 13 years of age to use Dealora. By registering, you represent that you meet this requirement. Merchant accounts may have additional eligibility requirements.',
      },
      {
        sub: 'Account Accuracy',
        text: 'You agree to provide accurate, current, and complete information during registration and to keep your account information updated. You are responsible for maintaining the confidentiality of your login credentials.',
      },
      {
        sub: 'Account Security',
        text: 'You are solely responsible for all activities that occur under your account. Notify us immediately of any unauthorised use. We are not liable for losses resulting from unauthorised access due to your failure to maintain account security.',
      },
    ],
  },
  {
    icon: '🏪',
    title: 'Merchant Terms',
    content: [
      {
        sub: 'Merchant Responsibilities',
        text: 'Merchants are responsible for ensuring all coupon terms, appointment details, and business information provided on Dealora are accurate, lawful, and not misleading. Merchants must honour all coupons they create within their stated terms.',
      },
      {
        sub: 'Branch & Receptionist Management',
        text: 'Merchants are responsible for all actions taken by receptionist accounts they create. Merchants must ensure receptionists comply with these Terms.',
      },
      {
        sub: 'Coupon Policies',
        text: 'Coupons created on Dealora must comply with applicable laws. Merchants may not create coupons for illegal products or services, or coupons designed to deceive customers.',
      },
    ],
  },
  {
    icon: '🛍️',
    title: 'Customer Terms',
    content: [
      {
        sub: 'Coupon Use',
        text: 'Coupons claimed through Dealora are subject to the merchant\'s specific terms. Dealora does not guarantee the availability, value, or validity of any coupon. Customers should verify coupon terms directly with the merchant.',
      },
      {
        sub: 'Appointments',
        text: 'When booking appointments through Dealora, you agree to attend at the scheduled time or cancel/reschedule with reasonable notice. Repeated no-shows may result in account restrictions.',
      },
    ],
  },
  {
    icon: '🧑‍💼',
    title: 'Receptionist Terms',
    content: [
      {
        sub: 'Scope of Access',
        text: 'Receptionists may only access and manage data related to their assigned branch. Attempting to access other branches or accounts without authorisation is a violation of these Terms.',
      },
      {
        sub: 'Conduct',
        text: 'Receptionists must communicate professionally with customers through the chat system and manage appointments and coupon claims accurately and fairly.',
      },
    ],
  },
  {
    icon: '🚫',
    title: 'Prohibited Conduct',
    content: [
      {
        sub: null,
        text: 'All users are prohibited from: (1) using the platform for any unlawful purpose; (2) impersonating any person or entity; (3) uploading or transmitting harmful, offensive, or infringing content; (4) attempting to gain unauthorised access to any part of the platform; (5) scraping, harvesting, or collecting user data without consent; (6) interfering with or disrupting the integrity or performance of the platform; (7) creating fraudulent accounts or coupons.',
      },
    ],
  },
  {
    icon: '🧠',
    title: 'Intellectual Property',
    content: [
      {
        sub: 'Dealora IP',
        text: 'All content, features, and functionality of the Dealora platform — including but not limited to software, design, logos, and trademarks — are owned by Dealora and protected by applicable intellectual property laws.',
      },
      {
        sub: 'User Content',
        text: 'By uploading content (such as business descriptions, coupon details, or chat messages) to Dealora, you grant us a non-exclusive, worldwide licence to use, display, and distribute such content as necessary to operate the platform.',
      },
    ],
  },
  {
    icon: '⚠️',
    title: 'Limitation of Liability',
    content: [
      {
        sub: null,
        text: 'Dealora provides the platform "as is" without warranties of any kind. To the fullest extent permitted by law, Dealora shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the platform, including disputes between merchants and customers regarding coupons or appointments.',
      },
    ],
  },
  {
    icon: '🔚',
    title: 'Termination',
    content: [
      {
        sub: null,
        text: 'We reserve the right to suspend or terminate your account at any time for violation of these Terms, fraudulent activity, or at our discretion with notice. You may close your account at any time through the app settings. Upon termination, your access to the platform will cease.',
      },
    ],
  },
  {
    icon: '🔄',
    title: 'Changes to Terms',
    content: [
      {
        sub: null,
        text: 'We may update these Terms from time to time. We will notify you of material changes via email or in-app notification. Continued use of Dealora after changes take effect constitutes your acceptance of the revised Terms.',
      },
    ],
  },
  {
    icon: '⚖️',
    title: 'Governing Law',
    content: [
      {
        sub: null,
        text: 'These Terms shall be governed by and construed in accordance with applicable laws. Any disputes arising from these Terms or your use of Dealora shall be subject to the exclusive jurisdiction of the relevant courts.',
      },
    ],
  },
  {
    icon: '📬',
    title: 'Contact Us',
    content: [
      {
        sub: null,
        text: 'If you have questions about these Terms and Conditions, please contact the Dealora team. We are committed to resolving concerns fairly and transparently.',
      },
    ],
  },
];

export default function Terms() {
  return (
    <div className="page-wrapper">
      <div className="legal-hero">
        <div className="legal-blob legal-blob-1" aria-hidden="true" />
        <div className="container">
          <div className="legal-hero-inner animate-fade-up">
            <div className="legal-tag">Legal</div>
            <h1>Terms &amp; <span className="gradient-text">Conditions</span></h1>
            <p>Last updated: June 2025</p>
            <p className="legal-hero-sub">
              Please read these terms carefully before using Dealora. They govern your
              relationship with our platform and outline the rights and responsibilities
              of all users.
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
                  These Terms and Conditions ("Terms") constitute a legally binding agreement
                  between you and Dealora governing your use of the Dealora application and
                  related services. These Terms apply to all user types — customers, merchants,
                  and receptionists.
                </p>
              </div>

              {sections.map((s, i) => (
                <article key={s.title} id={`section-${i}`} className="legal-section animate-fade-up">
                  <div className="legal-section-header">
                    <span className="legal-section-icon">{s.icon}</span>
                    <h2>{s.title}</h2>
                  </div>
                  {s.content.map((c, ci) => (
                    <div key={ci} className="legal-block">
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
