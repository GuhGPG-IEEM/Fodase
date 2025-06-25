const express = require('express');
const cors = require('cors');
const db = require('./database.js');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = 3000;
const JWT_SECRET = 'sua-chave-secreta-super-dificil-de-adivinhar';

app.use(cors());
app.use(express.json());

// --- MIDDLEWARES DE AUTENTICAÇÃO ---
const authenticateUser = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) return res.status(401).json({ error: "Token não fornecido." });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: "Token inválido." });
        req.user = user;
        next();
    });
};

const authenticateAndAuthorizeAdmin = (req, res, next) => {
    authenticateUser(req, res, () => {
        if (req.user.role !== 'ADMIN') {
            return res.status(403).json({ error: "Acesso proibido: rota exclusiva para administradores." });
        }
        next();
    });
};

// --- ROTAS DE AUTENTICAÇÃO ---
app.post('/api/auth/registro', (req, res) => {
    const { email, senha } = req.body;
    if (!email || !senha) return res.status(400).json({ error: "Email e senha são obrigatórios." });
    
    const hashDaSenha = bcrypt.hashSync(senha, 10);
    const sql = 'INSERT INTO usuarios (email, senha, role) VALUES (?, ?, ?)';
    db.run(sql, [email, hashDaSenha, 'CONVIDADO'], function (err) {
        if (err) {
            if (err.message.includes("UNIQUE constraint failed")) return res.status(409).json({ "error": "Este email já está cadastrado." });
            return res.status(500).json({ "error": err.message });
        }
        res.status(201).json({ message: "Usuário registrado com sucesso!", userId: this.lastID });
    });
});

app.post('/api/auth/login', (req, res) => {
    const { email, senha } = req.body;
    const sql = "SELECT * FROM usuarios WHERE email = ?";
    db.get(sql, [email], (err, user) => {
        if (err) return res.status(500).json({ "error": err.message });
        if (!user) return res.status(401).json({ error: "Credenciais inválidas." });
        
        const senhaValida = bcrypt.compareSync(senha, user.senha);
        if (!senhaValida) return res.status(401).json({ error: "Credenciais inválidas." });

        const payload = { id: user.id, email: user.email, role: user.role };
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '3h' });
        res.json({ message: "Login bem-sucedido!", token: token });
    });
});

// --- ROTAS DE PRODUTOS ---
app.get('/api/produtos', (req, res) => {
    const sql = "SELECT * FROM produtos";
    db.all(sql, [], (err, rows) => {
        if (err) return res.status(400).json({ "error": err.message });
        res.json(rows);
    });
});

app.post('/api/produtos', authenticateAndAuthorizeAdmin, (req, res) => {
    const { nome, descricao, preco, imagem_url } = req.body;
    if (!nome) return res.status(400).json({ "error": "O campo 'nome' é obrigatório." });
    
    const sql = 'INSERT INTO produtos (nome, descricao, preco, imagem_url) VALUES (?, ?, ?, ?)';
    db.run(sql, [nome, descricao, preco, imagem_url], function (err) {
        if (err) return res.status(400).json({ "error": err.message });
        res.status(201).json({ "id": this.lastID });
    });
});

app.put('/api/produtos/:id', authenticateAndAuthorizeAdmin, (req, res) => {
    const { id } = req.params;
    const { nome, descricao, preco, imagem_url } = req.body;
    if (!nome) return res.status(400).json({ "error": "O campo 'nome' é obrigatório." });

    const sql = 'UPDATE produtos SET nome = ?, descricao = ?, preco = ?, imagem_url = ? WHERE id = ?';
    db.run(sql, [nome, descricao, preco, imagem_url, id], function (err) {
        if (err) return res.status(400).json({ "error": err.message });
        if (this.changes === 0) return res.status(404).json({ message: `Produto com id ${id} não encontrado.` });
        res.json({ message: `Produto com id ${id} atualizado com sucesso.` });
    });
});

app.delete('/api/produtos/:id', authenticateAndAuthorizeAdmin, (req, res) => {
    const { id } = req.params;
    const sql = 'DELETE FROM produtos WHERE id = ?';
    db.run(sql, id, function (err) {
        if (err) return res.status(400).json({ "error": res.message });
        if (this.changes === 0) return res.status(404).json({ "message": `Produto com id ${id} não encontrado.` });
        res.json({ "message": `Produto com id ${id} excluído com sucesso.` });
    });
});

// --- ROTAS DO CARRINHO ---
app.get('/api/carrinho', authenticateUser, (req, res) => {
    const usuarioId = req.user.id;
    
    // **** CORREÇÃO APLICADA AQUI ****
    const sql = `
        SELECT p.id, p.nome, p.descricao, p.preco, ci.quantidade 
        FROM carrinho_itens ci
        JOIN produtos p ON ci.produto_id = p.id
        WHERE ci.usuario_id = ?
    `;
    
    db.all(sql, [usuarioId], (err, rows) => {
        if (err) return res.status(500).json({ "error": err.message });
        res.json(rows);
    });
});

app.post('/api/carrinho', authenticateUser, (req, res) => {
    const usuarioId = req.user.id;
    const { produtoId, quantidade } = req.body;
    const checkSql = 'SELECT * FROM carrinho_itens WHERE usuario_id = ? AND produto_id = ?';
    db.get(checkSql, [usuarioId, produtoId], (err, row) => {
        if (err) return res.status(500).json({ "error": err.message });
        if (row) {
            const newQuantity = row.quantidade + quantidade;
            const updateSql = 'UPDATE carrinho_itens SET quantidade = ? WHERE id = ?';
            db.run(updateSql, [newQuantity, row.id], (err) => {
                if (err) return res.status(500).json({ "error": err.message });
                res.json({ message: "Quantidade do produto atualizada no carrinho." });
            });
        } else {
            const insertSql = 'INSERT INTO carrinho_itens (usuario_id, produto_id, quantidade) VALUES (?, ?, ?)';
            db.run(insertSql, [usuarioId, produtoId, quantidade], (err) => {
                if (err) return res.status(500).json({ "error": err.message });
                res.status(201).json({ message: "Produto adicionado ao carrinho." });
            });
        }
    });
});

app.put('/api/carrinho/item', authenticateUser, (req, res) => {
    const usuarioId = req.user.id;
    const { produtoId, quantidade } = req.body;
    if (quantidade <= 0) {
        const deleteSql = 'DELETE FROM carrinho_itens WHERE usuario_id = ? AND produto_id = ?';
        db.run(deleteSql, [usuarioId, produtoId], (err) => {
            if (err) return res.status(500).json({ "error": err.message });
            res.json({ message: "Produto removido do carrinho." });
        });
    } else {
        const updateSql = 'UPDATE carrinho_itens SET quantidade = ? WHERE usuario_id = ? AND produto_id = ?';
        db.run(updateSql, [quantidade, usuarioId, produtoId], function (err) {
            if (err) return res.status(500).json({ "error": err.message });
            if (this.changes === 0) return res.status(404).json({ message: "Produto não encontrado no carrinho." });
            res.json({ message: "Quantidade atualizada." });
        });
    }
});

app.delete('/api/carrinho/:produtoId', authenticateUser, (req, res) => {
    const usuarioId = req.user.id;
    const { produtoId } = req.params;
    const sql = 'DELETE FROM carrinho_itens WHERE usuario_id = ? AND produto_id = ?';
    db.run(sql, [usuarioId, produtoId], function(err) {
        if (err) return res.status(500).json({ "error": err.message });
        if (this.changes === 0) return res.status(404).json({ message: "Produto não encontrado no carrinho." });
        res.json({ message: "Produto removido do carrinho." });
    });
});

// Inicia o servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta http://localhost:${PORT}`);
});