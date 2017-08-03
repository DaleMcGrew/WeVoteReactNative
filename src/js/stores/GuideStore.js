var Dispatcher = require("../dispatcher/Dispatcher");
var FluxMapStore = require("flux/lib/FluxMapStore");
import GuideActions from "../actions/GuideActions";
import SupportActions from "../actions/SupportActions";
import VoterStore from "../stores/VoterStore";

class GuideStore extends FluxMapStore {

  // The store keeps nested attributes of voter guides in all_cached_voter_guides, whereas the followed, ignoring, to_follow are just lists of ids.
  getInitialState () {
    return {
      ballot_has_guides: true,
      organization_we_vote_ids_voter_is_following: [],
      organization_we_vote_ids_followed_by_latest_organization: [], // organization_we_vote_ids_followed_by_latest_organization
      followers: [],
      followingOnTwitter: [],
      ignoring: [],
      organization_we_vote_ids_to_follow_all: [],
      organization_we_vote_ids_to_follow_ballot_items_dict: {}, // This is a dictionary with ballot_item_we_vote_id as key and list of organization we_vote_ids as value
      organization_we_vote_ids_to_follow_for_latest_ballot_item: [], // stores organization_we_vote_ids for latest ballot_item_we_vote_id
      organization_we_vote_ids_to_follow_by_issues_followed: [],
      organization_we_vote_ids_to_follow_organization_recommendations: {}, // This is a dictionary with organization_we_vote_id as key and list of organization_we_vote_id's as value
      all_cached_voter_guides: {}, // This is a dictionary with organization_we_vote_id as key and the voter_guide as value
      all_cached_organizations_followed: {}
    };
  }

  // Given a list of ids, retrieve the complete all_cached_voter_guides with all attributes and return as array
  returnVoterGuidesFromListOfIds (list_of_organization_we_vote_ids) {
    const state = this.getState();
    let filtered_voter_guides = [];
    if (list_of_organization_we_vote_ids) {
      // voterGuidesFollowedRetrieve API returns more than one voter guide per organization some times.
      let unique_organization_we_vote_id_array = list_of_organization_we_vote_ids.filter((value, index, self) => {
        return self.indexOf(value) === index;
      });
      unique_organization_we_vote_id_array.forEach(organization_we_vote_id => {
        filtered_voter_guides.push(state.all_cached_voter_guides[organization_we_vote_id]);
      });
    }
    return filtered_voter_guides;
  }

    // Given a list of ids, retrieve the complete all_cached_organizations_followed with all attributes and return as array
  returnOrganizationsFollowedFromListOfIds (list_of_organization_we_vote_ids) {
    const state = this.getState();
    let filtered_organizations_followed = [];
    if (list_of_organization_we_vote_ids) {
      // organizationsFollowedRetrieve API returns more than one voter guide per organization some times.
      let unique_organization_we_vote_id_array = list_of_organization_we_vote_ids.filter((value, index, self) => {
        return self.indexOf(value) === index;
      });
      unique_organization_we_vote_id_array.forEach(organization_we_vote_id => {
        filtered_organizations_followed.push(state.all_cached_organizations_followed[organization_we_vote_id]);
      });
    }
    return filtered_organizations_followed;
  }


  ballotHasGuides () {
    return this.getState().ballot_has_guides;
  }

  getVoterGuidesToFollowAll () {
    return this.returnVoterGuidesFromListOfIds(this.getState().organization_we_vote_ids_to_follow_all) || [];
  }

  getVoterGuidesToFollowForLatestBallotItem () {
    return this.returnVoterGuidesFromListOfIds(this.getState().organization_we_vote_ids_to_follow_for_latest_ballot_item) || [];
  }

  getVoterGuidesToFollowForBallotItemId (ballot_item_we_vote_id) {
    return this.returnVoterGuidesFromListOfIds(this.getState().organization_we_vote_ids_to_follow_ballot_items_dict[ballot_item_we_vote_id]) || [];
  }

  getVoterGuidesToFollowByIssuesFollowed () {
    return this.returnVoterGuidesFromListOfIds(this.getState().organization_we_vote_ids_to_follow_by_issues_followed) || [];
  }

  getVoterGuidesToFollowByOrganizationRecommendation (recommending_organization_we_vote_id) {
    return this.returnVoterGuidesFromListOfIds(this.getState().organization_we_vote_ids_to_follow_organization_recommendations[recommending_organization_we_vote_id]) || [];
  }

  getVoterGuidesVoterIsFollowing (){
    return this.returnVoterGuidesFromListOfIds(this.getState().organization_we_vote_ids_voter_is_following) || [];
  }

  getVoterGuidesFollowedByLatestOrganization (){
    return this.returnVoterGuidesFromListOfIds(this.getState().organization_we_vote_ids_followed_by_latest_organization) || [];
  }

  getVoterGuidesFollowingLatestOrganization (){
    return this.returnVoterGuidesFromListOfIds(this.getState().followers) || [];
  }

  followedOnTwitterList (){
    return this.returnOrganizationsFollowedFromListOfIds(this.getState().followingOnTwitter) || [];
  }

  ignoredList (){
    return this.returnVoterGuidesFromListOfIds(this.getState().ignoring);
  }

  isFollowing (we_vote_id){
    return this.getState().organization_we_vote_ids_voter_is_following.filter( existing_org_we_vote_id => { return existing_org_we_vote_id === we_vote_id; }).length > 0;
  }

  reduce (state, action) {
    let voter_guides;
    let all_cached_voter_guides;
    let id;
    let organization_we_vote_id;
    let organizations_followed_on_twitter_list;
    let all_cached_organizations_followed;

    switch (action.type) {

      case "voterAddressSave":
        if (action.res.status === "SIMPLE_ADDRESS_SAVE") {
          return state;
        } else {
          id = action.res.google_civic_election_id;
          GuideActions.retrieveGuidesToFollow(id);
          GuideActions.voterGuidesFollowedRetrieve(id);
          return state;
        }

      case "voterAddressRetrieve": // refresh guides when you change address
        id = action.res.google_civic_election_id;
        GuideActions.retrieveGuidesToFollow(id);
        GuideActions.voterGuidesFollowedRetrieve(id);
        return state;

      case "voterGuidesToFollowRetrieve":
        voter_guides = action.res.voter_guides;
        let is_empty = voter_guides.length === 0;
        let search_term_exists = action.res.search_string !== "";
        let election_id_exists = action.res.google_civic_election_id !== 0;
        let ballot_item_we_vote_id_exists = action.res.ballot_item_we_vote_id !== "";
        let filter_voter_guides_by_issue = action.res.filter_voter_guides_by_issue;

        // If no voter guides found , and it's not a search query, retrieve results for all elections
        if (is_empty && election_id_exists && !search_term_exists ) {
          GuideActions.retrieveGuidesToFollow(0);
          return state;
        }

        all_cached_voter_guides = state.all_cached_voter_guides;
        var organization_we_vote_id_list_from_voter_guides_returned = [];
        voter_guides.forEach( one_voter_guide => {
          all_cached_voter_guides[one_voter_guide.organization_we_vote_id] = one_voter_guide;
          organization_we_vote_id_list_from_voter_guides_returned.push(one_voter_guide.organization_we_vote_id);
        });

        // Now store the voter_guide information by ballot_item (i.e., which organizations have positions on each ballot_item)
        // let existing_voter_guide_ids_for_one_ballot_item;
        let updated_voter_guide_ids_for_one_ballot_item = [];
        let organization_we_vote_ids_to_follow_by_issues_followed = [];
        // Start with previous list
        let organization_we_vote_ids_to_follow_ballot_items_dict = state.organization_we_vote_ids_to_follow_ballot_items_dict;
        if (ballot_item_we_vote_id_exists) {
          // Go through each of the voter_guides that was just returned. If the existing_voter_guides does not contain
          //  that voter_guide organization_we_vote_id, then add it.
          voter_guides.forEach( one_voter_guide => {
            // Add voter guides if they don't already exist
            if (!updated_voter_guide_ids_for_one_ballot_item.includes(one_voter_guide.organization_we_vote_id)) {
              updated_voter_guide_ids_for_one_ballot_item.push(one_voter_guide.organization_we_vote_id);
            }
          });
          // And finally update new_ballot_items with all voter guide ids that can be followed
          organization_we_vote_ids_to_follow_ballot_items_dict[action.res.ballot_item_we_vote_id] = updated_voter_guide_ids_for_one_ballot_item;
          // console.log("updated_voter_guide_ids_for_one_ballot_item: ", updated_voter_guide_ids_for_one_ballot_item);

          return {
            ...state,
            ballot_has_guides: search_term_exists || election_id_exists,
            organization_we_vote_ids_to_follow_for_latest_ballot_item: updated_voter_guide_ids_for_one_ballot_item,
            organization_we_vote_ids_to_follow_ballot_items_dict: organization_we_vote_ids_to_follow_ballot_items_dict,
            all_cached_voter_guides: all_cached_voter_guides
          };
        } else {
          // Go voter_guide-by-voter_guide and add them to each ballot_item
          // We assume here that we have a complete set of voter guides, so for every ballot_item we_vote_id
          //  we bring in, we clear out all earlier organization we_vote_id's at start
          // console.log("Object.keys: ", Object.keys(organization_we_vote_ids_to_follow_ballot_items_dict));
          let ballot_items_we_are_tracking = Object.keys(organization_we_vote_ids_to_follow_ballot_items_dict);
          let current_list = [];
          let new_list = [];
          let ballot_item_we_vote_ids_this_org_supports;
          let guide_we_vote_ids_processed = [];

          voter_guides.forEach( one_voter_guide => {
            ballot_item_we_vote_ids_this_org_supports = one_voter_guide.ballot_item_we_vote_ids_this_org_supports;
            if (ballot_item_we_vote_ids_this_org_supports) {
              ballot_item_we_vote_ids_this_org_supports.forEach(one_ballot_item_we_vote_id => {
                if (ballot_items_we_are_tracking.includes(one_ballot_item_we_vote_id)) {
                  current_list = organization_we_vote_ids_to_follow_ballot_items_dict[one_ballot_item_we_vote_id];
                  current_list.push(one_voter_guide.organization_we_vote_id);
                  organization_we_vote_ids_to_follow_ballot_items_dict[one_ballot_item_we_vote_id] = current_list;
                } else {
                  new_list = [];
                  new_list.push(one_voter_guide.organization_we_vote_id);
                  organization_we_vote_ids_to_follow_ballot_items_dict[one_ballot_item_we_vote_id] = new_list;
                }
                ballot_items_we_are_tracking = Object.keys(organization_we_vote_ids_to_follow_ballot_items_dict);
              });
            }

            if (filter_voter_guides_by_issue) {
              organization_we_vote_id = one_voter_guide.organization_we_vote_id;
              if (guide_we_vote_ids_processed.indexOf(organization_we_vote_id) === -1) {
                organization_we_vote_ids_to_follow_by_issues_followed.push(one_voter_guide.organization_we_vote_id);
                guide_we_vote_ids_processed.push(organization_we_vote_id);
              }
            }
          });

          if (filter_voter_guides_by_issue) {
            return {
              ...state,
              ballot_has_guides: search_term_exists || election_id_exists,
              organization_we_vote_ids_to_follow_ballot_items_dict: organization_we_vote_ids_to_follow_ballot_items_dict,
              organization_we_vote_ids_to_follow_by_issues_followed: organization_we_vote_ids_to_follow_by_issues_followed,
              all_cached_voter_guides: all_cached_voter_guides
            };
          } else {
            // This is for when, there is a default voter guides to follow
            return {
              ...state,
              ballot_has_guides: search_term_exists || election_id_exists,
              organization_we_vote_ids_to_follow_all: organization_we_vote_id_list_from_voter_guides_returned,
              organization_we_vote_ids_to_follow_ballot_items_dict: organization_we_vote_ids_to_follow_ballot_items_dict,
              all_cached_voter_guides: all_cached_voter_guides
            };
          }

        }


      case "voterGuidesFollowedRetrieve":
        voter_guides = action.res.voter_guides;
        all_cached_voter_guides = state.all_cached_voter_guides;
        var organization_we_vote_ids_voter_is_following = [];
        voter_guides.forEach( one_voter_guide => {
          all_cached_voter_guides[one_voter_guide.organization_we_vote_id] = one_voter_guide;
          organization_we_vote_ids_voter_is_following.push(one_voter_guide.organization_we_vote_id);
        });
        return {
          ...state,
          organization_we_vote_ids_voter_is_following: organization_we_vote_ids_voter_is_following,
          all_cached_voter_guides: all_cached_voter_guides
        };

      case "voterGuidesFollowedByOrganizationRetrieve":
        voter_guides = action.res.voter_guides;
        all_cached_voter_guides = state.all_cached_voter_guides;
        var organization_we_vote_ids_followed_by_latest_organization = [];
        voter_guides.forEach( one_voter_guide => {
          all_cached_voter_guides[one_voter_guide.organization_we_vote_id] = one_voter_guide;
          organization_we_vote_ids_followed_by_latest_organization.push(one_voter_guide.organization_we_vote_id);
        });
        return {
          ...state,
          organization_we_vote_ids_followed_by_latest_organization: organization_we_vote_ids_followed_by_latest_organization,
          all_cached_voter_guides: all_cached_voter_guides
        };

      case "voterGuideFollowersRetrieve":
        voter_guides = action.res.voter_guides;
        all_cached_voter_guides = state.all_cached_voter_guides;
        var followers = [];
        voter_guides.forEach( one_voter_guide => {
          all_cached_voter_guides[one_voter_guide.organization_we_vote_id] = one_voter_guide;
          followers.push(one_voter_guide.organization_we_vote_id);
        });
        return {
          ...state,
          followers: followers,
          all_cached_voter_guides: all_cached_voter_guides
        };

      case "voterGuidesIgnoredRetrieve":
        voter_guides = action.res.voter_guides;
        all_cached_voter_guides = state.all_cached_voter_guides;
        var ignoring = [];
        voter_guides.forEach( one_voter_guide => {
          all_cached_voter_guides[one_voter_guide.organization_we_vote_id] = one_voter_guide;
          ignoring.push(one_voter_guide.organization_we_vote_id);
        });
        return {
          ...state,
          ignoring: ignoring,
          all_cached_voter_guides: all_cached_voter_guides
        };

      case "organizationsFollowedRetrieve":
        if (action.res.auto_followed_from_twitter_suggestion) {
          organizations_followed_on_twitter_list = action.res.organization_list;
          all_cached_organizations_followed = state.all_cached_organizations_followed;
          var followingOnTwitter = [];
          organizations_followed_on_twitter_list.forEach( one_organization => {
            all_cached_organizations_followed[one_organization.organization_we_vote_id] = one_organization;
            followingOnTwitter.push(one_organization.organization_we_vote_id);
          });
          }
          return {
            ...state,
            followingOnTwitter: followingOnTwitter,
            all_cached_organizations_followed: all_cached_organizations_followed
          };

      case "organizationFollow":
        organization_we_vote_id = action.res.organization_we_vote_id;
        if (action.res.organization_follow_based_on_issue) {
          GuideActions.retrieveGuidesToFollowByIssuesFollowed();  // Whenever a voter follows a new org, update list
        } else {
          GuideActions.retrieveGuidesToFollow(VoterStore.election_id());  // Whenever a voter follows a new org, update list
        }
        GuideActions.voterGuidesFollowedByOrganizationRetrieve(organization_we_vote_id);
        GuideActions.voterGuideFollowersRetrieve(organization_we_vote_id);
        SupportActions.positionsCountForAllBallotItems();  // Following one org can change the support/oppose count for many items
        return {
          ...state,
          organization_we_vote_ids_voter_is_following: state.organization_we_vote_ids_voter_is_following.concat(organization_we_vote_id),
          organization_we_vote_ids_to_follow_all: state.organization_we_vote_ids_to_follow_all.filter( existing_org_we_vote_id => { return existing_org_we_vote_id !== organization_we_vote_id; }),
          organization_we_vote_ids_to_follow_for_latest_ballot_item: state.organization_we_vote_ids_to_follow_for_latest_ballot_item.filter(existing_org_we_vote_id => {return existing_org_we_vote_id !== organization_we_vote_id; }),
          // Add organization_we_vote_ids_to_follow_for_latest_ballot_item here
          ignoring: state.ignoring.filter( existing_org_we_vote_id => { return existing_org_we_vote_id !== organization_we_vote_id; })
        };

      case "organizationStopFollowing":
        organization_we_vote_id = action.res.organization_we_vote_id;
        GuideActions.retrieveGuidesToFollow(VoterStore.election_id());  // Whenever a voter stops following an org, update list
        GuideActions.voterGuidesFollowedByOrganizationRetrieve(organization_we_vote_id);
        GuideActions.voterGuideFollowersRetrieve(organization_we_vote_id);
        SupportActions.positionsCountForAllBallotItems();
        return {
          ...state,
          organization_we_vote_ids_voter_is_following: state.organization_we_vote_ids_voter_is_following.filter( existing_org_we_vote_id => { return existing_org_we_vote_id !== organization_we_vote_id; }),
          organization_we_vote_ids_to_follow_all: state.organization_we_vote_ids_to_follow_all.concat(id)
        };

      case "organizationFollowIgnore":
        organization_we_vote_id = action.res.organization_we_vote_id;
        GuideActions.retrieveGuidesToFollow(VoterStore.election_id());  // Whenever a voter ignores an org, update list
        GuideActions.voterGuidesFollowedByOrganizationRetrieve(organization_we_vote_id);
        GuideActions.voterGuideFollowersRetrieve(organization_we_vote_id);
        return {
          ...state,
          ignoring: state.ignoring.concat(organization_we_vote_id),
          organization_we_vote_ids_to_follow_all: state.organization_we_vote_ids_to_follow_all.filter( existing_org_we_vote_id => { return existing_org_we_vote_id !== organization_we_vote_id; }),
          organization_we_vote_ids_to_follow_for_latest_ballot_item: state.organization_we_vote_ids_to_follow_for_latest_ballot_item.filter( existing_org_we_vote_id => { return existing_org_we_vote_id !== organization_we_vote_id; }),
          // Add organization_we_vote_ids_to_follow_for_latest_ballot_item here
          organization_we_vote_ids_voter_is_following: state.organization_we_vote_ids_voter_is_following.filter( existing_org_we_vote_id => { return existing_org_we_vote_id !== organization_we_vote_id; })
        };

      case "error-organizationFollowIgnore" || "error-organizationFollow":
        console.log(action);
        return state;

      default:
        return state;
    }
  }
}

module.exports = new GuideStore(Dispatcher);
