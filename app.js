const express = require('express');
const dotenv = require('dotenv');

dotenv.config();

const db = require('./database');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// API Endpoints

// Add a new transaction
app.post('/transactions', (req, res) => {
  const { type, category, amount, date, description } = req.body;
  const query = `INSERT INTO transactions (type, category, amount, date, description) VALUES (?, ?, ?, ?, ?)`;
  
  db.run(query, [type, category, amount, date, description], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ id: this.lastID });
  });
});

// Retrieve all transactions
app.get('/transactions', (req, res) => {
  const query = `SELECT * FROM transactions`;
  
  db.all(query, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ transactions: rows });
  });
});

// Retrieve a specific transaction by ID
app.get('/transactions/:id', (req, res) => {
  const { id } = req.params;
  const query = `SELECT * FROM transactions WHERE id = ?`;

  db.get(query, [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    res.json(row);
  });
});

// Update a transaction by ID
app.put('/transactions/:id', (req, res) => {
  const { id } = req.params;
  const { type, category, amount, date, description } = req.body;
  const query = `UPDATE transactions SET type = ?, category = ?, amount = ?, date = ?, description = ? WHERE id = ?`;

  db.run(query, [type, category, amount, date, description, id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    res.json({ message: 'Transaction updated successfully' });
  });
});

// Delete a transaction by ID
app.delete('/transactions/:id', (req, res) => {
  const { id } = req.params;
  const query = `DELETE FROM transactions WHERE id = ?`;

  db.run(query, [id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    res.json({ message: 'Transaction deleted successfully' });
  });
});

// Get summary of transactions
app.get('/summary', (req, res) => {
  const queryIncome = `SELECT SUM(amount) as total_income FROM transactions WHERE type = 'income'`;
  const queryExpense = `SELECT SUM(amount) as total_expenses FROM transactions WHERE type = 'expense'`;

  db.get(queryIncome, [], (err, incomeRow) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    db.get(queryExpense, [], (err, expenseRow) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      const totalIncome = incomeRow.total_income || 0;
      const totalExpenses = expenseRow.total_expenses || 0;
      const balance = totalIncome - totalExpenses;

      res.json({
        total_income: totalIncome,
        total_expenses: totalExpenses,
        balance: balance,
      });
    });
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
