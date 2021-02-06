import { useState, useEffect } from 'react';
import { HashRouter, Route, Link } from "react-router-dom";
import { Home } from './components/home'
import { Speed } from './components/speed'

function App() {

	return (
		<HashRouter basename='/'>
			<div>
				<Route exact path="/" component={Home} />
				<Route path="/about" component={Speed} />
			</div>
		</HashRouter>
	);
}

export default App;
