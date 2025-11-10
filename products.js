document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const searchTerm = urlParams.get('search');
    const categorySlug = urlParams.get('category');

    loadProducts(searchTerm, categorySlug);

    const productGrid = document.querySelector('.product-grid');
    if (productGrid) {
        productGrid.addEventListener('click', handleAddToCartClick);
    }
});

async function loadProducts(searchTerm = null, categorySlug = null) {
    showSpinner('.product-grid');
    const productGrid = document.querySelector('.product-grid');
    const showcaseTitle = document.getElementById('showcase-title');
    if (!productGrid || !showcaseTitle) return;

    let query = supabaseClient.from('products').select('*, categories!inner(name, slug)');

    if (searchTerm) {
        showcaseTitle.textContent = `Resultados para: "${searchTerm}"`;
        query = query.or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
    } else if (categorySlug) {
        query = query.eq('categories.slug', categorySlug);
    } else {
        showcaseTitle.textContent = 'Promoções da Semana';
    }

    const { data: products, error } = await query;

    if (categorySlug && products && products.length > 0 && products[0].categories) {
        showcaseTitle.textContent = `Mostrando Categoria: ${products[0].categories.name}`;
    } else if (categorySlug && products.length === 0) {
        showcaseTitle.textContent = `Nenhum produto encontrado para esta categoria.`;
    }

    if (error) { console.error('Ocorreu um erro na query:', error); return; }
    
    productGrid.innerHTML = '';
    if (products.length === 0) {
        productGrid.innerHTML = '<p>Nenhum produto encontrado.</p>';
        return;
    }

    products.forEach(product => {
        const formattedPrice = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price);
        let priceHTML = `<span class="new-price">${formattedPrice}</span>`;
        if (product.old_price) {
            const formattedOldPrice = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.old_price);
            priceHTML = `<span class="old-price">${formattedOldPrice}</span> ${priceHTML}`;
        }
        const productCardHTML = `<article class="product-card"><a href="produto.html?id=${product.id}" class="product-link"><img src="${product.image_url}" alt="${product.name}"><h3>${product.name}</h3><div class="price">${priceHTML}</div></a><button class="btn-secondary" data-product-id="${product.id}">Adicionar ao Carrinho</button></article>`;
        productGrid.insertAdjacentHTML('beforeend', productCardHTML);
    });
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