import React, { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "./password.css";
import { Link } from "react-router-dom";
import FaceModal from "./components/faceModal/FaceModal";

export default function PasswordLogin() {
    const [showFaceModal, setShowFaceModal] = useState(false);
    const [email, setEmail] = useState("");

    return (
        <div className="password-login-container">

            {/* Top-left icon with text */}
            <div className="logo-container">
                <img src="/images/green-leaf-icon.svg" alt="BioSSO icon" className="logo-icon" />
                <span className="logo-text">BioSSO</span>
            </div>

            <div className="login-card">
                <h1>Sign in</h1>
                <p>
                    to continue to <span className="text-success">calendar-app</span>
                </p>

                <form action="/login" method="POST">
                    <input
                        type="text"
                        name="email"
                        className="form-control"
                        placeholder="Email address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />

                    <input
                        type="password"
                        name="password"
                        className="form-control"
                        placeholder="Password"
                        required
                    />

                    {/* "Don't remember password?" right below password input */}
                    <div className="forgot-password">
                        <Link to="/forgot-password" className="forgot-link">
                            Don’t remember password? ↗
                        </Link>
                    </div>

                    <button type="submit" className="btn btn-continue">
                        Continue
                    </button>

                    <hr />

                    {/* Two buttons side by side below Continue */}
                    <div className="extra-buttons">
                        <Link to="/signup" className="btn btn-secondary">
                            Create New Account
                        </Link>
                        <button
                            type="button"
                            className="btn btn-face"
                            onClick={() => {
                                if (!email.trim()) {
                                    alert("Please enter your email address first");
                                    return;
                                }
                                setShowFaceModal(true);
                            }}
                        >
                            Use face option ↗
                        </button>
                    </div>
                </form>
            </div>

            {/* Render FaceModal if visible */}
            {showFaceModal && (
                <FaceModal
                    title="Verify Your Identity"
                    subtitle="Position your face in the circle"
                    onClose={() => setShowFaceModal(false)}
                    altAction={() => setShowFaceModal(false)}
                    altActionLabel="Use password instead"
                    userId={email}
                />
            )}
        </div>
    );
}
