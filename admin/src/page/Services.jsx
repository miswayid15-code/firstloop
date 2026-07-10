import React from 'react';

export default function Offerings() {
  return (
    <>
      {/* Hero Banner */}
      <div className="section-hero v1">
        <div className="hero-image"></div>
        <div className="container">
          <div className="content-wrap text-center">
            <div className="title text-display-2 effectFade fadeRotateX">
              <span className="title1 fw-semibold text-gradient-1">Grow Your Business with</span>
              <br />
              <div className="title2 d-flex gap-20 justify-content-center flex-wrap">
                <span className="fw-semibold text-gradient-1">First Pass Partner</span>
                <div className="title-icon">
                  <div className="box"></div>
                  <div className="title-icon-wrap">
                    <img src="asset/images/item/item-13.svg" alt="" className="img-1 img-transform-3" />
                    <img src="asset/images/item/item-14.svg" alt="" className="img-2 img-transform-3" />
                    <img src="asset/images/item/item-15.svg" alt="" className="img-3 img-transform-3" />
                  </div>
                </div>
              </div>
            </div>
            <p className="text effectFade fadeUp">
              Unlock growth with our all-in-one platform, delivering smart, efficient solutions from <br /> daily operations to customer engagement for innovative business success.
            </p>
          </div>
        </div>
      </div>
      {/* /Hero Banner */}

      {/* section-services */}
      <div id="services" className="section-services flat-spacing">
        <div className="container">
          <div className="top">
            <div className="heading-section center mb-48">
              <div className="heading-sub fw-semibold effectFade fadeUp">Services</div>
              <div className="heading-title text-gradient-3 effectFade fadeRotateX">End-to-End Management Tools</div>
            </div>
            <p className="text text-center effectFade fadeUp">We turn daily operations into a streamlined process your team trusts—combining branches, <br /> appointments, offers, and powerful role-based access.</p>
          </div>
          <div className="accordion-faq_list gap-32" id="accordion-services">
            <div className="accordion-faq_item style-1 effectFade fadeRotateX" role="presentation">
              <div className="accordion-action" data-bs-target="#faq-1" role="button"
                data-bs-toggle="collapse" aria-controls="faq-1" aria-expanded="true">
                <div className="accordion-title">
                  Business Registration & Profile Management
                  <i className="icon icon-arrow-top-right"></i>
                </div>
              </div>
              <div id="faq-1" className="collapse show" data-bs-parent="#accordion-services">
                <div className="accordion-content">
                  <div className="image">
                    <img src="asset/images/section/service-5.jpg" alt="" />
                  </div>
                  <div className="content">
                    <div className="text-body-3 text-neutral-300 text">Register your business in minutes and manage your profile with ease. Create your business profile quickly and securely. Keep your business information up-to-date anytime with secure verification to ensure safe and verified business registrations.</div>
                    <div className="list-tags">
                      <a href="#" className="tags-item fw-semibold" onClick={(e) => e.preventDefault()}>Register Your Business</a>
                      <a href="#" className="tags-item fw-semibold" onClick={(e) => e.preventDefault()}>Update Business Profile</a>
                      <a href="#" className="tags-item fw-semibold" onClick={(e) => e.preventDefault()}>Secure Verification</a>
                    </div>
                    <div className="text-body-1 num">01</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="accordion-faq_item style-1 effectFade fadeRotateX" role="presentation">
              <div className="accordion-action collapsed" data-bs-target="#faq-2" role="button"
                data-bs-toggle="collapse" aria-controls="faq-2" aria-expanded="false">
                <div className="accordion-title">
                  Branch, Staff & Appointment Management
                  <i className="icon icon-arrow-top-right"></i>
                </div>
              </div>
              <div id="faq-2" className="collapse" data-bs-parent="#accordion-services">
                <div className="accordion-content">
                  <div className="image">
                    <img src="asset/images/section/service-6.jpg" alt="" />
                  </div>
                  <div className="content">
                    <div className="text-body-3 text-neutral-300 text">Manage your operations, team and appointments efficiently. Add, update and manage multiple branches or outlets. Create receptionist accounts with branch-specific access and enjoy role-based access control with dedicated permissions for security.</div>
                    <div className="list-tags">
                      <a href="#" className="tags-item fw-semibold" onClick={(e) => e.preventDefault()}>Multi-Branch Management</a>
                      <a href="#" className="tags-item fw-semibold" onClick={(e) => e.preventDefault()}>Receptionist Accounts</a>
                      <a href="#" className="tags-item fw-semibold" onClick={(e) => e.preventDefault()}>Appointment Management</a>
                    </div>
                    <div className="text-body-1 num">02</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="accordion-faq_item style-1 effectFade fadeRotateX" role="presentation">
              <div className="accordion-action collapsed" data-bs-target="#faq-3" role="button"
                data-bs-toggle="collapse" aria-controls="faq-3" aria-expanded="false">
                <div className="accordion-title">
                  Coupon, Offer & Customer Engagement
                  <i className="icon icon-arrow-top-right"></i>
                </div>
              </div>
              <div id="faq-3" className="collapse" data-bs-parent="#accordion-services">
                <div className="accordion-content">
                  <div className="image">
                    <img src="asset/images/section/service-7.jpg" alt="" />
                  </div>
                  <div className="content">
                    <div className="text-body-3 text-neutral-300 text">Create offers, engage customers and grow your business faster. Design exciting offers and launch campaigns. Review and approve or reject coupon claims, chat with customers to provide instant support, and send updates and notifications.</div>
                    <div className="list-tags">
                      <a href="#" className="tags-item fw-semibold" onClick={(e) => e.preventDefault()}>Create & Publish Offers</a>
                      <a href="#" className="tags-item fw-semibold" onClick={(e) => e.preventDefault()}>Coupon Claim Processing</a>
                      <a href="#" className="tags-item fw-semibold" onClick={(e) => e.preventDefault()}>Customer Chat Support</a>
                    </div>
                    <div className="text-body-1 num">03</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="accordion-faq_item style-1 effectFade fadeRotateX" role="presentation">
              <div className="accordion-action collapsed" data-bs-target="#faq-4" role="button"
                data-bs-toggle="collapse" aria-controls="faq-4" aria-expanded="false">
                <div className="accordion-title">
                  Analytics & Performance Tracking
                  <i className="icon icon-arrow-top-right"></i>
                </div>
              </div>
              <div id="faq-4" className="collapse" data-bs-parent="#accordion-services">
                <div className="accordion-content">
                  <div className="image">
                    <img src="asset/images/section/service-8.jpg" alt="" />
                  </div>
                  <div className="content">
                    <div className="text-body-3 text-neutral-300 text">Monitor revenue, appointments, and overall business growth. Track your sales performance, analyze customer engagement, and use actionable data to improve efficiency across all branches.</div>
                    <div className="list-tags">
                      <a href="#" className="tags-item fw-semibold" onClick={(e) => e.preventDefault()}>Track Performance</a>
                      <a href="#" className="tags-item fw-semibold" onClick={(e) => e.preventDefault()}>Boost Revenue</a>
                      <a href="#" className="tags-item fw-semibold" onClick={(e) => e.preventDefault()}>Real-Time Notifications</a>
                    </div>
                    <div className="text-body-1 num">04</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* /section-services */}

      {/* section-partner */}
      <div className="section-partner">
        <div className="container">
          <div className="row">
            <div className="col-12">
              <div className="partner-wrap">
                <p className="text-secondary text fw-semibold">Trusted by 100+ <br /> top-tier brands</p>
                <div className="infiniteSlide_tech_main d-grid">
                  <div className="infiniteSlide infiniteSlide_partner" data-clone="5">
                    <img src="asset/images/partner/partner-1.svg" alt="" />
                    <img src="asset/images/partner/partner-2.svg" alt="" />
                    <img src="asset/images/partner/partner-3.svg" alt="" />
                    <img src="asset/images/partner/partner-4.svg" alt="" />
                    <img src="asset/images/partner/partner-5.svg" alt="" />
                    <img src="asset/images/partner/partner-6.svg" alt="" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* /section-partner */}

      <div className="box-white">
        {/* section-process */}
        <div className="section-process flat-spacing">
          <div className="container">
            <div className="row">
              <div className="col-lg-5">
                <div className="process-heading h-100">
                  <div className="heading-section mb-80">
                    <div className="heading-sub fw-semibold effectFade fadeUp">Process</div>
                    <div className="heading-title text-gradient-3 effectFade fadeRotateX">From Sign Up <br /> to Success</div>
                  </div>
                  <div className="group-btn-slider">
                    <div className="nav-prev-swiper">
                      <i className="icon icon-angle-left-solid"></i>
                    </div>
                    <div className="nav-next-swiper">
                      <i className="icon icon-angle-right-solid"></i>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-lg-7">
                <div className="process-slide">
                  <div dir="ltr" className="swiper tf-swiper swiper-box-shadow" data-preview="1.78" data-tablet="1.78" data-mobile-sm="1.5" data-mobile="1.2"
                    data-loop="false" data-center="false" data-space-lg="24" data-space-md="24" data-space="15" >
                    <div className="swiper-wrapper">
                      <div className="swiper-slide">
                        <div className="process-card">
                          <i className="icon icon-search-solid"></i>
                          <div className="content">
                            <h4 className="title fw-semibold">Register Your Business</h4>
                            <p className="text text-secondary">Create your business profile quickly and securely. Add branches, configure your services, and get verified in minutes.</p>
                          </div>
                          <div className="bot">
                            <div className="time fw-semibold">3-7 DAYS</div>
                            <div className="number">
                              <span className="text-neutral-400">01</span>
                              <span className="text-neutral-200">/03</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="swiper-slide">
                        <div className="process-card">
                          <i className="icon icon-bolt-solid"></i>
                          <div className="content">
                            <h4 className="title fw-semibold">Configure Operations</h4>
                            <p className="text text-secondary">Set up staff accounts, create engaging offers, and publish your profile to start attracting local customers immediately.</p>
                          </div>
                          <div className="bot">
                            <div className="time fw-semibold">1-2 WEEKS</div>
                            <div className="number">
                              <span className="text-neutral-400">02</span>
                              <span className="text-neutral-200">/03</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="swiper-slide">
                        <div className="process-card">
                          <i className="icon icon-user-check-solid-1"></i>
                          <div className="content">
                            <h4 className="title fw-semibold">Grow & Manage</h4>
                            <p className="text text-secondary">Process appointments, claim coupons, chat with customers, and monitor your revenue and performance metrics.</p>
                          </div>
                          <div className="bot">
                            <div className="time fw-semibold">1 WEEKS</div>
                            <div className="number">
                              <span className="text-neutral-400">03</span>
                              <span className="text-neutral-200">/03</span>
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
        {/* /section-process */}

        {/* section-pricing */}
        <div id="pricing" className="section-pricing flat-spacing pt-0">
          <div className="container">
            <div className="heading-section mb-80">
              <div className="heading-sub fw-semibold effectFade fadeUp">Pricing Plans</div>
              <div className="heading-title text-gradient-3 gap-8 d-grid effectFade fadeRotateX">
                <span>From pilot to enterprise</span> 
                <span>clear scope, transparent costs</span>
                <div className="d-flex align-items-center gap-24 flex-wrap">
                  <input type="checkbox" id="pricingSwitch" className="tf-switch-check" defaultChecked={true} /> 
                  annually.
                </div>
              </div>
            </div>
            <div className="row">
              <div className="col-lg-6 lg-mb-24">
                <div className="pricing-item h-100 effectFade fadeRotateX">
                  <div className="top d-flex gap-12 align-items-center">
                    <div className="d-flex gap-8 align-items-center">
                      <i className="icon icon-user-friends-solid fs-24"></i>
                      <div className="fw-semibold text">Starter Plan</div>
                    </div>
                    <div className="line"></div>
                    <div className="fw-semibold text-secondary">For startups</div>
                  </div>
                  <div className="heading">
                    <div className="d-flex gap-14 align-items-end">
                      <div className="price-number fw-bold" data-month="1000" data-year="9900">$9,900</div>
                      <h6 className="price-per">/ year</h6>
                    </div>
                    <a href="#/reach-us" className="tf-btn">
                      Get Started
                    </a>
                  </div>
                  <div className="line"></div>
                  <div className="content">
                    <div>
                      <div className="title fw-semibold mb-4">What’s included</div>
                      <div className="text fw-semibold">
                        Prove value in two weeks with a clickable UX, tech spike, and a clear go/no-go roadmap.
                      </div>
                    </div>
                    <ul className="list-text type-check">
                      <li>
                        <i className="icon icon-check-solid"></i>
                        Discovery workshop
                      </li>
                      <li>
                        <i className="icon icon-check-solid"></i>
                        Opportunity brief
                      </li>
                      <li>
                        <i className="icon icon-check-solid"></i>
                        Clickable UX
                      </li>
                      <li>
                        <i className="icon icon-check-solid"></i>
                        1 data source & 1 integration
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
              <div className="col-lg-6">
                <div className="pricing-item h-100 style-black effectFade fadeRotateX" data-delay="0.1">
                  <div className="top d-flex gap-12 align-items-center">
                    <div className="d-flex gap-8 align-items-center">
                      <i className="icon icon-building fs-24"></i>
                      <div className="fw-semibold text">Enterprise Plan</div>
                    </div>
                    <div className="line"></div>
                    <div className="fw-semibold text-neutral-400">For organisations</div>
                  </div>
                  <div className="heading">
                    <div className="d-flex gap-14 align-items-end">
                      <div className="price-number fw-bold" data-month="1700" data-year="19900">$19,900</div>
                      <h6 className="price-per">/ year</h6>
                    </div>
                    <a href="#/reach-us" className="tf-btn">
                      Get Started
                    </a>
                  </div>
                  <div className="line"></div>
                  <div className="content">
                    <div>
                      <div className="title fw-semibold mb-4">What’s included</div>
                      <div className="text fw-semibold">
                        Compliance-ready delivery for complex orgs—multi-env releases, canaries, and change management.
                      </div>
                    </div>
                    <ul className="list-text type-check">
                      <li>
                        <i className="icon icon-check-solid"></i>
                        Everything in Starter
                      </li>
                      <li>
                        <i className="icon icon-check-solid"></i>
                        CI/CD, tracing, alerts, guardrails
                      </li>
                      <li>
                        <i className="icon icon-check-solid"></i>
                        Full eval dashboard
                      </li>
                      <li>
                        <i className="icon icon-check-solid"></i>
                        3 data source & 3 integration
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* /section-pricing */}
      </div>

      {/* section-faqs */}
      <div className="section-faqs flat-spacing">
        <div className="container">
          <div className="heading-section center mb-64">
            <div className="heading-sub fw-semibold effectFade fadeUp">FAQs</div>
            <div className="heading-title text-gradient-3 effectFade fadeRotateX">
              Frequently Asked <br />Questions
            </div>
          </div>
          <div className="row justify-content-center">
            <div className="col-lg-8">
              <div className="accordion-asked" id="accordion-asked">
                <div className="accordion-asked-item effectFade fadeRotateX">
                  <div className="accordion-asked-title" id="asked1">
                    <button className="accordion-button text-body-1 fw-semibold" type="button" data-bs-toggle="collapse" data-bs-target="#collapse1" aria-expanded="true" aria-controls="collapse1">
                      How do I register my business on First Pass?
                      <span className="right-icon"></span>
                    </button>
                  </div>
                  <div id="collapse1" role="region" className="accordion-collapse collapse show" aria-labelledby="asked1" data-bs-parent="#accordion-asked">
                    <div className="accordion-body">
                      You can register by downloading the Partner App and providing your business details for secure verification. It takes only a few minutes.
                    </div>
                  </div>
                </div>
                <div className="accordion-asked-item effectFade fadeRotateX" data-delay="0.1">
                  <div className="accordion-asked-title" id="asked2">
                    <button className="accordion-button text-body-1 fw-semibold collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse2" aria-expanded="false" aria-controls="collapse2">
                      Can I manage multiple branches from one account?
                      <span className="right-icon"></span>
                    </button>
                  </div>
                  <div id="collapse2" role="region" className="accordion-collapse collapse" aria-labelledby="asked2" data-bs-parent="#accordion-asked">
                    <div className="accordion-body">
                      Yes! Our platform features Multi-Branch Management, allowing you to add and oversee multiple outlets from a single dashboard.
                    </div>
                  </div>
                </div>
                <div className="accordion-asked-item effectFade fadeRotateX" data-delay="0.2">
                  <div className="accordion-asked-title" id="asked3">
                    <button className="accordion-button text-body-1 fw-semibold collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse3" aria-expanded="false" aria-controls="collapse3">
                      How do the custom offers and coupons work?
                      <span className="right-icon"></span>
                    </button>
                  </div>
                  <div id="collapse3" role="region" className="accordion-collapse collapse" aria-labelledby="asked3" data-bs-parent="#accordion-asked">
                    <div className="accordion-body">
                      You can easily create and publish offers with custom discounts. Customers can claim them on the Customer App, and you can process claims securely.
                    </div>
                  </div>
                </div>
                <div className="accordion-asked-item effectFade fadeRotateX" data-delay="0.3">
                  <div className="accordion-asked-title" id="asked4">
                    <button className="accordion-button text-body-1 fw-semibold collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse4" aria-expanded="false" aria-controls="collapse4">
                      Is the platform secure and reliable?
                      <span className="right-icon"></span>
                    </button>
                  </div>
                  <div id="collapse4" role="region" className="accordion-collapse collapse" aria-labelledby="asked4" data-bs-parent="#accordion-asked">
                    <div className="accordion-body">
                      Absolutely. We provide role-based access control, so you can safely assign specific permissions to receptionists and staff members.
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
                    <div className="heading-sub fw-semibold effectFade fadeUp">Contact</div>
                    <div className="heading-title text-gradient-3 effectFade fadeRotateX">
                      Let’s Build <br /> Intelligent Things
                    </div>
                  </div>
                  <div>
                    <div className="contact-item mb-20 effectFade fadeRotateX">
                      <i className="icon icon-map-marker-solid"></i>
                      <div className="content">
                        <div className="title fw-semibold mb-2">Office Location</div>
                        <div className="text">132 Dartmouth Street, Boston, Massachusetts 02156, United States</div>
                      </div>
                    </div>
                    <div className="contact-item mb-20 effectFade fadeRotateX" data-delay="0.1">
                      <i className="icon icon-headset-solid"></i>
                      <div className="content">
                        <div className="title fw-semibold mb-2">Phone number</div>
                        <div className="text">+91 98765 43210</div>
                      </div>
                    </div>
                    <div className="contact-item mb-20 effectFade fadeRotateX" data-delay="0.2">
                      <i className="icon icon-envelope-solid"></i>
                      <div className="content">
                        <div className="title fw-semibold mb-2">E-mail address</div>
                        <div className="text">support@firstpass.com</div>
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
                <form className="form-contact effectFade fadeUp" onSubmit={(e) => e.preventDefault()}>
                  <h4 className="heading fw-semibold">Fill this form below</h4>
                  <fieldset className="mb-21">
                    <label className="fw-semibold text-body-3 mb-20">Your Name</label>
                    <input className="" type="text" placeholder="Enter your full name" required />
                  </fieldset>
                  <fieldset className="mb-21">
                    <label className="fw-semibold text-body-3 mb-20">Your Phone</label>
                    <input className="" type="text" placeholder="Enter the e-mail" required />
                  </fieldset>
                  <fieldset className="mb-18">
                    <label className="fw-semibold text-body-3 mb-0">More About The Project</label>
                    <textarea name="text" className=""></textarea>
                  </fieldset>
                  <div className="attachment d-flex gap-8 align-items-center">
                    <i className="icon icon-paperclip-solid fs-24"></i>
                    <div className="fw-semibold text-body-3">Add an Attachment</div>
                  </div>
                  <button type="submit" className="tf-btn w-100">Submit Message</button>
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
