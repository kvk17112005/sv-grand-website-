import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { Eye, EyeOff } from "lucide-react";
import { getDashboardPath } from "../context/authRoles";
import { useScrollReveal } from "../hooks/useScrollReveal";

function Register() {
  const navigate = useNavigate();
  const location = useLocation();
  const { register } = useAuth();

  useScrollReveal();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setError("");
    setSubmitting(true);

    try {
      const authenticatedUser = await register({ name, email, phone, password });
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

            <h1 data-reveal>Create Account</h1>

            <p data-reveal="fade">
              Create your account to manage your
              bookings and reservations.
            </p>
          </div>

          <form
            className="login-form"
            onSubmit={handleSubmit}
            data-reveal="up"
          >

            <div className="login-field">
              <label>Full Name</label>

              <input
                type="text"
                required
                autoComplete="name"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

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
              <label>Phone Number</label>

              <input
                type="tel"
                required
                autoComplete="tel"
                placeholder="Enter your phone number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <div className="login-field">
              <label>Password</label>

              <div className="login-password-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="new-password"
                  placeholder="Create a password"
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

            <div className="login-field">
              <label>Confirm Password</label>

              <div className="login-password-wrapper">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  autoComplete="new-password"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) =>
                    setConfirmPassword(e.target.value)
                  }
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  title={showConfirmPassword ? "Hide password" : "Show password"}
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && <p className="form-error" role="alert">{error}</p>}

            <button
              type="submit"
              className="login-submit-btn"
              disabled={submitting}
            >
              {submitting ? "CREATING ACCOUNT…" : "CREATE ACCOUNT →"}
            </button>

          </form>

          <div className="login-divider">
            <span>OR</span>
          </div>

          <div className="login-register" data-reveal="fade">
            <p>
              Already have an account?
            </p>

            <Link to="/login" state={location.state}>
              SIGN IN
            </Link>
          </div>

        </div>
      </section>
    </main>
  );
}

export default Register;