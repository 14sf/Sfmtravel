        quickActions.className = 'tontine-quick-actions card';
        quickActions.innerHTML = `
            <h3>Actions Rapides</h3>
            <div class="quick-actions-grid">
                <button class="quick-action" onclick="tontineManager.showCreateTontineModal()">
                    <i class="fas fa-plus"></i>
                    <span>Nouvelle tontine</span>
                </button>
                <button class="quick-action" onclick="tontineManager.recordQuickContribution()">
                    <i class="fas fa-euro-sign"></i>
                    <span>Contribution rapide</span>
                </button>
                <button class="quick-action" onclick="tontineManager.checkDueDates()">
                    <i class="fas fa-calendar-exclamation"></i>
                    <span>Échéances</span>
                </button>
                <button class="quick-action" onclick="tontineManager.generateReport()">
                    <i class="fas fa-chart-bar"></i>
                    <span>Rapport</span>
                </button>
            </div>
        `;

        // Insert before navigation
        const navElement = tontineModule.querySelector('.tontine-nav');
        if (navElement) {
            navElement.insertAdjacentElement('beforebegin', quickActions);
        } else {
            tontineModule.insertBefore(quickActions, tontineModule.firstChild);
        }
    }

    recordQuickContribution() {
        if (this.tontines.length === 0) {
            this.showError('Aucune tontine disponible');
            return;
        }

        // If only one tontine, use it directly
        if (this.tontines.length === 1) {
            this.addContribution(this.tontines[0].id);
            return;
        }

        // Show tontine selector
        const modal = document.createElement('div');
        modal.className = 'quick-contribution-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Contribution Rapide</h2>
                    <button class="close-modal">&times;</button>
                </div>
                <div class="quick-contrib-selector">
                    <p>Sélectionnez une tontine :</p>
                    <div class="tontine-options">
                        ${this.tontines.filter(t => t.status === 'active').map(tontine => `
                            <button class="tontine-option" onclick="tontineManager.addContribution('${tontine.id}'); this.closest('.quick-contribution-modal').remove();">
                                <div class="option-header">
                                    <strong>${tontine.name}</strong>
                                    <span class="contribution-amount">${tontine.monthlyAmount}€</span>
                                </div>
                                <div class="option-details">
                                    ${tontine.totalMembers} membres • Tour ${tontine.currentRound}/${tontine.totalRounds}
                                </div>
                            </button>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;

        this.addModalStyles(modal);
        document.body.appendChild(modal);

        // Close modal
        modal.querySelector('.close-modal').onclick = () => modal.remove();
        modal.onclick = (e) => {
            if (e.target === modal) modal.remove();
        };
    }

    checkDueDates() {
        const today = new Date();
        const dueSoon = [];
        const overdue = [];

        this.tontines.forEach(tontine => {
            if (tontine.status !== 'active') return;

            const nextPayoutDate = new Date(tontine.nextPayoutDate);
            const daysUntil = Math.ceil((nextPayoutDate - today) / (1000 * 60 * 60 * 24));

            if (daysUntil < 0) {
                overdue.push({ ...tontine, daysOverdue: Math.abs(daysUntil) });
            } else if (daysUntil <= 7) {
                dueSoon.push({ ...tontine, daysUntil });
            }
        });

        const modal = document.createElement('div');
        modal.className = 'due-dates-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Échéances des Tontines</h2>
                    <button class="close-modal">&times;</button>
                </div>
                <div class="due-dates-content">
                    ${overdue.length > 0 ? `
                        <div class="due-section overdue">
                            <h3><i class="fas fa-exclamation-triangle"></i> En retard</h3>
                            ${overdue.map(tontine => `
                                <div class="due-item">
                                    <div class="due-info">
                                        <strong>${tontine.name}</strong>
                                        <span class="due-text">En retard de ${tontine.daysOverdue} jour${tontine.daysOverdue > 1 ? 's' : ''}</span>
                                    </div>
                                    <button class="btn btn-primary btn-sm" onclick="tontineManager.addContribution('${tontine.id}')">
                                        Enregistrer
                                    </button>
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}
                    
                    ${dueSoon.length > 0 ? `
                        <div class="due-section due-soon">
                            <h3><i class="fas fa-clock"></i> Bientôt dues</h3>
                            ${dueSoon.map(tontine => `
                                <div class="due-item">
                                    <div class="due-info">
                                        <strong>${tontine.name}</strong>
                                        <span class="due-text">Dans ${tontine.daysUntil} jour${tontine.daysUntil > 1 ? 's' : ''}</span>
                                    </div>
                                    <button class="btn btn-primary btn-sm" onclick="tontineManager.addContribution('${tontine.id}')">
                                        Enregistrer
                                    </button>
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}
                    
                    ${overdue.length === 0 && dueSoon.length === 0 ? `
                        <div class="no-due-dates">
                            <i class="fas fa-check-circle"></i>
                            <h3>Tout est à jour !</h3>
                            <p>Aucune échéance urgente pour le moment.</p>
                        </div>
                    ` : ''}
                </div>
                <div class="modal-footer">
                    <button class="btn" onclick="this.closest('.due-dates-modal').remove()">Fermer</button>
                </div>
            </div>
        `;

        this.addModalStyles(modal);
        document.body.appendChild(modal);

        // Close modal
        modal.querySelector('.close-modal').onclick = () => modal.remove();
        modal.onclick = (e) => {
            if (e.target === modal) modal.remove();
        };
    }

    generateReport() {
        const reportData = this.calculateReportData();
        
        const modal = document.createElement('div');
        modal.className = 'report-modal';
        modal.innerHTML = `
            <div class="modal-content large">
                <div class="modal-header">
                    <h2>Rapport des Tontines</h2>
                    <button class="close-modal">&times;</button>
                </div>
                <div class="report-content">
                    <div class="report-summary">
                        <h3>Résumé Global</h3>
                        <div class="summary-stats">
                            <div class="summary-stat">
                                <span class="stat-label">Tontines actives</span>
                                <span class="stat-value">${reportData.activeTontines}</span>
                            </div>
                            <div class="summary-stat">
                                <span class="stat-label">Total des membres</span>
                                <span class="stat-value">${reportData.totalMembers}</span>
                            </div>
                            <div class="summary-stat">
                                <span class="stat-label">Montant total collecté</span>
                                <span class="stat-value">${reportData.totalCollected.toLocaleString()}€</span>
                            </div>
                            <div class="summary-stat">
                                <span class="stat-label">Taux de paiement</span>
                                <span class="stat-value">${reportData.paymentRate}%</span>
                            </div>
                        </div>
                    </div>

                    <div class="report-details">
                        <h3>Détails par Tontine</h3>
                        <div class="report-table">
                            <div class="table-header">
                                <div>Nom</div>
                                <div>Membres</div>
                                <div>Contribution</div>
                                <div>Total collecté</div>
                                <div>Tour actuel</div>
                                <div>Statut</div>
                            </div>
                            ${this.tontines.map(tontine => {
                                const members = this.members.filter(m => m.tontineId === tontine.id);
                                const contributions = this.contributions.filter(c => c.tontineId === tontine.id && c.status === 'paid');
                                const totalCollected = contributions.reduce((sum, c) => sum + c.amount, 0);
                                
                                return `
                                    <div class="table-row">
                                        <div><strong>${tontine.name}</strong></div>
                                        <div>${members.length}/${tontine.maxMembers}</div>
                                        <div>${tontine.monthlyAmount}€</div>
                                        <div>${totalCollected.toLocaleString()}€</div>
                                        <div>${tontine.currentRound}/${tontine.totalRounds}</div>
                                        <div><span class="status-badge ${tontine.status}">${tontine.status}</span></div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>

                    <div class="report-charts">
                        <h3>Analyse des Contributions</h3>
                        <div class="charts-grid">
                            <div class="chart-container">
                                <h4>Contributions par Mois</h4>
                                <div class="simple-chart">
                                    ${this.createMonthlyChart(reportData.monthlyData)}
                                </div>
                            </div>
                            <div class="chart-container">
                                <h4>Répartition par Tontine</h4>
                                <div class="pie-chart">
                                    ${this.createPieChart(reportData.tontineDistribution)}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-primary" onclick="tontineManager.exportReport()">
                        <i class="fas fa-download"></i> Exporter PDF
                    </button>
                    <button class="btn" onclick="this.closest('.report-modal').remove()">Fermer</button>
                </div>
            </div>
        `;

        this.addModalStyles(modal);
        modal.querySelector('.modal-content').style.maxWidth = '900px';
        document.body.appendChild(modal);

        // Close modal
        modal.querySelector('.close-modal').onclick = () => modal.remove();
        modal.onclick = (e) => {
            if (e.target === modal) modal.remove();
        };
    }

    calculateReportData() {
        const activeTontines = this.tontines.filter(t => t.status === 'active').length;
        const totalMembers = this.members.filter(m => m.status === 'active').length;
        const totalCollected = this.contributions.filter(c => c.status === 'paid').reduce((sum, c) => sum + c.amount, 0);
        const totalContributions = this.contributions.length;
        const paidContributions = this.contributions.filter(c => c.status === 'paid').length;
        const paymentRate = totalContributions > 0 ? Math.round((paidContributions / totalContributions) * 100) : 0;

        // Monthly data for chart
        const monthlyData = this.calculateMonthlyData();
        
        // Tontine distribution
        const tontineDistribution = this.tontines.map(tontine => ({
            name: tontine.name,
            amount: this.contributions.filter(c => c.tontineId === tontine.id && c.status === 'paid').reduce((sum, c) => sum + c.amount, 0)
        }));

        return {
            activeTontines,
            totalMembers,
            totalCollected,
            paymentRate,
            monthlyData,
            tontineDistribution
        };
    }

    calculateMonthlyData() {
        const monthlyData = {};
        
        this.contributions.forEach(contribution => {
            if (contribution.status !== 'paid') return;
            
            const date = new Date(contribution.date);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            
            if (!monthlyData[monthKey]) {
                monthlyData[monthKey] = 0;
            }
            monthlyData[monthKey] += contribution.amount;
        });

        return monthlyData;
    }

    createMonthlyChart(monthlyData) {
        const sortedMonths = Object.keys(monthlyData).sort();
        const maxAmount = Math.max(...Object.values(monthlyData));
        
        return sortedMonths.map(month => {
            const amount = monthlyData[month];
            const height = maxAmount > 0 ? (amount / maxAmount) * 100 : 0;
            const [year, monthNum] = month.split('-');
            const monthName = new Date(parseInt(year), parseInt(monthNum) - 1).toLocaleDateString('fr-FR', { month: 'short' });
            
            return `
                <div class="chart-bar" title="${amount}€">
                    <div class="bar-fill" style="height: ${height}%;"></div>
                    <div class="bar-label">${monthName}</div>
                </div>
            `;
        }).join('');
    }

    createPieChart(tontineDistribution) {
        const total = tontineDistribution.reduce((sum, t) => sum + t.amount, 0);
        if (total === 0) return '<p>Aucune donnée disponible</p>';
        
        return tontineDistribution.map(tontine => {
            const percentage = Math.round((tontine.amount / total) * 100);
            return `
                <div class="pie-item">
                    <div class="pie-color" style="background: ${this.getRandomColor()};"></div>
                    <span>${tontine.name}: ${percentage}%</span>
                </div>
            `;
        }).join('');
    }

    getRandomColor() {
        const colors = ['#2563eb', '#059669', '#d97706', '#dc2626', '#8b5cf6', '#0ea5e9'];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    exportReport() {
        // Mock PDF export
        if (window.appState) {
            window.appState.showNotification('Rapport exporté (fonctionnalité simulée)', 'info');
        }
        
        // In a real implementation, you would use a library like jsPDF
        console.log('Exporting tontine report...');
    }

    // Member and contribution management
    editMember(memberId) {
        const member = this.members.find(m => m.id === memberId);
        if (!member) return;

        const modal = document.createElement('div');
        modal.className = 'edit-member-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Modifier le Membre</h2>
                    <button class="close-modal">&times;</button>
                </div>
                <form id="editMemberForm">
                    <div class="form-group">
                        <label>Nom complet</label>
                        <input type="text" name="name" class="form-input" value="${member.name}" required>
                    </div>
                    <div class="form-group">
                        <label>Email</label>
                        <input type="email" name="email" class="form-input" value="${member.email}" required>
                    </div>
                    <div class="form-group">
                        <label>Téléphone</label>
                        <input type="tel" name="phone" class="form-input" value="${member.phone || ''}">
                    </div>
                    <div class="form-group">
                        <label>Position</label>
                        <input type="number" name="position" class="form-input" value="${member.position}" min="1" required>
                    </div>
                    <div class="form-group">
                        <label>Statut</label>
                        <select name="status" class="form-input">
                            <option value="active" ${member.status === 'active' ? 'selected' : ''}>Actif</option>
                            <option value="inactive" ${member.status === 'inactive' ? 'selected' : ''}>Inactif</option>
                        </select>
                    </div>
                    <div class="modal-actions">
                        <button type="submit" class="btn btn-primary">Sauvegarder</button>
                        <button type="button" class="btn" onclick="this.closest('.edit-member-modal').remove()">Annuler</button>
                    </div>
                </form>
            </div>
        `;

        this.addModalStyles(modal);
        document.body.appendChild(modal);

        // Handle form submission
        const form = modal.querySelector('#editMemberForm');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveMemberEdit(memberId, form, modal);
        });

        // Close modal
        modal.querySelector('.close-modal').onclick = () => modal.remove();
        modal.onclick = (e) => {
            if (e.target === modal) modal.remove();
        };
    }

    saveMemberEdit(memberId, form, modal) {
        const formData = new FormData(form);
        const editData = Object.fromEntries(formData.entries());

        const memberIndex = this.members.findIndex(m => m.id === memberId);
        if (memberIndex !== -1) {
            this.members[memberIndex] = {
                ...this.members[memberIndex],
                name: editData.name.trim(),
                email: editData.email.trim(),
                phone: editData.phone.trim(),
                position: parseInt(editData.position),
                status: editData.status,
                updatedAt: new Date().toISOString()
            };

            this.saveData();
            modal.remove();
            this.renderCurrentView();

            if (window.appState) {
                window.appState.showNotification('Membre modifié', 'success');
            }
        }
    }

    removeMember(memberId) {
        const member = this.members.find(m => m.id === memberId);
        if (!member) return;

        if (confirm(`Êtes-vous sûr de vouloir retirer ${member.name} de la tontine ?`)) {
            // Update tontine member count
            const tontine = this.tontines.find(t => t.id === member.tontineId);
            if (tontine) {
                tontine.totalMembers--;
            }

            // Remove member
            this.members = this.members.filter(m => m.id !== memberId);
            
            this.saveData();
            this.renderCurrentView();

            if (window.appState) {
                window.appState.showNotification('Membre retiré', 'success');
            }
        }
    }

    markAsPaid(contributionId) {
        const contribution = this.contributions.find(c => c.id === contributionId);
        if (!contribution) return;

        contribution.status = 'paid';
        contribution.updatedAt = new Date().toISOString();

        // Update tontine total
        const tontine = this.tontines.find(t => t.id === contribution.tontineId);
        if (tontine) {
            tontine.totalCollected += contribution.amount + contribution.penalty;
        }

        this.saveData();
        this.renderCurrentView();

        if (window.appState) {
            window.appState.showNotification('Contribution marquée comme payée', 'success');
        }
    }

    // Menu and navigation actions
    showTontineMenu(tontineId, event) {
        event.stopPropagation();
        
        // Remove existing menu
        document.querySelector('.tontine-context-menu')?.remove();

        const menu = document.createElement('div');
        menu.className = 'tontine-context-menu';
        menu.innerHTML = `
            <div class="menu-item" onclick="tontineManager.editTontine('${tontineId}')">
                <i class="fas fa-edit"></i> Modifier
            </div>
            <div class="menu-item" onclick="tontineManager.addMember('${tontineId}')">
                <i class="fas fa-user-plus"></i> Ajouter membre
            </div>
            <div class="menu-item" onclick="tontineManager.addContribution('${tontineId}')">
                <i class="fas fa-euro-sign"></i> Contribution
            </div>
            <div class="menu-item" onclick="tontineManager.viewTontineReport('${tontineId}')">
                <i class="fas fa-chart-bar"></i> Rapport
            </div>
            <div class="menu-item danger" onclick="tontineManager.deleteTontine('${tontineId}')">
                <i class="fas fa-trash"></i> Supprimer
            </div>
        `;

        // Position menu
        const rect = event.target.getBoundingClientRect();
        menu.style.cssText = `
            position: fixed;
            top: ${rect.bottom + 5}px;
            left: ${rect.left - 150}px;
            background: var(--bg-white);
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.15);
            z-index: 1000;
            min-width: 160px;
            border: 1px solid var(--border);
        `;

        document.body.appendChild(menu);

        // Close menu when clicking outside
        setTimeout(() => {
            document.addEventListener('click', function closeMenu() {
                menu.remove();
                document.removeEventListener('click', closeMenu);
            });
        }, 100);
    }

    editTontine(tontineId) {
        // Similar to createTontine but for editing
        if (window.appState) {
            window.appState.showNotification('Fonctionnalité d\'édition en développement', 'info');
        }
    }

    deleteTontine(tontineId) {
        const tontine = this.tontines.find(t => t.id === tontineId);
        if (!tontine) return;

        if (confirm(`Êtes-vous sûr de vouloir supprimer la tontine "${tontine.name}" ? Cette action est irréversible.`)) {
            // Remove tontine and all related data
            this.tontines = this.tontines.filter(t => t.id !== tontineId);
            this.members = this.members.filter(m => m.tontineId !== tontineId);
            this.contributions = this.contributions.filter(c => c.tontineId !== tontineId);

            this.saveData();
            this.renderCurrentView();

            if (window.appState) {
                window.appState.showNotification('Tontine supprimée', 'success');
            }
        }
    }

    // Filters and export
    filterHistory() {
        const tontineFilter = document.getElementById('tontineHistoryFilter').value;
        const statusFilter = document.getElementById('statusHistoryFilter').value;

        let filteredContributions = [...this.contributions];

        if (tontineFilter !== 'all') {
            filteredContributions = filteredContributions.filter(c => c.tontineId === tontineFilter);
        }

        if (statusFilter !== 'all') {
            filteredContributions = filteredContributions.filter(c => c.status === statusFilter);
        }

        // Re-render with filtered data
        this.renderFilteredHistory(filteredContributions);
    }

    renderFilteredHistory(contributions) {
        const groupedByMonth = this.groupContributionsByMonth(contributions.sort((a, b) => new Date(b.date) - new Date(a.date)));
        
        const timeline = document.querySelector('.history-timeline');
        timeline.innerHTML = Object.entries(groupedByMonth).map(([monthKey, contributions]) => `
            <div class="timeline-month">
                <div class="month-header">
                    <h3>${this.formatMonthYear(monthKey)}</h3>
                    <div class="month-stats">
                        <span class="stat">
                            ${contributions.filter(c => c.status === 'paid').length} payées
                        </span>
                        <span class="stat">
                            ${contributions.filter(c => c.status === 'missed').length} manquées
                        </span>
                        <span class="stat">
                            ${contributions.reduce((sum, c) => sum + (c.status === 'paid' ? c.amount : 0), 0)}€
                        </span>
                    </div>
                </div>
                <div class="month-contributions">
                    ${contributions.map(contribution => this.createContributionHistoryItem(contribution)).join('')}
                </div>
            </div>
        `).join('');
    }

    exportHistory() {
        const contributions = this.contributions.sort((a, b) => new Date(b.date) - new Date(a.date));
        const csv = this.generateContributionsCSV(contributions);
        this.downloadCSV(csv, 'historique-tontines-sfm.csv');
        
        if (window.appState) {
            window.appState.showNotification(`${contributions.length} contributions exportées`, 'success');
        }
    }

    generateContributionsCSV(contributions) {
        const headers = [
            'Date', 'Tontine', 'Membre', 'Montant', 'Pénalité', 'Statut', 
            'Tour', 'Méthode de paiement'
        ];
        
        const rows = contributions.map(contribution => {
            const tontine = this.tontines.find(t => t.id === contribution.tontineId);
            return [
                new Date(contribution.date).toLocaleDateString('fr-FR'),
                tontine ? tontine.name : 'Tontine supprimée',
                `"${contribution.memberName.replace(/"/g, '""')}"`,
                contribution.amount.toFixed(2),
                contribution.penalty.toFixed(2),
                contribution.status === 'paid' ? 'Payé' : 'Manqué',
                contribution.round,
                contribution.paymentMethod || ''
            ];
        });
        
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

    // Styles and utilities
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
            max-height: 90vh;
            overflow-y: auto;
        `;
    }

    addNavigationStyles() {
        if (document.querySelector('#tontine-nav-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'tontine-nav-styles';
        styles.textContent = `
            .tontine-nav {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 2rem;
                background: var(--bg-white);
                padding: 1rem 1.5rem;
                border-radius: var(--border-radius);
                box-shadow: var(--shadow);
            }
            
            .nav-tabs {
                display: flex;
                gap: 0.5rem;
            }
            
            .nav-tab {
                padding: 0.75rem 1.5rem;
                border: 1px solid var(--border);
                background: var(--bg-white);
                color: var(--text-dark);
                border-radius: 8px;
                cursor: pointer;
                transition: var(--transition);
                display: flex;
                align-items: center;
                gap: 0.5rem;
                font-weight: 500;
            }
            
            .nav-tab:hover {
                background: var(--bg-light);
            }
            
            .nav-tab.active {
                background: var(--primary);
                color: white;
                border-color: var(--primary);
            }
            
            .nav-actions {
                display: flex;
                gap: 1rem;
            }
            
            .stats-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 1.5rem;
                margin-bottom: 2rem;
            }
            
            .stat-card {
                background: var(--bg-white);
                padding: 1.5rem;
                border-radius: var(--border-radius);
                box-shadow: var(--shadow);
                display: flex;
                align-items: center;
                gap: 1rem;
            }
            
            .stat-icon {
                width: 50px;
                height: 50px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-size: 1.5rem;
            }
            
            .stat-content {
                flex: 1;
            }
            
            .stat-value {
                font-size: 1.8rem;
                font-weight: 700;
                color: var(--text-dark);
                line-height: 1;
                margin-bottom: 0.25rem;
            }
            
            .stat-label {
                color: var(--text-light);
                font-size: 0.875rem;
                font-weight: 500;
            }
            
            .tontines-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
                gap: 1.5rem;
            }
            
            .tontine-card {
                background: var(--bg-white);
                border-radius: var(--border-radius);
                box-shadow: var(--shadow);
                padding: 1.5rem;
                transition: var(--transition);
            }
            
            .tontine-card:hover {
                transform: translateY(-2px);
                box-shadow: 0 8px 25px rgba(0,0,0,0.15);
            }
            
            .tontine-header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                margin-bottom: 1rem;
            }
            
            .tontine-info h3 {
                margin-bottom: 0.5rem;
                color: var(--text-dark);
            }
            
            .tontine-info p {
                color: var(--text-light);
                margin: 0;
            }
            
            .status-badge {
                padding: 0.25rem 0.75rem;
                border-radius: 12px;
                font-size: 0.75rem;
                font-weight: 600;
                text-transform: uppercase;
            }
            
            .status-badge.active {
                background: var(--success);
                color: white;
            }
            
            .status-badge.draft {
                background: var(--warning);
                color: white;
            }
            
            .status-badge.inactive {
                background: var(--error);
                color: white;
            }
            
            .tontine-details {
                margin-bottom: 1.5rem;
            }
            
            .detail-row {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 0.75rem;
            }
            
            .detail-label {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                color: var(--text-light);
                font-size: 0.875rem;
            }
            
            .detail-value {
                font-weight: 600;
                color: var(--text-dark);
            }
            
            .tontine-progress {
                margin-bottom: 1.5rem;
            }
            
            .progress-info {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 0.5rem;
                font-size: 0.875rem;
                color: var(--text-light);
            }
            
            .progress-bar {
                height: 8px;
                background: var(--bg-light);
                border-radius: 4px;
                overflow: hidden;
            }
            
            .progress-fill {
                height: 100%;
                background: linear-gradient(90deg, var(--primary), var(--primary-dark));
                transition: width 0.3s ease;
            }
            
            .tontine-members-preview {
                margin-bottom: 1.5rem;
            }
            
            .members-avatars {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                margin-bottom: 0.75rem;
            }
            
            .member-avatar {
                width: 32px;
                height: 32px;
                border-radius: 50%;
                background: var(--primary);
                color: white;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 0.75rem;
                font-weight: 600;
            }
            
            .member-avatar.small {
                width: 24px;
                height: 24px;
                font-size: 0.6rem;
            }
            
            .member-more {
                width: 32px;
                height: 32px;
                border-radius: 50%;
                background: var(--bg-light);
                color: var(--text-light);
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 0.75rem;
                font-weight: 600;
                border: 2px solid var(--border);
            }
            
            .next-payout-info {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                color: var(--text-light);
                font-size: 0.875rem;
            }
            
            .tontine-actions {
                display: flex;
                gap: 0.5rem;
                align-items: center;
            }
            
            .tontine-menu {
                margin-left: auto;
            }
            
            .tontine-context-menu {
                background: var(--bg-white);
                border-radius: 8px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.15);
                border: 1px solid var(--border);
                overflow: hidden;
            }
            
            .menu-item {
                padding: 0.75rem 1rem;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 0.5rem;
                transition: var(--transition);
                border-bottom: 1px solid var(--border);
            }
            
            .menu-item:last-child {
                border-bottom: none;
            }
            
            .menu-item:hover {
                background: var(--bg-light);
            }
            
            .menu-item.danger {
                color: var(--error);
            }
            
            .menu-item.danger:hover {
                background: var(--error);
                color: white;
            }
            
            .members-list {
                max-height: 300px;
                overflow-y: auto;
                margin-bottom: 1rem;
            }
            
            .member-item {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 1rem;
                border: 1px solid var(--border);
                border-radius: 8px;
                margin-bottom: 0.5rem;
                transition: var(--transition);
            }
            
            .member-item:hover {
                background: var(--bg-light);
            }
            
            .member-info {
                display: flex;
                align-items: center;
                gap: 1rem;
                flex: 1;
            }
            
            .member-details {
                flex: 1;
            }
            
            .member-name {
                font-weight: 600;
                color: var(--text-dark);
                margin-bottom: 0.25rem;
            }
            
            .member-contact {
                display: flex;
                gap: 0.5rem;
            }
            
            .member-contact a {
                color: var(--text-light);
                text-decoration: none;
                transition: var(--transition);
            }
            
            .member-contact a:hover {
                color: var(--primary);
            }
            
            .member-stats {
                display: flex;
                flex-direction: column;
                align-items: flex-end;
                gap: 0.5rem;
                margin-right: 1rem;
            }
            
            .member-position {
                background: var(--bg-light);
                color: var(--text-dark);
                padding: 0.25rem 0.5rem;
                border-radius: 12px;
                font-size: 0.75rem;
                font-weight: 600;
            }
            
            .member-status {
                font-size: 0.75rem;
                font-weight: 600;
            }
            
            .member-status.active {
                color: var(--success);
            }
            
            .contribution-rate {
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }
            
            .rate-bar {
                width: 50px;
                height: 4px;
                background: var(--bg-light);
                border-radius: 2px;
                overflow: hidden;
            }
            
            .rate-fill {
                height: 100%;
                background: var(--success);
                transition: width 0.3s ease;
            }
            
            .member-actions {
                display: flex;
                gap: 0.5rem;
            }
            
            .action-btn {
                border: none;
                background: var(--bg-light);
                color: var(--text-light);
                padding: 0.5rem;
                border-radius: 4px;
                cursor: pointer;
                transition: var(--transition);
            }
            
            .action-btn:hover {
                background: var(--primary);
                color: white;
            }
            
            .contributions-table {
                border: 1px solid var(--border);
                border-radius: 8px;
                overflow: hidden;
            }
            
            .table-header {
                display: grid;
                grid-template-columns: 2fr 1fr 1fr 1fr 1fr;
                gap: 1rem;
                padding: 1rem;
                background: var(--bg-light);
                font-weight: 600;
                color: var(--text-dark);
            }
            
            .table-row {
                display: grid;
                grid-template-columns: 2fr 1fr 1fr 1fr 1fr;
                gap: 1rem;
                padding: 1rem;
                border-bottom: 1px solid var(--border);
                align-items: center;
            }
            
            .table-row:last-child {
                border-bottom: none;
            }
            
            .table-row:hover {
                background: var(--bg-light);
            }
            
            .amount.paid {
                color: var(--success);
                font-weight: 600;
            }
            
            .amount.missed {
                color: var(--error);
                font-weight: 600;
            }
            
            .status-badge.paid {
                background: var(--success);
                color: white;
            }
            
            .status-badge.missed {
                background: var(--error);
                color: white;
            }
            
            .no-contributions {
                text-align: center;
                padding: 2rem;
                color: var(--text-light);
            }
            
            .no-contributions i {
                font-size: 2rem;
                margin-bottom: 1rem;
                opacity: 0.5;
            }
            
            .history-timeline {
                max-height: 600px;
                overflow-y: auto;
            }
            
            .timeline-month {
                margin-bottom: 2rem;
            }
            
            .month-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 1rem;
                background: var(--bg-light);
                border-radius: 8px;
                margin-bottom: 1rem;
            }
            
            .month-stats {
                display: flex;
                gap: 1rem;
            }
            
            .month-stats .stat {
                font-size: 0.875rem;
                color: var(--text-light);
            }
            
            .month-contributions {
                display: flex;
                flex-direction: column;
                gap: 0.5rem;
            }
            
            .contribution-history-item {
                display: flex;
                align-items: center;
                gap: 1rem;
                padding: 1rem;
                background: var(--bg-white);
                border: 1px solid var(--border);
                border-radius: 8px;
                transition: var(--transition);
            }
            
            .contribution-history-item:hover {
                box-shadow: var(--shadow);
            }
            
            .contribution-icon {
                width: 40px;
                height: 40px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
            }
            
            .contribution-icon.paid {
                background: var(--success);
            }
            
            .contribution-icon.missed {
                background: var(--error);
            }
            
            .contribution-details {
                flex: 1;
            }
            
            .contribution-main {
                display: flex;
                align-items: center;
                gap: 1rem;
                margin-bottom: 0.5rem;
            }
            
            .tontine-name {
                color: var(--text-light);
                font-size: 0.875rem;
            }
            
            .contribution-meta {
                display: flex;
                gap: 1rem;
                align-items: center;
                font-size: 0.875rem;
            }
            
            .contribution-meta .amount.paid {
                color: var(--success);
                font-weight: 600;
            }
            
            .contribution-meta .amount.missed {
                color: var(--error);
                font-weight: 600;
            }
            
            .penalty {
                color: var(--warning);
                font-weight: 600;
            }
            
            .round {
                background: var(--bg-light);
                padding: 0.25rem 0.5rem;
                border-radius: 12px;
                font-weight: 600;
            }
            
            .date {
                color: var(--text-light);
            }
            
            .contribution-actions {
                display: flex;
                gap: 0.5rem;
            }
            
            .btn-sm {
                padding: 0.5rem 1rem;
                font-size: 0.875rem;
            }
        `;
        document.head.appendChild(styles);
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    showError(message) {
        if (window.appState) {
            window.appState.showNotification(message, 'error');
        } else {
            alert(message);
        }
    }

    generateId() {
        return Date.now() + Math.random().toString(36).substr(2, 9);
    }

    // Public method to refresh data (called from navigation)
    refreshData() {
        this.loadData();
        this.renderCurrentView();
        
        if (window.appState) {
            window.appState.showNotification('Données des tontines actualisées', 'success');
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('tontine')) {
        window.tontineManager = new TontineManager();
    }
});

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TontineManager;
}                                    <div class="member-info">
                                        <div class="member-avatar small">
                                            ${contribution.memberName.split(' ').map(n => n[0]).join('').substring(0, 2)}
                                        </div>
                                        <span>${contribution.memberName}</span>
                                    </div>
                                    <div class="amount ${contribution.status === 'paid' ? 'paid' : 'missed'}">
                                        ${contribution.amount}€
                                        ${contribution.penalty > 0 ? `<small>+${contribution.penalty}€ pénalité</small>` : ''}
                                    </div>
                                    <div>${new Date(contribution.date).toLocaleDateString('fr-FR')}</div>
                                    <div>
                                        <span class="status-badge ${contribution.status}">
                                            ${contribution.status === 'paid' ? 'Payé' : 'Manqué'}
                                        </span>
                                    </div>
                                    <div>Tour ${contribution.round}</div>
                                </div>
                            `).join('')}
                            ${recentContributions.length === 0 ? `
                                <div class="no-contributions">
                                    <i class="fas fa-inbox"></i>
                                    <p>Aucune contribution enregistrée</p>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Setup tontine selector
        document.getElementById('tontineSelect').addEventListener('change', (e) => {
            this.currentTontine = this.tontines.find(t => t.id === e.target.value);
            this.renderDetails();
        });
    }

    createMemberItem(member) {
        const memberContributions = this.contributions.filter(c => c.memberId === member.id && c.status === 'paid');
        const contributionRate = memberContributions.length > 0 ? 
            (memberContributions.length / this.contributions.filter(c => c.tontineId === member.tontineId).length * this.members.filter(m => m.tontineId === member.tontineId).length) * 100 : 0;

        return `
            <div class="member-item">
                <div class="member-info">
                    <div class="member-avatar">
                        ${member.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                    </div>
                    <div class="member-details">
                        <div class="member-name">${member.name}</div>
                        <div class="member-contact">
                            <a href="mailto:${member.email}"><i class="fas fa-envelope"></i></a>
                            ${member.phone ? `<a href="tel:${member.phone}"><i class="fas fa-phone"></i></a>` : ''}
                        </div>
                    </div>
                </div>
                <div class="member-stats">
                    <div class="member-position">Position ${member.position}</div>
                    <div class="member-status ${member.status}">
                        ${member.hasReceived ? 'A reçu' : 'En attente'}
                    </div>
                    <div class="contribution-rate">
                        <div class="rate-bar">
                            <div class="rate-fill" style="width: ${Math.min(contributionRate, 100)}%;"></div>
                        </div>
                        <span>${Math.round(contributionRate)}%</span>
                    </div>
                </div>
                <div class="member-actions">
                    <button class="action-btn" onclick="tontineManager.editMember('${member.id}')" title="Modifier">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn" onclick="tontineManager.removeMember('${member.id}')" title="Retirer">
                        <i class="fas fa-user-minus"></i>
                    </button>
                </div>
            </div>
        `;
    }

    renderHistory() {
        const tontineModule = document.getElementById('tontine');
        let historyContainer = tontineModule.querySelector('.history-container');
        
        if (!historyContainer) {
            historyContainer = document.createElement('div');
            historyContainer.className = 'history-container';
            
            const existingContainer = tontineModule.querySelector('.overview-container, .details-container');
            if (existingContainer) {
                existingContainer.replaceWith(historyContainer);
            } else {
                tontineModule.appendChild(historyContainer);
            }
        }

        const allContributions = this.contributions.sort((a, b) => new Date(b.date) - new Date(a.date));
        const groupedByMonth = this.groupContributionsByMonth(allContributions);

        historyContainer.innerHTML = `
            <div class="history-header">
                <h2>Historique des Contributions</h2>
                <div class="history-filters">
                    <select id="tontineHistoryFilter" class="form-input">
                        <option value="all">Toutes les tontines</option>
                        ${this.tontines.map(t => `
                            <option value="${t.id}">${t.name}</option>
                        `).join('')}
                    </select>
                    <select id="statusHistoryFilter" class="form-input">
                        <option value="all">Tous les statuts</option>
                        <option value="paid">Payé</option>
                        <option value="missed">Manqué</option>
                    </select>
                    <button class="btn" id="exportHistoryBtn">
                        <i class="fas fa-download"></i> Exporter
                    </button>
                </div>
            </div>

            <div class="history-timeline">
                ${Object.entries(groupedByMonth).map(([monthKey, contributions]) => `
                    <div class="timeline-month">
                        <div class="month-header">
                            <h3>${this.formatMonthYear(monthKey)}</h3>
                            <div class="month-stats">
                                <span class="stat">
                                    ${contributions.filter(c => c.status === 'paid').length} payées
                                </span>
                                <span class="stat">
                                    ${contributions.filter(c => c.status === 'missed').length} manquées
                                </span>
                                <span class="stat">
                                    ${contributions.reduce((sum, c) => sum + (c.status === 'paid' ? c.amount : 0), 0)}€
                                </span>
                            </div>
                        </div>
                        <div class="month-contributions">
                            ${contributions.map(contribution => this.createContributionHistoryItem(contribution)).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        // Setup filters
        document.getElementById('tontineHistoryFilter').addEventListener('change', () => {
            this.filterHistory();
        });

        document.getElementById('statusHistoryFilter').addEventListener('change', () => {
            this.filterHistory();
        });

        document.getElementById('exportHistoryBtn').addEventListener('click', () => {
            this.exportHistory();
        });
    }

    groupContributionsByMonth(contributions) {
        const grouped = {};
        
        contributions.forEach(contribution => {
            const date = new Date(contribution.date);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            
            if (!grouped[monthKey]) {
                grouped[monthKey] = [];
            }
            grouped[monthKey].push(contribution);
        });

        return grouped;
    }

    formatMonthYear(monthKey) {
        const [year, month] = monthKey.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1);
        return date.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long' });
    }

    createContributionHistoryItem(contribution) {
        const tontine = this.tontines.find(t => t.id === contribution.tontineId);
        
        return `
            <div class="contribution-history-item">
                <div class="contribution-icon ${contribution.status}">
                    <i class="fas ${contribution.status === 'paid' ? 'fa-check' : 'fa-times'}"></i>
                </div>
                <div class="contribution-details">
                    <div class="contribution-main">
                        <strong>${contribution.memberName}</strong>
                        <span class="tontine-name">${tontine ? tontine.name : 'Tontine supprimée'}</span>
                    </div>
                    <div class="contribution-meta">
                        <span class="amount ${contribution.status}">${contribution.amount}€</span>
                        ${contribution.penalty > 0 ? `<span class="penalty">+${contribution.penalty}€ pénalité</span>` : ''}
                        <span class="round">Tour ${contribution.round}</span>
                        <span class="date">${new Date(contribution.date).toLocaleDateString('fr-FR')}</span>
                    </div>
                </div>
                <div class="contribution-actions">
                    ${contribution.status === 'missed' ? `
                        <button class="btn btn-sm" onclick="tontineManager.markAsPaid('${contribution.id}')">
                            <i class="fas fa-check"></i> Marquer payé
                        </button>
                    ` : ''}
                    <button class="action-btn" onclick="tontineManager.editContribution('${contribution.id}')" title="Modifier">
                        <i class="fas fa-edit"></i>
                    </button>
                </div>
            </div>
        `;
    }

    // Tontine management methods
    showCreateTontineModal() {
        const modal = document.createElement('div');
        modal.className = 'create-tontine-modal';
        modal.innerHTML = `
            <div class="modal-content large">
                <div class="modal-header">
                    <h2>Créer une Nouvelle Tontine</h2>
                    <button class="close-modal">&times;</button>
                </div>
                <form id="createTontineForm">
                    <div class="form-sections">
                        <div class="form-section">
                            <h3><i class="fas fa-info-circle"></i> Informations générales</h3>
                            <div class="form-grid">
                                <div class="form-group">
                                    <label>Nom de la tontine *</label>
                                    <input type="text" name="name" class="form-input" required>
                                </div>
                                <div class="form-group">
                                    <label>Description</label>
                                    <textarea name="description" class="form-input" rows="3"></textarea>
                                </div>
                            </div>
                        </div>

                        <div class="form-section">
                            <h3><i class="fas fa-euro-sign"></i> Configuration financière</h3>
                            <div class="form-grid">
                                <div class="form-group">
                                    <label>Contribution mensuelle (€) *</label>
                                    <input type="number" name="monthlyAmount" class="form-input" min="1" step="0.01" required>
                                </div>
                                <div class="form-group">
                                    <label>Pénalité pour retard (€)</label>
                                    <input type="number" name="penaltyAmount" class="form-input" min="0" step="0.01" value="10">
                                </div>
                                <div class="form-group">
                                    <label>Date limite de paiement</label>
                                    <select name="paymentDeadline" class="form-input">
                                        ${Array.from({length: 28}, (_, i) => i + 1).map(day => `
                                            <option value="${day}" ${day === 5 ? 'selected' : ''}>${day}</option>
                                        `).join('')}
                                    </select>
                                    <small class="form-help">Jour du mois pour le paiement</small>
                                </div>
                            </div>
                        </div>

                        <div class="form-section">
                            <h3><i class="fas fa-users"></i> Membres</h3>
                            <div class="form-grid">
                                <div class="form-group">
                                    <label>Nombre maximum de membres *</label>
                                    <input type="number" name="maxMembers" class="form-input" min="2" max="50" value="10" required>
                                </div>
                                <div class="form-group">
                                    <label>Paiements manqués autorisés</label>
                                    <input type="number" name="maxMissedPayments" class="form-input" min="0" max="5" value="2">
                                </div>
                            </div>
                        </div>

                        <div class="form-section">
                            <h3><i class="fas fa-calendar"></i> Planning</h3>
                            <div class="form-grid">
                                <div class="form-group">
                                    <label>Date de début</label>
                                    <input type="date" name="startDate" class="form-input" value="${new Date().toISOString().split('T')[0]}">
                                </div>
                                <div class="form-group">
                                    <label>Ordre des bénéficiaires</label>
                                    <select name="payoutOrder" class="form-input">
                                        <option value="sequential">Séquentiel (ordre d'inscription)</option>
                                        <option value="random">Aléatoire</option>
                                        <option value="manual">Manuel</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="modal-actions">
                        <button type="submit" class="btn btn-primary">
                            <i class="fas fa-save"></i> Créer la tontine
                        </button>
                        <button type="button" class="btn" onclick="this.closest('.create-tontine-modal').remove()">
                            Annuler
                        </button>
                    </div>
                </form>
            </div>
        `;

        this.addModalStyles(modal);
        modal.querySelector('.modal-content').style.maxWidth = '800px';
        document.body.appendChild(modal);

        // Handle form submission
        const form = modal.querySelector('#createTontineForm');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.createTontine(form, modal);
        });

        // Close modal
        modal.querySelector('.close-modal').onclick = () => modal.remove();
        modal.onclick = (e) => {
            if (e.target === modal) modal.remove();
        };
    }

    createTontine(form, modal) {
        const formData = new FormData(form);
        const tontineData = Object.fromEntries(formData.entries());

        // Validation
        if (!this.validateTontineData(tontineData)) {
            return;
        }

        const tontine = {
            id: this.generateId(),
            name: tontineData.name.trim(),
            description: tontineData.description.trim() || '',
            monthlyAmount: parseFloat(tontineData.monthlyAmount),
            maxMembers: parseInt(tontineData.maxMembers),
            totalMembers: 0,
            currentRound: 0,
            totalRounds: parseInt(tontineData.maxMembers),
            startDate: tontineData.startDate,
            status: 'draft', // Will be activated when first member joins
            nextPayoutDate: null,
            nextBeneficiary: null,
            totalCollected: 0,
            rules: {
                penaltyAmount: parseFloat(tontineData.penaltyAmount) || 0,
                maxMissedPayments: parseInt(tontineData.maxMissedPayments) || 2,
                paymentDeadline: parseInt(tontineData.paymentDeadline),
                payoutOrder: tontineData.payoutOrder
            },
            createdAt: new Date().toISOString(),
            createdBy: window.appState?.currentUser?.uid || 'demo-user'
        };

        this.tontines.push(tontine);
        this.saveData();

        modal.remove();
        this.renderCurrentView();

        if (window.appState) {
            window.appState.showNotification('Tontine créée avec succès', 'success');
        }

        // Propose to add members
        setTimeout(() => {
            if (confirm('Voulez-vous ajouter des membres maintenant ?')) {
                this.addMember(tontine.id);
            }
        }, 500);
    }

    validateTontineData(data) {
        if (!data.name || data.name.trim().length < 3) {
            this.showError('Le nom doit contenir au moins 3 caractères');
            return false;
        }

        if (!data.monthlyAmount || parseFloat(data.monthlyAmount) <= 0) {
            this.showError('La contribution mensuelle doit être supérieure à 0');
            return false;
        }

        if (!data.maxMembers || parseInt(data.maxMembers) < 2) {
            this.showError('Au moins 2 membres sont requis');
            return false;
        }

        // Check if name already exists
        if (this.tontines.some(t => t.name.toLowerCase() === data.name.trim().toLowerCase())) {
            this.showError('Une tontine avec ce nom existe déjà');
            return false;
        }

        return true;
    }

    addMember(tontineId) {
        const tontine = this.tontines.find(t => t.id === tontineId);
        if (!tontine) return;

        if (tontine.totalMembers >= tontine.maxMembers) {
            this.showError('Cette tontine a atteint le nombre maximum de membres');
            return;
        }

        const modal = document.createElement('div');
        modal.className = 'add-member-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Ajouter un Membre</h2>
                    <button class="close-modal">&times;</button>
                </div>
                <form id="addMemberForm">
                    <div class="form-group">
                        <label>Nom complet *</label>
                        <input type="text" name="name" class="form-input" required>
                    </div>
                    <div class="form-group">
                        <label>Email *</label>
                        <input type="email" name="email" class="form-input" required>
                    </div>
                    <div class="form-group">
                        <label>Téléphone</label>
                        <input type="tel" name="phone" class="form-input">
                    </div>
                    <div class="form-group">
                        <label>Position dans la tontine</label>
                        <select name="position" class="form-input">
                            <option value="auto">Automatique (prochaine disponible)</option>
                            ${Array.from({length: tontine.maxMembers}, (_, i) => {
                                const pos = i + 1;
                                const isOccupied = this.members.some(m => m.tontineId === tontineId && m.position === pos);
                                return isOccupied ? '' : `<option value="${pos}">Position ${pos}</option>`;
                            }).join('')}
                        </select>
                    </div>
                    <div class="modal-actions">
                        <button type="submit" class="btn btn-primary">
                            <i class="fas fa-user-plus"></i> Ajouter
                        </button>
                        <button type="button" class="btn" onclick="this.closest('.add-member-modal').remove()">
                            Annuler
                        </button>
                    </div>
                </form>
            </div>
        `;

        this.addModalStyles(modal);
        document.body.appendChild(modal);

        // Handle form submission
        const form = modal.querySelector('#addMemberForm');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.processMemberAddition(tontineId, form, modal);
        });

        // Close modal
        modal.querySelector('.close-modal').onclick = () => modal.remove();
        modal.onclick = (e) => {
            if (e.target === modal) modal.remove();
        };
    }

    processMemberAddition(tontineId, form, modal) {
        const formData = new FormData(form);
        const memberData = Object.fromEntries(formData.entries());

        // Validation
        if (!this.validateMemberData(memberData, tontineId)) {
            return;
        }

        const tontine = this.tontines.find(t => t.id === tontineId);
        const position = memberData.position === 'auto' ? 
            this.getNextAvailablePosition(tontineId) : 
            parseInt(memberData.position);

        const member = {
            id: this.generateId(),
            tontineId,
            name: memberData.name.trim(),
            email: memberData.email.trim(),
            phone: memberData.phone.trim() || '',
            joinDate: new Date().toISOString(),
            status: 'active',
            position,
            hasReceived: false
        };

        this.members.push(member);
        
        // Update tontine
        tontine.totalMembers++;
        if (tontine.status === 'draft' && tontine.totalMembers >= 2) {
            tontine.status = 'active';
            this.calculateNextPayout(tontine);
        }

        this.saveData();
        modal.remove();
        this.renderCurrentView();

        if (window.appState) {
            window.appState.showNotification(`${member.name} ajouté à la tontine`, 'success');
        }
    }

    validateMemberData(data, tontineId) {
        if (!data.name || data.name.trim().length < 2) {
            this.showError('Le nom doit contenir au moins 2 caractères');
            return false;
        }

        if (!data.email || !this.isValidEmail(data.email)) {
            this.showError('Un email valide est requis');
            return false;
        }

        // Check if email already exists in this tontine
        if (this.members.some(m => m.tontineId === tontineId && m.email.toLowerCase() === data.email.trim().toLowerCase())) {
            this.showError('Ce membre est déjà dans cette tontine');
            return false;
        }

        return true;
    }

    getNextAvailablePosition(tontineId) {
        const tontine = this.tontines.find(t => t.id === tontineId);
        const occupiedPositions = this.members
            .filter(m => m.tontineId === tontineId)
            .map(m => m.position);

        for (let i = 1; i <= tontine.maxMembers; i++) {
            if (!occupiedPositions.includes(i)) {
                return i;
            }
        }
        return tontine.maxMembers; // Fallback
    }

    calculateNextPayout(tontine) {
        const tontineMembers = this.members
            .filter(m => m.tontineId === tontine.id && m.status === 'active')
            .sort((a, b) => a.position - b.position);

        const nextMember = tontineMembers.find(m => !m.hasReceived);
        if (nextMember) {
            tontine.nextBeneficiary = nextMember.name;
            
            // Calculate next payout date (first of next month + deadline days)
            const now = new Date();
            const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, tontine.rules.paymentDeadline);
            tontine.nextPayoutDate = nextMonth.toISOString();
        }
    }

    addContribution(tontineId) {
        const tontine = this.tontines.find(t => t.id === tontineId);
        if (!tontine) return;

        const tontineMembers = this.members.filter(m => m.tontineId === tontineId && m.status === 'active');

        const modal = document.createElement('div');
        modal.className = 'add-contribution-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Nouvelle Contribution - ${tontine.name}</h2>
                    <button class="close-modal">&times;</button>
                </div>
                <form id="addContributionForm">
                    <div class="form-group">
                        <label>Membre *</label>
                        <select name="memberId" class="form-input" required>
                            <option value="">Sélectionner un membre</option>
                            ${tontineMembers.map(member => `
                                <option value="${member.id}">${member.name}</option>
                            `).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Montant (€) *</label>
                        <input type="number" name="amount" class="form-input" 
                               value="${tontine.monthlyAmount}" step="0.01" required>
                    </div>
                    <div class="form-group">
                        <label>Date de paiement *</label>
                        <input type="date" name="date" class="form-input" 
                               value="${new Date().toISOString().split('T')[0]}" required>
                    </div>
                    <div class="form-group">
                        <label>Tour</label>
                        <input type="number" name="round" class="form-input" 
                               value="${tontine.currentRound + 1}" min="1" required>
                    </div>
                    <div class="form-group">
                        <label>Méthode de paiement</label>
                        <select name="paymentMethod" class="form-input">
                            <option value="cash">Espèces</option>
                            <option value="transfer">Virement</option>
                            <option value="mobile">Paiement mobile</option>
                            <option value="check">Chèque</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Pénalité (€)</label>
                        <input type="number" name="penalty" class="form-input" value="0" min="0" step="0.01">
                    </div>
                    <div class="modal-actions">
                        <button type="submit" class="btn btn-primary">
                            <i class="fas fa-save"></i> Enregistrer
                        </button>
                        <button type="button" class="btn" onclick="this.closest('.add-contribution-modal').remove()">
                            Annuler
                        </button>
                    </div>
                </form>
            </div>
        `;

        this.addModalStyles(modal);
        document.body.appendChild(modal);

        // Handle form submission
        const form = modal.querySelector('#addContributionForm');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.processContribution(tontineId, form, modal);
        });

        // Close modal
        modal.querySelector('.close-modal').onclick = () => modal.remove();
        modal.onclick = (e) => {
            if (e.target === modal) modal.remove();
        };
    }

    processContribution(tontineId, form, modal) {
        const formData = new FormData(form);
        const contributionData = Object.fromEntries(formData.entries());

        const member = this.members.find(m => m.id === contributionData.memberId);
        if (!member) {
            this.showError('Membre non trouvé');
            return;
        }

        const contribution = {
            id: this.generateId(),
            tontineId,
            memberId: contributionData.memberId,
            memberName: member.name,
            amount: parseFloat(contributionData.amount),
            date: new Date(contributionData.date).toISOString(),
            status: 'paid',
            penalty: parseFloat(contributionData.penalty) || 0,
            round: parseInt(contributionData.round),
            paymentMethod: contributionData.paymentMethod,
            recordedAt: new Date().toISOString(),
            recordedBy: window.appState?.currentUser?.uid || 'demo-user'
        };

        this.contributions.push(contribution);

        // Update tontine total
        const tontine = this.tontines.find(t => t.id === tontineId);
        tontine.totalCollected += contribution.amount + contribution.penalty;

        // Add to caisse if available
        if (window.caisseManager) {
            this.addTontineTransaction(contribution, tontine);
        }

        this.saveData();
        modal.remove();
        this.renderCurrentView();

        if (window.appState) {
            window.appState.showNotification('Contribution enregistrée', 'success');
        }
    }

    addTontineTransaction(contribution, tontine) {
        const transaction = {
            id: window.caisseManager.generateId(),
            description: `Tontine: ${tontine.name} - ${contribution.memberName}`,
            amount: contribution.amount + contribution.penalty,
            category: 'tontine',
            date: new Date().toISOString(),
            type: 'income',
            createdBy: window.appState?.currentUser?.uid || 'demo-user',
            relatedTontineId: tontine.id,
            relatedContributionId: contribution.id
        };

        if (window.caisseManager.transactions) {
            window.caisseManager.transactions.unshift(transaction);
            window.caisseManager.saveData();
            window.caisseManager.updateStats();
        }
    }

    // Utility and helper methods
    setupQuickActions() {
        const tontineModule = document.getElementById('tontine');
        if (document.querySelector('.tontine-quick-actions')) return;

        const quickActions = document.createElement('div');
        quickActions.className = 'tontine-quick-actions card';
        quickActions.innerHTML = `
            /**
 * ====================================
 * SFM - Tontine Management Module
 * Handles community savings groups
 * ====================================
 */

class TontineManager {
    constructor() {
        this.tontines = [];
        this.contributions = [];
        this.members = [];
        this.currentTontine = null;
        this.currentView = 'overview'; // overview, details, history
        this.init();
    }

    init() {
        this.loadData();
        this.setupEventListeners();
        this.renderTontines();
        this.setupQuickActions();
        this.loadDemoData();
    }

    loadData() {
        if (window.appState) {
            this.tontines = window.appState.data.tontines || [];
            this.contributions = window.appState.data.tontineContributions || [];
            this.members = window.appState.data.tontineMembers || [];
        } else {
            this.tontines = JSON.parse(localStorage.getItem('sfm_tontines')) || [];
            this.contributions = JSON.parse(localStorage.getItem('sfm_tontine_contributions')) || [];
            this.members = JSON.parse(localStorage.getItem('sfm_tontine_members')) || [];
        }
    }

    saveData() {
        if (window.appState) {
            window.appState.saveData('tontines', this.tontines);
            window.appState.saveData('tontineContributions', this.contributions);
            window.appState.saveData('tontineMembers', this.members);
        } else {
            localStorage.setItem('sfm_tontines', JSON.stringify(this.tontines));
            localStorage.setItem('sfm_tontine_contributions', JSON.stringify(this.contributions));
            localStorage.setItem('sfm_tontine_members', JSON.stringify(this.members));
        }
    }

    loadDemoData() {
        if (this.tontines.length === 0) {
            // Demo tontines
            this.tontines = [
                {
                    id: 'tontine-famille',
                    name: 'Tontine Famille',
                    description: 'Épargne familiale pour projets communs',
                    monthlyAmount: 200,
                    totalMembers: 8,
                    maxMembers: 10,
                    currentRound: 3,
                    totalRounds: 10,
                    startDate: '2024-01-01',
                    status: 'active',
                    nextPayoutDate: '2025-10-01',
                    nextBeneficiary: 'Marie Dubois',
                    totalCollected: 4800,
                    rules: {
                        penaltyAmount: 10,
                        maxMissedPayments: 2,
                        paymentDeadline: 5 // 5th of each month
                    },
                    createdAt: '2024-01-01T00:00:00Z',
                    createdBy: 'demo-user'
                },
                {
                    id: 'tontine-amis',
                    name: 'Tontine Amis',
                    description: 'Groupe d\'amis pour financer nos vacances',
                    monthlyAmount: 150,
                    totalMembers: 6,
                    maxMembers: 6,
                    currentRound: 5,
                    totalRounds: 6,
                    startDate: '2024-06-01',
                    status: 'active',
                    nextPayoutDate: '2025-11-01',
                    nextBeneficiary: 'Paul Durand',
                    totalCollected: 4500,
                    rules: {
                        penaltyAmount: 15,
                        maxMissedPayments: 1,
                        paymentDeadline: 1
                    },
                    createdAt: '2024-06-01T00:00:00Z',
                    createdBy: 'demo-user'
                }
            ];

            // Demo members
            this.members = [
                // Tontine Famille
                { id: 'member-1', tontineId: 'tontine-famille', name: 'Marie Dubois', email: 'marie@email.com', phone: '+33123456789', joinDate: '2024-01-01', status: 'active', position: 1, hasReceived: false },
                { id: 'member-2', tontineId: 'tontine-famille', name: 'Jean Martin', email: 'jean@email.com', phone: '+33123456790', joinDate: '2024-01-01', status: 'active', position: 2, hasReceived: false },
                { id: 'member-3', tontineId: 'tontine-famille', name: 'Sophie Laurent', email: 'sophie@email.com', phone: '+33123456791', joinDate: '2024-01-01', status: 'active', position: 3, hasReceived: true },
                { id: 'member-4', tontineId: 'tontine-famille', name: 'Pierre Moreau', email: 'pierre@email.com', phone: '+33123456792', joinDate: '2024-01-01', status: 'active', position: 4, hasReceived: true },
                { id: 'member-5', tontineId: 'tontine-famille', name: 'Lucie Bernard', email: 'lucie@email.com', phone: '+33123456793', joinDate: '2024-02-01', status: 'active', position: 5, hasReceived: true },
                { id: 'member-6', tontineId: 'tontine-famille', name: 'Thomas Petit', email: 'thomas@email.com', phone: '+33123456794', joinDate: '2024-02-01', status: 'active', position: 6, hasReceived: false },
                { id: 'member-7', tontineId: 'tontine-famille', name: 'Emma Roux', email: 'emma@email.com', phone: '+33123456795', joinDate: '2024-03-01', status: 'active', position: 7, hasReceived: false },
                { id: 'member-8', tontineId: 'tontine-famille', name: 'Lucas Girard', email: 'lucas@email.com', phone: '+33123456796', joinDate: '2024-03-01', status: 'active', position: 8, hasReceived: false },

                // Tontine Amis
                { id: 'member-9', tontineId: 'tontine-amis', name: 'Paul Durand', email: 'paul@email.com', phone: '+33987654321', joinDate: '2024-06-01', status: 'active', position: 1, hasReceived: false },
                { id: 'member-10', tontineId: 'tontine-amis', name: 'Alice Leroy', email: 'alice@email.com', phone: '+33987654322', joinDate: '2024-06-01', status: 'active', position: 2, hasReceived: true },
                { id: 'member-11', tontineId: 'tontine-amis', name: 'David Simon', email: 'david@email.com', phone: '+33987654323', joinDate: '2024-06-01', status: 'active', position: 3, hasReceived: true },
                { id: 'member-12', tontineId: 'tontine-amis', name: 'Laura Michel', email: 'laura@email.com', phone: '+33987654324', joinDate: '2024-06-01', status: 'active', position: 4, hasReceived: true },
                { id: 'member-13', tontineId: 'tontine-amis', name: 'Kevin Blanc', email: 'kevin@email.com', phone: '+33987654325', joinDate: '2024-06-01', status: 'active', position: 5, hasReceived: true },
                { id: 'member-14', tontineId: 'tontine-amis', name: 'Sarah Lopez', email: 'sarah@email.com', phone: '+33987654326', joinDate: '2024-06-01', status: 'active', position: 6, hasReceived: false }
            ];

            // Demo contributions (last 6 months)
            this.contributions = [];
            const today = new Date();
            
            for (let month = 0; month < 6; month++) {
                const contributionDate = new Date(today.getFullYear(), today.getMonth() - month, 5);
                
                // Contributions for Tontine Famille
                this.members.filter(m => m.tontineId === 'tontine-famille').forEach(member => {
                    if (month < 3 || Math.random() > 0.1) { // 90% payment rate
                        this.contributions.push({
                            id: this.generateId(),
                            tontineId: 'tontine-famille',
                            memberId: member.id,
                            memberName: member.name,
                            amount: 200,
                            date: contributionDate.toISOString(),
                            status: 'paid',
                            penalty: 0,
                            round: Math.max(1, 6 - month),
                            paymentMethod: ['cash', 'transfer', 'mobile'][Math.floor(Math.random() * 3)]
                        });
                    } else {
                        // Missed payment
                        this.contributions.push({
                            id: this.generateId(),
                            tontineId: 'tontine-famille',
                            memberId: member.id,
                            memberName: member.name,
                            amount: 200,
                            date: contributionDate.toISOString(),
                            status: 'missed',
                            penalty: 10,
                            round: Math.max(1, 6 - month),
                            paymentMethod: null
                        });
                    }
                });

                // Contributions for Tontine Amis
                this.members.filter(m => m.tontineId === 'tontine-amis').forEach(member => {
                    if (Math.random() > 0.05) { // 95% payment rate
                        this.contributions.push({
                            id: this.generateId(),
                            tontineId: 'tontine-amis',
                            memberId: member.id,
                            memberName: member.name,
                            amount: 150,
                            date: contributionDate.toISOString(),
                            status: 'paid',
                            penalty: 0,
                            round: Math.max(1, 6 - month),
                            paymentMethod: ['cash', 'transfer', 'mobile'][Math.floor(Math.random() * 3)]
                        });
                    }
                });
            }

            this.saveData();
        }
    }

    setupEventListeners() {
        const tontineModule = document.getElementById('tontine');
        if (!tontineModule) return;

        // Setup view navigation
        this.setupViewNavigation();
    }

    setupViewNavigation() {
        const tontineModule = document.getElementById('tontine');
        
        // Create navigation tabs
        const navTabs = document.createElement('div');
        navTabs.className = 'tontine-nav';
        navTabs.innerHTML = `
            <div class="nav-tabs">
                <button class="nav-tab ${this.currentView === 'overview' ? 'active' : ''}" data-view="overview">
                    <i class="fas fa-th-large"></i> Vue d'ensemble
                </button>
                <button class="nav-tab ${this.currentView === 'details' ? 'active' : ''}" data-view="details">
                    <i class="fas fa-list-alt"></i> Détails
                </button>
                <button class="nav-tab ${this.currentView === 'history' ? 'active' : ''}" data-view="history">
                    <i class="fas fa-history"></i> Historique
                </button>
            </div>
            <div class="nav-actions">
                <button class="btn btn-primary" id="createTontineBtn">
                    <i class="fas fa-plus"></i> Nouvelle tontine
                </button>
            </div>
        `;

        // Insert navigation at the beginning
        const firstCard = tontineModule.querySelector('.card');
        if (firstCard) {
            firstCard.insertAdjacentElement('beforebegin', navTabs);
        }

        // Event listeners
        navTabs.querySelectorAll('.nav-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                this.currentView = tab.dataset.view;
                this.updateNavTabs();
                this.renderCurrentView();
            });
        });

        document.getElementById('createTontineBtn').addEventListener('click', () => {
            this.showCreateTontineModal();
        });

        // Add navigation styles
        this.addNavigationStyles();
    }

    updateNavTabs() {
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.view === this.currentView);
        });
    }

    renderCurrentView() {
        switch (this.currentView) {
            case 'overview':
                this.renderOverview();
                break;
            case 'details':
                this.renderDetails();
                break;
            case 'history':
                this.renderHistory();
                break;
        }
    }

    renderTontines() {
        this.renderOverview();
    }

    renderOverview() {
        const tontineModule = document.getElementById('tontine');
        let overviewContainer = tontineModule.querySelector('.overview-container');
        
        if (!overviewContainer) {
            overviewContainer = document.createElement('div');
            overviewContainer.className = 'overview-container';
            
            // Remove existing content (except navigation)
            const existingCards = tontineModule.querySelectorAll('.card');
            existingCards.forEach(card => card.remove());
            
            tontineModule.appendChild(overviewContainer);
        }

        overviewContainer.innerHTML = `
            <div class="tontine-stats">
                ${this.renderTontineStats()}
            </div>
            <div class="tontines-grid">
                ${this.tontines.map(tontine => this.createTontineCard(tontine)).join('')}
            </div>
        `;

        // Add event listeners for tontine cards
        this.addTontineCardListeners();
    }

    renderTontineStats() {
        const totalMembers = this.members.length;
        const activeTontines = this.tontines.filter(t => t.status === 'active').length;
        const totalCollected = this.tontines.reduce((sum, t) => sum + (t.totalCollected || 0), 0);
        const thisMonthContributions = this.getThisMonthContributions();

        return `
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-icon" style="background: var(--primary);">
                        <i class="fas fa-users"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-value">${activeTontines}</div>
                        <div class="stat-label">Tontines actives</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon" style="background: var(--success);">
                        <i class="fas fa-user-friends"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-value">${totalMembers}</div>
                        <div class="stat-label">Membres total</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon" style="background: var(--warning);">
                        <i class="fas fa-euro-sign"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-value">${totalCollected.toLocaleString()}€</div>
                        <div class="stat-label">Total collecté</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon" style="background: var(--secondary);">
                        <i class="fas fa-calendar-check"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-value">${thisMonthContributions}€</div>
                        <div class="stat-label">Ce mois</div>
                    </div>
                </div>
            </div>
        `;
    }

    getThisMonthContributions() {
        const thisMonth = new Date().getMonth();
        const thisYear = new Date().getFullYear();
        
        return this.contributions
            .filter(c => {
                const date = new Date(c.date);
                return date.getMonth() === thisMonth && 
                       date.getFullYear() === thisYear && 
                       c.status === 'paid';
            })
            .reduce((sum, c) => sum + c.amount, 0);
    }

    createTontineCard(tontine) {
        const members = this.members.filter(m => m.tontineId === tontine.id);
        const progress = (tontine.currentRound / tontine.totalRounds) * 100;
        const nextPayoutDate = new Date(tontine.nextPayoutDate);
        const daysUntilPayout = Math.ceil((nextPayoutDate - new Date()) / (1000 * 60 * 60 * 24));
        
        return `
            <div class="tontine-card" data-tontine-id="${tontine.id}">
                <div class="tontine-header">
                    <div class="tontine-info">
                        <h3>${tontine.name}</h3>
                        <p>${tontine.description}</p>
                    </div>
                    <div class="tontine-status">
                        <span class="status-badge ${tontine.status}">
                            ${tontine.status === 'active' ? 'Actif' : 'Inactif'}
                        </span>
                    </div>
                </div>
                
                <div class="tontine-details">
                    <div class="detail-row">
                        <span class="detail-label">
                            <i class="fas fa-euro-sign"></i> Contribution mensuelle
                        </span>
                        <span class="detail-value">${tontine.monthlyAmount}€</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">
                            <i class="fas fa-users"></i> Membres
                        </span>
                        <span class="detail-value">${tontine.totalMembers}/${tontine.maxMembers}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">
                            <i class="fas fa-calendar"></i> Prochain tour
                        </span>
                        <span class="detail-value">
                            ${tontine.nextBeneficiary}
                            <small>(${daysUntilPayout > 0 ? `dans ${daysUntilPayout} jours` : 'Aujourd\'hui'})</small>
                        </span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">
                            <i class="fas fa-piggy-bank"></i> Total collecté
                        </span>
                        <span class="detail-value">${tontine.totalCollected.toLocaleString()}€</span>
                    </div>
                </div>

                <div class="tontine-progress">
                    <div class="progress-info">
                        <span>Tour ${tontine.currentRound}/${tontine.totalRounds}</span>
                        <span>${Math.round(progress)}%</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progress}%;"></div>
                    </div>
                </div>

                <div class="tontine-members-preview">
                    <div class="members-avatars">
                        ${members.slice(0, 5).map(member => `
                            <div class="member-avatar" title="${member.name}">
                                ${member.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                            </div>
                        `).join('')}
                        ${members.length > 5 ? `<div class="member-more">+${members.length - 5}</div>` : ''}
                    </div>
                    <div class="next-payout-info">
                        <i class="fas fa-calendar-alt"></i>
                        Prochain versement: ${nextPayoutDate.toLocaleDateString('fr-FR')}
                    </div>
                </div>

                <div class="tontine-actions">
                    <button class="btn btn-primary" onclick="tontineManager.viewTontineDetails('${tontine.id}')">
                        <i class="fas fa-eye"></i> Voir détails
                    </button>
                    <button class="btn" onclick="tontineManager.addContribution('${tontine.id}')">
                        <i class="fas fa-plus"></i> Contribution
                    </button>
                    <div class="tontine-menu">
                        <button class="btn" onclick="tontineManager.showTontineMenu('${tontine.id}', event)">
                            <i class="fas fa-ellipsis-v"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    addTontineCardListeners() {
        // Event listeners are added via onclick attributes in the HTML
        // This method can be used for additional event handling if needed
    }

    viewTontineDetails(tontineId) {
        this.currentTontine = this.tontines.find(t => t.id === tontineId);
        if (!this.currentTontine) return;

        this.currentView = 'details';
        this.updateNavTabs();
        this.renderDetails();
    }

    renderDetails() {
        if (!this.currentTontine) {
            this.currentTontine = this.tontines[0];
        }

        const tontineModule = document.getElementById('tontine');
        let detailsContainer = tontineModule.querySelector('.details-container');
        
        if (!detailsContainer) {
            detailsContainer = document.createElement('div');
            detailsContainer.className = 'details-container';
            
            const existingContainer = tontineModule.querySelector('.overview-container, .history-container');
            if (existingContainer) {
                existingContainer.replaceWith(detailsContainer);
            } else {
                tontineModule.appendChild(detailsContainer);
            }
        }

        const tontineMembers = this.members.filter(m => m.tontineId === this.currentTontine.id);
        const recentContributions = this.contributions
            .filter(c => c.tontineId === this.currentTontine.id)
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 10);

        detailsContainer.innerHTML = `
            <div class="tontine-selector">
                <select id="tontineSelect" class="form-input">
                    ${this.tontines.map(t => `
                        <option value="${t.id}" ${t.id === this.currentTontine.id ? 'selected' : ''}>
                            ${t.name}
                        </option>
                    `).join('')}
                </select>
            </div>

            <div class="details-content">
                <div class="details-header">
                    <div class="tontine-title">
                        <h2>${this.currentTontine.name}</h2>
                        <p>${this.currentTontine.description}</p>
                    </div>
                    <div class="details-actions">
                        <button class="btn" onclick="tontineManager.editTontine('${this.currentTontine.id}')">
                            <i class="fas fa-edit"></i> Modifier
                        </button>
                        <button class="btn btn-primary" onclick="tontineManager.addContribution('${this.currentTontine.id}')">
                            <i class="fas fa-plus"></i> Nouvelle contribution
                        </button>
                    </div>
                </div>

                <div class="details-grid">
                    <div class="detail-card">
                        <h3><i class="fas fa-users"></i> Membres (${tontineMembers.length})</h3>
                        <div class="members-list">
                            ${tontineMembers.map(member => this.createMemberItem(member)).join('')}
                        </div>
                        <button class="btn btn-outline" onclick="tontineManager.addMember('${this.currentTontine.id}')">
                            <i class="fas fa-user-plus"></i> Ajouter un membre
                        </button>
                    </div>

                    <div class="detail-card">
                        <h3><i class="fas fa-chart-line"></i> Progression</h3>
                        <div class="progress-details">
                            <div class="progress-stat">
                                <span class="progress-label">Tour actuel</span>
                                <span class="progress-value">${this.currentTontine.currentRound}/${this.currentTontine.totalRounds}</span>
                            </div>
                            <div class="progress-bar-large">
                                <div class="progress-fill" style="width: ${(this.currentTontine.currentRound / this.currentTontine.totalRounds) * 100}%;"></div>
                            </div>
                            <div class="progress-stat">
                                <span class="progress-label">Prochain bénéficiaire</span>
                                <span class="progress-value">${this.currentTontine.nextBeneficiary}</span>
                            </div>
                            <div class="progress-stat">
                                <span class="progress-label">Date du versement</span>
                                <span class="progress-value">${new Date(this.currentTontine.nextPayoutDate).toLocaleDateString('fr-FR')}</span>
                            </div>
                        </div>
                    </div>

                    <div class="detail-card">
                        <h3><i class="fas fa-euro-sign"></i> Finances</h3>
                        <div class="finance-stats">
                            <div class="finance-stat">
                                <span class="finance-label">Contribution mensuelle</span>
                                <span class="finance-value">${this.currentTontine.monthlyAmount}€</span>
                            </div>
                            <div class="finance-stat">
                                <span class="finance-label">Total par tour</span>
                                <span class="finance-value">${this.currentTontine.monthlyAmount * this.currentTontine.totalMembers}€</span>
                            </div>
                            <div class="finance-stat">
                                <span class="finance-label">Total collecté</span>
                                <span class="finance-value">${this.currentTontine.totalCollected.toLocaleString()}€</span>
                            </div>
                            <div class="finance-stat">
                                <span class="finance-label">Pénalités</span>
                                <span class="finance-value">${this.currentTontine.rules.penaltyAmount}€</span>
                            </div>
                        </div>
                    </div>

                    <div class="detail-card full-width">
                        <h3><i class="fas fa-history"></i> Contributions récentes</h3>
                        <div class="contributions-table">
                            <div class="table-header">
                                <div>Membre</div>
                                <div>Montant</div>
                                <div>Date</div>
                                <div>Statut</div>
                                <div>Tour</div>
                            </div>
                            ${recentContributions.map(contribution => `
                                <div class="table-row">
                                    <div class="member-info">
                                        <div class="member-avatar small">
                                            ${contribution.memberName.split(' ').map(n => n[0]).join('').substring(0, 2)}
                                        </div>
                                        <span>${contribution.memberName}</span>
                                    </div>