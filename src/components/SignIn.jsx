import React, { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from "../Database";
import { get, ref, update } from 'firebase/database';
import { v4 as uuid } from 'uuid';
import { useLoaderContext } from '../contexts/loader';
import { usePopUpContext } from '../contexts/Popup';
import { useUserContext } from '../contexts/user';
import { useNavigate } from 'react-router-dom';

const AuthPage = () => {
    const navigate = useNavigate();
    const [isSignUp, setIsSignUp] = useState(false);
    const [activeUser, setActiveUser] = useState("student");
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: ''
    });

    const { setIsLoading } = useLoaderContext();
    const { setMessageContent } = usePopUpContext();
    const { setUser, setUserInfo } = useUserContext();

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (isSignUp) {
            setIsLoading(prev => prev + 1);
            createUserWithEmailAndPassword(auth, formData.email, formData.password).then(() => {
                get(ref(db, "users")).then(snapShot => {
                    const users = snapShot.val() || [];
                    const newUser = {
                        username: formData.username,
                        email: formData.email,
                        id: uuid(),
                        createdAt: new Date(),
                        role: activeUser,
                    }
                    users.push(newUser);
                    update(ref(db), {
                        users: users,
                    }).then(() => {
                        setIsLoading(prev => prev !== 0 ? prev - 1 : prev);
                        localStorage.setItem("user", newUser.id);
                        setUser(newUser.id);
                        setUserInfo(newUser);
                        navigate("/home");
                    }).catch(() => {
                        setIsLoading(prev => prev !== 0 ? prev - 1 : prev);
                        setMessageContent({ title: "Signing up error", message: "Oops! something went wrong while creating your account.", });
                    })
                }).catch(err => {
                    setIsLoading(prev => prev !== 0 ? prev - 1 : prev);
                    setMessageContent({ title: "Signing up error", message: "Oops! something went wrong while creating your account.", });
                })
            }).catch(err => {
                setIsLoading(prev => prev !== 0 ? prev - 1 : prev);
                setMessageContent({ title: "Signing up error", message: "Oops! something went wrong while creating your account.", });
            })
        } else {
            setIsLoading(prev => prev + 1);
            signInWithEmailAndPassword(auth, formData.email, formData.password)
                .then(() => {
                    get(ref(db, "users")).then(snapShot => {
                        const users = snapShot.val();
                        const user = users.find(user => user.email === formData.email);
                        setUser(user.id);
                        setUserInfo(user);
                        localStorage.setItem("user", user.id);
                        navigate("/home");
                        setIsLoading(prev => prev !== 0 ? prev - 1 : prev);
                    }).catch(err => {
                        setMessageContent({ title: "Oops! something went wrong while fetching you data.", });
                        setIsLoading(prev => prev !== 0 ? prev - 1 : prev);
                    })
                }).catch(err => {
                    if (err.code === "auth/invalid-credential" || err.code === "auth/wrong-password") {
                        setMessageContent({ title: "Signing in error", message: "Invalid email or password", });
                    } else {
                        setMessageContent({ title: "Oops! something went wrong while fetching you data.", });
                    }
                    setIsLoading(prev => prev !== 0 ? prev - 1 : prev);
                })
        }
    };

    const toggleMode = () => {
        setIsSignUp(!isSignUp);
        setFormData({
            username: '',
            email: '',
            password: ''
        });
    };

    return (
        <div className="auth-container">
            <div className="auth-box">
                <div className="header">
                    <h1 className="logo">Quiz Battle</h1>
                    <p className="subtitle">Solve tests from teachers</p>
                </div>

                <div className="tab-container">
                    <button
                        className={`tab ${!isSignUp ? 'active' : ''}`}
                        onClick={() => !isSignUp || toggleMode()}
                    >
                        Sign In
                    </button>
                    <button
                        className={`tab ${isSignUp ? 'active' : ''}`}
                        onClick={() => isSignUp || toggleMode()}
                    >
                        Sign Up
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="form">
                    {isSignUp && (
                        <div className="input-group">
                            <label className="label">Username</label>
                            <input
                                type="text"
                                name="username"
                                value={formData.username}
                                onChange={handleInputChange}
                                className="input"
                                placeholder="Enter your username"
                                required
                            />
                        </div>
                    )}

                    <div className="input-group">
                        <label className="label">Email</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            className="input"
                            placeholder="Enter your email"
                            required
                        />
                    </div>

                    <div className="input-group">
                        <label className="label">Password</label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleInputChange}
                            className="input"
                            placeholder="Enter your password"
                            required
                        />
                    </div>

                    {
                        isSignUp ?
                            <div className="buttons">
                                <button type="button" onClick={() => setActiveUser("student")} className={activeUser === "student" ? "active" : ""}>Student</button>
                                <button type="button" onClick={() => setActiveUser("teacher")} className={activeUser === "teacher" ? "active" : ""}>Teacher</button>
                            </div> : undefined
                    }

                    <button type="submit" className="submit-button">
                        {isSignUp ? 'Create Account' : 'Sign In'}
                    </button>
                </form>

                <div className="footer">
                    <p className="footer-text">
                        {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
                        <button onClick={toggleMode} className="link-button">
                            {isSignUp ? 'Sign In' : 'Sign Up'}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AuthPage;