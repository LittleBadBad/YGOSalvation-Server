/*global React, ReactDOM */

class GameplayControlButton extends React.Component {

    click() {
        this.store.dispatch('CONTROL_CLICK', this.state);
    }

    render() {
        return React.createElement('button', {
            key: this.state.info.text,
            onClick: this.click.bind(this),
            style: {
                display: 'block',
                width: 'auto'
            }
        }, this.state.info.text);
    }

    constructor(store, card, info) {
        super();
        this.store = store;
        this.state = {
            card,
            info
        };
    }
}
class ControlButtons {

    hide() {
        Object.keys(this.state.zones).forEach((uid) => {
            this.state.zones[uid].state.active = false;
        });
        ReactDOM.render('', this.root);
    }


    display(list, coords) {
        const details = {
            summonable_cards: { text: 'Summon', id: 1 },
            spsummonable_cards: { text: 'Special Summon', id: 2 },
            repositionable_cards: { text: 'Flip', id: 3 },
            msetable_cards: { text: 'Set', id: 4 },
            ssetable_cards: { text: 'Set', id: 5 },
            activatable_cards: { text: 'Activate', id: 6 },
            select_options: { text: 'Select', id: 7 },
            attackable_cards: { text: 'Attack', id: 8 }
        }, elements = list.map((card) => {
            return new GameplayControlButton(this.store, card, details[card.type]).render();
        });
        console.log(this);
        ReactDOM.render(React.createElement('div', {
            style: {
                left: `${(coords.x - 15)}px`,
                top: `${(coords.y - 15)}px`,
                position: 'fixed'
            }
        }, elements), this.root);
    }

    enable(query, coords) {
        const list = [];

        Object.keys(this.state).forEach((type) => {
            const options = this.state[type],
                selectable = options.some((option) => {
                    const valid = Object.keys(option).every((prop) => {
                        return option[prop] === query[prop];
                    });
                    return valid;
                });
            if (selectable) {
                list.push({ type, card: query });
            }
        });
        this.display(list, coords);
    }



    update(newState) {
        Object.assign(this.state, newState);
    }

    constructor(store) {


        this.root = document.getElementById('actions');
        this.store = store;
        this.state = {
            summonable_cards: [],
            spsummonable_cards: [],
            repositionable_cards: [],
            msetable_cards: [],
            ssetable_cards: [],
            activatable_cards: [],
            select_options: [],
            attackable_cards: []
        };
    }
}