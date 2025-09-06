        // Save to bookings collection if available
        if (window.appState && window.appState.data.bookings) {
            window.appState.data.bookings.push(booking);
            window.appState.saveData('bookings', window.appState.data.bookings);
        }

        // Add revenue transaction to caisse
        if (window.caisseManager) {
            const transaction = {
                id: window.caisseManager.generateId(),
                description: `Réservation: ${offer.title} - ${bookingData.customerName}`,
                amount: booking.totalAmount,
                category: 'voyage',
                date: new Date().toISOString(),
                type: 'income',
                createdBy: window.appState?.currentUser?.uid || 'demo-user',
                relatedBookingId: booking.id
            };
            
            // Add transaction silently
            if (window.caisseManager.transactions) {
                window.caisseManager.transactions.unshift(transaction);
                window.caisseManager.saveData();
                window.caisseManager.updateStats();
            }
        }

        this.saveData();
        modal.remove();
        
        // Success notification
        if (window.appState) {
            window.appState.showNotification(
                `Réservation confirmée pour ${bookingData.customerName} - ${booking.totalAmount}€`, 
                'success'
            );
        }

        // Send confirmation email (mock)
        this.sendBookingConfirmation(booking);
    }

    sendBookingConfirmation(booking) {
        // Mock email sending
        console.log('Sending booking confirmation email to:', booking.customerEmail);
        
        // In a real app, this would integrate with EmailJS or similar service
        setTimeout(() => {
            if (window.appState) {
                window.appState.showNotification('Email de confirmation envoyé', 'info');
            }
        }, 2000);
    }

    renderOffers() {
        const travelGrid = document.querySelector('.travel-grid');
        if (!travelGrid) return;

        const filteredOffers = this.getFilteredOffers();
        
        travelGrid.innerHTML = '';
        
        if (filteredOffers.length === 0) {
            travelGrid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: var(--text-light);">
                    <i class="fas fa-plane" style="font-size: 4rem; margin-bottom: 1rem; opacity: 0.3;"></i>
                    <h3>Aucune offre trouvée</h3>
                    <p>Créez votre première offre de voyage pour commencer</p>
                </div>
            `;
            return;
        }

        filteredOffers.forEach(offer => {
            const card = this.createOfferCard(offer);
            travelGrid.appendChild(card);
        });

        // Update view count
        this.updateViewCounts();
    }

    createOfferCard(offer) {
        const category = this.categories.find(cat => cat.id === offer.category);
        const card = document.createElement('div');
        card.className = 'travel-card';
        card.setAttribute('data-offer-id', offer.id);
        
        const bookingsCount = offer.bookings ? offer.bookings.length : 0;
        const totalRevenue = offer.bookings ? 
            offer.bookings.reduce((sum, b) => sum + b.totalAmount, 0) : 0;

        card.innerHTML = `
            <div class="travel-image" style="background: linear-gradient(45deg, ${category?.color || '#2563eb'}, ${this.lightenColor(category?.color || '#2563eb', 20)});">
                <i class="fas ${category?.icon || 'fa-map'}"></i>
                <div class="offer-badges">
                    ${offer.status === 'featured' ? '<span class="badge featured">Vedette</span>' : ''}
                    ${offer.difficulty ? `<span class="badge difficulty">${offer.difficulty}</span>` : ''}
                    ${offer.maxParticipants ? `<span class="badge capacity">${offer.maxParticipants} places</span>` : ''}
                </div>
            </div>
            <div class="travel-info">
                <div class="offer-header">
                    <h3>${offer.title}</h3>
                    <div class="offer-meta">
                        <span><i class="fas fa-map-marker-alt"></i> ${offer.destination}</span>
                        ${offer.duration ? `<span><i class="fas fa-clock"></i> ${offer.duration} jours</span>` : ''}
                    </div>
                </div>
                
                <p class="offer-description">${offer.description || 'Description non disponible'}</p>
                
                ${offer.includes && offer.includes.length > 0 ? `
                    <div class="offer-includes">
                        <strong>Inclus:</strong>
                        <div class="includes-list">
                            ${offer.includes.map(item => `<span class="include-item">${this.getIncludeLabel(item)}</span>`).join('')}
                        </div>
                    </div>
                ` : ''}
                
                <div class="offer-stats">
                    <div class="stat">
                        <i class="fas fa-eye"></i>
                        <span>${offer.views || 0} vues</span>
                    </div>
                    <div class="stat">
                        <i class="fas fa-calendar-check"></i>
                        <span>${bookingsCount} réservation${bookingsCount > 1 ? 's' : ''}</span>
                    </div>
                    ${totalRevenue > 0 ? `
                        <div class="stat">
                            <i class="fas fa-euro-sign"></i>
                            <span>${totalRevenue}€ généré</span>
                        </div>
                    ` : ''}
                </div>
                
                <div class="offer-footer">
                    <div class="travel-price">${offer.price}€</div>
                    <div class="offer-actions">
                        <button class="btn btn-primary book-btn" onclick="travelManager.showBookingModal('${offer.id}')">
                            <i class="fas fa-calendar-plus"></i> Réserver
                        </button>
                        <div class="action-menu">
                            <button class="action-btn" onclick="travelManager.showOfferMenu('${offer.id}', event)">
                                <i class="fas fa-ellipsis-v"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Add card styles if not already added
        this.addOfferCardStyles();

        return card;
    }

    showOfferMenu(offerId, event) {
        event.stopPropagation();
        
        const offer = this.offers.find(o => o.id === offerId);
        if (!offer) return;

        // Remove existing menu
        document.querySelector('.offer-context-menu')?.remove();

        const menu = document.createElement('div');
        menu.className = 'offer-context-menu';
        menu.innerHTML = `
            <div class="menu-item" onclick="travelManager.editOffer('${offerId}')">
                <i class="fas fa-edit"></i> Modifier
            </div>
            <div class="menu-item" onclick="travelManager.duplicateOffer('${offerId}')">
                <i class="fas fa-copy"></i> Dupliquer
            </div>
            <div class="menu-item" onclick="travelManager.toggleOfferStatus('${offerId}')">
                <i class="fas fa-${offer.status === 'active' ? 'pause' : 'play'}"></i> 
                ${offer.status === 'active' ? 'Désactiver' : 'Activer'}
            </div>
            <div class="menu-item" onclick="travelManager.viewOfferStats('${offerId}')">
                <i class="fas fa-chart-bar"></i> Statistiques
            </div>
            <div class="menu-item danger" onclick="travelManager.deleteOffer('${offerId}')">
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

    editOffer(offerId) {
        const offer = this.offers.find(o => o.id === offerId);
        if (!offer) return;

        // Create edit modal
        const modal = document.createElement('div');
        modal.className = 'edit-offer-modal';
        modal.innerHTML = `
            <div class="modal-content large">
                <div class="modal-header">
                    <h2>Modifier l'Offre</h2>
                    <button class="close-modal">&times;</button>
                </div>
                <form id="editOfferForm">
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
                        <div class="form-group">
                            <label>Titre de l'offre</label>
                            <input type="text" name="title" class="form-input" value="${offer.title}" required>
                        </div>
                        <div class="form-group">
                            <label>Destination</label>
                            <input type="text" name="destination" class="form-input" value="${offer.destination}" required>
                        </div>
                        <div class="form-group">
                            <label>Prix (€)</label>
                            <input type="number" name="price" class="form-input" value="${offer.price}" step="0.01" required>
                        </div>
                        <div class="form-group">
                            <label>Durée (jours)</label>
                            <input type="number" name="duration" class="form-input" value="${offer.duration || ''}" min="1">
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label>Description</label>
                        <textarea name="description" class="form-input" rows="4">${offer.description || ''}</textarea>
                    </div>
                    
                    <div class="modal-actions">
                        <button type="submit" class="btn btn-primary">Sauvegarder</button>
                        <button type="button" class="btn" onclick="this.closest('.edit-offer-modal').remove()">Annuler</button>
                    </div>
                </form>
            </div>
        `;

        this.addModalStyles(modal);
        modal.querySelector('.modal-content').style.maxWidth = '600px';
        document.body.appendChild(modal);

        // Handle form submission
        const form = modal.querySelector('#editOfferForm');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveOfferEdit(offerId, form, modal);
        });

        // Close modal
        modal.querySelector('.close-modal').onclick = () => modal.remove();
        modal.onclick = (e) => {
            if (e.target === modal) modal.remove();
        };
    }

    saveOfferEdit(offerId, form, modal) {
        const formData = new FormData(form);
        const editData = Object.fromEntries(formData.entries());

        if (!this.validateOfferData(editData)) {
            return;
        }

        const offerIndex = this.offers.findIndex(o => o.id === offerId);
        if (offerIndex !== -1) {
            this.offers[offerIndex] = {
                ...this.offers[offerIndex],
                title: editData.title.trim(),
                destination: editData.destination.trim(),
                price: parseFloat(editData.price),
                duration: parseInt(editData.duration) || null,
                description: editData.description.trim(),
                updatedAt: new Date().toISOString()
            };

            this.saveData();
            this.renderOffers();
            modal.remove();
            
            if (window.appState) {
                window.appState.showNotification('Offre modifiée avec succès', 'success');
            }
        }
    }

    duplicateOffer(offerId) {
        const offer = this.offers.find(o => o.id === offerId);
        if (!offer) return;

        const duplicatedOffer = {
            ...offer,
            id: this.generateId(),
            title: offer.title + ' (Copie)',
            bookings: [],
            views: 0,
            createdAt: new Date().toISOString(),
            status: 'draft'
        };

        this.offers.unshift(duplicatedOffer);
        this.saveData();
        this.renderOffers();
        
        if (window.appState) {
            window.appState.showNotification('Offre dupliquée', 'success');
        }
    }

    toggleOfferStatus(offerId) {
        const offer = this.offers.find(o => o.id === offerId);
        if (!offer) return;

        offer.status = offer.status === 'active' ? 'inactive' : 'active';
        offer.updatedAt = new Date().toISOString();
        
        this.saveData();
        this.renderOffers();
        
        if (window.appState) {
            window.appState.showNotification(
                `Offre ${offer.status === 'active' ? 'activée' : 'désactivée'}`, 
                'success'
            );
        }
    }

    viewOfferStats(offerId) {
        const offer = this.offers.find(o => o.id === offerId);
        if (!offer) return;

        const bookings = offer.bookings || [];
        const totalRevenue = bookings.reduce((sum, b) => sum + b.totalAmount, 0);
        const avgBookingValue = bookings.length > 0 ? totalRevenue / bookings.length : 0;

        const modal = document.createElement('div');
        modal.className = 'stats-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Statistiques: ${offer.title}</h2>
                    <button class="close-modal">&times;</button>
                </div>
                <div class="stats-content">
                    <div class="stats-grid">
                        <div class="stat-card">
                            <div class="stat-value">${offer.views || 0}</div>
                            <div class="stat-label">Vues</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value">${bookings.length}</div>
                            <div class="stat-label">Réservations</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value">${totalRevenue}€</div>
                            <div class="stat-label">Revenus totaux</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value">${Math.round(avgBookingValue)}€</div>
                            <div class="stat-label">Valeur moyenne</div>
                        </div>
                    </div>
                    
                    ${bookings.length > 0 ? `
                        <div class="bookings-list">
                            <h3>Réservations récentes</h3>
                            ${bookings.slice(0, 5).map(booking => `
                                <div class="booking-item">
                                    <strong>${booking.customerName}</strong>
                                    <span>${booking.persons} personne${booking.persons > 1 ? 's' : ''}</span>
                                    <span>${booking.totalAmount}€</span>
                                    <span class="status ${booking.status}">${booking.status}</span>
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}
                </div>
                <div class="modal-footer">
                    <button class="btn" onclick="this.closest('.stats-modal').remove()">Fermer</button>
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

    deleteOffer(offerId) {
        const offer = this.offers.find(o => o.id === offerId);
        if (!offer) return;

        const hasBookings = offer.bookings && offer.bookings.length > 0;
        
        let confirmMessage = `Êtes-vous sûr de vouloir supprimer l'offre "${offer.title}" ?`;
        if (hasBookings) {
            confirmMessage += `\n\nAttention: Cette offre a ${offer.bookings.length} réservation(s) associée(s).`;
        }

        if (confirm(confirmMessage)) {
            this.offers = this.offers.filter(o => o.id !== offerId);
            this.saveData();
            this.renderOffers();
            
            if (window.appState) {
                window.appState.showNotification('Offre supprimée', 'success');
            }
        }
    }

    // Filtering and search functionality
    setupFiltering() {
        const travelModule = document.getElementById('travel');
        if (document.querySelector('.travel-filters')) return;

        const filtersHTML = `
            <div class="travel-filters card">
                <h3>Filtres et Recherche</h3>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-top: 1rem;">
                    <div class="form-group">
                        <label>Recherche</label>
                        <input type="text" id="travelSearch" class="form-input" placeholder="Titre, destination...">
                    </div>
                    <div class="form-group">
                        <label>Catégorie</label>
                        <select id="categoryFilter" class="form-input">
                            <option value="all">Toutes les catégories</option>
                            ${this.categories.map(cat => 
                                `<option value="${cat.id}">${cat.name}</option>`
                            ).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Prix</label>
                        <select id="priceFilter" class="form-input">
                            <option value="all">Tous les prix</option>
                            <option value="0-500">Moins de 500€</option>
                            <option value="500-1000">500€ - 1000€</option>
                            <option value="1000-2000">1000€ - 2000€</option>
                            <option value="2000+">Plus de 2000€</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Tri</label>
                        <select id="sortFilter" class="form-input">
                            <option value="date">Plus récent</option>
                            <option value="price-asc">Prix croissant</option>
                            <option value="price-desc">Prix décroissant</option>
                            <option value="popularity">Popularité</option>
                            <option value="name">Nom A-Z</option>
                        </select>
                    </div>
                </div>
                <div style="display: flex; gap: 1rem; margin-top: 1rem;">
                    <button class="btn" id="clearFilters">Effacer les filtres</button>
                    <button class="btn btn-primary" id="exportOffers">Exporter les offres</button>
                </div>
            </div>
        `;

        const travelGrid = travelModule.querySelector('.travel-grid');
        travelGrid.insertAdjacentHTML('beforebegin', filtersHTML);

        // Event listeners
        document.getElementById('travelSearch').addEventListener('input', this.debounce(() => {
            this.applyFilters();
        }, 300));

        ['categoryFilter', 'priceFilter', 'sortFilter'].forEach(id => {
            document.getElementById(id).addEventListener('change', () => {
                this.applyFilters();
            });
        });

        document.getElementById('clearFilters').addEventListener('click', () => {
            this.clearFilters();
        });

        document.getElementById('exportOffers').addEventListener('click', () => {
            this.exportOffers();
        });
    }

    applyFilters() {
        this.filters = {
            search: document.getElementById('travelSearch').value.toLowerCase(),
            category: document.getElementById('categoryFilter').value,
            priceRange: document.getElementById('priceFilter').value
        };
        
        this.sortBy = document.getElementById('sortFilter').value;
        this.renderOffers();
    }

    clearFilters() {
        document.getElementById('travelSearch').value = '';
        document.getElementById('categoryFilter').value = 'all';
        document.getElementById('priceFilter').value = 'all';
        document.getElementById('sortFilter').value = 'date';
        
        this.filters = {
            search: '',
            category: 'all',
            priceRange: 'all'
        };
        this.sortBy = 'date';
        this.renderOffers();
    }

    getFilteredOffers() {
        let filtered = [...this.offers];

        // Search filter
        if (this.filters.search) {
            filtered = filtered.filter(offer => 
                offer.title.toLowerCase().includes(this.filters.search) ||
                offer.destination.toLowerCase().includes(this.filters.search) ||
                offer.description.toLowerCase().includes(this.filters.search)
            );
        }

        // Category filter
        if (this.filters.category !== 'all') {
            filtered = filtered.filter(offer => offer.category === this.filters.category);
        }

        // Price filter
        if (this.filters.priceRange !== 'all') {
            const [min, max] = this.filters.priceRange.split('-').map(p => 
                p === '+' ? Infinity : parseInt(p.replace('+', ''))
            );
            filtered = filtered.filter(offer => {
                if (max) {
                    return offer.price >= min && offer.price <= max;
                } else {
                    return offer.price >= min;
                }
            });
        }

        // Sort
        filtered.sort((a, b) => {
            switch (this.sortBy) {
                case 'price-asc':
                    return a.price - b.price;
                case 'price-desc':
                    return b.price - a.price;
                case 'popularity':
                    return (b.views || 0) - (a.views || 0);
                case 'name':
                    return a.title.localeCompare(b.title);
                case 'date':
                default:
                    return new Date(b.createdAt) - new Date(a.createdAt);
            }
        });

        return filtered;
    }

    // Utility functions
    getRandomImage() {
        const images = ['mountain', 'water', 'city', 'forest', 'beach', 'desert'];
        return images[Math.floor(Math.random() * images.length)];
    }

    getCategoryIcon(categoryId) {
        const category = this.categories.find(cat => cat.id === categoryId);
        return category ? category.icon : 'fa-map';
    }

    getIncludeLabel(include) {
        const labels = {
            transport: 'Transport',
            hebergement: 'Hébergement',
            repas: 'Repas',
            guide: 'Guide',
            equipement: 'Équipement',
            assurance: 'Assurance'
        };
        return labels[include] || include;
    }

    lightenColor(color, percent) {
        const f = parseInt(color.slice(1), 16);
        const t = percent < 0 ? 0 : 255;
        const p = percent < 0 ? percent * -1 : percent;
        const R = f >> 16;
        const G = f >> 8 & 0x00FF;
        const B = f & 0x0000FF;
        return "#" + (0x1000000 + (Math.round((t - R) * p) + R) * 0x10000 + 
                      (Math.round((t - G) * p) + G) * 0x100 + 
                      (Math.round((t - B) * p) + B)).toString(16).slice(1);
    }

    updateViewCounts() {
        // Simulate view counting
        this.offers.forEach(offer => {
            if (!offer.views) offer.views = 0;
        });
    }

    exportOffers() {
        const filtered = this.getFilteredOffers();
        const csv = this.generateOffersCSV(filtered);
        this.downloadCSV(csv, 'offres-voyage-sfm.csv');
        
        if (window.appState) {
            window.appState.showNotification(`${filtered.length} offres exportées`, 'success');
        }
    }

    generateOffersCSV(offers) {
        const headers = ['Titre', 'Destination', 'Catégorie', 'Prix', 'Durée', 'Statut', 'Réservations', 'Revenus', 'Créé le'];
        const rows = offers.map(offer => [
            `"${offer.title.replace(/"/g, '""')}"`,
            offer.destination,
            this.categories.find(cat => cat.id === offer.category)?.name || offer.category,
            offer.price.toFixed(2),
            offer.duration || '',
            offer.status,
            offer.bookings ? offer.bookings.length : 0,
            offer.bookings ? offer.bookings.reduce((sum, b) => sum + b.totalAmount, 0).toFixed(2) : '0.00',
            new Date(offer.createdAt).toLocaleDateString('fr-FR')
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

    addOfferCardStyles() {
        if (document.querySelector('#travel-card-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'travel-card-styles';
        styles.textContent = `
            .offer-badges {
                position: absolute;
                top: 1rem;
                right: 1rem;
                display: flex;
                flex-direction: column;
                gap: 0.5rem;
            }
            
            .badge {
                padding: 0.25rem 0.5rem;
                border-radius: 12px;
                font-size: 0.75rem;
                font-weight: 600;
                color: white;
            }
            
            .badge.featured { background: #f59e0b; }
            .badge.difficulty { background: #8b5cf6; }
            .badge.capacity { background: #059669; }
            
            .offer-meta {
                display: flex;
                gap: 1rem;
                margin-top: 0.5rem;
                color: var(--text-light);
                font-size: 0.875rem;
            }
            
            .offer-includes {
                margin: 1rem 0;
                padding: 1rem;
                background: var(--bg-light);
                border-radius: 8px;
            }
            
            .includes-list {
                display: flex;
                flex-wrap: wrap;
                gap: 0.5rem;
                margin-top: 0.5rem;
            }
            
            .include-item {
                background: var(--primary);
                color: white;
                padding: 0.25rem 0.5rem;
                border-radius: 12px;
                font-size: 0.75rem;
            }
            
            .offer-stats {
                display: flex;
                gap: 1rem;
                margin: 1rem 0;
                padding: 1rem;
                background: var(--bg-light);
                border-radius: 8px;
            }
            
            .offer-stats .stat {
                display: flex;
                align-items: center;
                gap: 0.25rem;
                font-size: 0.875rem;
                color: var(--text-light);
            }
            
            .offer-footer {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-top: 1rem;
            }
            
            .offer-actions {
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }
            
            .action-menu {
                position: relative;
            }
            
            .action-btn {
                border: none;
                background: var(--bg-light);
                color: var(--text-light);
                padding: 0.5rem;
                border-radius: 50%;
                cursor: pointer;
                transition: var(--transition);
                width: 32px;
                height: 32px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .action-btn:hover {
                background: var(--primary);
                color: white;
            }
            
            .offer-context-menu {
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
            
            .booking-summary {
                background: var(--bg-light);
                padding: 1rem;
                border-radius: 8px;
                margin-top: 1rem;
            }
            
            .summary-line {
                display: flex;
                justify-content: space-between;
                margin-bottom: 0.5rem;
            }
            
            .summary-line.total {
                border-top: 1px solid var(--border);
                padding-top: 0.5rem;
                margin-top: 0.5rem;
                font-size: 1.1rem;
            }
            
            .offer-summary {
                display: flex;
                gap: 1rem;
                margin-bottom: 2rem;
                padding: 1rem;
                background: var(--bg-light);
                border-radius: 8px;
            }
            
            .offer-summary .offer-image {
                width: 80px;
                height: 80px;
                border-radius: 8px;
                background: var(--primary);
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-size: 2rem;
            }
            
            .offer-details h3 {
                margin-bottom: 0.5rem;
            }
            
            .offer-details p {
                margin-bottom: 0.25rem;
                color: var(--text-light);
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }
            
            .offer-details .price {
                color: var(--primary);
                font-weight: 700;
                font-size: 1.1rem;
            }
            
            .checkbox-label {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                font-weight: normal;
                cursor: pointer;
            }
            
            .checkbox-label input[type="checkbox"] {
                margin: 0;
            }
            
            .stats-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                gap: 1rem;
                margin-bottom: 2rem;
            }
            
            .stat-card {
                text-align: center;
                padding: 1.5rem;
                background: var(--bg-light);
                border-radius: 8px;
            }
            
            .stat-card .stat-value {
                font-size: 2rem;
                font-weight: 700;
                color: var(--primary);
                margin-bottom: 0.5rem;
            }
            
            .stat-card .stat-label {
                color: var(--text-light);
                font-size: 0.875rem;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            
            .bookings-list h3 {
                margin-bottom: 1rem;
                color: var(--text-dark);
            }
            
            .booking-item {
                display: grid;
                grid-template-columns: 2fr 1fr 1fr 1fr;
                gap: 1rem;
                padding: 0.75rem;
                background: var(--bg-white);
                border-radius: 6px;
                margin-bottom: 0.5rem;
                align-items: center;
            }
            
            .booking-item .status {
                padding: 0.25rem 0.5rem;
                border-radius: 12px;
                font-size: 0.75rem;
                font-weight: 600;
                text-align: center;
            }
            
            .booking-item .status.pending {
                background: var(--warning);
                color: white;
            }
            
            .booking-item .status.confirmed {
                background: var(--success);
                color: white;
            }
            
            .booking-item .status.cancelled {
                background: var(--error);
                color: white;
            }
        `;
        document.head.appendChild(styles);
    }

    setupSearch() {
        // Search is handled in setupFiltering method
    }

    loadDestinations() {
        // Load popular destinations from data or API
        this.destinations = [
            'Kenya', 'Tanzanie', 'Maroc', 'Égypte', 'Afrique du Sud',
            'Madagascar', 'Sénégal', 'Ghana', 'Éthiopie', 'Botswana',
            'Namibie', 'Zambie', 'Zimbabwe', 'Ouganda', 'Rwanda'
        ];
    }

    createViewToggle() {
        const travelModule = document.getElementById('travel');
        const travelGrid = travelModule.querySelector('.travel-grid');
        
        if (document.querySelector('.view-toggle')) return;

        const viewToggle = document.createElement('div');
        viewToggle.className = 'view-toggle';
        viewToggle.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                <div class="view-buttons">
                    <button class="view-btn ${this.currentView === 'grid' ? 'active' : ''}" data-view="grid">
                        <i class="fas fa-th"></i> Grille
                    </button>
                    <button class="view-btn ${this.currentView === 'list' ? 'active' : ''}" data-view="list">
                        <i class="fas fa-list"></i> Liste
                    </button>
                </div>
                <div class="offers-count">
                    <span id="offersCount">${this.offers.length} offre${this.offers.length > 1 ? 's' : ''}</span>
                </div>
            </div>
        `;

        travelGrid.insertAdjacentElement('beforebegin', viewToggle);

        // Add view toggle styles
        this.addViewToggleStyles();

        // Event listeners
        viewToggle.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.currentView = btn.dataset.view;
                this.updateViewButtons();
                this.updateGridLayout();
            });
        });
    }

    updateViewButtons() {
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === this.currentView);
        });
    }

    updateGridLayout() {
        const travelGrid = document.querySelector('.travel-grid');
        if (this.currentView === 'list') {
            travelGrid.style.gridTemplateColumns = '1fr';
            travelGrid.querySelectorAll('.travel-card').forEach(card => {
                card.style.display = 'flex';
                card.style.height = 'auto';
            });
        } else {
            travelGrid.style.gridTemplateColumns = 'repeat(auto-fit, minmax(320px, 1fr))';
            travelGrid.querySelectorAll('.travel-card').forEach(card => {
                card.style.display = 'block';
                card.style.height = '';
            });
        }
    }

    addViewToggleStyles() {
        if (document.querySelector('#view-toggle-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'view-toggle-styles';
        styles.textContent = `
            .view-buttons {
                display: flex;
                gap: 0.5rem;
            }
            
            .view-btn {
                padding: 0.5rem 1rem;
                border: 1px solid var(--border);
                background: var(--bg-white);
                color: var(--text-dark);
                border-radius: 6px;
                cursor: pointer;
                transition: var(--transition);
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }
            
            .view-btn:hover {
                background: var(--bg-light);
            }
            
            .view-btn.active {
                background: var(--primary);
                color: white;
                border-color: var(--primary);
            }
            
            .offers-count {
                color: var(--text-light);
                font-size: 0.875rem;
            }
        `;
        document.head.appendChild(styles);
    }

    setupBulkActions() {
        // Add bulk selection and actions functionality
        const travelModule = document.getElementById('travel');
        const travelGrid = travelModule.querySelector('.travel-grid');
        
        if (document.querySelector('.bulk-actions')) return;

        const bulkActions = document.createElement('div');
        bulkActions.className = 'bulk-actions';
        bulkActions.style.display = 'none';
        bulkActions.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 1rem; background: var(--bg-light); border-radius: 8px; margin-bottom: 1rem;">
                <div>
                    <span id="selectedCount">0</span> offre(s) sélectionnée(s)
                </div>
                <div style="display: flex; gap: 0.5rem;">
                    <button class="btn" id="selectAll">Tout sélectionner</button>
                    <button class="btn" id="deselectAll">Tout désélectionner</button>
                    <button class="btn btn-primary" id="bulkEdit">Modifier</button>
                    <button class="btn" style="background: var(--error); color: white;" id="bulkDelete">Supprimer</button>
                </div>
            </div>
        `;

        travelGrid.insertAdjacentElement('beforebegin', bulkActions);

        // Event listeners for bulk actions
        document.getElementById('selectAll').addEventListener('click', () => {
            this.selectAllOffers(true);
        });

        document.getElementById('deselectAll').addEventListener('click', () => {
            this.selectAllOffers(false);
        });

        document.getElementById('bulkEdit').addEventListener('click', () => {
            this.showBulkEditModal();
        });

        document.getElementById('bulkDelete').addEventListener('click', () => {
            this.bulkDeleteOffers();
        });
    }

    selectAllOffers(select) {
        const checkboxes = document.querySelectorAll('.offer-checkbox');
        checkboxes.forEach(cb => {
            cb.checked = select;
        });
        this.updateBulkActionsVisibility();
    }

    updateBulkActionsVisibility() {
        const selectedCount = document.querySelectorAll('.offer-checkbox:checked').length;
        const bulkActions = document.querySelector('.bulk-actions');
        const selectedCountSpan = document.getElementById('selectedCount');
        
        if (selectedCount > 0) {
            bulkActions.style.display = 'block';
            selectedCountSpan.textContent = selectedCount;
        } else {
            bulkActions.style.display = 'none';
        }
    }

    showBulkEditModal() {
        const selectedOffers = this.getSelectedOffers();
        if (selectedOffers.length === 0) return;

        const modal = document.createElement('div');
        modal.className = 'bulk-edit-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Modification en Lot (${selectedOffers.length} offre${selectedOffers.length > 1 ? 's' : ''})</h2>
                    <button class="close-modal">&times;</button>
                </div>
                <form id="bulkEditForm">
                    <div class="form-group">
                        <label>
                            <input type="checkbox" name="updateCategory"> Mettre à jour la catégorie
                        </label>
                        <select name="category" class="form-input" disabled>
                            ${this.categories.map(cat => 
                                `<option value="${cat.id}">${cat.name}</option>`
                            ).join('')}
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label>
                            <input type="checkbox" name="updateStatus"> Mettre à jour le statut
                        </label>
                        <select name="status" class="form-input" disabled>
                            <option value="active">Actif</option>
                            <option value="inactive">Inactif</option>
                            <option value="draft">Brouillon</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label>
                            <input type="checkbox" name="updatePrice"> Ajuster le prix
                        </label>
                        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0.5rem;">
                            <select name="priceAction" class="form-input" disabled>
                                <option value="increase">Augmenter de</option>
                                <option value="decrease">Diminuer de</option>
                                <option value="multiply">Multiplier par</option>
                            </select>
                            <input type="number" name="priceValue" class="form-input" placeholder="Valeur" disabled>
                            <select name="priceType" class="form-input" disabled>
                                <option value="percent">%</option>
                                <option value="amount">€</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="modal-actions">
                        <button type="submit" class="btn btn-primary">Appliquer les modifications</button>
                        <button type="button" class="btn" onclick="this.closest('.bulk-edit-modal').remove()">Annuler</button>
                    </div>
                </form>
            </div>
        `;

        this.addModalStyles(modal);
        document.body.appendChild(modal);

        // Enable/disable inputs based on checkboxes
        modal.querySelectorAll('input[type="checkbox"]').forEach(cb => {
            cb.addEventListener('change', (e) => {
                const inputs = e.target.parentElement.parentElement.querySelectorAll('input:not([type="checkbox"]), select');
                inputs.forEach(input => {
                    input.disabled = !e.target.checked;
                });
            });
        });

        // Handle form submission
        const form = modal.querySelector('#bulkEditForm');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.processBulkEdit(selectedOffers, form, modal);
        });

        // Close modal
        modal.querySelector('.close-modal').onclick = () => modal.remove();
        modal.onclick = (e) => {
            if (e.target === modal) modal.remove();
        };
    }

    processBulkEdit(selectedOffers, form, modal) {
        const formData = new FormData(form);
        let updatedCount = 0;

        selectedOffers.forEach(offer => {
            let updated = false;

            // Update category
            if (formData.get('updateCategory')) {
                offer.category = formData.get('category');
                updated = true;
            }

            // Update status
            if (formData.get('updateStatus')) {
                offer.status = formData.get('status');
                updated = true;
            }

            // Update price
            if (formData.get('updatePrice')) {
                const action = formData.get('priceAction');
                const value = parseFloat(formData.get('priceValue'));
                const type = formData.get('priceType');

                if (value > 0) {
                    let newPrice = offer.price;
                    
                    if (action === 'increase') {
                        newPrice += type === 'percent' ? (offer.price * value / 100) : value;
                    } else if (action === 'decrease') {
                        newPrice -= type === 'percent' ? (offer.price * value / 100) : value;
                    } else if (action === 'multiply') {
                        newPrice *= value;
                    }
                    
                    offer.price = Math.max(0, newPrice);
                    updated = true;
                }
            }

            if (updated) {
                offer.updatedAt = new Date().toISOString();
                updatedCount++;
            }
        });

        this.saveData();
        this.renderOffers();
        modal.remove();

        if (window.appState) {
            window.appState.showNotification(`${updatedCount} offre(s) modifiée(s)`, 'success');
        }
    }

    bulkDeleteOffers() {
        const selectedOffers = this.getSelectedOffers();
        if (selectedOffers.length === 0) return;

        if (confirm(`Êtes-vous sûr de vouloir supprimer ${selectedOffers.length} offre(s) ?`)) {
            const selectedIds = selectedOffers.map(offer => offer.id);
            this.offers = this.offers.filter(offer => !selectedIds.includes(offer.id));
            
            this.saveData();
            this.renderOffers();
            
            if (window.appState) {
                window.appState.showNotification(`${selectedOffers.length} offre(s) supprimée(s)`, 'success');
            }
        }
    }

    getSelectedOffers() {
        const selectedIds = Array.from(document.querySelectorAll('.offer-checkbox:checked'))
            .map(cb => cb.value);
        return this.offers.filter(offer => selectedIds.includes(offer.id));
    }

    showError(message) {
        if (window.appState) {
            window.appState.showNotification(message, 'error');
        } else {
            alert(message);
        }
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

    // Public method to refresh data (called from navigation)
    refreshData() {
        this.loadData();
        this.renderOffers();
        
        // Update offers count
        const offersCountElement = document.getElementById('offersCount');
        if (offersCountElement) {
            offersCountElement.textContent = `${this.offers.length} offre${this.offers.length > 1 ? 's' : ''}`;
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('travel')) {
        window.travelManager = new TravelManager();
    }
});

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TravelManager;
}/**
 * ====================================
 * SFM - Travel Management Module
 * Handles travel offers and bookings
 * ====================================
 */

class TravelManager {
    constructor() {
        this.offers = [];
        this.destinations = [];
        this.categories = [
            { id: 'safari', name: 'Safari', icon: 'fa-mountain', color: '#059669' },
            { id: 'plongee', name: 'Plongée', icon: 'fa-water', color: '#0ea5e9' },
            { id: 'city-break', name: 'City Break', icon: 'fa-city', color: '#8b5cf6' },
            { id: 'aventure', name: 'Aventure', icon: 'fa-hiking', color: '#f59e0b' },
            { id: 'culture', name: 'Culture', icon: 'fa-landmark', color: '#ef4444' },
            { id: 'detente', name: 'Détente', icon: 'fa-spa', color: '#06b6d4' },
            { id: 'gastronomie', name: 'Gastronomie', icon: 'fa-utensils', color: '#84cc16' },
            { id: 'sport', name: 'Sport', icon: 'fa-running', color: '#f97316' }
        ];
        this.currentView = 'grid';
        this.filters = {
            category: 'all',
            priceRange: 'all',
            duration: 'all',
            destination: 'all'
        };
        this.sortBy = 'date';
        this.init();
    }

    init() {
        this.loadData();
        this.setupEventListeners();
        this.setupOfferCreation();
        this.renderOffers();
        this.setupFiltering();
        this.setupSearch();
        this.loadDestinations();
    }

    loadData() {
        if (window.appState) {
            this.offers = window.appState.data.travelOffers || [];
        } else {
            this.offers = JSON.parse(localStorage.getItem('sfm_travel_offers')) || [];
        }
    }

    saveData() {
        if (window.appState) {
            window.appState.saveData('travelOffers', this.offers);
        } else {
            localStorage.setItem('sfm_travel_offers', JSON.stringify(this.offers));
        }
    }

    setupEventListeners() {
        const travelModule = document.getElementById('travel');
        if (!travelModule) return;

        // Add offer form
        const addOfferBtn = travelModule.querySelector('.transaction-form .btn-primary');
        if (addOfferBtn) {
            addOfferBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.addOffer();
            });
        }

        // Booking handlers for existing offers
        this.setupBookingHandlers();

        // View toggle buttons
        this.createViewToggle();

        // Bulk actions
        this.setupBulkActions();
    }

    setupOfferCreation() {
        const travelModule = document.getElementById('travel');
        const createOfferCard = travelModule.querySelector('.card');
        
        if (createOfferCard) {
            // Enhanced form with more fields
            createOfferCard.innerHTML = `
                <h2>Créer une Nouvelle Offre</h2>
                <form id="createOfferForm" class="offer-form">
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
                        <div class="form-group">
                            <label>Titre de l'offre *</label>
                            <input type="text" name="title" class="form-input" placeholder="Ex: Safari Kenya Masai Mara" required>
                        </div>
                        <div class="form-group">
                            <label>Destination *</label>
                            <input type="text" name="destination" class="form-input" placeholder="Ex: Kenya, Masai Mara" required>
                        </div>
                        <div class="form-group">
                            <label>Catégorie</label>
                            <select name="category" class="form-input">
                                ${this.categories.map(cat => 
                                    `<option value="${cat.id}">${cat.name}</option>`
                                ).join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Prix (€) *</label>
                            <input type="number" name="price" class="form-input" placeholder="1250" min="0" step="0.01" required>
                        </div>
                        <div class="form-group">
                            <label>Durée (jours)</label>
                            <input type="number" name="duration" class="form-input" placeholder="5" min="1">
                        </div>
                        <div class="form-group">
                            <label>Places disponibles</label>
                            <input type="number" name="maxParticipants" class="form-input" placeholder="10" min="1">
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label>Description complète</label>
                        <textarea name="description" class="form-input" rows="4" 
                                  placeholder="Décrivez votre offre en détail..."></textarea>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
                        <div class="form-group">
                            <label>Date de début</label>
                            <input type="date" name="startDate" class="form-input">
                        </div>
                        <div class="form-group">
                            <label>Date de fin</label>
                            <input type="date" name="endDate" class="form-input">
                        </div>
                        <div class="form-group">
                            <label>Niveau de difficulté</label>
                            <select name="difficulty" class="form-input">
                                <option value="facile">Facile</option>
                                <option value="modere">Modéré</option>
                                <option value="difficile">Difficile</option>
                                <option value="expert">Expert</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Âge minimum</label>
                            <input type="number" name="minAge" class="form-input" placeholder="18" min="0">
                        </div>
                    </div>

                    <div class="form-group">
                        <label>Inclus dans le prix</label>
                        <div class="checkbox-group" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem;">
                            <label class="checkbox-label">
                                <input type="checkbox" name="includes" value="transport"> Transport
                            </label>
                            <label class="checkbox-label">
                                <input type="checkbox" name="includes" value="hebergement"> Hébergement
                            </label>
                            <label class="checkbox-label">
                                <input type="checkbox" name="includes" value="repas"> Repas
                            </label>
                            <label class="checkbox-label">
                                <input type="checkbox" name="includes" value="guide"> Guide
                            </label>
                            <label class="checkbox-label">
                                <input type="checkbox" name="includes" value="equipement"> Équipement
                            </label>
                            <label class="checkbox-label">
                                <input type="checkbox" name="includes" value="assurance"> Assurance
                            </label>
                        </div>
                    </div>

                    <div class="form-actions" style="display: flex; gap: 1rem; margin-top: 2rem;">
                        <button type="submit" class="btn btn-primary">
                            <i class="fas fa-plus"></i> Publier l'offre
                        </button>
                        <button type="button" class="btn" onclick="this.closest('form').reset()">
                            <i class="fas fa-times"></i> Annuler
                        </button>
                        <button type="button" class="btn" id="saveAsDraft">
                            <i class="fas fa-save"></i> Sauvegarder en brouillon
                        </button>
                    </div>
                </form>
            `;

            // Add form submission handler
            const form = createOfferCard.querySelector('#createOfferForm');
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleOfferSubmission(e);
            });

            // Save as draft handler
            document.getElementById('saveAsDraft').addEventListener('click', () => {
                this.saveOfferAsDraft();
            });

            // Real-time validation
            this.setupFormValidation(form);
        }
    }

    handleOfferSubmission(e) {
        const formData = new FormData(e.target);
        const offerData = Object.fromEntries(formData.entries());
        
        // Get checkbox values
        const includes = Array.from(e.target.querySelectorAll('input[name="includes"]:checked'))
                              .map(cb => cb.value);
        
        // Validation
        if (!this.validateOfferData(offerData)) {
            return;
        }

        const offer = {
            id: this.generateId(),
            title: offerData.title.trim(),
            destination: offerData.destination.trim(),
            category: offerData.category,
            price: parseFloat(offerData.price),
            duration: parseInt(offerData.duration) || null,
            maxParticipants: parseInt(offerData.maxParticipants) || null,
            description: offerData.description.trim() || '',
            startDate: offerData.startDate || null,
            endDate: offerData.endDate || null,
            difficulty: offerData.difficulty,
            minAge: parseInt(offerData.minAge) || 0,
            includes,
            image: this.getRandomImage(),
            status: 'active',
            createdAt: new Date().toISOString(),
            createdBy: window.appState?.currentUser?.uid || 'demo-user',
            bookings: [],
            views: 0,
            rating: 0,
            reviews: []
        };

        this.offers.unshift(offer);
        this.saveData();
        this.renderOffers();
        
        // Clear form
        e.target.reset();
        
        // Success message
        if (window.appState) {
            window.appState.showNotification('Offre créée avec succès !', 'success');
        }

        // Add to recent transactions if caisse module is available
        this.addToTransactionHistory(offer);
    }

    validateOfferData(data) {
        if (!data.title || data.title.trim().length < 5) {
            this.showError('Le titre doit contenir au moins 5 caractères');
            return false;
        }

        if (!data.destination || data.destination.trim().length < 3) {
            this.showError('La destination doit être spécifiée');
            return false;
        }

        if (!data.price || parseFloat(data.price) <= 0) {
            this.showError('Le prix doit être supérieur à 0');
            return false;
        }

        if (parseFloat(data.price) > 50000) {
            this.showError('Le prix semble trop élevé (max: 50,000€)');
            return false;
        }

        if (data.startDate && data.endDate) {
            const start = new Date(data.startDate);
            const end = new Date(data.endDate);
            if (start >= end) {
                this.showError('La date de fin doit être après la date de début');
                return false;
            }
        }

        return true;
    }

    setupFormValidation(form) {
        const titleInput = form.querySelector('input[name="title"]');
        const priceInput = form.querySelector('input[name="price"]');
        
        titleInput.addEventListener('input', (e) => {
            const value = e.target.value.trim();
            if (value.length > 0 && value.length < 5) {
                e.target.style.borderColor = 'var(--warning)';
            } else if (value.length >= 5) {
                e.target.style.borderColor = 'var(--success)';
            } else {
                e.target.style.borderColor = '';
            }
        });

        priceInput.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            if (value > 0 && value <= 50000) {
                e.target.style.borderColor = 'var(--success)';
            } else if (value > 50000) {
                e.target.style.borderColor = 'var(--error)';
            } else {
                e.target.style.borderColor = '';
            }
        });
    }

    saveOfferAsDraft() {
        const form = document.getElementById('createOfferForm');
        const formData = new FormData(form);
        const draftData = Object.fromEntries(formData.entries());
        
        // Save to localStorage as draft
        const drafts = JSON.parse(localStorage.getItem('sfm_travel_drafts')) || [];
        const draft = {
            id: 'draft_' + Date.now(),
            ...draftData,
            savedAt: new Date().toISOString()
        };
        
        drafts.push(draft);
        localStorage.setItem('sfm_travel_drafts', JSON.stringify(drafts));
        
        if (window.appState) {
            window.appState.showNotification('Brouillon sauvegardé', 'success');
        }
    }

    addToTransactionHistory(offer) {
        if (window.caisseManager) {
            const transaction = {
                id: window.caisseManager.generateId(),
                description: `Création offre: ${offer.title}`,
                amount: 0, // No monetary impact for creating offer
                category: 'voyage',
                date: new Date().toISOString(),
                type: 'neutral',
                createdBy: window.appState?.currentUser?.uid || 'demo-user',
                relatedOfferId: offer.id
            };
            
            // This would add to transaction history if the method exists
            // window.caisseManager.addTransactionSilently(transaction);
        }
    }

    setupBookingHandlers() {
        // Add event listeners to existing booking buttons
        setTimeout(() => {
            const bookingBtns = document.querySelectorAll('#travel .btn-primary:not([form])');
            bookingBtns.forEach((btn, index) => {
                if (index > 0) { // Skip the create offer button
                    btn.addEventListener('click', (e) => {
                        const card = btn.closest('.travel-card');
                        const offerId = card?.getAttribute('data-offer-id');
                        if (offerId) {
                            this.showBookingModal(offerId);
                        } else {
                            // For demo cards without IDs
                            this.showDemoBookingModal(btn);
                        }
                    });
                }
            });
        }, 100);
    }

    showBookingModal(offerId) {
        const offer = this.offers.find(o => o.id === offerId);
        if (!offer) return;

        const modal = document.createElement('div');
        modal.className = 'booking-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Réserver: ${offer.title}</h2>
                    <button class="close-modal">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="offer-summary">
                        <div class="offer-image">
                            <i class="fas ${this.getCategoryIcon(offer.category)}"></i>
                        </div>
                        <div class="offer-details">
                            <h3>${offer.title}</h3>
                            <p><i class="fas fa-map-marker-alt"></i> ${offer.destination}</p>
                            <p><i class="fas fa-clock"></i> ${offer.duration ? offer.duration + ' jours' : 'Durée variable'}</p>
                            <p class="price"><i class="fas fa-euro-sign"></i> ${offer.price}€ par personne</p>
                        </div>
                    </div>
                    
                    <form id="bookingForm">
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                            <div class="form-group">
                                <label>Nom complet *</label>
                                <input type="text" name="customerName" class="form-input" required>
                            </div>
                            <div class="form-group">
                                <label>Email *</label>
                                <input type="email" name="customerEmail" class="form-input" required>
                            </div>
                            <div class="form-group">
                                <label>Téléphone</label>
                                <input type="tel" name="customerPhone" class="form-input">
                            </div>
                            <div class="form-group">
                                <label>Nombre de personnes *</label>
                                <input type="number" name="persons" class="form-input" min="1" max="${offer.maxParticipants || 20}" value="1" required>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label>Date souhaitée</label>
                            <input type="date" name="preferredDate" class="form-input" 
                                   min="${new Date().toISOString().split('T')[0]}">
                        </div>
                        
                        <div class="form-group">
                            <label>Commentaires / Demandes spéciales</label>
                            <textarea name="comments" class="form-input" rows="3" 
                                      placeholder="Régime alimentaire, allergies, etc."></textarea>
                        </div>
                        
                        <div class="booking-summary">
                            <div class="summary-line">
                                <span>Prix unitaire:</span>
                                <span>${offer.price}€</span>
                            </div>
                            <div class="summary-line">
                                <span>Nombre de personnes:</span>
                                <span id="personsCount">1</span>
                            </div>
                            <div class="summary-line total">
                                <span><strong>Total:</strong></span>
                                <span><strong id="totalAmount">${offer.price}€</strong></span>
                            </div>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn" onclick="this.closest('.booking-modal').remove()">Annuler</button>
                    <button type="submit" form="bookingForm" class="btn btn-primary">Confirmer la réservation</button>
                </div>
            </div>
        `;

        this.addModalStyles(modal);
        document.body.appendChild(modal);

        // Update total when persons count changes
        const personsInput = modal.querySelector('input[name="persons"]');
        personsInput.addEventListener('input', () => {
            const persons = parseInt(personsInput.value) || 1;
            const total = persons * offer.price;
            modal.querySelector('#personsCount').textContent = persons;
            modal.querySelector('#totalAmount').textContent = total + '€';
        });

        // Handle form submission
        const form = modal.querySelector('#bookingForm');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.processBooking(offer, form, modal);
        });

        // Close modal
        modal.querySelector('.close-modal').onclick = () => modal.remove();
        modal.onclick = (e) => {
            if (e.target === modal) modal.remove();
        };
    }

    showDemoBookingModal(btn) {
        // For demo purposes when offer ID is not available
        const card = btn.closest('.travel-card');
        const title = card.querySelector('h3').textContent;
        const priceText = card.querySelector('.travel-price').textContent;
        const price = parseFloat(priceText.replace(/[^0-9.]/g, ''));

        if (window.appState) {
            window.appState.showNotification(`Réservation pour "${title}" - ${price}€`, 'success');
        } else {
            alert(`Réservation confirmée pour "${title}" - ${price}€`);
        }
    }

    processBooking(offer, form, modal) {
        const formData = new FormData(form);
        const bookingData = Object.fromEntries(formData.entries());
        
        const booking = {
            id: this.generateId(),
            offerId: offer.id,
            offerTitle: offer.title,
            customerName: bookingData.customerName,
            customerEmail: bookingData.customerEmail,
            customerPhone: bookingData.customerPhone || '',
            persons: parseInt(bookingData.persons),
            preferredDate: bookingData.preferredDate,
            comments: bookingData.comments || '',
            totalAmount: parseInt(bookingData.persons) * offer.price,
            status: 'pending',
            createdAt: new Date().toISOString(),
            processedBy: window.appState?.currentUser?.uid || 'demo-user'
        };

        // Add booking to offer
        offer.bookings = offer.bookings || [];
        offer.bookings.push(booking);
        
        // Save to bookings collection if available
        if (window.appState && window.appState.data.bookings) {
            window.appState.data.bookings.push(booking);
            window.appState.saveData('bookings', window.appState.