import React from 'react';

export default function Portfolio() {
  return (
    <>
      {/* Hero Banner */}
      <div className="section-hero v1">
        <div className="hero-image"></div>
        <div className="container">
          <div className="content-wrap text-center">
            <div className="title text-display-2 effectFade fadeZoom">
              <span className="title1 fw-semibold text-gradient-1">Explore Our Finest</span>
              <br />
              <div className="title2 d-flex gap-20 justify-content-center flex-wrap">
                <span className="fw-semibold text-gradient-1">AI Work</span>
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
              Where innovation meets intelligence. Discover data-driven solutions, smart automation, and <br /> transformative projects shaping the future of businesses worldwide.
            </p>
          </div>
        </div>
      </div>
      {/* /Hero Banner */}

      {/* section-featured-works */}
      <div id="works" className="section-featured-works flat-spacing">
        <div className="container">
          <div className="heading-section mb-0">
            <div className="heading-sub fw-semibold mx-auto effectFade fadeUp">Featured Works</div>
          </div>
          <div className="featured-works-list position-relative">
            <div>
              <div className="featured-works-item effectFade fadeUp no-div">
                <div className="image main-mouse-hover">
                  <img src="asset/images/section/featured-works-1.jpg" alt="" />
                  <a href="#/portfolio" className="tf-mouse view-project h6" onClick={(e) => e.preventDefault()}>
                    View Project
                    <i className="icon icon-arrow-top-right"></i>
                  </a>
                </div>
                <div className="content">
                  <div className="pagi-dot">
                    <span className="active"></span>
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                  <div className="bot">
                    <h4 className="heading fw-semibold">Support Copilot <br /> for SaaS</h4>
                    <div className="grid-text">
                      <div className="item">
                        <div className="title text-secondary">DESCRIPTION</div>
                        <div className="text-body-3 fw-semibold">Draft replies and pulls account context; reduced first-response time by 38%.</div>
                      </div>
                      <div className="item">
                        <div className="title text-secondary">DELIVERABLES</div>
                        <div className="fw-semibold text-body-3">AI strategy, AI UX flows, <br /> LLM agent, RAG</div>
                      </div>
                      <div className="item">
                        <div className="title text-secondary">INDUSTRY</div>
                        <div className="fw-semibold text-body-3">SaaS</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <div className="featured-works-item">
                <div className="image main-mouse-hover">
                  <img src="asset/images/section/featured-works-2.jpg" alt="" />
                  <a href="#/portfolio" className="tf-mouse view-project h6" onClick={(e) => e.preventDefault()}>
                    View Project
                    <i className="icon icon-arrow-top-right"></i>
                  </a>
                </div>
                <div className="content">
                  <div className="pagi-dot">
                    <span></span>
                    <span className="active"></span>
                    <span></span>
                    <span></span>
                  </div>
                  <div className="bot">
                    <h4 className="heading fw-semibold">Underwriting <br /> Risk Copilot</h4>
                    <div className="grid-text">
                      <div className="item">
                        <div className="title text-secondary">DESCRIPTION</div>
                        <div className="text-body-3 fw-semibold">Built a triage assistant to summarize claims; cut manual review time by 42%.</div>
                      </div>
                      <div className="item">
                        <div className="title text-secondary">DELIVERABLES</div>
                        <div className="fw-semibold">Use-case mapping, Prompt & UI patterns</div>
                      </div>
                      <div className="item">
                        <div className="title text-secondary">INDUSTRY</div>
                        <div className="fw-semibold">Fintech</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <div className="featured-works-item">
                <div className="image main-mouse-hover">
                  <img src="asset/images/section/featured-works-3.jpg" alt="" />
                  <a href="#/portfolio" className="tf-mouse view-project h6" onClick={(e) => e.preventDefault()}>
                    View Project
                    <i className="icon icon-arrow-top-right"></i>
                  </a>
                </div>
                <div className="content">
                  <div className="pagi-dot">
                    <span></span>
                    <span></span>
                    <span className="active"></span>
                    <span></span>
                  </div>
                  <div className="bot">
                    <h4 className="heading fw-semibold">Clinical Note <br /> Summarizer</h4>
                    <div className="grid-text">
                      <div className="item">
                        <div className="title text-secondary">DESCRIPTION</div>
                        <div className="text-body-3 fw-semibold">Clinic-lobby assistant answering pre-visit questions; decreased front-desk calls by 28%.</div>
                      </div>
                      <div className="item">
                        <div className="title text-secondary">DELIVERABLES</div>
                        <div className="fw-semibold">PHI-safe RAG, HIPAA-aligned workflows</div>
                      </div>
                      <div className="item">
                        <div className="title text-secondary">INDUSTRY</div>
                        <div className="fw-semibold">Healthcare</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <div className="featured-works-item">
                <div className="image main-mouse-hover">
                  <img src="asset/images/section/featured-works-4.jpg" alt="" />
                  <a href="#/portfolio" className="tf-mouse view-project h6" onClick={(e) => e.preventDefault()}>
                    View Project
                    <i className="icon icon-arrow-top-right"></i>
                  </a>
                </div>
                <div className="content">
                  <div className="pagi-dot">
                    <span></span>
                    <span></span>
                    <span></span>
                    <span className="active"></span>
                  </div>
                  <div className="bot">
                    <h4 className="heading fw-semibold">Catalog Intelligence <br /> Engine</h4>
                    <div className="grid-text">
                      <div className="item">
                        <div className="title text-secondary">DESCRIPTION</div>
                        <div className="text-body-3 fw-semibold">Launched a shopping copilot that understands attributes; raised add-to-cart by 12%.</div>
                      </div>
                      <div className="item">
                        <div className="title text-secondary">DELIVERABLES</div>
                        <div className="fw-semibold">Data cleaning & embeddings</div>
                      </div>
                      <div className="item">
                        <div className="title text-secondary">INDUSTRY</div>
                        <div className="fw-semibold">Ecommerce/Retail</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* /section-featured-works */}

      <div className="box-white">
        {/* section-delay */}
        <div className="section-delay flat-spacing">
          <div className="container">
            <div className="heading-section center mb-64">
              <div className="heading-sub fw-semibold effectFade fadeUp">Why Delay Hurts</div>
              <div className="heading-title text-gradient-3 effectFade fadeRotateX">The longer you wait, the harder <br /> it is to catch up.</div>
            </div>
            <div className="delay-wrap">
              <div className="delay-item">
                <div className="left">
                  <h6 className="effectFade fadeUp title fw-semibold mb-12">Manual Operations Slow Progress</h6>
                  <h6 className="effectFade fadeUp title fw-semibold">/ 01</h6>
                </div>
                <div className="right">
                  <div className="delay-progress mb-12">
                    <div className="progress-line" data-progress="80"></div>
                    <h4 className="number-progress fw-semibold text-white">80%</h4>
                  </div>
                  <div className="text text-secondary text-end">/Workload</div>
                </div>
              </div>
              <div className="delay-item">
                <div className="left">
                  <h6 className="effectFade fadeUp title fw-semibold mb-12">Competitors Outpace Innovation</h6>
                  <h6 className="effectFade fadeUp title fw-semibold">/ 02</h6>
                </div>
                <div className="right">
                  <div className="delay-progress mb-12">
                    <div className="progress-line" data-progress="65"></div>
                    <h4 class="number-progress fw-semibold text-white">65%</h4>
                  </div>
                  <div className="text text-secondary text-end">/Growth</div>
                </div>
              </div>
              <div className="delay-item">
                <div className="left">
                  <h6 className="effectFade fadeUp title fw-semibold mb-12">Automation Potential Remains Untapped</h6>
                  <h6 className="effectFade fadeUp title fw-semibold">/ 03</h6>
                </div>
                <div className="right">
                  <div className="delay-progress mb-12">
                    <div className="progress-line" data-progress="70"></div>
                    <h4 className="number-progress fw-semibold text-white">70%</h4>
                  </div>
                  <div className="text text-secondary text-end">/Opportunities</div>
                </div>
              </div>
              <div className="delay-item">
                <div className="left">
                  <h6 className="effectFade fadeUp title fw-semibold mb-12">Repetition Replaces Creativity</h6>
                  <h6 className="effectFade fadeUp title fw-semibold">/ 04</h6>
                </div>
                <div className="right">
                  <div className="delay-progress mb-12">
                    <div className="progress-line" data-progress="49"></div>
                    <h4 className="number-progress fw-semibold text-white">49%</h4>
                  </div>
                  <div className="text text-secondary text-end">/Draining Time</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* /section-delay */}

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
                        <div className="text">+1 617 572 3012</div>
                      </div>
                    </div>
                    <div className="contact-item mb-20 effectFade fadeRotateX" data-delay="0.2">
                      <i className="icon icon-envelope-solid"></i>
                      <div className="content">
                        <div className="title fw-semibold mb-2">E-mail address</div>
                        <div className="text">info@firstpass.com</div>
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
