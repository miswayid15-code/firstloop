import React, { useState, useEffect } from "react";
const logoWatermark = "/asset/images/img/fs.png";
const newLogo = "/asset/images/img/new-logo.png";

export default function Landing() {
  const [activeInd, setActiveInd] = useState(0);
  const [activeFeatureTab, setActiveFeatureTab] = useState("customer");
  const [activeFaqTab, setActiveFaqTab] = useState("customer");

  const merchantFeatures = {
    left: [
      {
        icon: (
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#EA2B16"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
            <line x1="7" y1="7" x2="7.01" y2="7"></line>
          </svg>
        ),
        title: "Manage Branches",
        desc: "Add, update and manage multiple branches or outlets easily.",
      },
      {
        icon: (
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#EA2B16"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20 7H4a2 2 0 0 0-2 2v2a2 2 0 0 1 0 4v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a2 2 0 0 1 0-4V9a2 2 0 0 0-2-2z"></path>
          </svg>
        ),
        title: "Create Offers",
        desc: "Design exciting offers and launch campaigns to increase sales.",
      },
      {
        icon: (
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#EA2B16"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
          </svg>
        ),
        title: "Manage Appointments",
        desc: "View, approve, reject and manage appointments seamlessly.",
      },
    ],
    right: [
      {
        icon: (
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#EA2B16"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="8.5" cy="7" r="4"></circle>
            <polyline points="17 11 19 13 23 9"></polyline>
          </svg>
        ),
        title: "Chat with Customers",
        desc: "Chat with customers and provide instant support.",
      },
      {
        icon: (
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#EA2B16"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
          </svg>
        ),
        title: "Manage Staff",
        desc: "Create receptionist accounts with branch-specific access.",
      },
      {
        icon: (
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#EA2B16"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
            <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path>
            <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
          </svg>
        ),
        title: "Track Performance",
        desc: "Monitor revenue, appointments, and overall business growth.",
      },
    ],
  };

  // const customerFeatures = merchantFeatures;

  const customerFeatures = {
    left: [
      {
        icon: (
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#EA2B16"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="10" cy="10" r="7"></circle>
            <line x1="21" y1="21" x2="15" y2="15"></line>
            <path d="M8 7l-1-1"></path>
            <path d="M7 8v2.5a1.5 1.5 0 0 0 3 0V8"></path>
          </svg>
        ),
        title: "Find your deals",
        desc: "Get to know about the exciting deals out there.",
      },
      {
        icon: (
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#EA2B16"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M2 9a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4V9z"></path>
            <path d="M9 12l2 2 4-4"></path>
          </svg>
        ),
        title: "Claim Coupons",
        desc: "Get exciting offers and discounts by claiming coupons.",
      },
      {
        icon: (
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#EA2B16"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M22 17H2a3 3 0 0 0 3-3V9a7 7 0 0 1 14 0v5a3 3 0 0 0 3 3z"></path>
            <path d="M9.5 17v1a2.5 2.5 0 0 0 5 0v-1"></path>
            <path d="M9 10l2 2 4-4"></path>
          </svg>
        ),
        title: "Get Confirmations",
        desc: "Receive instant confirmation and never miss an appointment.",
      },
    ],
    center: [
      <div className="features-center flex-shrink-0 text-center d-none d-lg-block">
        <div
          className="d-flex justify-content-center position-relative mx-auto"
          style={{ height: "520px", width: "202px" }}
        >
          {/* Center phone */}
          <div
            className="mockup-frame position-absolute"
            style={{
              width: "230px",
              height: "480px",
              borderRadius: "30px",
              border: "8px solid #1A1C1E",
              overflow: "hidden",
              left: "50%",
              top: "-181px",
              transform: "translateX(-50%)",
              marginLeft: "0px",
              background: "linear-gradient(135deg, #EA2B16 0%, #FF3B26 100%)",
              zIndex: 2,
              boxShadow: "0 20px 50px rgba(0,0,0,0.6)",
            }}
          >
            <div
              className="notch"
              style={{
                position: "absolute",
                top: "0",
                left: "50%",
                transform: "translateX(-50%)",
                width: "85px",
                height: "20px",
                background: "#1A1C1E",
                borderBottomLeftRadius: "12px",
                borderBottomRightRadius: "12px",
                zIndex: 10,
              }}
            ></div>
            <div
              className="mobile-content h-100 position-relative z-1"
              style={{ padding: 0 }}
            >
              <img
                src="asset/images/img/m/c-main.png"
                alt="App Screen"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>
          </div>
        </div>
      </div>,
    ],
    right: [
      {
        icon: (
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#EA2B16"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
            <circle cx="16" cy="16" r="2"></circle>
            <path d="M16 14v-1"></path>
            <path d="M18 16h-1"></path>
          </svg>
        ),
        title: "Book Appointments",
        desc: "View and book appointments seamlessly.",
      },
      {
        icon: (
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#EA2B16"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
            <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
            <line x1="9" y1="12" x2="15" y2="12"></line>
            <line x1="9" y1="16" x2="13" y2="16"></line>
          </svg>
        ),
        title: "Manage your bookings",
        desc: "Track, reschedule, and cancel bookings effortlessly.",
      },
      {
        icon: (
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#EA2B16"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="2" y="6" width="20" height="14" rx="2"></rect>
            <path d="M2 10h20"></path>
            <path d="M12 14h2"></path>
            <path d="M6 14h2"></path>
            <circle cx="17" cy="17" r="3"></circle>
            <path d="M16.5 15.5l1 3"></path>
          </svg>
        ),
        title: "Save More on Every Booking",
        desc: "Get exclusive deals and discounts on your bookings.",
      },
    ],
  };

  const activeFeatures =
    activeFeatureTab === "merchant" ? merchantFeatures : customerFeatures;

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveInd((prev) => (prev + 1) % industries.length);
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  /* ── Screen 1: Merchant Dashboard UI ── */
  const dashboardScreen = (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "#f4f4f6",
        fontFamily: "'Inter', 'SF Pro Display', sans-serif",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        fontSize: "10px",
      }}
    >
      {/* Status bar */}
      <div
        style={{
          background: "#fff",
          padding: "6px 10px 4px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span style={{ fontWeight: 700, fontSize: "9px" }}>2:50</span>
        <div style={{ display: "flex", gap: 3, alignItems: "center" }}>
          <svg width="10" height="8" viewBox="0 0 10 8">
            <rect x="0" y="4" width="2" height="4" fill="#1a1a1a" rx="0.5" />
            <rect
              x="3"
              y="2.5"
              width="2"
              height="5.5"
              fill="#1a1a1a"
              rx="0.5"
            />
            <rect x="6" y="1" width="2" height="7" fill="#1a1a1a" rx="0.5" />
          </svg>
          <svg width="10" height="8" viewBox="0 0 12 9">
            <path
              d="M6 2C4.4 2 3 2.6 2 3.6L0.5 2.1C2 0.8 3.9 0 6 0s4 .8 5.5 2.1L10 3.6C9 2.6 7.6 2 6 2z"
              fill="#1a1a1a"
            />
            <path
              d="M6 5c-.8 0-1.5.3-2 .8L2.5 4.3C3.5 3.5 4.7 3 6 3s2.5.5 3.5 1.3L8 5.8C7.5 5.3 6.8 5 6 5z"
              fill="#1a1a1a"
            />
            <circle cx="6" cy="8" r="1.2" fill="#1a1a1a" />
          </svg>
          <svg width="14" height="8" viewBox="0 0 20 10">
            <rect
              x="0"
              y="1"
              width="17"
              height="8"
              rx="2"
              stroke="#1a1a1a"
              strokeWidth="1.2"
              fill="none"
            />
            <rect x="17.5" y="3.5" width="2" height="3" rx="1" fill="#1a1a1a" />
            <rect x="1" y="2" width="13" height="6" rx="1.2" fill="#1a1a1a" />
          </svg>
        </div>
      </div>

      {/* Header */}
      <div
        style={{
          background: "#fff",
          padding: "8px 10px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid #eee",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <div
            style={{
              width: 14,
              height: 1.5,
              background: "#1a1a1a",
              borderRadius: 1,
            }}
          />
          <div
            style={{
              width: 10,
              height: 1.5,
              background: "#1a1a1a",
              borderRadius: 1,
            }}
          />
          <div
            style={{
              width: 14,
              height: 1.5,
              background: "#1a1a1a",
              borderRadius: 1,
            }}
          />
        </div>
        <span style={{ fontWeight: 700, fontSize: "11px", color: "#1a1a1a" }}>
          Merchant Dashboard
        </span>
        <div
          style={{
            width: 18,
            height: 18,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path
              d="M18 8A6 6 0 1 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"
              stroke="#c0392b"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M13.73 21a2 2 0 0 1-3.46 0"
              stroke="#c0392b"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </div>
      </div>

      {/* Body */}
      <div
        style={{
          flex: 1,
          overflow: "hidden",
          padding: "5px 7px",
          display: "flex",
          flexDirection: "column",
          gap: 4,
        }}
      >
        {/* Welcome */}
        <div style={{ marginBottom: 2 }}>
          <div style={{ color: "#666", fontSize: "8px" }}>Welcome back,</div>
          <div
            style={{
              fontWeight: 800,
              fontSize: "12px",
              color: "#1a1a1a",
              lineHeight: 1.2,
            }}
          >
            First Pass Foods
          </div>
        </div>

        {/* Merchant card */}
        <div
          style={{
            background: "#fff",
            borderRadius: 7,
            border: "1.5px solid #c0392b",
            padding: "5px 8px",
            display: "flex",
            alignItems: "center",
            gap: 7,
          }}
        >
          <div
            style={{
              width: 22,
              height: 22,
              borderRadius: 11,
              background: "#f0e0e0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="#c0392b">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: "9px", color: "#1a1a1a" }}>
              First Pass Foods
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 3,
                marginTop: 1,
              }}
            >
              <svg width="8" height="8" viewBox="0 0 12 12">
                <circle cx="6" cy="6" r="6" fill="#27ae60" />
                <path
                  d="M3.5 6l2 2 3-3"
                  stroke="#fff"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span style={{ fontSize: "7.5px", color: "#555" }}>
                Verified Merchant
              </span>
            </div>
          </div>
        </div>

        {/* Stats grid */}
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}
        >
          {[
            { icon: "🏷️", val: 0, label: "Active Coupons", bg: "#fde8e8" },
            { icon: "👥", val: 0, label: "Redeemed Customers", bg: "#ebebeb" },
            { icon: "🏪", val: 1, label: "Active Branches", bg: "#ebebeb" },
            {
              icon: "🧍",
              val: 1,
              label: "Active Receptionists",
              bg: "#fde8e8",
            },
          ].map((s, i) => (
            <div
              key={i}
              style={{
                background: "#fff",
                borderRadius: 6,
                padding: "5px 6px",
                display: "flex",
                flexDirection: "column",
                gap: 1,
              }}
            >
              <div
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 4,
                  background: s.bg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "9px",
                }}
              >
                {s.icon}
              </div>
              <div
                style={{ fontWeight: 800, fontSize: "11px", color: "#1a1a1a" }}
              >
                {s.val}
              </div>
              <div
                style={{ fontSize: "6.5px", color: "#888", lineHeight: 1.2 }}
              >
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* CTA card */}
        <div
          style={{
            background: "#fff",
            borderRadius: 7,
            border: "1px solid #f0d0d0",
            padding: "6px 8px",
          }}
        >
          <div
            style={{
              fontWeight: 700,
              fontSize: "9px",
              color: "#c0392b",
              marginBottom: 1,
            }}
          >
            Create New Coupon
          </div>
          <div style={{ fontSize: "7px", color: "#888", marginBottom: 5 }}>
            Launch Campaign to Increase Sales
          </div>
          <div
            style={{
              background: "#c0392b",
              borderRadius: 20,
              padding: "4px 10px",
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <span style={{ color: "#fff", fontWeight: 700, fontSize: "8px" }}>
              Get Started
            </span>
            <div
              style={{
                width: 11,
                height: 11,
                borderRadius: 6,
                border: "1.5px solid rgba(255,255,255,0.5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg width="6" height="6" viewBox="0 0 10 10">
                <path
                  d="M2 5h6M5 2l3 3-3 3"
                  stroke="#fff"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom nav */}
      <div
        style={{
          background: "#fff",
          borderTop: "1px solid #eee",
          padding: "5px 4px 4px",
          display: "flex",
          justifyContent: "space-around",
          alignItems: "center",
        }}
      >
        {[
          { icon: "🏠", label: "Home", active: true },
          { icon: "📅", label: "Appts", active: false },
          { icon: null, label: "Add", active: false, fab: true },
          { icon: "🏪", label: "Branches", active: false },
          { icon: "🏷️", label: "Coupons", active: false },
        ].map((n, i) =>
          n.fab ? (
            <div
              key={i}
              style={{
                width: 24,
                height: 24,
                borderRadius: 12,
                background: "#c0392b",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginTop: -10,
                boxShadow: "0 2px 8px rgba(192,57,43,0.4)",
              }}
            >
              <svg width="10" height="10" viewBox="0 0 12 12">
                <path
                  d="M6 2v8M2 6h8"
                  stroke="#fff"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          ) : (
            <div
              key={i}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 1,
              }}
            >
              <span style={{ fontSize: "10px" }}>{n.icon}</span>
              <span
                style={{
                  fontSize: "6px",
                  color: n.active ? "#c0392b" : "#999",
                  fontWeight: n.active ? 700 : 400,
                }}
              >
                {n.label}
              </span>
              {n.active && (
                <div
                  style={{
                    width: 14,
                    height: 2,
                    background: "#c0392b",
                    borderRadius: 1,
                  }}
                />
              )}
            </div>
          ),
        )}
      </div>
    </div>
  );

  const industries = [
    {
      title: "Login",
      projects: "Step-1",
      image: "asset/images/img/c-s/1.png",
      screenContent: null,
      color: "#03fa83ff",
      subtitle: "Your journey starts here.",
      description:
        "Unlock powerful tools to manage your businesses with cutting-edge digital solutions — from seamless booking platforms to immersive brand experiences that delight guests and drive loyalty.",
      // btnLabel: "Explore Hospitality Work"
    },
    {
      title: "Welcome !",
      projects: "Step-2",
      image: "asset/images/img/c-s/2.PNG",
      screenContent: null,
      color: "#03fa83ff",
      // subtitle: "SaaS, Startups & Tech Companies",
      description:
        "Welcome to First Pass, your destination for the latest deals, exclusive offers, and valuable opportunities.Stay ahead with personalized offers crafted to deliver the best value for every purchase.",
      // btnLabel: "Explore IT/Software Work"
    },
    {
      title: "Book Appointments",
      projects: "Step-3",
      image: "asset/images/img/c-s/3.PNG",
      screenContent: null,
      color: "#03fa83ff",
      // subtitle: "Property, Construction & Investment",
      description:
        "Schedule appointments at your favorite shop anytime, anywhere. Connect with trusted businesses and manage your bookings effortlessly.",
      // btnLabel: "Explore Real Estate Work"
    },
    {
      title: "Claim Coupons",
      projects: "Step-4",
      image: "asset/images/img/c-s/4.PNG",
      screenContent: null,
      color: "#03fa83ff",
      // subtitle: "Property, Construction & Investment",
      description:
        "Claim exclusive coupons and unlock special discounts on your favorite products and services. Save more on every purchase with offers tailored just for you.",
      // btnLabel: "Explore Real Estate Work"
    },
    {
      title: "Get Confirmations !",
      projects: "Step-5",
      image: "asset/images/img/c-s/5.PNG",
      screenContent: null,
      color: "#03fa83ff",
      // subtitle: "Property, Construction & Investment",
      description:
        "Receive instant confirmations for your bookings, appointments, and claimed offers. Stay updated with real-time notifications for a smooth and reliable experience.",
      // btnLabel: "Explore Real Estate Work"
    },
    {
      title: "Manage Your Bookings",
      projects: "Step-6",
      image: "asset/images/img/c-s/6.PNG",
      screenContent: null,
      color: "#03fa83ff",
      // subtitle: "Property, Construction & Investment",
      description:
        "Easily manage all your bookings in one convenient place. View, reschedule, or track your appointments anytime with complete flexibility.",
      // btnLabel: "Explore Real Estate Work"
    },
  ];

  return (
    <>
      {/* Hero Banner */}
      <div className="section-hero">
        <div className="hero-image">
          {/* <video className="" muted={true} autoPlay={true} loop={true} playsInline={true}>
            <source src="asset/images/video/hero.mp4" type="video/mp4" />
          </video> */}
        </div>
        <div className="container">
          <div className="content-wrap text-center">
            <div className="title text-display-2 effectFade fadeRotateX">
              <span
                className="title1 fw-semibold text-gradient-1"
                style={{ fontSize: "60px" }}
              >
                Shop Smart, Save More
              </span>
              {/* <br /> */}
              <div className="title2 d-flex gap-20 justify-content-center flex-wrap">
                <span
                  className="fw-semibold text-gradient-1"
                  style={{ fontSize: "60px" }}
                >
                  Grow Your Success
                </span>
                {/* <div className="title-icon d-block d-lg-none mt-3">
                  <img src="asset/images/img/fs.png" alt="First Pass" style={{ height: '163px', objectFit: 'contain', width: '100%' }} />
                </div> */}
              </div>
            </div>
            <p className="text effectFade fadeUp" style={{ color: "white" }}>
              The All-in-One Business Management Platform.
            </p>
            <div className="bot-btns d-flex flex-column flex-sm-row justify-content-center align-items-center gap-3 effectFade fadeRotateX">
              <a
                href="https://play.google.com/store/apps/details?id=com.app.firstpass_partner"
                // onClick={(e) => e.preventDefault()}
                className="tf-btn"
              >
                <i className="icon icon-play-filled"></i> Get it on Play Store
              </a>
              <a
                href="https://apps.apple.com/in/app/firstpass-partner/id6781702214"
                // onClick={(e) => e.preventDefault()}
                className="tf-btn-2"
              >
                <i className="icon icon-apple"></i> Download on App Store
              </a>
            </div>
          </div>
        </div>
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            const footerEl = document.getElementById("footer");
            if (footerEl) {
              footerEl.scrollIntoView({ behavior: "smooth" });
            }
          }}
          className="scroll-more"
        >
          <span className="fw-semibold link1">Scroll for more</span>
          <i className="icon icon-long-arrow-alt-down-solid"></i>
        </a>
      </div>
      {/* /Hero Banner */}

      {/* Industries We Serve Section */}
      <section className="industries-section">
        <div className="container position-relative">
          <div className="industries-logo-wrap">
            <img src={newLogo} alt="First Pass" className="industries-logo" />
          </div>
          <div className="industries-grid">
            <div className="industries-content effectFade fadeUp">
              {/* Static header — always visible */}
              <h2 className="industries-title">How It Works</h2>

              {/* Dynamic content block — changes with carousel */}
              <div className="industries-dynamic" key={activeInd}>
                <div
                  className="industries-badge"
                  style={{
                    borderColor: industries[activeInd].color,
                    color: industries[activeInd].color,
                  }}
                >
                  {industries[activeInd].projects}
                </div>
                <div className="industries-subtitle fw-semibold">
                  {industries[activeInd].title}
                </div>
                <div className="industries-industry-sub">
                  {industries[activeInd].subtitle}
                </div>
                <p className="industries-desc">
                  {industries[activeInd].description}
                </p>
                {/* <a href="#" onClick={(e) => e.preventDefault()} className="industries-btn">
                  <span className="btn-icon">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect width="20" height="20" rx="10" fill="white" fillOpacity="0.2" />
                      <path d="M6 14L14 6M14 6H9M14 6V11" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  {industries[activeInd].btnLabel}
                </a> */}
              </div>

              {/* Progress dots for quick navigation */}
              {/* <div className="industries-nav-dots">
                {industries.map((ind, i) => (
                  <button
                    key={i}
                    className={`ind-nav-dot ${i === activeInd ? 'active' : ''}`}
                    style={i === activeInd ? { backgroundColor: ind.color } : {}}
                    onClick={() => setActiveInd(i)}
                    aria-label={ind.title}
                  />
                ))}
              </div> */}

              <style>{`
                .industries-section .container {
                  position: relative;
                }
                .industries-logo-wrap {
                  position: absolute;
                  top: -55px;
                  left: 15px;
                  z-index: 10;
                }
                .industries-logo {
                  height: 80px;
                  width: auto;
                  object-fit: contain;
                }
                @media (max-width: 576px) {
                  .industries-logo-wrap {
                    top: -55px;
                    left: 15px;
                  }
                  .industries-logo {
                    height: 45px;
                  }
                }
                .industries-dynamic {
                  animation: indFadeIn 0.55s ease both;
                }
                @keyframes indFadeIn {
                  from { opacity: 0; transform: translateY(16px); }
                  to   { opacity: 1; transform: translateY(0); }
                }
                .industries-badge {
                  display: inline-block;
                  border: 1.5px solid;
                  border-radius: 50px;
                  padding: 4px 14px;
                  font-size: 12px;
                  font-weight: 600;
                  letter-spacing: 1px;
                  margin-bottom: 12px;
                  // transition: color red, border-color 0.4s;
                  color: red !important;
                  border-color: red !important;
                }
                .industries-industry-sub {
                  font-size: 14px;
                  opacity: 0.6;
                  margin-bottom: 16px;
                  font-weight: 500;
                  color: black;
                }
                .industries-nav-dots {
                  display: flex;
                  gap: 10px;
                  margin-top: 28px;
                }
                .ind-nav-dot {
                  width: 10px;
                  height: 10px;
                  border-radius: 50%;
                  border: none;
                  background: rgba(255,255,255,0.2);
                  cursor: pointer;
                  transition: background-color 0.4s, transform 0.25s;
                  padding: 0;
                }
                .ind-nav-dot.active {
                  transform: scale(1.35);
                }
                .ind-nav-dot:hover {
                  background: rgba(255,255,255,0.45);
                }
              `}</style>
            </div>

            <div className="industries-carousel-wrapper">
              <div className="industries-carousel">
                {industries.map((ind, index) => {
                  let positionClass = "";
                  if (index === activeInd) {
                    positionClass = "active";
                  } else if (
                    index ===
                    (activeInd - 1 + industries.length) % industries.length
                  ) {
                    positionClass = "left";
                  } else if (index === (activeInd + 1) % industries.length) {
                    positionClass = "right";
                  } else {
                    positionClass = "hidden";
                  }
                  return (
                    <div
                      key={index}
                      className={`industry-card ${positionClass}`}
                      onClick={() => setActiveInd(index)}
                    >
                      {/* Phone bezel */}
                      <div className="phone-bezel">
                        {/* Dynamic island notch */}
                        <div className="phone-notch" />

                        {/* Screen */}
                        <div className="phone-screen">
                          {ind.screenContent ? (
                            ind.screenContent
                          ) : ind.image ? (
                            <img
                              src={ind.image}
                              alt={ind.title}
                              className="phone-screen-img"
                            />
                          ) : (
                            <div className="phone-screen-placeholder">
                              <div className="phone-screen-placeholder-icon">
                                📱
                              </div>
                              <span>{ind.title}</span>
                              <small style={{ opacity: 0.5 }}>
                                {ind.projects}
                              </small>
                            </div>
                          )}
                        </div>

                        {/* Home indicator */}
                        <div className="phone-home-bar">
                          <span />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* <div className="carousel-indicators">
                {industries.map((_, index) => (
                  <span
                    key={index}
                    className={`indicator-dot ${index === activeInd ? 'active' : ''}`}
                    onClick={() => setActiveInd(index)}
                  ></span>
                ))}
              </div> */}
            </div>
          </div>

          {/* Centered Prev / Next Arrow Navigation */}
          <div className="industries-arrow-nav">
            <button
              className="ind-arrow-btn"
              onClick={() =>
                setActiveInd(
                  (activeInd - 1 + industries.length) % industries.length,
                )
              }
              aria-label="Previous screen"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path
                  d="M15 18l-6-6 6-6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            <span className="ind-arrow-counter">
              {String(activeInd + 1).padStart(2, "0")} /{" "}
              {String(industries.length).padStart(2, "0")}
            </span>

            <button
              className="ind-arrow-btn"
              onClick={() => setActiveInd((activeInd + 1) % industries.length)}
              aria-label="Next screen"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path
                  d="M9 18l6-6-6-6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>
      </section>

      {/* Mobile Feature Section */}
      <div className="section-mobile-feature flat-spacing">
        <div className="container">
          <div className="row align-items-center ">
            <div className="col-lg-5 lg-mb-24">
              <div className="mobile-mockup position-relative effectFade fadeUp d-flex justify-content-center">
                <div
                  className="mockup-frame"
                  style={{
                    width: "100%",
                    maxWidth: "250px",
                    height: "500px",
                    borderRadius: "30px",
                    border: "8px solid #292C2E",
                    overflow: "hidden",
                    position: "relative",
                    boxShadow: "0 25px 50px rgba(0,0,0,0.5)",
                    background:
                      "linear-gradient(180deg, #1A1C1E 0%, #0D0E0F 100%)",
                  }}
                >
                  <div
                    className="notch"
                    style={{
                      position: "absolute",
                      top: "0",
                      left: "50%",
                      transform: "translateX(-50%)",
                      width: "120px",
                      height: "13px",
                      background: "#292C2E",
                      borderBottomLeftRadius: "18px",
                      borderBottomRightRadius: "18px",
                      zIndex: 10,
                    }}
                  ></div>
                  <div
                    className="mobile-content h-100 position-relative z-1"
                    style={{ padding: 0 }}
                  >
                    <img
                      src="asset/images/img/scr/home2.png"
                      alt="App Screen"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="col-lg-7">
              <div className="content-right">
                <div className="heading-section mb-40">
                  <div className="heading-sub fw-semibold effectFade fadeUp">
                    Features
                  </div>
                  <div className="heading-title text-gradient-3 effectFade fadeRotateX">
                    Your Trusted Partner in Business Growth
                  </div>
                </div>
                <div className="d-flex flex-column gap-24 effectFade fadeUp">
                  <div className="feature-item d-flex gap-20 align-items-start">
                    <div className="icon" style={{ marginTop: "5px" }}>
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <circle
                          cx="12"
                          cy="12"
                          r="12"
                          fill="url(#paint_linear_1)"
                          fillOpacity="0.2"
                        />
                        <path
                          d="M12 7V12L15 15"
                          stroke="#EA2B16"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <defs>
                          <linearGradient
                            id="paint_linear_1"
                            x1="12"
                            y1="0"
                            x2="12"
                            y2="24"
                            gradientUnits="userSpaceOnUse"
                          >
                            <stop stopColor="#EA2B16" />
                            <stop offset="1" stopColor="#FF3B26" />
                          </linearGradient>
                        </defs>
                      </svg>
                    </div>
                    <div>
                      <h6 className="fw-semibold text-white mb-2">
                        Increase Visibility
                      </h6>
                      <p className="text-secondary m-0">
                        Attract more customers and stand out in the local
                        market.
                      </p>
                    </div>
                  </div>

                  <div className="feature-item d-flex gap-20 align-items-start">
                    <div className="icon" style={{ marginTop: "5px" }}>
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <circle
                          cx="12"
                          cy="12"
                          r="12"
                          fill="url(#paint_linear_2)"
                          fillOpacity="0.2"
                        />
                        <circle
                          cx="11"
                          cy="11"
                          r="5"
                          stroke="#EA2B16"
                          strokeWidth="2"
                        />
                        <path
                          d="M20 20L15 15"
                          stroke="#EA2B16"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                        <defs>
                          <linearGradient
                            id="paint_linear_2"
                            x1="12"
                            y1="0"
                            x2="12"
                            y2="24"
                            gradientUnits="userSpaceOnUse"
                          >
                            <stop stopColor="#EA2B16" />
                            <stop offset="1" stopColor="#FF3B26" />
                          </linearGradient>
                        </defs>
                      </svg>
                    </div>
                    <div>
                      <h6 className="fw-semibold text-white mb-2">
                        Engage More Customers
                      </h6>
                      <p className="text-secondary m-0">
                        Build loyalty with targeted offers and live chat
                        support.
                      </p>
                    </div>
                  </div>

                  <div className="feature-item d-flex gap-20 align-items-start">
                    <div className="icon" style={{ marginTop: "5px" }}>
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <circle
                          cx="12"
                          cy="12"
                          r="12"
                          fill="url(#paint_linear_3)"
                          fillOpacity="0.2"
                        />
                        <path
                          d="M9 12L11 14L15 10"
                          stroke="#EA2B16"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <circle
                          cx="12"
                          cy="12"
                          r="8"
                          stroke="#EA2B16"
                          strokeWidth="2"
                        />
                        <defs>
                          <linearGradient
                            id="paint_linear_3"
                            x1="12"
                            y1="0"
                            x2="12"
                            y2="24"
                            gradientUnits="userSpaceOnUse"
                          >
                            <stop stopColor="#EA2B16" />
                            <stop offset="1" stopColor="#FF3B26" />
                          </linearGradient>
                        </defs>
                      </svg>
                    </div>
                    <div>
                      <h6 className="fw-semibold text-white mb-2">
                        Streamline Operations
                      </h6>
                      <p className="text-secondary m-0">
                        Manage multiple branches, staff, and appointments from a
                        single app.
                      </p>
                    </div>
                  </div>

                  <div className="feature-item d-flex gap-20 align-items-start">
                    <div className="icon" style={{ marginTop: "5px" }}>
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <circle
                          cx="12"
                          cy="12"
                          r="12"
                          fill="url(#paint_linear_4)"
                          fillOpacity="0.2"
                        />
                        <rect
                          x="6"
                          y="10"
                          width="12"
                          height="8"
                          rx="1"
                          stroke="#EA2B16"
                          strokeWidth="2"
                        />
                        <path
                          d="M16 10V8C16 5.79086 14.2091 4 12 4C9.79086 4 8 5.79086 8 8V10"
                          stroke="#EA2B16"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                        <defs>
                          <linearGradient
                            id="paint_linear_4"
                            x1="12"
                            y1="0"
                            x2="12"
                            y2="24"
                            gradientUnits="userSpaceOnUse"
                          >
                            <stop stopColor="#EA2B16" />
                            <stop offset="1" stopColor="#FF3B26" />
                          </linearGradient>
                        </defs>
                      </svg>
                    </div>
                    <div>
                      <h6 className="fw-semibold text-white mb-2">
                        Boost Revenue
                      </h6>
                      <p className="text-secondary m-0">
                        Drive sales through data-driven campaigns and
                        promotions.
                      </p>
                    </div>
                  </div>

                  <div className="feature-item d-flex gap-20 align-items-start">
                    <div className="icon" style={{ marginTop: "5px" }}>
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <circle
                          cx="12"
                          cy="12"
                          r="12"
                          fill="url(#paint_linear_5)"
                          fillOpacity="0.2"
                        />
                        <path
                          d="M12 7V17"
                          stroke="#EA2B16"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                        <path
                          d="M9 10C9 8.89543 9.89543 8 11 8H13C14.1046 8 15 8.89543 15 10C15 11.1046 14.1046 12 13 12H11C9.89543 12 9 12.8954 9 14C9 15.1046 9.89543 16 11 16H13C14.1046 16 15 15.1046 15 14"
                          stroke="#EA2B16"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <defs>
                          <linearGradient
                            id="paint_linear_5"
                            x1="12"
                            y1="0"
                            x2="12"
                            y2="24"
                            gradientUnits="userSpaceOnUse"
                          >
                            <stop stopColor="#EA2B16" />
                            <stop offset="1" stopColor="#FF3B26" />
                          </linearGradient>
                        </defs>
                      </svg>
                    </div>
                    <div>
                      <h6 className="fw-semibold text-white mb-2">
                        Secure & Reliable
                      </h6>
                      <p className="text-secondary m-0">
                        Role-based access control to keep your business data
                        safe.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* /Mobile Feature Section */}

      {/* App Download Section */}
      <div className="section-app-download flat-spacing pt-0">
        <div className="container">
          <div
            className="app-download-wrap p-4 p-lg-5 effectFade fadeUp"
            style={{
              borderRadius: "32px",
              background:
                "linear-gradient(90deg, rgb(216, 8, 8) 0%, rgb(246, 204, 204) 100%)",
              border: "1px solid rgba(255,255,255,0.05)",
              boxShadow: "0 30px 60px rgba(0,0,0,0.4)",
            }}
          >
            <div className="row align-items-center">
              {/* Left: Phones Mockup */}
              <div className="col-lg-4 text-center mb-5 mb-lg-0">
                <div
                  className="d-flex justify-content-center position-relative mx-auto"
                  style={{ height: "350px", width: "100%", maxWidth: "300px" }}
                >
                  {/* Background phone (Left) */}
                  <div
                    className="mockup-frame position-absolute"
                    style={{
                      width: "160px",
                      height: "320px",
                      borderRadius: "24px",
                      border: "6px solid #292C2E",
                      overflow: "hidden",
                      left: "0px",
                      top: "30px",
                      transform: "rotate(-8deg)",
                      background:
                        "linear-gradient(180deg, #1A1C1E 0%, #0D0E0F 100%)",
                      zIndex: 1,
                      boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
                    }}
                  >
                    <div
                      className="notch"
                      style={{
                        position: "absolute",
                        top: "0",
                        left: "50%",
                        transform: "translateX(-50%)",
                        width: "70px",
                        height: "15px",
                        background: "#292C2E",
                        borderBottomLeftRadius: "8px",
                        borderBottomRightRadius: "8px",
                        zIndex: 10,
                      }}
                    ></div>
                    <div
                      className="mobile-content h-100 position-relative z-1"
                      style={{ padding: 0 }}
                    >
                      <img
                        src="asset/images/img/c-s/2.PNG"
                        alt="App Screen"
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    </div>
                  </div>
                  {/* Foreground phone (Right) */}
                  <div
                    className="mockup-frame position-absolute"
                    style={{
                      width: "170px",
                      height: "350px",
                      borderRadius: "24px",
                      border: "6px solid #1A1C1E",
                      overflow: "hidden",
                      right: "0px",
                      top: "0px",
                      transform: "rotate(6deg)",
                      background:
                        "linear-gradient(135deg, #EA2B16 0%, #FF3B26 100%)",
                      zIndex: 2,
                      boxShadow: "-15px 15px 40px rgba(0,0,0,0.6)",
                    }}
                  >
                    <div
                      className="notch"
                      style={{
                        position: "absolute",
                        top: "0",
                        left: "50%",
                        transform: "translateX(-50%)",
                        width: "70px",
                        height: "15px",
                        background: "#1A1C1E",
                        borderBottomLeftRadius: "8px",
                        borderBottomRightRadius: "8px",
                        zIndex: 10,
                      }}
                    ></div>
                    <div
                      className="mobile-content h-100 position-relative z-1"
                      style={{ padding: 0 }}
                    >
                      <img
                        src="asset/images/img/mhmm.png"
                        alt="App Screen"
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Center: Text */}
              <div className="col-lg-5 mb-5 mb-lg-0 ps-lg-4 ps-xl-5">
                <div
                  className="heading-title force-white mb-3"
                  style={{
                    fontSize: "30px",
                    lineHeight: "1.2",
                    fontWeight: "700",
                  }}
                >
                  Why <span className="force-white">First Pass ?</span>
                </div>
                <p
                  className="force-white pe-lg-4"
                  style={{
                    fontSize: "18px",
                    lineHeight: "1.6",
                    fontWeight: "500",
                  }}
                >
                  Manage your bookings, discover offers, track appointments, and
                  enjoy seamless service experiences—all from a single
                  application.{" "}
                </p>
              </div>

              {/* Right: Buttons */}
              <div className="col-lg-3 text-lg-end text-center d-flex flex-column gap-3 pe-lg-4">
                <a
                  href="https://apps.apple.com/in/app/firstpass-partner/id6781702214"
                  className="d-flex align-items-center justify-content-center gap-3 p-3 w-100 text-white text-decoration-none transition-all"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "16px",
                    minWidth: "220px",
                    color: "#ffffff",
                  }}
                >
                  <svg
                    width="34"
                    height="44"
                    viewBox="0 0 24 24"
                    fill="white"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M16.36 14.379C16.36 11.328 18.847 9.845 18.966 9.771C17.525 7.66 15.26 7.33 14.496 7.234C12.607 7.042 10.767 8.351 9.8 8.351C8.807 8.351 7.307 7.256 5.748 7.283C3.712 7.309 1.83 8.468 0.785 10.297C-1.341 13.987 0.244 19.426 2.308 22.423C3.315 23.882 4.499 25.534 6.046 25.48C7.541 25.427 8.113 24.516 9.878 24.516C11.644 24.516 12.164 25.48 13.738 25.48C15.365 25.48 16.386 23.987 17.368 22.529C18.497 20.876 18.963 19.278 18.99 19.195C18.963 19.183 16.36 18.196 16.36 14.379ZM13.486 4.908C14.316 3.903 14.871 2.511 14.719 1.116C13.523 1.164 12.046 1.912 11.189 2.92C10.421 3.821 9.757 5.244 9.936 6.613C11.266 6.716 12.656 5.941 13.486 4.908Z" />
                  </svg>
                  <div
                    className="text-start text-white"
                    style={{ color: "#ffffff" }}
                  >
                    <div
                      style={{
                        fontSize: "13px",
                        opacity: 0.8,
                        lineHeight: "1",
                        color: "#ffffff",
                      }}
                    >
                      Download on
                    </div>
                    <div
                      className="fw-bold"
                      style={{
                        fontSize: "20px",
                        lineHeight: "1.2",
                        color: "#ffffff",
                      }}
                    >
                      App Store
                    </div>
                  </div>
                </a>
                <a
                  href="https://play.google.com/store/apps/details?id=com.app.firstpass_partner"
                  className="d-flex align-items-center justify-content-center gap-3 p-3 w-100 text-white text-decoration-none transition-all"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "16px",
                    minWidth: "220px",
                    color: "#ffffff",
                  }}
                >
                  <svg
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M1.385 1.543C1.135 1.802 1 2.186 1 2.684V21.316C1 21.815 1.135 22.198 1.385 22.457L1.47 22.535L11.834 12.172V11.828L1.47 1.465L1.385 1.543Z"
                      fill="#00E676"
                    />
                    <path
                      d="M15.297 15.635L11.834 12.172V11.828L15.297 8.365L15.38 8.414L19.467 10.735C20.635 11.398 20.635 12.49 19.467 13.155L15.38 15.476L15.297 15.635Z"
                      fill="#FFC107"
                    />
                    <path
                      d="M15.38 15.476L11.834 11.93L1.385 22.457C1.785 22.88 2.43 22.923 3.167 22.505L15.38 15.476Z"
                      fill="#FF3D00"
                    />
                    <path
                      d="M15.38 8.414L3.167 1.386C2.43 0.967 1.785 1.011 1.385 1.434L11.834 11.961L15.38 8.414Z"
                      fill="#00B0FF"
                    />
                  </svg>
                  <div
                    className="text-start text-white"
                    style={{ color: "#ffffff" }}
                  >
                    <div
                      style={{
                        fontSize: "13px",
                        opacity: 0.8,
                        lineHeight: "1",
                        color: "#ffffff",
                      }}
                    >
                      Available on
                    </div>
                    <div
                      className="fw-bold"
                      style={{
                        fontSize: "20px",
                        lineHeight: "1.2",
                        color: "#ffffff",
                      }}
                    >
                      Google Play
                    </div>
                  </div>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* /App Download Section */}

      <div className="box-white">
        {/* section-features */}
        <div className="section-features flat-spacing pt-0">
          <style>{`
            .section-features {
              position: relative;
              overflow: hidden;
              z-index: 1;
            }
            .section-features::before {
              content: '';
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              background-image: url("${logoWatermark}");
              background-repeat: no-repeat;
              background-position: center;
              background-size: contain;
              opacity: 0.3;
              pointer-events: none;
              z-index: 0;
            }
            .section-features > * {
              position: relative;
              z-index: 2;
            }
            .features-tab-toggle {
              display: inline-flex;
              align-items: center;
              background: #F0F0F2;
              border-radius: 50px;
              padding: 5px;
              gap: 4px;
              margin-bottom: 48px;
            }
            .features-tab-btn {
              position: relative;
              padding: 10px 32px;
              border-radius: 50px;
              border: none;
              background: transparent;
              font-size: 15px;
              font-weight: 600;
              color: #6B7280;
              cursor: pointer;
              transition: color 0.3s ease;
              outline: none;
              white-space: nowrap;
            }
            .features-tab-btn.active {
              background: rgb(211, 10, 10);
              color: #FFFFFF;
              box-shadow: 0 4px 16px rgba(0,0,0,0.18);
            }
            .features-tab-btn:not(.active):hover {
              color: #1A1C1E;
            }
            .features-tab-content {
              animation: featuresFadeIn 0.4s ease;
            }
            @keyframes featuresFadeIn {
              from { opacity: 0; transform: translateY(10px); }
              to   { opacity: 1; transform: translateY(0); }
            }
            @media (max-width: 575px) {
              .features-tab-btn {
                padding: 9px 20px;
                font-size: 13px;
              }
            }
            @media (max-width: 991px) {
              .features-tab-content .features-wrap {
                flex-direction: column;
                gap: 0;
              }
              .features-tab-content .features-col {
                width: 100% !important;
              }
              .features-tab-content .features-item {
                padding: 20px !important;
                border-radius: 14px !important;
                margin-bottom: 16px !important;
              }
              .features-tab-content .features-item .icon-wrap {
                width: 42px !important;
                height: 42px !important;
                margin-bottom: 12px !important;
              }
              .features-tab-content .features-item .title {
                font-size: 16px !important;
              }
              .features-tab-content .features-item p {
                font-size: 13px !important;
              }
              .features-center {
                display: none !important;
              }
            }
            @media (max-width: 575px) {
              .features-tab-content .features-item {
                padding: 16px !important;
                border-radius: 12px !important;
                margin-bottom: 12px !important;
              }
              .features-tab-content .features-item .icon-wrap {
                width: 38px !important;
                height: 38px !important;
                border-radius: 10px !important;
                margin-bottom: 10px !important;
              }
              .features-tab-content .features-item .icon-wrap svg {
                width: 20px !important;
                height: 20px !important;
              }
              .features-tab-content .features-item .title {
                font-size: 15px !important;
              }
              .features-tab-content .features-item p {
                font-size: 12px !important;
              }
            }
          `}</style>

          <div className="container">
            <div className="heading-section center mb-64">
              <div className="heading-sub fw-semibold effectFade fadeUp">
                Features
              </div>
              <div className="heading-title text-gradient-3 effectFade fadeRotateX">
                All Features in One
              </div>

              {/* Segmented Tab Toggle */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  marginTop: "32px",
                  marginBottom: "-70px",
                }}
              >
                <div className="features-tab-toggle">
                  <button
                    className={`features-tab-btn${activeFeatureTab === "customer" ? " active" : ""}`}
                    onClick={() => setActiveFeatureTab("customer")}
                  >
                    Customer
                  </button>
                  <button
                    className={`features-tab-btn${activeFeatureTab === "merchant" ? " active" : ""}`}
                    onClick={() => setActiveFeatureTab("merchant")}
                  >
                    Merchant
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="position-relative">
            <div className="container z-5">
              <div
                className="features-tab-content"
                key={activeFeatureTab}
                style={{ animation: "featuresFadeIn 0.4s ease" }}
              >
                <div className="features-wrap justify-content-between align-items-center">
                  <div className="features-col col-left lg-mb-24">
                    {activeFeatures.left.map((feat, i) => (
                      <div
                        key={i}
                        className="features-item"
                        style={{
                          background: "#FFFFFF",
                          borderRadius: "16px",
                          padding: "24px",
                          boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
                          marginBottom: "20px",
                          position: "relative",
                          zIndex: 2,
                          opacity: 1,
                        }}
                      >
                        <div
                          className="icon-wrap"
                          style={{
                            width: "48px",
                            height: "48px",
                            background: "#c6cacd",
                            borderRadius: "12px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            marginBottom: "16px",
                          }}
                        >
                          {feat.icon}
                        </div>
                        <h6
                          className="title fw-semibold text-dark mb-2"
                          style={{ fontSize: "18px" }}
                        >
                          {feat.title}
                        </h6>
                        <p
                          className="text-secondary mb-0"
                          style={{ fontSize: "14px" }}
                        >
                          {feat.desc}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="features-center flex-shrink-0 text-center d-none d-lg-block">
                    <div
                      className="d-flex justify-content-center position-relative mx-auto"
                      style={{ height: "520px", width: "202px" }}
                    >
                      {/* Center phone */}
                      <div
                        className="mockup-frame position-absolute"
                        style={{
                          width: "230px",
                          height: "480px",
                          borderRadius: "30px",
                          border: "8px solid #1A1C1E",
                          overflow: "hidden",
                          left: "50%",
                          top: "-181px",
                          transform: "translateX(-50%)",
                          marginLeft: "0px",
                          background:
                            "linear-gradient(135deg, #EA2B16 0%, #FF3B26 100%)",
                          zIndex: 2,
                          boxShadow: "0 20px 50px rgba(0,0,0,0.6)",
                        }}
                      >
                        <div
                          className="notch"
                          style={{
                            position: "absolute",
                            top: "0",
                            left: "50%",
                            transform: "translateX(-50%)",
                            width: "85px",
                            height: "20px",
                            background: "#1A1C1E",
                            borderBottomLeftRadius: "12px",
                            borderBottomRightRadius: "12px",
                            zIndex: 10,
                          }}
                        ></div>
                        <div
                          className="mobile-content h-100 position-relative z-1"
                          style={{ padding: 0 }}
                        >
                          <img
                            src={
                              activeFeatureTab === "customer"
                                ? "asset/images/img/m/c-main.png"
                                : "asset/images/img/m/main.webp"
                            }
                            alt="App Screen"
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="features-col col-right">
                    {activeFeatures.right.map((feat, i) => (
                      <div
                        key={i}
                        className="features-item"
                        style={{
                          background: "#FFFFFF",
                          borderRadius: "16px",
                          padding: "24px",
                          boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
                          marginBottom: "20px",
                          position: "relative",
                          zIndex: 2,
                          opacity: 1,
                        }}
                      >
                        <div
                          className="icon-wrap"
                          style={{
                            width: "48px",
                            height: "48px",
                            background: "#d0d9e1",
                            borderRadius: "12px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            marginBottom: "16px",
                          }}
                        >
                          {feat.icon}
                        </div>
                        <h6
                          className="title fw-semibold text-dark mb-2"
                          style={{ fontSize: "18px" }}
                        >
                          {feat.title}
                        </h6>
                        <p
                          className="text-secondary mb-0"
                          style={{ fontSize: "14px" }}
                        >
                          {feat.desc}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="side-line-main d-none d-lg-block wow fadeIn">
              <div className="container">
                <div className="row">
                  <div className="col-lg-4 mx-auto">
                    <div className="side-line-wrap">
                      <div className="link-break-line left">
                        <div className="link-break-line">
                          <span className="item top"></span>
                          <span className="item bottom"></span>
                        </div>
                      </div>
                      <div className="link-break-center">
                        <span className="simu-electric left"></span>
                        <span className="simu-electric right"></span>
                      </div>
                      <div className="link-break-line right">
                        <span className="item top"></span>
                        <span className="item bottom"></span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* /section-features */}
      </div>

      {/* section-mobile-app */}
      <div className="section-mobile-app flat-spacing pt-0">
        <div className="container">
          <div
            className="row align-items-center"
            style={{ paddingTop: "30px", paddingBottom: "30px" }}
          >
            <div className="col-lg-6">
              <div className="heading-section mb-40">
                <div className="heading-sub fw-semibold effectFade fadeUp">
                  Mobile Experience
                </div>
                <div className="heading-title text-white effectFade fadeRotateX">
                  The Squad Supporting <br /> Your Business
                </div>
              </div>
              <p className="text-secondary mb-40 effectFade fadeUp">
                Manage your business, review metrics, and approve actions on the
                go. Our fully responsive mobile experience ensures you never
                miss a beat with our Partner and Customer Apps.
              </p>
              <div className="d-flex gap-20 effectFade fadeUp">
                <a
                  href="https://apps.apple.com/in/app/firstpass-partner/id6781702214"
                  className="tf-btn"
                  // onClick={(e) => e.preventDefault()}
                >
                  App Store
                </a>
                <a
                  href="https://play.google.com/store/apps/details?id=com.app.firstpass_partner"
                  className="tf-btn-2"
                  // onClick={(e) => e.preventDefault()}
                >
                  Google Play
                </a>
              </div>
            </div>
            <div className="col-lg-6 mt-5 mt-lg-0">
              <div className="mobile-mockup position-relative effectFade fadeUp d-flex justify-content-center">
                <div
                  className="mockup-frame"
                  style={{
                    width: "250px",
                    height: "550px",
                    borderRadius: "40px",
                    border: "6px solid #292C2E",
                    overflow: "hidden",
                    position: "relative",
                    boxShadow: "0 25px 50px rgba(0,0,0,0.5)",
                    background:
                      "linear-gradient(180deg, #1A1C1E 0%, #0D0E0F 100%)",
                  }}
                >
                  <div
                    className="notch"
                    style={{
                      position: "absolute",
                      top: "0",
                      left: "50%",
                      transform: "translateX(-50%)",
                      width: "95px",
                      height: "20px",
                      background: "#292C2E",
                      borderBottomLeftRadius: "18px",
                      borderBottomRightRadius: "18px",
                      zIndex: 10,
                    }}
                  ></div>
                  <div
                    className="mobile-content h-100 position-relative z-1"
                    style={{ padding: 0 }}
                  >
                    <img
                      src="asset/images/img/m/main.webp"
                      alt="App Screen"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* /section-mobile-app */}

      {/* section-tools */}
      <div className="section-tools flat-spacing">
        {/* Floating Icons */}
        <div
          className="img-1 img-grow-1 d-flex align-items-center justify-content-center bg-white"
          style={{
            position: "absolute",
            width: "80px",
            height: "80px",
            borderRadius: "20px",
            boxShadow: "0 15px 35px rgba(0,0,0,0.15)",
            transform: "rotate(-10deg)",
            zIndex: 0,
          }}
        >
          <svg
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#EA2B16"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
            <line x1="7" y1="7" x2="7.01" y2="7"></line>
          </svg>
        </div>
        <div
          className="img-2 img-grow-2 d-flex align-items-center justify-content-center bg-white"
          style={{
            position: "absolute",
            width: "70px",
            height: "70px",
            borderRadius: "18px",
            boxShadow: "0 15px 35px rgba(0,0,0,0.15)",
            transform: "rotate(15deg)",
            zIndex: 2,
          }}
        >
          <svg
            width="36"
            height="36"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#00B0FF"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
        </div>
        <div
          className="img-3 img-grow-3 d-flex align-items-center justify-content-center bg-white"
          style={{
            position: "absolute",
            width: "90px",
            height: "90px",
            borderRadius: "24px",
            boxShadow: "0 15px 35px rgba(0,0,0,0.15)",
            transform: "rotate(-5deg)",
            zIndex: 0,
          }}
        >
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#00E676"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="9" y1="15" x2="15" y2="9"></line>
            <circle cx="9" cy="9" r="1"></circle>
            <circle cx="15" cy="15" r="1"></circle>
          </svg>
        </div>
        <div
          className="img-4 img-grow-4 d-flex align-items-center justify-content-center bg-white"
          style={{
            position: "absolute",
            width: "75px",
            height: "75px",
            borderRadius: "18px",
            boxShadow: "0 15px 35px rgba(0,0,0,0.15)",
            transform: "rotate(20deg)",
            zIndex: 0,
          }}
        >
          <svg
            width="38"
            height="38"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#FFC107"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 12 20 22 4 22 4 12"></polyline>
            <rect x="2" y="7" width="20" height="5"></rect>
            <line x1="12" y1="22" x2="12" y2="7"></line>
            <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"></path>
            <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"></path>
          </svg>
        </div>
        <div
          className="img-5 img-grow-5 d-flex align-items-center justify-content-center bg-white"
          style={{
            position: "absolute",
            width: "85px",
            height: "85px",
            borderRadius: "22px",
            boxShadow: "0 15px 35px rgba(0,0,0,0.15)",
            transform: "rotate(-15deg)",
            zIndex: 2,
          }}
        >
          <svg
            width="42"
            height="42"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#9C27B0"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect>
            <line x1="9" y1="22" x2="9" y2="22"></line>
            <line x1="15" y1="22" x2="15" y2="22"></line>
            <line x1="9" y1="6" x2="9" y2="6"></line>
            <line x1="15" y1="6" x2="15" y2="6"></line>
            <line x1="9" y1="10" x2="9" y2="10"></line>
            <line x1="15" y1="10" x2="15" y2="10"></line>
            <line x1="9" y1="14" x2="9" y2="14"></line>
            <line x1="15" y1="14" x2="15" y2="14"></line>
            <line x1="9" y1="18" x2="9" y2="18"></line>
            <line x1="15" y1="18" x2="15" y2="18"></line>
          </svg>
        </div>
        <div
          className="img-6 img-grow-6 d-flex align-items-center justify-content-center bg-white"
          style={{
            position: "absolute",
            width: "65px",
            height: "65px",
            borderRadius: "16px",
            boxShadow: "0 15px 35px rgba(0,0,0,0.15)",
            transform: "rotate(10deg)",
            zIndex: 2,
          }}
        >
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#E91E63"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <path d="M16 10a4 4 0 0 1-8 0"></path>
          </svg>
        </div>
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-xl-6 col-md-8 text-center">
              <div className="heading-section center mb-48">
                {/* <div className="heading-sub fw-semibold effectFade fadeUp">Tools</div> */}
                <div className="heading-title text-gradient-3 effectFade fadeRotateX">
                  Smarter Tool For <br /> Powering Business Growth
                </div>
              </div>
              <div className="text effectFade fadeUp">
                We build and evaluate a modern management stack—appointments,
                coupon <br /> claims, staff access, and notifications—so your
                business is fast, <br /> reliable, and secure.
              </div>
              <a href="download" className="tf-btn effectFade fadeRotateX">
                Explore Offers
              </a>
            </div>
          </div>
        </div>
      </div>
      {/* /section-tools */}

      {/* section-brand-logo */}
      <div className="section-brand-logo flat-spacing pt-0">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-6 text-center effectFade fadeUp">
              <div
                className="brand-logo-card p-40"
                style={{
                  background: "rgba(255, 255, 255, 0.02)",
                  borderRadius: "24px",
                  border: "1px solid rgba(255, 255, 255, 0.06)",
                  backdropFilter: "blur(15px)",
                }}
              >
                {/* <img src="asset/images/img/logo.png" alt="Brand Logo" style={{ maxHeight: '60px' }} /> */}
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* /section-brand-logo */}

      {/* section-faqs */}
      <div className="section-faqs flat-spacing pt-0">
        <style>{`
          .faq-column-card {
            background: #dfdfdf;
            border-radius: 28px;
            padding: 40px;
            box-shadow: 0px 10px 40px rgba(0, 0, 0, 0.04);
            border: 1px solid rgba(0, 0, 0, 0.05);
            height: 100%;
            transition: transform 0.3s ease, box-shadow 0.3s ease;
          }
          .faq-column-card:hover {
            transform: translateY(-2px);
            box-shadow: 0px 16px 48px rgba(0, 0, 0, 0.06);
          }
          .faq-column-header {
            font-size: 24px;
            font-weight: 700;
            color: #1A1C1E;
            margin-bottom: 32px;
            text-align: left;
            position: relative;
            padding-bottom: 12px;
          }
          .faq-column-header::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 0;
            width: 48px;
            height: 4px;
            background: linear-gradient(90deg, #680303 0%, #EA2B16 100%);
            border-radius: 2px;
          }
          @media (max-width: 991px) {
            .faq-column-card {
              padding: 32px;
            }
            .faq-column-header {
              font-size: 22px;
              margin-bottom: 24px;
            }
          }
          @media (max-width: 575px) {
            .faq-column-card {
              padding: 24px 16px;
              border-radius: 20px;
            }
            .faq-column-header {
              font-size: 20px;
              margin-bottom: 20px;
            }
          }
        `}</style>

        <div className="container">
          <div className="heading-section center mb-64">
            <div className="heading-sub fw-semibold effectFade fadeUp">
              FAQs
            </div>
            <div className="heading-title text-gradient-3 effectFade fadeRotateX">
              Frequently Asked Questions
            </div>
          </div>

          <div className="row justify-content-center">
            <div className="col-xl-12 col-lg-12">
              <div className="row">
                {/* Customer FAQs */}
                <div className="col-lg-6 col-md-12 mb-40">
                  <div className="faq-column-card">
                    <h3 className="faq-column-header">Customer FAQs</h3>
                    <div className="accordion-asked" id="accordion-customer">
                      <div className="accordion-asked-item">
                        <div className="accordion-asked-title" id="asked-c1">
                          <button
                            className="accordion-button text-body-1 fw-semibold"
                            type="button"
                            data-bs-toggle="collapse"
                            data-bs-target="#collapse-c1"
                            aria-expanded="true"
                            aria-controls="collapse-c1"
                          >
                            How do I find and claim coupon deals on First Pass?
                            <span className="right-icon"></span>
                          </button>
                        </div>
                        <div
                          id="collapse-c1"
                          role="region"
                          className="accordion-collapse collapse show"
                          aria-labelledby="asked-c1"
                          data-bs-parent="#accordion-customer"
                        >
                          <div className="accordion-body">
                            You can browse active offers and discounts on the
                            App, tap 'Claim' on the coupon you want, and present
                            it at the store to redeem your discount.
                          </div>
                        </div>
                      </div>
                      <div className="accordion-asked-item">
                        <div className="accordion-asked-title" id="asked-c2">
                          <button
                            className="accordion-button text-body-1 fw-semibold collapsed"
                            type="button"
                            data-bs-toggle="collapse"
                            data-bs-target="#collapse-c2"
                            aria-expanded="false"
                            aria-controls="collapse-c2"
                          >
                            How do I book and manage my appointments?
                            <span className="right-icon"></span>
                          </button>
                        </div>
                        <div
                          id="collapse-c2"
                          role="region"
                          className="accordion-collapse collapse"
                          aria-labelledby="asked-c2"
                          data-bs-parent="#accordion-customer"
                        >
                          <div className="accordion-body">
                            Select the services you need, choose a convenient
                            date and time, and confirm your booking. You can
                            easily view, reschedule or cancel your appointments
                            directly from your profile.
                          </div>
                        </div>
                      </div>
                      <div className="accordion-asked-item">
                        <div className="accordion-asked-title" id="asked-c3">
                          <button
                            className="accordion-button text-body-1 fw-semibold collapsed"
                            type="button"
                            data-bs-toggle="collapse"
                            data-bs-target="#collapse-c3"
                            aria-expanded="false"
                            aria-controls="collapse-c3"
                          >
                            Is there any charge for customers using the app?
                            <span className="right-icon"></span>
                          </button>
                        </div>
                        <div
                          id="collapse-c3"
                          role="region"
                          className="accordion-collapse collapse"
                          aria-labelledby="asked-c3"
                          data-bs-parent="#accordion-customer"
                        >
                          <div className="accordion-body">
                            No, the First Pass Customer App is completely free
                            to download and use. You only pay the merchant for
                            the services or products you purchase.
                          </div>
                        </div>
                      </div>
                      <div className="accordion-asked-item">
                        <div className="accordion-asked-title" id="asked-c4">
                          <button
                            className="accordion-button text-body-1 fw-semibold collapsed"
                            type="button"
                            data-bs-toggle="collapse"
                            data-bs-target="#collapse-c4"
                            aria-expanded="false"
                            aria-controls="collapse-c4"
                          >
                            Will I get notifications about my bookings?
                            <span className="right-icon"></span>
                          </button>
                        </div>
                        <div
                          id="collapse-c4"
                          role="region"
                          className="accordion-collapse collapse"
                          aria-labelledby="asked-c4"
                          data-bs-parent="#accordion-customer"
                        >
                          <div className="accordion-body">
                            Yes, you will receive instant confirmations and
                            real-time notifications about your appointment
                            status, coupon claims, and reminders.
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Merchant FAQs */}
                <div className="col-lg-6 col-md-12 mb-40">
                  <div className="faq-column-card">
                    <h3 className="faq-column-header">Merchant FAQs</h3>
                    <div className="accordion-asked" id="accordion-merchant">
                      <div className="accordion-asked-item">
                        <div className="accordion-asked-title" id="asked-m1">
                          <button
                            className="accordion-button text-body-1 fw-semibold"
                            type="button"
                            data-bs-toggle="collapse"
                            data-bs-target="#collapse-m1"
                            aria-expanded="true"
                            aria-controls="collapse-m1"
                          >
                            How do I register my business on First Pass?
                            <span className="right-icon"></span>
                          </button>
                        </div>
                        <div
                          id="collapse-m1"
                          role="region"
                          className="accordion-collapse collapse show"
                          aria-labelledby="asked-m1"
                          data-bs-parent="#accordion-merchant"
                        >
                          <div className="accordion-body">
                            You can register by downloading the Merchant App and
                            providing your business details for secure
                            verification. It takes only a few minutes.
                          </div>
                        </div>
                      </div>
                      <div className="accordion-asked-item">
                        <div className="accordion-asked-title" id="asked-m2">
                          <button
                            className="accordion-button text-body-1 fw-semibold collapsed"
                            type="button"
                            data-bs-toggle="collapse"
                            data-bs-target="#collapse-m2"
                            aria-expanded="false"
                            aria-controls="collapse-m2"
                          >
                            Can I manage multiple branches from one account?
                            <span className="right-icon"></span>
                          </button>
                        </div>
                        <div
                          id="collapse-m2"
                          role="region"
                          className="accordion-collapse collapse"
                          aria-labelledby="asked-m2"
                          data-bs-parent="#accordion-merchant"
                        >
                          <div className="accordion-body">
                            Yes! Our platform features Multi-Branch Management,
                            allowing you to add and oversee multiple outlets
                            from a single dashboard.
                          </div>
                        </div>
                      </div>
                      <div className="accordion-asked-item">
                        <div className="accordion-asked-title" id="asked-m3">
                          <button
                            className="accordion-button text-body-1 fw-semibold collapsed"
                            type="button"
                            data-bs-toggle="collapse"
                            data-bs-target="#collapse-m3"
                            aria-expanded="false"
                            aria-controls="collapse-m3"
                          >
                            How can a merchant benefits from First Pass?
                            <span className="right-icon"></span>
                          </button>
                        </div>
                        <div
                          id="collapse-m3"
                          role="region"
                          className="accordion-collapse collapse"
                          aria-labelledby="asked-m3"
                          data-bs-parent="#accordion-merchant"
                        >
                          <div className="accordion-body">
                            Merchants can reach more customers, increase sales,
                            and build customer loyalty by offering exclusive
                            deals and coupons on First Pass. It’s a simple way
                            to grow your business and stand out from the
                            competition.
                          </div>
                        </div>
                      </div>
                      <div className="accordion-asked-item">
                        <div className="accordion-asked-title" id="asked-m4">
                          <button
                            className="accordion-button text-body-1 fw-semibold collapsed"
                            type="button"
                            data-bs-toggle="collapse"
                            data-bs-target="#collapse-m4"
                            aria-expanded="false"
                            aria-controls="collapse-m4"
                          >
                            Is the platform secure and reliable?
                            <span className="right-icon"></span>
                          </button>
                        </div>
                        <div
                          id="collapse-m4"
                          role="region"
                          className="accordion-collapse collapse"
                          aria-labelledby="asked-m4"
                          data-bs-parent="#accordion-merchant"
                        >
                          <div className="accordion-body">
                            Absolutely. We provide role-based access control, so
                            you can safely assign specific permissions to
                            receptionists and staff members.
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* /section-faqs */}

      {/* section-contact */}
      <div id="contact" className="flat-spacing pt-0">
        <div className="section-contact">
          <div className="contact-image">
            <img src="asset/images/section/contact-image-bg.jpg" alt="" />
          </div>
          <div className="container">
            <div className="row">
              <div className="col-lg-6">
                <div className="col-left">
                  <div className="heading-section mb-48">
                    <div className="heading-sub fw-semibold effectFade fadeUp">
                      Contact Us
                    </div>
                    <div className="heading-title text-gradient-3 effectFade fadeRotateX">
                      Your Questions, <br /> Our Priority.
                    </div>
                  </div>
                  <div>
                    <div className="contact-item mb-20 effectFade fadeRotateX">
                      <i className="icon icon-map-marker-solid"></i>
                      <div className="content">
                        <div className="title fw-semibold mb-2">
                          Office Location
                        </div>
                        <div className="text"></div>
                      </div>
                    </div>
                    <div
                      className="contact-item mb-20 effectFade fadeRotateX"
                      data-delay="0.1"
                    >
                      <i className="icon icon-headset-solid"></i>
                      <div className="content">
                        <div className="title fw-semibold mb-2">
                          Phone number
                        </div>
                        <div className="text"></div>
                      </div>
                    </div>
                    <div
                      className="contact-item mb-20 effectFade fadeRotateX"
                      data-delay="0.2"
                    >
                      <i className="icon icon-envelope-solid"></i>
                      <div className="content">
                        <div className="title fw-semibold mb-2">
                          E-mail address
                        </div>
                        <div className="text"></div>
                      </div>
                    </div>
                    <div
                      className="contact-item effectFade fadeRotateX"
                      data-delay="0.3"
                    >
                      <i className="icon icon-clock-solid"></i>
                      <div className="content">
                        <div className="title fw-semibold mb-2">
                          Working Hours
                        </div>
                        <div className="text">09:00AM to 06:00PM</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-lg-6">
                <form
                  className="form-contact effectFade fadeUp"
                  onSubmit={(e) => e.preventDefault()}
                >
                  <h4 className="heading fw-semibold">Fill this form below</h4>
                  <fieldset className="mb-21">
                    <label className="fw-semibold text-body-3 mb-20">
                      Your Name
                    </label>
                    <input
                      className=""
                      type="text"
                      placeholder="Enter your full name"
                      required
                    />
                  </fieldset>
                  <fieldset className="mb-21">
                    <label className="fw-semibold text-body-3 mb-20">
                      Your Phone
                    </label>
                    <input
                      className=""
                      type="text"
                      placeholder="Enter the Phone number"
                      required
                    />
                  </fieldset>
                  <fieldset className="mb-21">
                    <label className="fw-semibold text-body-3 mb-20">
                      Your E-Mail
                    </label>
                    <input
                      className=""
                      type="text"
                      placeholder="Enter the e-mail"
                      required
                    />
                  </fieldset>
                  <fieldset className="mb-18">
                    <label className="fw-semibold text-body-3 mb-0">
                      More about the enqiry
                    </label>
                    <textarea name="text" className=""></textarea>
                  </fieldset>
                  {/* <div className="attachment d-flex gap-8 align-items-center">
                    <i className="icon icon-paperclip-solid fs-24"></i>
                    <div className="fw-semibold text-body-3">Add an Attachment</div>
                  </div> */}
                  <button type="submit" className="tf-btn w-100">
                    Submit Message
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* /section-contact */}
    </>
  );
}
