import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  FileText, Shield, ArrowLeft, Printer, Mail, Copy, Check, 
  CheckCircle2, AlertCircle, Smartphone, Lock, Eye, Bell,
  Sparkles, ExternalLink, ShieldCheck
} from 'lucide-react';

export const LegalPage = ({ initialTab = 'terms' }) => {
  const { activeTab, setActiveTab } = useApp();
  const [currentSection, setCurrentSection] = useState(
    activeTab === 'privacy' ? 'privacy' : (initialTab || 'terms')
  );
  const [copiedEmail, setCopiedEmail] = useState(false);

  useEffect(() => {
    if (activeTab === 'privacy') {
      setCurrentSection('privacy');
    } else if (activeTab === 'terms') {
      setCurrentSection('terms');
    }
  }, [activeTab]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentSection]);

  const handleCopyEmail = (email = 'alex@firstloop.com') => {
    navigator.clipboard.writeText(email);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="pt-24 sm:pt-28 pb-24 bg-slate-50 min-h-screen text-slate-700 selection:bg-teal-500 selection:text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Breadcrumb & Controls */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <button
            onClick={() => setActiveTab('home')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white hover:bg-slate-100 text-slate-800 text-xs sm:text-sm font-extrabold border border-slate-200 shadow-sm transition-all group cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform text-slate-600" />
            <span>Back to Home</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200 shadow-sm transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>Print Page</span>
            </button>
            <span className="text-xs font-bold text-teal-800 bg-teal-100/80 px-3.5 py-2 rounded-full border border-teal-200">
              Updated: September 2026
            </span>
          </div>
        </div>

        {/* Page Hero Title */}
        <div className="text-center max-w-3xl mx-auto mb-10 space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-slate-900 text-white text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
            <span>First Loop Trust & Legal Center</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            {currentSection === 'terms' ? 'Terms and Conditions' : 'Privacy Policy'}
          </h1>

          <p className="text-slate-600 text-sm sm:text-base max-w-2xl mx-auto">
            {currentSection === 'terms'
              ? 'Our guidelines, merchant responsibilities, and terms of service for Apple Wallet & Google Wallet loyalty programs.'
              : 'Our commitment to data protection, merchant confidentiality, and end-customer privacy.'}
          </p>
        </div>

        {/* Two-Tab Switcher (Terms and Conditions / Privacy Policy) */}
        <div className="flex justify-center mb-10">
          <div className="bg-slate-200/80 p-1.5 rounded-2xl flex items-center border border-slate-300/80 shadow-inner max-w-md w-full">
            <button
              type="button"
              onClick={() => {
                setCurrentSection('terms');
                setActiveTab('terms');
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
                currentSection === 'terms'
                  ? 'bg-slate-900 text-white shadow-lg'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
              }`}
            >
              <FileText className={`w-4 h-4 ${currentSection === 'terms' ? 'text-teal-400' : 'text-slate-500'}`} />
              <span>Terms & Conditions</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setCurrentSection('privacy');
                setActiveTab('privacy');
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
                currentSection === 'privacy'
                  ? 'bg-teal-700 text-white shadow-lg'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
              }`}
            >
              <Shield className={`w-4 h-4 ${currentSection === 'privacy' ? 'text-teal-300' : 'text-slate-500'}`} />
              <span>Privacy Policy</span>
            </button>
          </div>
        </div>

        {/* Main Content Paper Container */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl shadow-slate-900/5 p-6 sm:p-10 lg:p-12">
          
          {/* ========================================================================= */}
          {/* VIEW 1: TERMS AND CONDITIONS */}
          {/* ========================================================================= */}
          {currentSection === 'terms' && (
            <div className="space-y-10 animate-in fade-in duration-200">
              
              {/* Highlight Intro Box */}
              <div className="p-6 rounded-2xl bg-teal-50 border border-teal-200/70 space-y-2">
                <div className="flex items-center gap-2 text-teal-950 font-black text-lg">
                  <FileText className="w-5 h-5 text-teal-600" />
                  <span>Terms of Service Agreement</span>
                </div>
                <p className="text-xs sm:text-sm text-teal-900 leading-relaxed font-medium">
                  Welcome to <strong>First Loop</strong> (accessible at <code className="font-mono bg-teal-100/80 px-1.5 py-0.5 rounded text-teal-950">firstloop.co.in</code>). These Terms and Conditions constitute a legally binding agreement between you (the "Merchant", "Subscriber", or "User") and First Loop ("Company", "we", "us", or "our"), governing your access to and use of our digital loyalty card generation, Apple Wallet (.pkpass) & Google Wallet pass distribution, lock-screen push notification delivery, and merchant dashboard software platform.
                </p>
              </div>

              {/* Section 1 */}
              <section className="space-y-3">
                <h2 className="text-lg font-black text-slate-900 flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-xl bg-slate-900 text-white font-mono text-xs flex items-center justify-center font-black">1</span>
                  <span>Acceptance of Terms & Eligibility</span>
                </h2>
                <p className="text-sm leading-relaxed text-slate-700">
                  By accessing our website, creating an account, selecting a pricing subscription, or registering your business details, you acknowledge that you have read, understood, and agreed to be bound by these Terms and Conditions. If you are registering on behalf of a company, business, or franchise, you represent and warrant that you possess full authority to bind that legal entity.
                </p>
                <p className="text-xs text-slate-500">
                  You must be at least 18 years of age and legally capable of entering into binding contracts under applicable laws to use First Loop.
                </p>
              </section>

              {/* Section 2 */}
              <section className="space-y-3">
                <h2 className="text-lg font-black text-slate-900 flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-xl bg-slate-900 text-white font-mono text-xs flex items-center justify-center font-black">2</span>
                  <span>Scope of First Loop Services</span>
                </h2>
                <p className="text-sm leading-relaxed text-slate-700">
                  First Loop provides cloud-based Software-as-a-Service (SaaS) tools allowing merchants to:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-700 space-y-1">
                    <strong className="text-slate-900 block font-bold">📱 Digital Wallet Pass Engine</strong>
                    Create, customize, and issue digital stamp cards and VIP membership passes formatted for Apple Wallet (.pkpass) and Google Wallet.
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-700 space-y-1">
                    <strong className="text-slate-900 block font-bold">⚡ Zero-App Customer Onboarding</strong>
                    Provide QR codes, NFC triggers, and web enrollment links for rapid customer signups without proprietary app downloads.
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-700 space-y-1">
                    <strong className="text-slate-900 block font-bold">🔔 Lock-Screen Push Messaging</strong>
                    Send push notifications and automated loyalty reminders directly to enrolled customer lock-screens.
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-700 space-y-1">
                    <strong className="text-slate-900 block font-bold">📊 Analytics & POS Verification</strong>
                    Scan passes at point of sale, issue stamps, grant rewards, and monitor retention analytics.
                  </div>
                </div>
              </section>

              {/* Section 3 */}
              <section className="space-y-3">
                <h2 className="text-lg font-black text-slate-900 flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-xl bg-slate-900 text-white font-mono text-xs flex items-center justify-center font-black">3</span>
                  <span>Merchant Account & Security Responsibilities</span>
                </h2>
                <p className="text-sm leading-relaxed text-slate-700">
                  Merchants are required to provide accurate, current, and verifiable business information upon registration (including legal store name, valid mobile phone number, and official email address). You are solely responsible for maintaining the confidentiality of your credentials and for all operations executed under your merchant profile.
                </p>
                <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    If you detect any unauthorized access, compromised pass issuance keys, or security vulnerabilities, notify us immediately at <strong className="font-mono text-amber-950">alex@firstloop.com</strong>.
                  </span>
                </div>
              </section>

              {/* Section 4 */}
              <section className="space-y-3">
                <h2 className="text-lg font-black text-slate-900 flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-xl bg-slate-900 text-white font-mono text-xs flex items-center justify-center font-black">4</span>
                  <span>Push Notification & Messaging Acceptable Use Policy</span>
                </h2>
                <p className="text-sm leading-relaxed text-slate-700">
                  First Loop enables lock-screen push notifications to passholders. Merchants strictly agree to use this feature solely for legitimate business operations:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200 text-xs text-emerald-950 space-y-1.5">
                    <strong className="text-emerald-900 font-black flex items-center gap-1.5 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Permitted Uses
                    </strong>
                    <ul className="list-disc pl-4 space-y-1 text-emerald-800">
                      <li>Store promotions, happy hours, and new arrivals</li>
                      <li>Stamp count balance and reward unlock notices</li>
                      <li>Birthday perks and VIP member exclusive discounts</li>
                    </ul>
                  </div>
                  <div className="p-4 bg-rose-50/70 rounded-2xl border border-rose-200 text-xs text-rose-950 space-y-1.5">
                    <strong className="text-rose-900 font-black flex items-center gap-1.5 text-sm">
                      <AlertCircle className="w-4 h-4 text-rose-600" />
                      Strictly Prohibited
                    </strong>
                    <ul className="list-disc pl-4 space-y-1 text-rose-800">
                      <li>Unsolicited third-party spam or predatory links</li>
                      <li>Harassment, abusive language, or misleading claims</li>
                      <li>Illegal goods, gambling, or prohibited products</li>
                    </ul>
                  </div>
                </div>
                <p className="text-xs text-slate-500">
                  Violating Apple PassKit or Google Wallet Developer guidelines will result in immediate suspension of notification privileges.
                </p>
              </section>

              {/* Section 5 */}
              <section className="space-y-3">
                <h2 className="text-lg font-black text-slate-900 flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-xl bg-slate-900 text-white font-mono text-xs flex items-center justify-center font-black">5</span>
                  <span>Subscriptions & Billing Terms</span>
                </h2>
                <p className="text-sm leading-relaxed text-slate-700">
                  First Loop is provided on a subscription basis under <strong>Starter</strong>, <strong>Growth Pro</strong>, and <strong>Enterprise</strong> plans with monthly or annual billing options:
                </p>
                <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm text-slate-600">
                  <li><strong>Active Plan:</strong> Accounts receive full access to their chosen digital card pass plan upon activation.</li>
                  <li><strong>Automatic Renewal:</strong> Paid subscriptions automatically renew unless cancelled prior to the end of the billing period.</li>
                  <li><strong>Cancellation:</strong> You can cancel your subscription at any time without penalty.</li>
                </ul>
              </section>

              {/* Section 6 */}
              <section className="space-y-3">
                <h2 className="text-lg font-black text-slate-900 flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-xl bg-slate-900 text-white font-mono text-xs flex items-center justify-center font-black">6</span>
                  <span>Intellectual Property & Customer Data Ownership</span>
                </h2>
                <p className="text-sm leading-relaxed text-slate-700">
                  <strong>Your Data & Brand:</strong> You own 100% of your store's customer records, trademarks, logos, and reward structures. First Loop does not claim ownership over your business assets.
                </p>
                <p className="text-sm leading-relaxed text-slate-700">
                  <strong>First Loop Platform:</strong> First Loop retains all rights, title, and interest in and to the SaaS platform, pass rendering technology, APIs, and software algorithms.
                </p>
              </section>

              {/* Section 7 */}
              <section className="space-y-3">
                <h2 className="text-lg font-black text-slate-900 flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-xl bg-slate-900 text-white font-mono text-xs flex items-center justify-center font-black">7</span>
                  <span>Limitation of Liability & Governing Law</span>
                </h2>
                <p className="text-sm leading-relaxed text-slate-700">
                  The service is provided on an "as is" and "as available" basis. First Loop shall not be liable for indirect, incidental, or consequential damages resulting from third-party mobile OS updates (Apple iOS or Google Android) or temporary network outages.
                </p>
                <p className="text-xs text-slate-500">
                  These Terms are governed by and construed in accordance with the laws of India, and courts in India shall have exclusive jurisdiction.
                </p>
              </section>

            </div>
          )}

          {/* ========================================================================= */}
          {/* VIEW 2: PRIVACY POLICY */}
          {/* ========================================================================= */}
          {currentSection === 'privacy' && (
            <div className="space-y-10 animate-in fade-in duration-200">
              
              {/* Highlight Intro Box */}
              <div className="p-6 rounded-2xl bg-teal-50 border border-teal-200/70 space-y-2">
                <div className="flex items-center gap-2 text-teal-950 font-black text-lg">
                  <Shield className="w-5 h-5 text-teal-600" />
                  <span>Privacy Policy & Data Protection</span>
                </div>
                <p className="text-xs sm:text-sm text-teal-900 leading-relaxed font-medium">
                  At <strong>First Loop</strong> (<code className="font-mono bg-teal-100/80 px-1.5 py-0.5 rounded text-teal-950">firstloop.co.in</code>), protecting personal information and ensuring privacy for both business owners and their end-customers is our highest commitment. This Privacy Policy details our data collection, security safeguards, and privacy controls in compliance with the Digital Personal Data Protection (DPDP) Act, GDPR, and international data standards.
                </p>
              </div>

              {/* Strict Zero Data Selling Guarantee */}
              <div className="p-5 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-sky-500/10 rounded-2xl border border-emerald-300 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-600/20">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-emerald-950">
                    Our Strict Zero-Data-Selling Pledge
                  </h3>
                  <p className="text-xs sm:text-sm text-emerald-900 mt-1">
                    First Loop <strong>NEVER</strong> sells, rents, monetizes, or shares merchant customer contact lists, visit records, or phone numbers with advertisers, data brokers, or marketing networks.
                  </p>
                </div>
              </div>

              {/* Section 1 */}
              <section className="space-y-3">
                <h2 className="text-lg font-black text-slate-900 flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-xl bg-teal-700 text-white font-mono text-xs flex items-center justify-center font-black">1</span>
                  <span>Information We Collect</span>
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                  
                  {/* Merchant Details */}
                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-teal-600"></span>
                      <span>A. Merchant Account Information</span>
                    </div>
                    <ul className="text-xs text-slate-600 space-y-2">
                      <li>• <strong>Contact Details:</strong> Full name, official business email, and verified mobile phone number.</li>
                      <li>• <strong>Store Profile:</strong> Business name, industry category, location, and uploaded brand assets.</li>
                      <li>• <strong>Subscription Details:</strong> Selected plan tier (Starter/Growth/Enterprise) and billing frequency.</li>
                    </ul>
                  </div>

                  {/* Customer Pass Details */}
                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-sky-600"></span>
                      <span>B. End-Customer Loyalty Pass Data</span>
                    </div>
                    <ul className="text-xs text-slate-600 space-y-2">
                      <li>• <strong>Passholder Profile:</strong> Customer name, phone number or email entered upon pass download.</li>
                      <li>• <strong>Loyalty Activity:</strong> Stamps earned, rewards claimed, lifetime points, and visit timestamps.</li>
                      <li>• <strong>Wallet Device Token:</strong> Anonymous Apple Push Notification service token or Google Wallet object ID.</li>
                    </ul>
                  </div>

                </div>
              </section>

              {/* Section 2 */}
              <section className="space-y-3">
                <h2 className="text-lg font-black text-slate-900 flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-xl bg-teal-700 text-white font-mono text-xs flex items-center justify-center font-black">2</span>
                  <span>How We Use Collected Information</span>
                </h2>
                <p className="text-sm leading-relaxed text-slate-700">We utilize information strictly for essential platform functionality:</p>
                <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm text-slate-600">
                  <li>Building and cryptographically signing <code className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-800">.pkpass</code> files for Apple Wallet and Google Wallet Passes API objects.</li>
                  <li>Delivering real-time lock-screen push updates when stamps are awarded or rewards become available.</li>
                  <li>Rendering private analytics metrics on the merchant dashboard (visit frequency, customer retention).</li>
                  <li>Providing dedicated merchant technical assistance and essential system service updates.</li>
                </ul>
              </section>

              {/* Section 3 */}
              <section className="space-y-3">
                <h2 className="text-lg font-black text-slate-900 flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-xl bg-teal-700 text-white font-mono text-xs flex items-center justify-center font-black">3</span>
                  <span>End-Customer Privacy Controls & Opt-Out</span>
                </h2>
                <p className="text-sm leading-relaxed text-slate-700">
                  End-customers maintain complete sovereignty over their data:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                    <strong className="block text-slate-900 mb-1 font-bold">Remove Pass Anytime</strong>
                    Tapping "Remove Pass" in Apple Wallet or Google Wallet immediately deletes the pass and ceases push messaging.
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                    <strong className="block text-slate-900 mb-1 font-bold">Toggle Notifications</strong>
                    Customers can mute pass lock-screen notifications directly in their iOS or Android system settings.
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                    <strong className="block text-slate-900 mb-1 font-bold">Right to Erasure</strong>
                    Customers may request complete record deletion by contacting the store or emailing <span className="font-mono text-teal-700">alex@firstloop.com</span>.
                  </div>
                </div>
              </section>

              {/* Section 4 */}
              <section className="space-y-3">
                <h2 className="text-lg font-black text-slate-900 flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-xl bg-teal-700 text-white font-mono text-xs flex items-center justify-center font-black">4</span>
                  <span>Data Security & Infrastructure Safeguards</span>
                </h2>
                <p className="text-sm leading-relaxed text-slate-700">
                  We employ rigorous technical security measures including TLS 1.3 encryption for all data in transit, AES-256 encryption at rest, secure certificate management for Apple WWDR and Google Wallet keys, and role-based access control.
                </p>
              </section>

              {/* Section 5 */}
              <section className="space-y-3">
                <h2 className="text-lg font-black text-slate-900 flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-xl bg-teal-700 text-white font-mono text-xs flex items-center justify-center font-black">5</span>
                  <span>Contact Data Privacy Team</span>
                </h2>
                <p className="text-sm leading-relaxed text-slate-700">
                  If you have questions, data access requests, or compliance inquiries regarding this Privacy Policy:
                </p>
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <button
                    onClick={() => handleCopyEmail('alex@firstloop.com')}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 border border-slate-300 text-xs font-bold text-slate-900 hover:bg-teal-50 hover:border-teal-400 transition-all cursor-pointer"
                  >
                    <Mail className="w-4 h-4 text-teal-600" />
                    <span>alex@firstloop.com</span>
                    {copiedEmail ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-400" />}
                  </button>
                  <span className="text-xs text-slate-500">Inquiries addressed within 24–48 business hours.</span>
                </div>
              </section>

            </div>
          )}

        </div>

      </div>
    </div>
  );
};
