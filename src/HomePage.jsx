import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./HomePage.css";
import { getUserInfo, clearTokens } from "./services/authService";

export default function HomePage() {
    const [userInfo, setUserInfo] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const info = getUserInfo();
        if (info) {
            setUserInfo(info);
        }
    }, []);

    const handleLogout = () => {
        clearTokens();
        navigate("/login");
    };
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
                    <img src="/images/user.png" alt="User" className="home-user-photo" />
                    <h1 className="home-hello">Hi {userInfo?.name || userInfo?.email || "User"}</h1>

                    <p className="home-welcome">
                        Welcome to <strong>BioSSO</strong>.<br />
                        Here you can manage your identity, security<br />
                        and account preferences in one place.
                    </p>

                    <button onClick={handleLogout} className="logout-btn">Logout</button>

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
