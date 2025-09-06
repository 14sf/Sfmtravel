        quickActions.className = 'quick-actions card';
        quickActions.innerHTML = `
            <h3>Actions Rapides</h3>
            <div class="quick-actions-grid">
                <button class="quick-action" onclick="bookingManager.showNewBookingModal()">
                    <i class="fas fa-plus"></i>
                    <span>Nouvelle réservation</span>
                </button>
                <button class="quick-action" onclick="bookingManager.showTodayBookings()">
                    <i class="fas fa-calendar-day"></i>
                    <span>Aujourd'hui</span>
                </button>
                <button class="quick-action" onclick="bookingManager.showPendingBookings()">
                    <i class="fas fa-clock"></i>
                    <span>En attente</span>
                </button>
                <button class="quick-action" onclick="bookingManager.showUpcomingBookings()">
                    <i class="fas fa-calendar-week"></i>
                    <span>À venir</span>
                </button>
            </div>
        `;

        // Insert at the beginning of the module
        const firstCard = bookingModule.querySelector('.card');
        firstCard.insertAdjacentElement('beforebegin', quickActions);

        // Add styles for quick actions
        this.addQuickActionsStyles();
    }

    showTodayBookings() {
        document.getElementById('dateRangeFilter').value = 'today';
        this.applyBookingFilters();
        this.scrollToBookings();
    }

    showPendingBookings() {
        document.getElementById('statusFilter').value = 'pending';
        this.applyBookingFilters();
        this.scrollToBookings();
    }

    showUpcomingBookings() {
        document.getElementById('dateRangeFilter').value = 'upcoming';
        this.applyBookingFilters();
        this.scrollToBookings();
    }

    scrollToBookings() {
        const bookingsList = document.querySelector('.bookings-list');
        if (bookingsList) {
            bookingsList.scrollIntoView({ behavior: 'smooth' });
        }
    }

    createQuickBookingButton() {
        // This is already handled in setupCalendarNavigation
    }

    setupViewModeToggles() {
        const bookingModule = document.getElementById('booking');
        const calendarCard = bookingModule.querySelector('.card');
        
        if (document.querySelector('.view-mode-toggle')) return;

        const viewToggle = document.createElement('div');
        viewToggle.className = 'view-mode-toggle';
        viewToggle.innerHTML = `
            <div class="view-modes">
                <button class="view-mode ${this.calendar.viewMode === 'month' ? 'active' : ''}" data-mode="month">
                    <i class="fas fa-calendar"></i> Mois
                </button>
                <button class="view-mode ${this.calendar.viewMode === 'week' ? 'active' : ''}" data-mode="week">
                    <i class="fas fa-calendar-week"></i> Semaine
                </button>
                <button class="view-mode ${this.calendar.viewMode === 'day' ? 'active' : ''}" data-mode="day">
                    <i class="fas fa-calendar-day"></i> Jour
                </button>
            </div>
        `;

        calendarCard.querySelector('.calendar-header').appendChild(viewToggle);

        // Event listeners
        viewToggle.querySelectorAll('.view-mode').forEach(btn => {
            btn.addEventListener('click', () => {
                this.calendar.viewMode = btn.dataset.mode;
                this.updateViewModeButtons();
                this.renderCalendarView();
            });
        });
    }

    updateViewModeButtons() {
        document.querySelectorAll('.view-mode').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === this.calendar.viewMode);
        });
    }

    renderCalendarView() {
        switch (this.calendar.viewMode) {
            case 'month':
                this.renderCalendar();
                break;
            case 'week':
                this.renderWeekView();
                break;
            case 'day':
                this.renderDayView();
                break;
        }
    }

    renderWeekView() {
        const calendar = document.querySelector('.calendar');
        if (!calendar) return;

        calendar.innerHTML = '';
        calendar.style.gridTemplateColumns = 'repeat(7, 1fr)';

        // Get week dates
        const weekDates = this.getWeekDates();
        
        weekDates.forEach(dateInfo => {
            const dayDiv = this.createWeekDayCard(dateInfo);
            calendar.appendChild(dayDiv);
        });
    }

    getWeekDates() {
        const currentDate = this.calendar.currentDate;
        const startOfWeek = new Date(currentDate);
        startOfWeek.setDate(currentDate.getDate() - (currentDate.getDay() === 0 ? 6 : currentDate.getDay() - 1));

        const weekDates = [];
        for (let i = 0; i < 7; i++) {
            const date = new Date(startOfWeek);
            date.setDate(startOfWeek.getDate() + i);
            
            weekDates.push({
                date,
                bookings: this.getBookingsForDate(date),
                isToday: this.isToday(date)
            });
        }

        return weekDates;
    }

    createWeekDayCard(dateInfo) {
        const { date, bookings, isToday } = dateInfo;
        const dayDiv = document.createElement('div');
        dayDiv.className = `week-day ${isToday ? 'today' : ''}`;
        
        dayDiv.innerHTML = `
            <div class="week-day-header">
                <div class="day-name">${date.toLocaleDateString('fr-FR', { weekday: 'short' })}</div>
                <div class="day-number">${date.getDate()}</div>
            </div>
            <div class="week-day-bookings">
                ${bookings.map(booking => `
                    <div class="week-booking ${booking.status}" onclick="bookingManager.showBookingDetails('${booking.id}')">
                        <div class="booking-time">${new Date(booking.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</div>
                        <div class="booking-title">${booking.activityName}</div>
                        <div class="booking-customer">${booking.customerName}</div>
                    </div>
                `).join('')}
                ${bookings.length === 0 ? '<div class="no-bookings-day">Aucune réservation</div>' : ''}
            </div>
        `;

        return dayDiv;
    }

    renderDayView() {
        const calendar = document.querySelector('.calendar');
        if (!calendar) return;

        calendar.innerHTML = '';
        calendar.style.gridTemplateColumns = '1fr';

        const date = this.calendar.currentDate;
        const bookings = this.getBookingsForDate(date);

        const dayView = document.createElement('div');
        dayView.className = 'day-view';
        dayView.innerHTML = `
            <div class="day-view-header">
                <h3>${date.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h3>
                <div class="day-stats">
                    <span class="stat">${bookings.length} réservation${bookings.length > 1 ? 's' : ''}</span>
                    <span class="stat">${bookings.reduce((sum, b) => sum + b.participants, 0)} participant${bookings.reduce((sum, b) => sum + b.participants, 0) > 1 ? 's' : ''}</span>
                    <span class="stat">${bookings.reduce((sum, b) => sum + b.totalAmount, 0)}€</span>
                </div>
            </div>
            <div class="day-timeline">
                ${this.createDayTimeline(bookings)}
            </div>
        `;

        calendar.appendChild(dayView);
    }

    createDayTimeline(bookings) {
        const hours = Array.from({ length: 24 }, (_, i) => i);
        
        return hours.map(hour => {
            const hourBookings = bookings.filter(booking => {
                const bookingHour = new Date(booking.date).getHours();
                return bookingHour === hour;
            });

            return `
                <div class="timeline-hour">
                    <div class="hour-label">${hour.toString().padStart(2, '0')}:00</div>
                    <div class="hour-bookings">
                        ${hourBookings.map(booking => `
                            <div class="timeline-booking ${booking.status}" onclick="bookingManager.showBookingDetails('${booking.id}')">
                                <div class="booking-time">${new Date(booking.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</div>
                                <div class="booking-info">
                                    <strong>${booking.activityName}</strong>
                                    <span>${booking.customerName} (${booking.participants} pers.)</span>
                                </div>
                                <div class="booking-amount">${booking.totalAmount}€</div>
                            </div>
                        `).join('')}
                        ${hourBookings.length === 0 ? '<div class="hour-empty"></div>' : ''}
                    </div>
                </div>
            `;
        }).join('');
    }

    showBookingDetails(bookingId) {
        const booking = this.bookings.find(b => b.id === bookingId);
        if (!booking) return;

        const modal = document.createElement('div');
        modal.className = 'booking-details-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Détails de la Réservation</h2>
                    <button class="close-modal">&times;</button>
                </div>
                <div class="booking-details-content">
                    <div class="detail-section">
                        <h3><i class="fas fa-calendar-alt"></i> Activité</h3>
                        <div class="detail-grid">
                            <div class="detail-item">
                                <label>Activité:</label>
                                <span>${booking.activityName}</span>
                            </div>
                            <div class="detail-item">
                                <label>Date:</label>
                                <span>${new Date(booking.date).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                            </div>
                            <div class="detail-item">
                                <label>Heure:</label>
                                <span>${new Date(booking.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <div class="detail-item">
                                <label>Participants:</label>
                                <span>${booking.participants} personne${booking.participants > 1 ? 's' : ''}</span>
                            </div>
                        </div>
                    </div>

                    <div class="detail-section">
                        <h3><i class="fas fa-user"></i> Client</h3>
                        <div class="detail-grid">
                            <div class="detail-item">
                                <label>Nom:</label>
                                <span>${booking.customerName}</span>
                            </div>
                            <div class="detail-item">
                                <label>Email:</label>
                                <span><a href="mailto:${booking.customerEmail}">${booking.customerEmail}</a></span>
                            </div>
                            ${booking.customerPhone ? `
                                <div class="detail-item">
                                    <label>Téléphone:</label>
                                    <span><a href="tel:${booking.customerPhone}">${booking.customerPhone}</a></span>
                                </div>
                            ` : ''}
                        </div>
                    </div>

                    <div class="detail-section">
                        <h3><i class="fas fa-info-circle"></i> Statut</h3>
                        <div class="detail-grid">
                            <div class="detail-item">
                                <label>Statut réservation:</label>
                                <span class="status-badge ${booking.status}" style="background-color: ${this.statusConfig[booking.status].color};">
                                    <i class="fas ${this.statusConfig[booking.status].icon}"></i>
                                    ${this.statusConfig[booking.status].label}
                                </span>
                            </div>
                            <div class="detail-item">
                                <label>Statut paiement:</label>
                                <span class="payment-badge ${booking.paymentStatus}">
                                    ${this.getPaymentStatusLabel(booking.paymentStatus)}
                                </span>
                            </div>
                            <div class="detail-item">
                                <label>Montant total:</label>
                                <span class="amount">${booking.totalAmount}€</span>
                            </div>
                        </div>
                    </div>

                    ${booking.notes || (booking.specialRequests && booking.specialRequests.length > 0) ? `
                        <div class="detail-section">
                            <h3><i class="fas fa-comment"></i> Notes & Demandes</h3>
                            ${booking.notes ? `<p><strong>Notes:</strong> ${booking.notes}</p>` : ''}
                            ${booking.specialRequests && booking.specialRequests.length > 0 ? `
                                <div class="special-requests-detail">
                                    <strong>Demandes spéciales:</strong>
                                    <ul>
                                        ${booking.specialRequests.map(req => `<li>${req}</li>`).join('')}
                                    </ul>
                                </div>
                            ` : ''}
                        </div>
                    ` : ''}

                    <div class="detail-section">
                        <h3><i class="fas fa-clock"></i> Historique</h3>
                        <div class="detail-timeline">
                            <div class="timeline-item">
                                <i class="fas fa-plus"></i>
                                <div>
                                    <strong>Réservation créée</strong>
                                    <span>${new Date(booking.createdAt).toLocaleDateString('fr-FR')} à ${new Date(booking.createdAt).toLocaleTimeString('fr-FR')}</span>
                                </div>
                            </div>
                            ${booking.updatedAt && booking.updatedAt !== booking.createdAt ? `
                                <div class="timeline-item">
                                    <i class="fas fa-edit"></i>
                                    <div>
                                        <strong>Dernière modification</strong>
                                        <span>${new Date(booking.updatedAt).toLocaleDateString('fr-FR')} à ${new Date(booking.updatedAt).toLocaleTimeString('fr-FR')}</span>
                                    </div>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn" onclick="bookingManager.contactCustomer('${booking.id}')">
                        <i class="fas fa-envelope"></i> Contacter
                    </button>
                    <button class="btn btn-primary" onclick="bookingManager.editBooking('${booking.id}')">
                        <i class="fas fa-edit"></i> Modifier
                    </button>
                    <button class="btn" onclick="this.closest('.booking-details-modal').remove()">Fermer</button>
                </div>
            </div>
        `;

        this.addModalStyles(modal);
        modal.querySelector('.modal-content').style.maxWidth = '700px';
        document.body.appendChild(modal);

        // Close modal
        modal.querySelector('.close-modal').onclick = () => modal.remove();
        modal.onclick = (e) => {
            if (e.target === modal) modal.remove();
        };
    }

    createRefreshButton() {
        const bookingModule = document.getElementById('booking');
        const header = bookingModule.querySelector('.calendar-actions');
        
        if (header && !header.querySelector('.refresh-btn')) {
            const refreshBtn = document.createElement('button');
            refreshBtn.className = 'btn refresh-btn';
            refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i>';
            refreshBtn.title = 'Actualiser';
            refreshBtn.onclick = () => this.refreshData();
            
            header.insertBefore(refreshBtn, header.firstChild);
        }
    }

    sendBookingConfirmation(booking) {
        // Mock email sending
        console.log('Sending booking confirmation email to:', booking.customerEmail);
        
        setTimeout(() => {
            if (window.appState) {
                window.appState.showNotification('Email de confirmation envoyé', 'info');
            }
        }, 1500);
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
            max-height: 90vh;
            overflow-y: auto;
        `;
    }

    addQuickActionsStyles() {
        if (document.querySelector('#quick-actions-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'quick-actions-styles';
        styles.textContent = `
            .quick-actions-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                gap: 1rem;
                margin-top: 1rem;
            }
            
            .quick-action {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 0.5rem;
                padding: 1rem;
                border: 2px solid var(--border);
                background: var(--bg-white);
                border-radius: 8px;
                cursor: pointer;
                transition: var(--transition);
                text-decoration: none;
                color: var(--text-dark);
            }
            
            .quick-action:hover {
                border-color: var(--primary);
                background: var(--bg-light);
                transform: translateY(-2px);
            }
            
            .quick-action i {
                font-size: 1.5rem;
                color: var(--primary);
            }
            
            .quick-action span {
                font-weight: 600;
                text-align: center;
            }
            
            .view-mode-toggle {
                margin-left: auto;
            }
            
            .view-modes {
                display: flex;
                gap: 0.5rem;
            }
            
            .view-mode {
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
                font-size: 0.875rem;
            }
            
            .view-mode:hover {
                background: var(--bg-light);
            }
            
            .view-mode.active {
                background: var(--primary);
                color: white;
                border-color: var(--primary);
            }
            
            .calendar-header {
                margin-bottom: 1rem;
            }
            
            .calendar-nav {
                display: flex;
                align-items: center;
                gap: 1rem;
            }
            
            .nav-btn {
                border: none;
                background: var(--bg-light);
                color: var(--text-dark);
                padding: 0.5rem;
                border-radius: 50%;
                cursor: pointer;
                transition: var(--transition);
                width: 36px;
                height: 36px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .nav-btn:hover {
                background: var(--primary);
                color: white;
            }
            
            .calendar-actions {
                display: flex;
                gap: 0.5rem;
                align-items: center;
            }
            
            .booking-card {
                border: 1px solid var(--border);
                border-radius: 8px;
                padding: 1rem;
                margin-bottom: 1rem;
                transition: var(--transition);
                background: var(--bg-white);
            }
            
            .booking-card:hover {
                box-shadow: var(--shadow);
                transform: translateY(-1px);
            }
            
            .booking-header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                margin-bottom: 1rem;
            }
            
            .booking-info h4 {
                margin-bottom: 0.5rem;
                color: var(--text-dark);
            }
            
            .customer-name {
                color: var(--text-light);
                margin: 0;
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }
            
            .booking-meta {
                text-align: right;
            }
            
            .booking-date {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                margin-bottom: 0.5rem;
                font-size: 0.875rem;
            }
            
            .booking-date.upcoming {
                color: var(--primary);
                font-weight: 600;
            }
            
            .booking-date.past {
                color: var(--text-light);
            }
            
            .urgency-badge {
                display: flex;
                align-items: center;
                gap: 0.25rem;
                padding: 0.25rem 0.5rem;
                background: var(--warning);
                color: white;
                border-radius: 12px;
                font-size: 0.75rem;
                font-weight: 600;
            }
            
            .status-badge {
                display: inline-flex;
                align-items: center;
                gap: 0.5rem;
                padding: 0.5rem 1rem;
                border-radius: 20px;
                font-size: 0.875rem;
                font-weight: 600;
                color: white;
            }
            
            .booking-details {
                display: flex;
                gap: 1rem;
                flex-wrap: wrap;
                margin-bottom: 1rem;
            }
            
            .detail-item {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                color: var(--text-light);
                font-size: 0.875rem;
            }
            
            .payment-status.pending {
                color: var(--warning);
            }
            
            .payment-status.paid {
                color: var(--success);
            }
            
            .payment-status.partial {
                color: var(--primary);
            }
            
            .booking-notes {
                background: var(--bg-light);
                padding: 1rem;
                border-radius: 6px;
                margin-bottom: 1rem;
            }
            
            .booking-notes p {
                margin-bottom: 0.5rem;
                color: var(--text-dark);
            }
            
            .special-requests {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                flex-wrap: wrap;
            }
            
            .request-tag {
                background: var(--primary);
                color: white;
                padding: 0.25rem 0.5rem;
                border-radius: 12px;
                font-size: 0.75rem;
            }
            
            .booking-actions {
                display: flex;
                gap: 0.5rem;
                justify-content: flex-end;
            }
            
            .action-btn {
                border: none;
                background: var(--bg-light);
                color: var(--text-light);
                padding: 0.5rem;
                border-radius: 50%;
                cursor: pointer;
                transition: var(--transition);
                width: 36px;
                height: 36px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .action-btn.contact:hover {
                background: var(--primary);
                color: white;
            }
            
            .action-btn.edit:hover {
                background: var(--warning);
                color: white;
            }
            
            .action-btn.status:hover {
                background: var(--secondary);
                color: white;
            }
            
            .action-btn.confirm:hover {
                background: var(--success);
                color: white;
            }
            
            .action-btn.delete:hover {
                background: var(--error);
                color: white;
            }
            
            .calendar-day {
                min-height: 120px;
                position: relative;
            }
            
            .calendar-day.has-bookings {
                background: var(--bg-light);
            }
            
            .calendar-day.today {
                background: linear-gradient(135deg, var(--primary), var(--primary-dark));
                color: white;
            }
            
            .calendar-day.other-month {
                opacity: 0.5;
            }
            
            .day-number {
                font-weight: 600;
                margin-bottom: 0.5rem;
            }
            
            .day-bookings {
                display: flex;
                flex-direction: column;
                gap: 0.25rem;
            }
            
            .booking-indicator {
                padding: 0.25rem 0.5rem;
                border-radius: 4px;
                font-size: 0.75rem;
                display: flex;
                align-items: center;
                gap: 0.25rem;
                cursor: pointer;
                transition: var(--transition);
            }
            
            .booking-indicator.pending {
                background: rgba(245, 158, 11, 0.2);
                color: var(--warning);
            }
            
            .booking-indicator.confirmed {
                background: rgba(5, 150, 105, 0.2);
                color: var(--success);
            }
            
            .booking-indicator.cancelled {
                background: rgba(220, 38, 38, 0.2);
                color: var(--error);
            }
            
            .more-bookings {
                padding: 0.25rem;
                text-align: center;
                font-size: 0.75rem;
                color: var(--text-light);
                font-weight: 600;
            }
            
            .no-bookings {
                text-align: center;
                padding: 3rem;
                color: var(--text-light);
            }
            
            .no-bookings i {
                font-size: 3rem;
                margin-bottom: 1rem;
                opacity: 0.3;
            }
            
            .no-bookings h3 {
                margin-bottom: 0.5rem;
            }
            
            .bookings-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 1rem;
            }
            
            .bookings-actions {
                display: flex;
                gap: 1rem;
                align-items: center;
            }
            
            .search-box {
                position: relative;
            }
            
            .search-box i {
                position: absolute;
                right: 1rem;
                top: 50%;
                transform: translateY(-50%);
                color: var(--text-light);
            }
            
            .form-sections {
                display: flex;
                flex-direction: column;
                gap: 2rem;
            }
            
            .form-section {
                border: 1px solid var(--border);
                border-radius: 8px;
                padding: 1.5rem;
            }
            
            .form-section h3 {
                margin-bottom: 1rem;
                display: flex;
                align-items: center;
                gap: 0.5rem;
                color: var(--primary);
            }
            
            .form-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 1rem;
            }
            
            .special-requests {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 0.5rem;
                margin-top: 0.5rem;
            }
            
            .checkbox-label {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                font-weight: normal;
                cursor: pointer;
            }
            
            .booking-summary {
                background: var(--bg-light);
                padding: 1rem;
                border-radius: 8px;
                margin-top: 2rem;
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
        `;
        document.head.appendChild(styles);
    }

    isToday(date) {
        const today = new Date();
        return date.toDateString() === today.toDateString();
    }

    isSameDay(date1, date2) {
        return date1.toDateString() === date2.toDateString();
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
        this.renderCalendar();
        this.renderBookings();
        
        if (window.appState) {
            window.appState.showNotification('Données actualisées', 'success');
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('booking')) {
        window.bookingManager = new BookingManager();
    }
});

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BookingManager;
}    createBookingCard(booking, compact = false) {
        const status = this.statusConfig[booking.status];
        const activity = this.activities.find(a => a.id === booking.activityId);
        const bookingDate = new Date(booking.date);
        const isUpcoming = bookingDate > new Date();
        const daysDiff = Math.ceil((bookingDate - new Date()) / (1000 * 60 * 60 * 24));

        return `
            <div class="booking-card ${compact ? 'compact' : ''}" data-booking-id="${booking.id}">
                <div class="booking-header">
                    <div class="booking-info">
                        <div class="activity-info">
                            <h4>${booking.activityName}</h4>
                            <p class="customer-name">
                                <i class="fas fa-user"></i> ${booking.customerName}
                            </p>
                        </div>
                        <div class="booking-meta">
                            <div class="booking-date ${isUpcoming ? 'upcoming' : 'past'}">
                                <i class="fas fa-calendar"></i>
                                ${bookingDate.toLocaleDateString('fr-FR', { 
                                    weekday: 'short', 
                                    day: '2-digit', 
                                    month: 'short' 
                                })}
                                ${bookingDate.toLocaleTimeString('fr-FR', { 
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                })}
                            </div>
                            ${isUpcoming && daysDiff <= 7 ? `
                                <div class="urgency-badge">
                                    <i class="fas fa-exclamation-triangle"></i>
                                    ${daysDiff === 0 ? 'Aujourd\'hui' : daysDiff === 1 ? 'Demain' : `Dans ${daysDiff} jours`}
                                </div>
                            ` : ''}
                        </div>
                    </div>
                    <div class="booking-status">
                        <span class="status-badge ${booking.status}" style="background-color: ${status.color};">
                            <i class="fas ${status.icon}"></i>
                            ${status.label}
                        </span>
                    </div>
                </div>

                <div class="booking-details">
                    <div class="detail-item">
                        <i class="fas fa-users"></i>
                        <span>${booking.participants} participant${booking.participants > 1 ? 's' : ''}</span>
                    </div>
                    <div class="detail-item">
                        <i class="fas fa-euro-sign"></i>
                        <span>${booking.totalAmount}€</span>
                    </div>
                    <div class="detail-item">
                        <i class="fas fa-credit-card"></i>
                        <span class="payment-status ${booking.paymentStatus}">
                            ${this.getPaymentStatusLabel(booking.paymentStatus)}
                        </span>
                    </div>
                    ${booking.customerPhone ? `
                        <div class="detail-item">
                            <i class="fas fa-phone"></i>
                            <span>${booking.customerPhone}</span>
                        </div>
                    ` : ''}
                </div>

                ${booking.notes || (booking.specialRequests && booking.specialRequests.length > 0) ? `
                    <div class="booking-notes">
                        ${booking.notes ? `<p><i class="fas fa-sticky-note"></i> ${booking.notes}</p>` : ''}
                        ${booking.specialRequests && booking.specialRequests.length > 0 ? `
                            <div class="special-requests">
                                <i class="fas fa-star"></i>
                                ${booking.specialRequests.map(req => `<span class="request-tag">${req}</span>`).join('')}
                            </div>
                        ` : ''}
                    </div>
                ` : ''}

                <div class="booking-actions">
                    <button class="action-btn contact" onclick="bookingManager.contactCustomer('${booking.id}')" title="Contacter">
                        <i class="fas fa-envelope"></i>
                    </button>
                    <button class="action-btn edit" onclick="bookingManager.editBooking('${booking.id}')" title="Modifier">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn status" onclick="bookingManager.changeStatus('${booking.id}')" title="Changer statut">
                        <i class="fas fa-exchange-alt"></i>
                    </button>
                    ${booking.status === 'pending' ? `
                        <button class="action-btn confirm" onclick="bookingManager.confirmBooking('${booking.id}')" title="Confirmer">
                            <i class="fas fa-check"></i>
                        </button>
                    ` : ''}
                    <button class="action-btn delete" onclick="bookingManager.deleteBooking('${booking.id}')" title="Supprimer">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }

    getPaymentStatusLabel(status) {
        const labels = {
            pending: 'En attente',
            partial: 'Acompte',
            paid: 'Payé',
            refunded: 'Remboursé'
        };
        return labels[status] || status;
    }

    setupBookingsFilters(bookingsCard) {
        const filtersContainer = bookingsCard.querySelector('#bookingsFilters');
        
        filtersContainer.innerHTML = `
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; padding: 1rem; background: var(--bg-light); border-radius: 8px;">
                <div class="form-group">
                    <label>Statut</label>
                    <select id="statusFilter" class="form-input">
                        <option value="all">Tous les statuts</option>
                        ${Object.entries(this.statusConfig).map(([key, config]) => 
                            `<option value="${key}">${config.label}</option>`
                        ).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label>Activité</label>
                    <select id="activityFilter" class="form-input">
                        <option value="all">Toutes les activités</option>
                        ${this.activities.map(activity => 
                            `<option value="${activity.id}">${activity.name}</option>`
                        ).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label>Période</label>
                    <select id="dateRangeFilter" class="form-input">
                        <option value="all">Toute la période</option>
                        <option value="today">Aujourd'hui</option>
                        <option value="week">Cette semaine</option>
                        <option value="month">Ce mois</option>
                        <option value="upcoming">À venir</option>
                        <option value="past">Passées</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Paiement</label>
                    <select id="paymentFilter" class="form-input">
                        <option value="all">Tous les paiements</option>
                        <option value="pending">En attente</option>
                        <option value="partial">Acompte</option>
                        <option value="paid">Payé</option>
                        <option value="refunded">Remboursé</option>
                    </select>
                </div>
            </div>
            <div style="display: flex; gap: 1rem; margin-top: 1rem;">
                <button class="btn" id="clearBookingFilters">Effacer les filtres</button>
                <button class="btn btn-primary" id="applyBookingFilters">Appliquer</button>
            </div>
        `;

        // Event listeners
        document.getElementById('bookingSearch').addEventListener('input', this.debounce(() => {
            this.applyBookingFilters();
        }, 300));

        document.getElementById('toggleFilters').addEventListener('click', () => {
            const isVisible = filtersContainer.style.display !== 'none';
            filtersContainer.style.display = isVisible ? 'none' : 'block';
        });

        document.getElementById('applyBookingFilters').addEventListener('click', () => {
            this.applyBookingFilters();
        });

        document.getElementById('clearBookingFilters').addEventListener('click', () => {
            this.clearBookingFilters();
        });

        document.getElementById('exportBookings').addEventListener('click', () => {
            this.exportBookings();
        });

        // Auto-apply filters on change
        ['statusFilter', 'activityFilter', 'dateRangeFilter', 'paymentFilter'].forEach(id => {
            document.getElementById(id).addEventListener('change', () => {
                this.applyBookingFilters();
            });
        });
    }

    applyBookingFilters() {
        this.filters = {
            status: document.getElementById('statusFilter')?.value || 'all',
            activity: document.getElementById('activityFilter')?.value || 'all',
            dateRange: document.getElementById('dateRangeFilter')?.value || 'all',
            payment: document.getElementById('paymentFilter')?.value || 'all',
            search: document.getElementById('bookingSearch')?.value.toLowerCase() || ''
        };

        this.renderBookings();
    }

    clearBookingFilters() {
        document.getElementById('statusFilter').value = 'all';
        document.getElementById('activityFilter').value = 'all';
        document.getElementById('dateRangeFilter').value = 'all';
        document.getElementById('paymentFilter').value = 'all';
        document.getElementById('bookingSearch').value = '';

        this.filters = {
            status: 'all',
            activity: 'all',
            dateRange: 'all',
            payment: 'all',
            search: ''
        };

        this.renderBookings();
    }

    getFilteredBookings() {
        let filtered = [...this.bookings];

        // Search filter
        if (this.filters.search) {
            filtered = filtered.filter(booking => 
                booking.customerName.toLowerCase().includes(this.filters.search) ||
                booking.activityName.toLowerCase().includes(this.filters.search) ||
                booking.customerEmail.toLowerCase().includes(this.filters.search) ||
                (booking.notes && booking.notes.toLowerCase().includes(this.filters.search))
            );
        }

        // Status filter
        if (this.filters.status !== 'all') {
            filtered = filtered.filter(booking => booking.status === this.filters.status);
        }

        // Activity filter
        if (this.filters.activity !== 'all') {
            filtered = filtered.filter(booking => booking.activityId === this.filters.activity);
        }

        // Payment filter
        if (this.filters.payment !== 'all') {
            filtered = filtered.filter(booking => booking.paymentStatus === this.filters.payment);
        }

        // Date range filter
        if (this.filters.dateRange !== 'all') {
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

            switch (this.filters.dateRange) {
                case 'today':
                    filtered = filtered.filter(booking => {
                        const bookingDate = new Date(booking.date);
                        return this.isSameDay(bookingDate, today);
                    });
                    break;
                
                case 'week':
                    const weekStart = new Date(today);
                    weekStart.setDate(today.getDate() - today.getDay() + 1); // Monday
                    const weekEnd = new Date(weekStart);
                    weekEnd.setDate(weekStart.getDate() + 6); // Sunday
                    
                    filtered = filtered.filter(booking => {
                        const bookingDate = new Date(booking.date);
                        return bookingDate >= weekStart && bookingDate <= weekEnd;
                    });
                    break;
                
                case 'month':
                    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
                    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                    
                    filtered = filtered.filter(booking => {
                        const bookingDate = new Date(booking.date);
                        return bookingDate >= monthStart && bookingDate <= monthEnd;
                    });
                    break;
                
                case 'upcoming':
                    filtered = filtered.filter(booking => {
                        const bookingDate = new Date(booking.date);
                        return bookingDate >= now;
                    });
                    break;
                
                case 'past':
                    filtered = filtered.filter(booking => {
                        const bookingDate = new Date(booking.date);
                        return bookingDate < now;
                    });
                    break;
            }
        }

        // Sort by date (newest first)
        return filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    // Booking actions
    contactCustomer(bookingId) {
        const booking = this.bookings.find(b => b.id === bookingId);
        if (!booking) return;

        const modal = document.createElement('div');
        modal.className = 'contact-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Contacter ${booking.customerName}</h2>
                    <button class="close-modal">&times;</button>
                </div>
                <div class="contact-options">
                    <a href="mailto:${booking.customerEmail}?subject=Réservation ${booking.activityName}&body=Bonjour ${booking.customerName},%0D%0A%0D%0AConcernant votre réservation pour ${booking.activityName} le ${new Date(booking.date).toLocaleDateString('fr-FR')}..." 
                       class="contact-option email">
                        <i class="fas fa-envelope"></i>
                        <div>
                            <strong>Email</strong>
                            <p>${booking.customerEmail}</p>
                        </div>
                    </a>
                    ${booking.customerPhone ? `
                        <a href="tel:${booking.customerPhone}" class="contact-option phone">
                            <i class="fas fa-phone"></i>
                            <div>
                                <strong>Téléphone</strong>
                                <p>${booking.customerPhone}</p>
                            </div>
                        </a>
                    ` : ''}
                    <div class="contact-option whatsapp" onclick="bookingManager.sendWhatsApp('${booking.id}')">
                        <i class="fab fa-whatsapp"></i>
                        <div>
                            <strong>WhatsApp</strong>
                            <p>Message rapide</p>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn" onclick="this.closest('.contact-modal').remove()">Fermer</button>
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

    sendWhatsApp(bookingId) {
        const booking = this.bookings.find(b => b.id === bookingId);
        if (!booking || !booking.customerPhone) return;

        const message = `Bonjour ${booking.customerName}, concernant votre réservation pour ${booking.activityName} le ${new Date(booking.date).toLocaleDateString('fr-FR')}...`;
        const phoneNumber = booking.customerPhone.replace(/[^0-9]/g, '');
        const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
        
        window.open(whatsappUrl, '_blank');
    }

    editBooking(bookingId) {
        const booking = this.bookings.find(b => b.id === bookingId);
        if (!booking) return;

        const modal = document.createElement('div');
        modal.className = 'edit-booking-modal';
        modal.innerHTML = `
            <div class="modal-content large">
                <div class="modal-header">
                    <h2>Modifier la Réservation</h2>
                    <button class="close-modal">&times;</button>
                </div>
                <form id="editBookingForm">
                    <div class="form-grid">
                        <div class="form-group">
                            <label>Activité</label>
                            <select name="activityId" class="form-input" required>
                                ${this.activities.map(activity => `
                                    <option value="${activity.id}" ${activity.id === booking.activityId ? 'selected' : ''}>
                                        ${activity.name} - ${activity.price}€
                                    </option>
                                `).join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Date et heure</label>
                            <input type="datetime-local" name="datetime" class="form-input" 
                                   value="${new Date(booking.date).toISOString().slice(0, 16)}" required>
                        </div>
                        <div class="form-group">
                            <label>Participants</label>
                            <input type="number" name="participants" class="form-input" 
                                   value="${booking.participants}" min="1" required>
                        </div>
                        <div class="form-group">
                            <label>Nom client</label>
                            <input type="text" name="customerName" class="form-input" 
                                   value="${booking.customerName}" required>
                        </div>
                        <div class="form-group">
                            <label>Email</label>
                            <input type="email" name="customerEmail" class="form-input" 
                                   value="${booking.customerEmail}" required>
                        </div>
                        <div class="form-group">
                            <label>Téléphone</label>
                            <input type="tel" name="customerPhone" class="form-input" 
                                   value="${booking.customerPhone || ''}">
                        </div>
                        <div class="form-group">
                            <label>Statut</label>
                            <select name="status" class="form-input">
                                ${Object.entries(this.statusConfig).map(([key, config]) => `
                                    <option value="${key}" ${key === booking.status ? 'selected' : ''}>
                                        ${config.label}
                                    </option>
                                `).join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Paiement</label>
                            <select name="paymentStatus" class="form-input">
                                <option value="pending" ${booking.paymentStatus === 'pending' ? 'selected' : ''}>En attente</option>
                                <option value="partial" ${booking.paymentStatus === 'partial' ? 'selected' : ''}>Acompte</option>
                                <option value="paid" ${booking.paymentStatus === 'paid' ? 'selected' : ''}>Payé</option>
                                <option value="refunded" ${booking.paymentStatus === 'refunded' ? 'selected' : ''}>Remboursé</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label>Notes</label>
                        <textarea name="notes" class="form-input" rows="3">${booking.notes || ''}</textarea>
                    </div>
                    
                    <div class="modal-actions">
                        <button type="submit" class="btn btn-primary">Sauvegarder</button>
                        <button type="button" class="btn" onclick="this.closest('.edit-booking-modal').remove()">Annuler</button>
                    </div>
                </form>
            </div>
        `;

        this.addModalStyles(modal);
        modal.querySelector('.modal-content').style.maxWidth = '700px';
        document.body.appendChild(modal);

        // Handle form submission
        const form = modal.querySelector('#editBookingForm');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveBookingEdit(bookingId, form, modal);
        });

        // Close modal
        modal.querySelector('.close-modal').onclick = () => modal.remove();
        modal.onclick = (e) => {
            if (e.target === modal) modal.remove();
        };
    }

    saveBookingEdit(bookingId, form, modal) {
        const formData = new FormData(form);
        const editData = Object.fromEntries(formData.entries());

        if (!this.validateBookingData(editData)) {
            return;
        }

        const bookingIndex = this.bookings.findIndex(b => b.id === bookingId);
        if (bookingIndex !== -1) {
            const activity = this.activities.find(a => a.id === editData.activityId);
            const participants = parseInt(editData.participants);
            
            // Calculate new total
            const unitPrice = activity ? activity.price : this.bookings[bookingIndex].totalAmount / this.bookings[bookingIndex].participants;
            const newTotal = unitPrice * participants;

            this.bookings[bookingIndex] = {
                ...this.bookings[bookingIndex],
                activityId: editData.activityId,
                activityName: activity ? activity.name : this.bookings[bookingIndex].activityName,
                customerName: editData.customerName.trim(),
                customerEmail: editData.customerEmail.trim(),
                customerPhone: editData.customerPhone.trim(),
                date: new Date(editData.datetime).toISOString(),
                participants,
                totalAmount: newTotal,
                status: editData.status,
                paymentStatus: editData.paymentStatus,
                notes: editData.notes.trim(),
                updatedAt: new Date().toISOString()
            };

            this.saveData();
            this.renderCalendar();
            this.renderBookings();
            modal.remove();

            if (window.appState) {
                window.appState.showNotification('Réservation modifiée', 'success');
            }
        }
    }

    changeStatus(bookingId) {
        const booking = this.bookings.find(b => b.id === bookingId);
        if (!booking) return;

        const statusOptions = Object.entries(this.statusConfig)
            .filter(([key]) => key !== booking.status)
            .map(([key, config]) => `
                <button class="status-option" onclick="bookingManager.updateStatus('${bookingId}', '${key}')">
                    <i class="fas ${config.icon}"></i>
                    ${config.label}
                </button>
            `).join('');

        const modal = document.createElement('div');
        modal.className = 'status-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Changer le Statut</h2>
                    <button class="close-modal">&times;</button>
                </div>
                <div class="current-status">
                    <p>Statut actuel: <strong>${this.statusConfig[booking.status].label}</strong></p>
                </div>
                <div class="status-options">
                    ${statusOptions}
                </div>
                <div class="modal-footer">
                    <button class="btn" onclick="this.closest('.status-modal').remove()">Annuler</button>
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

    updateStatus(bookingId, newStatus) {
        const booking = this.bookings.find(b => b.id === bookingId);
        if (!booking) return;

        const oldStatus = booking.status;
        booking.status = newStatus;
        booking.updatedAt = new Date().toISOString();

        // Handle status-specific logic
        if (newStatus === 'confirmed' && oldStatus !== 'confirmed') {
            // Add transaction for newly confirmed booking
            if (window.caisseManager) {
                this.addBookingTransaction(booking);
            }
        } else if (oldStatus === 'confirmed' && newStatus === 'cancelled') {
            // Handle cancellation - potentially add refund transaction
            if (window.caisseManager && booking.paymentStatus === 'paid') {
                this.addRefundTransaction(booking);
            }
        }

        this.saveData();
        this.renderCalendar();
        this.renderBookings();

        // Close modal
        document.querySelector('.status-modal')?.remove();

        if (window.appState) {
            window.appState.showNotification(
                `Statut changé: ${this.statusConfig[newStatus].label}`, 
                'success'
            );
        }
    }

    addRefundTransaction(booking) {
        const transaction = {
            id: window.caisseManager.generateId(),
            description: `Remboursement: ${booking.activityName} - ${booking.customerName}`,
            amount: -booking.totalAmount,
            category: 'voyage',
            date: new Date().toISOString(),
            type: 'expense',
            createdBy: window.appState?.currentUser?.uid || 'demo-user',
            relatedBookingId: booking.id
        };

        if (window.caisseManager.transactions) {
            window.caisseManager.transactions.unshift(transaction);
            window.caisseManager.saveData();
            window.caisseManager.updateStats();
        }
    }

    confirmBooking(bookingId) {
        this.updateStatus(bookingId, 'confirmed');
    }

    deleteBooking(bookingId) {
        const booking = this.bookings.find(b => b.id === bookingId);
        if (!booking) return;

        if (confirm(`Êtes-vous sûr de vouloir supprimer la réservation de ${booking.customerName} ?`)) {
            this.bookings = this.bookings.filter(b => b.id !== bookingId);
            this.saveData();
            this.renderCalendar();
            this.renderBookings();

            if (window.appState) {
                window.appState.showNotification('Réservation supprimée', 'success');
            }
        }
    }

    // Calendar navigation methods
    navigateMonth(direction) {
        this.calendar.currentDate.setMonth(this.calendar.currentDate.getMonth() + direction);
        this.renderCalendar();
    }

    goToToday() {
        this.calendar.currentDate = new Date();
        this.renderCalendar();
    }

    selectDate(date) {
        this.calendar.selectedDate = date;
        // Update visual selection if needed
    }

    formatCurrentMonth() {
        return this.calendar.currentDate.toLocaleDateString('fr-FR', { 
            year: 'numeric', 
            month: 'long' 
        });
    }

    // Export functionality
    exportBookings() {
        const filteredBookings = this.getFilteredBookings();
        const csv = this.generateBookingsCSV(filteredBookings);
        this.downloadCSV(csv, 'reservations-sfm.csv');
        
        if (window.appState) {
            window.appState.showNotification(`${filteredBookings.length} réservations exportées`, 'success');
        }
    }

    generateBookingsCSV(bookings) {
        const headers = [
            'Date', 'Activité', 'Client', 'Email', 'Téléphone', 
            'Participants', 'Montant', 'Statut', 'Paiement', 'Notes'
        ];
        
        const rows = bookings.map(booking => [
            new Date(booking.date).toLocaleDateString('fr-FR') + ' ' + new Date(booking.date).toLocaleTimeString('fr-FR'),
            booking.activityName,
            `"${booking.customerName.replace(/"/g, '""')}"`,
            booking.customerEmail,
            booking.customerPhone || '',
            booking.participants,
            booking.totalAmount.toFixed(2),
            this.statusConfig[booking.status].label,
            this.getPaymentStatusLabel(booking.paymentStatus),
            `"${(booking.notes || '').replace(/"/g, '""')}"`
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

    // Quick actions and shortcuts
    createQuickActions() {
        const bookingModule = document.getElementById('booking');
        if (document.querySelector('.quick-actions')) return;

        const quickActions = document.createElement('div');
        quickActions.className = 'quick-actions card';
        quickActions.innerHTML = `
            <h3>Actions Rapides</h3>
            <div class="quick-actions-grid">
                <button class="quick-action" onclick="bookingManager.showNewBookingModal()">
                    <i class="fas fa-plus"></i>
                    <span>Nouvelle réservation</span>
                </button>
                <button class="quick-action" onclick="bookingManager.showTodayBookings()">
                    <i class="fas fa-calendar-day"></i>
                    <span>Aujourd'hui</span>
                </button>
                <button class="quick-action" onclick="bookingManager.showPendingBookings()">
                    <i class="fas fa-clock"></i>
                    <span>En attente</span>
                </button>
                <button class="quick-action" onclick="bookingManager.showUpcomingBookings()">
                    <i class="fas fa-calendar-week"></i>
                    <span>À venir</span>
                </button>
            </div>
        `;

        ///**
 * ====================================
 * SFM - Booking Management Module
 * Handles activity bookings and calendar
 * ====================================
 */

class BookingManager {
    constructor() {
        this.bookings = [];
        this.activities = [];
        this.calendar = {
            currentDate: new Date(),
            selectedDate: null,
            viewMode: 'month' // month, week, day
        };
        this.filters = {
            status: 'all',
            dateRange: 'all',
            activity: 'all',
            customer: ''
        };
        this.statusConfig = {
            pending: { label: 'En attente', color: '#f59e0b', icon: 'fa-clock' },
            confirmed: { label: 'Confirmé', color: '#059669', icon: 'fa-check' },
            cancelled: { label: 'Annulé', color: '#dc2626', icon: 'fa-times' },
            completed: { label: 'Terminé', color: '#6b7280', icon: 'fa-flag-checkered' },
            no_show: { label: 'Absence', color: '#8b5cf6', icon: 'fa-user-slash' }
        };
        this.init();
    }

    init() {
        this.loadData();
        this.setupEventListeners();
        this.renderCalendar();
        this.renderBookings();
        this.setupFilters();
        this.createQuickActions();
        this.loadActivities();
    }

    loadData() {
        if (window.appState) {
            this.bookings = window.appState.data.bookings || [];
            this.activities = window.appState.data.activities || [];
        } else {
            this.bookings = JSON.parse(localStorage.getItem('sfm_bookings')) || [];
            this.activities = JSON.parse(localStorage.getItem('sfm_activities')) || [];
        }

        // Load demo data if empty
        if (this.bookings.length === 0) {
            this.loadDemoData();
        }
    }

    saveData() {
        if (window.appState) {
            window.appState.saveData('bookings', this.bookings);
            window.appState.saveData('activities', this.activities);
        } else {
            localStorage.setItem('sfm_bookings', JSON.stringify(this.bookings));
            localStorage.setItem('sfm_activities', JSON.stringify(this.activities));
        }
    }

    loadDemoData() {
        // Demo activities
        this.activities = [
            {
                id: 'plongee-zanzibar',
                name: 'Plongée Zanzibar',
                type: 'aquatic',
                duration: 4,
                maxParticipants: 8,
                price: 450,
                description: 'Exploration des récifs coralliens'
            },
            {
                id: 'safari-serengeti',
                name: 'Safari Serengeti',
                type: 'wildlife',
                duration: 24,
                maxParticipants: 12,
                price: 1200,
                description: 'Safari photo dans le Serengeti'
            },
            {
                id: 'randonnee-kilimanjaro',
                name: 'Randonnée Kilimanjaro',
                type: 'hiking',
                duration: 72,
                maxParticipants: 6,
                price: 2500,
                description: 'Ascension du point culminant d\'Afrique'
            }
        ];

        // Demo bookings
        const today = new Date();
        this.bookings = [
            {
                id: this.generateId(),
                activityId: 'safari-serengeti',
                activityName: 'Safari Serengeti',
                customerName: 'Famille Martin',
                customerEmail: 'martin.famille@email.com',
                customerPhone: '+33612345678',
                date: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                participants: 4,
                totalAmount: 4800,
                status: 'confirmed',
                notes: 'Anniversaire de mariage - demande guide francophone',
                createdAt: new Date().toISOString(),
                paymentStatus: 'paid',
                specialRequests: ['Guide francophone', 'Repas végétarien']
            },
            {
                id: this.generateId(),
                activityId: 'plongee-zanzibar',
                activityName: 'Plongée Zanzibar',
                customerName: 'Jean Dupont',
                customerEmail: 'jean.dupont@email.com',
                customerPhone: '+33687654321',
                date: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(),
                participants: 2,
                totalAmount: 900,
                status: 'pending',
                notes: 'Premier niveau de plongée',
                createdAt: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
                paymentStatus: 'pending',
                specialRequests: ['Matériel débutant']
            },
            {
                id: this.generateId(),
                activityId: 'randonnee-kilimanjaro',
                activityName: 'Randonnée Kilimanjaro',
                customerName: 'Marie Durand',
                customerEmail: 'marie.durand@email.com',
                customerPhone: '+33698765432',
                date: new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                participants: 1,
                totalAmount: 2500,
                status: 'confirmed',
                notes: 'Expérience en haute altitude',
                createdAt: new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
                paymentStatus: 'partial',
                specialRequests: ['Équipement haute altitude']
            }
        ];

        this.saveData();
    }

    setupEventListeners() {
        const bookingModule = document.getElementById('booking');
        if (!bookingModule) return;

        // Calendar navigation
        this.setupCalendarNavigation();
        
        // Quick booking button
        this.createQuickBookingButton();
        
        // View mode toggles
        this.setupViewModeToggles();
        
        // Refresh button
        this.createRefreshButton();
    }

    setupCalendarNavigation() {
        const bookingModule = document.getElementById('booking');
        const calendarCard = bookingModule.querySelector('.card');
        
        if (calendarCard) {
            const calendarHeader = document.createElement('div');
            calendarHeader.className = 'calendar-header';
            calendarHeader.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                    <div class="calendar-nav">
                        <button class="nav-btn" id="prevMonth">
                            <i class="fas fa-chevron-left"></i>
                        </button>
                        <h3 id="currentMonth">${this.formatCurrentMonth()}</h3>
                        <button class="nav-btn" id="nextMonth">
                            <i class="fas fa-chevron-right"></i>
                        </button>
                    </div>
                    <div class="calendar-actions">
                        <button class="btn" id="todayBtn">Aujourd'hui</button>
                        <button class="btn btn-primary" id="newBookingBtn">
                            <i class="fas fa-plus"></i> Nouvelle réservation
                        </button>
                    </div>
                </div>
            `;

            const existingH2 = calendarCard.querySelector('h2');
            existingH2.replaceWith(calendarHeader);

            // Event listeners
            document.getElementById('prevMonth').addEventListener('click', () => {
                this.navigateMonth(-1);
            });

            document.getElementById('nextMonth').addEventListener('click', () => {
                this.navigateMonth(1);
            });

            document.getElementById('todayBtn').addEventListener('click', () => {
                this.goToToday();
            });

            document.getElementById('newBookingBtn').addEventListener('click', () => {
                this.showNewBookingModal();
            });
        }
    }

    renderCalendar() {
        const calendar = document.querySelector('.calendar');
        if (!calendar) return;

        calendar.innerHTML = '';
        
        // Calendar headers
        const headers = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
        headers.forEach(header => {
            const headerDiv = document.createElement('div');
            headerDiv.className = 'calendar-header-day';
            headerDiv.innerHTML = `<strong>${header}</strong>`;
            headerDiv.style.cssText = `
                background: var(--bg-light);
                padding: 0.75rem;
                text-align: center;
                font-weight: 600;
                color: var(--text-dark);
                border-bottom: 1px solid var(--border);
            `;
            calendar.appendChild(headerDiv);
        });

        // Calendar days
        const daysInMonth = this.getDaysInCurrentMonth();
        daysInMonth.forEach(dayInfo => {
            const dayDiv = this.createCalendarDay(dayInfo);
            calendar.appendChild(dayDiv);
        });

        // Update current month display
        const currentMonthElement = document.getElementById('currentMonth');
        if (currentMonthElement) {
            currentMonthElement.textContent = this.formatCurrentMonth();
        }
    }

    createCalendarDay(dayInfo) {
        const { date, isCurrentMonth, isToday, bookings } = dayInfo;
        const dayDiv = document.createElement('div');
        dayDiv.className = `calendar-day ${!isCurrentMonth ? 'other-month' : ''} ${isToday ? 'today' : ''}`;
        
        const bookingCount = bookings.length;
        const hasBookings = bookingCount > 0;
        
        dayDiv.innerHTML = `
            <div class="day-number">${date.getDate()}</div>
            ${hasBookings ? `
                <div class="day-bookings">
                    ${bookings.slice(0, 2).map(booking => `
                        <div class="booking-indicator ${booking.status}" title="${booking.customerName} - ${booking.activityName}">
                            <i class="fas ${this.statusConfig[booking.status].icon}"></i>
                            ${booking.customerName.split(' ')[0]}
                        </div>
                    `).join('')}
                    ${bookingCount > 2 ? `<div class="more-bookings">+${bookingCount - 2}</div>` : ''}
                </div>
            ` : ''}
        `;

        // Add click event
        dayDiv.addEventListener('click', () => {
            this.selectDate(date);
            this.showDayBookings(date, bookings);
        });

        // Add booking indicator classes
        if (hasBookings) {
            dayDiv.classList.add('has-bookings');
        }

        return dayDiv;
    }

    getDaysInCurrentMonth() {
        const year = this.calendar.currentDate.getFullYear();
        const month = this.calendar.currentDate.getMonth();
        
        // First day of the month
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        
        // Start from Monday of the week containing the first day
        const startDate = new Date(firstDay);
        startDate.setDate(firstDay.getDate() - (firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1));
        
        // End at Sunday of the week containing the last day
        const endDate = new Date(lastDay);
        endDate.setDate(lastDay.getDate() + (7 - lastDay.getDay()) % 7);
        
        const days = [];
        const currentDate = new Date(startDate);
        
        while (currentDate <= endDate) {
            const dateBookings = this.getBookingsForDate(currentDate);
            
            days.push({
                date: new Date(currentDate),
                isCurrentMonth: currentDate.getMonth() === month,
                isToday: this.isToday(currentDate),
                bookings: dateBookings
            });
            
            currentDate.setDate(currentDate.getDate() + 1);
        }
        
        return days;
    }

    getBookingsForDate(date) {
        return this.bookings.filter(booking => {
            const bookingDate = new Date(booking.date);
            return this.isSameDay(bookingDate, date);
        });
    }

    showDayBookings(date, bookings) {
        if (bookings.length === 0) {
            this.showNewBookingModal(date);
            return;
        }

        const modal = document.createElement('div');
        modal.className = 'day-bookings-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Réservations du ${date.toLocaleDateString('fr-FR', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                    })}</h2>
                    <button class="close-modal">&times;</button>
                </div>
                <div class="day-bookings-list">
                    ${bookings.map(booking => this.createBookingCard(booking, true)).join('')}
                </div>
                <div class="modal-footer">
                    <button class="btn btn-primary" onclick="bookingManager.showNewBookingModal('${date.toISOString()}')">
                        <i class="fas fa-plus"></i> Nouvelle réservation
                    </button>
                    <button class="btn" onclick="this.closest('.day-bookings-modal').remove()">Fermer</button>
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

    showNewBookingModal(selectedDate = null) {
        const modal = document.createElement('div');
        modal.className = 'new-booking-modal';
        
        const defaultDate = selectedDate ? 
            (typeof selectedDate === 'string' ? selectedDate : selectedDate.toISOString()) :
            new Date().toISOString();

        modal.innerHTML = `
            <div class="modal-content large">
                <div class="modal-header">
                    <h2>Nouvelle Réservation</h2>
                    <button class="close-modal">&times;</button>
                </div>
                <form id="newBookingForm">
                    <div class="form-sections">
                        <div class="form-section">
                            <h3><i class="fas fa-calendar-alt"></i> Détails de l'activité</h3>
                            <div class="form-grid">
                                <div class="form-group">
                                    <label>Activité *</label>
                                    <select name="activityId" class="form-input" required>
                                        <option value="">Sélectionner une activité</option>
                                        ${this.activities.map(activity => `
                                            <option value="${activity.id}" data-price="${activity.price}" data-max="${activity.maxParticipants}">
                                                ${activity.name} - ${activity.price}€
                                            </option>
                                        `).join('')}
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label>Date et heure *</label>
                                    <input type="datetime-local" name="datetime" class="form-input" 
                                           value="${defaultDate.slice(0, 16)}" required>
                                </div>
                                <div class="form-group">
                                    <label>Nombre de participants *</label>
                                    <input type="number" name="participants" class="form-input" 
                                           min="1" value="1" required>
                                    <small class="form-help">Maximum: <span id="maxParticipants">-</span></small>
                                </div>
                            </div>
                        </div>

                        <div class="form-section">
                            <h3><i class="fas fa-user"></i> Informations client</h3>
                            <div class="form-grid">
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
                            </div>
                        </div>

                        <div class="form-section">
                            <h3><i class="fas fa-cog"></i> Options</h3>
                            <div class="form-grid">
                                <div class="form-group">
                                    <label>Statut</label>
                                    <select name="status" class="form-input">
                                        <option value="pending">En attente</option>
                                        <option value="confirmed" selected>Confirmé</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label>Statut paiement</label>
                                    <select name="paymentStatus" class="form-input">
                                        <option value="pending">En attente</option>
                                        <option value="partial">Acompte</option>
                                        <option value="paid">Payé</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label>Prix unitaire (€)</label>
                                    <input type="number" name="unitPrice" class="form-input" step="0.01" readonly>
                                </div>
                            </div>
                        </div>

                        <div class="form-section">
                            <h3><i class="fas fa-comment"></i> Demandes spéciales</h3>
                            <div class="form-group">
                                <label>Notes</label>
                                <textarea name="notes" class="form-input" rows="3" 
                                          placeholder="Allergies, régimes alimentaires, demandes particulières..."></textarea>
                            </div>
                            <div class="form-group">
                                <label>Demandes spéciales</label>
                                <div class="special-requests">
                                    <label class="checkbox-label">
                                        <input type="checkbox" name="specialRequests" value="Guide francophone"> Guide francophone
                                    </label>
                                    <label class="checkbox-label">
                                        <input type="checkbox" name="specialRequests" value="Repas végétarien"> Repas végétarien
                                    </label>
                                    <label class="checkbox-label">
                                        <input type="checkbox" name="specialRequests" value="Matériel débutant"> Matériel débutant
                                    </label>
                                    <label class="checkbox-label">
                                        <input type="checkbox" name="specialRequests" value="Transport inclus"> Transport inclus
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="booking-summary">
                        <div class="summary-line">
                            <span>Prix unitaire:</span>
                            <span id="displayUnitPrice">0€</span>
                        </div>
                        <div class="summary-line">
                            <span>Participants:</span>
                            <span id="displayParticipants">1</span>
                        </div>
                        <div class="summary-line total">
                            <span><strong>Total:</strong></span>
                            <span><strong id="displayTotal">0€</strong></span>
                        </div>
                    </div>

                    <div class="modal-actions">
                        <button type="submit" class="btn btn-primary">
                            <i class="fas fa-save"></i> Créer la réservation
                        </button>
                        <button type="button" class="btn" onclick="this.closest('.new-booking-modal').remove()">
                            Annuler
                        </button>
                    </div>
                </form>
            </div>
        `;

        this.addModalStyles(modal);
        modal.querySelector('.modal-content').style.maxWidth = '800px';
        document.body.appendChild(modal);

        // Setup form interactions
        this.setupBookingFormInteractions(modal);

        // Handle form submission
        const form = modal.querySelector('#newBookingForm');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.createBooking(form, modal);
        });

        // Close modal
        modal.querySelector('.close-modal').onclick = () => modal.remove();
        modal.onclick = (e) => {
            if (e.target === modal) modal.remove();
        };
    }

    setupBookingFormInteractions(modal) {
        const activitySelect = modal.querySelector('select[name="activityId"]');
        const participantsInput = modal.querySelector('input[name="participants"]');
        const unitPriceInput = modal.querySelector('input[name="unitPrice"]');

        // Update pricing when activity or participants change
        const updatePricing = () => {
            const selectedOption = activitySelect.selectedOptions[0];
            if (selectedOption && selectedOption.value) {
                const price = parseFloat(selectedOption.dataset.price) || 0;
                const maxParticipants = parseInt(selectedOption.dataset.max) || 1;
                const participants = parseInt(participantsInput.value) || 1;

                unitPriceInput.value = price.toFixed(2);
                modal.querySelector('#maxParticipants').textContent = maxParticipants;
                modal.querySelector('#displayUnitPrice').textContent = price + '€';
                modal.querySelector('#displayParticipants').textContent = participants;
                modal.querySelector('#displayTotal').textContent = (price * participants) + '€';

                // Update max participants validation
                participantsInput.max = maxParticipants;
                if (participants > maxParticipants) {
                    participantsInput.value = maxParticipants;
                    updatePricing(); // Recursive call to update display
                }
            }
        };

        activitySelect.addEventListener('change', updatePricing);
        participantsInput.addEventListener('input', updatePricing);

        // Initialize pricing
        updatePricing();
    }

    createBooking(form, modal) {
        const formData = new FormData(form);
        const bookingData = Object.fromEntries(formData.entries());

        // Get special requests
        const specialRequests = Array.from(form.querySelectorAll('input[name="specialRequests"]:checked'))
                                    .map(cb => cb.value);

        // Validation
        if (!this.validateBookingData(bookingData)) {
            return;
        }

        const activity = this.activities.find(a => a.id === bookingData.activityId);
        const participants = parseInt(bookingData.participants);
        const unitPrice = parseFloat(bookingData.unitPrice);

        const booking = {
            id: this.generateId(),
            activityId: bookingData.activityId,
            activityName: activity.name,
            customerName: bookingData.customerName.trim(),
            customerEmail: bookingData.customerEmail.trim(),
            customerPhone: bookingData.customerPhone.trim() || '',
            date: new Date(bookingData.datetime).toISOString(),
            participants,
            totalAmount: unitPrice * participants,
            status: bookingData.status,
            paymentStatus: bookingData.paymentStatus,
            notes: bookingData.notes.trim() || '',
            specialRequests,
            createdAt: new Date().toISOString(),
            createdBy: window.appState?.currentUser?.uid || 'demo-user',
            updatedAt: new Date().toISOString()
        };

        this.bookings.unshift(booking);
        this.saveData();
        
        // Add revenue to caisse if confirmed
        if (booking.status === 'confirmed' && window.caisseManager) {
            this.addBookingTransaction(booking);
        }

        modal.remove();
        this.renderCalendar();
        this.renderBookings();

        if (window.appState) {
            window.appState.showNotification('Réservation créée avec succès', 'success');
        }

        // Send confirmation email (mock)
        this.sendBookingConfirmation(booking);
    }

    validateBookingData(data) {
        if (!data.activityId) {
            this.showError('Veuillez sélectionner une activité');
            return false;
        }

        if (!data.customerName || data.customerName.trim().length < 2) {
            this.showError('Le nom du client est requis');
            return false;
        }

        if (!data.customerEmail || !this.isValidEmail(data.customerEmail)) {
            this.showError('Un email valide est requis');
            return false;
        }

        if (!data.datetime) {
            this.showError('La date et heure sont requises');
            return false;
        }

        const bookingDate = new Date(data.datetime);
        if (bookingDate < new Date()) {
            this.showError('La date ne peut pas être dans le passé');
            return false;
        }

        const participants = parseInt(data.participants);
        if (participants < 1) {
            this.showError('Au moins 1 participant est requis');
            return false;
        }

        return true;
    }

    addBookingTransaction(booking) {
        const transaction = {
            id: window.caisseManager.generateId(),
            description: `Réservation: ${booking.activityName} - ${booking.customerName}`,
            amount: booking.totalAmount,
            category: 'voyage',
            date: new Date().toISOString(),
            type: 'income',
            createdBy: window.appState?.currentUser?.uid || 'demo-user',
            relatedBookingId: booking.id
        };

        if (window.caisseManager.transactions) {
            window.caisseManager.transactions.unshift(transaction);
            window.caisseManager.saveData();
            window.caisseManager.updateStats();
        }
    }

    renderBookings() {
        const bookingModule = document.getElementById('booking');
        let bookingsList = bookingModule.querySelector('.bookings-list');

        if (!bookingsList) {
            // Create bookings list card
            const bookingsCard = document.createElement('div');
            bookingsCard.className = 'card';
            bookingsCard.innerHTML = `
                <div class="bookings-header">
                    <h2>Réservations Récentes</h2>
                    <div class="bookings-actions">
                        <div class="search-box">
                            <input type="text" id="bookingSearch" class="form-input" placeholder="Rechercher...">
                            <i class="fas fa-search"></i>
                        </div>
                        <button class="btn" id="toggleFilters">
                            <i class="fas fa-filter"></i> Filtres
                        </button>
                        <button class="btn" id="exportBookings">
                            <i class="fas fa-download"></i> Export
                        </button>
                    </div>
                </div>
                <div class="bookings-filters" id="bookingsFilters" style="display: none;">
                    <!-- Filters will be added here -->
                </div>
                <div class="bookings-list">
                    <!-- Bookings will be rendered here -->
                </div>
            `;

            // Insert after calendar
            const calendarCard = bookingModule.querySelector('.card');
            calendarCard.insertAdjacentElement('afterend', bookingsCard);

            bookingsList = bookingsCard.querySelector('.bookings-list');

            // Setup filters and search
            this.setupBookingsFilters(bookingsCard);
        }

        // Render filtered bookings
        const filteredBookings = this.getFilteredBookings();
        
        if (filteredBookings.length === 0) {
            bookingsList.innerHTML = `
                <div class="no-bookings">
                    <i class="fas fa-calendar-times"></i>
                    <h3>Aucune réservation trouvée</h3>
                    <p>Créez votre première réservation</p>
                    <button class="btn btn-primary" onclick="bookingManager.showNewBookingModal()">
                        <i class="fas fa-plus"></i> Nouvelle réservation
                    </button>
                </div>
            `;
            return;
        }

        bookingsList.innerHTML = filteredBookings
            .slice(0, 20) // Limit to 20 for performance
            .map(booking => this.createBookingCard(booking))
            .join('');

        // Add load more if needed
        if (filteredBookings.length > 20) {
            const loadMoreBtn = document.createElement('button');
            loadMoreBtn.className = 'btn';
            loadMoreBtn.style.cssText = 'width: 100%; margin-top: 1rem;';
            loadMoreBtn.textContent = `Voir plus (${filteredBookings.length - 20} restantes)`;
            loadMoreBtn.onclick = () => this.loadMoreBookings();
            bookingsList.appendChild(loadMoreBtn);
        }
    }

    createBookingCard(booking, compact = false) {
        const status = this.statusConfig[booking.status];
        const activity = this.activities.find(a => a.id === booking.activityId);
        const bookingDate = new Date(booking.date);
        const isUpcoming = bookingDate > new Date();
        const daysDiff = Math.ceil((bookingDate - new Date()) / (1000 * 60 * 60 * 24));

        return `
            <div class="booking-card ${compact ? 'compact' : ''}" data-booking-id="${booking.id}">
                <div class="booking