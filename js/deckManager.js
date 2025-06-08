/**
 * gestion pile de cartes, pioche, timer, animations
 */
class DeckManager {
    constructor(storage, api) {
        this.storage = storage;
        this.api = api;

        this.deck = [];          // ids en pile
        this.hand = [];          // ids dans la main
        this.drawBtn = document.getElementById('draw-btn');
        this.remainingSpan = document.getElementById('remaining-count');

        this.attachListeners();
        this.restoreState();
    }

    // listeners bouton
    attachListeners() {
        this.drawBtn.addEventListener('click', () => this.handleDraw());
        // rafraîchissement visuel du timer toutes les secondes
        setInterval(() => this.updateDrawCooldown(), 1000);
    }

    // état localStorage → UI
    async restoreState() {
        this.deck = this.storage.getDeck();
        this.hand = this.storage.getHand();

        // si aucune carte, on fetch un nouveau deck
        if (this.deck.length === 0) {
            const cards = await this.api.fetchRandomCards(50);
            this.deck = cards.map(c => c.id);
            this.storage.saveDeck(this.deck);
        }

        this.renderHand();
        this.updateRemainingSpan();
        this.updateDrawCooldown();
    }

    // pioche 5 cartes
    async handleDraw() {
        if (!this.storage.canDraw()) return;

        if (this.deck.length < 5) await this.replenishDeck();

        const drawnIds = this.deck.splice(0, 5);
        this.hand.push(...drawnIds);

        this.storage.saveDeck(this.deck);
        this.storage.saveHand(this.hand);
        this.storage.saveLastDrawTime();
        this.storage.updateCardsDrawn(5);

        this.animateDrawButton();
        this.renderHand();
        this.updateRemainingSpan();
        this.updateDrawCooldown();
    }

    // nouveau deck si vide
    async replenishDeck() {
        const cards = await this.api.fetchRandomCards(50);
        this.deck = cards.map(c => c.id);
    }

    // maj cooldown & désactivation bouton
    updateDrawCooldown() {
        const msLeft = this.storage.getTimeUntilNextDraw();
        if (msLeft > 0) {
            this.drawBtn.disabled = true;
            const min = Math.floor(msLeft / 60000);
            const sec = Math.floor((msLeft % 60000) / 1000).toString().padStart(2, '0');
            this.drawBtn.innerHTML = `<i class="fas fa-hourglass-half"></i> ${min}:${sec}`;
        } else {
            this.drawBtn.disabled = false;
            this.drawBtn.innerHTML = `<i class="fas fa-download"></i> Piocher&nbsp;5`;
        }
    }

    // rendu simple de la main (li UL)
    renderHand() {
        const ul = document.getElementById('hand-list');
        ul.innerHTML = '';
        this.hand.forEach(id => {
            const li = document.createElement('li');
            li.className = 'player-hand';
            const img = document.createElement('img');
            img.src = './assets/back-placeholder.webp'; // remplacé plus tard par le visuel réel
            img.alt = id;
            li.appendChild(img);
            ul.appendChild(li);
        });
    }

    // span cartes restantes
    updateRemainingSpan() {
        this.remainingSpan.textContent = this.deck.length;
    }

    // petite anim pulse + particules
    animateDrawButton() {
        this.drawBtn.classList.add('pulse-once');
        setTimeout(() => this.drawBtn.classList.remove('pulse-once'), 700);

        const burst = document.createElement('span');
        burst.className = 'light-burst';
        this.drawBtn.appendChild(burst);
        setTimeout(() => burst.remove(), 600);
    }
}

window.deckManager = new DeckManager(
    new StorageManager(),
    window.pokemonTCGService
);
