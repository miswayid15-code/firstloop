import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { toast } from "react-hot-toast";

import API from '../../api.js';

import logo from "../../assets/img/logo.png";

export default function Login() {

  const [username, setUsername] = useState("");

  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);

  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();
  useEffect(() => {

    const token =
      localStorage.getItem("access_token") ||
      localStorage.getItem("admin_token");

    if (token === "null" || token === "undefined") {
      localStorage.removeItem("access_token");
      localStorage.removeItem("admin_token");
      return;
    }

    if (token) {
      navigate("/dashboard");
    }

  }, [navigate]);

  const handleSubmit = async (event) => {

    event.preventDefault();

    try {

      setLoading(true);

      const response = await API.post("admin/login", {
        username,
        password,
      });

      const data = response.data;

      if (data.status === 1) {

        localStorage.setItem(
          "access_token",
          data.access_token
        );
        localStorage.setItem(
          "refresh_token",
          data.refresh_token
        );

        localStorage.setItem(
          "admin_data",
          JSON.stringify(data.data)
        );
         sessionStorage.setItem(
           "role",
           "firstpass"
         );
         localStorage.setItem(
           "role",
           "firstpass"
         );

        toast.success("Login Success 🚀");

        setTimeout(() => {
          navigate("/dashboard");
        }, 1000);

      } else {

        toast.error(data.message);

      }

    } catch (error) {

      console.log(error);

      toast.error("Login Failed");

    } finally {

      setLoading(false);

    }

  };

  return (
    <>
      {/* Custom Toaster */}

      <div className="login-page">

        <div className="deco-blob blob-1" />

        <div className="deco-blob blob-2" />

        <div className="login-card">

          <div className="login-header">

            <div className="login-logo">
              <img
                src={logo}
                alt="Logo"
                style={{
                  width: 90,
                  height: 90,
                  // objectFit: "contain",
                }}
              />
            </div>

            {/* <h1 className="login-title">
              First Pass
            </h1> */}

            <p className="login-subtitle">
              Enterprise Merchant & Campaign Platform
            </p>

          </div>

          <form onSubmit={handleSubmit}>

            <div className="form-group">

              <input
                type="text"
                id="username"
                className="form-control"
                placeholder=" "
                value={username}
                onChange={(event) =>
                  setUsername(event.target.value)
                }
                required
              />

              <label
                htmlFor="username"
                className="form-label"
              >
                Username
              </label>

            </div>

            <div className="form-group" style={{ position: 'relative' }}>

              <input
                type={showPassword ? "text" : "password"}
                id="password"
                className="form-control"
                placeholder=" "
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                required
                style={{ paddingRight: '40px' }}
              />

              <label
                htmlFor="password"
                className="form-label"
              >
                Security Password
              </label>

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-secondary)',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 10
                }}
              >
                <i className={showPassword ? "fas fa-eye-slash" : "fas fa-eye"}></i>
              </button>

            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{
                width: "100%",
                height: 50,
                fontSize: "0.95rem",
              }}
            >
              {loading
                ? "Please Wait..."
                : "Login"}

              <i
                className="fas fa-arrow-right"
                style={{
                  marginLeft: 4,
                }}
              />

            </button>

          </form>

          <div className="login-footer">
            <span>
              &copy; 2026 Minsway Solutions Pvt Ltd
            </span>
          </div>

        </div>

      </div>
    </>
  );
}
