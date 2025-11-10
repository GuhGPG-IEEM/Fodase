// --- INICIALIZAÇÃO DO SUPABASE ---
const SUPABASE_URL = 'https://esumxtdobgtfnouownwq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzdW14dGRvYmd0Zm5vdW93bndxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxOTAyOTgsImV4cCI6MjA3NDc2NjI5OH0.7J4kXMP64GXbetvLI39fcDojfsoEN89scsyWtQfZmM4';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- FUNÇÃO GLOBAL PARA NOTIFICAÇÕES "TOAST" ---
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const iconClass = type === 'success' ? 'fa-check-circle' : 'fa-times-circle';
    toast.innerHTML = `<i class="fas ${iconClass}"></i> ${message}`;
    container.appendChild(toast);
    setTimeout(() => { toast.remove(); }, 4500);
}


// --- LÓGICA EXECUTADA EM TODAS AS PÁGINAS QUANDO CARREGAM ---
document.addEventListener('DOMContentLoaded', async () => {
    applySavedTheme();

    const { data: { session } } = await supabaseClient.auth.getSession();
    updateHeader(session);
    updateCartIconCount();
    
    loadDynamicNav();
    setupSearchForm();
    setupThemeToggle();

    // LÓGICA DO ACCORDION (FAQ)
    const faqQuestions = document.querySelectorAll('.faq-question');
    faqQuestions.forEach(question => {
        question.addEventListener('click', () => {
            const parentItem = question.parentElement;
            const answer = parentItem.querySelector('.faq-answer');
            parentItem.classList.toggle('active');
            if (parentItem.classList.contains('active')) {
                answer.style.maxHeight = answer.scrollHeight + 'px';
            } else {
                answer.style.maxHeight = '0px';
            }
        });
    });
});

// Escuta por mudanças no estado de autenticação (login, logout)
supabaseClient.auth.onAuthStateChange((event, session) => {
    updateHeader(session);
    updateCartIconCount();
});


// --- LÓGICA DO SELETOR DE TEMA ---
function setupThemeToggle() {
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    if (!themeToggleBtn) return;
    themeToggleBtn.addEventListener('click', () => {
        document.body.classList.toggle('light-theme');
        localStorage.setItem('theme', document.body.classList.contains('light-theme') ? 'light' : 'dark');
        updateThemeIcon();
    });
}
function applySavedTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') { document.body.classList.add('light-theme'); }
    updateThemeIcon();
}
function updateThemeIcon() {
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    if (!themeToggleBtn) return;
    const icon = themeToggleBtn.querySelector('i');
    if (document.body.classList.contains('light-theme')) {
        icon.classList.remove('fa-moon'); icon.classList.add('fa-sun');
    } else {
        icon.classList.remove('fa-sun'); icon.classList.add('fa-moon');
    }
}


// --- DEMAIS FUNÇÕES (MENU, BUSCA, AUTH, CARRINHO) ---
async function loadDynamicNav() {
    const dropdownMenu = document.querySelector('.dropdown-menu');
    if (!dropdownMenu) return;
    const { data: categories, error } = await supabaseClient.from('categories').select('*').order('name', { ascending: true });
    if (error) { console.error('Erro ao carregar categorias:', error); return; }
    dropdownMenu.innerHTML = `<li><a href="index.html">TODAS</a></li>`; 
    categories.forEach(category => {
        const categoryLink = `<li><a href="index.html?category=${category.slug}">${category.name}</a></li>`;
        dropdownMenu.insertAdjacentHTML('beforeend', categoryLink);
    });
}
function setupSearchForm() {
    const searchForm = document.querySelector('.search-bar');
    if (searchForm) {
        searchForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const searchInput = searchForm.querySelector('input[type="text"]');
            const searchTerm = searchInput.value.trim();
            if (searchTerm) { window.location.href = `index.html?search=${encodeURIComponent(searchTerm)}`; }
        });
    }
}
async function logout() { await supabaseClient.auth.signOut(); window.location.href = 'login.html'; }
async function updateCartIconCount() { const { data: { session } } = await supabaseClient.auth.getSession(); const cartCountEl = document.querySelector('.cart-count'); if (session && cartCountEl) { const { count } = await supabaseClient.from('cart_items').select('*', { count: 'exact', head: true }).eq('user_id', session.user.id); cartCountEl.textContent = count || '0'; } else if (cartCountEl) { cartCountEl.textContent = '0'; } }
function updateHeader(session) { const userAuthDiv = document.querySelector('.user-auth'); const userProfileDiv = document.querySelector('.user-profile-container'); if (session) { if (userAuthDiv) userAuthDiv.style.display = 'none'; if (userProfileDiv) { userProfileDiv.style.display = 'flex'; const userEmail = session.user.email; userProfileDiv.innerHTML = `<a href="perfil.html" class="user-profile"><i class="fas fa-user"></i><span>Olá, ${userEmail.split('@')[0]}</span></a><button id="logout-btn" class="logout-button" title="Sair"><i class="fas fa-sign-out-alt"></i></button>`; document.getElementById('logout-btn').addEventListener('click', logout); } } else { if (userAuthDiv) userAuthDiv.style.display = 'flex'; if (userProfileDiv) userProfileDiv.style.display = 'none'; } }
if (document.body.contains(document.getElementById('login-form'))) {
    const loginForm = document.getElementById('login-form'); const signupForm = document.getElementById('signup-form'); const loginContainer = document.getElementById('login-form-container'); const signupContainer = document.getElementById('signup-form-container'); const showSignupLink = document.getElementById('show-signup'); const showLoginLink = document.getElementById('show-login'); showSignupLink.addEventListener('click', (e) => { e.preventDefault(); loginContainer.style.display = 'none'; signupContainer.style.display = 'block'; }); showLoginLink.addEventListener('click', (e) => { e.preventDefault(); loginContainer.style.display = 'block'; signupContainer.style.display = 'none'; }); signupForm.addEventListener('submit', async (e) => { e.preventDefault(); const email = document.getElementById('signup-email').value; const password = document.getElementById('signup-password').value; const messageEl = signupForm.querySelector('.form-message'); const { data, error } = await supabaseClient.auth.signUp({ email: email, password: password }); if (error) { messageEl.textContent = 'Erro: ' + error.message; messageEl.className = 'form-message error'; } else { showToast('Cadastro realizado com sucesso!'); signupForm.reset(); setTimeout(() => { loginContainer.style.display = 'block'; signupContainer.style.display = 'none'; }, 2000); } }); loginForm.addEventListener('submit', async (e) => { e.preventDefault(); const email = document.getElementById('login-email').value; const password = document.getElementById('login-password').value; const messageEl = loginForm.querySelector('.form-message'); const { data, error } = await supabaseClient.auth.signInWithPassword({ email: email, password: password }); if (error) { messageEl.textContent = 'Erro: E-mail ou senha inválidos.'; messageEl.className = 'form-message error'; } else { window.location.href = 'index.html'; } });
}

// (Após a função showToast...)

// --- NOVA FUNÇÃO GLOBAL PARA MOSTRAR SPINNER DE CARREGAMENTO ---
function showSpinner(containerSelector) {
    const container = document.querySelector(containerSelector);
    if (container) {
        container.innerHTML = `
            <div class="spinner-container">
                <div class="spinner"></div>
            </div>
        `;
    }
}