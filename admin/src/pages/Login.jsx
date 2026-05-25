import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { Toaster, toast } from "react-hot-toast";

import API from "../api";

import logo from "../assets/img/logo.png";

export default function Login() {

  const [username, setUsername] = useState("");

  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (event) => {

    event.preventDefault();

    try {

      setLoading(true);

      const response = await API.post("login", {
        username,
        password,
      });

      const data = response.data;

      if (data.status === 1) {

        localStorage.setItem(
          "admin_token",
          data.access_token
        );

        localStorage.setItem(
          "admin_data",
          JSON.stringify(data.admin)
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
<Toaster
  position="top-right"
  reverseOrder={false}
  gutter={14}
  containerStyle={{
    top: 20,
    right: 20,
  }}
  toastOptions={{
    duration: 3500,

    style: {
      background:
        "rgba(255,255,255,0.78)",

      backdropFilter: "blur(20px)",

      WebkitBackdropFilter:
        "blur(20px)",

      color: "#1e293b",

      border:
        "1px solid rgba(255,255,255,0.35)",

      borderRadius: "22px",

      padding: "16px 18px",

      fontSize: "14px",

      fontWeight: "600",

      minWidth: "330px",

      boxShadow:
        "0 12px 40px rgba(255, 74, 124, 0.18)",

      letterSpacing: "0.2px",
    },

    success: {
      iconTheme: {
        primary: "#ff4a7c",
        secondary: "#ffffff",
      },

      style: {
        background:
          "linear-gradient(135deg, rgba(255,255,255,0.92), rgba(255,240,246,0.96))",

        border:
          "1px solid rgba(255, 74, 124, 0.18)",
      },
    },

    error: {
      iconTheme: {
        primary: "#ef4444",
        secondary: "#ffffff",
      },

      style: {
        background:
          "linear-gradient(135deg, rgba(255,255,255,0.92), rgba(255,235,235,0.96))",

        border:
          "1px solid rgba(239,68,68,0.18)",
      },
    },

    loading: {
      iconTheme: {
        primary: "#7c3aed",
        secondary: "#ffffff",
      },

      style: {
        background:
          "linear-gradient(135deg, rgba(255,255,255,0.92), rgba(245,240,255,0.96))",

        border:
          "1px solid rgba(124,58,237,0.18)",
      },
    },
  }}
/>

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
                  width: 32,
                  height: 32,
                  objectFit: "contain",
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

            <div className="form-group">

              <input
                type="password"
                id="password"
                className="form-control"
                placeholder=" "
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                required
              />

              <label
                htmlFor="password"
                className="form-label"
              >
                Security Password
              </label>

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