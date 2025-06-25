const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const DB_SOURCE = 'db.sqlite';
const db = new sqlite3.Database(DB_SOURCE, (err) => {
    if (err) {
        console.error(err.message);
        throw err;
    } else {
        console.log('Conectado ao banco de dados SQLite.');
        db.serialize(() => {
            db.run('PRAGMA foreign_keys = ON;');

            db.run(`CREATE TABLE IF NOT EXISTS produtos (id INTEGER PRIMARY KEY AUTOINCREMENT, nome TEXT NOT NULL, descricao TEXT, preco REAL, imagem_url TEXT)`);
            db.run(`CREATE TABLE IF NOT EXISTS usuarios (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT NOT NULL UNIQUE, senha TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'CONVIDADO')`);
            db.run(`CREATE TABLE IF NOT EXISTS carrinho_itens (id INTEGER PRIMARY KEY AUTOINCREMENT, usuario_id INTEGER NOT NULL, produto_id INTEGER NOT NULL, quantidade INTEGER NOT NULL DEFAULT 1, FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON DELETE CASCADE, FOREIGN KEY (produto_id) REFERENCES produtos (id) ON DELETE CASCADE)`);

            // --- CREDENCIAIS ATUALIZADAS AQUI ---
            const adminEmail = 'admingpg@gmail.com';
            const adminSenhaPlana = 'admingpg';
            const adminSenhaHash = bcrypt.hashSync(adminSenhaPlana, 10);

            const findAdminSql = `SELECT id FROM usuarios WHERE email = ?`;
            db.get(findAdminSql, [adminEmail], (err, row) => {
                if (err) return console.error("Erro ao procurar admin:", err.message);
                if (row) {
                    const updateAdminSql = `UPDATE usuarios SET senha = ? WHERE email = ?`;
                    db.run(updateAdminSql, [adminSenhaHash, adminEmail], (err) => {
                        if (err) return console.error("Erro ao atualizar admin:", err.message);
                        console.log("Conta do administrador (admingpg@gmail.com) verificada e atualizada.");
                    });
                } else {
                    const insertAdminSql = `INSERT INTO usuarios (email, senha, role) VALUES (?, ?, ?)`;
                    db.run(insertAdminSql, [adminEmail, adminSenhaHash, 'ADMIN'], (err) => {
                        if (err) return console.error("Erro ao criar admin:", err.message);
                        console.log("Conta do administrador (admingpg@gmail.com) criada com sucesso.");
                    });
                }
            });
        });
    }
});
module.exports = db;