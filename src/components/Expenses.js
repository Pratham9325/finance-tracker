// src/components/Expenses.js
import React, { useState, useEffect } from 'react';
import { collection, addDoc, query, where, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from '../firebase/config';

function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category: '',
    date: '',
    billFile: null
  });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    const q = query(collection(db, 'expenses'), where('userId', '==', userId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setExpenses(data.sort((a, b) => new Date(b.date) - new Date(a.date)));
    });

    return () => unsubscribe();
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, billFile: file });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);

    try {
      const userId = auth.currentUser?.uid;
      let billUrl = '';

      // Upload bill if provided
      if (formData.billFile) {
        const storageRef = ref(storage, `bills/${userId}/${Date.now()}_${formData.billFile.name}`);
        const snapshot = await uploadBytes(storageRef, formData.billFile);
        billUrl = await getDownloadURL(snapshot.ref);
      }

      // Add expense to Firestore
      await addDoc(collection(db, 'expenses'), {
        userId,
        description: formData.description,
        amount: parseFloat(formData.amount),
        category: formData.category,
        date: formData.date,
        billUrl,
        createdAt: new Date().toISOString()
      });

      // Reset form
      setFormData({
        description: '',
        amount: '',
        category: '',
        date: '',
        billFile: null
      });
      document.getElementById('billInput').value = '';
    } catch (error) {
      console.error('Error adding expense:', error);
      alert('Error adding expense');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      try {
        await deleteDoc(doc(db, 'expenses', id));
      } catch (error) {
        console.error('Error deleting expense:', error);
      }
    }
  };

  const categories = ['Food', 'Transport', 'Shopping', 'Entertainment', 'Bills', 'Healthcare', 'Education', 'Other'];

  return (
    <div className="expenses-container">
      <h1>Expense Tracker</h1>
      
      <div className="expense-form-card">
        <h2>Add New Expense</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <input
              type="text"
              placeholder="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              required
            >
              <option value="">Select Category</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
            />
            <div className="file-input-container">
              <label htmlFor="billInput" className="file-label">
                📎 Upload Bill
              </label>
              <input
                id="billInput"
                type="file"
                accept="image/*,application/pdf"
                onChange={handleFileChange}
                className="file-input"
              />
              {formData.billFile && <span className="file-name">{formData.billFile.name}</span>}
            </div>
          </div>
          <button type="submit" disabled={uploading}>
            {uploading ? 'Adding...' : 'Add Expense'}
          </button>
        </form>
      </div>

      <div className="expenses-list">
        <h2>Recent Expenses</h2>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Category</th>
              <th>Amount</th>
              <th>Bill</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {expenses.map(expense => (
              <tr key={expense.id}>
                <td>{expense.date}</td>
                <td>{expense.description}</td>
                <td>
                  <span className="category-badge">{expense.category}</span>
                </td>
                <td>₹{expense.amount?.toFixed(2)}</td>
                <td>
                  {expense.billUrl && (
                    <a href={expense.billUrl} target="_blank" rel="noopener noreferrer">
                      View Bill
                    </a>
                  )}
                </td>
                <td>
                  <button onClick={() => handleDelete(expense.id)} className="delete-btn">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Expenses;