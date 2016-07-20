import React from 'react';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';

import { isLoaded as isLoadedSearch, load as loadResults } from './Actions';
import SOQuestionsList from '../SOQuestionsList/SOQuestionsList';
import SOHot from '../SOHot/SOHot';
import { isLoaded as isLoadedHot, load as loadHot } from '../SOHot/Actions';

class SOSearch extends React.Component {
  static propTypes = {
    query: React.PropTypes.string.isRequired,
    questions: React.PropTypes.array.isRequired,
    dispatch: React.PropTypes.func.isRequired
  };

  componentWillMount() {
    if (__CLIENT__) {
      const { dispatch, query } = this.props;
      if (!(isLoadedSearch(this.props) && isLoadedHot())) {
        SOSearch.fetchData({ query }, { dispatch }).then(() => {});
        SOHot.fetchData().then(() => {});
      }
    }
  }

  static fetchData = (params, store) => {
    return Promise.all([
      store.dispatch(loadResults(params.query)),
      store.dispatch(loadHot())
    ]);
  };

  render() {
    const { dispatch, query, questions } = this.props;
    return (
      <div>
        <div className="col-md-8">
          <h3>Search StackOverflow</h3>
          <input type="text" name="search" onChange={
            (e) => {
              e.preventDefault();
              dispatch(push('/sosearch/' + e.target.value));
              dispatch(loadResults(e.target.value));
            }
          } value={query} />
          <SOQuestionsList questions={questions} />
        </div>
        <div className="col-md-4">
          <SOHot />
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state, ownProps) => (
  {
    query: ownProps.params ? ownProps.params.query : state.sosearch.data.query,
    questions: state.sosearch.data.results,
    loading: state.sosearch.loading
  }
);

export default connect(mapStateToProps)(SOSearch);
