import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { Eye, EyeOff } from "lucide-react";
import { getDashboardPath } from "../context/authRoles";
import { useScrollReveal } from "../hooks/useScrollReveal";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, serviceError } = useAuth();

  useScrollReveal();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const authenticatedUser = await signIn({ email, password });
      navigate(location.state?.redirectTo || getDashboardPath(authenticatedUser.role), { replace: true });
    } catch (submitError) {
      setError(submitError.message);
      setSubmitting(false);
    }
  };

  return (
    <main className="login-page">
      <section className="login-container">

        <div className="login-card">

          <div className="login-header">
            <p className="section-label" data-reveal="fade">
              SV GRAND LUXURY ROOMS
            </p>

            <h1 data-reveal>Welcome Back</h1>

            <p data-reveal="fade">
              Sign in to manage your bookings and
              continue your stay with us. Accounts created
              before shared sign-in was enabled need to be
              registered again here.
            </p>
          </div>

          <form
            className="login-form"
            onSubmit={handleSubmit}
            data-reveal="up"
          >

            <div className="login-field">
              <label>Email Address</label>

              <input
                type="email"
                required
                autoComplete="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="login-field">
              <label>Password</label>

              <div className="login-password-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword((prev) => !prev)}
                  title={showPassword ? "Hide password" : "Show password"}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {(error || serviceError) && (
              <p className="form-error" role="alert">{error || serviceError}</p>
            )}

            <button
              type="submit"
              className="login-submit-btn"
              disabled={submitting}
            >
              {submitting ? "SIGNING IN…" : "SIGN IN →"}
            </button>

          </form>

          {/* DUMMY CREDENTIALS FOR 3 PANELS */}
          <div style={{ marginTop: "24px", paddingTop: "20px", borderTop: "1px solid #e5e7eb" }} data-reveal="up">
            <p style={{ fontSize: "11px", fontWeight: "800", color: "#a67c32", textTransform: "uppercase", letterSpacing: "1px", margin: "0 0 10px 0", textAlign: "center" }}>
              DEMO CREDENTIALS · CLICK TO AUTO-FILL
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <button
                type="button"
                onClick={() => {
                  setEmail("user@svgrand.com");
                  setPassword("Password@123");
                  setError("");
                }}
                style={{
                  padding: "10px 14px",
                  borderRadius: "10px",
                  border: "1px solid #cbd5e1",
                  background: "#f8fafc",
                  cursor: "pointer",
                  textAlign: "left",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  fontSize: "12px",
                }}
              >
                <div>
                  <strong style={{ color: "#1e293b", display: "block" }}>User Panel</strong>
                  <span style={{ color: "#64748b", fontSize: "11px" }}>user@svgrand.com</span>
                </div>
                <span style={{ background: "#e2e8f0", color: "#334155", padding: "3px 8px", borderRadius: "6px", fontSize: "10px", fontWeight: "700" }}>
                  Fill →
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setEmail("hoteladmin@svgrand.com");
                  setPassword("Password@123");
                  setError("");
                }}
                style={{
                  padding: "10px 14px",
                  borderRadius: "10px",
                  border: "1px solid #a7f3d0",
                  background: "#f0fdf4",
                  cursor: "pointer",
                  textAlign: "left",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  fontSize: "12px",
                }}
              >
                <div>
                  <strong style={{ color: "#065f46", display: "block" }}>2. Hotel Admin (Front Desk)</strong>
                  <span style={{ color: "#047857", fontSize: "11px" }}>hoteladmin@svgrand.com</span>
                </div>
                <span style={{ background: "#d1fae5", color: "#065f46", padding: "3px 8px", borderRadius: "6px", fontSize: "10px", fontWeight: "700" }}>
                  Fill →
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setEmail("superadmin@svgrand.com");
                  setPassword("Password@123");
                  setError("");
                }}
                style={{
                  padding: "10px 14px",
                  borderRadius: "10px",
                  border: "1px solid #fecaca",
                  background: "#fef2f2",
                  cursor: "pointer",
                  textAlign: "left",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  fontSize: "12px",
                }}
              >
                <div>
                  <strong style={{ color: "#991b1b", display: "block" }}>3. Super Admin (Owner / Exec)</strong>
                  <span style={{ color: "#b91c1c", fontSize: "11px" }}>superadmin@svgrand.com</span>
                </div>
                <span style={{ background: "#fee2e2", color: "#991b1b", padding: "3px 8px", borderRadius: "6px", fontSize: "10px", fontWeight: "700" }}>
                  Fill →
                </span>
              </button>
            </div>
            <p style={{ textAlign: "center", fontSize: "11px", color: "#94a3b8", marginTop: "8px", marginBottom: "0" }}>
              Common Password: <code>Password@123</code>
            </p>
          </div>

          <div className="login-divider">
            <span>OR</span>
          </div>

          <div className="login-register" data-reveal="fade">
            <p>
              Don't have an account?
            </p>

            <Link to="/register" state={location.state}>
              CREATE ACCOUNT
            </Link>
          </div>

        </div>

      </section>
    </main>
  );
}

export default Login;