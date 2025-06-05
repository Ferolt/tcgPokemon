class StorageManager {
    static saveGameState(deckManager) {
        const state = {
            drawPile: deckManager.drawPile,
            hand: deckManager.hand,
            lastDraw: deckManager.lastDraw ? deckManager.lastDraw.getTime() : null
        };
        localStorage.setItem('pokemonTCGState', JSON.stringify(state));
    }

    static loadGameState() {
        const state = localStorage.getItem('pokemonTCGState');
        if (!state) return null;

        try {
            const parsed = JSON.parse(state);
            // Convertir les objets en instances de PokemonCard
            parsed.drawPile = parsed.drawPile.map(card => new PokemonCard(card.id, card.name, card.image, card.types, card.hp, card.attacks));
            parsed.hand = parsed.hand.map(card => new PokemonCard(card.id, card.name, card.image, card.types, card.hp, card.attacks));
            return parsed;
        } catch (e) {
            console.error('Error loading game state:', e);
            return null;
        }
    }

    static clearGameState() {
        localStorage.removeItem('pokemonTCGState');
    }
}