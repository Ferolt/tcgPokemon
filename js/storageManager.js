class StorageManager {
    constructor() {
        this.keys = {
            DECK: 'pokemon_tcg_deck',
            HAND: 'pokemon_tcg_hand',
            LAST_DRAW: 'pokemon_tcg_last_draw',
            PLAYER_CARD: 'pokemon_tcg_player_card',
            AI_CARD: 'pokemon_tcg_ai_card',
            BATTLE_HISTORY: 'pokemon_tcg_battle_history',
            RATING_HISTORY: 'pokemon_tcg_rating_history',
            GAME_STATS: 'pokemon_tcg_game_stats',
            TRAINER_PROFILE: 'pokemon_tcg_trainer_profile',
            EXCHANGE_USED: 'pokemon_tcg_exchange_used'
        };

        this.initializeDefaultData();
    }

    // init des données par defaut si n'existent pas
    initializeDefaultData() {
        if (!this.getDeck()) {
            const initialDeck = window.pokemonCardManager
                ? window.pokemonCardManager.getAllCards().map(card => card.id)
                : [];
            this.saveDeck(initialDeck);
        }

        if (!this.getHand()) this.saveHand([]);
        if (!this.getBattleHistory()) this.saveBattleHistory([]);
        if (!this.getRatingHistory()) this.saveRatingHistory([]);

        if (!this.getGameStats()) {
            this.saveGameStats({
                totalGames: 0,
                wins: 0,
                losses: 0,
                draws: 0,
                totalCardsDrawn: 0,
                favoriteType: null,
                winRate: 0
            });
        }

        if (!this.getTrainerProfile()) {
            this.saveTrainerProfile({
                name: 'Dresseur',
                level: 1,
                experience: 0,
                badges: [],
                joinDate: Date.now()
            });
        }
    }

    // sauvegarde valeur dans localStorage
    save(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            this.showNotification('Erreur de sauvegarde', 'error');
            return false;
        }
    }

    // recup valeur du localstorage
    load(key) {
        try {
            const value = localStorage.getItem(key);
            return value ? JSON.parse(value) : null;
        } catch (error) {
            return null;
        }
    }

    // supp valeur
    remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            return false;
        }
    }

    // vider le localStorage du jeu
    clearAll() {
        try {
            Object.values(this.keys).forEach(key => localStorage.removeItem(key));
            this.initializeDefaultData();
            return true;
        } catch (error) {
            return false;
        }
    }

    // GESTION DU DECK
    saveDeck(deck) {
        return this.save(this.keys.DECK, deck);
    }
    getDeck() {
        return this.load(this.keys.DECK) || [];
    }
    removeFromDeck(cardIds) {
        const deck = this.getDeck();
        const updated = deck.filter(id => !cardIds.includes(id));
        return this.saveDeck(updated);
    }
    addToDeck(cardIds) {
        const deck = this.getDeck();
        const updated = [...deck, ...cardIds];
        return this.saveDeck(updated);
    }

    // GESTION DE LA MAIN
    saveHand(hand) {
        return this.save(this.keys.HAND, hand);
    }
    getHand() {
        return this.load(this.keys.HAND) || [];
    }
    addToHand(cardIds) {
        const hand = this.getHand();
        return this.saveHand([...hand, ...cardIds]);
    }
    removeFromHand(cardId) {
        const hand = this.getHand();
        return this.saveHand(hand.filter(id => id !== cardId));
    }

    // GESTION DU TIMER
    saveLastDrawTime() {
        return this.save(this.keys.LAST_DRAW, Date.now());
    }
    getLastDrawTime() {
        return this.load(this.keys.LAST_DRAW) || 0;
    }
    canDraw() {
        const last = this.getLastDrawTime();
        return (Date.now() - last) >= 5 * 60 * 1000; // 5 min
    }
    getTimeUntilNextDraw() {
        const diff = 5 * 60 * 1000 - (Date.now() - this.getLastDrawTime());
        return Math.max(0, diff);
    }

    // GESTION DES CARTES EN COMBAT
    savePlayerCard(cardId) {
        return this.save(this.keys.PLAYER_CARD, cardId);
    }
    getPlayerCard() {
        return this.load(this.keys.PLAYER_CARD);
    }
    saveAICard(cardId) {
        return this.save(this.keys.AI_CARD, cardId);
    }
    getAICard() {
        return this.load(this.keys.AI_CARD);
    }
    clearBattleCards() {
        this.remove(this.keys.PLAYER_CARD);
        this.remove(this.keys.AI_CARD);
    }

    // GESTION HISTORIQUE DES COMBATS
    saveBattleHistory(history) {
        return this.save(this.keys.BATTLE_HISTORY, history);
    }
    getBattleHistory() {
        return this.load(this.keys.BATTLE_HISTORY) || [];
    }
    addBattleToHistory(battle) {
        const history = this.getBattleHistory();
        history.unshift({ ...battle, timestamp: Date.now(), id: Date.now() + Math.random() });
        if (history.length > 50) history.splice(50);
        return this.saveBattleHistory(history);
    }

    // GESTION HISTORIQUE DES NOTATIONS
    saveRatingHistory(history) {
        return this.save(this.keys.RATING_HISTORY, history);
    }
    getRatingHistory() {
        return this.load(this.keys.RATING_HISTORY) || [];
    }
    addRatingToHistory(rating) {
        const history = this.getRatingHistory();
        history.unshift({ ...rating, id: Date.now() + Math.random() });
        if (history.length > 100) history.splice(100);
        return this.saveRatingHistory(history);
    }
    getRatingStats() {
        const ratings = this.getRatingHistory();
        if (ratings.length === 0) {
            return { totalRatings: 0, averageRating: 0, ratingDistribution: { 1:0,2:0,3:0,4:0,5:0 } };
        }
        const total = ratings.length;
        const sum = ratings.reduce((acc, r) => acc + r.rating, 0);
        const avg = Math.round((sum / total) * 10) / 10;
        const dist = { 1:0,2:0,3:0,4:0,5:0 };
        ratings.forEach(r => dist[r.rating]++);
        return { totalRatings: total, averageRating: avg, ratingDistribution: dist };
    }

    // GESTION STATISTIQUES
    saveGameStats(stats) {
        return this.save(this.keys.GAME_STATS, stats);
    }
    getGameStats() {
        return this.load(this.keys.GAME_STATS) || {
            totalGames: 0, wins: 0, losses: 0, draws: 0,
            totalCardsDrawn: 0, favoriteType: null, winRate: 0
        };
    }
    updateStatsAfterBattle(result) {
        const stats = this.getGameStats();
        stats.totalGames++;
        if (result === 'win') stats.wins++;
        else if (result === 'loss') stats.losses++;
        else if (result === 'draw') stats.draws++;
        stats.winRate = Math.round((stats.wins / stats.totalGames) * 100);
        return this.saveGameStats(stats);
    }
    updateCardsDrawn(count) {
        const stats = this.getGameStats();
        stats.totalCardsDrawn += count;
        return this.saveGameStats(stats);
    }

    // GESTION DU PROFIL DRESSEUR
    saveTrainerProfile(profile) {
        return this.save(this.keys.TRAINER_PROFILE, profile);
    }
    getTrainerProfile() {
        return this.load(this.keys.TRAINER_PROFILE) || {
            name: 'Dresseur', level: 1, experience: 0, badges: [], joinDate: Date.now()
        };
    }
    addExperience(points) {
        const profile = this.getTrainerProfile();
        profile.experience += points;
        const newLevel = Math.floor(profile.experience / 100) + 1;
        if (newLevel > profile.level) profile.level = newLevel;
        return this.saveTrainerProfile(profile);
    }
    addBadge(badge) {
        const profile = this.getTrainerProfile();
        if (!profile.badges.includes(badge)) {
            profile.badges.push(badge);
            return this.saveTrainerProfile(profile);
        }
        return false;
    }

    // GESTION ECHANGE carte
    markExchangeUsed() {
        return this.save(this.keys.EXCHANGE_USED, true);
    }
    isExchangeUsed() {
        return this.load(this.keys.EXCHANGE_USED) || false;
    }
    resetExchangeStatus() {
        return this.save(this.keys.EXCHANGE_USED, false);
    }
    resetDrawTimer() {
        return this.save(this.keys.LAST_DRAW, 0);
    }

    //  UTILITAIRES
    getStorageSize() {
        let total = 0;
        Object.values(this.keys).forEach(k => {
            const v = localStorage.getItem(k);
            if (v) total += v.length;
        });
        return {
            bytes: total,
            kb: Math.round(total / 1024 * 100) / 100,
            mb: Math.round(total / (1024 * 1024) * 100) / 100
        };
    }
    exportData() {
        const data = {};
        Object.entries(this.keys).forEach(([name, key]) => data[name] = this.load(key));
        return data;
    }
    importData(data) {
        try {
            Object.entries(this.keys).forEach(([name, key]) => {
                if (data[name] !== undefined) this.save(key, data[name]);
            });
            return true;
        } catch (error) {
            return false;
        }
    }
    validateData() {
        const issues = [];

        const deck = this.getDeck();
        const validIds = window.pokemonCardManager
            ? window.pokemonCardManager.getAllCards().map(card => card.id)
            : [];
        const invalidDeck = deck.filter(id => !validIds.includes(id));
        if (invalidDeck.length) issues.push(`Cartes invalides dans le deck: ${invalidDeck.join(', ')}`);

        const hand = this.getHand();
        const invalidHand = hand.filter(id => !validIds.includes(id));
        if (invalidHand.length) issues.push(`Cartes invalides dans la main: ${invalidHand.join(', ')}`);

        return { isValid: issues.length === 0, issues };
    }
    repairData() {
        const validIds = window.pokemonCardManager
            ? window.pokemonCardManager.getAllCards().map(card => card.id)
            : [];

        const deck = this.getDeck().filter(id => validIds.includes(id));
        this.saveDeck(deck);

        const hand = this.getHand().filter(id => validIds.includes(id));
        this.saveHand(hand);

        if (this.getPlayerCard() && !validIds.includes(this.getPlayerCard())) {
            this.remove(this.keys.PLAYER_CARD);
        }
        if (this.getAICard() && !validIds.includes(this.getAICard())) {
            this.remove(this.keys.AI_CARD);
        }
        return true;
    }

    showNotification(message, type = 'info') {
        if (window.app && window.app.showNotification) {
            window.app.showNotification(message, type);
        }
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = StorageManager;
}
