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


export function Speed(props) {

    let code = (props.location.search.replace(/\?/g,''));
    if(code.length < 1) {
        return Selector(props);
    }
    return (
        <div>
            <Header />
            <Board code={code} />
        </div>
    )
}

function Selector(props) {

    const [val, setVal] = useState("");
    const [loading, setLoading] = useState(false);

    let a = <StupidReactInputHolder setVal={setVal} />
    
    if(loading) {
        return (
            <div>
                <Header />
                <div className="speed-reg">Loading ya poop!</div>
            </div>
        )
    }
    return (
        <div>
            <Header />
            {a}
            <button onClick={() => {
                console.log(val);
                window.location.href = window.location.href.replace(/\?/g, '') + "?" + val;
            }}>JOIN</button>
            <button onClick={async () => {
                setLoading(true);
                const id = await createGame();
                window.location.href = window.location.href.replace(/\?/g, '') + "?" + id;
            }}>CREATE</button>
        </div>
    )
}

function StupidReactInputHolder({setVal}) {

    return <input onChange={(event) => {
        setVal(event.target.value);
    }} />
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
        DECK0: new Deck().toString(),
        DECK1: new Deck().toString(),
        DOUBLES: true,
        JOINED0: false,
        JOINED1: false
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
            CARD: new Deck().drawTop().toNumString(),
            TIMESTAMP: Date.now()
        })
    }

    return doc.id;
}

function Board({code}) {

    const [boarddata, setboarddata] = useState({ ready: false });
    const [moves, setmoves] = useState([]);
    const [selectedcard, setselectedcard] = useState(-1);
    const [connected, setconnected] = useState({PLAYER: 0, CONNECTED: false});

    const PLAYER = connected.PLAYER;
    const [bfruh, setbfruh] = useState(false);

    const gameid = code;
    
    // const deck = new Deck(boarddata.DECK);
    const decks = [new Deck(boarddata.DECK0), new Deck(boarddata.DECK1)];

    const hands = [new Stack(), new Stack()];
    const mids =  [new Stack(), new Stack()]

    useEffect(() => {
       
        db.collection('Cards').doc(gameid).get().then(async (data) => {
            if (!data.exists) setbfruh(true);

            console.log("RESETTING");
            // console.log(data.data());
            let p = 0;
            if (!data.data().JOINED0) {
                p = 0;
                db.collection('Cards').doc(gameid).update({
                    JOINED0: true
                })
            } else if (!data.data().JOINED1) {
                p = 1;
                db.collection('Cards').doc(gameid).update({
                    JOINED1: true
                })
            } else {
                p=2;
            }

            console.log("GOOD!");
            setconnected({
                CONNECTED: true,
                PLAYER: p
            });
            console.log("GOOD PAST!");
            console.log(connected);
        }).catch((err) => {
            setbfruh(true);
        })

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

    useEffect(() => {

        let unsub = db.collection('Cards').doc(gameid).collection('MOVES').onSnapshot((data) => {
            let moves = data.docs.map(doc => doc.data());
            moves = moves.sort((a, b) => a.TIMESTAMP - b.TIMESTAMP);
            console.log("#2")
            setmoves(moves);
        });

        return () => unsub();
    }, []);

    if(bfruh) {
        return <div className="speed-reg">What have you done child <br /> The game ID you entered wasn't found!</div>
    }

    if(!connected.CONNECTED) {
        return <div className="speed-reg">Patience young padawan</div>
    }

    console.log( connected);

    let gamewon = false;
    let winner = -1;

    let count = 0;
    for(const move of moves) {

        if (move.TYPE === "DRAW") {
            hands[move.PLAYER].addBottom(decks[move.PLAYER].drawTop());
        } else if (move.TYPE === "STACKDRAW") {
            mids[move.STACK].addTop(AbstractCard.parseStr(move.CARD));
        } else if (move.TYPE === "MOVE") {
            mids[move.STACK].addTop(hands[move.PLAYER].peek(move.CARD));
            if (!decks[move.PLAYER].empty()) hands[move.PLAYER].replace(move.CARD, decks[move.PLAYER].drawTop());
            else hands[move.PLAYER].remove(move.CARD);
        } else if(move.TYPE === "FLIP") {
            mids[0].addTop(AbstractCard.parseStr(move.CARD1));
            mids[1].addTop(AbstractCard.parseStr(move.CARD2));
        }

        count++;

        if(count < 12) continue;

        for(let i = 0; i < 2; i++) {
            if(hands[i].size() === 0) {
                // i won!
                gamewon = true;
                winner = i;
            }
        }

        if(gamewon) break;
    }

    // console.log(winner);

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
            for (let j = 0; j < hands[i].size(); j++) { // card
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
            for (let j = 0; j < hands[i].size(); j++) { // card
                if (possible(card, hands[i].peek(j))) {
                    thereismove = true;
                }
            }
        }
        return thereismove;
    }

    if(boarddata.ready && moves.length > 0) {


        if(!boarddata.JOINED1) {
            return (
                <div className="waiting">
                    Wait for someone to join! <br />
                    The Game ID is {gameid}, or just send them the link <br /> {window.location.href} <br />
                    Reloading will lose your progress!
                </div>
            )
        }
        if(winner >= 0 || PLAYER === 2) {
            let focused = PLAYER === 2 ? 0 : PLAYER;
            return (
                <div className="board">

                    <Card card="BACK" top="50%" left="72.5%" /> {/* FLIP DECK */}
                    <Card card="BACK" top="50%" left="27.5%" /> {/* FLIP DECK */}
                    {Array(2).fill(0).map((_, i) => (
                        <Card card={mids[i].peekTop().toString()} top="50%" left={`${42.5 + 15 * i}%`} key={i} />
                    ))}

                    {hands[focused].stack.map((card, i) => (
                        <Card card={card.toString()} top="80%" left={`${25 + i * 12.5}%`} key={i} />
                    ))}

                    {hands[1 - focused].stack.map((card, i) => (
                        <Card card='BACK' top="20%" left={`${25 + i * 12.5}%`} key={i} />
                    ))}

                    <div className="me">PLAYER {focused + 1}</div>
                    <div className="me-num">{decks[focused].size()}</div>
                    <div className="them">PLAYER {1 - focused + 1}</div>
                    <div className="them-num">{decks[1-focused].size()}</div>
                    <div className="you">{PLAYER >= 2 ? "You are spectating" : `You are Player ${PLAYER+1}`}</div>
                    {winner >= 0 ? (
                        <div className="winner">
                            WINNER: PLAYER {winner+1}
                        </div>
                    ) : ''}
                </div>
            )
        } else { 

            if (!istheremove() && PLAYER === 0) {
                console.log("Ruh roh, no move");

                let d = new Deck();
                let c;
                do {
                    c = d.drawTop();
                } while (!istheremovefor(c))
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

                    <Card card="BACK" top="50%" left="72.5%" /> {/* FLIP DECK */}
                    <Card card="BACK" top="50%" left="27.5%" /> {/* FLIP DECK */}
                    {Array(2).fill(0).map((_, i) => (
                        <Card card={mids[i].peekTop().toString()} top="50%" left={`${42.5 + 15 * i}%`} key={i} onClick={() => {
                            if (selectedcard !== -1) move(selectedcard, i);
                        }} />
                    ))}

                    {hands[PLAYER].stack.map((card, i) => (
                        <Card card={card.toString()} top="80%" left={`${25 + i * 12.5}%`} key={i} selected={i == selectedcard} onClick={() => { (selectedcard !== i) ? setselectedcard(i) : setselectedcard(-1) }} />
                    ))}

                    {hands[1 - PLAYER].stack.map((card, i) => (
                        <Card card='BACK' top="20%" left={`${25 + i * 12.5}%`} key={i} />
                    ))}

                    <div className="me">PLAYER {PLAYER + 1}</div>
                    <div className="me-num">{decks[PLAYER].size()}</div>
                    <div className="them">PLAYER {1 - PLAYER + 1}</div>
                    <div className="them-num">{decks[1 - PLAYER].size()}</div>

                    <div className="you">{PLAYER >= 2 ? "You are spectating" : `You are Player ${PLAYER + 1}`} <br />
                    Link to Spectate is {window.location.href}</div>
                </div>
            )
        }
    } else {
        return (
            <div className="board speed-reg">Loading...</div>
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
