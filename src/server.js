import Express from 'express';
import React from 'react';
import ReactDOM from 'react-dom/server';
import config from './config';
import favicon from 'serve-favicon';
import path from 'path';
import Html from './helpers/Html';
import PrettyError from 'pretty-error';
import http from 'http';

// Server Side Rendering (SSR) stuff
import thunk from 'redux-thunk';
import { createStore, applyMiddleware, compose } from 'redux';
import {Provider} from 'react-redux';
import {match, RouterContext} from 'react-router';
import { routerMiddleware, syncHistoryWithStore } from 'react-router-redux';
import createHistory from 'react-router/lib/createMemoryHistory';

import ApiClient from './helpers/ApiClient';
import createMiddleware from './utils/createMiddleware';
import reducer from './reducer';
import routes from './routes';

//Express middleware
const pretty = new PrettyError();
const app = new Express();
const server = new http.Server(app);

app.use(favicon(path.join(__dirname, '..', 'static', 'favicon.ico')));
app.use('/rstatic', Express.static(path.join(__dirname, '..', 'static')));

app.use((req, res) => {
  if (__DEVELOPMENT__) {
    // Do not cache webpack stats: the script file would change since
    // hot module replacement is enabled in the development env
    webpackIsomorphicTools.refresh();
  }

  function hydrateOnClient() {
    res.send('<!doctype html>\n' +
      ReactDOM.renderToString(<Html assets={webpackIsomorphicTools.assets()} />)
    );
  }

  if (__DISABLE_SSR__) {
    hydrateOnClient();
    return;
  }

  // Create the store to render during SSR
  const client = new ApiClient(req);
  const memoryHistory = createHistory(req.originalUrl);
  let _finalCreateStore = compose(
    applyMiddleware(createMiddleware(client), thunk, routerMiddleware(memoryHistory))
  )(createStore);
  const store = _finalCreateStore(reducer);
  const history = syncHistoryWithStore(memoryHistory, store);

  // Match the state of the store to the router and respond
  match({ history, routes: routes(history), location: req.originalUrl }, (error, redirectLocation, renderProps) => {
    if (redirectLocation) {
      res.redirect(redirectLocation.pathname + redirectLocation.search);
    } else if (error) {
      console.error('ROUTER ERROR:', pretty.render(error));
      res.status(500);
      hydrateOnClient();
    } else if (renderProps) {
        // Parses all the fetchData static function in components
        const fetchAll = () => {
          // Uses components in renderProps and parses them
          const { components, params } = {...renderProps};
          return components.map(component => component && 
              component.fetchData instanceof Function && 
              component.fetchData(params, store, client))
              .filter(result => result && result.then instanceof Function);
        };

        // Run the promise to fetch all required data.
        Promise.all(fetchAll()).then(() => {
          // When all successfully resolved
          const component = ReactDOM.renderToString(
            <Provider store={store} key="provider">
              <RouterContext {...renderProps} />
            </Provider>
          );

          global.navigator = {userAgent: req.headers['user-agent']};

          res.status(200);

          res.send('<!DOCTYPE html>\n' +
            ReactDOM.renderToStaticMarkup(<Html assets={webpackIsomorphicTools.assets()} component={component} initialStore={store.getState()} />));
        }).catch((error) => {
          console.error('Couldn\'t fetch all data on server:', error);
        });
    } else {
      res.status(404).send('Not found');
    }
  });
});

// Listen at the server
if (config.port) {
  server.listen(config.port, config.host, (err) => {
    if (err) {
      console.error(err);
    }
    console.info('----\n==> ✅  %s is running, talking to API server.', config.app.title);
    console.info('==> 💻  Open http://%s:%s in a browser to view the app.', config.host, config.port);
  });
} else {
  console.error('==>     ERROR: No PORT environment variable has been specified');
}
