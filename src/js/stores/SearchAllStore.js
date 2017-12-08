import {ReduceStore} from 'flux/utils';
import Dispatcher from '../dispatcher/Dispatcher';
import assign from 'object-assign';

class SearchAllStore extends ReduceStore {

  getInitialState () {
    return {
      success: true,
    };
  }

  getSearchResults (){
    return this.getState().search_results_new || [];
  }

  getTextFromSearchField (){
    return this.getState().text_from_search_field || "";
  }

  getForceClosed (){
    return this.getState().force_closed;
  }

  isRecentSearch (){
    return this.getState().search_type === "RECENT_SEARCH";
  }

  isRelatedSearch (){
    return this.getState().search_type === "RELATED_SEARCH";
  }

  isSearchInProgress (){
    return true;
    // return this.getState().search_type === "SEARCH_IN_PROGRESS";
  }

  reduce (state, action) {
    switch (action.type) {
      case "exitSearch":
        return assign({}, state, {forceClosed: true});
      case "searchAll":
        // Exit if we don't have a successful response (since we expect certain variables in a successful response below)
        if (!action.res || !action.res.success)
          return {
            ...state
          };

        let searchResults = [];
        let alreadyFoundTwitterHandles = [];
        let twitter_handle;
        let alreadyContains;
        action.res.search_results.forEach(one_search_result =>{
          alreadyContains = false;
          twitter_handle = one_search_result.twitter_handle || "";
          if (twitter_handle && twitter_handle !== "") {
            alreadyContains = alreadyFoundTwitterHandles.indexOf(twitter_handle.toLowerCase()) > -1;
          }
          if (!alreadyContains) {
            searchResults.push(one_search_result);
            alreadyFoundTwitterHandles.push(twitter_handle.toLowerCase());
          }
        });
        return {
          //text_from_search_field: action.res.text_from_search_field,
          search_results_new: searchResults,
        };

      case "error-searchAll":
        console.log(action);
        return {
          ...state
        };

      default:
        return {
          ...state
        };
    }
  }
}

module.exports = new SearchAllStore(Dispatcher);
