class PokemonCard {
    constructor(data) {
        if (!data || !data.id || !data.name || !data.image) {
            throw new Error('Données de carte invalides');
        }
        this.id = data.id;
        this.name = data.name;
        this.type = data.type;
        this.hp = data.hp;
        this.attack = data.attack;
        this.defense = data.defense;
        this.attacks = data.attacks || [];
        this.image = data.image;
        this.holoImage = data.holoImage;
        this.rarity = data.rarity || 'common';
        this.set = data.set;
    }

    static createCardElement(cardData) {
        if (!cardData) return null;
        const card = document.createElement('div');
        card.className = `pokemon-card-holo ${cardData.rarity}`;
        card.setAttribute('data-id', cardData.id);
        card.draggable = true;
        const imageUrl = cardData.holoImage || cardData.image;
        card.innerHTML = `
            <img src="${imageUrl}" alt="${cardData.name}" loading="lazy" 
                 onerror="this.src='https://images.pokemontcg.io/base1/4_hires.png'" />
            <div class="card-overlay">
                <div class="card-info">
                    <div class="card-name">${cardData.name}</div>
                    <div class="card-set">${cardData.set || ''}</div>
                </div>
            </div>
        `;
        if (typeof VanillaTilt !== 'undefined') {
            VanillaTilt.init(card, {
                max: 25,
                speed: 400,
                glare: true,
                "max-glare": 0.8,
                scale: 1.05
            });
        }
        return card;
    }

    createElement() {
        return PokemonCard.createCardElement(this);
    }

 
    createModalElement() {
        const modalCard = this.createElement();
        modalCard.className += ' modal-card';
        modalCard.draggable = false;
        
       
        const cardFront = modalCard.querySelector('.card-front');
        if (this.attacks.length > 0) {
            const attacksHtml = this.attacks.map(attack => `
                <div class="attack-detail">
                    <span class="attack-name">${attack.name}</span>
                    <span class="attack-damage">${attack.damage}</span>
                </div>
            `).join('');
            
            cardFront.innerHTML += `
                <div class="card-attacks">
                    <h4>Attaques</h4>
                    ${attacksHtml}
                </div>
            `;
        }
        
        return modalCard;
    }

    getPowerLevel() {
        return this.hp + this.attack + this.defense;
    }

    getDetails() {
        return {
            id: this.id,
            name: this.name,
            type: this.type,
            hp: this.hp,
            attack: this.attack,
            defense: this.defense,
            attacks: this.attacks,
            emoji: this.emoji,
            rarity: this.rarity,
            powerLevel: this.getPowerLevel()
        };
    }
}

const pokemonCardsData = [

    { id: 'pikachu', name: 'Pikachu', type: 'Electric', hp: 60, attack: 55, defense: 40, image: 'https://images.pokemontcg.io/base1/58_hires.png', rarity: 'common', attacks: [{ name: 'Éclair', damage: 20 }, { name: 'Tonnerre', damage: 40 }] },
    { id: 'charmander', name: 'Salamèche', type: 'Fire', hp: 39, attack: 52, defense: 43, image: 'https://images.pokemontcg.io/base1/46_hires.png', rarity: 'common', attacks: [{ name: 'Griffe', damage: 10 }, { name: 'Flammèche', damage: 30 }] },
    { id: 'squirtle', name: 'Carapuce', type: 'Water', hp: 44, attack: 48, defense: 65, image: 'https://images.pokemontcg.io/base1/63_hires.png', rarity: 'common', attacks: [{ name: 'Charge', damage: 10 }, { name: 'Pistolet à O', damage: 25 }] },
    { id: 'bulbasaur', name: 'Bulbizarre', type: 'Grass', hp: 45, attack: 49, defense: 49, image: 'https://images.pokemontcg.io/base1/44_hires.png', rarity: 'common', attacks: [{ name: 'Charge', damage: 10 }, { name: 'Fouet Lianes', damage: 30 }] },
    { id: 'caterpie', name: 'Chenipan', type: 'Grass', hp: 45, attack: 30, defense: 35, image: 'https://images.pokemontcg.io/base1/45_hires.png', rarity: 'common', attacks: [{ name: 'Charge', damage: 10 }] },
    { id: 'pidgey', name: 'Roucool', type: 'Flying', hp: 40, attack: 45, defense: 40, image: 'https://images.pokemontcg.io/base1/57_hires.png', rarity: 'common', attacks: [{ name: 'Tornade', damage: 20 }] },
    
    
    { id: 'jigglypuff', name: 'Rondoudou', type: 'Normal', hp: 115, attack: 45, defense: 20, image: 'https://images.pokemontcg.io/base1/54_hires.png', rarity: 'uncommon', attacks: [{ name: 'Berceuse', damage: 0 }, { name: 'Roulade', damage: 30 }] },
    { id: 'psyduck', name: 'Psykokwak', type: 'Water', hp: 50, attack: 52, defense: 48, image: 'https://images.pokemontcg.io/base1/59_hires.png', rarity: 'uncommon', attacks: [{ name: 'Griffe', damage: 10 }, { name: 'Hydrocanon', damage: 35 }] },
    { id: 'abra', name: 'Abra', type: 'Psychic', hp: 25, attack: 20, defense: 15, image: 'https://images.pokemontcg.io/base1/43_hires.png', rarity: 'uncommon', attacks: [{ name: 'Téléport', damage: 0 }, { name: 'Choc Mental', damage: 25 }] },
    { id: 'machop', name: 'Machoc', type: 'Fighting', hp: 70, attack: 80, defense: 50, image: 'https://images.pokemontcg.io/base1/52_hires.png', rarity: 'uncommon', attacks: [{ name: 'Poing Karaté', damage: 25 }, { name: 'Balayage', damage: 30 }] },
    { id: 'geodude', name: 'Racaillou', type: 'Rock', hp: 40, attack: 80, defense: 100, image: 'https://images.pokemontcg.io/base1/47_hires.png', rarity: 'uncommon', attacks: [{ name: 'Jet-Pierres', damage: 20 }, { name: 'Charge', damage: 35 }] },
    
    
    { id: 'raichu', name: 'Raichu', type: 'Electric', hp: 90, attack: 90, defense: 55, image: 'https://images.pokemontcg.io/base1/14_hires.png', rarity: 'rare', attacks: [{ name: 'Éclair', damage: 30 }, { name: 'Fatal-Foudre', damage: 80 }] },
    { id: 'charizard', name: 'Dracaufeu', type: 'Fire', hp: 120, attack: 109, defense: 78, image: 'https://images.pokemontcg.io/base1/4_hires.png', rarity: 'rare', attacks: [{ name: 'Lance-Flammes', damage: 60 }, { name: 'Déflagration', damage: 120 }] },
    { id: 'blastoise', name: 'Tortank', type: 'Water', hp: 120, attack: 83, defense: 100, image: 'https://images.pokemontcg.io/base1/2_hires.png', rarity: 'rare', attacks: [{ name: 'Hydrocanon', damage: 40 }, { name: 'Hydroqueue', damage: 90 }] },
    { id: 'venusaur', name: 'Florizarre', type: 'Grass', hp: 120, attack: 82, defense: 83, image: 'https://images.pokemontcg.io/base1/15_hires.png', rarity: 'rare', attacks: [{ name: 'Fouet Lianes', damage: 45 }, { name: 'Lance-Soleil', damage: 120 }] },
    { id: 'alakazam', name: 'Alakazam', type: 'Psychic', hp: 80, attack: 50, defense: 45, image: 'https://images.pokemontcg.io/base1/1_hires.png', rarity: 'rare', attacks: [{ name: 'Choc Mental', damage: 40 }, { name: 'Psyko', damage: 80 }] },
    { id: 'gengar', name: 'Ectoplasma', type: 'Ghost', hp: 90, attack: 65, defense: 60, image: 'https://images.pokemontcg.io/fossil/5_hires.png', rarity: 'rare', attacks: [{ name: 'Léchouille', damage: 20 }, { name: 'Ball\'Ombre', damage: 60 }] },
    

    { id: 'mewtwo', name: 'Mewtwo', type: 'Psychic', hp: 150, attack: 110, defense: 90, image: 'https://images.pokemontcg.io/base1/10_hires.png', rarity: 'legendary', attacks: [{ name: 'Choc Mental', damage: 50 }, { name: 'Psyko Boost', damage: 150 }] },
    { id: 'mew', name: 'Mew', type: 'Psychic', hp: 120, attack: 100, defense: 100, image: 'https://images.pokemontcg.io/wizpromos/9_hires.png', rarity: 'legendary', attacks: [{ name: 'Métronome', damage: 40 }, { name: 'Transformation', damage: 0 }] },
    { id: 'dragonite', name: 'Dracolosse', type: 'Dragon', hp: 140, attack: 134, defense: 95, image: 'https://images.pokemontcg.io/fossil/4_hires.png', rarity: 'legendary', attacks: [{ name: 'Ouragan', damage: 60 }, { name: 'Colère du Dragon', damage: 130 }] },
    { id: 'articuno', name: 'Artikodin', type: 'Ice', hp: 125, attack: 85, defense: 100, image: 'https://images.pokemontcg.io/fossil/2_hires.png', rarity: 'legendary', attacks: [{ name: 'Laser Glace', damage: 50 }, { name: 'Blizzard', damage: 120 }] },
    { id: 'zapdos', name: 'Électhor', type: 'Electric', hp: 125, attack: 90, defense: 85, image: 'https://images.pokemontcg.io/fossil/15_hires.png', rarity: 'legendary', attacks: [{ name: 'Éclair', damage: 40 }, { name: 'Fatal-Foudre', damage: 130 }] },
    { id: 'moltres', name: 'Sulfura', type: 'Fire', hp: 125, attack: 100, defense: 90, image: 'https://images.pokemontcg.io/fossil/12_hires.png', rarity: 'legendary', attacks: [{ name: 'Lance-Flammes', damage: 60 }, { name: 'Ciel Ardent', damage: 140 }] }
];

class PokemonCardManager {
    constructor() {
        this.allCards = [];
        this.cardMap = new Map();
        this.isLoading = false;
        this.initialized = false;
        this.initializeCards();
    }

    async initializeCards() {
        if (this.isLoading || this.initialized) return;
        this.isLoading = true;

        try {

            const apiCards = await window.pokemonTCGService.fetchRandomCards(50);
            
            this.allCards = apiCards.map(data => new PokemonCard(data));
            this.cardMap.clear();
            
            this.allCards.forEach(card => {
                this.cardMap.set(card.id, card);
            });

            this.initialized = true;

        } catch (error) {

        } finally {
            this.isLoading = false;
        }
    }

    
    async waitForInitialization() {
        while (!this.initialized && this.isLoading) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        return this.initialized;
    }

    async getCardById(id) {
        await this.waitForInitialization();
        return this.cardMap.get(id);
    }

   
    async getAllCards() {
        await this.waitForInitialization();
        return [...this.allCards];
    }

   
    async getCardsByRarity(rarity) {
        await this.waitForInitialization();
        return this.allCards.filter(card => card.rarity === rarity);
    }

  
    async getCardsByType(type) {
        await this.waitForInitialization();
        return this.allCards.filter(card => card.type === type);
    }


    async generateRandomDeck(size = 50) {
        await this.waitForInitialization();
        
        if (this.allCards.length === 0) {
            console.warn('Aucune carte disponible pour générer un deck');
            return [];
        }

        const deck = [];
        const availableCards = [...this.allCards];
        

        this.shuffleArray(availableCards);
        

        const neededCards = Math.min(size, availableCards.length);
        for (let i = 0; i < neededCards; i++) {
            deck.push(availableCards[i % availableCards.length].id);
        }

        return this.shuffleArray(deck);
    }


    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }
}

window.pokemonCardManager = new PokemonCardManager();