import React from 'react';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';

import { isLoaded as isLoadedSearch, load as loadResults } from './Actions';
import SOQuestionsList from '../SOQuestionsList/SOQuestionsList';
import SOHot from '../SOHot/SOHot';

class SOSearch extends React.Component {
  static propTypes = {
    query: React.PropTypes.string.isRequired,
    questions: React.PropTypes.array.isRequired,
    dispatch: React.PropTypes.func.isRequired,
    loading: React.PropTypes.bool
  };

  componentWillMount() {
    const { dispatch, query } = this.props;
    if (query !== '' && !isLoadedSearch(this.props)) {
      // Remember to make it into an object
      dispatch(loadResults({ query: query }));
    }
  }

  componentWillUpdate(next) {
    if (next.query !== '' && (next.query !== this.props.query)) {
      this.props.dispatch(loadResults({ query: next.params.query }));
    }
  }

  render() {
    const { dispatch, query, questions, loading } = this.props;
    return (
      <div>
        <div className="col-md-8">
          <h3>Search StackOverflow</h3>
          <input type="text" name="search" onChange={
            (e) => {
              e.preventDefault();
              dispatch(push('/sosearch/' + e.target.value));
              dispatch(loadResults({ query: e.target.value }));
            }
          } value={query} />
          {
            (loading) ?
              <p>Loading...</p>
            :
              <SOQuestionsList questions={questions} />
          }
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
