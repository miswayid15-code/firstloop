import React from 'react';

export default function ReachUs() {
  return (
    <>
      {/* Hero Banner */}
      <div className="section-hero v1">
        <div className="hero-image"></div>
        <div className="container">
          <div className="content-wrap text-center">
            <div className="title text-display-2 effectFade fadeRotateX">
              <span className="title1 fw-semibold text-gradient-1" style={{ fontSize: '60px'}}>We’re Here to Help</span>
            </div>
            <p className="text effectFade fadeUp">
              Reach out to our team today .
            </p>
          </div>
        </div>
      </div>
      {/* /Hero Banner */}

      {/* section-contact */}
      <div id="contact" className="flat-spacing">
        <div className="section-contact p-0">
          <div className="container">
            <div className="row mb-60">
              <div className="col-md-4 md-mb-24">
                <div className="box-contact-item text-center effectFade fadeUp">
                  <i className="icon icon-envelope-solid"></i>
                  <h6 className="title fw-semibold">E-mail address</h6>
                  <a className="text" href="mailto:info@firstpassapp.co">
                    info@firstpassapp.co
                  </a>
                </div>
              </div>
              <div className="col-md-4 md-mb-24">
                <div className="box-contact-item text-center effectFade fadeUp" data-delay="0.1">
                  <i className="icon icon-headset-solid"></i>
                  <h6 className="title fw-semibold">Phone number</h6>
                  <a href="tel:+919876543210" className="text">
                    +91 98765 43210
                  </a>
                </div>
              </div>
              <div className="col-md-4">
                <div className="box-contact-item text-center effectFade fadeUp" data-delay="0.2">
                  <i className="icon icon-globe-solid" style={{color: 'white'}}></i>
                  <h6 className="title fw-semibold">Website</h6>
                  <a href="https://firstpassapp.co/" className="text" target="_blank" rel="noopener noreferrer">
                    www.firstpassapp.co
                  </a>
                </div>
              </div>
            </div>
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
                    <div className="heading-sub fw-semibold effectFade fadeUp">Contact Us</div>
                    <div className="heading-title text-gradient-3 effectFade fadeRotateX">
                      Your Questions, <br/>Our Priority
                    </div>
                  </div>
                  <div>
                    <div className="contact-item mb-20 effectFade fadeRotateX">
                      <i className="icon icon-map-marker-solid"></i>
                      <div className="content">
                        <div className="title fw-semibold mb-2">Office Location</div>
                        <div className="text"></div>
                      </div>
                    </div>
                    <div className="contact-item mb-20 effectFade fadeRotateX" data-delay="0.1">
                      <i className="icon icon-headset-solid"></i>
                      <div className="content">
                        <div className="title fw-semibold mb-2">Phone number</div>
                        <div className="text"></div>
                      </div>
                    </div>
                    <div className="contact-item mb-20 effectFade fadeRotateX" data-delay="0.2">
                      <i className="icon icon-envelope-solid"></i>
                      <div className="content">
                        <div className="title fw-semibold mb-2">E-mail address</div>
                        <div className="text"></div>
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
                    <input className="" type="text" placeholder="Enter the Phone number" required />
                  </fieldset>
                  <fieldset className="mb-21">
                    <label className="fw-semibold text-body-3 mb-20">Your E-Mail</label>
                    <input className="" type="text" placeholder="Enter the e-mail" required />
                  </fieldset>
                  <fieldset className="mb-18">
                    <label className="fw-semibold text-body-3 mb-0">More about the enqiry</label>
                    <textarea name="text" className=""></textarea>
                  </fieldset>
                  {/* <div className="attachment d-flex gap-8 align-items-center">
                    <i className="icon icon-paperclip-solid fs-24"></i>
                    <div className="fw-semibold text-body-3">Add an Attachment</div>
                  </div> */}
                  <button type="submit" className="tf-btn w-100">Submit Message</button>
                </form>
               </div>
              </div>
             </div>
             </div>
         </div>
          </div>
        </div>
      </div>
      {/* /section-contact */}

      {/* map */}
      <div className="wg-map">
        <iframe
          src="https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d317859.6089702069!2d-0.075949!3d51.508112!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x48760349331f38dd%3A0xa8bf49dde1d56467!2sTower%20of%20London!5e0!3m2!1sen!2sus!4v1719221598456!5m2!1sen!2sus"
          height="660" style={{ border: 0 }} allowFullScreen={true} loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"></iframe>
      </div>
      {/* /map */}
    </>
  );
}
