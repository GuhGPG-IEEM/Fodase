document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const errorMessage = document.getElementById('error-message');
    const chatFab = document.getElementById('chat-fab');
    const chatWindow = document.getElementById('chat-window');
    const closeChatBtn = document.getElementById('close-chat');

    if (localStorage.getItem('authToken')) {
        window.location.href = 'index.html';
    }

    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        errorMessage.textContent = '';
        const email = document.getElementById('email').value;
        const senha = document.getElementById('senha').value;
        try {
            const response = await fetch('http://localhost:3000/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, senha }),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Erro ao fazer login.');
            }
            localStorage.setItem('authToken', data.token);
            window.location.href = 'index.html';
        } catch (error) {
            errorMessage.textContent = error.message;
        }
    });
    
    // Simples lógica de chat para páginas sem o script principal
    chatFab.addEventListener('click', () => { chatWindow.style.display = 'flex'; });
    closeChatBtn.addEventListener('click', () => { chatWindow.style.display = 'none'; });
    // O chatbot não será funcional aqui, apenas visual
});