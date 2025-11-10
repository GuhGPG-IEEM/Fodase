document.addEventListener('DOMContentLoaded', async () => {
    const { data: { session } } = await supabaseClient.auth.getSession();

    if (!session) {
        window.location.href = 'login.html';
        return;
    }

    const user = session.user;

    await loadAddresses(user.id);
    await loadOrderSummary(user.id);

    const confirmOrderBtn = document.getElementById('confirm-order-btn');
    confirmOrderBtn.addEventListener('click', () => createOrder(user.id));
});

async function loadAddresses(userId) {
    const addressListContainer = document.getElementById('address-selection-list');
    if (!addressListContainer) return;

    const { data: addresses, error } = await supabaseClient
        .from('addresses')
        .select('*')
        .eq('user_id', userId);

    if (error) {
        console.error('Erro ao carregar endereços:', error);
        addressListContainer.innerHTML = '<p>Não foi possível carregar os endereços.</p>';
        return;
    }

    if (addresses.length === 0) {
        addressListContainer.innerHTML = '<p>Nenhum endereço cadastrado.</p>';
    } else {
        addressListContainer.innerHTML = ''; // Limpa a mensagem de "carregando"
        addresses.forEach(address => {
            const addressHTML = `
                <label class="address-selection-card">
                    <input type="radio" name="selected_address" value="${address.id}" required>
                    <div class="address-card-details">
                        <p><strong>Rua:</strong> ${address.street}, ${address.number}</p>
                        <p><strong>Cidade:</strong> ${address.city}/${address.state} - <strong>CEP:</strong> ${address.zip_code}</p>
                    </div>
                </label>
            `;
            addressListContainer.insertAdjacentHTML('beforeend', addressHTML);
        });
    }
}

async function loadOrderSummary(userId) {
    const summaryItemsContainer = document.getElementById('summary-items-list');
    if (!summaryItemsContainer) return;

    const { data: cartItems, error } = await supabaseClient
        .from('cart_items')
        .select(`quantity, products (*)`)
        .eq('user_id', userId);

    if (error) {
        console.error('Erro ao carregar resumo do pedido:', error);
        return;
    }

    if (cartItems.length === 0) {
        alert('Seu carrinho está vazio. Redirecionando...');
        window.location.href = 'carrinho.html';
        return;
    }

    summaryItemsContainer.innerHTML = '';
    let subtotal = 0;

    cartItems.forEach(item => {
        const product = item.products;
        const itemTotal = product.price * item.quantity;
        subtotal += itemTotal;

        const summaryItemHTML = `
            <div class="summary-item">
                <span class="summary-item-name">${product.name} (x${item.quantity})</span>
                <span class="summary-item-price">${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(itemTotal)}</span>
            </div>
        `;
        summaryItemsContainer.insertAdjacentHTML('beforeend', summaryItemHTML);
    });

    const formattedSubtotal = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(subtotal);
    document.getElementById('summary-subtotal').textContent = formattedSubtotal;
    document.getElementById('summary-total').textContent = formattedSubtotal;
}

async function createOrder(userId) {
    const confirmOrderBtn = document.getElementById('confirm-order-btn');
    confirmOrderBtn.disabled = true;
    confirmOrderBtn.textContent = 'Processando...';

    // 1. Verificar qual endereço foi selecionado
    const selectedAddress = document.querySelector('input[name="selected_address"]:checked');
    if (!selectedAddress) {
        alert('Por favor, selecione um endereço de entrega.');
        confirmOrderBtn.disabled = false;
        confirmOrderBtn.textContent = 'Confirmar Pedido';
        return;
    }
    const addressId = selectedAddress.value;

    // 2. Recalcular o total e pegar os itens do carrinho
    const { data: cartItems, error: cartError } = await supabaseClient
        .from('cart_items')
        .select(`quantity, products (*)`)
        .eq('user_id', userId);

    if (cartError || cartItems.length === 0) {
        alert('Erro ao buscar itens do carrinho. Tente novamente.');
        window.location.href = 'carrinho.html';
        return;
    }

    const totalPrice = cartItems.reduce((total, item) => total + (item.products.price * item.quantity), 0);

    // 3. Criar o registro na tabela 'orders'
    const { data: newOrder, error: orderError } = await supabaseClient
        .from('orders')
        .insert({
            user_id: userId,
            address_id: addressId,
            total_price: totalPrice
        })
        .select('id')
        .single(); // .select().single() para retornar o pedido recém-criado

    if (orderError) {
        console.error('Erro ao criar pedido:', orderError);
        alert('Ocorreu um erro ao criar seu pedido.');
        confirmOrderBtn.disabled = false;
        confirmOrderBtn.textContent = 'Confirmar Pedido';
        return;
    }

    const newOrderId = newOrder.id;

    // 4. Mapear os itens do carrinho para o formato de 'order_items'
    const orderItems = cartItems.map(item => ({
        order_id: newOrderId,
        product_id: item.products.id,
        quantity: item.quantity,
        price_at_purchase: item.products.price
    }));

    // 5. Inserir os itens na tabela 'order_items'
    const { error: orderItemsError } = await supabaseClient
        .from('order_items')
        .insert(orderItems);

    if (orderItemsError) {
        // Se aqui der erro, idealmente deveríamos deletar o 'order' que foi criado (rollback)
        // Por simplicidade, vamos apenas notificar o usuário
        console.error('Erro ao salvar itens do pedido:', orderItemsError);
        alert('Ocorreu um erro ao salvar os detalhes do seu pedido.');
        confirmOrderBtn.disabled = false;
        confirmOrderBtn.textContent = 'Confirmar Pedido';
        return;
    }
    
    // 6. Limpar o carrinho do usuário
    const { error: deleteCartError } = await supabaseClient
        .from('cart_items')
        .delete()
        .eq('user_id', userId);

    if(deleteCartError) {
        console.error("Erro ao limpar o carrinho:", deleteCartError);
    }
    
    // 7. Redirecionar para a página de sucesso
    window.location.href = 'success.html';
}