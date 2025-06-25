# GPU Store - E-commerce Simples Full-Stack

![Demonstração da GPU Store](https://i.imgur.com/b54c8Jd.png)

## 📖 Descrição do Projeto

A **GPU Store** é uma aplicação web Full-Stack que simula uma loja virtual de placas de vídeo e componentes de hardware. O projeto foi desenvolvido como um exercício prático para cobrir todas as etapas de criação de uma aplicação web moderna, desde o banco de dados e a API no back-end até a interface interativa no front-end.

O site permite que administradores gerenciem o catálogo de produtos e que clientes (convidados) criem contas, naveguem pelos produtos, adicionem itens a um carrinho de compras interativo e simulem o cálculo de uma compra completa.

---

## 👥 Autores

Este projeto foi desenvolvido em dupla por:

* **[SEU NOME AQUI]**
* **Parceiro de Programação (IA do Google)**

---

## ✨ Funcionalidades Principais

* **Autenticação de Usuários:** Sistema completo de registro e login com senhas criptografadas (`bcrypt`) e gerenciamento de sessão via Tokens JWT.
* **Controle de Acesso por Papel (Role):** Distinção clara entre `ADMIN` e `CONVIDADO`, onde apenas administradores podem gerenciar o catálogo.
* **Gerenciamento de Produtos (CRUD):** Administradores têm controle total para Criar, Ler, Atualizar e Deletar produtos, incluindo informações de preço e imagem.
* **Carrinho de Compras Interativo:** Usuários logados podem adicionar produtos, alterar quantidades (`+`/`-`) e remover itens do seu carrinho pessoal.
* **Cálculo de Custos em Tempo Real:** O carrinho calcula dinamicamente o subtotal, adiciona custos de garantia selecionáveis e um frete fixo para apresentar o valor total da compra.
* **Chatbot Simulado:** Um chatbot de suporte no front-end que responde a perguntas dos usuários sobre os preços dos produtos, melhorando a experiência de compra.

---

## 🛠️ Tecnologias Utilizadas

### **Front-end**
* **HTML5**
* **CSS3** (com Variáveis CSS para fácil customização)
* **JavaScript (ES6+)** (Vanilla JS, sem frameworks)

### **Back-end**
* **Node.js:** Ambiente de execução do servidor.
* **Express.js:** Framework para a construção da API REST.
* **SQLite3:** Banco de dados SQL leve e baseado em arquivo.
* **bcrypt.js:** Biblioteca para criptografia (hashing) de senhas.
* **jsonwebtoken:** Biblioteca para criação e verificação de tokens de autenticação (JWT).
* **CORS:** Middleware para permitir a comunicação entre o front-end e o back-end.

---

## 🚀 Como Executar o Projeto

**Pré-requisitos:** Você precisa ter o [Node.js](https://nodejs.org/) (que inclui o `npm`) instalado.

### **1. Clone o Repositório**
```bash
git clone [https://github.com/SEU_USUARIO/NOME_DO_REPOSITORIO.git](https://github.com/SEU_USUARIO/NOME_DO_REPOSITORIO.git)
cd NOME_DO_REPOSITORIO
```
