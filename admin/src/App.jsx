import './App.css'
import './assets/css/variables.css'
import './assets/css/reset.css'
import './assets/css/layout.css'
import './assets/css/forms.css'

import logo from './assets/image/logo.png'

function App() {

  const handleLogin = (e) => {

    e.preventDefault();

    window.location.href = "/dashboard";
  };

  return (

    <div className="login-page">

      {/* Background blobs */}
      <div className="deco-blob blob-1"></div>
      <div className="deco-blob blob-2"></div>

      <div className="login-card">

        <div className="login-header">

          <div className="login-logo">

            <img
              src={logo}
              alt="Dealora"
              style={{
                width: "32px",
                height: "32px",
                objectFit: "contain"
              }}
            />

          </div>

          <h1 className="login-title">
            Dealora
          </h1>

          <p className="login-subtitle">
            Enterprise Merchant & Campaign Platform
          </p>

        </div>

        <form onSubmit={handleLogin}>

          <div className="form-group">

            <input
              type="email"
              id="email"
              className="form-control"
              placeholder="Email Address"
              defaultValue="admin@dealora.com"
              required
            />

          </div>

          <div className="form-group">

            <input
              type="password"
              id="password"
              className="form-control"
              placeholder="Password"
              required
            />

          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{
              width: "100%",
              height: "50px",
              fontSize: "0.95rem"
            }}
          >
            Login
          </button>

        </form>

        <div className="login-footer">

          <span>
            Designed & Secured by
            <strong> Minsway Solutions Pvt Ltd</strong>
          </span>

        </div>

      </div>

    </div>
  );
}

export default App;