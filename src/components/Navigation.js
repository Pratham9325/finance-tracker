import React from 'react';
import { Link } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase/config';

function Navigation({ user }) {
  const handleLogout = () => {
    signOut(auth);
  };

  return (
    <nav className="navigation">
      <div className="nav-brand">Finance Tracker</div>
      <div className="nav-links">
        <Link to="/dashboard">Dashboard</Link>
        <Link to="/expenses">Expenses</Link>
        <Link to="/subscriptions">Subscriptions</Link>
        <Link to="/investments">Investments</Link>
      </div>
      <div className="nav-user">
        <span>{user.email}</span>
        <button onClick={handleLogout} className="logout-btn">Logout</button>
      </div>
    </nav>
  );
}

export default Navigation;