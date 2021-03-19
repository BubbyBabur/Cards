import '../css/speed.css'
import { Header } from './header'

import firebase from 'firebase';
import { useEffect, useState } from 'react';


const firebaseConfig = {
    apiKey: "AIzaSyC2k_ziySptS7pmqJqwImAJ4d0kyraRG2U",
    authDomain: "games-ff9af.firebaseapp.com",
    databaseURL: "https://games-ff9af.firebaseio.com",
    projectId: "games-ff9af",
    storageBucket: "games-ff9af.appspot.com",
    messagingSenderId: "218160036645",
    appId: "1:218160036645:web:0fe8c2d8ca95709841f8cc",
    measurementId: "G-RM6TD3CLBM"
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// (async () => {
//     console.log((await db.collection("Cards").get()).docs.map(a => a.data()));
// })();

export function Speed() {
    return (
        <div>
            <Header />
            <Board />
        </div>
    )
}

class AbstractCard {

    static cardstr(num) {
        return [
            'A', '2', '3', '4',
            '5', '6', '7', '8',
            '9', '10', 'J', 'Q', 
            'K'
        ][num];
    }

    static suitstr(num) {
        return [
            'C', 'D', 'H', 'S'
        ][num];
    }

    static parseStr(str) {
        return new AbstractCard(parseInt(str.split('-')[0]), parseInt(str.split('-')[1]));
    }

    /**
     * 
     * @param {number} num 
     * @param {number} suit 
     */
    constructor(num, suit) {
        this.num = num;
        this.suit = suit;
    }

    toString() {
        return AbstractCard.cardstr(this.num) + '-' + AbstractCard.suitstr(this.suit);
    }
    
    toNumString() {
        return (this.num) + '-' + (this.suit);
    }
}

class Stack {
    constructor() {
        this.stack = [];
    }

    addTop(card) {
        this.stack = [card, ...this.stack]
    }

    addBottom(card){
        this.stack = [...this.stack, card];
    }

    drawTop() {
        return this.stack.shift();
    }

    drawBottom() {
        return this.stack.pop();
    }

    empty() {
        return this.stack.length == 0;
    }

    peekTop() {
        return this.stack[0];
    }

    peekBottom() {
        return this.stack[this.stack.length - 1];
    }

    shuffle() {
        for(let i = 0; i < this.stack.length; i++) {
            let j = Math.floor(Math.random() * this.stack.length);
            ;[this.stack[i], this.stack[j]] = [this.stack[j], this.stack[i]];
        }
    }

    size() {
        return this.stack.length;
    }

    remove(i) {
        const toreturn = this.stack[i];
        this.stack = [...this.stack.slice(0,i), ...this.stack.slice(i+1)];
        return toreturn;
    }

    peek(i) {
        return this.stack[i];
    }

    replace(i,card) {
        this.stack[i] = card;
    }
}

class Deck extends Stack {
    constructor(fromstring) {
        super();

        if(fromstring) {
            this.stack = fromstring.split(',').map(str => AbstractCard.parseStr(str));
        } else {
            for(let i = 0; i < 13; i++) {
                for(let j = 0; j < 4; j++) {
                    this.stack.push(new AbstractCard(i,j));
                }
            }
            this.shuffle();
        }
    }

    toString() {
        return this.stack.map(card => card.toNumString()).join(',');
    }
}

async function createGame() {
    let deck = new Deck();
    let data = {
        TYPE: "SPEED",
        DECK: deck.toString(),
        DOUBLES: true
    }

    const doc = await db.collection('Cards').add(data);
    for (let p = 0; p < 2; p++) {
        for (let i = 0; i < 5; i++) {
            await doc.collection('MOVES').add({
                TYPE: "DRAW",
                PLAYER: p,
                TIMESTAMP: Date.now()
            })
        }
        await doc.collection('MOVES').add({
            TYPE: "STACKDRAW",
            STACK: p,
            TIMESTAMP: Date.now()
        })
    }

    return true;
}

// createGame();

function Board() {

    const [boarddata, setboarddata] = useState({ ready: false });
    const [moves, setmoves] = useState([]);
    const [selectedcard, setselectedcard] = useState(-1);

    const deck = new Deck(boarddata.DECK);

    const hands = [new Stack(), new Stack()];
    const mids =  [new Stack(), new Stack()]

    const gameid = "Ii1WlqJeUz617iDOCsLC";

    for(const move of moves) {
        if (move.TYPE === "DRAW") {
            hands[move.PLAYER].addBottom(deck.drawTop());
        } else if (move.TYPE === "STACKDRAW") {
            if (!deck.empty()) mids[move.STACK].addTop(deck.drawTop());
        } else if (move.TYPE === "MOVE") {
            mids[move.STACK].addTop(hands[move.PLAYER].peek(move.CARD));
            if(!deck.empty()) hands[move.PLAYER].replace(move.CARD, deck.drawTop());
        } else if(move.TYPE === "FLIP") {
            mids[0].addTop(AbstractCard.parseStr(move.CARD1));
            mids[1].addTop(AbstractCard.parseStr(move.CARD2));
        }
    }

    useEffect(() =>{

        let unsub = db.collection('Cards').doc(gameid).onSnapshot((data) => {
            setboarddata({
                ready: true,
                ...data.data()
            });
            console.log("READY!")
        });

        return () => unsub();
    }, []);

    useEffect(() => {

        let unsub = db.collection('Cards').doc(gameid).collection('MOVES').onSnapshot((data) => {
            let moves = data.docs.map(doc => doc.data());
            moves = moves.sort((a, b) => a.TIMESTAMP - b.TIMESTAMP);
            setmoves(moves);
        });

        return () => unsub();
    }, []);

    useEffect(() => {

        let unsub = db.collection('Cards').doc(gameid).onSnapshot((data) => {
            setboarddata({
                ready: true,
                ...data.data()
            });
            console.log("READY!")
        });

        return () => unsub();
    }, []);

    const PLAYER = 0;

    const draw = () => {
        db.collection('Cards').doc(gameid).collection('MOVES').add({
            PLAYER,
            TYPE: 'DRAW',
            TIMESTAMP: Date.now()
        })
    }

    const possible = (carda,cardb) => {
        return Math.abs(carda.num - cardb.num) <= 1 || Math.abs(carda.num + 13 - cardb.num) <= 1 || Math.abs(carda.num - cardb.num - 13) <= 1
    }

    const move = (a,b) => {

        let cardfrom = hands[PLAYER].peek(a);
        let cardto = mids[b].peekTop();
        // if(boarddata.DOUBLES) {
        if(true){ 
            if(possible(cardfrom,cardto) ){ }
            else {
                return;
            }
        }

        db.collection('Cards').doc(gameid).collection('MOVES').add({
            PLAYER,
            CARD: a,
            STACK: b,
            TYPE: 'MOVE',
            TIMESTAMP: Date.now()
        })
        setselectedcard(-1);
    }

    const istheremove = () => {
        let thereismove = false;
        for (let i = 0; i < 2; i++) { // player
            for (let j = 0; j < 5; j++) { // card
                for (let k = 0; k < 2; k++) { // mid
                    if (possible(mids[k].peekTop(), hands[i].peek(j))) {
                        thereismove = true;
                    }
                }
            }
        }
        return thereismove;
    }

    const istheremovefor = (card) => {
        let thereismove = false;
        for (let i = 0; i < 2; i++) { // player
            for (let j = 0; j < 5; j++) { // card
                if (possible(card, hands[i].peek(j))) {
                    thereismove = true;
                }
            }
        }
        return thereismove;
    }

    if(boarddata.ready && moves.length > 0) {

        if (!istheremove() && PLAYER === 0) {
            console.log("Ruh roh, no move");

            let d = new Deck();
            let c;
            do {
                c = d.drawTop();
            } while(!istheremovefor(c))
            let c2 = d.drawTop();

            db.collection('Cards').doc(gameid).collection('MOVES').add({
                TYPE: 'FLIP',
                CARD1: c.toNumString(),
                CARD2: c2.toNumString(),
                TIMESTAMP: Date.now()
            })
        }

        return (
            <div className="board">
                <button onClick={() => move(0,0)}>Hello!</button>

                <Card card="BACK" top="50%" left="72.5%" /> {/* FLIP DECK */}
                <Card card="BACK" top="50%" left="27.5%" /> {/* FLIP DECK */}
                {Array(2).fill(0).map( (_,i) => (
                    <Card card={mids[i].peekTop().toString()} top="50%" left={`${42.5 + 15*i}%`} key={i} onClick={() => {
                        if (selectedcard !== -1) move(selectedcard, i);
                    }} />
                ))}

                {hands[PLAYER].stack.map((card, i) => (
                    <Card card={card.toString()} top="80%" left={`${25 + i * 12.5}%`} key={i} selected={i == selectedcard} onClick={() => { (selectedcard !== i) ? setselectedcard(i) : setselectedcard(-1) }} />
                ))}

                {hands[1-PLAYER].stack.map((card, i) => (
                    <Card card='BACK' top="20%" left={`${25 + i * 12.5}%`} key={i} />
                ))}
            </div>
        )
    } else {
        return (
            <div className="board">Loading...</div>
        )
    }
    
}

function Card(props) {
    return (
        <img src={`svg/${props.card}.svg`} width="10%" className={"speed-card" + (props.selected ? " speed-card-selected" : "")} style={{
            top: props.top,
            left: props.left
        }} onClick={props.onClick} />
    )
}
