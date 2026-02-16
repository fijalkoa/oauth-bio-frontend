import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./signup.css";
import FaceModal from "./components/faceModal/FaceModal"; // import modal

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8080/api";

export default function Signup() {
  const [step, setStep] = useState(1);
  const [showFaceModal, setShowFaceModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    dob: "",
    firstName: "",
    lastName: "",
    country: "",
    gender: "",
    password: "",
    repeatPassword: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    setError("");
    if (name === "password" || name === "repeatPassword") {
      setPasswordError("");
    }
  };

  // Validate email format
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Validate password strength
  const validatePassword = (password) => {
    if (password.length < 8) {
      return "Password must be at least 8 characters";
    }
    if (!/[A-Z]/.test(password)) {
      return "Password must contain at least one uppercase letter";
    }
    if (!/[a-z]/.test(password)) {
      return "Password must contain at least one lowercase letter";
    }
    if (!/[0-9]/.test(password)) {
      return "Password must contain at least one number";
    }
    return "";
  };

  const handleNext = (e) => {
    e.preventDefault();
    setError("");
    setPasswordError("");

    // Validate step 1
    if (step === 1) {
      if (!validateEmail(formData.email)) {
        setError("Please enter a valid email address");
        return;
      }
      if (!formData.firstName.trim() || !formData.lastName.trim()) {
        setError("First and last name are required");
        return;
      }
      if (!formData.dob) {
        setError("Date of birth is required");
        return;
      }
      if (!formData.country.trim()) {
        setError("Country is required");
        return;
      }
      if (!formData.gender) {
        setError("Gender is required");
        return;
      }
      setStep(2);
    }
    // Validate step 2
    else if (step === 2) {
      const passError = validatePassword(formData.password);
      if (passError) {
        setPasswordError(passError);
        return;
      }

      if (formData.password !== formData.repeatPassword) {
        setPasswordError("Passwords do not match");
        return;
      }

      // Register user with first 2 steps
      registerUser();
    }
  };

  // Register user with email/password and personal info
  const registerUser = async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
          dateOfBirth: formData.dob,
          country: formData.country,
          gender: formData.gender,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Registration failed: ${response.status}`);
      }

      const data = await response.json();
      console.log("✅ User registered:", data);

      // Store user ID for biometric registration
      sessionStorage.setItem("registration_user_id", formData.email);
      sessionStorage.setItem("registration_data", JSON.stringify(formData));

      // Move to face setup modal
      setShowFaceModal(true);
    } catch (err) {
      console.error("Registration error:", err);
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => setStep(step - 1);

  return (
    <div className="signup-background">
      <div className="logo-container">
        <img src="/images/green-leaf-icon.svg" alt="BioSSO icon" className="logo-icon" />
        <span className="logo-text">BioSSO</span>
      </div>

      <div className="signup-container">

        <h1 className="signup-title">Create your account</h1>

        {/* Display error alerts */}
        {error && <div className="alert alert-danger" role="alert">⚠️ {error}</div>}
        {passwordError && <div className="alert alert-danger" role="alert">⚠️ {passwordError}</div>}

        {/* Tabs / Step indicators */}
        <div className="tabs">
          <button className={`tab ${step === 1 ? "active" : ""}`} disabled>1. About You</button>
          <button className={`tab ${step === 2 ? "active" : ""}`} disabled>2. Password</button>
          <button className={`tab ${step === 3 ? "active" : ""}`} disabled>3. Face Setup</button>
        </div>

        {/* Step 1: Personal Info */}
        {step === 1 && (
          <form className="signup-form" onSubmit={handleNext}>
            <div className="form-grid">

              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input type="email" id="email" name="email" placeholder="Email" className="form-control" value={formData.email} onChange={handleChange} required />
              </div>

              <div className="form-group">
                <label htmlFor="dob">Date of Birth</label>
                <input type="date" id="dob" name="dob" className="form-control" value={formData.dob} onChange={handleChange} required />
              </div>

              <div className="form-group">
                <label htmlFor="firstName">First Name</label>
                <input type="text" id="firstName" name="firstName" placeholder="First Name" className="form-control" value={formData.firstName} onChange={handleChange} required />
              </div>

              <div className="form-group">
                <label htmlFor="lastName">Last Name</label>
                <input type="text" id="lastName" name="lastName" placeholder="Last Name" className="form-control" value={formData.lastName} onChange={handleChange} required />
              </div>

              <div className="form-group">
                <label htmlFor="country">Country</label>
                <input type="text" id="country" name="country" placeholder="Country" className="form-control" value={formData.country} onChange={handleChange} required />
              </div>

              <div className="form-group">
                <label htmlFor="gender">Gender</label>
                <select id="gender" name="gender" className="form-control" value={formData.gender} onChange={handleChange} required>
                  <option value="">Select Gender</option>
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                  <option value="other">Other</option>
                </select>
              </div>

            </div>

            <button type="submit" className="btn btn-next" disabled={isLoading}>
              {isLoading ? "Loading..." : "Next"}
            </button>
          </form>
        )}


        {/* Step 2: Password */}
        {step === 2 && (
          <form className="signup-form" onSubmit={handleNext}>
            <p className="password-info">
              We ask you to create a password to secure your account and ensure only you can access your data.
            </p>
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                placeholder="Min. 8 chars, uppercase, lowercase, number"
                className="form-control"
                value={formData.password}
                onChange={handleChange}
                required
              />
              <small className="form-text text-muted">
                Must contain uppercase, lowercase, number, and be at least 8 characters
              </small>
            </div>
            <div className="form-group">
              <label htmlFor="repeatPassword">Repeat Password</label>
              <input
                type="password"
                id="repeatPassword"
                name="repeatPassword"
                placeholder="Repeat Password"
                className="form-control"
                value={formData.repeatPassword}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-buttons">
              <button type="button" className="btn btn-back" onClick={handleBack} disabled={isLoading}>Back</button>
              <button type="submit" className="btn btn-next" disabled={isLoading}>
                {isLoading ? "Creating account..." : "Next"}
              </button>
            </div>
          </form>
        )}

        {/* Step 3: Face Setup opens modal */}
        {showFaceModal && (
          <FaceModal
            onClose={() => {
              setShowFaceModal(false);
              navigate("/home");
            }}
            altAction={() => {
              setShowFaceModal(false);
              navigate("/home");
            }}
            title="Set up your Face"
            altActionLabel="Skip face setup for now"
            mode="register"
            userId={formData.email}
            registrationData={formData}
          />
        )}

        <div className="mt-3 text-center">
          <Link to="/login" className="small">Already have an account? Log in</Link>
        </div>
      </div>
    </div>
  );
}
