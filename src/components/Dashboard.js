import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, startOfMonth, endOfMonth } from 'date-fns';

function Dashboard() {
  const [expenses, setExpenses] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [investments, setInvestments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    // Fetch expenses
    const expensesQuery = query(collection(db, 'expenses'), where('userId', '==', userId));
    const unsubExpenses = onSnapshot(expensesQuery, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setExpenses(data);
    });

    // Fetch subscriptions
    const subscriptionsQuery = query(collection(db, 'subscriptions'), where('userId', '==', userId));
    const unsubSubscriptions = onSnapshot(subscriptionsQuery, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSubscriptions(data);
    });

    // Fetch investments
    const investmentsQuery = query(collection(db, 'investments'), where('userId', '==', userId));
    const unsubInvestments = onSnapshot(investmentsQuery, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setInvestments(data);
      setLoading(false);
    });

    return () => {
      unsubExpenses();
      unsubSubscriptions();
      unsubInvestments();
    };
  }, []);

  // Calculate totals
  const totalExpenses = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0);
  const totalSubscriptions = subscriptions.reduce((sum, sub) => sum + parseFloat(sub.amount || 0), 0);
  const totalInvestments = investments.reduce((sum, inv) => sum + parseFloat(inv.amount || 0), 0);

  // Prepare data for charts
  const categoryData = expenses.reduce((acc, exp) => {
    const category = exp.category || 'Other';
    acc[category] = (acc[category] || 0) + parseFloat(exp.amount || 0);
    return acc;
  }, {});

  const pieData = Object.entries(categoryData).map(([name, value]) => ({
    name,
    value
  }));

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  const monthlyData = [
    { name: 'Expenses', amount: totalExpenses },
    { name: 'Subscriptions', amount: totalSubscriptions },
    { name: 'Investments', amount: totalInvestments }
  ];

  if (loading) return <div className="loading">Loading dashboard...</div>;

  return (
    <div className="dashboard">
      <h1>Financial Dashboard</h1>
      
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Expenses</h3>
          <p className="amount">₹{totalExpenses.toFixed(2)}</p>
          <span className="period">This Month</span>
        </div>
        <div className="stat-card">
          <h3>Active Subscriptions</h3>
          <p className="amount">₹{totalSubscriptions.toFixed(2)}</p>
          <span className="period">Monthly</span>
        </div>
        <div className="stat-card">
          <h3>Total Investments</h3>
          <p className="amount">₹{totalInvestments.toFixed(2)}</p>
          <span className="period">Portfolio</span>
        </div>
        <div className="stat-card">
          <h3>Net Worth</h3>
          <p className="amount">₹{(totalInvestments - totalExpenses - totalSubscriptions).toFixed(2)}</p>
          <span className="period">Current</span>
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-card">
          <h3>Expense Categories</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>Financial Overview</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="amount" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="recent-transactions">
        <h3>Recent Transactions</h3>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Category</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {expenses.slice(0, 5).map(exp => (
              <tr key={exp.id}>
                <td>{exp.date}</td>
                <td>{exp.description}</td>
                <td>{exp.category}</td>
                <td>₹{exp.amount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Dashboard;