import React from "react";
import "./HomePage.css";

export default function HomePage({ name = "User", photo = "/images/user.png" }) {
    return (
        <div className="home-bg">

            {/* BioSSO logo top-left */}
            <div className="logo-container">
                <img src="/images/green-leaf-icon.svg" alt="BioSSO icon" className="logo-icon" />
                <span className="logo-text">BioSSO</span>
            </div>

            <div className="home-card">

                {/* LEFT SIDE */}
                <div className="home-left">
                    <img src={photo} alt="User" className="home-user-photo" />
                    <h1 className="home-hello">Hi {name}</h1>

                    <p className="home-welcome">
                        Welcome to <strong>BioSSO</strong>.<br />
                        Here you can manage your identity, security<br />
                        and account preferences in one place.
                    </p>

                    <a href="/login" className="logout-btn">Already leaving? Logout</a>

                </div>

                {/* DIVIDER */}
                <div className="home-divider" />

                {/* RIGHT SIDE */}
                <div className="home-right">
                    <h2 className="home-title">Manage your account settings</h2>

                    <div className="home-actions">
                        <button className="green-btn"><span>Reset password</span><span className="arrow">↗</span></button>
                        <button className="green-btn"><span>Delete account</span><span className="arrow">↗</span></button>
                        <button className="green-btn"><span>Manage connections</span><span className="arrow">↗</span></button>
                        <button className="green-btn"><span>Upload profile photo</span><span className="arrow">↗</span></button>
                        <button className="green-btn"><span>Update my data</span><span className="arrow">↗</span></button>
                        <button className="green-btn"><span>Biometric preferences</span><span className="arrow">↗</span></button>
                    </div>

                </div>

            </div>
        </div>
    );
}
