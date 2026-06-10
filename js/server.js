const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');

const app = express();

app.use(cors());
app.use(express.json());

let db;

async function startServer() {
    try {
        const dbPath = path.join(__dirname, '..', 'database.sqlite');
        
        db = await open({
            filename: dbPath,
            driver: sqlite3.Database
        });

        console.log('Підключено до бази даних SQLite.');

        await db.exec(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                surname TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL
            )
        `);

        await db.exec(`
            CREATE TABLE IF NOT EXISTS air_quality_records (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                aqi INTEGER NOT NULL,
                pm25 REAL NOT NULL,
                temperature REAL NOT NULL,
                humidity REAL NOT NULL,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);
        
        console.log('Таблиці успішно ініціалізовані.');

        const PORT = 4000;
        app.listen(PORT, () => {
            console.log(`Сервер працює на http://localhost:${PORT}`);
        });

    } catch (error) {
        console.error('Помилка запуску:', error);
    }
}

app.post('/api/register', async (req, res) => {
    const { name, surname, email, password } = req.body;
    try {
        const userExists = await db.get('SELECT * FROM users WHERE email = ?', [email]);
        if (userExists) {
            return res.status(400).json({ error: 'Користувач з таким Email вже існує!' });
        }
        const result = await db.run(
            'INSERT INTO users (name, surname, email, password) VALUES (?, ?, ?, ?)',
            [name, surname, email, password]
        );
        res.status(201).json({ message: 'Успіх', userId: result.lastID });
    } catch (error) {
        res.status(500).json({ error: 'Помилка сервера' });
    }
});

app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await db.get('SELECT * FROM users WHERE email = ? AND password = ?', [email, password]);
        if (!user) {
            return res.status(400).json({ error: 'Невірний email або пароль!' });
        }
        res.json({
            message: 'Успіх',
            user: { id: user.id, name: user.name, surname: user.surname, email: user.email }
        });
    } catch (error) {
        res.status(500).json({ error: 'Помилка сервера' });
    }
});

app.post('/api/records', async (req, res) => {
    const { user_id, aqi, pm25, temperature, humidity } = req.body;
    try {
        await db.run(
            'INSERT INTO air_quality_records (user_id, aqi, pm25, temperature, humidity) VALUES (?, ?, ?, ?, ?)',
            [user_id, aqi, pm25, temperature, humidity]
        );
        res.status(201).json({ message: 'Збережено!' });
    } catch (error) {
        res.status(500).json({ error: 'Помилка запису в БД' });
    }
});

app.get('/api/records/:userId', async (req, res) => {
    const userId = req.params.userId;
    try {
        const records = await db.all(
            'SELECT * FROM air_quality_records WHERE user_id = ? ORDER BY timestamp DESC LIMIT 5',
            [userId]
        );
        res.json(records);
    } catch (error) {
        res.status(500).json({ error: 'Помилка читання з БД' });
    }
});

startServer();