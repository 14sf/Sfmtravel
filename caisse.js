/**
 * ====================================
 * SFM - Caisse Management Module
 * Handles financial transactions and cash flow
 * ====================================
 */

class CaisseManager {
    constructor() {
        this.transactions = [];
        this.categories = [
            { id: 'revenus', name: 'Revenus', icon: 'fa-arrow-up', color: '#059669' },
            { id: 'voyage', name: 'Voyage', icon: 'fa-plane', color: '#2563eb' },
            { id: 'nourriture', name: 'Nourriture', icon: 'fa-utensils', color: '#d97706' },
            { id: 'transport', name: 'Transport', icon: 'fa-car', color: '#7c3aed' },
            { id: 'tontine', name: 'Tontine', icon: 'fa-users', color: '#059669' },
            { id: 'logement', name: 'Logement', icon: 'fa-home', color: '#dc2626' },
            { id: 'sante', name: 'Santé', icon: 'fa-heartbeat', color: '#ef4444' },
            { id: 'loisirs', name: 'Loisirs', icon: 'fa-gamepad', color: '#8b5cf6' },
            { id: 'shopping', name: 'Shopping', icon: 'fa-shopping-bag', color: '#f59e0b' },
            { id: 'autre', name: 'Autre', icon: 'fa-ellipsis-h', color: '#6b7280' }
        ];
        this.filters = {
            category: 'all',
            dateRange: 'all',
            type: 'all'
        };
        this.currentSort = { field: 'date', direction: 'desc' };
        this.init();
    }

    init() {
        this.loadData();
        this.setupEventListeners();
        this.setupCategoryDropdown();
        this.renderTransactions();
        this.updateStats();
        this.setupFilters();
        this.setupExportFeatures();
    }

    loadData() {
        if (window.appState) {
            this.transactions = window.appState.data.transactions || [];
        } else {
            this.transactions = JSON.parse(localStorage.getItem('sfm_transactions')) || [];
        }
    }

    saveData() {
        if (window.appState) {
            window.appState.saveData('transactions', this.transactions);
        } else {
            localStorage.setItem('sfm_transactions', JSON.stringify(this.transactions));
        }
    }

    setupEventListeners() {
        const caisseModule = document.getElementById('caisse');
        if (!caisseModule) return;

        // Add transaction form
        const addTransactionBtn = caisseModule.querySelector('.transaction-form .btn-primary');
        if (addTransactionBtn) {
            addTransactionBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.addTransaction();
            });
        }

        // Enter key on form inputs
        const formInputs = caisseModule.querySelectorAll('.transaction-form .form-input');
        formInputs.forEach(input => {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.addTransaction();
                }
            });
        });

        // Amount input validation
        const amountInput = caisseModule.querySelector('.transaction-form input[type="number"]');
        if (amountInput) {
            amountInput.addEventListener('input', this.validateAmount);
            amountInput.addEventListener('blur', this.formatAmountDisplay);
        }

        // Quick amount buttons
        this.createQuickAmountButtons();

        // Search functionality
        this.setupSearch();
    }

    setupCategoryDropdown() {
        const categorySelect = document.querySelector('#caisse .transaction-form select');
        if (!categorySelect) return;

        // Clear existing options
        categorySelect.innerHTML = '';

        // Add categories
        this.categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.name;
            option.setAttribute('data-icon', category.icon);
            categorySelect.appendChild(option);
        });
    }

    createQuickAmountButtons() {
        const amountInput = document.querySelector('#caisse .transaction-form input[type="number"]');
        if (!amountInput || document.querySelector('.quick-amounts')) return;

        const quickAmounts = [10, 20, 50, 100, 200, 500];
        const quickAmountContainer = document.createElement('div');
        quickAmountContainer.className = 'quick-amounts';
        quickAmountContainer.style.cssText = `
            display: flex;
            gap: 0.5rem;
            margin-top: 0.5rem;
            flex-wrap: wrap;
        `;

        quickAmounts.forEach(amount => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.textContent = `${amount}€`;
            btn.className = 'quick-amount-btn';
            btn.style.cssText = `
                padding: 0.25rem 0.5rem;
                border: 1px solid var(--border);
                background: var(--bg-white);
                border-radius: 4px;
                cursor: pointer;
                font-size: 0.75rem;
                transition: var(--transition);
            `;
            
            btn.addEventListener('click', () => {
                amountInput.value = amount;
                amountInput.focus();
            });

            btn.addEventListener('mouseenter', () => {
                btn.style.background = 'var(--primary)';
                btn.style.color = 'white';
            });

            btn.addEventListener('mouseleave', () => {
                btn.style.background = 'var(--bg-white)';
                btn.style.color = 'inherit';
            });

            quickAmountContainer.appendChild(btn);
        });

        amountInput.parentNode.appendChild(quickAmountContainer);
    }

    setupSearch() {
        const caisseModule = document.getElementById('caisse');
        if (!caisseModule || document.querySelector('.transaction-search')) return;

        const searchContainer = document.createElement('div');
        searchContainer.className = 'transaction-search';
        searchContainer.innerHTML = `
            <div style="display: flex; gap: 1rem; margin-bottom: 1rem; align-items: center;">
                <div style="flex: 1; position: relative;">
                    <input type="text" placeholder="Rechercher une transaction..." 
                           class="form-input search-input" id="transactionSearch">
                    <i class="fas fa-search" style="position: absolute; right: 1rem; top: 50%; transform: translateY(-50%); color: var(--text-light);"></i>
                </div>
                <button class="btn" id="toggleFilters">
                    <i class="fas fa-filter"></i> Filtres
                </button>
                <button class="btn" id="exportTransactions">
                    <i class="fas fa-download"></i> Export
                </button>
            </div>
        `;

        const transactionCard = caisseModule.querySelector('.card:last-child');
        transactionCard.insertBefore(searchContainer, transactionCard.firstChild);

        // Search functionality
        const searchInput = document.getElementById('transactionSearch');
        searchInput.addEventListener('input', this.debounce((e) => {
            this.searchTransactions(e.target.value);
        }, 300));

        // Toggle filters
        document.getElementById('toggleFilters').addEventListener('click', () => {
            this.toggleFilters();
        });

        // Export functionality
        document.getElementById('exportTransactions').addEventListener('click', () => {
            this.exportTransactions();
        });
    }

    setupFilters() {
        const caisseModule = document.getElementById('caisse');
        if (document.querySelector('.transaction-filters')) return;

        const filtersContainer = document.createElement('div');
        filtersContainer.className = 'transaction-filters';
        filtersContainer.style.display = 'none';
        filtersContainer.innerHTML = `
            <div class="card" style="margin-bottom: 1rem;">
                <h3>Filtres</h3>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-top: 1rem;">
                    <div class="form-group">
                        <label>Catégorie</label>
                        <select id="filterCategory" class="form-input">
                            <option value="all">Toutes les catégories</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Type</label>
                        <select id="filterType" class="form-input">
                            <option value="all">Tous les types</option>
                            <option value="income">Revenus uniquement</option>
                            <option value="expense">Dépenses uniquement</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Période</label>
                        <select id="filterDateRange" class="form-input">
                            <option value="all">Toute la période</option>
                            <option value="today">Aujourd'hui</option>
                            <option value="week">Cette semaine</option>
                            <option value="month">Ce mois</option>
                            <option value="year">Cette année</option>
                            <option value="custom">Période personnalisée</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Montant</label>
                        <div style="display: flex; gap: 0.5rem;">
                            <input type="number" placeholder="Min" class="form-input" id="filterAmountMin">
                            <input type="number" placeholder="Max" class="form-input" id="filterAmountMax">
                        </div>
                    </div>
                </div>
                <div id="customDateRange" style="display: none; margin-top: 1rem;">
                    <div style="display: flex; gap: 1rem;">
                        <div class="form-group" style="flex: 1;">
                            <label>Date de début</label>
                            <input type="date" id="filterDateStart" class="form-input">
                        </div>
                        <div class="form-group" style="flex: 1;">
                            <label>Date de fin</label>
                            <input type="date" id="filterDateEnd" class="form-input">
                        </div>
                    </div>
                </div>
                <div style="display: flex; gap: 1rem; margin-top: 1rem;">
                    <button class="btn btn-primary" id="applyFilters">Appliquer</button>
                    <button class="btn" id="clearFilters">Effacer</button>
                </div>
            </div>
        `;

        const searchContainer = caisseModule.querySelector('.transaction-search');
        searchContainer.insertAdjacentElement('afterend', filtersContainer);

        // Populate category filter
        const categoryFilter = document.getElementById('filterCategory');
        this.categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.name;
            categoryFilter.appendChild(option);
        });

        // Event listeners
        document.getElementById('filterDateRange').addEventListener('change', (e) => {
            document.getElementById('customDateRange').style.display = 
                e.target.value === 'custom' ? 'block' : 'none';
        });

        document.getElementById('applyFilters').addEventListener('click', () => {
            this.applyFilters();
        });

        document.getElementById('clearFilters').addEventListener('click', () => {
            this.clearFilters();
        });
    }

    addTransaction() {
        const caisseModule = document.getElementById('caisse');
        const inputs = caisseModule.querySelectorAll('.transaction-form .form-input');
        
        const description = inputs[0].value.trim();
        const amount = parseFloat(inputs[1].value);
        const category = inputs[2].value;

        // Validation
        if (!this.validateTransactionInput(description, amount, category)) {
            return;
        }

        const transaction = {
            id: this.generateId(),
            description,
            amount,
            category,
            date: new Date().toISOString(),
            type: amount > 0 ? 'income' : 'expense',
            createdBy: window.appState?.currentUser?.uid || 'demo-user',
            tags: this.extractTags(description),
            location: null // Could be added later with geolocation
        };

        this.transactions.unshift(transaction);
        this.saveData();
        
        // Clear form
        inputs[0].value = '';
        inputs[1].value = '';
        
        // Update UI
        this.renderTransactions();
        this.updateStats();
        
        // Show success message
        if (window.appState) {
            window.appState.showNotification(
                `Transaction ${amount > 0 ? 'de revenu' : 'de dépense'} ajoutée avec succès`, 
                'success'
            );
        }

        // Auto-focus on description for quick entry
        setTimeout(() => inputs[0].focus(), 100);
    }

    validateTransactionInput(description, amount, category) {
        if (!description) {
            this.showFieldError('Description requise');
            return false;
        }

        if (!amount || amount === 0) {
            this.showFieldError('Montant requis et différent de zéro');
            return false;
        }

        if (Math.abs(amount) > 1000000) {
            this.showFieldError('Montant trop élevé (max: 1,000,000€)');
            return false;
        }

        if (!category) {
            this.showFieldError('Catégorie requise');
            return false;
        }

        return true;
    }

    extractTags(description) {
        // Extract hashtags from description
        const hashtagRegex = /#(\w+)/g;
        const tags = [];
        let match;
        
        while ((match = hashtagRegex.exec(description)) !== null) {
            tags.push(match[1].toLowerCase());
        }
        
        return tags;
    }

    showFieldError(message) {
        if (window.appState) {
            window.appState.showNotification(message, 'error');
        } else {
            alert(message);
        }
    }

    validateAmount(e) {
        const value = e.target.value;
        const numValue = parseFloat(value);
        
        if (value && (isNaN(numValue) || Math.abs(numValue) > 1000000)) {
            e.target.style.borderColor = 'var(--error)';
        } else {
            e.target.style.borderColor = '';
        }
    }

    formatAmountDisplay(e) {
        const value = parseFloat(e.target.value);
        if (!isNaN(value)) {
            e.target.value = value.toFixed(2);
        }
    }

    updateStats() {
        const balance = this.transactions.reduce((sum, t) => sum + t.amount, 0);
        const thisMonth = new Date().getMonth();
        const thisYear = new Date().getFullYear();
        
        const monthlyTransactions = this.transactions.filter(t => {
            const date = new Date(t.date);
            return date.getMonth() === thisMonth && date.getFullYear() === thisYear;
        });
        
        const income = monthlyTransactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
        const expenses = monthlyTransactions.filter(t => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0);

        // Update caisse stats
        const caisseStats = document.querySelectorAll('#caisse .stat-value');
        if (caisseStats.length >= 3) {
            caisseStats[0].textContent = this.formatCurrency(balance);
            caisseStats[0].className = `stat-value ${balance >= 0 ? 'text-success' : 'text-error'}`;
            
            caisseStats[1].textContent = this.formatCurrency(income);
            caisseStats[2].textContent = this.formatCurrency(expenses);
        }

        // Update dashboard stats if available
        if (window.appState) {
            window.appState.updateDashboardStats();
        }

        // Update category breakdown
        this.updateCategoryBreakdown();
    }

    updateCategoryBreakdown() {
        const categoryBreakdown = this.calculateCategoryBreakdown();
        
        // Create or update category chart
        this.renderCategoryChart(categoryBreakdown);
    }

    calculateCategoryBreakdown() {
        const breakdown = {};
        
        this.categories.forEach(category => {
            breakdown[category.id] = {
                name: category.name,
                icon: category.icon,
                color: category.color,
                income: 0,
                expenses: 0,
                total: 0,
                count: 0
            };
        });

        this.transactions.forEach(transaction => {
            const category = breakdown[transaction.category];
            if (category) {
                if (transaction.amount > 0) {
                    category.income += transaction.amount;
                } else {
                    category.expenses += Math.abs(transaction.amount);
                }
                category.total += transaction.amount;
                category.count++;
            }
        });

        return breakdown;
    }

    renderCategoryChart(breakdown) {
        const caisseModule = document.getElementById('caisse');
        let chartContainer = caisseModule.querySelector('.category-chart');
        
        if (!chartContainer) {
            chartContainer = document.createElement('div');
            chartContainer.className = 'card category-chart';
            chartContainer.innerHTML = '<h2>Répartition par Catégorie</h2><div class="chart-content"></div>';
            caisseModule.appendChild(chartContainer);
        }

        const chartContent = chartContainer.querySelector('.chart-content');
        chartContent.innerHTML = '';

        // Simple bar chart representation
        Object.values(breakdown)
            .filter(cat => cat.count > 0)
            .sort((a, b) => Math.abs(b.total) - Math.abs(a.total))
            .forEach(category => {
                const categoryItem = document.createElement('div');
                categoryItem.className = 'category-item';
                categoryItem.style.cssText = `
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 1rem;
                    margin-bottom: 0.5rem;
                    background: var(--bg-light);
                    border-radius: 8px;
                    border-left: 4px solid ${category.color};
                `;

                categoryItem.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 1rem;">
                        <i class="fas ${category.icon}" style="color: ${category.color}; width: 20px;"></i>
                        <div>
                            <strong>${category.name}</strong>
                            <div style="color: var(--text-light); font-size: 0.875rem;">
                                ${category.count} transaction${category.count > 1 ? 's' : ''}
                            </div>
                        </div>
                    </div>
                    <div style="text-align: right;">
                        <div class="font-bold ${category.total >= 0 ? 'text-success' : 'text-error'}">
                            ${this.formatCurrency(category.total)}
                        </div>
                        ${category.income > 0 && category.expenses > 0 ? `
                            <div style="color: var(--text-light); font-size: 0.75rem;">
                                +${this.formatCurrency(category.income)} / -${this.formatCurrency(category.expenses)}
                            </div>
                        ` : ''}
                    </div>
                `;

                chartContent.appendChild(categoryItem);
            });
    }

    renderTransactions() {
        const transactionList = document.querySelector('#caisse .transaction-list');
        if (!transactionList) return;

        let filteredTransactions = this.getFilteredTransactions();
        
        // Apply sorting
        filteredTransactions = this.sortTransactions(filteredTransactions);

        transactionList.innerHTML = '';
        
        if (filteredTransactions.length === 0) {
            transactionList.innerHTML = `
                <div style="text-align: center; padding: 2rem; color: var(--text-light);">
                    <i class="fas fa-receipt" style="font-size: 3rem; margin-bottom: 1rem;"></i>
                    <p>Aucune transaction trouvée</p>
                </div>
            `;
            return;
        }
        
        filteredTransactions.slice(0, 50).forEach(transaction => {
            const item = this.createTransactionItem(transaction);
            transactionList.appendChild(item);
        });

        // Show load more button if there are more transactions
        if (filteredTransactions.length > 50) {
            const loadMoreBtn = document.createElement('button');
            loadMoreBtn.className = 'btn';
            loadMoreBtn.style.cssText = 'width: 100%; margin-top: 1rem;';
            loadMoreBtn.textContent = `Voir plus (${filteredTransactions.length - 50} restantes)`;
            loadMoreBtn.addEventListener('click', () => {
                // Load next 50 transactions
                this.loadMoreTransactions(50, 50);
            });
            transactionList.appendChild(loadMoreBtn);
        }
    }

    createTransactionItem(transaction) {
        const category = this.categories.find(cat => cat.id === transaction.category);
        const item = document.createElement('div');
        item.className = 'transaction-item';
        item.setAttribute('data-transaction-id', transaction.id);
        
        const date = new Date(transaction.date);
        const isToday = this.isToday(date);
        const isYesterday = this.isYesterday(date);
        
        let dateDisplay;
        if (isToday) {
            dateDisplay = `Aujourd'hui ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
        } else if (isYesterday) {
            dateDisplay = `Hier ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
        } else {
            dateDisplay = date.toLocaleDateString('fr-FR', { 
                day: '2-digit', 
                month: 'short', 
                year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined 
            });
        }

        item.innerHTML = `
            <div style="display: flex; align-items: center; gap: 1rem; flex: 1;">
                <div style="width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: ${category?.color}20;">
                    <i class="fas ${category?.icon || 'fa-circle'}" style="color: ${category?.color || 'var(--text-light)'};"></i>
                </div>
                <div>
                    <strong>${transaction.description}</strong>
                    <div style="color: var(--text-light); font-size: 0.875rem;">
                        ${category?.name || 'Autre'} • ${dateDisplay}
                    </div>
                    ${transaction.tags && transaction.tags.length > 0 ? `
                        <div style="margin-top: 0.25rem;">
                            ${transaction.tags.map(tag => `<span class="tag">#${tag}</span>`).join(' ')}
                        </div>
                    ` : ''}
                </div>
            </div>
            <div style="display: flex; align-items: center; gap: 1rem;">
                <div class="${transaction.amount > 0 ? 'amount-positive' : 'amount-negative'}">
                    ${transaction.amount > 0 ? '+' : ''}${this.formatCurrency(Math.abs(transaction.amount))}
                </div>
                <div class="transaction-actions">
                    <button class="action-btn edit-btn" onclick="caisseManager.editTransaction('${transaction.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete-btn" onclick="caisseManager.deleteTransaction('${transaction.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;

        // Add tag styles if not already added
        if (!document.querySelector('#tag-styles')) {
            const tagStyles = document.createElement('style');
            tagStyles.id = 'tag-styles';
            tagStyles.textContent = `
                .tag {
                    background: var(--primary);
                    color: white;
                    padding: 0.125rem 0.5rem;
                    border-radius: 12px;
                    font-size: 0.75rem;
                    margin-right: 0.25rem;
                }
                .transaction-actions {
                    opacity: 0;
                    transition: var(--transition);
                    display: flex;
                    gap: 0.5rem;
                }
                .transaction-item:hover .transaction-actions {
                    opacity: 1;
                }
                .action-btn {
                    border: none;
                    background: none;
                    cursor: pointer;
                    padding: 0.25rem;
                    border-radius: 4px;
                    color: var(--text-light);
                    transition: var(--transition);
                }
                .action-btn:hover {
                    background: var(--bg-light);
                    color: var(--text-dark);
                }
                .delete-btn:hover {
                    color: var(--error);
                }
                .edit-btn:hover {
                    color: var(--primary);
                }
            `;
            document.head.appendChild(tagStyles);
        }

        return item;
    }

    editTransaction(transactionId) {
        const transaction = this.transactions.find(t => t.id === transactionId);
        if (!transaction) return;

        // Create edit modal
        const modal = document.createElement('div');
        modal.className = 'edit-transaction-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Modifier la Transaction</h2>
                    <button class="close-modal">&times;</button>
                </div>
                <form id="editTransactionForm">
                    <div class="form-group">
                        <label>Description</label>
                        <input type="text" id="editDescription" class="form-input" value="${transaction.description}" required>
                    </div>
                    <div class="form-group">
                        <label>Montant (€)</label>
                        <input type="number" id="editAmount" class="form-input" value="${Math.abs(transaction.amount)}" step="0.01" required>
                    </div>
                    <div class="form-group">
                        <label>Type</label>
                        <select id="editType" class="form-input">
                            <option value="income" ${transaction.amount > 0 ? 'selected' : ''}>Revenu (+)</option>
                            <option value="expense" ${transaction.amount < 0 ? 'selected' : ''}>Dépense (-)</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Catégorie</label>
                        <select id="editCategory" class="form-input">
                            ${this.categories.map(cat => 
                                `<option value="${cat.id}" ${cat.id === transaction.category ? 'selected' : ''}>${cat.name}</option>`
                            ).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Date</label>
                        <input type="datetime-local" id="editDate" class="form-input" 
                               value="${new Date(transaction.date).toISOString().slice(0, 16)}" required>
                    </div>
                    <div class="modal-actions">
                        <button type="submit" class="btn btn-primary">Enregistrer</button>
                        <button type="button" class="btn" onclick="this.closest('.edit-transaction-modal').remove()">Annuler</button>
                    </div>
                </form>
            </div>
        `;

        this.addModalStyles(modal);
        document.body.appendChild(modal);

        // Handle form submission
        const form = modal.querySelector('#editTransactionForm');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveTransactionEdit(transactionId, modal);
        });

        // Close modal
        modal.querySelector('.close-modal').onclick = () => modal.remove();
        modal.onclick = (e) => {
            if (e.target === modal) modal.remove();
        };
    }

    saveTransactionEdit(transactionId, modal) {
        const description = document.getElementById('editDescription').value.trim();
        const amount = parseFloat(document.getElementById('editAmount').value);
        const type = document.getElementById('editType').value;
        const category = document.getElementById('editCategory').value;
        const date = new Date(document.getElementById('editDate').value);

        if (!description || !amount || amount <= 0) {
            this.showFieldError('Tous les champs sont requis');
            return;
        }

        const transactionIndex = this.transactions.findIndex(t => t.id === transactionId);
        if (transactionIndex !== -1) {
            this.transactions[transactionIndex] = {
                ...this.transactions[transactionIndex],
                description,
                amount: type === 'income' ? Math.abs(amount) : -Math.abs(amount),
                category,
                date: date.toISOString(),
                type,
                tags: this.extractTags(description),
                updatedAt: new Date().toISOString()
            };

            this.saveData();
            this.renderTransactions();
            this.updateStats();
            
            modal.remove();
            
            if (window.appState) {
                window.appState.showNotification('Transaction modifiée avec succès', 'success');
            }
        }
    }

    deleteTransaction(transactionId) {
        const transaction = this.transactions.find(t => t.id === transactionId);
        if (!transaction) return;

        if (confirm(`Êtes-vous sûr de vouloir supprimer cette transaction ?\n"${transaction.description}" - ${this.formatCurrency(Math.abs(transaction.amount))}`)) {
            this.transactions = this.transactions.filter(t => t.id !== transactionId);
            this.saveData();
            this.renderTransactions();
            this.updateStats();
            
            if (window.appState) {
                window.appState.showNotification('Transaction supprimée', 'success');
            }
        }
    }

    // Filtering and searching
    getFilteredTransactions() {
        let filtered = [...this.transactions];

        // Apply search
        if (this.searchQuery) {
            const query = this.searchQuery.toLowerCase();
            filtered = filtered.filter(t => 
                t.description.toLowerCase().includes(query) ||
                t.category.toLowerCase().includes(query) ||
                (t.tags && t.tags.some(tag => tag.includes(query)))
            );
        }

        // Apply filters
        if (this.filters.category !== 'all') {
            filtered = filtered.filter(t => t.category === this.filters.category);
        }

        if (this.filters.type !== 'all') {
            filtered = filtered.filter(t => t.type === this.filters.type);
        }

        if (this.filters.dateRange !== 'all') {
            filtered = this.filterByDateRange(filtered, this.filters.dateRange);
        }

        if (this.filters.amountMin !== undefined) {
            filtered = filtered.filter(t => Math.abs(t.amount) >= this.filters.amountMin);
        }

        if (this.filters.amountMax !== undefined) {
            filtered = filtered.filter(t => Math.abs(t.amount) <= this.filters.amountMax);
        }

        return filtered;
    }

    searchTransactions(query) {
        this.searchQuery = query;
        this.renderTransactions();
    }

    toggleFilters() {
        const filtersContainer = document.querySelector('.transaction-filters');
        if (filtersContainer) {
            const isVisible = filtersContainer.style.display !== 'none';
            filtersContainer.style.display = isVisible ? 'none' : 'block';
            
            const toggleBtn = document.getElementById('toggleFilters');
            toggleBtn.innerHTML = isVisible ? 
                '<i class="fas fa-filter"></i> Filtres' : 
                '<i class="fas fa-filter"></i> Masquer';
        }
    }

    applyFilters() {
        this.filters = {
            category: document.getElementById('filterCategory').value,
            type: document.getElementById('filterType').value,
            dateRange: document.getElementById('filterDateRange').value,
            amountMin: parseFloat(document.getElementById('filterAmountMin').value) || undefined,
            amountMax: parseFloat(document.getElementById('filterAmountMax').value) || undefined
        };

        if (this.filters.dateRange === 'custom') {
            this.filters.customDateStart = document.getElementById('filterDateStart').value;
            this.filters.customDateEnd = document.getElementById('filterDateEnd').value;
        }

        this.renderTransactions();
        this.updateCategoryBreakdown();
    }

    clearFilters() {
        this.filters = {
            category: 'all',
            dateRange: 'all',
            type: 'all'
        };
        
        // Reset form
        document.getElementById('filterCategory').value = 'all';
        document.getElementById('filterType').value = 'all';
        document.getElementById('filterDateRange').value = 'all';
        document.getElementById('filterAmountMin').value = '';
        document.getElementById('filterAmountMax').value = '';
        document.getElementById('customDateRange').style.display = 'none';
        
        this.searchQuery = '';
        document.getElementById('transactionSearch').value = '';
        
        this.renderTransactions();
        this.updateCategoryBreakdown();
    }

    filterByDateRange(transactions, range) {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        switch (range) {
            case 'today':
                return transactions.filter(t => {
                    const tDate = new Date(t.date);
                    return tDate >= today;
                });
            
            case 'week':
                const weekStart = new Date(today);
                weekStart.setDate(today.getDate() - today.getDay());
                return transactions.filter(t => new Date(t.date) >= weekStart);
            
            case 'month':
                const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
                return transactions.filter(t => new Date(t.date) >= monthStart);
            
            case 'year':
                const yearStart = new Date(now.getFullYear(), 0, 1);
                return transactions.filter(t => new Date(t.date) >= yearStart);
            
            case 'custom':
                if (this.filters.customDateStart && this.filters.customDateEnd) {
                    const start = new Date(this.filters.customDateStart);
                    const end = new Date(this.filters.customDateEnd);
                    end.setHours(23, 59, 59, 999); // Include full end date
                    return transactions.filter(t => {
                        const tDate = new Date(t.date);
                        return tDate >= start && tDate <= end;
                    });
                }
                return transactions;
            
            default:
                return transactions;
        }
    }

    sortTransactions(transactions) {
        return transactions.sort((a, b) => {
            let aVal, bVal;
            
            switch (this.currentSort.field) {
                case 'date':
                    aVal = new Date(a.date);
                    bVal = new Date(b.date);
                    break;
                case 'amount':
                    aVal = Math.abs(a.amount);
                    bVal = Math.abs(b.amount);
                    break;
                case 'description':
                    aVal = a.description.toLowerCase();
                    bVal = b.description.toLowerCase();
                    break;
                case 'category':
                    aVal = a.category;
                    bVal = b.category;
                    break;
                default:
                    aVal = new Date(a.date);
                    bVal = new Date(b.date);
            }
            
            if (this.currentSort.direction === 'asc') {
                return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
            } else {
                return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
            }
        });
    }

    // Export functionality
    setupExportFeatures() {
        // This was already handled in setupSearch method
    }

    exportTransactions() {
        const filteredTransactions = this.getFilteredTransactions();
        const csv = this.generateCSV(filteredTransactions);
        this.downloadCSV(csv, 'transactions-sfm.csv');
        
        if (window.appState) {
            window.appState.showNotification(`${filteredTransactions.length} transactions exportées`, 'success');
        }
    }

    generateCSV(transactions) {
        const headers = ['Date', 'Description', 'Catégorie', 'Type', 'Montant', 'Tags'];
        const rows = transactions.map(t => [
            new Date(t.date).toLocaleDateString('fr-FR'),
            `"${t.description.replace(/"/g, '""')}"`,
            this.categories.find(cat => cat.id === t.category)?.name || t.category,
            t.type === 'income' ? 'Revenu' : 'Dépense',
            t.amount.toFixed(2),
            t.tags ? t.tags.map(tag => `#${tag}`).join(' ') : ''
        ]);
        
        return [headers, ...rows].map(row => row.join(',')).join('\n');
    }

    downloadCSV(csv, filename) {
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }

    // Utility methods
    addModalStyles(modal) {
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
        `;
        
        const modalContent = modal.querySelector('.modal-content');
        modalContent.style.cssText = `
            background: var(--bg-white);
            border-radius: var(--border-radius);
            box-shadow: var(--shadow);
            max-width: 500px;
            width: 90%;
            max-height: 80vh;
            overflow-y: auto;
        `;
        
        const modalHeader = modal.querySelector('.modal-header');
        modalHeader.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1.5rem;
            border-bottom: 1px solid var(--border);
        `;
        
        const modalActions = modal.querySelector('.modal-actions');
        modalActions.style.cssText = `
            display: flex;
            gap: 1rem;
            margin-top: 2rem;
        `;
        
        modal.querySelector('form').style.padding = '2rem';
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    generateId() {
        return Date.now() + Math.random().toString(36).substr(2, 9);
    }

    formatCurrency(amount) {
        return Math.abs(amount).toLocaleString('fr-FR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }) + ' €';
    }

    isToday(date) {
        const today = new Date();
        return date.toDateString() === today.toDateString();
    }

    isYesterday(date) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        return date.toDateString() === yesterday.toDateString();
    }

    // Public method to refresh data (called from navigation)
    refreshData() {
        this.loadData();
        this.renderTransactions();
        this.updateStats();
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Wait for app state to be available
    if (document.getElementById('caisse')) {
        window.caisseManager = new CaisseManager();
    }
});

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CaisseManager;
}