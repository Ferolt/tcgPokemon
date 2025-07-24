/**
 * api  pokemontcg.io
 */
class PokemonTCGService {
    constructor() {
        this.baseURL = 'https://api.pokemontcg.io/v2';
        this.holoBaseURL = 'https://poke-holo.simey.me';
        this.cache = new Map();
        this.sets = ['base1', 'fossil', 'jungle', 'base2']; 
        this.headers   = {
                 'X-Api-Key': '5db3110c-5665-481c-910f-42883c62509a'
               };
    }

    // recuperation carte aleatoire ia
    async fetchRandomCards(count = 50) {
        try {

            const allCards = [];
            
           
            for (const setId of this.sets) {

                
                const response = await fetch(`${this.baseURL}/cards?q=set.id:${setId}&pageSize=20`);
                { headers: this.headers }
                if (!response.ok) throw new Error(`Erreur API: ${response.status}`);
                const data = await response.json();
                if (data.data && data.data.length > 0) {
                    allCards.push(...data.data);
                }
            }

          
            const shuffled = this.shuffleArray(allCards);
            const selectedCards = shuffled.slice(0, count);
            

            const gameCards = selectedCards.map(card => this.convertAPICardToGameCard(card));
            


            return gameCards;
            
        } catch (error) {

            return this.getFallbackCards();
        }
    }


    convertAPICardToGameCard(apiCard) {
    
        let rarity = 'common';
        if (apiCard.rarity) {
            const rarityLower = apiCard.rarity.toLowerCase();
            if (rarityLower.includes('rare') || rarityLower.includes('holo')) {
                rarity = 'rare';
            }
            if (rarityLower.includes('legendary') || rarityLower.includes('promo')) {
                rarity = 'legendary';
            }
        }


        const hp = apiCard.hp ? parseInt(apiCard.hp) : Math.floor(Math.random() * 50) + 30;
        const attack = this.extractAttackValue(apiCard);
        const defense = Math.floor(Math.random() * 30) + 20;

        const attacks = apiCard.attacks ? apiCard.attacks.map(att => ({
            name: att.name,
            damage: att.damage ? parseInt(att.damage.replace(/\D/g, '')) || 20 : 20
        })).slice(0, 2) : [{ name: 'Attaque', damage: 20 }];

        return {
            id: apiCard.id,
            name: apiCard.name,
            type: apiCard.types ? apiCard.types[0] : 'Normal',
            hp: hp,
            attack: attack,
            defense: defense,
            image: apiCard.images?.large || apiCard.images?.small || 'https://images.pokemontcg.io/base1/4_hires.png',
            holoImage: apiCard.images?.large || apiCard.images?.small || 'https://images.pokemontcg.io/base1/4_hires.png',
            rarity: rarity,
            attacks: attacks,
            set: apiCard.set ? apiCard.set.name : 'Base Set'
        };
    }

    
    extractAttackValue(apiCard) {
        if (apiCard.attacks && apiCard.attacks.length > 0) {
            const damages = apiCard.attacks
                .map(att => att.damage ? parseInt(att.damage.replace(/\D/g, '')) : 0)
                .filter(dmg => dmg > 0);
            
            if (damages.length > 0) {
                return Math.floor(damages.reduce((a, b) => a + b, 0) / damages.length);
            }
        }
        return Math.floor(Math.random() * 40) + 20;
    }

    
    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    // carte secours cas echec api
    getFallbackCards() {
        return [
            {
                id: 'pikachu-fallback',
                name: 'Pikachu',
                type: 'Electric',
                hp: 60,
                attack: 55,
                defense: 40,
                image: 'https://images.pokemontcg.io/base1/58_hires.png',
                holoImage: 'https://poke-holo.simey.me/base1-58.webp',
                rarity: 'common',
                attacks: [{ name: 'Éclair', damage: 20 }],
                set: 'Base Set'
            },
            {
                id: 'charizard-fallback',
                name: 'Charizard',
                type: 'Fire',
                hp: 120,
                attack: 100,
                defense: 78,
                image: 'https://images.pokemontcg.io/base1/4_hires.png',
                holoImage: 'https://poke-holo.simey.me/base1-4.webp',
                rarity: 'rare',
                attacks: [{ name: 'Lance-Flammes', damage: 60 }],
                set: 'Base Set'
            }
        ];
    }

    //recuperation par id
    async fetchCardById(cardId) {
        try {
            if (this.cache.has(cardId)) {
                return this.cache.get(cardId);
            }

            const response = await fetch(`${this.baseURL}/cards/${cardId}`);
            { headers: this.headers }
            if (!response.ok) throw new Error(`Carte non trouvée: ${cardId}`);
            
            const data = await response.json();
            const gameCard = this.convertAPICardToGameCard(data.data);
            
            this.cache.set(cardId, gameCard);
            return gameCard;
            
        } catch (error) {

            return null;
        }
    }

    // carte par nom
    async searchCards(query, limit = 10) {
        try {
            const response = await fetch(`${this.baseURL}/cards?q=name:${query}*&pageSize=${limit}`);
            { headers: this.headers }
            if (!response.ok) throw new Error(`Erreur de recherche: ${response.status}`);
            
            const data = await response.json();
            return data.data.map(card => this.convertAPICardToGameCard(card));
            
        } catch (error) {

            return [];
        }
    }
}

window.pokemonTCGService = new PokemonTCGService();