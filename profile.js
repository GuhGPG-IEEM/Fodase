document.addEventListener('DOMContentLoaded', async () => {
    // 1. Verificação de Sessão
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) {
        window.location.href = 'login.html';
        return;
    }
    const user = session.user;

    // 2. Carregar todos os dados da página
    loadUserData(user);
    loadAddresses(user.id);
    loadOrderHistory(user.id); // Nova função para carregar pedidos

    // 3. Configurar formulários e botões
    setupAddressForm(user.id);
    setupTabbedNavigation(); // Nova função para as abas
    document.getElementById('profile-logout-btn').addEventListener('click', logout);
});

// Lógica de Abas (Tabs)
function setupTabbedNavigation() {
    const tabLinks = document.querySelectorAll('.profile-tab-link');
    const tabContents = document.querySelectorAll('.profile-tab-content');

    tabLinks.forEach(link => {
        link.addEventListener('click', (event) => {
            event.preventDefault();
            const tabId = link.dataset.tab;

            // Esconde todos os conteúdos
            tabContents.forEach(content => content.style.display = 'none');
            // Remove a classe 'active' de todos os links
            tabLinks.forEach(l => l.classList.remove('active'));

            // Mostra o conteúdo da aba clicada
            document.getElementById(tabId).style.display = 'block';
            // Adiciona a classe 'active' ao link clicado
            link.classList.add('active');
        });
    });
}


// Carrega e exibe o histórico de pedidos
async function loadOrderHistory(userId) {
    const orderListContainer = document.getElementById('order-history-list');
    if(!orderListContainer) return;

    // Query complexa: busca os pedidos e, para cada pedido, busca os itens e os detalhes dos produtos
    const { data: orders, error } = await supabaseClient
        .from('orders')
        .select(`
            id,
            created_at,
            total_price,
            status,
            order_items (
                quantity,
                price_at_purchase,
                products (
                    name,
                    image_url
                )
            )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false }); // Ordena pelos mais recentes

    if (error) {
        console.error("Erro ao buscar histórico de pedidos:", error);
        orderListContainer.innerHTML = '<p>Não foi possível carregar seus pedidos.</p>';
        return;
    }

    if (orders.length === 0) {
        orderListContainer.innerHTML = '<p>Você ainda não fez nenhum pedido.</p>';
        return;
    }

    orderListContainer.innerHTML = '';
    orders.forEach(order => {
        const orderDate = new Date(order.created_at).toLocaleDateString('pt-BR');
        const formattedTotal = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.total_price);

        // Gera o HTML para os itens dentro do pedido
        const itemsHTML = order.order_items.map(item => `
            <div class="order-item-detail">
                <img src="${item.products.image_url}" alt="${item.products.name}">
                <div>
                    <p>${item.products.name}</p>
                    <p>Quantidade: ${item.quantity} | Preço: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.price_at_purchase)}</p>
                </div>
            </div>
        `).join('');

        const orderCardHTML = `
            <div class="order-card">
                <div class="order-summary-header">
                    <div><strong>Pedido:</strong> #${order.id}</div>
                    <div><strong>Data:</strong> ${orderDate}</div>
                    <div><strong>Status:</strong> ${order.status}</div>
                    <div><strong>Total:</strong> ${formattedTotal}</div>
                </div>
                <div class="order-items-container">
                    ${itemsHTML}
                </div>
            </div>
        `;
        orderListContainer.insertAdjacentHTML('beforeend', orderCardHTML);
    });
}


// --- Funções existentes de Endereço e Dados (com pequenas alterações) ---

function loadUserData(user) { /* ...código existente, sem alterações... */
    const userEmailEl = document.getElementById('user-email');
    if (userEmailEl) { userEmailEl.textContent = user.email; }
}

async function loadAddresses(userId) { /* ...código existente, sem alterações... */
    showSpinner('#address-list');
    const addressList = document.getElementById('address-list');
    if (!addressList) return;
    const { data: addresses, error } = await supabaseClient.from('addresses').select('*').eq('user_id', userId);
    if (error) { console.error('Erro ao carregar endereços:', error); return; }
    addressList.innerHTML = '';
    if (addresses.length === 0) {
        addressList.innerHTML = '<p>Nenhum endereço cadastrado.</p>';
    } else {
        addresses.forEach(address => {
            const addressCardHTML = `<div class="address-card"><p><strong>Rua:</strong> ${address.street}, ${address.number}</p><p><strong>Bairro:</strong> ${address.neighborhood}</p><p><strong>Cidade/Estado:</strong> ${address.city}/${address.state}</p><p><strong>CEP:</strong> ${address.zip_code}</p><button class="delete-address-btn" data-address-id="${address.id}">Excluir</button></div>`;
            addressList.insertAdjacentHTML('beforeend', addressCardHTML);
        });
    }
}


function setupAddressForm(userId) {
    const newAddressForm = document.getElementById('new-address-form');
    newAddressForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const formData = new FormData(newAddressForm);
        const addressData = { user_id: userId, street: formData.get('street'), number: formData.get('number'), neighborhood: formData.get('neighborhood'), city: formData.get('city'), state: formData.get('state'), zip_code: formData.get('zip_code') };
        const { error } = await supabaseClient.from('addresses').insert(addressData);
        if (error) {
            console.error('Erro ao adicionar endereço:', error);
            showToast('Não foi possível salvar o novo endereço.', 'error');
        } else {
            showToast('Endereço adicionado com sucesso!');
            newAddressForm.reset();
            loadAddresses(userId);
        }
    });

    const addressList = document.getElementById('address-list');
    addressList.addEventListener('click', async (event) => {
        if (event.target.classList.contains('delete-address-btn')) {
            const addressId = event.target.dataset.addressId;
            if (confirm('Tem certeza que deseja excluir este endereço?')) {
                const { error } = await supabaseClient.from('addresses').delete().eq('id', addressId);
                if (error) {
                    console.error('Erro ao excluir endereço:', error);
                    showToast('Não foi possível excluir o endereço.', 'error');
                } else {
                    showToast('Endereço excluído com sucesso.');
                    loadAddresses(userId);
                }
            }
        }
    });
}