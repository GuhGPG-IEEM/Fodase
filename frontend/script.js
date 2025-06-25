document.addEventListener('DOMContentLoaded', () => {
    // --- CONFIGURAÇÕES GLOBAIS E VARIÁVEIS ---
    const API_BASE_URL = 'http://localhost:3000/api';
    const token = localStorage.getItem('authToken');
    const FRETE_FIXO = 12.00;
    let user = null;
    let produtosCache = [];
    let carrinhoCache = [];

    // --- FUNÇÕES AUXILIARES ---
    const parseJwt = (token) => {
        try { return JSON.parse(atob(token.split('.')[1])); }
        catch (e) { return null; }
    };
    const getAuthHeaders = () => ({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    });
    const formatPrice = (price) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price || 0);

    if (token) {
        user = parseJwt(token);
    }

    // --- LÓGICA DO CHATBOT (GLOBAL) ---
    const chatFab = document.getElementById('chat-fab');
    const chatWindow = document.getElementById('chat-window');
    const closeChatBtn = document.getElementById('close-chat');
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');
    const chatMessages = document.getElementById('chat-messages');

    function addMessageToChat(text, sender) {
        if (!chatMessages) return;
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${sender}-message`;
        messageDiv.textContent = text;
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function handleBotResponse(userMessage) {
        const lowerCaseMessage = userMessage.toLowerCase();
        setTimeout(() => {
            if (lowerCaseMessage.includes('preço') || lowerCaseMessage.includes('valor') || lowerCaseMessage.includes('custa')) {
                let foundProduct = null;
                let searchString = lowerCaseMessage.replace(/preço|valor|quanto|custa|da|do|a|o/g, '').trim();
                for (const product of produtosCache) {
                    if (product.nome.toLowerCase().includes(searchString)) {
                        foundProduct = product;
                        break;
                    }
                }
                if (foundProduct) addMessageToChat(`O preço da ${foundProduct.nome} é ${formatPrice(foundProduct.preco)}.`, 'bot');
                else addMessageToChat('Não encontrei um produto com esse nome. Pode ser mais específico?', 'bot');
                return;
            }
            if (lowerCaseMessage.includes('oi') || lowerCaseMessage.includes('olá')) {
                addMessageToChat('Olá! Como posso te ajudar com os preços dos nossos produtos?', 'bot');
                return;
            }
            addMessageToChat('Desculpe, não entendi. Posso te ajudar com os preços. Tente perguntar: "qual o valor da RTX 4090?".', 'bot');
        }, 800);
    }

    if (chatFab) {
        chatFab.addEventListener('click', () => {
            chatWindow.style.display = 'flex';
            if (produtosCache.length === 0) {
                 fetch(`${API_BASE_URL}/produtos`).then(res => res.json()).then(data => { produtosCache = data; });
            }
            if (chatMessages.children.length === 0) {
                addMessageToChat('Olá! Sou a assistente virtual. Como posso ajudar?', 'bot');
            }
        });
        closeChatBtn.addEventListener('click', () => { chatWindow.style.display = 'none'; });
        chatForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const userMessage = chatInput.value.trim();
            if (userMessage) {
                addMessageToChat(userMessage, 'user');
                handleBotResponse(userMessage);
                chatInput.value = '';
            }
        });
    }

    // --- LÓGICA DA PÁGINA PRINCIPAL (INDEX.HTML) ---
    if (document.getElementById('product-list')) {
        const productListDiv = document.getElementById('product-list');
        const adminFormContainer = document.getElementById('admin-form-container');
        const addProductForm = document.getElementById('add-product-form');
        const userSessionDiv = document.getElementById('user-session');
        const cartModal = document.getElementById('cart-modal');
        const cartItemsContainer = document.getElementById('cart-items');
        const warrantySelect = document.getElementById('warranty-select');
        
        // --- FUNÇÕES PRINCIPAIS CORRIGIDAS ---
        function setupUIForRole() {
            const isAdmin = user && user.role === 'ADMIN';

            if (user) {
                userSessionDiv.innerHTML = `<span>Bem-vindo, <strong>${user.email}</strong>!</span><button id="cart-btn">🛒 Carrinho</button><button id="logout-btn">Logout</button>`;
                document.getElementById('logout-btn').addEventListener('click', () => { localStorage.removeItem('authToken'); window.location.reload(); });
                document.getElementById('cart-btn').addEventListener('click', openCartModal);
            } else {
                userSessionDiv.innerHTML = `<a href="login.html"><button>Login</button></a>`;
            }
            
            // CORREÇÃO: Mostra/esconde o formulário do admin
            if(adminFormContainer) {
                adminFormContainer.style.display = isAdmin ? 'block' : 'none';
            }
        }

        async function fetchAndRenderProducts() {
            try {
                const response = await fetch(`${API_BASE_URL}/produtos`);
                if (!response.ok) throw new Error('Falha ao buscar produtos do servidor.');
                
                produtosCache = await response.json();
                productListDiv.innerHTML = '';
                
                if (produtosCache.length === 0) {
                    productListDiv.innerHTML = "<p>Nenhum produto cadastrado no momento.</p>";
                    return;
                }

                const isAdmin = user && user.role === 'ADMIN';

                produtosCache.forEach(p => {
                    const card = document.createElement('div');
                    card.className = 'product-card';
                    
                    // CORREÇÃO: Lógica de botões simplificada e corrigida
                    const adminButtons = isAdmin ? `<div class="admin-buttons"><button class="edit-btn" data-id="${p.id}">Editar</button><button class="delete-btn" data-id="${p.id}">Excluir</button></div>` : '';
                    const userButtons = user ? `<button class="add-to-cart-btn" data-id="${p.id}">Adicionar ao Carrinho</button>` : '';

                    card.innerHTML = `
                        <div class="product-card-img-container"><img src="${p.imagem_url || 'https://via.placeholder.com/300x200?text=Sem+Imagem'}" alt="${p.nome}"></div>
                        <div class="product-card-info">
                            <h3>${p.nome}</h3>
                            <p class="price">${formatPrice(p.preco)}</p>
                            <p>${p.descricao || 'Sem descrição.'}</p>
                        </div>
                        <div class="product-card-actions">
                            ${adminButtons}
                            ${userButtons}
                        </div>`;
                    productListDiv.appendChild(card);
                });
            } catch (error) {
                console.error("Erro em fetchAndRenderProducts:", error);
                productListDiv.innerHTML = "<p>Ocorreu um erro ao carregar os produtos. Verifique se o servidor (back-end) está em execução.</p>";
            }
        }

        async function openCartModal() {
            if (!user) return;
            cartModal.style.display = 'block';
            try {
                const response = await fetch(`${API_BASE_URL}/carrinho`, { headers: getAuthHeaders() });
                if (!response.ok) throw new Error('Falha ao buscar carrinho.');
                carrinhoCache = await response.json();
                updateCartView();
            } catch (error) {
                console.error("Erro ao abrir o carrinho:", error);
                cartItemsContainer.innerHTML = '<p>Erro ao carregar o carrinho.</p>';
            }
        }

        function updateCartView() {
            if(!cartItemsContainer) return;
            cartItemsContainer.innerHTML = '';
            let subtotal = 0;
            carrinhoCache.forEach(item => {
                const itemDiv = document.createElement('div');
                itemDiv.className = 'cart-item';
                itemDiv.innerHTML = `<span><strong>${item.nome}</strong> - ${formatPrice(item.preco)}</span><div class="quantity-control"><button class="quantity-btn" data-id="${item.id}" data-change="-1">-</button><span>${item.quantidade}</span><button class="quantity-btn" data-id="${item.id}" data-change="1">+</button></div>`;
                cartItemsContainer.appendChild(itemDiv);
                subtotal += (item.preco || 0) * item.quantidade;
            });
            if (carrinhoCache.length === 0) {
                cartItemsContainer.innerHTML = '<p>Seu carrinho está vazio.</p>';
            }
            const custoGarantia = parseFloat(warrantySelect.value) || 0;
            const totalFinal = subtotal + custoGarantia + FRETE_FIXO;
            document.getElementById('summary-subtotal').textContent = formatPrice(subtotal);
            document.getElementById('summary-shipping').textContent = formatPrice(FRETE_FIXO);
            document.getElementById('summary-total').textContent = formatPrice(totalFinal);
        }

        // --- EVENT LISTENERS DA PÁGINA PRINCIPAL ---
        document.querySelector('.close-button').onclick = () => cartModal.style.display = 'none';
        window.onclick = (e) => { if (e.target == cartModal) { cartModal.style.display = 'none'; } };
        warrantySelect.addEventListener('change', updateCartView);

        productListDiv.addEventListener('click', async (e) => {
            const target = e.target;
            const id = target.dataset.id;
            if (!id) return;

            const isAdmin = user && user.role === 'ADMIN';

            if (target.classList.contains('add-to-cart-btn')) {
                await fetch(`${API_BASE_URL}/carrinho`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({ produtoId: Number(id), quantidade: 1 }) });
                alert('Produto adicionado ao carrinho!');
            } else if (target.classList.contains('edit-btn') && isAdmin) {
                const produto = produtosCache.find(p => p.id == id);
                if (!produto) return;
                const novoNome = prompt("Novo nome:", produto.nome);
                if (novoNome === null) return;
                const novaDescricao = prompt("Nova descrição:", produto.descricao);
                const novoPreco = prompt("Novo preço:", produto.preco);
                const novaImagem = prompt("Nova URL de imagem:", produto.imagem_url);
                await fetch(`${API_BASE_URL}/produtos/${id}`, { method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify({ nome: novoNome, descricao: novaDescricao, preco: parseFloat(novoPreco), imagem_url: novaImagem }) });
                fetchAndRenderProducts();
            } else if (target.classList.contains('delete-btn') && isAdmin) {
                if (confirm('Tem certeza que deseja excluir este produto?')) {
                    await fetch(`${API_BASE_URL}/produtos/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
                    fetchAndRenderProducts();
                }
            }
        });
        
        cartItemsContainer.addEventListener('click', async (e) => {
            if (e.target.classList.contains('quantity-btn')) {
                const produtoId = e.target.dataset.id;
                const change = parseInt(e.target.dataset.change);
                const itemAtual = carrinhoCache.find(i => i.id == produtoId);
                if (!itemAtual) return;
                const novaQuantidade = itemAtual.quantidade + change;
                await fetch(`${API_BASE_URL}/carrinho/item`, { method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify({ produtoId: Number(produtoId), quantidade: novaQuantidade }) });
                openCartModal();
            }
        });

        if (addProductForm) {
            addProductForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const produto = {
                    nome: document.getElementById('product-name').value,
                    descricao: document.getElementById('product-desc').value,
                    preco: parseFloat(document.getElementById('product-price').value),
                    imagem_url: document.getElementById('product-image').value
                };
                await fetch(`${API_BASE_URL}/produtos`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(produto) });
                addProductForm.reset();
                fetchAndRenderProducts();
            });
        }
        
        setupUIForRole();
        fetchAndRenderProducts();
    }

    // --- LÓGICA DA PÁGINA DE LOGIN (LOGIN.HTML) ---
    if (document.getElementById('login-form')) {
        // ... (código da versão anterior)
        const loginForm = document.getElementById('login-form');
        const errorMessage = document.getElementById('error-message');
        if (localStorage.getItem('authToken')) { window.location.href = 'index.html'; }
        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            errorMessage.textContent = '';
            const email = document.getElementById('email').value;
            const senha = document.getElementById('senha').value;
            try {
                const response = await fetch(`${API_BASE_URL}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, senha }) });
                const data = await response.json();
                if (!response.ok) throw new Error(data.error || 'Erro ao fazer login.');
                localStorage.setItem('authToken', data.token);
                window.location.href = 'index.html';
            } catch (error) {
                errorMessage.textContent = error.message;
            }
        });
    }

    // --- LÓGICA DA PÁGINA DE REGISTRO (REGISTRO.HTML) ---
    if (document.getElementById('registro-form')) {
        // ... (código da versão anterior)
        const registroForm = document.getElementById('registro-form');
        const messageP = document.getElementById('message');
        registroForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            messageP.textContent = '';
            messageP.style.color = 'red';
            const email = document.getElementById('email').value;
            const senha = document.getElementById('senha').value;
            const confirmarSenha = document.getElementById('confirmar-senha').value;
            if (senha !== confirmarSenha) { messageP.textContent = 'As senhas não coincidem!'; return; }
            try {
                const response = await fetch(`${API_BASE_URL}/auth/registro`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, senha }) });
                const data = await response.json();
                if (!response.ok) throw new Error(data.error || 'Erro ao tentar registrar.');
                messageP.style.color = 'green';
                messageP.textContent = 'Registro bem-sucedido! Redirecionando...';
                setTimeout(() => { window.location.href = 'login.html'; }, 2000);
            } catch (error) {
                messageP.textContent = error.message;
            }
        });
    }
});