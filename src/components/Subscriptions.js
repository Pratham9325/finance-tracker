// src/components/Subscriptions.js
import React, { useState, useEffect } from 'react';
import { collection, addDoc, query, where, onSnapshot, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';

function Subscriptions() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    frequency: 'monthly',
    nextBilling: '',
    category: '',
    active: true
  });

  useEffect(() => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    const q = query(collection(db, 'subscriptions'), where('userId', '==', userId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSubscriptions(data);
    });

    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const userId = auth.currentUser?.uid;
      await addDoc(collection(db, 'subscriptions'), {
        userId,
        ...formData,
        amount: parseFloat(formData.amount),
        createdAt: new Date().toISOString()
      });

      setFormData({
        name: '',
        amount: '',
        frequency: 'monthly',
        nextBilling: '',
        category: '',
        active: true
      });
    } catch (error) {
      console.error('Error adding subscription:', error);
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    try {
      await updateDoc(doc(db, 'subscriptions', id), {
        active: !currentStatus
      });
    } catch (error) {
      console.error('Error updating subscription:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this subscription?')) {
      try {
        await deleteDoc(doc(db, 'subscriptions', id));
      } catch (error) {
        console.error('Error deleting subscription:', error);
      }
    }
  };

  const categories = ['Entertainment', 'Software', 'Education', 'Health', 'News', 'Other'];

  return (
    <div className="subscriptions-container">
      <h1>Subscription Manager</h1>
      
      <div className="subscription-form-card">
        <h2>Add New Subscription</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <input
              type="text"
              placeholder="Subscription Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <input
              type="number"
              step="0.01"
              placeholder="Amount"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              required
            />
            <select
              value={formData.frequency}
              onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
            >
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
              <option value="weekly">Weekly</option>
            </select>
            <input
              type="date"
              placeholder="Next Billing Date"
              value={formData.nextBilling}
              onChange={(e) => setFormData({ ...formData, nextBilling: e.target.value })}
              required
            />
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              required
            >
              <option value="">Select Category</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <button type="submit">Add Subscription</button>
        </form>
      </div>

      <div className="subscriptions-grid">
        {subscriptions.map(sub => (
          <div key={sub.id} className={`subscription-card ${!sub.active ? 'inactive' : ''}`}>
            <div className="sub-header">
              <h3>{sub.name}</h3>
              <span className={`status ${sub.active ? 'active' : 'paused'}`}>
                {sub.active ? 'Active' : 'Paused'}
              </span>
            </div>
            <div className="sub-details">
              <p><strong>Amount:</strong> ₹{sub.amount}/{sub.frequency}</p>
              <p><strong>Category:</strong> {sub.category}</p>
              <p><strong>Next Billing:</strong> {sub.nextBilling}</p>
            </div>
            <div className="sub-actions">
              <button onClick={() => toggleStatus(sub.id, sub.active)} className="toggle-btn">
                {sub.active ? 'Pause' : 'Resume'}
              </button>
              <button onClick={() => handleDelete(sub.id)} className="delete-btn">
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Subscriptions;