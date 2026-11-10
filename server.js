
/* ==========================================
   DRIVEWISE - SERVIDOR BACKEND
   Node.js + Express + MySQL
========================================== */


// ==========================================
// 1. IMPORTAÇÃO DAS DEPENDÊNCIAS
// ==========================================

require('dotenv').config();

const express = require('express');
const mysql = require('mysql2/promise');
const path = require('path');

const app = express();


// ==========================================
// 2. CONEXÃO COM O BANCO DE DADOS
// ==========================================

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'drivewise',

    waitForConnections: true,
    connectionLimit: 10,
    decimalNumbers: true,
    dateStrings: true
});


// ==========================================
// 3. CONFIGURAÇÃO DO EXPRESS
// ==========================================

// Permitir recebimento de dados JSON
app.use(express.json({
    limit: '20kb'
}));

// Disponibilizar arquivos HTML, CSS e JS
app.use(
    express.static(path.join(__dirname, 'public'))
);


// ==========================================
// 4. FUNÇÕES AUXILIARES
// ==========================================

// Capturar erros em funções assíncronas
const wrap = fn => (req, res, next) =>
    Promise.resolve(fn(req, res)).catch(next);


// Validar valores monetários e numéricos
const money = x =>
    Number.isFinite(Number(x)) &&
    Number(x) >= 0 &&
    Number(x) <= 10000000;


// Validar formato de data
const dateOK = s =>
    /^\d{4}-\d{2}-\d{2}$/.test(s) &&
    !Number.isNaN(Date.parse(s + 'T12:00:00Z'));


// ==========================================
// 5. VERIFICAR CONEXÃO COM A API
// ==========================================

app.get('/api/health', wrap(async (req, res) => {

    await pool.query('SELECT 1');

    res.json({
        ok: true
    });

}));


// ==========================================
// 6. CONSULTAR VEÍCULO CADASTRADO
// ==========================================

app.get('/api/vehicle', wrap(async (req, res) => {

    const [rows] = await pool.query(
        'SELECT * FROM vehicles ORDER BY id DESC LIMIT 1'
    );

    res.json(rows[0] || null);

}));


// ==========================================
// 7. CADASTRAR VEÍCULO
// ==========================================

app.post('/api/vehicle', wrap(async (req, res) => {

    const {
        name,
        ownership,
        weekly_rent = 0,
        fuel_type
    } = req.body;

    // Validar informações do veículo
    if (
        !name ||
        String(name).length > 100 ||
        !['proprio', 'alugado'].includes(ownership) ||
        !money(weekly_rent) ||
        !fuel_type ||
        String(fuel_type).length > 40
    ) {
        return res.status(400).json({
            error: 'Dados do veículo inválidos.'
        });
    }

    // Inserir veículo no banco de dados
    const [r] = await pool.execute(
        `INSERT INTO vehicles
            (name, ownership, weekly_rent, fuel_type)
         VALUES (?, ?, ?, ?)`,
        [
            name,
            ownership,
            ownership === 'alugado' ? weekly_rent : 0,
            fuel_type
        ]
    );

    res.status(201).json({
        id: r.insertId
    });

}));


// ==========================================
// 8. CONSULTAR LANÇAMENTOS FINANCEIROS
// ==========================================

app.get('/api/entries', wrap(async (req, res) => {

    const day = req.query.date;

    // Validar data informada
    if (day && !dateOK(day)) {
        return res.status(400).json({
            error: 'Data inválida.'
        });
    }

    // Consultar lançamentos por data
    const [rows] = day
        ? await pool.execute(
            `SELECT *
             FROM entries
             WHERE entry_date = ?
             ORDER BY id DESC`,
            [day]
        )
        : await pool.query(
            `SELECT *
             FROM entries
             ORDER BY entry_date DESC, id DESC
             LIMIT 100`
        );

    res.json(rows);

}));


// ==========================================
// 9. CADASTRAR LANÇAMENTO FINANCEIRO
// ==========================================

app.post('/api/entries', wrap(async (req, res) => {

    const {
        entry_date,
        kind,
        amount,
        kilometers = 0,
        hours_worked = 0,
        description = ''
    } = req.body;

    // Validar informações do lançamento
    if (
        !dateOK(entry_date) ||
        ![
            'ganho',
            'combustivel',
            'aluguel',
            'manutencao',
            'multa',
            'outros'
        ].includes(kind) ||
        !money(amount) ||
        !money(kilometers) ||
        !money(hours_worked) ||
        Number(hours_worked) > 24 ||
        String(description).length > 255
    ) {
        return res.status(400).json({
            error: 'Dados do lançamento inválidos.'
        });
    }

    // Inserir lançamento no banco de dados
    const [r] = await pool.execute(
        `INSERT INTO entries
            (
                entry_date,
                kind,
                amount,
                kilometers,
                hours_worked,
                description
            )
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
            entry_date,
            kind,
            amount,
            kilometers,
            hours_worked,
            description
        ]
    );

    res.status(201).json({
        id: r.insertId
    });

}));


// ==========================================
// 10. EXCLUIR LANÇAMENTO FINANCEIRO
// ==========================================

app.delete('/api/entries/:id', wrap(async (req, res) => {

    // Validar ID
    if (!/^\d+$/.test(req.params.id)) {
        return res.status(400).json({
            error: 'ID inválido.'
        });
    }

    // Excluir lançamento
    const [r] = await pool.execute(
        'DELETE FROM entries WHERE id = ?',
        [req.params.id]
    );

    res.json({
        deleted: r.affectedRows
    });

}));


// ==========================================
// 11. CONSULTAR CONFIGURAÇÕES
// ==========================================

app.get('/api/settings', wrap(async (req, res) => {

    const [rows] = await pool.query(
        `SELECT
            daily_goal,
            minimum_per_km
         FROM settings
         WHERE id = 1`
    );

    res.json(rows[0]);

}));


// ==========================================
// 12. ATUALIZAR CONFIGURAÇÕES
// ==========================================

app.put('/api/settings', wrap(async (req, res) => {

    const {
        daily_goal,
        minimum_per_km
    } = req.body;

    // Validar valores
    if (
        !money(daily_goal) ||
        !money(minimum_per_km) ||
        Number(minimum_per_km) === 0
    ) {
        return res.status(400).json({
            error: 'Valores inválidos.'
        });
    }

    // Atualizar configurações no banco
    await pool.execute(
        `UPDATE settings
         SET
            daily_goal = ?,
            minimum_per_km = ?
         WHERE id = 1`,
        [
            daily_goal,
            minimum_per_km
        ]
    );

    res.json({
        ok: true
    });

}));


// ==========================================
// 13. RESUMO FINANCEIRO DO DIA
// ==========================================

app.get('/api/summary', wrap(async (req, res) => {

    const date = req.query.date;

    // Validar data
    if (!dateOK(date)) {
        return res.status(400).json({
            error: 'Data inválida.'
        });
    }

    // Consultar lançamentos agrupados por tipo
    const [rows] = await pool.execute(
        `SELECT
            kind,
            SUM(amount) AS total,
            SUM(kilometers) AS km,
            SUM(hours_worked) AS hours
         FROM entries
         WHERE entry_date = ?
         GROUP BY kind`,
        [date]
    );

    // Organizar valores por categoria
    const by = Object.fromEntries(
        rows.map(r => [r.kind, r.total])
    );

    // Calcular ganhos
    const revenue = by.ganho || 0;

    // Calcular despesas
    const expenses = rows
        .filter(r => r.kind !== 'ganho')
        .reduce((s, r) => s + r.total, 0);

    // Calcular quilômetros registrados
    const km = rows.reduce(
        (s, r) => s + r.km,
        0
    );

    // Calcular horas trabalhadas
    const hours = rows.reduce(
        (s, r) => s + r.hours,
        0
    );

    // Retornar resumo financeiro
    res.json({
        revenue,
        expenses,
        profit: revenue - expenses,
        km,
        hours,
        perHour: hours
            ? (revenue - expenses) / hours
            : 0
    });

}));


// ==========================================
// 14. TRATAMENTO DE ROTAS NÃO ENCONTRADAS
// ==========================================

app.use('/api', (req, res) => {

    res.status(404).json({
        error: 'Rota não encontrada.'
    });

});


// ==========================================
// 15. TRATAMENTO DE ERROS DO SERVIDOR
// ==========================================

app.use((err, req, res, next) => {

    console.error(err);

    res.status(500).json({
        error: 'Erro interno. Confira a conexão com o MySQL.'
    });

});


// ==========================================
// 16. INICIALIZAÇÃO DO SERVIDOR
// ==========================================

const port = Number(process.env.PORT || 3000);

if (require.main === module) {

    app.listen(port, () => {
        console.log(
            `DriveWise: http://localhost:${port}`
        );
    });

}

// Exportar aplicação para testes
module.exports = app;
