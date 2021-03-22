import { useState, useEffect } from 'react';
import { HashRouter, Route, Link } from "react-router-dom";
import { Home } from './components/home'
import { Speed } from './components/speed'

import './css/all.css'

function App() {

	return (
		<HashRouter basename='/'>
			<div>
				<Route exact path="/" component={Home} />
				<Route path="/speed" component={Speed} />
			</div>
		</HashRouter>
	);
}

export default App;
