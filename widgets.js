        const updateTime = document.getElementById('updateTime');
        if (updateTime && this.weather.lastUpdate) {
            updateTime.textContent = `Dernière MAJ: ${this.weather.lastUpdate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
        }

        // Update hourly forecast
        this.updateHourlyForecast();
    }

    updateHourlyForecast() {
        const hourlyForecast = document.getElementById('hourlyForecast');
        if (!hourlyForecast || !this.weather.data.hourlyForecast) return;

        hourlyForecast.innerHTML = this.weather.data.hourlyForecast.slice(0, 6).map(hour => `
            <div class="hourly-item">
                <div class="hourly-time">${hour.time.toLocaleTimeString('fr-FR', { hour: '2-digit' })}h</div>
                <div class="hourly-icon">
                    <i class="fas ${this.getWeatherIcon(hour.weatherCode || 0)}"></i>
                </div>
                <div class="hourly-temp">${hour.temperature}°</div>
            </div>
        `).join('');
    }

    async refreshWeather() {
        const refreshBtn = document.getElementById('refreshWeather');
        if (refreshBtn) {
            refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Chargement...';
            refreshBtn.disabled = true;
        }

        await this.initWeather();

        if (refreshBtn) {
            refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Actualiser';
            refreshBtn.disabled = false;
        }

        if (window.appState) {
            window.appState.showNotification('Météo actualisée', 'success');
        }
    }

    setupCurrencyConverter() {
        this.loadExchangeRates();
        this.createCurrencyConverter();
    }

    async loadExchangeRates() {
        try {
            // Use a free exchange rate API
            const response = await fetch('https://api.exchangerate-api.com/v4/latest/EUR');
            
            if (response.ok) {
                const data = await response.json();
                this.currency.rates = data.rates;
                this.currency.lastUpdate = new Date();
            } else {
                throw new Error('Exchange rate API unavailable');
            }
        } catch (error) {
            console.warn('Exchange rate API error:', error);
            // Fallback to simulated rates
            this.currency.rates = {
                USD: 1.08,
                GBP: 0.86,
                CHF: 0.97,
                JPY: 158.50,
                CAD: 1.47,
                AUD: 1.62,
                CNY: 7.85
            };
            this.currency.lastUpdate = new Date();
        }
    }

    createCurrencyConverter() {
        const converterCard = document.querySelector('#widgets .card:has(#currencyAmount)');
        if (!converterCard) return;

        // Enhanced converter with favorites and history
        const enhancedConverter = document.createElement('div');
        enhancedConverter.className = 'enhanced-converter';
        enhancedConverter.innerHTML = `
            <div class="converter-shortcuts">
                <h4><i class="fas fa-star"></i> Conversions rapides</h4>
                <div class="quick-conversions" id="quickConversions">
                    <!-- Quick conversions will be populated here -->
                </div>
            </div>
            <div class="conversion-history">
                <h4><i class="fas fa-history"></i> Historique</h4>
                <div class="conversion-history-list" id="conversionHistoryList">
                    <div class="no-history">Aucune conversion effectuée</div>
                </div>
            </div>
        `;

        const conversionResult = document.getElementById('conversionResult');
        if (conversionResult) {
            conversionResult.insertAdjacentElement('afterend', enhancedConverter);
        }

        this.updateQuickConversions();
        this.addCurrencyConverterEvents();
        this.addCurrencyStyles();
    }

    addCurrencyStyles() {
        if (document.querySelector('#currency-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'currency-styles';
        styles.textContent = `
            .enhanced-converter {
                margin-top: 1rem;
                border-top: 1px solid var(--border);
                padding-top: 1rem;
            }
            
            .converter-shortcuts {
                margin-bottom: 1rem;
            }
            
            .converter-shortcuts h4,
            .conversion-history h4 {
                margin: 0 0 0.5rem 0;
                color: var(--text-dark);
                font-size: 0.875rem;
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }
            
            .quick-conversions {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
                gap: 0.5rem;
            }
            
            .quick-conversion {
                background: var(--bg-light);
                border: 1px solid var(--border);
                border-radius: 6px;
                padding: 0.5rem;
                text-align: center;
                cursor: pointer;
                transition: var(--transition);
                font-size: 0.75rem;
            }
            
            .quick-conversion:hover {
                background: var(--primary);
                color: white;
                border-color: var(--primary);
            }
            
            .quick-conversion-pair {
                font-weight: 600;
                margin-bottom: 0.25rem;
            }
            
            .quick-conversion-rate {
                color: var(--text-light);
            }
            
            .quick-conversion:hover .quick-conversion-rate {
                color: rgba(255,255,255,0.8);
            }
            
            .conversion-history-list {
                max-height: 120px;
                overflow-y: auto;
                font-size: 0.75rem;
            }
            
            .conversion-history-item {
                padding: 0.5rem;
                border-bottom: 1px solid var(--border);
                cursor: pointer;
                transition: var(--transition);
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .conversion-history-item:hover {
                background: var(--bg-light);
            }
            
            .conversion-history-item:last-child {
                border-bottom: none;
            }
            
            .conversion-expression {
                color: var(--text-dark);
            }
            
            .conversion-time {
                color: var(--text-light);
                font-size: 0.6rem;
            }
        `;
        document.head.appendChild(styles);
    }

    updateQuickConversions() {
        const quickConversions = document.getElementById('quickConversions');
        if (!quickConversions || !this.currency.rates) return;

        const popularPairs = [
            { from: 'EUR', to: 'USD' },
            { from: 'EUR', to: 'CHF' },
            { from: 'EUR', to: 'GBP' },
            { from: 'USD', to: 'EUR' }
        ];

        quickConversions.innerHTML = popularPairs.map(pair => {
            const rate = pair.from === 'EUR' ? 
                this.currency.rates[pair.to] : 
                1 / this.currency.rates[pair.from];
            
            return `
                <div class="quick-conversion" onclick="widgetsManager.useQuickConversion('${pair.from}', '${pair.to}', ${rate})">
                    <div class="quick-conversion-pair">${pair.from} → ${pair.to}</div>
                    <div class="quick-conversion-rate">1 = ${rate ? rate.toFixed(4) : 'N/A'}</div>
                </div>
            `;
        }).join('');
    }

    useQuickConversion(from, to, rate) {
        document.getElementById('fromCurrency').value = from;
        document.getElementById('toCurrency').value = to;
        document.getElementById('currencyAmount').value = '1';
        
        const result = 1 * rate;
        document.getElementById('conversionResult').innerHTML = `
            <strong>1 ${from} = ${result.toFixed(4)} ${to}</strong>
        `;

        this.addToConversionHistory(1, from, to, result);
    }

    addCurrencyConverterEvents() {
        const convertBtn = document.createElement('button');
        convertBtn.textContent = 'Convertir';
        convertBtn.className = 'btn btn-primary';
        convertBtn.style.cssText = 'width: 100%; margin-top: 1rem;';
        
        const converterCard = document.querySelector('#widgets .card:has(#currencyAmount)');
        const toCurrencySelect = document.getElementById('toCurrency');
        
        if (converterCard && toCurrencySelect) {
            toCurrencySelect.insertAdjacentElement('afterend', convertBtn);
            
            convertBtn.addEventListener('click', () => {
                this.performCurrencyConversion();
            });

            // Auto-convert on input change
            ['currencyAmount', 'fromCurrency', 'toCurrency'].forEach(id => {
                const element = document.getElementById(id);
                if (element) {
                    element.addEventListener('change', () => {
                        this.performCurrencyConversion();
                    });
                }
            });
        }
    }

    performCurrencyConversion() {
        const amount = parseFloat(document.getElementById('currencyAmount').value);
        const from = document.getElementById('fromCurrency').value;
        const to = document.getElementById('toCurrency').value;
        
        if (!amount || amount <= 0) {
            document.getElementById('conversionResult').textContent = 'Veuillez entrer un montant valide';
            return;
        }

        if (!this.currency.rates) {
            document.getElementById('conversionResult').textContent = 'Taux de change non disponibles';
            return;
        }

        let result;
        if (from === 'EUR') {
            result = amount * (this.currency.rates[to] || 1);
        } else if (to === 'EUR') {
            result = amount / (this.currency.rates[from] || 1);
        } else {
            // Convert through EUR
            const toEur = amount / (this.currency.rates[from] || 1);
            result = toEur * (this.currency.rates[to] || 1);
        }

        document.getElementById('conversionResult').innerHTML = `
            <strong>${amount} ${from} = ${result.toFixed(4)} ${to}</strong>
            <br><small>Taux: 1 ${from} = ${(result/amount).toFixed(6)} ${to}</small>
        `;

        this.addToConversionHistory(amount, from, to, result);
    }

    addToConversionHistory(amount, from, to, result) {
        const historyList = document.getElementById('conversionHistoryList');
        if (!historyList) return;

        // Remove "no history" message
        const noHistory = historyList.querySelector('.no-history');
        if (noHistory) {
            noHistory.remove();
        }

        const historyItem = document.createElement('div');
        historyItem.className = 'conversion-history-item';
        historyItem.innerHTML = `
            <div class="conversion-expression">${amount} ${from} → ${result.toFixed(2)} ${to}</div>
            <div class="conversion-time">${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</div>
        `;

        historyItem.onclick = () => {
            document.getElementById('currencyAmount').value = amount;
            document.getElementById('fromCurrency').value = from;
            document.getElementById('toCurrency').value = to;
            this.performCurrencyConversion();
        };

        historyList.insertBefore(historyItem, historyList.firstChild);

        // Keep only last 5 items
        while (historyList.children.length > 5) {
            historyList.removeChild(historyList.lastChild);
        }
    }

    setupAgenda() {
        this.createAgendaWidget();
        this.loadAgendaEvents();
    }

    createAgendaWidget() {
        const widgetsContainer = document.querySelector('#widgets');
        if (!widgetsContainer || document.querySelector('.agenda-widget')) return;

        const agendaCard = document.createElement('div');
        agendaCard.className = 'card agenda-widget';
        agendaCard.innerHTML = `
            <h2><i class="fas fa-calendar-alt"></i> Agenda</h2>
            <div class="agenda-header">
                <button class="nav-btn" id="prevAgendaMonth">
                    <i class="fas fa-chevron-left"></i>
                </button>
                <h3 id="agendaCurrentMonth">${this.formatAgendaMonth()}</h3>
                <button class="nav-btn" id="nextAgendaMonth">
                    <i class="fas fa-chevron-right"></i>
                </button>
            </div>
            <div class="mini-calendar" id="miniCalendar">
                <!-- Calendar will be populated here -->
            </div>
            <div class="upcoming-events">
                <h4><i class="fas fa-clock"></i> Prochains événements</h4>
                <div class="events-list" id="upcomingEventsList">
                    <!-- Events will be populated here -->
                </div>
            </div>
            <button class="btn btn-primary btn-sm" onclick="widgetsManager.addQuickEvent()">
                <i class="fas fa-plus"></i> Nouvel événement
            </button>
        `;

        // Insert agenda widget
        const existingCards = widgetsContainer.querySelectorAll('.card');
        if (existingCards.length > 0) {
            existingCards[existingCards.length - 1].insertAdjacentElement('afterend', agendaCard);
        } else {
            widgetsContainer.appendChild(agendaCard);
        }

        this.setupAgendaEvents();
        this.renderMiniCalendar();
        this.updateUpcomingEvents();
        this.addAgendaStyles();
    }

    addAgendaStyles() {
        if (document.querySelector('#agenda-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'agenda-styles';
        styles.textContent = `
            .agenda-widget {
                min-width: 300px;
            }
            
            .agenda-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 1rem;
            }
            
            .agenda-header h3 {
                margin: 0;
                font-size: 1rem;
                color: var(--text-dark);
            }
            
            .mini-calendar {
                display: grid;
                grid-template-columns: repeat(7, 1fr);
                gap: 2px;
                margin-bottom: 1rem;
                font-size: 0.75rem;
            }
            
            .mini-day {
                aspect-ratio: 1;
                display: flex;
                align-items: center;
                justify-content: center;
                background: var(--bg-light);
                cursor: pointer;
                transition: var(--transition);
                position: relative;
            }
            
            .mini-day.header {
                background: var(--primary);
                color: white;
                font-weight: 600;
                cursor: default;
            }
            
            .mini-day.today {
                background: var(--primary);
                color: white;
                font-weight: 600;
            }
            
            .mini-day.other-month {
                opacity: 0.3;
            }
            
            .mini-day.has-event::after {
                content: '';
                position: absolute;
                bottom: 2px;
                right: 2px;
                width: 4px;
                height: 4px;
                background: var(--warning);
                border-radius: 50%;
            }
            
            .mini-day:hover:not(.header) {
                background: var(--primary);
                color: white;
            }
            
            .upcoming-events {
                margin-bottom: 1rem;
            }
            
            .upcoming-events h4 {
                margin: 0 0 0.5rem 0;
                color: var(--text-dark);
                font-size: 0.875rem;
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }
            
            .events-list {
                max-height: 150px;
                overflow-y: auto;
            }
            
            .event-item {
                padding: 0.5rem;
                border-left: 3px solid var(--primary);
                background: var(--bg-light);
                margin-bottom: 0.5rem;
                border-radius: 0 4px 4px 0;
                font-size: 0.75rem;
            }
            
            .event-title {
                font-weight: 600;
                color: var(--text-dark);
                margin-bottom: 0.25rem;
            }
            
            .event-time {
                color: var(--text-light);
            }
            
            .no-events {
                text-align: center;
                color: var(--text-light);
                padding: 1rem;
                font-style: italic;
                font-size: 0.875rem;
            }
        `;
        document.head.appendChild(styles);
    }

    setupAgendaEvents() {
        document.getElementById('prevAgendaMonth')?.addEventListener('click', () => {
            this.agenda.currentDate.setMonth(this.agenda.currentDate.getMonth() - 1);
            this.updateAgendaDisplay();
        });

        document.getElementById('nextAgendaMonth')?.addEventListener('click', () => {
            this.agenda.currentDate.setMonth(this.agenda.currentDate.getMonth() + 1);
            this.updateAgendaDisplay();
        });
    }

    formatAgendaMonth() {
        return this.agenda.currentDate.toLocaleDateString('fr-FR', { 
            year: 'numeric', 
            month: 'long' 
        });
    }

    updateAgendaDisplay() {
        document.getElementById('agendaCurrentMonth').textContent = this.formatAgendaMonth();
        this.renderMiniCalendar();
        this.updateUpcomingEvents();
    }

    renderMiniCalendar() {
        const calendar = document.getElementById('miniCalendar');
        if (!calendar) return;

        calendar.innerHTML = '';

        // Add day headers
        const dayHeaders = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
        dayHeaders.forEach(day => {
            const dayElement = document.createElement('div');
            dayElement.className = 'mini-day header';
            dayElement.textContent = day;
            calendar.appendChild(dayElement);
        });

        // Add calendar days
        const days = this.getAgendaCalendarDays();
        days.forEach(dayInfo => {
            const dayElement = document.createElement('div');
            dayElement.className = `mini-day ${dayInfo.classes.join(' ')}`;
            dayElement.textContent = dayInfo.date.getDate();
            
            if (dayInfo.hasEvents) {
                dayElement.classList.add('has-event');
            }

            dayElement.onclick = () => {
                this.showDayEvents(dayInfo.date);
            };

            calendar.appendChild(dayElement);
        });
    }

    getAgendaCalendarDays() {
        const year = this.agenda.currentDate.getFullYear();
        const month = this.agenda.currentDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const today = new Date();

        // Start from Monday of the week containing the first day
        const startDate = new Date(firstDay);
        startDate.setDate(firstDay.getDate() - (firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1));

        const days = [];
        const currentDate = new Date(startDate);

        while (days.length < 42) { // 6 weeks
            const isCurrentMonth = currentDate.getMonth() === month;
            const isToday = currentDate.toDateString() === today.toDateString();
            const hasEvents = this.agenda.events.some(event => 
                new Date(event.date).toDateString() === currentDate.toDateString()
            );

            const classes = [];
            if (!isCurrentMonth) classes.push('other-month');
            if (isToday) classes.push('today');

            days.push({
                date: new Date(currentDate),
                classes,
                hasEvents
            });

            currentDate.setDate(currentDate.getDate() + 1);
        }

        return days;
    }

    loadAgendaEvents() {
        // Load demo events or from storage
        const stored = localStorage.getItem('sfm_agenda_events');
        if (stored) {
            this.agenda.events = JSON.parse(stored);
        } else {
            // Demo events
            const today = new Date();
            this.agenda.events = [
                {
                    id: '1',
                    title: 'Réunion équipe',
                    date: new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString(),
                    time: '14:00',
                    type: 'meeting'
                },
                {
                    id: '2',
                    title: 'Paiement tontine',
                    date: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(),
                    time: '09:00',
                    type: 'payment'
                },
                {
                    id: '3',
                    title: 'Départ voyage Kenya',
                    date: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                    time: '06:00',
                    type: 'travel'
                }
            ];
            this.saveAgendaEvents();
        }
    }

    saveAgendaEvents() {
        localStorage.setItem('sfm_agenda_events', JSON.stringify(this.agenda.events));
    }

    updateUpcomingEvents() {
        const eventsList = document.getElementById('upcomingEventsList');
        if (!eventsList) return;

        const upcomingEvents = this.agenda.events
            .filter(event => new Date(event.date) >= new Date())
            .sort((a, b) => new Date(a.date) - new Date(b.date))
            .slice(0, 3);

        if (upcomingEvents.length === 0) {
            eventsList.innerHTML = '<div class="no-events">Aucun événement à venir</div>';
            return;
        }

        eventsList.innerHTML = upcomingEvents.map(event => `
            <div class="event-item">
                <div class="event-title">${event.title}</div>
                <div class="event-time">
                    ${new Date(event.date).toLocaleDateString('fr-FR')} à ${event.time}
                </div>
            </div>
        `).join('');
    }

    addQuickEvent() {
        const title = prompt('Titre de l\'événement:');
        if (!title) return;

        const date = prompt('Date (YYYY-MM-DD):');
        if (!date) return;

        const time = prompt('Heure (HH:MM):', '09:00');
        if (!time) return;

        const event = {
            id: Date.now().toString(),
            title: title.trim(),
            date: new Date(date).toISOString(),
            time,
            type: 'personal'
        };

        this.agenda.events.push(event);
        this.saveAgendaEvents();
        this.updateAgendaDisplay();

        if (window.appState) {
            window.appState.showNotification('Événement ajouté', 'success');
        }
    }

    showDayEvents(date) {
        const dayEvents = this.agenda.events.filter(event => 
            new Date(event.date).toDateString() === date.toDateString()
        );

        if (dayEvents.length === 0) {
            if (confirm(`Aucun événement le ${date.toLocaleDateString('fr-FR')}. Voulez-vous en ajouter un ?`)) {
                this.addQuickEvent();
            }
            return;
        }

        const eventsList = dayEvents.map(event => 
            `• ${event.time} - ${event.title}`
        ).join('\n');

        alert(`Événements du ${date.toLocaleDateString('fr-FR')}:\n\n${eventsList}`);
    }

    setupQuickTools() {
        this.createQuickToolsWidget();
    }

    createQuickToolsWidget() {
        const widgetsContainer = document.querySelector('#widgets');
        if (!widgetsContainer || document.querySelector('.quick-tools-widget')) return;

        const quickToolsCard = document.createElement('div');
        quickToolsCard.className = 'card quick-tools-widget';
        quickToolsCard.innerHTML = `
            <h2><i class="fas fa-tools"></i> Outils Rapides</h2>
            <div class="tools-grid">
                <button class="tool-btn" onclick="widgetsManager.openPasswordGenerator()">
                    <i class="fas fa-key"></i>
                    <span>Générateur de mots de passe</span>
                </button>
                <button class="tool-btn" onclick="widgetsManager.openQRGenerator()">
                    <i class="fas fa-qrcode"></i>
                    <span>Générateur QR Code</span>
                </button>
                <button class="tool-btn" onclick="widgetsManager.openColorPicker()">
                    <i class="fas fa-palette"></i>
                    <span>Sélecteur de couleurs</span>
                </button>
                <button class="tool-btn" onclick="widgetsManager.openUnitConverter()">
                    <i class="fas fa-exchange-alt"></i>
                    <span>Convertisseur d'unités</span>
                </button>
                <button class="tool-btn" onclick="widgetsManager.openTextTools()">
                    <i class="fas fa-font"></i>
                    <span>Outils texte</span>
                </button>
                <button class="tool-btn" onclick="widgetsManager.openTimezoneConverter()">
                    <i class="fas fa-globe"></i>
                    <span>Fuseaux horaires</span>
                </button>
            </div>
        `;

        widgetsContainer.appendChild(quickToolsCard);
        this.addQuickToolsStyles();
    }

    addQuickToolsStyles() {
        if (document.querySelector('#quick-tools-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'quick-tools-styles';
        styles.textContent = `
            .tools-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                gap: 1rem;
            }
            
            .tool-btn {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 0.5rem;
                padding: 1rem;
                border: 2px solid var(--border);
                background: var(--bg-white);
                color: var(--text-dark);
                border-radius: 8px;
                cursor: pointer;
                transition: var(--transition);
                text-decoration: none;
            }
            
            .tool-btn:hover {
                border-color: var(--primary);
                background: var(--bg-light);
                transform: translateY(-2px);
            }
            
            .tool-btn i {
                font-size: 1.5rem;
                color: var(--primary);
            }
            
            .tool-btn span {
                font-weight: 600;
                text-align: center;
                font-size: 0.875rem;
            }
        `;
        document.head.appendChild(styles);
    }

    // Tool implementations
    openPasswordGenerator() {
        const modal = this.createToolModal('Générateur de Mots de Passe', `
            <div class="form-group">
                <label>Longueur du mot de passe</label>
                <input type="range" id="passwordLength" min="8" max="50" value="12" class="form-input">
                <span id="lengthDisplay">12</span>
            </div>
            <div class="form-group">
                <label>Options</label>
                <div class="checkbox-group">
                    <label><input type="checkbox" id="includeUppercase" checked> Majuscules (A-Z)</label>
                    <label><input type="checkbox" id="includeLowercase" checked> Minuscules (a-z)</label>
                    <label><input type="checkbox" id="includeNumbers" checked> Chiffres (0-9)</label>
                    <label><input type="checkbox" id="includeSymbols"> Symboles (!@#$%)</label>
                </div>
            </div>
            <div class="form-group">
                <label>Mot de passe généré</label>
                <div style="display: flex; gap: 0.5rem;">
                    <input type="text" id="generatedPassword" class="form-input" readonly>
                    <button class="btn" onclick="widgetsManager.copyToClipboard('generatedPassword')">
                        <i class="fas fa-copy"></i>
                    </button>
                </div>
            </div>
            <button class="btn btn-primary" onclick="widgetsManager.generatePassword()">Générer</button>
        `);

        // Event listeners
        document.getElementById('passwordLength').oninput = (e) => {
            document.getElementById('lengthDisplay').textContent = e.target.value;
        };

        // Generate initial password
        this.generatePassword();
    }

    generatePassword() {
        const length = parseInt(document.getElementById('passwordLength').value);
        const includeUppercase = document.getElementById('includeUppercase').checked;
        const includeLowercase = document.getElementById('includeLowercase').checked;
        const includeNumbers = document.getElementById('includeNumbers').checked;
        const includeSymbols = document.getElementById('includeSymbols').checked;

        let charset = '';
        if (includeUppercase) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        if (includeLowercase) charset += 'abcdefghijklmnopqrstuvwxyz';
        if (includeNumbers) charset += '0123456789';
        if (includeSymbols) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';

        if (charset === '') {
            document.getElementById('generatedPassword').value = 'Sélectionnez au moins une option';
            return;
        }

        let password = '';
        for (let i = 0; i < length; i++) {
            password += charset.charAt(Math.floor(Math.random() * charset.length));
        }

        document.getElementById('generatedPassword').value = password;
    }

    openQRGenerator() {
        const modal = this.createToolModal('Générateur QR Code', `
            <div class="form-group">
                <label>Texte ou URL</label>
                <textarea id="qrText" class="form-input" rows="3" placeholder="Entrez le texte ou l'URL..."></textarea>
            </div>
            <div class="form-group">
                <label>Taille</label>
                <select id="qrSize" class="form-input">
                    <option value="200">Petite (200x200)</option>
                    <option value="300" selected>Moyenne (300x300)</option>
                    <option value="400">Grande (400x400)</option>
                </select>
            </div>
            <button class="btn btn-primary" onclick="widgetsManager.generateQRCode()">Générer QR Code</button>
            <div id="qrCodeResult" style="text-align: center; margin-top: 1rem;"></div>
        `);
    }

    generateQRCode() {
        const text = document.getElementById('qrText').value.trim();
        const size = document.getElementById('qrSize').value;
        
        if (!text) {
            document.getElementById('qrCodeResult').innerHTML = '<p style="color: var(--error);">Veuillez entrer du texte</p>';
            return;
        }

        // Using QR Server API (free service)
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(text)}`;
        
        document.getElementById('qrCodeResult').innerHTML = `
            <img src="${qrUrl}" alt="QR Code" style="max-width: 100%; border: 1px solid var(--border); border-radius: 8px;">
            <br><br>
            <a href="${qrUrl}" download="qrcode.png" class="btn">
                <i class="fas fa-download"></i> Télécharger
            </a>
        `;
    }

    openColorPicker() {
        const modal = this.createToolModal('Sélecteur de Couleurs', `
            <div class="color-picker-container">
                <div class="form-group">
                    <label>Couleur</label>
                    <input type="color" id="colorInput" class="form-input" value="#2563eb">
                </div>
                <div class="color-info">
                    <div class="color-preview" id="colorPreview"></div>
                    <div class="color-values">
                        <div class="form-group">
                            <label>HEX</label>
                            <input type="text" id="hexValue" class="form-input" readonly>
                        </div>
                        <div class="form-group">
                            <label>RGB</label>
                            <input type="text" id="rgbValue" class="form-input" readonly>
                        </div>
                        <div class="form-group">
                            <label>HSL</label>
                            <input type="text" id="hslValue" class="form-input" readonly>
                        </div>
                    </div>
                </div>
                <div class="color-palette">
                    <h4>Couleurs suggérées</h4>
                    <div class="palette-colors" id="paletteColors"></div>
                </div>
            </div>
        `);

        this.setupColorPicker();
    }

    setupColorPicker() {
        const colorInput = document.getElementById('colorInput');
        const updateColorInfo = (color) => {
            const rgb = this.hexToRgb(color);
            const hsl = this.rgbToHsl(rgb.r, rgb.g, rgb.b);
            
            document.getElementById('colorPreview').style.backgroundColor = color;
            document.getElementById('hexValue').value = color.toUpperCase();
            document.getElementById('rgbValue').value = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
            document.getElementById('hslValue').value = `hsl(${Math.round(hsl.h)}, ${Math.round(hsl.s)}%, ${Math.round(hsl.l)}%)`;
        };

        colorInput.addEventListener('input', (e) => {
            updateColorInfo(e.target.value);
        });

        // Create color palette
        const colors = ['#2563eb', '#059669', '#d97706', '#dc2626', '#8b5cf6', '#0ea5e9', '#84cc16', '#f59e0b'];
        const paletteColors = document.getElementById('paletteColors');
        paletteColors.innerHTML = colors.map(color => `
            <div class="palette-color" style="background-color: ${color};" onclick="document.getElementById('colorInput').value='${color}'; document.getElementById('colorInput').dispatchEvent(new Event('input'));"></div>
        `).join('');

        // Initial update
        updateColorInfo(colorInput.value);
    }

    openUnitConverter() {
        const modal = this.createToolModal('Convertisseur d\'Unités', `
            <div class="form-group">
                <label>Type de conversion</label>
                <select id="conversionType" class="form-input">
                    <option value="length">Longueur</option>
                    <option value="weight">Poids</option>
                    <option value="temperature">Température</option>
                    <option value="volume">Volume</option>
                </select>
            </div>
            <div class="conversion-row">
                <div class="form-group">
                    <label>De</label>
                    <input type="number" id="fromValue" class="form-input" placeholder="0">
                    <select id="fromUnit" class="form-input"></select>
                </div>
                <div class="conversion-arrow">
                    <i class="fas fa-arrow-right"></i>
                </div>
                <div class="form-group">
                    <label>Vers</label>
                    <input type="number" id="toValue" class="form-input" readonly>
                    <select id="toUnit" class="form-input"></select>
                </div>
            </div>
        `);

        this.setupUnitConverter();
    }

    setupUnitConverter() {
        const units = {
            length: {
                'm': { name: 'Mètres', factor: 1 },
                'cm': { name: 'Centimètres', factor: 0.01 },
                'mm': { name: 'Millimètres', factor: 0.001 },
                'km': { name: 'Kilomètres', factor: 1000 },
                'ft': { name: 'Pieds', factor: 0.3048 },
                'in': { name: 'Pouces', factor: 0.0254 }
            },
            weight: {
                'kg': { name: 'Kilogrammes', factor: 1 },
                'g': { name: 'Grammes', factor: 0.001 },
                'lb': { name: 'Livres', factor: 0.453592 },
                'oz': { name: 'Onces', factor: 0.0283495 }
            },
            temperature: {
                'c': { name: 'Celsius' },
                'f': { name: 'Fahrenheit' },
                'k': { name: 'Kelvin' }
            },
            volume: {
                'l': { name: 'Litres', factor: 1 },
                'ml': { name: 'Millilitres', factor: 0.001 },
                'gal': { name: 'Gallons', factor: 3.78541 },
                'qt': { name: 'Quarts', factor: 0.946353 }
            }
        };

        const updateUnits = () => {
            const type = document.getElementById('conversionType').value;
            const fromUnit = document.getElementById('fromUnit');
            const toUnit = document.getElementById('toUnit');
            
            fromUnit.innerHTML = '';
            toUnit.innerHTML = '';
            
            Object.entries(units[type]).forEach(([key, unit]) => {
                fromUnit.add(new Option(unit.name, key));
                toUnit.add(new Option(unit.name, key));
            });
            
            this.performUnitConversion();
        };

        document.getElementById('conversionType').addEventListener('change', updateUnits);
        document.getElementById('fromValue').addEventListener('input', () => this.performUnitConversion());
        document.getElementById('fromUnit').addEventListener('change', () => this.performUnitConversion());
        document.getElementById('toUnit').addEventListener('change', () => this.performUnitConversion());

        updateUnits();
    }

    performUnitConversion() {
        const value = parseFloat(document.getElementById('fromValue').value) || 0;
        const type = document.getElementById('conversionType').value;
        const fromUnit = document.getElementById('fromUnit').value;
        const toUnit = document.getElementById('toUnit').value;

        let result;

        if (type === 'temperature') {
            result = this.convertTemperature(value, fromUnit, toUnit);
        } else {
            const units = {
                length: {
                    'm': 1, 'cm': 0.01, 'mm': 0.001, 'km': 1000,
                    'ft': 0.3048, 'in': 0.0254
                },
                weight: {
                    'kg': 1, 'g': 0.001, 'lb': 0.453592, 'oz': 0.0283495
                },
                volume: {
                    'l': 1, 'ml': 0.001, 'gal': 3.78541, 'qt': 0.946353
                }
            };

            const fromFactor = units[type][fromUnit];
            const toFactor = units[type][toUnit];
            result = (value * fromFactor) / toFactor;
        }

        document.getElementById('toValue').value = result.toFixed(6);
    }

    convertTemperature(value, from, to) {
        // Convert to Celsius first
        let celsius;
        switch (from) {
            case 'c': celsius = value; break;
            case 'f': celsius = (value - 32) * 5/9; break;
            case 'k': celsius = value - 273.15; break;
        }

        // Convert from Celsius to target
        switch (to) {
            case 'c': return celsius;
            case 'f': return celsius * 9/5 + 32;
            case 'k': return celsius + 273.15;
        }
    }

    openTextTools() {
        const modal = this.createToolModal('Outils Texte', `
            <div class="form-group">
                <label>Texte</label>
                <textarea id="textInput" class="form-input" rows="5" placeholder="Entrez votre texte..."></textarea>
            </div>
            <div class="text-stats">
                <div class="stat">Caractères: <span id="charCount">0</span></div>
                <div class="stat">Mots: <span id="wordCount">0</span></div>
                <div class="stat">Lignes: <span id="lineCount">0</span></div>
            </div>
            <div class="text-tools">
                <button class="btn" onclick="widgetsManager.transformText('uppercase')">MAJUSCULES</button>
                <button class="btn" onclick="widgetsManager.transformText('lowercase')">minuscules</button>
                <button class="btn" onclick="widgetsManager.transformText('capitalize')">Capitaliser</button>
                <button class="btn" onclick="widgetsManager.transformText('reverse')">Inverser</button>
            </div>
        `);

        document.getElementById('textInput').addEventListener('input', this.updateTextStats.bind(this));
    }

    updateTextStats() {
        const text = document.getElementById('textInput').value;
        document.getElementById('charCount').textContent = text.length;
        document.getElementById('wordCount').textContent = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
        document.getElementById('lineCount').textContent = text.split('\n').length;
    }

    transformText(type) {
        const textInput = document.getElementById('textInput');
        let text = textInput.value;

        switch (type) {
            case 'uppercase':
                text = text.toUpperCase();
                break;
            case 'lowercase':
                text = text.toLowerCase();
                break;
            case 'capitalize':
                text = text.replace(/\b\w/g, l => l.toUpperCase());
                break;
            case 'reverse':
                text = text.split('').reverse().join('');
                break;
        }

        textInput.value = text;
        this.updateTextStats();
    }

    openTimezoneConverter() {
        const modal = this.createToolModal('Convertisseur de Fuseaux Horaires', `
            <div class="timezone-converter">
                <div class="form-group">
                    <label>Heure locale</label>
                    <input type="datetime-local" id="localTime" class="form-input">
                </div>
                <div class="timezones-list" id="timezonesList">
                    <!-- Timezones will be populated here -->
                </div>
            </div>
        `);

        this.setupTimezoneConverter();
    }

    setupTimezoneConverter() {
        const timezones = [
            { name: 'Paris', zone: 'Europe/Paris' },
            { name: 'New York', zone: 'America/New_York' },
            { name: 'London', zone: 'Europe/London' },
            { name: 'Tokyo', zone: 'Asia/Tokyo' },
            { name: 'Sydney', zone: 'Australia/Sydney' },
            { name: 'Los Angeles', zone: 'America/Los_Angeles' }
        ];

        const localTimeInput = document.getElementById('localTime');
        const timezonesList = document.getElementById('timezonesList');

        // Set current time
        const now = new Date();
        localTimeInput.value = now.toISOString().slice(0, 16);

        const updateTimezones = () => {
            const selectedTime = new Date(localTimeInput.value);
            
            timezonesList.innerHTML = timezones.map(tz => {
                const localTime = new Intl.DateTimeFormat('fr-FR', {
                    timeZone: tz.zone,
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                }).format(selectedTime);

                return `
                    <div class="timezone-item">
                        <span class="timezone-name">${tz.name}</span>
                        <span class="timezone-time">${localTime}</span>
                    </div>
                `;
            }).join('');
        };

        localTimeInput.addEventListener('change', updateTimezones);
        updateTimezones();
    }

    // Utility methods for tools
    createToolModal(title, content) {
        const modal = document.createElement('div');
        modal.className = 'tool-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>${title}</h2>
                    <button class="close-modal">&times;</button>
                </div>
                <div class="modal-body">
                    ${content}
                </div>
                <div class="modal-footer">
                    <button class="btn" onclick="this.closest('.tool-modal').remove()">Fermer</button>
                </div>
            </div>
        `;

        this.addModalStyles(modal);
        document.body.appendChild(modal);

        // Close modal events
        modal.querySelector('.close-modal').onclick = () => modal.remove();
        modal.onclick = (e) => {
            if (e.target === modal) modal.remove();
        };

        this.addToolModalStyles();
        return modal;
    }

    addToolModalStyles() {
        if (document.querySelector('#tool-modal-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'tool-modal-styles';
        styles.textContent = `
            .color-picker-container {
                display: grid;
                gap: 1rem;
            }
            
            .color-info {
                display: grid;
                grid-template-columns: 100px 1fr;
                gap: 1rem;
                align-items: start;
            }
            
            .color-preview {
                width: 100px;
                height: 100px;
                border-radius: 8px;
                border: 1px solid var(--border);
            }
            
            .color-values {
                display: grid;
                gap: 0.5rem;
            }
            
            .color-palette h4 {
                margin-bottom: 0.5rem;
            }
            
            .palette-colors {
                display: flex;
                gap: 0.5rem;
                flex-wrap: wrap;
            }
            
            .palette-color {
                width: 40px;
                height: 40px;
                border-radius: 8px;
                cursor: pointer;
                border: 2px solid transparent;
                transition: var(--transition);
            }
            
            .palette-color:hover {
                border-color: var(--primary);
                transform: scale(1.1);
            }
            
            .conversion-row {
                display: grid;
                grid-template-columns: 1fr auto 1fr;
                gap: 1rem;
                align-items: end;
            }
            
            .conversion-arrow {
                padding: 1rem 0;
                text-align: center;
                color: var(--primary);
                font-size: 1.2rem;
            }
            
            .text-stats {
                display: flex;
                gap: 1rem;
                margin: 1rem 0;
                padding: 1rem;
                background: var(--bg-light);
                border-radius: 8px;
            }
            
            .text-stats .stat {
                font-weight: 600;
                color: var(--text-dark);
            }
            
            .text-tools {
                display: flex;
                gap: 0.5rem;
                flex-wrap: wrap;
            }
            
            .timezone-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 1rem;
                border: 1px solid var(--border);
                border-radius: 8px;
                margin-bottom: 0.5rem;
            }
            
            .timezone-name {
                font-weight: 600;
                color: var(--text-dark);
            }
            
            .timezone-time {
                font-family: monospace;
                background: var(--bg-light);
                padding: 0.25rem 0.5rem;
                border-radius: 4px;
            }
            
            .checkbox-group {
                display: grid;
                gap: 0.5rem;
            }
            
            .checkbox-group label {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                font-weight: normal;
                cursor: pointer;
            }
        `;
        document.head.appendChild(styles);
    }

    copyToClipboard(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.select();
            document.execCommand('copy');
            
            if (window.appState) {
                window.appState.showNotification('Copié dans le presse-papiers', 'success');
            }
        }
    }

    // Calculator functions (global)
    updateCalculatorDisplay() {
        const display = document.getElementById('calcDisplay');
        if (display) {
            display.textContent = this.calculator.display;
        }
    }

    clearCalculator() {
        this.calculator.display = '0';
        this.calculator.operator = null;
        this.calculator.prevValue = null;
        this.calculator.waitingForValue = false;
        this.updateCalculatorDisplay();
    }

    clearCalculatorHistory() {
        this.calculator.history = [];
        const historyList = document.getElementById('calcHistoryList');
        if (historyList) {
            historyList.innerHTML = '<div class="no-history">Aucun calcul effectué</div>';
        }
    }

    appendToCalculator(value) {
        if (['+', '-', '*', '/'].includes(value)) {
            if (this.calculator.operator && !this.calculator.waitingForValue) {
                this.calculateResult();
            }
            this.calculator.prevValue = parseFloat(this.calculator.display);
            this.calculator.operator = value;
            this.calculator.waitingForValue = true;
        } else {
            if (this.calculator.waitingForValue) {
                this.calculator.display = value;
                this.calculator.waitingForValue = false;
            } else {
                this.calculator.display = this.calculator.display === '0' ? value : this.calculator.display + value;
            }
        }
        this.updateCalculatorDisplay();
    }

    deleteLast() {
        this.calculator.display = this.calculator.display.length > 1 ? 
            this.calculator.display.slice(0, -1) : '0';
        this.updateCalculatorDisplay();
    }

    calculateResult() {
        if (this.calculator.operator && this.calculator.prevValue !== null && !this.calculator.waitingForValue) {
            const current = parseFloat(this.calculator.display);
            const expression = `${this.calculator.prevValue} ${this.calculator.operator} ${current}`;
            let result;
            
            switch (this.calculator.operator) {
                case '+': result = this.calculator.prevValue + current; break;
                case '-': result = this.calculator.prevValue - current; break;
                case '*': result = this.calculator.prevValue * current; break;
                case '/': result = current !== 0 ? this.calculator.prevValue / current : 0; break;
                default: return;
            }
            
            // Add to history
            this.calculator.history.unshift({
                expression,
                result,
                timestamp: new Date()
            });

            // Keep only last 10 calculations
            if (this.calculator.history.length > 10) {
                this.calculator.history = this.calculator.history.slice(0, 10);
            }

            this.calculator.display = result.toString();
            this.calculator.operator = null;
            this.calculator.prevValue = null;
            this.calculator.waitingForValue = false;
            
            this.updateCalculatorDisplay();
            this.updateCalculatorHistory();
        }
    }

    updateCalculatorHistory() {
        const historyList = document.getElementById('calcHistoryList');
        if (!historyList) return;

        if (this.calculator.history.length === 0) {
            historyList.innerHTML = '<div class="no-history">Aucun calcul effectué</div>';
            return;
        }

        historyList.innerHTML = this.calculator.history.map(item => `
            <div class="history-item" onclick="widgetsManager.useHistoryResult('${item.result}')">
                <span class="history-expression">${item.expression}</span>
                <span class="history-result">${item.result}</span>
            </div>
        `).join('');
    }

    useHistoryResult(result) {
        this.calculator.display = result;
        this.updateCalculatorDisplay();
    }

    // Color utility functions
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    rgbToHsl(r, g, b) {
        r /= 255;
        g /= 255;
        b /= 255;
        
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;

        if (max === min) {
            h = s = 0;
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }

        return {
            h: h * 360,
            s: s * 100,
            l: l * 100
        };
    }

    loadWidgetData() {
        // Load saved data for widgets
        const savedData = localStorage.getItem('sfm_widgets_data');
        if (savedData) {
            try {
                const data = JSON.parse(savedData);
                if (data.calculator) {
                    this.calculator.history = data.calculator.history || [];
                    this.updateCalculatorHistory();
                }
            } catch (error) {
                console.warn('Error loading widget data:', error);
            }
        }
    }

    saveWidgetData() {
        const data = {
            calculator: {
                history: this.calculator.history
            },
            weather: {
                lastUpdate: this.weather.lastUpdate
            }
        };
        
        localStorage.setItem('sfm_widgets_data', JSON.stringify(data));
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
        this.refreshWeather();
        this.loadExchangeRates();
        
        if (window.appState) {
            window.appState.showNotification('Widgets actualisés', 'success');
        }
    }
}

// Global calculator functions (for HTML onclick attributes)
window.clearCalc = () => window.widgetsManager?.clearCalculator();
window.appendToCalc = (value) => window.widgetsManager?.appendToCalculator(value);
window.deleteLast = () => window.widgetsManager?.deleteLast();
window.calculateResult = () => window.widgetsManager?.calculateResult();

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('widgets')) {
        window.widgetsManager = new WidgetsManager();
        
        // Save widget data periodically
        setInterval(() => {
            if (window.widgetsManager) {
                window.widgetsManager.saveWidgetData();
            }
        }, 60000); // Every minute
    }
});

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WidgetsManager;
}/**
 * ====================================
 * SFM - Widgets Module
 * Utility widgets: Calculator, Weather, Currency, etc.
 * ====================================
 */

class WidgetsManager {
    constructor() {
        this.calculator = {
            display: '0',
            operator: null,
            prevValue: null,
            waitingForValue: false,
            history: []
        };
        this.weather = {
            location: 'Zurich, CH',
            data: null,
            lastUpdate: null
        };
        this.currency = {
            rates: {},
            lastUpdate: null,
            baseCurrency: 'EUR'
        };
        this.agenda = {
            events: [],
            currentDate: new Date()
        };
        this.init();
    }

    init() {
        this.setupCalculator();
        this.setupWeather();
        this.setupCurrencyConverter();
        this.setupAgenda();
        this.setupQuickTools();
        this.loadWidgetData();
    }

    setupCalculator() {
        const calcDisplay = document.getElementById('calcDisplay');
        if (!calcDisplay) return;

        // Enhanced calculator with history
        this.createCalculatorHistory();
        this.updateCalculatorDisplay();
    }

    createCalculatorHistory() {
        const calculatorCard = document.querySelector('#widgets .card:has(#calcDisplay)');
        if (!calculatorCard || calculatorCard.querySelector('.calc-history')) return;

        const historyContainer = document.createElement('div');
        historyContainer.className = 'calc-history';
        historyContainer.innerHTML = `
            <div class="calc-history-header">
                <h4><i class="fas fa-history"></i> Historique</h4>
                <button class="btn-clear-history" onclick="widgetsManager.clearCalculatorHistory()">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
            <div class="calc-history-list" id="calcHistoryList">
                <div class="no-history">Aucun calcul effectué</div>
            </div>
        `;

        const calculator = calculatorCard.querySelector('.calculator');
        calculator.insertAdjacentElement('afterend', historyContainer);

        this.addCalculatorStyles();
    }

    addCalculatorStyles() {
        if (document.querySelector('#calculator-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'calculator-styles';
        styles.textContent = `
            .calc-history {
                margin-top: 1rem;
                border-top: 1px solid var(--border);
                padding-top: 1rem;
            }
            
            .calc-history-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 0.5rem;
            }
            
            .calc-history-header h4 {
                margin: 0;
                color: var(--text-dark);
                font-size: 0.875rem;
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }
            
            .btn-clear-history {
                border: none;
                background: none;
                color: var(--text-light);
                cursor: pointer;
                padding: 0.25rem;
                border-radius: 4px;
                transition: var(--transition);
            }
            
            .btn-clear-history:hover {
                background: var(--error);
                color: white;
            }
            
            .calc-history-list {
                max-height: 150px;
                overflow-y: auto;
                font-size: 0.75rem;
            }
            
            .history-item {
                padding: 0.5rem;
                border-bottom: 1px solid var(--border);
                cursor: pointer;
                transition: var(--transition);
                display: flex;
                justify-content: space-between;
            }
            
            .history-item:hover {
                background: var(--bg-light);
            }
            
            .history-item:last-child {
                border-bottom: none;
            }
            
            .history-expression {
                color: var(--text-light);
            }
            
            .history-result {
                color: var(--primary);
                font-weight: 600;
            }
            
            .no-history {
                text-align: center;
                color: var(--text-light);
                padding: 1rem;
                font-style: italic;
            }
        `;
        document.head.appendChild(styles);
    }

    setupWeather() {
        this.initWeather();
        this.createWeatherWidget();
    }

    async initWeather() {
        try {
            // Use Open-Meteo API for weather data
            const response = await fetch(
                'https://api.open-meteo.com/v1/forecast?latitude=47.3769&longitude=8.5417&current_weather=true&hourly=temperature_2m,precipitation,weathercode&timezone=Europe/Zurich'
            );
            
            if (response.ok) {
                const data = await response.json();
                this.weather.data = this.processWeatherData(data);
                this.weather.lastUpdate = new Date();
                this.updateWeatherDisplay();
            } else {
                throw new Error('Weather API unavailable');
            }
        } catch (error) {
            console.warn('Weather API error:', error);
            // Fallback to simulated data
            this.weather.data = this.getSimulatedWeatherData();
            this.weather.lastUpdate = new Date();
            this.updateWeatherDisplay();
        }
    }

    processWeatherData(data) {
        const current = data.current_weather;
        const hourly = data.hourly;
        
        return {
            temperature: Math.round(current.temperature),
            windSpeed: Math.round(current.windspeed),
            windDirection: current.winddirection,
            weatherCode: current.weathercode,
            condition: this.getWeatherCondition(current.weathercode),
            icon: this.getWeatherIcon(current.weathercode),
            hourlyForecast: hourly.time.slice(0, 24).map((time, index) => ({
                time: new Date(time),
                temperature: Math.round(hourly.temperature_2m[index]),
                precipitation: hourly.precipitation[index] || 0,
                weatherCode: hourly.weathercode[index]
            }))
        };
    }

    getSimulatedWeatherData() {
        const conditions = [
            { condition: 'Ensoleillé', icon: 'fa-sun', temp: 22 },
            { condition: 'Partiellement nuageux', icon: 'fa-cloud-sun', temp: 18 },
            { condition: 'Nuageux', icon: 'fa-cloud', temp: 15 },
            { condition: 'Pluvieux', icon: 'fa-cloud-rain', temp: 12 }
        ];
        
        const selected = conditions[Math.floor(Math.random() * conditions.length)];
        
        return {
            temperature: selected.temp + Math.floor(Math.random() * 10) - 5,
            windSpeed: Math.floor(Math.random() * 20) + 5,
            windDirection: Math.floor(Math.random() * 360),
            condition: selected.condition,
            icon: selected.icon,
            hourlyForecast: Array.from({ length: 24 }, (_, i) => ({
                time: new Date(Date.now() + i * 60 * 60 * 1000),
                temperature: selected.temp + Math.floor(Math.random() * 6) - 3,
                precipitation: Math.random() * 2
            }))
        };
    }

    getWeatherCondition(code) {
        const conditions = {
            0: 'Ciel dégagé',
            1: 'Principalement dégagé',
            2: 'Partiellement nuageux',
            3: 'Couvert',
            45: 'Brouillard',
            48: 'Brouillard givrant',
            51: 'Bruine légère',
            53: 'Bruine modérée',
            55: 'Bruine forte',
            61: 'Pluie légère',
            63: 'Pluie modérée',
            65: 'Pluie forte',
            71: 'Neige légère',
            73: 'Neige modérée',
            75: 'Neige forte',
            95: 'Orage'
        };
        return conditions[code] || 'Conditions inconnues';
    }

    getWeatherIcon(code) {
        const icons = {
            0: 'fa-sun',
            1: 'fa-sun',
            2: 'fa-cloud-sun',
            3: 'fa-cloud',
            45: 'fa-smog',
            48: 'fa-smog',
            51: 'fa-cloud-drizzle',
            53: 'fa-cloud-drizzle',
            55: 'fa-cloud-drizzle',
            61: 'fa-cloud-rain',
            63: 'fa-cloud-rain',
            65: 'fa-cloud-showers-heavy',
            71: 'fa-snowflake',
            73: 'fa-snowflake',
            75: 'fa-snowflake',
            95: 'fa-bolt'
        };
        return icons[code] || 'fa-question';
    }

    createWeatherWidget() {
        const weatherWidget = document.querySelector('.weather-widget');
        if (!weatherWidget) return;

        // Add detailed weather info
        const detailedWeather = document.createElement('div');
        detailedWeather.className = 'detailed-weather';
        detailedWeather.innerHTML = `
            <div class="weather-details">
                <div class="weather-detail">
                    <i class="fas fa-wind"></i>
                    <span id="windInfo">Vent: -- km/h</span>
                </div>
                <div class="weather-detail">
                    <i class="fas fa-tint"></i>
                    <span id="humidityInfo">Humidité: --%</span>
                </div>
                <div class="weather-detail">
                    <i class="fas fa-clock"></i>
                    <span id="updateTime">Dernière MAJ: --</span>
                </div>
            </div>
            <div class="hourly-forecast" id="hourlyForecast">
                <!-- Hourly forecast will be populated here -->
            </div>
            <button class="btn btn-sm" id="refreshWeather" onclick="widgetsManager.refreshWeather()">
                <i class="fas fa-sync-alt"></i> Actualiser
            </button>
        `;

        weatherWidget.parentNode.appendChild(detailedWeather);
        this.addWeatherStyles();
    }

    addWeatherStyles() {
        if (document.querySelector('#weather-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'weather-styles';
        styles.textContent = `
            .detailed-weather {
                margin-top: 1rem;
                padding-top: 1rem;
                border-top: 1px solid rgba(255,255,255,0.2);
            }
            
            .weather-details {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 0.5rem;
                margin-bottom: 1rem;
                font-size: 0.875rem;
            }
            
            .weather-detail {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                color: rgba(255,255,255,0.9);
            }
            
            .hourly-forecast {
                display: flex;
                gap: 0.5rem;
                overflow-x: auto;
                padding: 0.5rem 0;
                margin-bottom: 1rem;
            }
            
            .hourly-item {
                min-width: 60px;
                text-align: center;
                background: rgba(255,255,255,0.1);
                border-radius: 8px;
                padding: 0.5rem;
                font-size: 0.75rem;
            }
            
            .hourly-time {
                margin-bottom: 0.25rem;
                opacity: 0.8;
            }
            
            .hourly-icon {
                margin: 0.25rem 0;
                font-size: 1.2rem;
            }
            
            .hourly-temp {
                font-weight: 600;
            }
            
            #refreshWeather {
                background: rgba(255,255,255,0.2);
                color: white;
                border: none;
                width: 100%;
            }
            
            #refreshWeather:hover {
                background: rgba(255,255,255,0.3);
            }
        `;
        document.head.appendChild(styles);
    }

    updateWeatherDisplay() {
        if (!this.weather.data) return;

        const weatherInfo = document.querySelector('.weather-info');
        if (weatherInfo) {
            weatherInfo.innerHTML = `
                <h3>${this.weather.location}</h3>
                <p>${this.weather.data.temperature}°C • ${this.weather.data.condition}</p>
                <p>Vent: ${this.weather.data.windSpeed} km/h</p>
            `;
        }

        const weatherIcon = document.querySelector('.weather-icon i');
        if (weatherIcon) {
            weatherIcon.className = `fas ${this.weather.data.icon}`;
        }

        // Update detailed info
        const windInfo = document.getElementById('windInfo');
        if (windInfo) {
            windInfo.textContent = `Vent: ${this.weather.data.windSpeed} km/h`;
        }

        const updateTime = document.getElementByI