document.addEventListener('DOMContentLoaded', () => {
    const registroForm = document.getElementById('registro-form');
    const messageP = document.getElementById('message');
    const chatFab = document.getElementById('chat-fab');
    const chatWindow = document.getElementById('chat-window');
    const closeChatBtn = document.getElementById('close-chat');

    registroForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        messageP.textContent = '';
        messageP.style.color = 'red';
        const email = document.getElementById('email').value;
        const senha = document.getElementById('senha').value;
        const confirmarSenha = document.getElementById('confirmar-senha').value;

        if (senha !== confirmarSenha) {
            messageP.textContent = 'As senhas não coincidem!';
            return;
        }
        try {
            const response = await fetch('http://localhost:3000/api/auth/registro', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, senha }),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Erro ao tentar registrar.');
            }
            messageP.style.color = 'green';
            messageP.textContent = 'Registro bem-sucedido! Redirecionando para o login...';
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
        } catch (error) {
            messageP.textContent = error.message;
        }
    });

    // Simples lógica de chat para páginas sem o script principal
    chatFab.addEventListener('click', () => { chatWindow.style.display = 'flex'; });
    closeChatBtn.addEventListener('click', () => { chatWindow.style.display = 'none'; });
});