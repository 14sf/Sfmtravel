    getRevenueBreakdownData() {
        const sources = {
            voyage: { label: 'Voyages', value: 0 },
            tontine: { label: 'Tontines', value: 0 },
            revenus: { label: 'Autres Revenus', value: 0 }
        };

        this.analytics.transactions
            .filter(t => t.amount > 0)
            .forEach(t => {
                if (sources[t.category]) {
                    sources[t.category].value += t.amount;
                } else {
                    sources.revenus.value += t.amount;
                }
            });

        return Object.values(sources).filter(s => s.value > 0);
    }

    getBookingsData() {
        const statuses = {
            confirmed: { label: 'Confirmées', value: 0 },
            pending: { label: 'En attente', value: 0 },
            cancelled: { label: 'Annulées', value: 0 }
        };

        this.analytics.bookings.forEach(booking => {
            if (statuses[booking.status]) {
                statuses[booking.status].value++;
            }
        });

        return Object.values(statuses);
    }

    setupRealTimeUpdates() {
        // Update real-time data every 30 seconds
        setInterval(() => {
            this.updateRealTimeData();
        }, 30000);
    }

    updateRealTimeData() {
        this.realTimeData.lastUpdate = new Date();
        this.calculateMetrics();

        // Update real-time displays
        const todayTransactionsEl = document.getElementById('todayTransactions');
        if (todayTransactionsEl) {
            todayTransactionsEl.textContent = this.realTimeData.todayTransactions;
        }

        const pendingBookingsEl = document.getElementById('pendingBookings');
        if (pendingBookingsEl) {
            pendingBookingsEl.textContent = this.realTimeData.pendingBookings;
        }

        const lastUpdateEl = document.getElementById('lastUpdate');
        if (lastUpdateEl) {
            lastUpdateEl.textContent = this.realTimeData.lastUpdate.toLocaleTimeString('fr-FR');
        }
    }

    setupAdminControls() {
        this.createAdminPanel();
    }

    createAdminPanel() {
        // Admin panel is created as part of enhanceDashboard
        // This method can be extended for additional admin functionality
    }

    // Admin management methods
    manageUsers() {
        const modal = document.createElement('div');
        modal.className = 'admin-modal';
        modal.innerHTML = `
            <div class="modal-content large">
                <div class="modal-header">
                    <h2><i class="fas fa-user-shield"></i> Gestion des Utilisateurs</h2>
                    <button class="close-modal">&times;</button>
                </div>
                <div class="users-management">
                    <div class="users-header">
                        <div class="users-stats">
                            <div class="user-stat">
                                <span class="stat-value">${this.getActiveUsersCount()}</span>
                                <span class="stat-label">Utilisateurs actifs</span>
                            </div>
                            <div class="user-stat">
                                <span class="stat-value">${this.getNewUsersThisMonth()}</span>
                                <span class="stat-label">Nouveaux ce mois</span>
                            </div>
                            <div class="user-stat">
                                <span class="stat-value">${this.getInactiveUsersCount()}</span>
                                <span class="stat-label">Utilisateurs inactifs</span>
                            </div>
                        </div>
                        <div class="users-actions">
                            <button class="btn btn-primary" onclick="dashboardManager.inviteUser()">
                                <i class="fas fa-user-plus"></i> Inviter utilisateur
                            </button>
                        </div>
                    </div>
                    
                    <div class="users-table">
                        <div class="table-header">
                            <div>Utilisateur</div>
                            <div>Email</div>
                            <div>Rôle</div>
                            <div>Dernière connexion</div>
                            <div>Statut</div>
                            <div>Actions</div>
                        </div>
                        ${this.renderUsersTable()}
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn" onclick="this.closest('.admin-modal').remove()">Fermer</button>
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

        this.addUserManagementStyles();
    }

    renderUsersTable() {
        const users = this.getMockUsers();
        
        return users.map(user => `
            <div class="table-row">
                <div class="user-info">
                    <div class="user-avatar">${user.name.charAt(0)}</div>
                    <span>${user.name}</span>
                </div>
                <div>${user.email}</div>
                <div><span class="role-badge ${user.role}">${user.role}</span></div>
                <div>${user.lastLogin}</div>
                <div><span class="status-badge ${user.status}">${user.status === 'active' ? 'Actif' : 'Inactif'}</span></div>
                <div class="user-actions">
                    <button class="action-btn" onclick="dashboardManager.editUser('${user.id}')" title="Modifier">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn" onclick="dashboardManager.toggleUserStatus('${user.id}')" title="Activer/Désactiver">
                        <i class="fas fa-power-off"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    getMockUsers() {
        return [
            {
                id: '1',
                name: 'Admin Principal',
                email: 'admin@sfm.com',
                role: 'admin',
                lastLogin: '2025-09-06',
                status: 'active'
            },
            {
                id: '2',
                name: 'Marie Gestionnaire',
                email: 'marie@sfm.com',
                role: 'manager',
                lastLogin: '2025-09-05',
                status: 'active'
            },
            {
                id: '3',
                name: 'Jean Utilisateur',
                email: 'jean@sfm.com',
                role: 'user',
                lastLogin: '2025-09-04',
                status: 'active'
            }
        ];
    }

    addUserManagementStyles() {
        if (document.querySelector('#user-management-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'user-management-styles';
        styles.textContent = `
            .users-management {
                padding: 1.5rem;
            }
            
            .users-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 2rem;
                padding-bottom: 1rem;
                border-bottom: 1px solid var(--border);
            }
            
            .users-stats {
                display: flex;
                gap: 2rem;
            }
            
            .user-stat {
                display: flex;
                flex-direction: column;
                align-items: center;
            }
            
            .user-stat .stat-value {
                font-size: 1.5rem;
                font-weight: 700;
                color: var(--primary);
                margin-bottom: 0.25rem;
            }
            
            .user-stat .stat-label {
                font-size: 0.875rem;
                color: var(--text-light);
            }
            
            .users-table {
                border: 1px solid var(--border);
                border-radius: 8px;
                overflow: hidden;
            }
            
            .users-table .table-header {
                display: grid;
                grid-template-columns: 2fr 2fr 1fr 1fr 1fr 1fr;
                gap: 1rem;
                padding: 1rem;
                background: var(--bg-light);
                font-weight: 600;
                color: var(--text-dark);
            }
            
            .users-table .table-row {
                display: grid;
                grid-template-columns: 2fr 2fr 1fr 1fr 1fr 1fr;
                gap: 1rem;
                padding: 1rem;
                border-bottom: 1px solid var(--border);
                align-items: center;
            }
            
            .users-table .table-row:last-child {
                border-bottom: none;
            }
            
            .users-table .table-row:hover {
                background: var(--bg-light);
            }
            
            .user-info {
                display: flex;
                align-items: center;
                gap: 0.75rem;
            }
            
            .user-avatar {
                width: 32px;
                height: 32px;
                border-radius: 50%;
                background: var(--primary);
                color: white;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: 600;
                font-size: 0.875rem;
            }
            
            .role-badge {
                padding: 0.25rem 0.75rem;
                border-radius: 12px;
                font-size: 0.75rem;
                font-weight: 600;
                text-transform: uppercase;
            }
            
            .role-badge.admin {
                background: var(--error);
                color: white;
            }
            
            .role-badge.manager {
                background: var(--warning);
                color: white;
            }
            
            .role-badge.user {
                background: var(--primary);
                color: white;
            }
            
            .status-badge.active {
                color: var(--success);
            }
            
            .status-badge.inactive {
                color: var(--error);
            }
            
            .user-actions {
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
        `;
        document.head.appendChild(styles);
    }

    backupData() {
        // Simulate data backup
        const data = {
            transactions: this.analytics.transactions,
            bookings: this.analytics.bookings,
            tontines: this.analytics.tontines,
            timestamp: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `sfm-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        
        URL.revokeObjectURL(url);

        if (window.appState) {
            window.appState.showNotification('Sauvegarde créée avec succès', 'success');
        }
    }

    exportData() {
        // Export all data as CSV
        const csvData = this.generateFullCSVReport();
        const blob = new Blob([csvData], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `sfm-export-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        
        URL.revokeObjectURL(url);

        if (window.appState) {
            window.appState.showNotification('Données exportées', 'success');
        }
    }

    generateFullCSVReport() {
        let csv = 'Type,Date,Description,Montant,Catégorie,Statut\n';
        
        // Add transactions
        this.analytics.transactions.forEach(t => {
            csv += `Transaction,${new Date(t.date).toLocaleDateString()},${t.description},${t.amount},${t.category},Completed\n`;
        });
        
        // Add bookings
        this.analytics.bookings.forEach(b => {
            csv += `Booking,${new Date(b.date).toLocaleDateString()},${b.activityName} - ${b.customerName},${b.totalAmount},voyage,${b.status}\n`;
        });

        return csv;
    }

    viewSecurityLogs() {
        const modal = document.createElement('div');
        modal.className = 'security-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2><i class="fas fa-shield-alt"></i> Logs de Sécurité</h2>
                    <button class="close-modal">&times;</button>
                </div>
                <div class="security-logs">
                    <div class="logs-header">
                        <div class="security-summary">
                            <div class="security-stat">
                                <span class="stat-value">${this.getLoginAttempts()}</span>
                                <span class="stat-label">Tentatives de connexion</span>
                            </div>
                            <div class="security-stat">
                                <span class="stat-value">${this.getSecurityAlerts()}</span>
                                <span class="stat-label">Alertes sécurité</span>
                            </div>
                            <div class="security-stat">
                                <span class="stat-value">0</span>
                                <span class="stat-label">Incidents bloqués</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="logs-list">
                        ${this.renderSecurityLogs()}
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn" onclick="this.closest('.security-modal').remove()">Fermer</button>
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

    renderSecurityLogs() {
        const logs = [
            {
                timestamp: new Date(Date.now() - 3600000).toLocaleString(),
                event: 'Connexion réussie',
                user: 'admin@sfm.com',
                ip: '192.168.1.100',
                type: 'success'
            },
            {
                timestamp: new Date(Date.now() - 7200000).toLocaleString(),
                event: 'Tentative de connexion échouée',
                user: 'unknown@domain.com',
                ip: '203.0.113.195',
                type: 'warning'
            },
            {
                timestamp: new Date(Date.now() - 10800000).toLocaleString(),
                event: 'Déconnexion',
                user: 'marie@sfm.com',
                ip: '192.168.1.102',
                type: 'info'
            }
        ];

        return logs.map(log => `
            <div class="log-item ${log.type}">
                <div class="log-timestamp">${log.timestamp}</div>
                <div class="log-event">${log.event}</div>
                <div class="log-user">${log.user}</div>
                <div class="log-ip">${log.ip}</div>
                <div class="log-type">
                    <span class="log-badge ${log.type}">
                        <i class="fas fa-${log.type === 'success' ? 'check' : log.type === 'warning' ? 'exclamation-triangle' : 'info'}"></i>
                        ${log.type}
                    </span>
                </div>
            </div>
        `).join('');
    }

    refreshDashboard() {
        this.loadAnalyticsData();
        this.updateRealTimeData();
        
        // Recreate charts
        this.createCharts();
        
        if (window.appState) {
            window.appState.showNotification('Dashboard actualisé', 'success');
        }
    }

    exportDashboardReport() {
        const reportData = {
            generatedAt: new Date().toLocaleString(),
            metrics: {
                totalRevenue: this.analytics.revenue,
                totalExpenses: this.analytics.expenses,
                netProfit: this.analytics.profit,
                totalBookings: this.analytics.totalBookings,
                confirmedBookings: this.analytics.confirmedBookings,
                conversionRate: this.analytics.conversionRate,
                averageBookingValue: this.analytics.averageBookingValue
            },
            monthlyData: this.getMonthlyRevenueData(),
            revenueBreakdown: this.getRevenueBreakdownData(),
            bookingsData: this.getBookingsData()
        };

        const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `sfm-dashboard-report-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        
        URL.revokeObjectURL(url);

        if (window.appState) {
            window.appState.showNotification('Rapport exporté', 'success');
        }
    }

    // Helper methods for admin data
    getActiveUsersCount() {
        return 3; // Mock data
    }

    getNewUsersThisMonth() {
        return 1; // Mock data
    }

    getInactiveUsersCount() {
        return 0; // Mock data
    }

    getLastBackupDate() {
        return new Date().toLocaleDateString('fr-FR');
    }

    getDataSize() {
        const data = JSON.stringify({
            transactions: this.analytics.transactions,
            bookings: this.analytics.bookings,
            tontines: this.analytics.tontines
        });
        const sizeInKB = Math.round(new Blob([data]).size / 1024);
        return `${sizeInKB} KB`;
    }

    getLoginAttempts() {
        return 25; // Mock data for the last 24 hours
    }

    getSecurityAlerts() {
        return 2; // Mock data
    }

    // User management actions
    inviteUser() {
        const email = prompt('Email de l\'utilisateur à inviter:');
        if (email) {
            if (window.appState) {
                window.appState.showNotification(`Invitation envoyée à ${email}`, 'success');
            }
        }
    }

    editUser(userId) {
        if (window.appState) {
            window.appState.showNotification('Fonctionnalité d\'édition en développement', 'info');
        }
    }

    toggleUserStatus(userId) {
        if (window.appState) {
            window.appState.showNotification('Statut utilisateur modifié', 'success');
        }
    }

    // Utility methods
    formatCurrency(amount) {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'EUR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(Math.abs(amount));
    }

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
            max-width: 600px;
            width: 90%;
            max-height: 90vh;
            overflow-y: auto;
        `;
    }

    // Public method to refresh data (called from navigation)
    refreshData() {
        this.refreshDashboard();
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Dashboard manager is available globally
    window.dashboardManager = new DashboardManager();
});

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DashboardManager;
}(now.getFullYear(), 0, 1);

        // Financial metrics
        this.analytics.revenue = this.analytics.transactions
            .filter(t => t.amount > 0)
            .reduce((sum, t) => sum + t.amount, 0);

        this.analytics.expenses = Math.abs(this.analytics.transactions
            .filter(t => t.amount < 0)
            .reduce((sum, t) => sum + t.amount, 0));

        this.analytics.profit = this.analytics.revenue - this.analytics.expenses;

        // Monthly comparisons
        const thisMonthTransactions = this.analytics.transactions.filter(t => 
            new Date(t.date) >= thisMonth
        );
        const lastMonthTransactions = this.analytics.transactions.filter(t => {
            const date = new Date(t.date);
            return date >= lastMonth && date < thisMonth;
        });

        this.analytics.monthlyRevenue = thisMonthTransactions
            .filter(t => t.amount > 0)
            .reduce((sum, t) => sum + t.amount, 0);

        this.analytics.lastMonthRevenue = lastMonthTransactions
            .filter(t => t.amount > 0)
            .reduce((sum, t) => sum + t.amount, 0);

        this.analytics.monthlyGrowth = this.analytics.lastMonthRevenue > 0 ? 
            ((this.analytics.monthlyRevenue - this.analytics.lastMonthRevenue) / this.analytics.lastMonthRevenue) * 100 : 0;

        // Booking metrics
        this.analytics.totalBookings = this.analytics.bookings.length;
        this.analytics.confirmedBookings = this.analytics.bookings.filter(b => b.status === 'confirmed').length;
        this.analytics.pendingBookings = this.analytics.bookings.filter(b => b.status === 'pending').length;
        this.analytics.bookingRevenue = this.analytics.bookings
            .filter(b => b.status === 'confirmed')
            .reduce((sum, b) => sum + b.totalAmount, 0);

        // Tontine metrics
        this.analytics.activeTontines = this.analytics.tontines.filter(t => t.status === 'active').length;
        this.analytics.tontineRevenue = this.analytics.tontines
            .reduce((sum, t) => sum + (t.totalCollected || 0), 0);

        // Performance metrics
        this.analytics.conversionRate = this.analytics.totalBookings > 0 ? 
            (this.analytics.confirmedBookings / this.analytics.totalBookings) * 100 : 0;

        this.analytics.averageBookingValue = this.analytics.confirmedBookings > 0 ? 
            this.analytics.bookingRevenue / this.analytics.confirmedBookings : 0;

        // Real-time metrics
        this.realTimeData.todayTransactions = this.analytics.transactions.filter(t => {
            const date = new Date(t.date);
            return date.toDateString() === now.toDateString();
        }).length;

        this.realTimeData.pendingBookings = this.analytics.pendingBookings;
    }

    setupDashboard() {
        this.updateDashboardStats();
        this.createAnalyticsCards();
        this.setupAdminPanel();
    }

    updateDashboardStats() {
        // Update the main dashboard stats
        const statCards = document.querySelectorAll('.stat-value');
        if (statCards.length >= 4) {
            statCards[0].textContent = this.formatCurrency(this.analytics.revenue - this.analytics.expenses);
            statCards[0].className = `stat-value ${this.analytics.profit >= 0 ? 'text-success' : 'text-error'}`;
            
            statCards[1].textContent = window.travelManager ? window.travelManager.offers.length : 0;
            statCards[2].textContent = this.analytics.totalBookings;
            statCards[3].textContent = window.teamManager ? window.teamManager.members.length : 0;
        }

        // Add enhanced dashboard if in dashboard module
        if (document.getElementById('dashboard')) {
            this.enhanceDashboard();
        }
    }

    enhanceDashboard() {
        const dashboardModule = document.getElementById('dashboard');
        if (!dashboardModule || document.querySelector('.enhanced-dashboard')) return;

        const enhancedDashboard = document.createElement('div');
        enhancedDashboard.className = 'enhanced-dashboard';
        enhancedDashboard.innerHTML = `
            <div class="dashboard-header">
                <div class="dashboard-title">
                    <h1>Tableau de Bord Avancé</h1>
                    <p>Vue d'ensemble de votre activité</p>
                </div>
                <div class="dashboard-actions">
                    <button class="btn" id="refreshDashboard">
                        <i class="fas fa-sync-alt"></i> Actualiser
                    </button>
                    <button class="btn btn-primary" id="exportReport">
                        <i class="fas fa-download"></i> Rapport
                    </button>
                </div>
            </div>

            <div class="metrics-overview">
                <div class="metric-card revenue">
                    <div class="metric-icon">
                        <i class="fas fa-euro-sign"></i>
                    </div>
                    <div class="metric-content">
                        <div class="metric-value">${this.formatCurrency(this.analytics.revenue)}</div>
                        <div class="metric-label">Revenus Total</div>
                        <div class="metric-change ${this.analytics.monthlyGrowth >= 0 ? 'positive' : 'negative'}">
                            <i class="fas fa-arrow-${this.analytics.monthlyGrowth >= 0 ? 'up' : 'down'}"></i>
                            ${Math.abs(this.analytics.monthlyGrowth).toFixed(1)}% ce mois
                        </div>
                    </div>
                </div>

                <div class="metric-card bookings">
                    <div class="metric-icon">
                        <i class="fas fa-calendar-check"></i>
                    </div>
                    <div class="metric-content">
                        <div class="metric-value">${this.analytics.confirmedBookings}</div>
                        <div class="metric-label">Réservations Confirmées</div>
                        <div class="metric-change">
                            <i class="fas fa-percentage"></i>
                            ${this.analytics.conversionRate.toFixed(1)}% taux de conversion
                        </div>
                    </div>
                </div>

                <div class="metric-card tontines">
                    <div class="metric-icon">
                        <i class="fas fa-users"></i>
                    </div>
                    <div class="metric-content">
                        <div class="metric-value">${this.analytics.activeTontines}</div>
                        <div class="metric-label">Tontines Actives</div>
                        <div class="metric-change">
                            <i class="fas fa-coins"></i>
                            ${this.formatCurrency(this.analytics.tontineRevenue)} collecté
                        </div>
                    </div>
                </div>

                <div class="metric-card profit">
                    <div class="metric-icon">
                        <i class="fas fa-chart-line"></i>
                    </div>
                    <div class="metric-content">
                        <div class="metric-value ${this.analytics.profit >= 0 ? 'positive' : 'negative'}">
                            ${this.formatCurrency(this.analytics.profit)}
                        </div>
                        <div class="metric-label">Bénéfice Net</div>
                        <div class="metric-change">
                            <i class="fas fa-calculator"></i>
                            ${this.formatCurrency(this.analytics.averageBookingValue)} panier moyen
                        </div>
                    </div>
                </div>
            </div>

            <div class="analytics-grid">
                <div class="analytics-card">
                    <h3><i class="fas fa-chart-area"></i> Évolution des Revenus</h3>
                    <div class="chart-container">
                        <canvas id="revenueChart" width="400" height="200"></canvas>
                    </div>
                </div>

                <div class="analytics-card">
                    <h3><i class="fas fa-chart-pie"></i> Répartition des Revenus</h3>
                    <div class="chart-container">
                        <canvas id="revenueBreakdownChart" width="400" height="200"></canvas>
                    </div>
                </div>

                <div class="analytics-card">
                    <h3><i class="fas fa-chart-bar"></i> Performance des Réservations</h3>
                    <div class="chart-container">
                        <canvas id="bookingsChart" width="400" height="200"></canvas>
                    </div>
                </div>

                <div class="analytics-card">
                    <h3><i class="fas fa-clock"></i> Activité en Temps Réel</h3>
                    <div class="real-time-stats">
                        <div class="real-time-metric">
                            <span class="rt-label">Transactions aujourd'hui</span>
                            <span class="rt-value" id="todayTransactions">${this.realTimeData.todayTransactions}</span>
                        </div>
                        <div class="real-time-metric">
                            <span class="rt-label">Réservations en attente</span>
                            <span class="rt-value" id="pendingBookings">${this.realTimeData.pendingBookings}</span>
                        </div>
                        <div class="real-time-metric">
                            <span class="rt-label">Dernière mise à jour</span>
                            <span class="rt-value" id="lastUpdate">${this.realTimeData.lastUpdate.toLocaleTimeString('fr-FR')}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="management-section">
                <h2><i class="fas fa-cogs"></i> Gestion et Administration</h2>
                <div class="admin-cards">
                    <div class="admin-card">
                        <h4><i class="fas fa-user-shield"></i> Gestion des Utilisateurs</h4>
                        <div class="admin-stats">
                            <div class="admin-stat">
                                <span>Utilisateurs actifs:</span>
                                <span>${this.getActiveUsersCount()}</span>
                            </div>
                            <div class="admin-stat">
                                <span>Nouveaux ce mois:</span>
                                <span>${this.getNewUsersThisMonth()}</span>
                            </div>
                        </div>
                        <div class="admin-actions">
                            <button class="btn btn-sm" onclick="dashboardManager.manageUsers()">
                                Gérer les utilisateurs
                            </button>
                        </div>
                    </div>

                    <div class="admin-card">
                        <h4><i class="fas fa-database"></i> Données et Sauvegarde</h4>
                        <div class="admin-stats">
                            <div class="admin-stat">
                                <span>Dernière sauvegarde:</span>
                                <span>${this.getLastBackupDate()}</span>
                            </div>
                            <div class="admin-stat">
                                <span>Taille des données:</span>
                                <span>${this.getDataSize()}</span>
                            </div>
                        </div>
                        <div class="admin-actions">
                            <button class="btn btn-sm" onclick="dashboardManager.backupData()">
                                Sauvegarder
                            </button>
                            <button class="btn btn-sm" onclick="dashboardManager.exportData()">
                                Exporter
                            </button>
                        </div>
                    </div>

                    <div class="admin-card">
                        <h4><i class="fas fa-shield-alt"></i> Sécurité</h4>
                        <div class="admin-stats">
                            <div class="admin-stat">
                                <span>Tentatives de connexion:</span>
                                <span>${this.getLoginAttempts()}</span>
                            </div>
                            <div class="admin-stat">
                                <span>Alertes sécurité:</span>
                                <span>${this.getSecurityAlerts()}</span>
                            </div>
                        </div>
                        <div class="admin-actions">
                            <button class="btn btn-sm" onclick="dashboardManager.viewSecurityLogs()">
                                Voir les logs
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Insert enhanced dashboard
        const existingStats = dashboardModule.querySelector('.stats-grid');
        if (existingStats) {
            existingStats.insertAdjacentElement('afterend', enhancedDashboard);
        }

        this.addDashboardStyles();
        this.setupDashboardEvents();
    }

    addDashboardStyles() {
        if (document.querySelector('#dashboard-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'dashboard-styles';
        styles.textContent = `
            .enhanced-dashboard {
                margin-top: 2rem;
            }
            
            .dashboard-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 2rem;
                padding: 1.5rem;
                background: var(--bg-white);
                border-radius: var(--border-radius);
                box-shadow: var(--shadow);
            }
            
            .dashboard-title h1 {
                margin: 0 0 0.5rem 0;
                color: var(--text-dark);
            }
            
            .dashboard-title p {
                margin: 0;
                color: var(--text-light);
            }
            
            .dashboard-actions {
                display: flex;
                gap: 1rem;
            }
            
            .metrics-overview {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 1.5rem;
                margin-bottom: 2rem;
            }
            
            .metric-card {
                background: var(--bg-white);
                border-radius: var(--border-radius);
                box-shadow: var(--shadow);
                padding: 1.5rem;
                display: flex;
                align-items: center;
                gap: 1rem;
                transition: var(--transition);
                position: relative;
                overflow: hidden;
            }
            
            .metric-card::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 4px;
            }
            
            .metric-card.revenue::before {
                background: var(--success);
            }
            
            .metric-card.bookings::before {
                background: var(--primary);
            }
            
            .metric-card.tontines::before {
                background: var(--warning);
            }
            
            .metric-card.profit::before {
                background: var(--secondary);
            }
            
            .metric-card:hover {
                transform: translateY(-2px);
                box-shadow: 0 8px 25px rgba(0,0,0,0.15);
            }
            
            .metric-icon {
                width: 60px;
                height: 60px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 1.5rem;
                color: white;
            }
            
            .metric-card.revenue .metric-icon {
                background: var(--success);
            }
            
            .metric-card.bookings .metric-icon {
                background: var(--primary);
            }
            
            .metric-card.tontines .metric-icon {
                background: var(--warning);
            }
            
            .metric-card.profit .metric-icon {
                background: var(--secondary);
            }
            
            .metric-content {
                flex: 1;
            }
            
            .metric-value {
                font-size: 1.8rem;
                font-weight: 700;
                color: var(--text-dark);
                margin-bottom: 0.25rem;
                line-height: 1;
            }
            
            .metric-value.positive {
                color: var(--success);
            }
            
            .metric-value.negative {
                color: var(--error);
            }
            
            .metric-label {
                color: var(--text-light);
                font-size: 0.875rem;
                font-weight: 500;
                margin-bottom: 0.5rem;
            }
            
            .metric-change {
                display: flex;
                align-items: center;
                gap: 0.25rem;
                font-size: 0.75rem;
                font-weight: 600;
            }
            
            .metric-change.positive {
                color: var(--success);
            }
            
            .metric-change.negative {
                color: var(--error);
            }
            
            .analytics-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                gap: 1.5rem;
                margin-bottom: 2rem;
            }
            
            .analytics-card {
                background: var(--bg-white);
                border-radius: var(--border-radius);
                box-shadow: var(--shadow);
                padding: 1.5rem;
            }
            
            .analytics-card h3 {
                margin: 0 0 1rem 0;
                color: var(--text-dark);
                display: flex;
                align-items: center;
                gap: 0.5rem;
                font-size: 1rem;
            }
            
            .chart-container {
                position: relative;
                height: 200px;
            }
            
            .real-time-stats {
                display: flex;
                flex-direction: column;
                gap: 1rem;
            }
            
            .real-time-metric {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 1rem;
                background: var(--bg-light);
                border-radius: 8px;
                border-left: 4px solid var(--primary);
            }
            
            .rt-label {
                color: var(--text-light);
                font-size: 0.875rem;
            }
            
            .rt-value {
                font-weight: 700;
                color: var(--text-dark);
                font-size: 1.1rem;
            }
            
            .management-section {
                background: var(--bg-white);
                border-radius: var(--border-radius);
                box-shadow: var(--shadow);
                padding: 2rem;
            }
            
            .management-section h2 {
                margin: 0 0 1.5rem 0;
                color: var(--text-dark);
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }
            
            .admin-cards {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                gap: 1.5rem;
            }
            
            .admin-card {
                border: 1px solid var(--border);
                border-radius: 8px;
                padding: 1.5rem;
                background: var(--bg-light);
            }
            
            .admin-card h4 {
                margin: 0 0 1rem 0;
                color: var(--text-dark);
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }
            
            .admin-stats {
                margin-bottom: 1rem;
            }
            
            .admin-stat {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 0.5rem;
                font-size: 0.875rem;
            }
            
            .admin-stat span:first-child {
                color: var(--text-light);
            }
            
            .admin-stat span:last-child {
                font-weight: 600;
                color: var(--text-dark);
            }
            
            .admin-actions {
                display: flex;
                gap: 0.5rem;
                flex-wrap: wrap;
            }
            
            .btn-sm {
                padding: 0.5rem 1rem;
                font-size: 0.875rem;
            }
        `;
        document.head.appendChild(styles);
    }

    setupDashboardEvents() {
        document.getElementById('refreshDashboard')?.addEventListener('click', () => {
            this.refreshDashboard();
        });

        document.getElementById('exportReport')?.addEventListener('click', () => {
            this.exportDashboardReport();
        });
    }

    createCharts() {
        // Create revenue trend chart
        this.createRevenueChart();
        
        // Create revenue breakdown chart
        this.createRevenueBreakdownChart();
        
        // Create bookings performance chart
        this.createBookingsChart();
    }

    createRevenueChart() {
        const canvas = document.getElementById('revenueChart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const monthlyData = this.getMonthlyRevenueData();

        // Simple canvas-based chart
        this.drawLineChart(ctx, monthlyData, {
            width: canvas.width,
            height: canvas.height,
            color: '#2563eb',
            fillColor: 'rgba(37, 99, 235, 0.1)'
        });
    }

    createRevenueBreakdownChart() {
        const canvas = document.getElementById('revenueBreakdownChart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const breakdownData = this.getRevenueBreakdownData();

        this.drawPieChart(ctx, breakdownData, {
            width: canvas.width,
            height: canvas.height
        });
    }

    createBookingsChart() {
        const canvas = document.getElementById('bookingsChart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const bookingsData = this.getBookingsData();

        this.drawBarChart(ctx, bookingsData, {
            width: canvas.width,
            height: canvas.height,
            color: '#059669'
        });
    }

    // Chart drawing methods
    drawLineChart(ctx, data, options) {
        const { width, height, color, fillColor } = options;
        const padding = 40;
        const chartWidth = width - 2 * padding;
        const chartHeight = height - 2 * padding;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        if (data.length === 0) {
            ctx.fillStyle = '#64748b';
            ctx.font = '14px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Aucune donnée disponible', width / 2, height / 2);
            return;
        }

        const maxValue = Math.max(...data.map(d => d.value));
        const minValue = Math.min(...data.map(d => d.value));
        const range = maxValue - minValue || 1;

        // Draw axes
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(padding, padding);
        ctx.lineTo(padding, height - padding);
        ctx.lineTo(width - padding, height - padding);
        ctx.stroke();

        // Draw line
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();

        const points = data.map((d, i) => ({
            x: padding + (i / (data.length - 1)) * chartWidth,
            y: height - padding - ((d.value - minValue) / range) * chartHeight
        }));

        // Draw fill area
        if (fillColor) {
            ctx.fillStyle = fillColor;
            ctx.beginPath();
            ctx.moveTo(points[0].x, height - padding);
            points.forEach(point => ctx.lineTo(point.x, point.y));
            ctx.lineTo(points[points.length - 1].x, height - padding);
            ctx.closePath();
            ctx.fill();
        }

        // Draw line
        ctx.beginPath();
        points.forEach((point, i) => {
            if (i === 0) ctx.moveTo(point.x, point.y);
            else ctx.lineTo(point.x, point.y);
        });
        ctx.stroke();

        // Draw points
        ctx.fillStyle = color;
        points.forEach(point => {
            ctx.beginPath();
            ctx.arc(point.x, point.y, 3, 0, 2 * Math.PI);
            ctx.fill();
        });

        // Draw labels
        ctx.fillStyle = '#64748b';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        data.forEach((d, i) => {
            const x = padding + (i / (data.length - 1)) * chartWidth;
            ctx.fillText(d.label, x, height - 10);
        });
    }

    drawPieChart(ctx, data, options) {
        const { width, height } = options;
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(width, height) / 2 - 20;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        if (data.length === 0) {
            ctx.fillStyle = '#64748b';
            ctx.font = '14px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Aucune donnée disponible', centerX, centerY);
            return;
        }

        const total = data.reduce((sum, d) => sum + d.value, 0);
        const colors = ['#2563eb', '#059669', '#d97706', '#dc2626', '#8b5cf6'];

        let currentAngle = -Math.PI / 2;

        data.forEach((segment, i) => {
            const sliceAngle = (segment.value / total) * 2 * Math.PI;
            
            // Draw slice
            ctx.fillStyle = colors[i % colors.length];
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
            ctx.closePath();
            ctx.fill();

            // Draw label
            const labelAngle = currentAngle + sliceAngle / 2;
            const labelX = centerX + Math.cos(labelAngle) * (radius + 15);
            const labelY = centerY + Math.sin(labelAngle) * (radius + 15);
            
            ctx.fillStyle = '#1e293b';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(segment.label, labelX, labelY);
            
            currentAngle += sliceAngle;
        });
    }

    drawBarChart(ctx, data, options) {
        const { width, height, color } = options;
        const padding = 40;
        const chartWidth = width - 2 * padding;
        const chartHeight = height - 2 * padding;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        if (data.length === 0) {
            ctx.fillStyle = '#64748b';
            ctx.font = '14px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Aucune donnée disponible', width / 2, height / 2);
            return;
        }

        const maxValue = Math.max(...data.map(d => d.value));
        const barWidth = chartWidth / data.length * 0.8;
        const barSpacing = chartWidth / data.length * 0.2;

        // Draw axes
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(padding, padding);
        ctx.lineTo(padding, height - padding);
        ctx.lineTo(width - padding, height - padding);
        ctx.stroke();

        // Draw bars
        ctx.fillStyle = color;
        data.forEach((d, i) => {
            const barHeight = (d.value / maxValue) * chartHeight;
            const x = padding + i * (barWidth + barSpacing) + barSpacing / 2;
            const y = height - padding - barHeight;
            
            ctx.fillRect(x, y, barWidth, barHeight);
            
            // Draw label
            ctx.fillStyle = '#64748b';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(d.label, x + barWidth / 2, height - 10);
            
            // Draw value
            ctx.fillStyle = '#1e293b';
            ctx.fillText(d.value.toString(), x + barWidth / 2, y - 5);
            
            ctx.fillStyle = color;
        });
    }

    // Data preparation methods
    getMonthlyRevenueData() {
        const months = [];
        const now = new Date();
        
        for (let i = 5; i >= 0; i--) {
            const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
            
            const monthlyRevenue = this.analytics.transactions
                .filter(t => {
                    const date = new Date(t.date);
                    return date >= month && date < nextMonth && t.amount > 0;
                })
                .reduce((sum, t) => sum + t.amount, 0);

            months.push({
                label: month.toLocaleDateString('fr-FR', { month: 'short' }),
                value: monthlyRevenue
            });
        }
        
        return months;
    }

    getRevenueBreakdownData() {
        const sources = {
            voyage: { label: 'Voyages', value: 0 },
            tontine: {/**
 * ====================================
 * SFM - Dashboard Module
 * Admin dashboard with analytics and management
 * ====================================
 */

class DashboardManager {
    constructor() {
        this.analytics = {
            transactions: [],
            bookings: [],
            tontines: [],
            users: [],
            revenue: 0,
            expenses: 0,
            profit: 0
        };
        this.charts = {};
        this.realTimeData = {
            lastUpdate: new Date(),
            activeUsers: 0,
            todayTransactions: 0,
            pendingBookings: 0
        };
        this.init();
    }

    init() {
        this.loadAnalyticsData();
        this.setupDashboard();
        this.createCharts();
        this.setupRealTimeUpdates();
        this.setupAdminControls();
    }

    loadAnalyticsData() {
        // Aggregate data from all modules
        if (window.appState) {
            this.analytics.transactions = window.appState.data.transactions || [];
            this.analytics.bookings = window.appState.data.bookings || [];
            this.analytics.tontines = window.appState.data.tontines || [];
        }

        // Calculate key metrics
        this.calculateMetrics();
    }

    calculateMetrics() {
        const now = new Date();
        const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const thisYear = new Date