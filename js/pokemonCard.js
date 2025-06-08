class PokemonCard {
    constructor(id, name, image, types, hp, attacks) {
        this.id = id;
        this.name = name;
        this.image = image;
        this.types = types;
        this.hp = hp;
        this.attacks = attacks || [];
    }

    getTypeColor() {
        const typeColors = {
            'fire': 'var(--fire)',
            'water': 'var(--water)',
            'grass': 'var(--grass)',
            'lightning': 'var(--electric)',
            'psychic': 'var(--psychic)',
            'fighting': 'var(--fighting)',
            'metal': 'var(--metal)',
            'fairy': 'var(--fairy)',
            'dragon': 'var(--dragon)',
            'poison': 'var(--poison)',
            'bug': 'var(--bug)',
            'rock': 'var(--rock)',
            'ground': 'var(--ground)',
            'ghost': 'var(--ghost)',
            'ice': 'var(--ice)',
            'flying': 'var(--flying)',
            'darkness': 'var(--darkness)'
        };
        
        const mainType = this.types[0].toLowerCase();
        return typeColors[mainType] || 'var(--normal)';
    }

    getAttackDamage() {
        if (this.attacks.length === 0) return 10;
        return this.attacks[0].damage ? parseInt(this.attacks[0].damage.replace(/\D/g, '')) || 10 : 10;
    }
}
