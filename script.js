// Espera o documento HTML ser completamente carregado para rodar o script
document.addEventListener('DOMContentLoaded', function() {

    // --- CONTROLES DE ACESSIBILIDADE ---

    // Seleciona os botões e o elemento HTML principal
    const highContrastBtn = document.getElementById('high-contrast-btn');
    const fontIncreaseBtn = document.getElementById('font-increase-btn');
    const fontDecreaseBtn = document.getElementById('font-decrease-btn');
    const htmlElement = document.documentElement; // Usamos <html> para o tamanho da fonte

    // Função para alternar o modo de alto contraste
    highContrastBtn.addEventListener('click', function() {
        document.body.classList.toggle('high-contrast');
    });

    // Função para aumentar o tamanho da fonte
    fontIncreaseBtn.addEventListener('click', function() {
        // Pega o tamanho da fonte atual computado pelo navegador
        let currentFontSize = parseFloat(window.getComputedStyle(htmlElement).fontSize);
        
        // Aumenta o tamanho, com um limite máximo de 24px
        if (currentFontSize < 24) {
            htmlElement.style.fontSize = (currentFontSize + 1) + 'px';
        }
    });

    // Função para diminuir o tamanho da fonte
    fontDecreaseBtn.addEventListener('click', function() {
        // Pega o tamanho da fonte atual computado pelo navegador
        let currentFontSize = parseFloat(window.getComputedStyle(htmlElement).fontSize);

        // Diminui o tamanho, com um limite mínimo de 12px
        if (currentFontSize > 12) {
            htmlElement.style.fontSize = (currentFontSize - 1) + 'px';
        }
    });


    // --- OBSERVAÇÕES PARA O FUTURO (BACK-END COM SUPABASE) ---

    /*
    O menu dropdown de "Categorias" está funcionando apenas com CSS (:hover).
    Isso é eficiente e não requer JavaScript para esta funcionalidade simples.
    */

    /*
    Quando você integrar com o Supabase, aqui será o lugar para adicionar:
    1. A lógica para verificar se o usuário está logado e mostrar/esconder os links
       "Cadastre-se/Conecte-se" vs. o perfil do usuário.
    2. A função para os botões "Adicionar ao Carrinho", que fará uma chamada
       para o seu back-end ou manipulará o estado do carrinho.
    3. O carregamento dinâmico dos produtos da vitrine a partir do seu banco de dados.
    */

});

// --- LÓGICA DO ACCORDION (FAQ) NA PÁGINA DE ATENDIMENTO ---

    // Seleciona todas as perguntas do FAQ
    const faqQuestions = document.querySelectorAll('.faq-question');

    // Adiciona um evento de clique a cada pergunta
    faqQuestions.forEach(question => {
        question.addEventListener('click', () => {
            // Pega o elemento pai (.faq-item)
            const parentItem = question.parentElement;
            
            // Pega o elemento da resposta
            const answer = parentItem.querySelector('.faq-answer');

            // Alterna a classe 'active' no item pai
            parentItem.classList.toggle('active');

            // Verifica se o item está ativo para mostrar/esconder a resposta
            if (parentItem.classList.contains('active')) {
                // Define a altura máxima para a altura real do conteúdo para a animação funcionar
                answer.style.maxHeight = answer.scrollHeight + 'px';
            } else {
                // Recolhe o item
                answer.style.maxHeight = '0px';
            }
        });
    });