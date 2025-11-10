// Espera o HTML carregar antes de executar o código
document.addEventListener('DOMContentLoaded', () => {
    loadCartItems();

    // Adiciona um 'escutador de eventos' para os botões de quantidade e remoção
    const cartItemsContainer = document.querySelector('.cart-items');
    if (cartItemsContainer) {
        cartItemsContainer.addEventListener('click', handleCartAction);
    }
});

// Função principal para carregar e exibir os itens do carrinho
async function loadCartItems() {
    showSpinner('.cart-items');
    const { data: { session } } = await supabaseClient.auth.getSession();

    // Se não há usuário logado, redireciona para a página de login
    if (!session) {
        window.location.href = 'login.html';
        return;
    }

    const userId = session.user.id;
    const cartItemsContainer = document.querySelector('.cart-items');
    const orderSummaryContainer = document.querySelector('.order-summary');
    if (!cartItemsContainer || !orderSummaryContainer) return;

    // Busca os itens do carrinho e os detalhes dos produtos associados (JOIN)
    const { data: items, error } = await supabaseClient
        .from('cart_items')
        .select(`
            id, 
            quantity,
            products (
                id,
                name,
                price,
                image_url
            )
        `)
        .eq('user_id', userId);

    if (error) {
        console.error('Erro ao buscar itens do carrinho:', error);
        return;
    }

    // Limpa os itens de exemplo
    cartItemsContainer.innerHTML = '<h2>Seu Carrinho</h2>';

    if (items.length === 0) {
        cartItemsContainer.innerHTML += '<p>Seu carrinho está vazio.</p>';
        updateOrderSummary(0); // Atualiza o resumo para zerar
        return;
    }

    let subtotal = 0;

    // Para cada item, cria o HTML e calcula o subtotal
    items.forEach(item => {
        const product = item.products;
        const itemTotal = product.price * item.quantity;
        subtotal += itemTotal;

        const formattedPrice = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(itemTotal);

        const cartItemHTML = `
            <div class="cart-item" data-item-id="${item.id}" data-product-id="${product.id}">
                <img src="${product.image_url}" alt="${product.name}">
                <div class="item-details">
                    <h3>${product.name}</h3>
                    <div class="quantity-selector">
                        <button class="quantity-decrease">-</button>
                        <input type="text" value="${item.quantity}" readonly>
                        <button class="quantity-increase">+</button>
                    </div>
                </div>
                <div class="item-price">
                    <span>${formattedPrice}</span>
                    <button class="remove-item"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        `;
        cartItemsContainer.insertAdjacentHTML('beforeend', cartItemHTML);
    });

    updateOrderSummary(subtotal, items.length);
}

// Atualiza o resumo do pedido (subtotal, total, etc.)
function updateOrderSummary(subtotal, itemCount = 0) {
    const subtotalEl = document.querySelector('.summary-subtotal');
    const totalEl = document.querySelector('.summary-total');
    const itemCountEl = document.querySelector('.summary-item-count');
    
    if (subtotalEl && totalEl && itemCountEl) {
        const formattedSubtotal = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(subtotal);
        subtotalEl.textContent = formattedSubtotal;
        totalEl.textContent = formattedSubtotal; // Por enquanto, total é igual ao subtotal
        itemCountEl.textContent = `Subtotal (${itemCount} itens)`;
    }
}


// Lida com cliques nos botões de +/-, e remover
async function handleCartAction(event) {
    const target = event.target;
    const cartItem = target.closest('.cart-item');
    if (!cartItem) return;

    const itemId = cartItem.dataset.itemId;

    // Lógica para remover item
    if (target.matches('.remove-item') || target.closest('.remove-item')) {
        const { error } = await supabaseClient.from('cart_items').delete().eq('id', itemId);
        if (error) {
            alert('Erro ao remover o item.');
        } else {
            loadCartItems(); // Recarrega o carrinho
            updateCartIconCount(); // Atualiza o ícone
        }
    }

    // Lógica para aumentar ou diminuir a quantidade
    if (target.matches('.quantity-increase') || target.matches('.quantity-decrease')) {
        const input = cartItem.querySelector('input');
        let currentQuantity = parseInt(input.value);

        if (target.matches('.quantity-increase')) {
            currentQuantity++;
        } else if (target.matches('.quantity-decrease') && currentQuantity > 1) {
            currentQuantity--;
        } else if (target.matches('.quantity-decrease') && currentQuantity === 1) {
            // Se a quantidade é 1 e clica em "-", remove o item
            handleCartAction({ target: cartItem.querySelector('.remove-item')});
            return;
        }

        const { error } = await supabaseClient.from('cart_items').update({ quantity: currentQuantity }).eq('id', itemId);
        if (error) {
            alert('Erro ao atualizar a quantidade.');
        } else {
            loadCartItems(); // Recarrega o carrinho para atualizar os totais
        }
    }
}