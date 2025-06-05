class DeckManager {
    constructor() {
        this.drawPile = [];
        this.hand = [];
        this.battleCard = null;
        this.opponentCard = null;
        this.lastDraw = null;
    }

    // Initialiser le jeu avec des cartes
    initializeGame(cards) {
        this.drawPile = [...cards];
        this.shuffleDeck();
        this.hand = [];
        this.lastDraw = null;
    }

    // Mélanger le paquet
    shuffleDeck() {
        for (let i = this.drawPile.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.drawPile[i], this.drawPile[j]] = [this.drawPile[j], this.drawPile[i]];
        }
    }

    // Piocher des cartes
    drawCards(count) {
        if (this.drawPile.length < count) {
            return false;
        }

        const drawnCards = this.drawPile.splice(0, count);
        this.hand.push(...drawnCards);
        this.lastDraw = new Date();
        return true;
    }

    // Déplacer une carte de la main à la pioche
    moveToDeck(cardId) {
        const cardIndex = this.hand.findIndex(card => card.id === cardId);
        if (cardIndex === -1) return false;

        const [card] = this.hand.splice(cardIndex, 1);
        this.drawPile.push(card);
        return true;
    }

    // Sélectionner une carte pour le combat
    selectForBattle(cardId) {
        const card = this.hand.find(c => c.id === cardId);
        if (!card) return false;

        this.battleCard = card;
        return true;
    }

    // Générer une carte d'adversaire
    generateOpponentCard() {
        if (this.drawPile.length === 0) {
            return null;
        }
        
        const randomIndex = Math.floor(Math.random() * this.drawPile.length);
        const randomCard = this.drawPile[randomIndex];
        this.opponentCard = new PokemonCard(
            randomCard.id,
            randomCard.name,
            randomCard.image,
            randomCard.types,
            randomCard.hp,
            randomCard.attacks
        );
        return this.opponentCard;
    }

    // Simuler un combat
    simulateBattle() {
        if (!this.battleCard || !this.opponentCard) return null;

        const playerDamage = this.battleCard.getAttackDamage();
        const opponentDamage = this.opponentCard.getAttackDamage();

        // Calculer le résultat
        if (playerDamage > opponentDamage) {
            return 'win';
        } else if (playerDamage < opponentDamage) {
            return 'lose';
        } else {
            return 'draw';
        }
    }

    // Vérifier si on peut piocher
    canDraw() {
        if (!this.lastDraw) return true;
        const now = new Date();
        const diff = now - this.lastDraw;
        return diff > 5 * 60 * 1000; // 5 minutes
    }

    // Obtenir le temps restant avant de pouvoir piocher
    getTimeUntilNextDraw() {
        if (!this.lastDraw) return 0;
        const now = new Date();
        const diff = now - this.lastDraw;
        return Math.max(0, 5 * 60 * 1000 - diff);
    }
}