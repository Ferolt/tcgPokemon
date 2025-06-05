class PokemonTCGApp {
    constructor() {
        this.deckManager = new DeckManager();
        this.cards = [];
        this.selectedCardForBattle = null;
        this.rating = 0;
        this.draggedCard = null;
        
        // Éléments DOM
        this.drawBtn = document.getElementById('drawBtn');
        this.handContainer = document.getElementById('handContainer');
        this.drawPile = document.getElementById('drawPile');
        this.timerDisplay = document.getElementById('timer');
        this.cardModal = document.getElementById('cardModal');
        this.cardDetailContent = document.getElementById('cardDetailContent');
        this.closeModal = document.getElementById('closeModal');
        this.playerBattleCard = document.getElementById('playerBattleCard');
        this.opponentBattleCard = document.getElementById('opponentBattleCard');
        this.battleResult = document.getElementById('battleResult');
        this.startBattleBtn = document.getElementById('startBattleBtn');
        this.ratingSection = document.getElementById('ratingSection');
        this.stars = document.querySelectorAll('.star');
        this.commentBox = document.getElementById('commentBox');
        this.submitRatingBtn = document.getElementById('submitRatingBtn');
        
        // Initialisation
        this.init();
    }

    async init() {
        // 1) Récupérer les cartes de l'API
        await this.loadCards();

        // 2) Charger l'état sauvegardé ou initialiser un nouveau jeu
        this.loadGameState();

        // 3) Mettre en place tous les événements (draw, drag&drop, bouton combat, rating…)
        this.initEvents();

        // 4) Démarrer le timer
        this.startTimer();
    }

    async loadCards() {
        try {
            const apiKey = 'dd2932a7-a17d-47c2-aa1c-98ac1f6ddc9e';
            const response = await fetch('https://api.pokemontcg.io/v2/cards?pageSize=250', {
                headers: {
                    'X-Api-Key': apiKey
                }
            });
            if (!response.ok) {
                throw new Error(`Erreur HTTP ${response.status}`);
            }
            const data = await response.json();
            // On mappe les objets renvoyés par l'API vers notre classe PokemonCard
            this.cards = data.data.map(card => new PokemonCard(
                card.id,
                card.name,
                card.images.small,
                card.types || ['Unknown'],
                card.hp || '0',
                (card.attacks || []).map(a => ({ name: a.name, damage: a.damage }))
            ));
            
            // CORRECTION 1: Sauvegarder les cartes dans localStorage pour les refresh
            localStorage.setItem('pokemonCards', JSON.stringify(this.cards.map(card => ({
                id: card.id,
                name: card.name,
                image: card.image,
                types: card.types,
                hp: card.hp,
                attacks: card.attacks
            }))));
            
            return true;
        } catch (error) {
            console.error('Failed to load cards from API:', error);
            
            // CORRECTION 1: Essayer de charger depuis localStorage en cas d'erreur
            const savedCards = localStorage.getItem('pokemonCards');
            if (savedCards) {
                try {
                    const parsedCards = JSON.parse(savedCards);
                    this.cards = parsedCards.map(card => new PokemonCard(
                        card.id,
                        card.name,
                        card.image,
                        card.types,
                        card.hp,
                        card.attacks
                    ));
                    this.showMessage('info', 'Cartes chargées depuis le cache local.');
                    return true;
                } catch (parseError) {
                    console.error('Failed to parse saved cards:', parseError);
                }
            }
            
            this.showMessage('error', 'Échec du chargement des cartes API. Utilisation de données de démo.');
            this.cards = this.generateDemoCards(20);
            return false;
        }
    }

    // Générer des cartes de démonstration
    generateDemoCards(count) {
        const pokemons = [
            'Pikachu', 'Bulbasaur', 'Charmander', 'Squirtle', 'Jigglypuff',
            'Meowth', 'Psyduck', 'Growlithe', 'Poliwag', 'Abra', 'Machop',
            'Tentacool', 'Geodude', 'Ponyta', 'Slowpoke', 'Magnemite', 'Doduo',
            'Gastly', 'Onix', 'Drowzee', 'Krabby', 'Voltorb', 'Cubone', 'Hitmonlee',
            'Lickitung', 'Koffing', 'Rhyhorn', 'Tangela', 'Kangaskhan', 'Horsea'
        ];
        
        const types = ['fire', 'water', 'grass', 'electric', 'psychic', 'fighting', 'dark', 'fairy'];
        
        const cards = [];
        for (let i = 0; i < count; i++) {
            const name = pokemons[Math.floor(Math.random() * pokemons.length)];
            const type = types[Math.floor(Math.random() * types.length)];
            
            cards.push(new PokemonCard(
                `card-${i}`,
                name,
                `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${Math.floor(Math.random() * 500) + 1}.png`,
                [type],
                Math.floor(Math.random() * 100) + 50,
                [{ name: `${type} attack`, damage: `${Math.floor(Math.random() * 50) + 10}` }]
            ));
        }
        
        return cards;
    }

    loadGameState() {
        const savedState = StorageManager.loadGameState();
        if (savedState) {
            // CORRECTION 1: Reconstruire les objets PokemonCard depuis les données sauvegardées
            this.deckManager.drawPile = savedState.drawPile.map(cardData => 
                new PokemonCard(cardData.id, cardData.name, cardData.image, cardData.types, cardData.hp, cardData.attacks)
            );
            this.deckManager.hand = savedState.hand.map(cardData => 
                new PokemonCard(cardData.id, cardData.name, cardData.image, cardData.types, cardData.hp, cardData.attacks)
            );
            
            // Restaurer les cartes de combat si elles existent
            if (savedState.battleCard) {
                this.deckManager.battleCard = new PokemonCard(
                    savedState.battleCard.id, 
                    savedState.battleCard.name, 
                    savedState.battleCard.image, 
                    savedState.battleCard.types, 
                    savedState.battleCard.hp, 
                    savedState.battleCard.attacks
                );
            }
            if (savedState.opponentCard) {
                this.deckManager.opponentCard = new PokemonCard(
                    savedState.opponentCard.id, 
                    savedState.opponentCard.name, 
                    savedState.opponentCard.image, 
                    savedState.opponentCard.types, 
                    savedState.opponentCard.hp, 
                    savedState.opponentCard.attacks
                );
            }
            
            this.deckManager.lastDraw = savedState.lastDraw ? new Date(savedState.lastDraw) : null;
            this.showMessage('success', 'Partie chargée avec succès');
        } else {
            // Nouvelle partie : on initialise le deck à partir de this.cards (issues de l'API)
            this.deckManager.initializeGame([...this.cards]);
            this.deckManager.drawCards(5);
            this.showMessage('info', 'Nouvelle partie commencée! Piochez vos premières cartes.');
        }
        this.renderGame();
    }

    saveGameState() {
        StorageManager.saveGameState(this.deckManager);
    }

    initEvents() {
        // Bouton de pioche
        this.drawBtn.addEventListener('click', () => this.handleDraw());
        
        // Clic sur la pioche (pour démo)
        this.drawPile.addEventListener('click', () => this.handleDraw());
        
        // Fermeture de la modale
        this.closeModal.addEventListener('click', () => {
            this.cardModal.style.display = 'none';
        });
        
        // Clic en dehors de la modale pour fermer
        window.addEventListener('click', (e) => {
            if (e.target === this.cardModal) {
                this.cardModal.style.display = 'none';
            }
        });
        
        // Bouton de combat
        this.startBattleBtn.addEventListener('click', () => this.startBattle());
        
        // Système d'évaluation
        this.stars.forEach(star => {
            star.addEventListener('click', (e) => {
                const rating = parseInt(e.currentTarget.dataset.rating);
                this.setRating(rating);
            });
        });
        
        // Envoi de l'évaluation
        this.submitRatingBtn.addEventListener('click', () => this.submitRating());
        
        // Événements pour le drag and drop
        this.initDragAndDropEvents();
    }

    initDragAndDropEvents() {
        document.addEventListener('dragstart', (e) => {
            const cardEl = e.target.closest('.card');
            if (!cardEl) return;
            this.draggedCard = cardEl;
            cardEl.classList.add('dragging');
            e.dataTransfer.setData('text/plain', cardEl.dataset.id);
            e.dataTransfer.effectAllowed = 'move';
        });

        document.addEventListener('dragend', () => {
            if (this.draggedCard) {
                this.draggedCard.classList.remove('dragging');
                this.draggedCard = null;
            }
        });

        const dropZones = document.querySelectorAll('[data-drop-zone]');
        dropZones.forEach((zone) => {
            zone.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                zone.classList.add('drop-over');
            });
            
            zone.addEventListener('dragleave', (e) => {
                if (!zone.contains(e.relatedTarget)) {
                    zone.classList.remove('drop-over');
                }
            });
            
            zone.addEventListener('drop', (e) => {
                e.preventDefault();
                zone.classList.remove('drop-over');

                const cardId = e.dataTransfer.getData('text/plain');
                if (!cardId) return;

                const cardObj = this.findCardById(cardId);
                if (!cardObj) return;

                const dropZone = e.currentTarget;

                if (dropZone.dataset.dropZone === 'battle-player') {
                    if (this.deckManager.selectForBattle(cardId)) {
                        this.showMessage('success', `${cardObj.name} sélectionné pour le combat !`);
                        this.deckManager.generateOpponentCard();
                        this.renderBattleCards();
                        this.battleResult.textContent = 'Prêt pour le combat! Cliquez sur "Commencer le combat".';
                        // Sauvegarder l'état après sélection
                        this.saveGameState();
                    }
                } 
                else if (dropZone.dataset.dropZone === 'pile') {
                    if (this.deckManager.moveToDeck(cardId)) {
                        this.showMessage('info', `${cardObj.name} défaussée dans la pioche.`);
                        this.saveGameState();
                        this.renderGame();
                    }
                }
            });
        });
    }

    findCardById(cardId) {
        // Rechercher dans la main
        const inHand = this.deckManager.hand.find(c => c.id === cardId);
        if (inHand) return inHand;
        
        // Rechercher dans la pioche
        const inPile = this.deckManager.drawPile.find(c => c.id === cardId);
        if (inPile) return inPile;
        
        return null;
    }

    handleDraw() {
        if (!this.deckManager.canDraw()) {
            this.showMessage('error', `Vous devez attendre avant de pouvoir piocher à nouveau!`);
            return;
        }
        
        if (this.deckManager.drawCards(5)) {
            this.showMessage('success', 'Vous avez pioché 5 nouvelles cartes!');
            this.saveGameState();
            this.renderGame();
        } else {
            this.showMessage('error', 'Plus de cartes dans la pioche!');
        }
    }

    renderGame() {
        // Afficher la main du joueur
        this.renderHand();
        
        // Afficher la carte de combat sélectionnée
        this.renderBattleCards();
        
        // Mettre à jour le bouton de pioche
        this.updateDrawButton();
    }

    renderHand() {
        this.handContainer.innerHTML = '';
        
        this.deckManager.hand.forEach(card => {
            const cardElement = this.createCardElement(card);
            this.handContainer.appendChild(cardElement);
        });
        
        if (this.deckManager.hand.length === 0) {
            this.handContainer.innerHTML = '<div class="message info"><i class="fas fa-info-circle"></i> Votre main est vide. Piochez des cartes!</div>';
        }
    }

    createCardElement(card) {
        const cardElement = document.createElement('div');
        cardElement.className = 'card';
        cardElement.dataset.id = card.id;
        cardElement.draggable = true;
        cardElement.innerHTML = `
            <div class="card-front" style="background: ${card.getTypeColor()}">
                <div class="card-type">${card.types[0]}</div>
                <div class="card-name">${card.name}</div>
                <div class="card-image" style="background-image: url('${card.image}')"></div>
                <div class="card-hp">HP: ${card.hp}</div>
            </div>
            <div class="card-back">
                <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Pok%C3%A9_Ball_icon.svg/768px-Pok%C3%A9_Ball_icon.svg.png" alt="Pokeball">
            </div>
        `;
        
        // Événement pour afficher les détails
        cardElement.addEventListener('click', (e) => {
            if (e.target.closest('.card')) {
                this.showCardDetail(card);
            }
        });
        
        // Événement pour sélectionner pour le combat
        cardElement.addEventListener('dblclick', () => {
            this.selectCardForBattle(card);
        });
        
        return cardElement;
    }

    renderBattleCards() {
        this.playerBattleCard.innerHTML = '';
        this.opponentBattleCard.innerHTML = '';

        if (this.deckManager.battleCard) {
            const playerCardElement = this.createBattleCardElement(this.deckManager.battleCard, 'player');
            this.playerBattleCard.appendChild(playerCardElement);
        }

        if (this.deckManager.opponentCard) {
            const opponentCardElement = this.createBattleCardElement(this.deckManager.opponentCard, 'opponent');
            this.opponentBattleCard.appendChild(opponentCardElement);
        }

        // Activer/désactiver le bouton de combat
        this.startBattleBtn.disabled = !(this.deckManager.battleCard && this.deckManager.opponentCard);
    }

    // CORRECTION 2: Afficher seulement l'image du Pokémon dans la zone de combat
    createBattleCardElement(card, playerType = 'player') {
        const cardElement = document.createElement('div');
        cardElement.className = `battle-card ${playerType}`;
        cardElement.innerHTML = `
            <div class="battle-pokemon-container" style="
                width: 100%; 
                height: 200px; 
                display: flex; 
                flex-direction: column; 
                align-items: center; 
                justify-content: center;
                background: linear-gradient(135deg, ${card.getTypeColor()}, rgba(255,255,255,0.1));
                border-radius: 15px;
                border: 3px solid ${card.getTypeColor()};
                box-shadow: 0 8px 16px rgba(0,0,0,0.3);
                position: relative;
                overflow: hidden;
            ">
                <div class="pokemon-name" style="
                    position: absolute;
                    top: 10px;
                    left: 50%;
                    transform: translateX(-50%);
                    color: white;
                    font-weight: bold;
                    font-size: 1.1em;
                    text-shadow: 2px 2px 4px rgba(0,0,0,0.7);
                    z-index: 2;
                ">${card.name}</div>
                
                <div class="pokemon-image" style="
                    width: 140px;
                    height: 140px;
                    background-image: url('${card.image}');
                    background-size: contain;
                    background-repeat: no-repeat;
                    background-position: center;
                    filter: drop-shadow(3px 3px 6px rgba(0,0,0,0.4));
                    z-index: 1;
                "></div>
                
                <div class="pokemon-hp" style="
                    position: absolute;
                    bottom: 10px;
                    right: 15px;
                    background: rgba(255,255,255,0.9);
                    color: #333;
                    padding: 5px 10px;
                    border-radius: 20px;
                    font-weight: bold;
                    font-size: 0.9em;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                ">HP: ${card.hp}</div>
                
                <div class="pokemon-type" style="
                    position: absolute;
                    bottom: 10px;
                    left: 15px;
                    background: rgba(0,0,0,0.7);
                    color: white;
                    padding: 5px 10px;
                    border-radius: 15px;
                    font-size: 0.8em;
                    text-transform: uppercase;
                ">${card.types[0]}</div>
            </div>
        `;
        return cardElement;
    }

    updateDrawButton() {
        if (this.deckManager.canDraw()) {
            this.drawBtn.disabled = false;
            this.drawBtn.innerHTML = '<i class="fas fa-plus-circle"></i> Piocher (5 cartes)';
        } else {
            this.drawBtn.disabled = true;
            const timeLeft = this.deckManager.getTimeUntilNextDraw();
            const minutes = Math.floor(timeLeft / 60000);
            const seconds = Math.floor((timeLeft % 60000) / 1000);
            this.drawBtn.innerHTML = `<i class="fas fa-clock"></i> Disponible dans ${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
        }
    }

    startTimer() {
        setInterval(() => {
            if (this.deckManager.lastDraw) {
                const timeLeft = this.deckManager.getTimeUntilNextDraw();
                if (timeLeft > 0) {
                    const minutes = Math.floor(timeLeft / 60000);
                    const seconds = Math.floor((timeLeft % 60000) / 1000);
                    this.timerDisplay.textContent = `Prochain tirage dans: ${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
                } else {
                    this.timerDisplay.textContent = 'Vous pouvez piocher maintenant!';
                }
            }
            
            this.updateDrawButton();
        }, 1000);
    }

    showCardDetail(card) {
        this.cardDetailContent.innerHTML = `
            <h2>${card.name}</h2>
            <img src="${card.image}" class="card-detail-image">
            
            <div class="card-detail-info">
                <div class="detail-item">
                    <h3><i class="fas fa-heart"></i> Points de Vie</h3>
                    <p>${card.hp} HP</p>
                </div>
                
                <div class="detail-item">
                    <h3><i class="fas fa-bolt"></i> Type</h3>
                    <p>${card.types.join(', ')}</p>
                </div>
                
                ${card.attacks.length > 0 ? `
                <div class="detail-item">
                    <h3><i class="fas fa-fire"></i> Attaques</h3>
                    <ul>
                        ${card.attacks.map(attack => `
                            <li><strong>${attack.name}</strong>: ${attack.damage || '0'} dégâts</li>
                        `).join('')}
                    </ul>
                </div>
                ` : ''}
                
                <div class="detail-item">
                    <h3><i class="fas fa-id-card"></i> ID Carte</h3>
                    <p>${card.id}</p>
                </div>
            </div>
        `;
        this.cardModal.style.display = 'flex';
    }

    selectCardForBattle(card) {
        if (this.deckManager.selectForBattle(card.id)) {
            this.showMessage('success', `${card.name} sélectionné pour le combat!`);
            this.deckManager.generateOpponentCard();
            this.renderBattleCards();
            this.battleResult.textContent = 'Prêt pour le combat! Cliquez sur "Commencer le combat".';
            // Sauvegarder l'état après sélection
            this.saveGameState();
        }
    }

    startBattle() {
        if (!this.deckManager.battleCard || !this.deckManager.opponentCard) return;
        
        const result = this.deckManager.simulateBattle();
        let resultText = '';
        
        switch (result) {
            case 'win':
                resultText = `Victoire! Votre ${this.deckManager.battleCard.name} a battu ${this.deckManager.opponentCard.name}!`;
                break;
            case 'lose':
                resultText = `Défaite! ${this.deckManager.opponentCard.name} a battu votre ${this.deckManager.battleCard.name}.`;
                break;
            case 'draw':
                resultText = `Match nul! ${this.deckManager.battleCard.name} et ${this.deckManager.opponentCard.name} sont à égalité.`;
                break;
        }
        
        this.battleResult.innerHTML = `
            <div style="font-size: 1.2rem; margin-bottom: 10px;">${resultText}</div>
            <div>Votre attaque: ${this.deckManager.battleCard.getAttackDamage()} dégâts</div>
            <div>Attaque adverse: ${this.deckManager.opponentCard.getAttackDamage()} dégâts</div>
        `;
        
        // Afficher la section d'évaluation
        this.ratingSection.style.display = 'block';
    }

    setRating(rating) {
        this.rating = rating;
        this.stars.forEach((star, index) => {
            if (index < rating) {
                star.classList.add('active');
            } else {
                star.classList.remove('active');
            }
        });
    }

    submitRating() {
        if (this.rating === 0) {
            this.showMessage('error', 'Veuillez donner une note avant de soumettre');
            return;
        }
        
        const comment = this.commentBox.value || 'Pas de commentaire';
        this.showMessage('success', `Merci pour votre évaluation de ${this.rating} étoiles!`);
        
        // Réinitialiser pour le prochain combat
        this.rating = 0;
        this.commentBox.value = '';
        this.stars.forEach(star => star.classList.remove('active'));
        this.ratingSection.style.display = 'none';
        
        // Réinitialiser le combat
        this.deckManager.battleCard = null;
        this.deckManager.opponentCard = null;
        this.renderBattleCards();
        this.battleResult.textContent = 'Sélectionnez une carte pour commencer un nouveau combat';
        
        // Sauvegarder l'état après réinitialisation
        this.saveGameState();
    }

    moveCardToDeck(cardId) {
        if (this.deckManager.moveToDeck(cardId)) {
            this.showMessage('info', `Carte défaussée dans la pioche.`);
            this.saveGameState();
            this.renderGame();
        }
    }

    showMessage(type, text) {
        // Créer un élément de message
        const message = document.createElement('div');
        message.className = `message ${type}`;
        message.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            ${text}
        `;
        
        // Ajouter au conteneur de main
        this.handContainer.prepend(message);
        
        // Supprimer après 5 seconds
        setTimeout(() => {
            message.remove();
        }, 5000);
    }
}

// Démarrer l'application lorsque la page est chargée
window.addEventListener('DOMContentLoaded', () => {
    const app = new PokemonTCGApp();
});