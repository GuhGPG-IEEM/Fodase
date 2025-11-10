document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');

    if (!productId) {
        window.location.href = 'index.html';
        return;
    }

    loadProductDetails(productId);
});

async function loadProductDetails(productId) {
    const container = document.getElementById('product-detail-container');
    if (!container) return;

    const { data: product, error } = await supabaseClient
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();

    if (error || !product) {
        console.error('Erro ao buscar produto:', error);
        container.innerHTML = '<h2>Produto não encontrado</h2><p>O produto que você está procurando não existe ou foi removido.</p>';
        return;
    }

    const formattedPrice = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price);
    let priceHTML = `<span class="product-detail-price">${formattedPrice}</span>`;
    if (product.old_price) {
        const formattedOldPrice = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.old_price);
        priceHTML = `<span class="product-detail-old-price">${formattedOldPrice}</span> ${priceHTML}`;
    }

    const productDetailHTML = `
        <div class="product-detail-image">
            <img src="${product.image_url}" alt="${product.name}">
        </div>
        <div class="product-detail-info">
            <h1>${product.name}</h1>
            <div class="price-container">${priceHTML}</div>
            <p class="product-detail-description">${product.description}</p>
            <button class="btn-primary add-to-cart-detail" data-product-id="${product.id}">Adicionar ao Carrinho</button>
        </div>
    `;

    container.innerHTML = productDetailHTML;

    const addToCartBtn = container.querySelector('.add-to-cart-detail');
    if (addToCartBtn) {
        addToCartBtn.addEventListener('click', handleAddToCartClick);
    }
}

async function handleAddToCartClick(event) {
    if (!event.target.matches('[data-product-id]')) { return; }
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) { 
        showToast('Você precisa estar logado para adicionar itens.', 'error');
        setTimeout(() => window.location.href = 'login.html', 2000);
        return; 
    }
    const userId = session.user.id;
    const productId = event.target.dataset.productId;
    const { data: existingItem, error: selectError } = await supabaseClient.from('cart_items').select('id, quantity').eq('user_id', userId).eq('product_id', productId).single();
    if (selectError && selectError.code !== 'PGRST116') { console.error('Erro ao verificar item no carrinho:', selectError); showToast('Ocorreu um erro. Tente novamente.', 'error'); return; }
    if (existingItem) {
        const newQuantity = existingItem.quantity + 1;
        const { error: updateError } = await supabaseClient.from('cart_items').update({ quantity: newQuantity }).eq('id', existingItem.id);
        if (updateError) { console.error('Erro ao atualizar a quantidade:', updateError); showToast('Não foi possível atualizar o item.', 'error');
        } else { showToast('Quantidade atualizada no carrinho!'); }
    } else {
        const { error: insertError } = await supabaseClient.from('cart_items').insert({ user_id: userId, product_id: productId, quantity: 1 });
        if (insertError) { console.error('Erro ao adicionar ao carrinho:', insertError); showToast('Não foi possível adicionar o item.', 'error');
        } else { showToast('Produto adicionado ao carrinho!'); }
    }
    updateCartIconCount();
}