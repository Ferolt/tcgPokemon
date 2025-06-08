class PokemonTCGApp {
    constructor(deckManager, storage) {
      
        this.deckManager = deckManager;
        this.storage     = storage;

        
        this.playerSlot = document.getElementById('player-slot');
        this.aiSlot     = document.getElementById('ai-slot');
        this.handList   = document.getElementById('hand-list');
        this.newGameBtn = document.getElementById('new-game-btn');

       
        this.initEvents();
        this.restoreBattle();
        this.updateStatsUI();
    }

    initEvents() {
   
        this.handList.addEventListener('dragstart', e => this.onDragStart(e));
        
        this.playerSlot.addEventListener('dragover', e => e.preventDefault());
        this.playerSlot.addEventListener('drop',     e => this.onDrop(e));
        
        this.newGameBtn.addEventListener('click', () => this.resetGame());
    }

    onDragStart(e) {
        const li = e.target.closest('li');
        if (!li) return;
        e.dataTransfer.setData('text/plain', li.dataset.cardId);
    }

    async onDrop(e) {
        e.preventDefault();
        if (this.playerSlot.dataset.filled === '1') return;
        const id = e.dataTransfer.getData('text/plain');
        await this.playPlayerCard(id);
        await this.aiPlayCard();
        this.resolveBattle();
    }

    async playPlayerCard(id) {
        this.playerSlot.dataset.filled = '1';
        this.playerSlot.innerHTML = this.cardImg(id);
        this.storage.savePlayerCard(id);
        this.storage.removeFromHand(id);

        const li = this.handList.querySelector(`li[data-card-id="${id}"]`);
        if (li) li.remove();
    }

    async aiPlayCard() {
        let deck = this.storage.getDeck();
        if (deck.length === 0) await this.deckManager.replenishDeck();

        const id = deck.shift();
        this.storage.saveAICard(id);
        this.storage.saveDeck(deck);

        this.aiSlot.dataset.filled = '1';
        this.aiSlot.innerHTML = this.cardImg(id);
    }

    resolveBattle() {
        const pId = this.storage.getPlayerCard();
        const aId = this.storage.getAICard();
        if (!pId || !aId) return;

        const score = async id => {
            const c = await window.pokemonTCGService.fetchCardById(id);
            return c.attack + c.hp;
        };

        Promise.all([score(pId), score(aId)]).then(([ps, as]) => {
            let res = 'draw';
            if (ps > as) res = 'win';
            else if (ps < as) res = 'loss';

            this.storage.updateStatsAfterBattle(res);
            this.storage.addBattleToHistory({ pId, aId, res });

            this.notify(
                res === 'win'  ? 'Victoire 🎉' :
                res === 'loss' ? 'Défaite 😢' :
                                 'Égalité 🤝',
                res
            );

            this.updateStatsUI();
            setTimeout(() => this.resetBoard(), 2500);
        });
    }

   cardImg(id) {
       $return `<img src="https://images.pokemontcg.io/${id.split('-')[0]}/${id.split('-')[1]}.png"
                     alt="${id}" draggable="false" class="pokemon-card-holo">`;
    }

    resetBoard() {
        this.playerSlot.dataset.filled = '0';
        this.aiSlot.dataset.filled     = '0';
        this.playerSlot.innerHTML = 'Vous';
        this.aiSlot.innerHTML     = 'IA';
        this.storage.clearBattleCards();
    }

    resetGame() {
        this.storage.clearAll();
        location.reload();
    }

    updateStatsUI() {
        const s = this.storage.getGameStats();
        document.getElementById('wins').textContent    = s.wins;
        document.getElementById('losses').textContent  = s.losses;
        document.getElementById('winrate').textContent = s.winRate + ' %';
    }

   $notify(msg, type = 'info') {
        const t = document.createElement('div');
        t.className = `toast ${type}`;
        t.textContent = msg;
        document.body.appendChild(t);
        setTimeout(() => t.classList.add('show'), 10);
        setTimeout(() => t.classList.remove('show'), 3000);
        setTimeout(() => t.remove(), 3500);
    }

    $restoreBattle() {
        const p = this.storage.getPlayerCard();
        const a = this.storage.getAICard();
        if (p) {
            this.playerSlot.dataset.filled = '1';
            this.playerSlot.innerHTML = this.cardImg(p);
        }
        if (a) {
            this.aiSlot.dataset.filled = '1';
            this.aiSlot.innerHTML = this.cardImg(a);
        }
    }
}

$
window.addEventListener('DOMContentLoaded', () => {
    window.app = new PokemonTCGApp(
        window.deckManager,
        new StorageManager()
    );
});
