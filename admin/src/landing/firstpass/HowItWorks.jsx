import React, { useEffect, useRef, useState } from 'react';
import './HowItWorks.css';

/* ── Merchant Icons ── */
const BuildingIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect>
    <path d="M9 22v-4h6v4"></path>
    <path d="M8 6h.01"></path><path d="M16 6h.01"></path><path d="M12 6h.01"></path>
    <path d="M12 10h.01"></path><path d="M12 14h.01"></path>
    <path d="M16 10h.01"></path><path d="M16 14h.01"></path>
    <path d="M8 10h.01"></path><path d="M8 14h.01"></path>
  </svg>
);

const UsersIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
    <circle cx="9" cy="7" r="4"></circle>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
  </svg>
);

const TagIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
    <line x1="7" y1="7" x2="7.01" y2="7"></line>
  </svg>
);

const CalendarIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
    <line x1="16" y1="2" x2="16" y2="6"></line>
    <line x1="8" y1="2" x2="8" y2="6"></line>
    <line x1="3" y1="10" x2="21" y2="10"></line>
  </svg>
);

const CheckCircleIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
    <polyline points="22 4 12 14.01 9 11.01"></polyline>
  </svg>
);

const ChartIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10"></line>
    <line x1="12" y1="20" x2="12" y2="4"></line>
    <line x1="6" y1="20" x2="6" y2="14"></line>
    <line x1="3" y1="20" x2="21" y2="20"></line>
  </svg>
);

/* ── Customer Icons ── */
const LoginIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
    <polyline points="10 17 15 12 10 7"></polyline>
    <line x1="15" y1="12" x2="3" y2="12"></line>
  </svg>
);

const SearchDealIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="10" cy="10" r="7"></circle>
    <line x1="21" y1="21" x2="15" y2="15"></line>
    <path d="M8 10h4"></path>
    <path d="M10 8v4"></path>
  </svg>
);

const BookApptIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
    <line x1="16" y1="2" x2="16" y2="6"></line>
    <line x1="8" y1="2" x2="8" y2="6"></line>
    <line x1="3" y1="10" x2="21" y2="10"></line>
    <circle cx="16" cy="16" r="2"></circle>
    <path d="M16 14v-1"></path>
    <path d="M18 16h-1"></path>
  </svg>
);

const CouponIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 9a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4V9z"></path>
    <path d="M9 12l2 2 4-4"></path>
  </svg>
);

const ConfirmIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 17H2a3 3 0 0 0 3-3V9a7 7 0 0 1 14 0v5a3 3 0 0 0 3 3z"></path>
    <path d="M9.5 17v1a2.5 2.5 0 0 0 5 0v-1"></path>
    <path d="M9 10l2 2 4-4"></path>
  </svg>
);

const ClipboardIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
    <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
    <line x1="9" y1="12" x2="15" y2="12"></line>
    <line x1="9" y1="16" x2="13" y2="16"></line>
  </svg>
);

/* ── Step Data ── */
const merchantSteps = [
{
num: '01',
title: 'Add Your Branches',
desc: 'Set up and manage multiple business branches from a single dashboard. Customize offers, track performance, and maintain complete control over each branch.',
highlights: ['Multi-branch management', 'Individual offer control', 'Centralized administration', 'Performance tracking'],
image: '1.png',
icon: <BuildingIcon />
},
{
num: '02',
title: 'Add Reception Teams',
desc: 'Assign dedicated reception staff to each branch. Manage customer interactions, bookings, and inquiries while maintaining service quality across all locations.',
highlights: ['Dedicated staff members', 'Customer communication', 'Booking management', 'Activity monitoring'],
image: '2.png',
icon: <UsersIcon />
},
{
num: '03',
title: 'Create Powerful Offers',
desc: 'Launch attractive offers that bring more customers to your business. Create discounts, special deals, and limited-time campaigns in just a few clicks.',
highlights: ['Buy One Get One offers', 'Percentage discounts', 'Fixed-value discounts', 'Super deal coupons'],
image: '3.png',
icon: <TagIcon />
},
{
num: '04',
title: 'Manage Appointments',
desc: 'Allow customers to book appointments directly through the platform. Receive instant notifications and confirm bookings effortlessly.',
highlights: ['Easy appointment scheduling', 'Instant confirmations', 'Reminder notifications', 'Branch-wise booking control'],
image: '4.png',
icon: <CalendarIcon />
},
{
num: '05',
title: 'Verify & Approve Appoinments',
desc: 'Customers enjoy a seamless coupon redemption process, and your team can review and approve coupons in real time.',
highlights: ['Secure coupon validation', 'Quick approval process', 'Real-time redemption', 'Better customer experience'],
image: '5.png',
icon: <CheckCircleIcon />
},
{
num: '06',
title: 'Track Business Performance',
desc: 'Analyze your business performance using a smart dashboard. Check customer engagement, offer success, and growth.',
highlights: ['Business analytics', 'Customer engagement reports', 'Campaign performance tracking', 'Growth insights'],
image: '6.png',
icon: <ChartIcon />
}
];

const customerSteps = [
  {
    num: '01',
    title: 'Login',
    desc: 'Get started by creating your account or logging in to the First Pass Customer App. Your personalized experience begins the moment you sign in.',
    highlights: ['Quick sign-up process', 'Secure authentication', 'Personalized dashboard', 'Profile management'],
    image: 'img/c-s/1.png',
    icon: <LoginIcon />
  },
  {
    num: '02',
    title: 'Find the Deals',
    desc: 'Browse exclusive deals and offers from top businesses near you. Discover restaurants, salons, clinics, and more — all in one place.',
    highlights: ['Location-based discovery', 'Category-wise filtering', 'Curated deals & promotions', 'Verified merchant listings'],
    image: 'img/c-s/2.png',
    icon: <SearchDealIcon />
  },
  {
    num: '03',
    title: 'Book Appointments',
    desc: 'Select your preferred service and time slot, then book an appointment in seconds. No calls, no waiting — just seamless scheduling.',
    highlights: ['Real-time availability', 'Instant booking confirmation', 'Branch selection', 'Flexible time slots'],
    image: 'img/c-s/3.png',
    icon: <BookApptIcon />
  },
  {
    num: '04',
    title: 'Claim Coupons',
    desc: 'Unlock exciting coupons and vouchers from your favourite brands. Claim them with a single tap and save more on every visit.',
    highlights: ['One-tap coupon claiming', 'Percentage & flat discounts', 'BOGO offers', 'Birthday & special deals'],
    image: 'img/c-s/4.png',
    icon: <CouponIcon />
  },
  {
    num: '05',
    title: 'Get Confirmations',
    desc: 'Receive instant booking and coupon confirmation directly on your device. Stay informed with real-time notifications so you never miss a thing.',
    highlights: ['Instant push notifications', 'Booking confirmation alerts', 'Coupon validity reminders', 'Zero missed updates'],
    image: 'img/c-s/5.png',
    icon: <ConfirmIcon />
  },
  {
    num: '06',
    title: 'Manage Your Bookings',
    desc: 'View, reschedule, or cancel bookings effortlessly from your profile. Stay in full control of your schedule with complete booking history.',
    highlights: ['Full booking history', 'Easy rescheduling', 'One-tap cancellation', 'Upcoming & past appointments'],
    image: 'img/c-s/6.png',
    icon: <ClipboardIcon />
  }
];

export default function HowItWorks() {
  const [activeStep, setActiveStep] = useState(0);
  const [activeSection, setActiveSection] = useState('merchant');
  const [scrollProgress, setScrollProgress] = useState(0);
  const [visibleSteps, setVisibleSteps] = useState([]);
  const containerRef = useRef(null);
  const stepRefs = useRef([]);

  const steps = activeSection === 'merchant' ? merchantSteps : customerSteps;

  // Reset visible steps and active step when tab changes
  const handleTabSwitch = (tab) => {
    setActiveSection(tab);
    setVisibleSteps([]);
    setActiveStep(0);
    setScrollProgress(0);
  };

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      const { top, height } = containerRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      let progress = ((windowHeight / 2) - top) / (height - windowHeight / 2);
      progress = Math.max(0, Math.min(1, progress));
      setScrollProgress(progress * 100);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    stepRefs.current = stepRefs.current.slice(0, steps.length);

    const observerOptions = {
      root: null,
      rootMargin: '0px 0px -15% 0px',
      threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const index = parseInt(entry.target.getAttribute('data-index'));
          setActiveStep(index);
          setVisibleSteps(prev => prev.includes(index) ? prev : [...prev, index]);
        }
      });
    }, observerOptions);

    stepRefs.current.forEach(ref => { if (ref) observer.observe(ref); });

    return () => {
      stepRefs.current.forEach(ref => { if (ref) observer.unobserve(ref); });
    };
  }, [activeSection]);

  return (
    <div className="hiw-container" ref={containerRef}>
      <div className="hiw-bg-glow"></div>

      <div className="hiw-header">
        <div className="hiw-header-top">
          <div className="hiw-section-toggle">
            <button
              className={`hiw-toggle-btn ${activeSection === 'merchant' ? 'active' : ''}`}
              onClick={() => handleTabSwitch('merchant')}
            >
              Merchant
            </button>
            <button
              className={`hiw-toggle-btn ${activeSection === 'customer' ? 'active' : ''}`}
              onClick={() => handleTabSwitch('customer')}
            >
              Customer
            </button>
          </div>
        </div>
        <h1 className="hiw-title">How First Pass Works</h1>
        <p className="hiw-subtitle">
          {activeSection === 'merchant'
            ? 'A simple process that helps businesses attract customers, manage offers, and grow revenue.'
            : 'A seamless journey that helps customers discover deals, book services, and save more every day.'}
        </p>
      </div>

      <div className="hiw-timeline-wrapper">
        <div className="hiw-timeline-line">
          <div className="hiw-timeline-fill" style={{ height: `${scrollProgress}%` }}></div>
        </div>

        {steps.map((step, index) => {
          const isPast = index < activeStep;
          const isActive = index === activeStep;
          let stepClasses = 'hiw-step';
          if (isActive) stepClasses += ' is-active';
          if (isPast) stepClasses += ' is-past';
          if (visibleSteps.includes(index)) stepClasses += ' is-visible';

          return (
            <div
              key={`${activeSection}-${index}`}
              className={stepClasses}
              data-index={index}
              ref={el => stepRefs.current[index] = el}
            >
              <div className="hiw-dot"></div>

              <div className="hiw-content">
                <div className="hiw-content-header">
                  <div className="hiw-icon-box">
                    {step.icon}
                  </div>
                  <div className="hiw-step-number">Step {step.num}</div>
                </div>
                <div className="hiw-content-body">
                  <h2 className="hiw-step-title">{step.title}</h2>
                  <p className="hiw-step-desc">{step.desc}</p>
                  <div className="hiw-highlights">
                    <div className="hiw-highlights-title">Highlights</div>
                    <ul className="hiw-highlights-list">
                      {step.highlights.map((highlight, hIndex) => (
                        <li key={hIndex}>{highlight}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              <div className="hiw-image">
                <div className="mobile-frame">
                  <div className="mobile-notch"></div>
                  <div className="mobile-inner">
                    <img
                      src={`asset/images/${step.image}`}
                      alt={step.title}
                      className="mobile-screen-image"
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="hiw-why-section">
        <div className="hiw-why-container">
          <h2 className="hiw-why-title">
            {activeSection === 'merchant' ? 'Why Businesses Choose First Pass' : 'Why Customers Love First Pass'}
          </h2>
          <div className="hiw-why-grid">
            {activeSection === 'merchant' ? (
              <>
                <div className="hiw-why-item"><span className="hiw-check">✔</span> Increase Customer Footfall</div>
                <div className="hiw-why-item"><span className="hiw-check">✔</span> Promote Exclusive Offers</div>
                <div className="hiw-why-item"><span className="hiw-check">✔</span> Manage Multiple Branches Easily</div>
                <div className="hiw-why-item"><span className="hiw-check">✔</span> Improve Customer Engagement</div>
                <div className="hiw-why-item"><span className="hiw-check">✔</span> Track Performance in Real Time</div>
                <div className="hiw-why-item"><span className="hiw-check">✔</span> Grow Revenue with Data-Driven Decisions</div>
              </>
            ) : (
              <>
                <div className="hiw-why-item"><span className="hiw-check">✔</span> Discover Deals Near You</div>
                <div className="hiw-why-item"><span className="hiw-check">✔</span> Book Services Instantly</div>
                <div className="hiw-why-item"><span className="hiw-check">✔</span> Save More with Exclusive Coupons</div>
                <div className="hiw-why-item"><span className="hiw-check">✔</span> Get Real-Time Confirmations</div>
                <div className="hiw-why-item"><span className="hiw-check">✔</span> Manage All Bookings in One Place</div>
                <div className="hiw-why-item"><span className="hiw-check">✔</span> Enjoy a Seamless Experience Every Visit</div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
