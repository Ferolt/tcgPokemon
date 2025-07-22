class PokemonTCGApp {
    constructor() {
        this.storage = new StorageManager();
        this.deckManager = new DeckManager(this.storage);
        this.currentRating = 0;
        this.isReady = false;
        this.initializeApp();
    }

    async initializeApp() {
        try {
            this.showLoadingOverlay('Chargement des cartes...');
            await this.loadGameState();
            await this.initializeEventListeners();
            await this.initializeDragAndDrop();
            this.initializeRatingSystem();
            await window.pokemonCardManager?.waitForInitialization();
            await this.updateBattleZone();
            this.isReady = true;
            this.hideLoadingOverlay();
            this.enableAllButtons();
        } catch (error) {
            this.showNotification("Erreur d'initialisation de l'application", 'error');
            this.hideLoadingOverlay();
        }
    }

    async initializeEventListeners() {
        const battleBtn = document.getElementById('battle-btn');
        if (battleBtn) {
            battleBtn.addEventListener('click', () => this.startBattle());
        }
        const exchangeBtn = document.getElementById('exchange-btn');
        if (exchangeBtn) {
            exchangeBtn.addEventListener('click', () => this.exchangeHandToDeck());
        }
        const newGameBtn = document.getElementById('new-game-btn');
        if (newGameBtn) {
            newGameBtn.addEventListener('click', () => this.startNewGame());
        }
        const modalCloseBtn = document.querySelector('.modal-close');
        if (modalCloseBtn) {
            modalCloseBtn.addEventListener('click', () => this.hideCardModal());
        }
        const modalBackdrop = document.querySelector('.modal-backdrop');
        if (modalBackdrop) {
            modalBackdrop.addEventListener('click', () => this.hideCardModal());
        }
        const resultOverlay = document.getElementById('result-overlay');
        if (resultOverlay) {
            resultOverlay.addEventListener('click', (e) => {
                if (e.target === resultOverlay) {
                    this.hideResultOverlay();
                }
            });
        }
        this.disableAllButtons();
    }

    disableAllButtons() {
        const btns = document.querySelectorAll('button');
        btns.forEach(btn => btn.disabled = true);
    }
    enableAllButtons() {
        const btns = document.querySelectorAll('button');
        btns.forEach(btn => btn.disabled = false);
    }

    async exchangeHandToDeck() {
        if (!this.isReady) return;
        const playerCardId = this.storage.getPlayerCard();
        const aiCardId = this.storage.getAICard();
        if (!playerCardId || !aiCardId) {
            this.showNotification('Les deux zones de combat doivent avoir une carte pour échanger', 'warning');
            return;
        }
        if (this.storage.isExchangeUsed()) {
            this.showNotification('Échange déjà utilisé pour cette main', 'warning');
            return;
        }
        this.showLoadingOverlay('Échange en cours...');
        try {
            this.storage.savePlayerCard(aiCardId);
            this.storage.saveAICard(playerCardId);
            this.storage.markExchangeUsed();
            await this.playExchangeAnimation();
            await this.deckManager.updateUI();
            await this.updateBattleZone();
            this.hideLoadingOverlay();
            this.showNotification('Cartes de combat échangées !', 'success');
        } catch (error) {
            this.hideLoadingOverlay();
            this.showNotification("Erreur lors de l'échange", 'error');
        }
    }

    async playExchangeAnimation() {
        const playerZone = document.getElementById('player-card-zone');
        const aiZone = document.getElementById('ai-card-zone');
        if (!playerZone || !aiZone) return;
        playerZone.style.transform = 'rotateY(180deg)';
        aiZone.style.transform = 'rotateY(180deg)';
        return new Promise(resolve => {
            setTimeout(() => {
                playerZone.style.transform = 'rotateY(0deg)';
                aiZone.style.transform = 'rotateY(0deg)';
                resolve();
            }, 600);
        });
    }

    showLoadingOverlay(message = 'Chargement...') {
        let overlay = document.getElementById('loading-overlay');
        let text = overlay?.querySelector('.loading-text');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'loading-overlay';
            overlay.className = 'loading-overlay';
            overlay.innerHTML = `<div class="loading-text">${message}</div>`;
            document.body.appendChild(overlay);
        }
        if (!text) {
            text = document.createElement('div');
            text.className = 'loading-text';
            overlay.appendChild(text);
        }
        text.textContent = message;
        overlay.classList.remove('hidden');
    }

    hideLoadingOverlay() {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.classList.add('hidden');
        }
    }

    async initializeDragAndDrop() {
        const dropZone = document.getElementById('player-card-zone');
        if (!dropZone) return;
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, this.preventDefaults, false);
            document.body.addEventListener(eventName, this.preventDefaults, false);
        });
        dropZone.addEventListener('dragenter', (e) => {
            dropZone.classList.add('drag-over');
            this.createDropZoneEffect(dropZone);
        });
        dropZone.addEventListener('dragleave', (e) => {
            if (!dropZone.contains(e.relatedTarget)) {
                dropZone.classList.remove('drag-over');
            }
        });
        dropZone.addEventListener('drop', (e) => {
            const cardId = e.dataTransfer.getData('text/plain');
            dropZone.classList.remove('drag-over');
            if (cardId) {
                try {
                    this.dropCardToBattle(cardId);
                } catch (error) {
                    this.showNotification('Erreur lors du placement de la carte', 'error');
                }
            }
        });
        dropZone.addEventListener('dragover', () => {
            dropZone.classList.add('drag-over');
        });
        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('drag-over');
        });
    }

    preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    dropCardToBattle(cardId) {
        if (!this.isReady) return;
        const hand = this.storage.getHand();
        const cardIndex = hand.indexOf(cardId);
        if (cardIndex === -1) {
            this.showNotification('Carte non trouvée dans la main', 'error');
            return;
        }
        try {
            const dropZone = document.getElementById('player-card-zone');
            if (dropZone) {
                this.createDropExplosionEffect(dropZone);
            }
            hand.splice(cardIndex, 1);
            this.storage.saveHand(hand);
            this.storage.savePlayerCard(cardId);
            setTimeout(() => {
                this.playAICard().catch(console.error);
            }, 100);
            setTimeout(() => {
                this.deckManager.updateUI();
                this.updateBattleZone();
                if (dropZone) {
                    const playerCardElement = dropZone.querySelector('.pokemon-card-holo');
                    if (playerCardElement) {
                        playerCardElement.classList.add('card-inserted');
                        setTimeout(() => {
                            playerCardElement.classList.remove('card-inserted');
                        }, 800);
                    }
                }
            }, 200);
            this.showNotification('Carte placée en combat !', 'success');
        } catch (error) {
            this.showNotification('Erreur lors du placement de la carte', 'error');
        }
    }

    createDropZoneEffect(dropZone) {
        const rect = dropZone.getBoundingClientRect();
        for (let i = 0; i < 8; i++) {
            const particle = document.createElement('div');
            particle.style.cssText = `position: fixed;width: 4px;height: 4px;background: #4ecdc4;border-radius: 50%;z-index: 1001;pointer-events: none;left: ${rect.left + Math.random() * rect.width}px;top: ${rect.top + Math.random() * rect.height}px;box-shadow: 0 0 10px #4ecdc4;`;
            document.body.appendChild(particle);
            particle.animate([
                { opacity: 1,transform: 'scale(1) translateY(0)'},
                { opacity: 0,transform: 'scale(0) translateY(-20px)'}
            ], {
                duration: 1000,
                easing: 'ease-out'
            }).onfinish = () => particle.remove();
        }
    }

    createDropExplosionEffect(dropZone) {
        const rect = dropZone.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const explosion = document.createElement('div');
        explosion.style.cssText = `position: fixed;left: ${centerX}px;top: ${centerY}px;width: 20px;height: 20px;background: radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(78,205,196,0.8) 30%, transparent 70%);border-radius: 50%;z-index: 1002;pointer-events: none;transform: translate(-50%, -50%) scale(0);`;
        document.body.appendChild(explosion);
        explosion.animate([
            { transform: 'translate(-50%, -50%) scale(0)', opacity: 1 },
            { transform: 'translate(-50%, -50%) scale(3)', opacity: 0 }
        ], {
            duration: 600,
            easing: 'ease-out'
        }).onfinish = () => explosion.remove();
        for (let i = 0; i < 12; i++) {
            const particle = document.createElement('div');
            particle.style.cssText = `position: fixed;left: ${centerX}px;top: ${centerY}px;width: 3px;height: 3px;background: ${['#4ecdc4', '#ff6b6b', '#45b7d1', '#ffd700'][i % 4]};border-radius: 50%;z-index: 1001;pointer-events: none;box-shadow: 0 0 8px currentColor;`;
            document.body.appendChild(particle);
            const angle = (Math.PI * 2 * i) / 12;
            const distance = 80 + Math.random() * 40;
            particle.animate([
                { transform: 'translate(-50%, -50%) scale(1)',opacity: 1 },
                { transform: `translate(${Math.cos(angle) * distance - 50}px, ${Math.sin(angle) * distance - 50}px) scale(0)`,opacity: 0 }
            ], {
                duration: 800 + Math.random() * 400,
                easing: 'ease-out'
            }).onfinish = () => particle.remove();
        }
    }

    async playAICard() {
        if (!this.isReady) return;
        try {
            const aiCardId = this.deckManager.drawRandomCardForAI();
            if (aiCardId) {
                await this.playAIDrawAnimation();
                this.storage.saveAICard(aiCardId);
                setTimeout(async () => {
                    await this.updateAIBattleCard();
                }, 100);
                this.showNotification("L'IA a joué une carte !", 'info');
            } else {
                this.showNotification("L'IA n'a plus de cartes !", 'warning');
            }
        } catch (error) {}
    }

    async playAIDrawAnimation() {
        const aiZone = document.getElementById('ai-card-zone');
        if (!aiZone) return;
        aiZone.style.boxShadow = '0 0 20px var(--primary)';
        return new Promise(resolve => {
            setTimeout(() => {
                aiZone.style.boxShadow = '';
                resolve();
            }, 500);
        });
    }

    updateBattleZone() {
        this.updatePlayerBattleCard().catch(console.error);
        this.updateAIBattleCard().catch(console.error);
        const playerCard = this.storage.getPlayerCard();
        const aiCard = this.storage.getAICard();
        if (playerCard && aiCard) {
            this.showBattleButton();
        } else {
            this.hideBattleButton();
        }
    }

    async updatePlayerBattleCard() {
        const playerZone = document.getElementById('player-card-zone');
        const playerCardId = this.storage.getPlayerCard();
        if (!playerZone) return;
        if (playerCardId) {
            try {
                const card = await window.pokemonCardManager?.getCardById(playerCardId);
                if (card) {
                    const cardElement = card.createElement();
                    cardElement.style.margin = '0';
                    cardElement.addEventListener('click', () => this.showCardModal(card));
                    playerZone.innerHTML = '';
                    playerZone.appendChild(cardElement);
                }
            } catch (error) {}
        } else {
            playerZone.innerHTML = `<div class="drop-hint"><i class="fas fa-plus"></i><span>Glissez une carte ici</span></div>`;
        }
    }

    async updateAIBattleCard() {
        const aiZone = document.getElementById('ai-card-zone');
        const aiCardId = this.storage.getAICard();
        if (!aiZone) return;
        if (aiCardId) {
            try {
                const card = await window.pokemonCardManager?.getCardById(aiCardId);
                if (card) {
                    const cardElement = card.createElement();
                    cardElement.style.margin = '0';
                    cardElement.addEventListener('click', () => this.showCardModal(card));
                    aiZone.innerHTML = '';
                    aiZone.appendChild(cardElement);
                    this.showBattleButton();
                }
            } catch (error) {}
        } else {
            aiZone.innerHTML = `<div class="ai-hint"><i class="fas fa-robot"></i><span>IA en attente...</span></div>`;
        }
    }

    showBattleButton() {
        const battleBtn = document.getElementById('battle-btn');
        const playerCard = this.storage.getPlayerCard();
        const aiCard = this.storage.getAICard();
        if (battleBtn && playerCard && aiCard) {
            battleBtn.classList.remove('hidden');
        }
    }

    hideBattleButton() {
        const battleBtn = document.getElementById('battle-btn');
        if (battleBtn) {
            battleBtn.classList.add('hidden');
        }
    }

    async startBattle() {
        if (!this.isReady) return;
        const playerCardId = this.storage.getPlayerCard();
        const aiCardId = this.storage.getAICard();
        if (!playerCardId || !aiCardId) {
            this.showNotification('Combat impossible - cartes manquantes', 'error');
            return;
        }
        try {
            await this.playBattleAnimation();
            const battleResult = await this.calculateBattleResult(playerCardId, aiCardId);
            if (!battleResult) {
                this.showNotification('Erreur lors du calcul du combat', 'error');
                return;
            }
            this.saveBattleResult(battleResult);
            this.showBattleResult(battleResult);
        } catch (error) {
            this.showNotification('Erreur pendant le combat', 'error');
        }
    }

    async playBattleAnimation() {
        const overlay = document.getElementById('battle-overlay');
        if (!overlay) return;
        overlay.classList.remove('hidden');
        this.playBattleSound();
        return new Promise(resolve => {
            setTimeout(() => {
                overlay.classList.add('hidden');
                resolve();
            }, 2000);
        });
    }

    async calculateBattleResult(playerCardId, aiCardId) {
        try {
            const playerCard = await window.pokemonCardManager?.getCardById(playerCardId);
            const aiCard = await window.pokemonCardManager?.getCardById(aiCardId);
            if (!playerCard || !aiCard) {
                throw new Error('Cartes non trouvées pour le combat');
            }
            const playerPower = playerCard.getPowerLevel();
            const aiPower = aiCard.getPowerLevel();
            const playerFinalPower = playerPower + (Math.random() * 20 - 10);
            const aiFinalPower = aiPower + (Math.random() * 20 - 10);
            const result = {
                playerCard: playerCard,
                aiCard: aiCard,
                playerPower: Math.round(playerFinalPower),
                aiPower: Math.round(aiFinalPower),
                winner: playerFinalPower > aiFinalPower ? 'player' : 'ai',
                timestamp: Date.now()
            };
            return result;
        } catch (error) {
            return null;
        }
    }

    saveBattleResult(battleResult) {
        this.storage.addBattleToHistory(battleResult);
        this.storage.updateStatsAfterBattle(battleResult.winner);
    }

    showBattleResult(battleResult) {
        const overlay = document.getElementById('result-overlay');
        const icon = document.getElementById('result-icon');
        const title = document.getElementById('result-title');
        const message = document.getElementById('result-message');
        if (!overlay || !icon || !title || !message) return;
        if (battleResult.winner === 'player') {
            icon.className = 'fas fa-trophy';
            title.textContent = 'Victoire !';
            message.textContent = `Votre ${battleResult.playerCard.name} a vaincu ${battleResult.aiCard.name} !`;
            overlay.className = 'result-overlay victory';
            this.playVictorySound();
        } else {
            icon.className = 'fas fa-skull';
            title.textContent = 'Défaite...';
            message.textContent = `${battleResult.aiCard.name} a vaincu votre ${battleResult.playerCard.name}...`;
            overlay.className = 'result-overlay defeat';
            this.playDefeatSound();
        }
        overlay.classList.remove('hidden');
    }

    hideResultOverlay() {
        const overlay = document.getElementById('result-overlay');
        if (overlay) {
            overlay.classList.add('hidden');
            setTimeout(() => {
                this.clearBattleZone();
            }, 300);
        }
    }

    clearBattleZone() {
        this.storage.clearBattleCards();
        this.updateBattleZone();
        this.deckManager.updateUI();
    }

    initializeRatingSystem() {
        const stars = document.querySelectorAll('.star-rating');
        const submitBtn = document.getElementById('submit-rating');
        stars.forEach(star => {
            star.addEventListener('click', () => {
                const rating = parseInt(star.dataset.rating);
                this.currentRating = rating;
                this.highlightStars(rating);
            });
            star.addEventListener('mouseenter', () => {
                const rating = parseInt(star.dataset.rating);
                this.highlightStars(rating);
            });
        });
        const starsContainer = document.querySelector('.stars-rating');
        if (starsContainer) {
            starsContainer.addEventListener('mouseleave', () => {
                this.updateStarsDisplay();
            });
        }
        if (submitBtn) {
            submitBtn.addEventListener('click', () => this.submitBattleRating());
        }
    }

    highlightStars(rating) {
        const stars = document.querySelectorAll('.star-rating');
        stars.forEach((star, index) => {
            if (index < rating) {
                star.classList.add('active');
            } else {
                star.classList.remove('active');
            }
        });
    }

    updateStarsDisplay() {
        this.highlightStars(this.currentRating);
    }

    async submitBattleRating() {
        const comment = document.getElementById('battle-comment')?.value || '';
        if (this.currentRating === 0) {
            this.showNotification('Veuillez donner une note', 'warning');
            return;
        }
        const rating = {
            rating: this.currentRating,
            comment: comment,
            timestamp: Date.now()
        };
        this.storage.addRatingToHistory(rating);
        this.showNotification(`Combat noté ${this.currentRating}/5 étoiles !`, 'success');
        this.currentRating = 0;
        this.highlightStars(0);
        if (document.getElementById('battle-comment')) {
            document.getElementById('battle-comment').value = '';
        }
        this.hideResultOverlay();
    }

    async showCardModal(cardData) {
        const modal = document.getElementById('card-modal');
        if (!modal) return;
        try {
            let card = cardData;
            if (typeof cardData === 'string') {
                card = await window.pokemonCardManager?.getCardById(cardData);
            }
            if (!card) return;
            modal.innerHTML = `<div class="modal-backdrop" onclick="window.app.hideCardModal()"><div class="modal-content" onclick="event.stopPropagation()"><button class="modal-close" onclick="window.app.hideCardModal()"><i class="fas fa-times"></i></button><div class="modal-card-container"><div class="modal-card-image"><img src="${card.image}" alt="${card.name}" onerror="this.src='https://images.pokemontcg.io/base1/4_hires.png'" /></div><div class="modal-card-details"><h2 class="card-name">${card.name}</h2><div class="card-info-grid"><div class="info-item"><span class="label">Type:</span><span class="value">${card.type}</span></div><div class="info-item"><span class="label">Set:</span><span class="value">${card.set}</span></div><div class="info-item"><span class="label">Rareté:</span><span class="value">${card.rarity}</span></div></div><div class="card-stats"><div class="stat"><span class="stat-label">HP</span><span class="stat-value">${card.hp}</span></div><div class="stat"><span class="stat-label">ATK</span><span class="stat-value">${card.attack}</span></div><div class="stat"><span class="stat-label">DEF</span><span class="stat-value">${card.defense}</span></div><div class="stat power"><span class="stat-label">PWR</span><span class="stat-value">${card.getPowerLevel()}</span></div></div>${card.attacks && card.attacks.length > 0 ? `<div class="card-attacks"><h3>Attaques</h3>${card.attacks.map(attack => `<div class="attack-item"><span class="attack-name">${attack.name}</span><span class="attack-damage">${attack.damage}</span></div>`).join('')}</div>` : ''}</div></div></div></div>`;
            modal.classList.remove('hidden');
            this.playModalSound();
        } catch (error) {}
    }

    hideCardModal() {
        const modal = document.getElementById('card-modal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    async startNewGame() {
        this.isReady = false;
        this.disableAllButtons();
        try {
            this.showLoadingOverlay('Nouvelle partie...');
            await window.pokemonCardManager?.waitForInitialization();
            await this.deckManager.resetDeck();
            this.clearBattleZone();
            this.storage.resetExchangeStatus();
            await this.deckManager.updateUI();
            await this.updateBattleZone();
            this.hideLoadingOverlay();
            this.isReady = true;
            this.enableAllButtons();
            this.showNotification('Nouvelle partie commencée !', 'success');
        } catch (error) {
            this.hideLoadingOverlay();
            this.showNotification("Erreur lors de la création d'une nouvelle partie", 'error');
        }
    }

    async loadGameState() {
        try {
            await window.pokemonCardManager?.waitForInitialization();
            const deck = this.storage.getDeck();
            if (deck.length === 0) {
                await this.deckManager.resetDeck();
            }
            await this.updateBattleZone();
        } catch (error) {
            await this.deckManager.resetDeck();
        }
    }

    playBattleSound() {
        this.playSound([
            { freq: 200, duration: 0.1 },
            { freq: 300, duration: 0.1 },
            { freq: 400, duration: 0.2 }
        ]);
    }
    playVictorySound() {
        this.playSound([
            { freq: 523, duration: 0.2 },
            { freq: 659, duration: 0.2 },
            { freq: 784, duration: 0.3 }
        ]);
    }
    playDefeatSound() {
        this.playSound([
            { freq: 200, duration: 0.3 },
            { freq: 150, duration: 0.3 },
            { freq: 100, duration: 0.4 }
        ]);
    }
    playDrawSound() {
        this.playSound([
            { freq: 440, duration: 0.1 },
            { freq: 880, duration: 0.1 }
        ]);
    }
    playModalSound() {
        this.playSound([
            { freq: 800, duration: 0.1 }
        ]);
    }
    playSound(sequence) {
        if (typeof AudioContext === 'undefined') return;
        try {
            const audioContext = new AudioContext();
            let currentTime = audioContext.currentTime;
            sequence.forEach(note => {
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                oscillator.frequency.setValueAtTime(note.freq, currentTime);
                gainNode.gain.setValueAtTime(0.1, currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, currentTime + note.duration);
                oscillator.start(currentTime);
                oscillator.stop(currentTime + note.duration);
                currentTime += note.duration;
            });
        } catch (error) {}
    }
    showNotification(message, type = 'info') {
        const notification = document.getElementById('notification');
        const icon = notification?.querySelector('.notification-icon');
        const text = notification?.querySelector('.notification-text');
        if (!notification || !icon || !text) return;
        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };
        icon.className = `notification-icon ${icons[type] || icons.info}`;
        text.textContent = message;
        notification.className = `notification ${type}`;
        setTimeout(() => notification.classList.add('show'), 10);
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.className = 'notification hidden';
            }, 300);
        }, 3000);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.app = new PokemonTCGApp();
});