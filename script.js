let items = [];
let editingIndex = -1;

// Carregar itens do localStorage se existirem
function loadItems() {
    // Verificar se há dados na URL (compartilhamento)
    const urlParams = new URLSearchParams(window.location.search);
    const sharedData = urlParams.get('data');
    
    if (sharedData) {
        try {
            // Decodificar e analisar os dados compartilhados
            const decodedData = decodeURIComponent(sharedData);
            items = JSON.parse(decodedData);
            // Limpar parâmetros da URL para evitar recarregar os mesmos dados
            window.history.replaceState({}, document.title, window.location.pathname);
        } catch (e) {
            console.error('Erro ao carregar dados compartilhados:', e);
            // Se der erro, carregar do localStorage
            loadFromLocalStorage();
        }
    } else {
        loadFromLocalStorage();
    }
    
    renderItems();
    updateTotals();
}

// Carregar do localStorage
function loadFromLocalStorage() {
    const savedItems = localStorage.getItem('marketListItems');
    if (savedItems) {
        try {
            items = JSON.parse(savedItems);
            items = items.filter(item => item && typeof item === 'object' && 'quantity' in item && 'itemName' in item);
        } catch (e) {
            items = [];
        }
    }
}

// Salvar itens no localStorage
function saveItems() {
    localStorage.setItem('marketListItems', JSON.stringify(items));
}

// Adicionar novo item à lista
function addItem() {
    const quantity = parseInt(document.getElementById('quantityInput').value) || 1;
    const itemName = document.getElementById('itemInput').value.trim();
    const categorySelect = document.getElementById('categorySelect');
    const category = categorySelect.value;
    const categoryText = categorySelect.options[categorySelect.selectedIndex].text;
    const weight = document.getElementById('weightInput').value;
    const price = document.getElementById('priceInput').value;

    if (!itemName) {
        alert('Por favor, digite o nome do item!');
        return;
    }

    if (editingIndex >= 0) {
        items[editingIndex] = { quantity, itemName, category, categoryText, weight, price, bought: items[editingIndex].bought || false };
        editingIndex = -1;
    } else {
        items.push({ quantity, itemName, category, categoryText, weight, price, bought: false });
    }

    document.getElementById('quantityInput').value = '1';
    document.getElementById('itemInput').value = '';
    document.getElementById('weightInput').value = '';
    document.getElementById('priceInput').value = '';
    document.getElementById('categorySelect').selectedIndex = 0;

    renderItems();
    updateTotals();
    saveItems();
}

// Atualizar um item específico
function updateItem(index, field, value) {
    if (field === 'quantity') {
        items[index][field] = parseInt(value) || 1;
    } else if (field === 'price') {
        items[index][field] = value.replace(/[^\d.,]/g, '').replace(',', '.');
    } else {
        items[index][field] = value;
    }

    if (field === 'category') {
        const select = document.querySelectorAll('.list-item select')[index];
        items[index].categoryText = select.options[select.selectedIndex].text;
    }

    updateTotals();
    saveItems();
    renderItems();
}

// Marcar/desmarcar como comprado
function toggleBought(index) {
    items[index].bought = !items[index].bought;
    saveItems();
    renderItems();
}

// Renderizar a lista de itens
function renderItems() {
    const marketList = document.getElementById('marketList');
    marketList.innerHTML = '';

    items.forEach((item, index) => {
        if (!item || typeof item !== 'object' || !('quantity' in item)) return;

        const itemElement = document.createElement('div');
        itemElement.className = 'list-item';
        if (item.bought) itemElement.classList.add('bought');

        itemElement.innerHTML = `
            <input type="number" value="${item.quantity}" min="1" 
                onchange="updateItem(${index}, 'quantity', this.value)" 
                oninput="updateItem(${index}, 'quantity', this.value)">
            <input type="text" value="${item.itemName}" 
                onchange="updateItem(${index}, 'itemName', this.value)" 
                class="${item.price ? 'item-with-value' : ''}">
            <select onchange="updateItem(${index}, 'category', this.value); updateItem(${index}, 'categoryText', this.options[this.selectedIndex].text)">
                <option value="fruits" ${item.category === 'fruits' ? 'selected' : ''}>Frutas</option>
                <option value="vegetables" ${item.category === 'vegetables' ? 'selected' : ''}>Vegetais</option>
                <option value="cleaning" ${item.category === 'cleaning' ? 'selected' : ''}>Limpeza</option>
                <option value="dairy" ${item.category === 'dairy' ? 'selected' : ''}>Laticínios</option>
                <option value="meat" ${item.category === 'meat' ? 'selected' : ''}>Carnes</option>
                <option value="bakery" ${item.category === 'bakery' ? 'selected' : ''}>Padaria</option>
                <option value="beverages" ${item.category === 'beverages' ? 'selected' : ''}>Bebidas</option>
                <option value="snacks" ${item.category === 'snacks' ? 'selected' : ''}>Lanches</option>
                <option value="frozen" ${item.category === 'frozen' ? 'selected' : ''}>Congelados</option>
                <option value="canned" ${item.category === 'canned' ? 'selected' : ''}>Enlatados</option>
                <option value="spices" ${item.category === 'spices' ? 'selected' : ''}>Temperos</option>
                <option value="grains" ${item.category === 'grains' ? 'selected' : ''}>Grãos</option>
                <option value="personal-care" ${item.category === 'personal-care' ? 'selected' : ''}>Cuidados pessoais</option>
                <option value="other" ${item.category === 'other' ? 'selected' : ''}>Outros</option>
            </select>
            <input type="text" value="${item.weight || ''}" placeholder="Peso" 
                onchange="updateItem(${index}, 'weight', this.value)">
            <input type="text" value="${item.price || ''}" placeholder="Valor" 
                onchange="updateItem(${index}, 'price', this.value)" 
                oninput="updateItem(${index}, 'price', this.value)"
                class="${item.price ? 'item-with-value' : ''}">
            <div>
                <button class="action-btn" onclick="editItem(${index})">✏️</button>
                <button class="action-btn" onclick="removeItem(${index})">❌</button>
            </div>
            <div class="item-check-row">
                <input type="checkbox" class="item-check" id="check${index}" onchange="toggleBought(${index})" ${item.bought ? 'checked' : ''}>
                <label for="check${index}">Já comprei</label>
            </div>
        `;
        marketList.appendChild(itemElement);
    });
}

// Compartilhar a página COM OS DADOS
function sharePage() {
    // Codificar os dados da lista para URL
    const jsonData = JSON.stringify(items);
    const encodedData = encodeURIComponent(jsonData);
    
    // Criar URL com os dados
    const currentUrl = window.location.href.split('?')[0]; // Remover parâmetros existentes
    const shareUrl = `${currentUrl}?data=${encodedData}`;
    
    // Verificar se a API de compartilhamento está disponível
    if (navigator.share) {
        navigator.share({
            title: 'Minha Lista de Compras - Market List',
            text: 'Confira minha lista de compras!',
            url: shareUrl
        }).then(() => {
            console.log('Lista compartilhada com sucesso!');
        }).catch(err => {
            console.error('Erro ao compartilhar:', err);
            copyToClipboard(shareUrl);
        });
    } else {
        // Fallback para copiar para a área de transferência
        copyToClipboard(shareUrl);
    }
}

// Copiar URL para a área de transferência
function copyToClipboard(url) {
    navigator.clipboard.writeText(url).then(() => {
        alert('Link da lista copiado! Agora você pode compartilhar com sua tia!');
    }).catch(err => {
        // Fallback para métodos mais antigos
        const textArea = document.createElement('textarea');
        textArea.value = url;
        document.body.appendChild(textArea);
        textArea.select();
        
        try {
            const successful = document.execCommand('copy');
            if (successful) {
                alert('Link da lista copiado! Agora você pode compartilhar com sua tia!');
            } else {
                alert('Não foi possível copiar o link. Tente manualmente: ' + url);
            }
        } catch (err) {
            alert('Não foi possível copiar o link. Tente manualmente: ' + url);
        }
        
        document.body.removeChild(textArea);
    });
}

// Salvar a lista com nome escolhido pelo usuário
function saveListWithName() {
    const listName = prompt('Digite um nome para sua lista:');
    if (!listName) {
        alert('Nome da lista não pode ser vazio!');
        return;
    }
    localStorage.setItem('marketList_' + listName, JSON.stringify(items));
    alert('Lista "' + listName + '" salva com sucesso!');
}

// Carregar uma lista salva pelo nome
function loadListByName() {
    const keys = Object.keys(localStorage).filter(k => k.startsWith('marketList_'));
    if (keys.length === 0) {
        alert('Nenhuma lista salva encontrada.');
        return;
    }
    const listNames = keys.map(k => k.replace('marketList_', ''));
    const listName = prompt('Listas salvas:\n' + listNames.join('\n') + '\n\nDigite o nome da lista para carregar:');
    if (!listName) return;
    const saved = localStorage.getItem('marketList_' + listName);
    if (!saved) {
        alert('Lista não encontrada!');
        return;
    }
    items = JSON.parse(saved);
    renderItems();
    updateTotals();
    saveItems();
}

// Editar um item existente
function editItem(index) {
    const item = items[index];
    document.getElementById('quantityInput').value = item.quantity;
    document.getElementById('itemInput').value = item.itemName;
    document.getElementById('categorySelect').value = item.category;
    document.getElementById('weightInput').value = item.weight || '';
    document.getElementById('priceInput').value = item.price || '';
    editingIndex = index;
}

// Remover um item da lista
function removeItem(index) {
    items.splice(index, 1);
    renderItems();
    updateTotals();
    saveItems();
}

// Atualizar totais de itens e valor
function updateTotals() {
    const totalItems = items.reduce((total, item) => total + parseInt(item.quantity || 1), 0);
    const totalPrice = items.reduce((total, item) => {
        if (item.price) {
            const price = parseFloat(item.price.toString().replace(',', '.')) || 0;
            return total + (price * parseInt(item.quantity || 1));
        }
        return total;
    }, 0);

    if (document.getElementById('totalItems'))
        document.getElementById('totalItems').textContent = totalItems;
    if (document.getElementById('totalPrice'))
        document.getElementById('totalPrice').textContent = `R$ ${totalPrice.toFixed(2).replace('.', ',')}`;
}

// Inicializar a aplicação
window.onload = function() {
    loadItems();
    document.getElementById('itemInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            addItem();
        }
    });
};