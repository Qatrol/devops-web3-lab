const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const pool = new Pool({
  user: process.env.DB_USER, host: process.env.DB_HOST, database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD, port: process.env.DB_PORT,
});

async function initDB() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (id SERIAL PRIMARY KEY, username VARCHAR(50) UNIQUE NOT NULL, password_hash VARCHAR(255) NOT NULL);
      CREATE TABLE IF NOT EXISTS wallets (id SERIAL PRIMARY KEY, user_id INTEGER REFERENCES users(id), address VARCHAR(100) UNIQUE NOT NULL, private_key VARCHAR(255) NOT NULL, balance DECIMAL(18, 2) DEFAULT 0);
      CREATE TABLE IF NOT EXISTS transactions (id SERIAL PRIMARY KEY, sender_address VARCHAR(100), receiver_address VARCHAR(100), amount DECIMAL(18, 2), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);
    `);
    console.log('База данных готова.');
  } catch (err) { console.error('Ошибка БД:', err); }
}
initDB();

// Регистрация
app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  try {
    const hash = await bcrypt.hash(password, 10);
    await pool.query('INSERT INTO users (username, password_hash) VALUES ($1, $2)', [username, hash]);
    res.json({ message: 'Юзер создан!' });
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'Логин занят' });
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Создание кошелька
app.post('/generate-wallet', async (req, res) => {
  const { username } = req.body;
  try {
    const user = await pool.query('SELECT id FROM users WHERE username = $1', [username]);
    if (user.rows.length === 0) return res.status(404).json({ error: 'Юзер не найден' });
    
    const address = '0x' + crypto.randomBytes(20).toString('hex');
    const privateKey = crypto.randomBytes(32).toString('hex');
    
    const existing = await pool.query('SELECT address FROM wallets WHERE user_id = $1', [user.rows[0].id]);
    if (existing.rows.length > 0) {
        return res.json({ message: 'Кошелек уже существует!', address: existing.rows[0].address });
    }

    await pool.query('INSERT INTO wallets (user_id, address, private_key) VALUES ($1, $2, $3)', [user.rows[0].id, address, privateKey]);
    res.json({ message: 'Кошелек создан!', address, privateKey });
  } catch (err) { res.status(500).json({ error: 'Ошибка сервера' }); }
});

// НОВАЯ РУЧКА: Получить адрес кошелька по логину (для входа)
app.get('/wallet-address/:username', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT w.address FROM users u 
      JOIN wallets w ON u.id = w.user_id 
      WHERE u.username = $1
    `, [req.params.username]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Кошелек не найден' });
    res.json({ address: result.rows[0].address });
  } catch (err) { res.status(500).json({ error: 'Ошибка сервера' }); }
});

// Получить баланс
app.get('/wallet/:address', async (req, res) => {
  try {
    const result = await pool.query('SELECT balance FROM wallets WHERE address = $1', [req.params.address]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Кошелек не найден' });
    res.json({ balance: result.rows[0].balance });
  } catch (err) { res.status(500).json({ error: 'Ошибка' }); }
});

// Кран (Faucet)
app.post('/faucet', async (req, res) => {
  const { address } = req.body;
  try {
    const result = await pool.query('UPDATE wallets SET balance = balance + 50 WHERE address = $1 RETURNING balance', [address]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Кошелек не найден' });
    res.json({ message: `Начислено 50 монет. Текущий баланс: ${result.rows[0].balance}` });
  } catch (err) { res.status(500).json({ error: 'Ошибка' }); }
});

// Перевод монет
app.post('/transfer', async (req, res) => {
  const { fromAddress, toAddress, amount } = req.body;
  if (amount <= 0) return res.status(400).json({ error: 'Сумма должна быть больше нуля' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const sender = await client.query('SELECT balance FROM wallets WHERE address = $1 FOR UPDATE', [fromAddress]);
    if (sender.rows.length === 0) throw new Error('Кошелек отправителя не найден');
    if (parseFloat(sender.rows[0].balance) < amount) throw new Error('Недостаточно средств');

    const receiver = await client.query('SELECT id FROM wallets WHERE address = $1', [toAddress]);
    if (receiver.rows.length === 0) throw new Error('Кошелек получателя не найден');

    await client.query('UPDATE wallets SET balance = balance - $1 WHERE address = $2', [amount, fromAddress]);
    await client.query('UPDATE wallets SET balance = balance + $1 WHERE address = $2', [amount, toAddress]);
    await client.query('INSERT INTO transactions (sender_address, receiver_address, amount) VALUES ($1, $2, $3)', [fromAddress, toAddress, amount]);
    await client.query('COMMIT');
    res.json({ message: `Успешно переведено ${amount} монет!` });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(400).json({ error: err.message });
  } finally {
    client.release();
  }
});

app.listen(3001, () => { console.log('API запущено'); });
