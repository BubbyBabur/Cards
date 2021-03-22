import { HashRouter, Route, Link } from "react-router-dom";

export function Header() {
    return (
        <div className="header">
            <div className="header-link">
                <Link to='/'>HOME</Link>
            </div>
            <div className="header-link">
                <Link to='/speed'>SPEED</Link>
            </div>
        </div>
    )
}