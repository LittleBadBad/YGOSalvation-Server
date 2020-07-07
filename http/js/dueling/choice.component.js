/*global React */

class ChoiceScreen extends React.Component {
    constructor(store, chat) {
        super();
        this.sidechat = chat;
        this.store = store;
        this.result = null;
        this.state = {
            mode: 'coin',
            result: undefined
        };
    }

    goFirst(startplayer) {
        this.store.dispatch({ action: 'START_CHOICE', player: startplayer });
    }

    rpsAnswer(answer) {
        this.store.dispatch({ action: 'RPS', answer });
    }

    turnPlayer() {
        return [React.createElement('div', { id: 'selectwhogoesfirst' }, [
            React.createElement('div', { id: 'gofirst', key: 'one', onClick: this.goFirst.bind(this, 0) }, 'Go First'),
            React.createElement('div', { id: 'gosecond', key: 'two', onClick: this.goFirst.bind(this, 1) }, 'Go Second')
        ]), React.createElement('div', { id: 'lobbychat', key: 'sidechat' }, this.sidechat.render())];
    }

    rps() {
        return [React.createElement('div', { id: 'selectwhogoesfirst' }, [
            React.createElement('div', { id: 'Rock', key: 'one', onClick: this.rpsAnswer.bind(this, 0) }, 'Rock'),
            React.createElement('div', { id: 'Paper', key: 'two', onClick: this.rpsAnswer.bind(this, 1) }, 'Paper'),
            React.createElement('div', { id: 'Scissors', key: 'three', onClick: this.rpsAnswer.bind(this, 2) }, 'Scissors')
        ]), React.createElement('div', { id: 'lobbychat', key: 'sidechat' }, this.sidechat.render())];
    }

    coin() {
        const result = (this.state.slot) ? 'heads' : 'tail';
        return [React.createElement('div', { id: 'selectwhogoesfirst' }, [
            React.createElement('div', { id: 'gofirst' }, `Flipped a coin, hoping for ${result}`)
        ]), React.createElement('div', { id: 'lobbychat', key: 'sidechat' }, this.sidechat.render())];
    }

    die() {
        return [React.createElement('div', { id: 'selectwhogoesfirst' }, [
            React.createElement('div', { id: 'gofirst' }, 'Rolling a die.')
        ]), React.createElement('div', { id: 'lobbychat', key: 'sidechat' }, this.sidechat.render())];
    }

    rpsResult() {
        return [React.createElement('div', { id: 'selectwhogoesfirst' }, [

        ]), React.createElement('div', { id: 'lobbychat', key: 'sidechat' }, this.sidechat.render())];
    }

    coinResult() {
        const side = (this.state.result[0]) ? 'heads' : 'tail',
            result = (this.state.slot) ? 'heads' : 'tail';

        return [React.createElement('div', { id: 'selectwhogoesfirst' }, [
            React.createElement('div', { id: 'gofirst', key: 'flipped' }, `Flipped ${result}.`)
        ]), React.createElement('div', { id: 'lobbychat', key: 'sidechat' }, this.sidechat.render())];
    }

    dieResult() {
        return [React.createElement('div', { id: 'selectwhogoesfirst' }, [
            React.createElement('div', { id: 'p1rolled', key: 'p1rolled' }, 'Player 1 fliped a '),
            React.createElement('div', { id: 'p2rolled', key: 'p2rolled' }, 'Go Second')
        ]), React.createElement('div', { id: 'lobbychat', key: 'sidechat' }, this.sidechat.render())];
    }

    waiting() {
        return [React.createElement('div', { id: 'selectwhogoesfirst' }, [
            React.createElement('div', { id: 'gofirst' }, 'Opponent is deciding who goes first.')
        ]), React.createElement('div', { id: 'lobbychat', key: 'sidechat' }, this.sidechat.render())];
    }


    render() {
        console.log(this.state);
        if (this.state.result) {
            switch (this.state.mode) {
                case 'turn_player':
                    return React.createElement('section', { id: 'turn_player', key: 'lobby' }, this.turnPlayer());
                case 'rps':
                    return React.createElement('section', { id: 'rps', key: 'rps' }, this.rpsResult());
                case 'coin':
                    return React.createElement('section', { id: 'coin', key: 'coin' }, this.coinResult());
                case 'die':
                    return React.createElement('section', { id: 'die', key: 'die' }, this.dieResult());
                case 'waiting':
                    return React.createElement('section', { id: 'die', key: 'die' }, this.waiting());
                default:
                    return React.createElement('section', { id: 'error', key: 'error' }, this.error.render());
            }
        }
        switch (this.state.mode) {
            case 'turn_player':
                return React.createElement('section', { id: 'turn_player', key: 'lobby' }, this.turnPlayer());
            case 'rps':
                return React.createElement('section', { id: 'rps', key: 'rps' }, this.rps());
            case 'coin':
                return React.createElement('section', { id: 'coin', key: 'coin' }, this.coin());
            case 'die':
                return React.createElement('section', { id: 'die', key: 'die' }, this.die());
            case 'waiting':
                return React.createElement('section', { id: 'die', key: 'die' }, this.waiting());
            default:
                return React.createElement('section', { id: 'error', key: 'error' }, this.error.render());
        }
    }
}
