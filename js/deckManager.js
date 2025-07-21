class DeckManager {
    constructor(storageManager) {
        this.storage = storageManager;
        this.isDrawing = false;
        this.timerInterval = null;
        
        this.initializeEventListeners();
        this.updateUI();
        this.startDrawTimer();
    }

   
    initializeEventListeners() {
        const drawBtn = document.getElementById('draw-btn');
        if (drawBtn) {
            drawBtn.addEventListener('click', () => this.drawCards());
        }
    }

    // pioche 
    async drawCards() {
        if (this.isDrawing) return;
        
        // Vérifier si la pioche est disponible
        if (!this.storage.canDraw()) {
            const timeLeft = this.storage.getTimeUntilNextDraw();
            const minutes = Math.floor(timeLeft / 60000);
            const seconds = Math.floor((timeLeft % 60000) / 1000);
            
            window.app.showNotification(
                `Attendre encore ${minutes}:${seconds.toString().padStart(2, '0')}`,
                'warning'
            );
            return;
        }

        const deck = this.storage.getDeck();
        
        
        if (deck.length < 5) {
            window.app.showNotification('Deck insuffisant ! Nouvelle partie requise.', 'error');
            return;
        }

        this.isDrawing = true;
        
        try {
           
            const drawnCards = deck.splice(0, 5);
            const currentHand = this.storage.getHand();
            const newHand = [...currentHand, ...drawnCards];
            
           
            this.storage.saveDeck(deck);
            this.storage.saveHand(newHand);
            this.storage.saveLastDrawTime();
            this.storage.updateCardsDrawn(5);
            
            
            await this.playDrawAnimation();
            
            
            await this.animateNewCardsInHand(drawnCards);
            
            
            await this.updateUI();
            
           
            window.app.playDrawSound();
            
            window.app.showNotification('5 cartes piochées !', 'success');
            
        } catch (error) {

            window.app.showNotification('Erreur lors de la pioche', 'error');
        } finally {
            this.isDrawing = false;
        }
    }

    
    shuffleDeck(deck) {
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }
        return deck;
    }

    // animation pioche
    async playDrawAnimation() {
        const deckElement = document.getElementById('draw-btn');
        const handElement = document.getElementById('player-hand');

        if (!deckElement || !handElement) {

            return;
        }
        
   
        this.createDeckGlowEffect(deckElement);
        
        this.createMagicParticles(deckElement);
        
        const promises = [];
        for (let i = 0; i < 5; i++) {
            promises.push(this.createSpectacularFlyingCard(deckElement, handElement, i));
        }
        
        await Promise.all(promises);
        
        this.createHandSparkleEffect(handElement);
    }

    // animation carte volonte de pioche
    createSpectacularFlyingCard(startElement, endElement, index) {
        return new Promise((resolve) => {
            const flyingCard = document.createElement('div');
            flyingCard.className = 'spectacular-flying-card';
            flyingCard.style.cssText = `
                position: fixed;
                width: 60px;
                height: 84px;
                background: linear-gradient(135deg, #ff6b6b 0%, #4ecdc4 50%, #45b7d1 100%);
                border-radius: 8px;
                z-index: 1000;
                pointer-events: none;
                box-shadow: 0 0 20px rgba(255,255,255,0.8);
                border: 2px solid #fff;
                transform-style: preserve-3d;
            `;
            
            const startRect = startElement.getBoundingClientRect();
            const endRect = endElement.getBoundingClientRect();
            
            flyingCard.style.left = startRect.left + 'px';
            flyingCard.style.top = startRect.top + 'px';
            
            document.body.appendChild(flyingCard);
            
           
            setTimeout(() => {
                flyingCard.style.transition = 'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
                flyingCard.style.transform = 'translateY(-20px) rotateY(180deg) scale(1.1)';
                flyingCard.style.boxShadow = '0 0 30px rgba(255,107,107,0.8), 0 0 60px rgba(78,205,196,0.6)';
                
                setTimeout(() => {
                    flyingCard.style.transition = 'all 1.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
                    const midX = (startRect.left + endRect.left) / 2;
                    const midY = Math.min(startRect.top, endRect.top) - 100;
                    
                    flyingCard.style.left = midX + 'px';
                    flyingCard.style.top = midY + 'px';
                    flyingCard.style.transform = `translateY(0) rotateY(${360 * 2}deg) rotateX(${180 + index * 30}deg) scale(1.2)`;
                    flyingCard.style.boxShadow = '0 0 40px rgba(255,255,255,1), 0 0 80px rgba(255,107,107,0.8)';
                  
                    setTimeout(() => {
                        flyingCard.style.transition = 'all 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
                        flyingCard.style.left = (endRect.left + (index * 20)) + 'px';
                        flyingCard.style.top = endRect.top + 'px';
                        flyingCard.style.transform = `translateY(0) rotateY(${720 + index * 45}deg) rotateX(0deg) scale(0.9)`;
                       
                        this.createCardLandingEffect(endRect.left + (index * 20), endRect.top);
                        
                        setTimeout(() => {
                            flyingCard.style.opacity = '0';
                            flyingCard.style.transform += ' scale(0.5)';
                            
                            setTimeout(() => {
                                flyingCard.remove();
                                resolve();
                            }, 200);
                        }, 500);
                    }, 1000);
                }, 400);
            }, index * 200);
        });
    }

   
    createDeckGlowEffect(deckElement) {
        const glow = document.createElement('div');
        glow.style.cssText = `
            position: absolute;
            top: -10px;
            left: -10px;
            right: -10px;
            bottom: -10px;
            background: radial-gradient(circle, rgba(255,215,0,0.6) 0%, rgba(255,107,107,0.4) 30%, transparent 70%);
            border-radius: 20px;
            z-index: -1;
            animation: deckPulse 2s ease-in-out;
            pointer-events: none;
        `;
        
        deckElement.style.position = 'relative';
        deckElement.appendChild(glow);
        
        setTimeout(() => glow.remove(), 2000);
    }

    
    createMagicParticles(startElement) {
        const rect = startElement.getBoundingClientRect();
        
        for (let i = 0; i < 15; i++) {
            const particle = document.createElement('div');
            particle.style.cssText = `
                position: fixed;
                width: 4px;
                height: 4px;
                background: ${['#ff6b6b', '#4ecdc4', '#45b7d1', '#ffd700'][Math.floor(Math.random() * 4)]};
                border-radius: 50%;
                z-index: 1001;
                pointer-events: none;
                left: ${rect.left + rect.width/2}px;
                top: ${rect.top + rect.height/2}px;
                box-shadow: 0 0 10px currentColor;
            `;
            
            document.body.appendChild(particle);
            
            const angle = (Math.PI * 2 * i) / 15;
            const distance = 50 + Math.random() * 100;
            const duration = 1000 + Math.random() * 1000;
            
            particle.animate([
                { 
                    transform: 'translate(0, 0) scale(1)',
                    opacity: 1
                },
                { 
                    transform: `translate(${Math.cos(angle) * distance}px, ${Math.sin(angle) * distance}px) scale(0)`,
                    opacity: 0
                }
            ], {
                duration: duration,
                easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
            }).onfinish = () => particle.remove();
        }
    }

    
    createCardLandingEffect(x, y) {
        const effect = document.createElement('div');
        effect.style.cssText = `
            position: fixed;
            left: ${x}px;
            top: ${y}px;
            width: 60px;
            height: 60px;
            background: radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(255,107,107,0.6) 30%, transparent 70%);
            border-radius: 50%;
            z-index: 999;
            pointer-events: none;
            transform: scale(0);
        `;
        
        document.body.appendChild(effect);
        
        effect.animate([
            { transform: 'scale(0)', opacity: 1 },
            { transform: 'scale(2)', opacity: 0 }
        ], {
            duration: 400,
            easing: 'ease-out'
        }).onfinish = () => effect.remove();
    }

    
    createHandSparkleEffect(handElement) {
        const rect = handElement.getBoundingClientRect();
        
        for (let i = 0; i < 20; i++) {
            const sparkle = document.createElement('div');
            sparkle.style.cssText = `
                position: fixed;
                width: 3px;
                height: 3px;
                background: #ffd700;
                border-radius: 50%;
                z-index: 1002;
                pointer-events: none;
                left: ${rect.left + Math.random() * rect.width}px;
                top: ${rect.top + Math.random() * rect.height}px;
                box-shadow: 0 0 8px #ffd700;
            `;
            
            document.body.appendChild(sparkle);
            
            sparkle.animate([
                { 
                    opacity: 0,
                    transform: 'scale(0) rotate(0deg)'
                },
                { 
                    opacity: 1,
                    transform: 'scale(1.5) rotate(180deg)'
                },
                { 
                    opacity: 0,
                    transform: 'scale(0) rotate(360deg)'
                }
            ], {
                duration: 1500 + Math.random() * 1000,
                delay: Math.random() * 500,
                easing: 'ease-in-out'
            }).onfinish = () => sparkle.remove();
        }
    }

    
    async animateNewCardsInHand(cardIds) {
        const handContainer = document.getElementById('player-hand');
        if (!handContainer) return;
        
        handContainer.innerHTML = '';
        
        for (let i = 0; i < cardIds.length; i++) {
            const cardId = cardIds[i];
            try {
                const card = await window.pokemonCardManager?.getCardById(cardId);
                if (card) {
                    const cardElement = card.createElement();
                    cardElement.style.opacity = '0';
                    cardElement.style.transform = 'scale(0.3) translateY(100px) rotate(45deg)';
                    cardElement.style.transition = 'all 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
                    
                    this.addCardEventListeners(cardElement, card);
                    handContainer.appendChild(cardElement);
                    
                    setTimeout(() => {
                        cardElement.style.opacity = '1';
                        cardElement.style.transform = 'scale(1) translateY(0) rotate(0deg)';
                        
                        cardElement.classList.add('new-card-sparkle');
                        setTimeout(() => {
                            cardElement.classList.remove('new-card-sparkle');
                        }, 3000);
                    }, (i * 200) + 500); 
                }
            } catch (error) {

            }
        }
    }

    
    async animateNewCards(cardIds) {
        return this.animateNewCardsInHand(cardIds);
    }


    async updateUI() {
        this.updateDeckCount();
        this.updateHandCount();
        this.updateDrawButton();
        await this.updatePlayerHand();
    }

    
    updateDeckCount() {
        const deckCountElement = document.getElementById('deck-count');
        if (deckCountElement) {
            const deckSize = this.storage.getDeck().length;
            deckCountElement.textContent = deckSize;
            
            // Changer la couleur selon le nombre de cartes
            if (deckSize < 5) {
                deckCountElement.style.color = 'var(--error)';
            } else if (deckSize < 15) {
                deckCountElement.style.color = 'var(--warning)';
            } else {
                deckCountElement.style.color = 'var(--success)';
            }
        }
    }

    
    updateHandCount() {
        const handCountElement = document.getElementById('hand-count');
        if (handCountElement) {
            const handSize = this.storage.getHand().length;
            handCountElement.textContent = handSize;
            
            // Limiter l'affichage à 10 cartes maximum
            if (handSize > 10) {
                handCountElement.style.color = 'var(--warning)';
            } else {
                handCountElement.style.color = 'var(--text-light)';
            }
        }
    }

    
    updateDrawButton() {
        const drawBtn = document.getElementById('draw-btn');
        const timerElement = document.getElementById('draw-timer');
        
        if (!drawBtn || !timerElement) return;
        
        if (this.storage.canDraw()) {
            drawBtn.disabled = false;
            drawBtn.classList.remove('disabled');
            timerElement.classList.add('hidden');
        } else {
            drawBtn.disabled = true;
            drawBtn.classList.add('disabled');
            timerElement.classList.remove('hidden');
        }
    }

    
    async updatePlayerHand() {
        const handContainer = document.getElementById('player-hand');
        if (!handContainer) return;

        const handCardIds = this.storage.getHand();
        
       
        handContainer.innerHTML = '';
        
        if (handCardIds.length === 0) {
           
            const emptyHand = document.createElement('div');
            emptyHand.className = 'empty-hand';
            emptyHand.innerHTML = `
                <i class="fas fa-cards-blank"></i>
                <p>Votre main est vide</p>
                <p>Piochez des cartes pour commencer !</p>
            `;
            handContainer.appendChild(emptyHand);
            return;
        }

      
        for (const cardId of handCardIds) {
            try {
                const card = await window.pokemonCardManager?.getCardById(cardId);
                if (card) {
                    const cardElement = card.createElement();
                    this.addCardEventListeners(cardElement, card);
                    handContainer.appendChild(cardElement);
                }
            } catch (error) {

            }
        }
    }

 
    addCardEventListeners(cardElement, cardData) {
      
        cardElement.addEventListener('click', () => {
            if (window.app) {
                window.app.showCardModal(cardData);
            }
        });

      
        cardElement.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', cardData.id);
            this.startDragEffects(cardElement);
        });

        cardElement.addEventListener('dragend', () => {
            this.endDragEffects(cardElement);
        });

   
        cardElement.addEventListener('mouseenter', () => {
            this.addHoverEffects(cardElement);
        });

        cardElement.addEventListener('mouseleave', () => {
            this.removeHoverEffects(cardElement);
        });
    }

    // timer 
    startDrawTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
        
        this.timerInterval = setInterval(() => {
            this.updateDrawTimer();
        }, 1000);
    }

    // update timer
    updateDrawTimer() {
        const timerElement = document.getElementById('timer-text');
        if (!timerElement) return;
        
        if (this.storage.canDraw()) {
            this.updateDrawButton();
            return;
        }
        
        const timeLeft = this.storage.getTimeUntilNextDraw();
        const minutes = Math.floor(timeLeft / 60000);
        const seconds = Math.floor((timeLeft % 60000) / 1000);
        
        timerElement.textContent = `Attendre: ${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    
    async resetDeck() {
        try {
      
            const newDeck = await window.pokemonCardManager?.generateRandomDeck(50) || [];
            this.storage.saveDeck(newDeck);
            this.storage.saveHand([]);
            this.storage.clearBattleCards();
            this.storage.resetExchangeStatus();
            this.storage.resetDrawTimer();
            await this.updateUI();
        } catch (error) {

        }
    }

    // pioche aleatoire ai
    drawRandomCardForAI() {
        const deck = this.storage.getDeck();
        if (deck.length === 0) return null;
        
        const randomIndex = Math.floor(Math.random() * deck.length);
        const drawnCard = deck.splice(randomIndex, 1)[0];
        this.storage.saveDeck(deck);
        
        return drawnCard;
    }

 
    startDragEffects(cardElement) {
        
        const trail = document.createElement('div');
        trail.className = 'drag-trail';
        trail.style.cssText = `
            position: fixed;
            width: ${cardElement.offsetWidth}px;
            height: ${cardElement.offsetHeight}px;
            background: linear-gradient(135deg, 
                rgba(255,107,107,0.6) 0%, 
                rgba(78,205,196,0.6) 50%, 
                rgba(69,183,209,0.6) 100%);
            border-radius: 12px;
            z-index: 999;
            pointer-events: none;
            box-shadow: 
                0 0 30px rgba(255,255,255,0.8),
                0 0 60px rgba(255,107,107,0.6),
                inset 0 0 20px rgba(255,255,255,0.3);
            animation: dragGlow 0.5s ease-in-out infinite alternate;
        `;
        
        cardElement.dragTrail = trail;
        document.body.appendChild(trail);
        
      
        cardElement.style.cssText += `
            transform: scale(1.15) rotateZ(5deg) !important;
            box-shadow: 
                0 20px 40px rgba(0,0,0,0.4),
                0 0 50px rgba(255,255,255,0.8),
                0 0 100px rgba(255,107,107,0.6) !important;
            z-index: 1000 !important;
            opacity: 0.9 !important;
            transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55) !important;
        `;
        
        
        this.createDragParticles(cardElement);
        
        
        this.startMouseTracking(cardElement);
    }


    endDragEffects(cardElement) {
       
        if (cardElement.dragTrail) {
            cardElement.dragTrail.remove();
            delete cardElement.dragTrail;
        }
        
       
        this.stopMouseTracking();
        
        cardElement.style.cssText = cardElement.style.cssText.replace(/transform:.*?!important;/g, '');
        cardElement.style.cssText = cardElement.style.cssText.replace(/box-shadow:.*?!important;/g, '');
        cardElement.style.cssText = cardElement.style.cssText.replace(/z-index:.*?!important;/g, '');
        cardElement.style.cssText = cardElement.style.cssText.replace(/opacity:.*?!important;/g, '');
        cardElement.style.cssText = cardElement.style.cssText.replace(/transition:.*?!important;/g, '');
        
        cardElement.style.transform = '';
        cardElement.style.opacity = '1';
        cardElement.style.zIndex = '';
        cardElement.style.transition = 'all 0.3s ease';
    }

 
    addHoverEffects(cardElement) {
        if (cardElement.dragging) return;
        
        cardElement.style.transform = 'translateY(-10px) scale(1.05)';
        cardElement.style.boxShadow = '0 15px 30px rgba(0,0,0,0.3), 0 0 20px rgba(255,107,107,0.4)';
        cardElement.style.zIndex = '10';
       
        const sparkles = [];
        for (let i = 0; i < 5; i++) {
            const sparkle = document.createElement('div');
            sparkle.style.cssText = `
                position: absolute;
                width: 3px;
                height: 3px;
                background: #ffd700;
                border-radius: 50%;
                top: ${Math.random() * 100}%;
                left: ${Math.random() * 100}%;
                pointer-events: none;
                z-index: 11;
                box-shadow: 0 0 6px #ffd700;
                animation: sparkleFloat 1s ease-out forwards;
            `;
            cardElement.appendChild(sparkle);
            sparkles.push(sparkle);
            
            setTimeout(() => sparkle.remove(), 1000);
        }
    }

 
    removeHoverEffects(cardElement) {
        if (cardElement.dragging) return;
        
        cardElement.style.transform = '';
        cardElement.style.boxShadow = '';
        cardElement.style.zIndex = '';
    }

 
    createDragParticles(cardElement) {
        const createParticle = () => {
            if (!cardElement.dragTrail) return;
            
            const particle = document.createElement('div');
            particle.style.cssText = `
                position: fixed;
                width: 3px;
                height: 3px;
                background: ${['#ff6b6b', '#4ecdc4', '#45b7d1', '#ffd700'][Math.floor(Math.random() * 4)]};
                border-radius: 50%;
                z-index: 998;
                pointer-events: none;
                box-shadow: 0 0 8px currentColor;
            `;
            
            document.body.appendChild(particle);
            
            particle.animate([
                { 
                    opacity: 1,
                    transform: 'scale(1) translate(0, 0)'
                },
                { 
                    opacity: 0,
                    transform: 'scale(0) translate(0, -30px)'
                }
            ], {
                duration: 800,
                easing: 'ease-out'
            }).onfinish = () => particle.remove();
        };
        
        cardElement.particleInterval = setInterval(createParticle, 50);
    }

    
    startMouseTracking(cardElement) {
        const updateTrailPosition = (e) => {
            if (cardElement.dragTrail) {
                cardElement.dragTrail.style.left = (e.clientX - cardElement.offsetWidth/2) + 'px';
                cardElement.dragTrail.style.top = (e.clientY - cardElement.offsetHeight/2) + 'px';
            }
        };
        
        this.mouseTracker = updateTrailPosition;
        document.addEventListener('dragover', this.mouseTracker);
    }

 
    stopMouseTracking() {
        if (this.mouseTracker) {
            document.removeEventListener('dragover', this.mouseTracker);
            this.mouseTracker = null;
        }
        
        // Nettoyer les particules
        const activeCards = document.querySelectorAll('[data-id]');
        activeCards.forEach(card => {
            if (card.particleInterval) {
                clearInterval(card.particleInterval);
                delete card.particleInterval;
            }
        });
    }

    destroy() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
        this.stopMouseTracking();
    }
}