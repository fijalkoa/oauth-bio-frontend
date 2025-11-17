import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./signup.css";
import FaceModal from "./components/faceModal/FaceModal"; // import modal

export default function Signup() {
  const [step, setStep] = useState(1);
  const [showFaceModal, setShowFaceModal] = useState(false); // for modal
  const [formData, setFormData] = useState({
    email: "ania@ania",
    dob: "2003-12-18",
    firstName: "ania",
    lastName: "f",
    country: "Poland",
    gender: "female",
    password: "ania",
    repeatPassword: "ania",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleNext = (e) => {
    e.preventDefault();
    if (step === 2) {
      setShowFaceModal(true);
    } else {
      setStep(step + 1);
    }
  };

  const handleBack = () => setStep(step - 1);

  // const handleSubmit = (e) => {
  //   e.preventDefault();
  //   alert("Signup completed!");
  //   setShowFaceModal(false);
  // };

  return (
    <div className="signup-background">
      <div className="logo-container">
        <img src="/images/green-leaf-icon.svg" alt="BioSSO icon" className="logo-icon" />
        <span className="logo-text">BioSSO</span>
      </div>

      <div className="signup-container">

        <h1 className="signup-title">Create your account</h1>

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

            <button type="submit" className="btn btn-next">Next</button>
          </form>
        )}


        {/* Step 2: Password */}
        {step === 2 && (
          <form className="signup-form" onSubmit={handleNext}>
            <p className="password-info">
              We ask you to create a password to secure your account and ensure only you can access your data.
            </p>
            <input type="password" name="password" placeholder="Password" className="form-control" value={formData.password} onChange={handleChange} required />
            <input type="password" name="repeatPassword" placeholder="Repeat Password" className="form-control" value={formData.repeatPassword} onChange={handleChange} required />
            <div className="form-buttons">
              <button type="button" className="btn btn-back" onClick={handleBack}>Back</button>
              <button type="submit" className="btn btn-next">Next</button>
            </div>
          </form>
        )}

        {/* Step 3: Face Setup opens modal */}
        {showFaceModal && (
          <FaceModal
            onClose={() => setShowFaceModal(false)}
            altAction={() => alert("Authenticate with password")}
            title="Set up your Face"
            subtitle="Position your face in the circle"
            altActionLabel="Skip face setup for now"
            mode="register"
          />
        )}

        <div className="mt-3 text-center">
          <Link to="/login" className="small">Already have an account? Log in</Link>
        </div>
      </div>
    </div>
  );
}
