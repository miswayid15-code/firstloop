import React from 'react';

export default function Journal() {
  return (
    <>
      {/* page-title */}
      <div className="section-page-title">
        <div className="container text-center">
          <h1 className="page-title fw-semibold effectFade fadeZoom">First Pass</h1>
          <div className="breadcrumbs effectFade fadeUp">
            <a href="#/" className="link1">Home</a>
            <div>/</div>
            <div>Blog</div>
          </div>
        </div>
      </div>
      {/* /page-title */}

      {/* Blog With Sidebar */}
      <section className="section-blog flat-spacing">
        <div className="container">
          <div className="row justify-content-between">
            <div className="col-lg-7">
              <div className="tf-grid-layout">
                <div className="article-blog style-horizontal hover-img effectFade fadeUp no-div">
                  <a href="#/journal" className="blog-image img-style" onClick={(e) => e.preventDefault()}>
                    <img loading="lazy" width="426" height="307" src="asset/images/blog/blog-1.jpg" alt="Image" />
                  </a>
                  <div className="blog-content">
                    <div className="infor">
                      <p className="infor_sub text-secondary">
                        Website Design
                      </p>
                      <h6 className="fw-semibold">
                        <a href="#/journal" className="link1 infor_name" onClick={(e) => e.preventDefault()}>
                          Helve Tica Website Redesign
                        </a>
                      </h6>
                    </div>
                    <a href="#/journal" className="tf-btn-2" onClick={(e) => e.preventDefault()}>
                      Read more
                      <i className="icon icon-arrow-top-right"></i>
                    </a>
                  </div>
                </div>
                <div className="article-blog style-horizontal hover-img effectFade fadeUp no-div">
                  <a href="#/journal" className="blog-image img-style" onClick={(e) => e.preventDefault()}>
                    <img loading="lazy" width="426" height="307" src="asset/images/blog/blog-2.jpg" alt="Image" />
                  </a>
                  <div className="blog-content">
                    <div className="infor">
                      <p className="infor_sub text-secondary">
                        Website Design
                      </p>
                      <h6 className="fw-semibold">
                        <a href="#/journal" className="link1 infor_name" onClick={(e) => e.preventDefault()}>
                          Helve Tica Website Redesign
                        </a>
                      </h6>
                    </div>
                    <a href="#/journal" className="tf-btn-2" onClick={(e) => e.preventDefault()}>
                      Read more
                      <i className="icon icon-arrow-top-right"></i>
                    </a>
                  </div>
                </div>
                <div className="article-blog style-horizontal hover-img effectFade fadeUp no-div">
                  <a href="#/journal" className="blog-image img-style" onClick={(e) => e.preventDefault()}>
                    <img loading="lazy" width="426" height="307" src="asset/images/blog/blog-3.jpg" alt="Image" />
                  </a>
                  <div className="blog-content">
                    <div className="infor">
                      <p className="infor_sub text-secondary">
                        Website Design
                      </p>
                      <h6 className="fw-semibold">
                        <a href="#/journal" className="link1 infor_name" onClick={(e) => e.preventDefault()}>
                          Helve Tica Website Redesign
                        </a>
                      </h6>
                    </div>
                    <a href="#/journal" className="tf-btn-2" onClick={(e) => e.preventDefault()}>
                      Read more
                      <i className="icon icon-arrow-top-right"></i>
                    </a>
                  </div>
                </div>
                <div className="wd-full effectFade fadeUp no-div">
                  <ul className="wg-pagination">
                    <li>
                      <a href="#" className="pagination-item active" onClick={(e) => e.preventDefault()}>1</a>
                    </li>
                    <li>
                      <a href="#" className="pagination-item" onClick={(e) => e.preventDefault()}>2</a>
                    </li>
                    <li>
                      <a href="#" className="pagination-item" onClick={(e) => e.preventDefault()}>...</a>
                    </li>
                    <li>
                      <a href="#" className="pagination-item" onClick={(e) => e.preventDefault()}><i className="icon icon-angle-right-solid"></i></a>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="col-lg-4">
              <div className="blog-sidebar m-lg-0">
                <div className="sidebar-item effectFade fadeUp no-div">
                  <h5 className="sidebar-title">
                    Search
                  </h5>
                  <form className="form-search" onSubmit={(e) => e.preventDefault()}>
                    <fieldset className="text">
                      <input type="text" placeholder="Search" className="" name="search" tabIndex={0} defaultValue="" required />
                    </fieldset>
                    <button type="submit" className="link1 text-white">
                      <i className="icon icon-search-solid"></i>
                    </button>
                  </form>
                </div>
                <div className="sidebar-item effectFade fadeUp no-div">
                  <h5 className="sidebar-title">
                    Recent posts
                  </h5>
                  <div className="list-relatest-post">
                    <div className="relatest-post-item">
                      <div className="image">
                        <img loading="lazy" width="80" height="80" src="asset/images/blog/blog-1.jpg" alt="Recenter" />
                      </div>
                      <div className="content">
                        <h6 className="title text-body-1">
                          <a href="#/journal" className="link1" onClick={(e) => e.preventDefault()}>
                            Helve Tica Website Redesign
                          </a>
                        </h6>
                        <p className="time text-body-3 text-white-64">August 23, 2024</p>
                      </div>
                    </div>
                    <div className="relatest-post-item">
                      <div className="image">
                        <img loading="lazy" width="80" height="80" src="asset/images/blog/blog-2.jpg" alt="Recenter" />
                      </div>
                      <div className="content">
                        <h6 className="title text-body-1">
                          <a href="#/journal" className="link1" onClick={(e) => e.preventDefault()}>
                            X-direct Mobile App
                          </a>
                        </h6>
                        <p className="time text-body-3 text-white-64">August 23, 2024</p>
                      </div>
                    </div>
                    <div className="relatest-post-item">
                      <div className="image">
                        <img loading="lazy" width="80" height="80" src="asset/images/blog/blog-3.jpg" alt="Recenter" />
                      </div>
                      <div className="content">
                        <h6 className="title text-body-1">
                          <a href="#/journal" className="link1" onClick={(e) => e.preventDefault()}>
                            UIXOR Agency Website
                          </a>
                        </h6>
                        <p className="time text-body-3 text-white-64">August 23, 2024</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="sidebar-item effectFade fadeUp no-div">
                  <h5 className="sidebar-title">
                    Category
                  </h5>
                  <div className="sidebar-categories">
                    <div className="item">
                      <a href="#" className="text-body-1 link1" onClick={(e) => e.preventDefault()}>Developer</a>
                      <span className="text-body-3 text-white-64">(4)</span>
                    </div>
                    <div className="item">
                      <a href="#" className="text-body-1 link1" onClick={(e) => e.preventDefault()}>Programmer</a>
                      <span className="text-body-3 text-white-64">(2)</span>
                    </div>
                    <div className="item">
                      <a href="#" className="text-body-1 link1" onClick={(e) => e.preventDefault()}>Web Design</a>
                      <span className="text-body-3 text-white-64">(1)</span>
                    </div>
                  </div>
                </div>
                <div className="sidebar-item effectFade fadeUp no-div">
                  <h5 className="sidebar-title">
                    Popular tag
                  </h5>
                  <div className="list-tags">
                    <a href="#" className="tags-item fw-semibold" onClick={(e) => e.preventDefault()}>Stakeholder</a>
                    <a href="#" className="tags-item fw-semibold" onClick={(e) => e.preventDefault()}>Value model</a>
                    <a href="#" className="tags-item fw-semibold" onClick={(e) => e.preventDefault()}>Data readiness</a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* /Blog With Sidebar */}
    </>
  );
}
