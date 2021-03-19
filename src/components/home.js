
import '../css/home.css'
import { Header } from './header'

export function Home() {
    return (
        <div>
            <Header />
            <HomeFront />
        </div>
    )
}

function HomeFront() {
    return (
        <div className="front">

            <img src="svg/3-H.svg" className="front-card-1 front-card" />
            <img src="svg/A-S.svg" className="front-card-2 front-card" />


            {Array(4).fill(0).map((_, i) => (
                <div className="cards-back" style={{
                    top: `calc(50% - ${225 - i * 150}px)`,
                    left: `calc(35% - ${150 - i * 100}px)`
                }} key={i} >
                    CARDS
                </div>
            ))}
            <div className="cards-title">CARDS</div>

        </div>
    )
}