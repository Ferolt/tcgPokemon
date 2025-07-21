
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

    //init des données par defaut si n'existent pas
     
    initializeDefaultData() {
        const deck = this.getDeck();
        if (!deck) {
            
            const initialDeck = window.pokemonCardManager ? window.pokemonCardManager.getAllCards().map(card => card.id) : [];
            this.saveDeck(initialDeck);
        }

        const hand = this.getHand();
        if (!hand) {
            this.saveHand([]);
        }

        if (!this.getBattleHistory()) {
            this.saveBattleHistory([]);
        }

        if (!this.getRatingHistory()) {
            this.saveRatingHistory([]);
        }

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
        } catch (e) {
            alert('Erreur lors de l\'enregistrement dans le stockage local.');
        }
    }

    // recup valeur du localstorage 
     
    load(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            alert('Erreur d\'accès au stockage local.');
            return null;
        }
    }

    // supp valeur 
    remove(key) {
        try {
            localStorage.removeItem(key);
        } catch (e) {
            alert('Erreur lors de la suppression dans le stockage local.');
        }
    }

    // vider lelocalStorage du jeu
     
    clearAll() {
        try {
            Object.values(this.keys).forEach(key => {
                localStorage.removeItem(key);
            });
            this.initializeDefaultData();
            return true;
        } catch (error) {

            return false;
        }
    }

    // GESTION DU DECK 

    // sauvgarde
    saveDeck(deck) {
        return this.save(this.keys.DECK, deck);
    }

    //recuperation
    getDeck() {
        return this.load(this.keys.DECK) || [];
    }

    // remove deck 
    removeFromDeck(cardIds) {
        const deck = this.getDeck();
        const updatedDeck = deck.filter(id => !cardIds.includes(id));
        return this.saveDeck(updatedDeck);
    }

    
    addToDeck(cardIds) {
        const deck = this.getDeck();
        const updatedDeck = [...deck, ...cardIds];
        return this.saveDeck(updatedDeck);
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
        const updatedHand = [...hand, ...cardIds];
        return this.saveHand(updatedHand);
    }

    // retir une carte de la main
    removeFromHand(cardId) {
        const hand = this.getHand();
        const updatedHand = hand.filter(id => id !== cardId);
        return this.saveHand(updatedHand);
    }

    // GESTION DU TIMER

  
    saveLastDrawTime() {
        return this.save(this.keys.LAST_DRAW, Date.now());
    }

 
    getLastDrawTime() {
        return this.load(this.keys.LAST_DRAW) || 0;
    }

    // verifier si 5 minutes écouler
     
    canDraw() {
        const lastDraw = this.getLastDrawTime();
        const now = Date.now();
        const fiveMinutes = 5 * 60 * 1000; 
        
        return (now - lastDraw) >= fiveMinutes;
    }

  
    getTimeUntilNextDraw() {
        const lastDraw = this.getLastDrawTime();
        const now = Date.now();
        const fiveMinutes = 5 * 60 * 1000;
        const timeLeft = fiveMinutes - (now - lastDraw);
        
        return Math.max(0, timeLeft);
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

    // effacer les cartes dans le combat
    
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
        const newBattle = {
            ...battle,
            timestamp: Date.now(),
            id: Date.now() + Math.random()
        };
        
        history.unshift(newBattle); 
        
        if (history.length > 50) {
            history.splice(50);
        }
        
        return this.saveBattleHistory(history);
    }

    //  GESTION HISTORIQUE DES NOTATIONS 


    saveRatingHistory(history) {
        return this.save(this.keys.RATING_HISTORY, history);
    }


    getRatingHistory() {
        return this.load(this.keys.RATING_HISTORY) || [];
    }

  
    addRatingToHistory(rating) {
        const history = this.getRatingHistory();
        const newRating = {
            ...rating,
            id: Date.now() + Math.random()
        };
        
        history.unshift(newRating); 
        
        
        if (history.length > 100) {
            history.splice(100);
        }
        
        return this.saveRatingHistory(history);
    }

 
    getRatingStats() {
        const ratings = this.getRatingHistory();
        
        if (ratings.length === 0) {
            return {
                totalRatings: 0,
                averageRating: 0,
                ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
            };
        }
        
        const totalRatings = ratings.length;
        const sum = ratings.reduce((acc, rating) => acc + rating.rating, 0);
        const averageRating = Math.round((sum / totalRatings) * 10) / 10;
        
        const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        ratings.forEach(rating => {
            ratingDistribution[rating.rating]++;
        });
        
        return {
            totalRatings,
            averageRating,
            ratingDistribution
        };
    }

    // GESTION STATISTIQUES


    saveGameStats(stats) {
        return this.save(this.keys.GAME_STATS, stats);
    }


    getGameStats() {
        return this.load(this.keys.GAME_STATS) || {
            totalGames: 0,
            wins: 0,
            losses: 0,
            draws: 0,
            totalCardsDrawn: 0,
            favoriteType: null,
            winRate: 0
        };
    }

    updateStatsAfterBattle(result) {
        const stats = this.getGameStats();
        
        stats.totalGames++;
        
        switch (result) {
            case 'win':
                stats.wins++;
                break;
            case 'loss':
                stats.losses++;
                break;
            case 'draw':
                stats.draws++;
                break;
        }
        
       
        stats.winRate = stats.totalGames > 0 ? 
            Math.round((stats.wins / stats.totalGames) * 100) : 0;
        
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
            name: 'Dresseur',
            level: 1,
            experience: 0,
            badges: [],
            joinDate: Date.now()
        };
    }


    addExperience(points) {
        const profile = this.getTrainerProfile();
        profile.experience += points;
        
       
        const newLevel = Math.floor(profile.experience / 100) + 1;
        if (newLevel > profile.level) {
            profile.level = newLevel;
           
        }
        
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

    // verifier si l'échange a été utiliser pour cette main
     
    isExchangeUsed() {
        return this.load(this.keys.EXCHANGE_USED) || false;
    }


    resetExchangeStatus() {
        return this.save(this.keys.EXCHANGE_USED, false);
    }

    // réinitialiser timer pour une nouvelle partie
     
    resetDrawTimer() {
        return this.save(this.keys.LAST_DRAW, 0);
    }

    //  UTILITAIRES 


    getStorageSize() {
        let total = 0;
        
        Object.values(this.keys).forEach(key => {
            const value = localStorage.getItem(key);
            if (value) {
                total += value.length;
            }
        });
        
        return {
            bytes: total,
            kb: Math.round(total / 1024 * 100) / 100,
            mb: Math.round(total / (1024 * 1024) * 100) / 100
        };
    }

   
    exportData() {
        const data = {};
        
        Object.entries(this.keys).forEach(([name, key]) => {
            data[name] = this.load(key);
        });
        
        return data;
    }

  
    importData(data) {
        try {
            Object.entries(this.keys).forEach(([name, key]) => {
                if (data[name] !== undefined) {
                    this.save(key, data[name]);
                }
            });
            return true;
        } catch (error) {

            return false;
        }
    }

 
    validateData() {
        const issues = [];
        
     
        const deck = this.getDeck();
        const validIds = window.pokemonCardManager ? window.pokemonCardManager.getAllCards().map(card => card.id) : [];
        const invalidDeckCards = deck.filter(id => !validIds.includes(id));
        if (invalidDeckCards.length > 0) {
            issues.push(`Cartes invalides dans le deck: ${invalidDeckCards.join(', ')}`);
        }
        
      
        const hand = this.getHand();
        const invalidHandCards = hand.filter(id => !validIds.includes(id));
        if (invalidHandCards.length > 0) {
            issues.push(`Cartes invalides dans la main: ${invalidHandCards.join(', ')}`);
        }
        return {
            isValid: issues.length === 0,
            issues
        };
    }

    repairData() {
        const validIds = window.pokemonCardManager ? window.pokemonCardManager.getAllCards().map(card => card.id) : [];
        const deck = this.getDeck();
        const cleanDeck = deck.filter(id => validIds.includes(id));
        if (cleanDeck.length !== deck.length) {
            this.saveDeck(cleanDeck);
        }
        const hand = this.getHand();
        const cleanHand = hand.filter(id => validIds.includes(id));
        if (cleanHand.length !== hand.length) {
            this.saveHand(cleanHand);
        }
        const playerCard = this.getPlayerCard();
        const aiCard = this.getAICard();
        if (playerCard && !validIds.includes(playerCard)) {
            this.remove(this.keys.PLAYER_CARD);
        }
        if (aiCard && !validIds.includes(aiCard)) {
            this.remove(this.keys.AI_CARD);
        }
        return true;
    }
}