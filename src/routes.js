import React from 'react';
import {Router, Route, IndexRoute, Redirect} from 'react-router';

import {load as loadResults} from './components/SOSearch/Actions';
import {load as loadHot} from './components/SOHot/Actions';

// Load components
import { Layout, Example, SOSearch } from './components';

// Main routes
const routes = (history) => {
  return (
    <Router history={history}>
      {/* Show header component on all pages of it's child. */}
      <Route path="/" component={Layout}>
        <IndexRoute component={Example} serverDispatch={[loadResults, loadHot]} />
        <Route path="sosearch/:query" component={SOSearch} serverDispatch={[loadResults, loadHot]}/>
      </Route>
      <Redirect from="*" to="/"/>
    </Router>
  );
};

export default routes;