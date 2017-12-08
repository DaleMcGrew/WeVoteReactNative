import {ReduceStore} from 'flux/utils';
import Dispatcher from '../dispatcher/Dispatcher';
import VoterGuideActions from "../actions/VoterGuideActions";
import IssueActions from "../actions/IssueActions";

class IssueStore extends ReduceStore {

  getInitialState () {
    return {
      issue_we_vote_ids_voter_is_following: [], // These are issues a particular voter is following
      issue_we_vote_ids_voter_can_follow: [], // These are issues a particular voter can follow
      issue_we_vote_ids_to_link_to_by_organization_dict: {}, // Dictionary with key: organization_we_vote_id, list: issue_we_vote_id that the organization can link to
      issue_we_vote_ids_linked_to_by_organization_dict: {}, // Dictionary with key: organization_we_vote_id, list: issue_we_vote_id that the organization is linked to
      all_cached_issues: {}, // Dictionary with key: issue_we_vote_id, and value: complete issue object
    };
  }

  getAllIssues () {
    // List of all issue objects
    return this.getState().all_cached_issues;
  }

  getIssuesVoterIsFollowing () {
    // List of issue objects the voter is already following
    return this.getIssuesFromListOfWeVoteIds(this.getState().issue_we_vote_ids_voter_is_following);
  }

  getIssuesVoterCanFollow () {
    // List of issue objects the voter can follow
    return this.getIssuesFromListOfWeVoteIds(this.getState().issue_we_vote_ids_voter_can_follow);
  }

  getIssueWeVoteIdsVoterIsFollowing () {
    return this.getState().issue_we_vote_ids_voter_is_following;
  }

  getIssuesToLinkToByOrganization (organization_we_vote_id) {
    // These are issues that an organization can link itself to, to help Voters find the organization
    let issue_we_vote_id_list_to_link_for_organization = this.getState().issue_we_vote_ids_to_link_to_by_organization_dict[organization_we_vote_id];
    if (issue_we_vote_id_list_to_link_for_organization === undefined) {
      return [];
    }
    // List of issue objects that an organization can link to
    return this.getIssuesFromListOfWeVoteIds(issue_we_vote_id_list_to_link_for_organization);
  }

  getIssuesLinkedToByOrganization (organization_we_vote_id) {
    // These are issues that an organization has linked itself to, to help Voters find the organization
    let issue_we_vote_ids_linked_to_organization = this.getState().issue_we_vote_ids_linked_to_by_organization_dict[organization_we_vote_id];
    if (issue_we_vote_ids_linked_to_organization === undefined) {
      return [];
    }
    // List of issue objects that an organization is linked to
    return this.getIssuesFromListOfWeVoteIds(issue_we_vote_ids_linked_to_organization);
  }

  getIssuesLinkedToByOrganizationCount (organization_we_vote_id) {
    // These are issues that an organization has linked itself to, to help Voters find the organization
    let issue_we_vote_ids_linked_to_organization = this.getState().issue_we_vote_ids_linked_to_by_organization_dict[organization_we_vote_id];
    if (issue_we_vote_ids_linked_to_organization === undefined) {
      return 0;
    } else {
      return issue_we_vote_ids_linked_to_organization.length;
    }
  }

  getIssuesFromListOfWeVoteIds (list_of_issue_we_vote_ids) {
    let all_cached_issues = this.getState().all_cached_issues;
    // make sure that list_of_issue_we_vote_ids has unique values
    let uniq_list_of_issue_we_vote_ids = list_of_issue_we_vote_ids.filter((value, index, self) => {
      return self.indexOf(value) === index;
    });

    let issues_list = [];
    uniq_list_of_issue_we_vote_ids.forEach(issue_we_vote_id => {
      issues_list.push(all_cached_issues[issue_we_vote_id]);
    });

    return issues_list;
  }

  reduce (state, action) {
    let issue_list;
    let organization_we_vote_id;

    // Exit if we don't have a successful response (since we expect certain variables in a successful response below)
    if (!action.res || !action.res.success)
      return {
        ...state
      };

    switch (action.type) {
      case "issueFollow":
        // When a voter follows or unfollows an issue on the ballot intro modal screen, update the voter guide list
        VoterGuideActions.voterGuidesToFollowRetrieveByIssuesFollowed();
        IssueActions.retrieveIssuesForVoter();
        return {
          ...state
        };

      case "retrieveIssuesToFollow":
        issue_list = action.res.issue_list;
        var all_cached_issues = state.all_cached_issues;
        var issue_we_vote_ids_voter_can_follow = [];
        issue_list.forEach( issue => {
          all_cached_issues[issue.issue_we_vote_id] = issue;
          issue_we_vote_ids_voter_can_follow.push(issue.issue_we_vote_id);
        });

        state.all_cached_issues = all_cached_issues;
        state.issue_we_vote_ids_voter_can_follow = issue_we_vote_ids_voter_can_follow;
        return {
          ...state
        };

      case "issuesRetrieve":
        issue_list = action.res.issue_list;
        var issue_we_vote_ids_voter_is_following = [];
        all_cached_issues = state.all_cached_issues;
        // Update issue_we_vote_ids_voter_is_following if voter_issues_only flag is set, else update the all_cached_issues
        if (action.res.voter_issues_only) {
          issue_list.forEach(issue => {
            all_cached_issues[issue.issue_we_vote_id] = issue;
            issue_we_vote_ids_voter_is_following.push(issue.issue_we_vote_id);
          });
          state.all_cached_issues = all_cached_issues;
          state.issue_we_vote_ids_voter_is_following = issue_we_vote_ids_voter_is_following;
          return {
            ...state
          };
        } else {
          issue_list.forEach(issue => {
            all_cached_issues[issue.issue_we_vote_id] = issue;
          });
          state.all_cached_issues = all_cached_issues;
          return {
            ...state
          };
        }

      case "organizationLinkToIssue":
        // When an organization is linked/unlinked to an issue, we need to refresh the linked and to_link issue lists
        organization_we_vote_id = action.res.organization_we_vote_id;
        IssueActions.retrieveIssuesToLinkForOrganization(organization_we_vote_id);
        IssueActions.retrieveIssuesLinkedForOrganization(organization_we_vote_id);
        return {
          ...state
        };

      case "issuesToLinkToForOrganization":
        console.log("IssueStore issuesToLinkToForOrganization");
        organization_we_vote_id = action.res.organization_we_vote_id;
        issue_list = action.res.issue_list;
        var issue_we_vote_ids_to_link_to_by_organization_dict = state.issue_we_vote_ids_to_link_to_by_organization_dict;
        var to_link_to_issue_list_for_one_organization = [];
        // We accumulate all issue objects in the all_cached_issues variable
        all_cached_issues = state.all_cached_issues;
        issue_list.forEach(issue => {
          all_cached_issues[issue.issue_we_vote_id] = issue;
          to_link_to_issue_list_for_one_organization.push(issue.issue_we_vote_id);
        });
        // Add the "issues to link to" to the master dict, with the organization_we_vote_id as the key
        issue_we_vote_ids_to_link_to_by_organization_dict[organization_we_vote_id] = to_link_to_issue_list_for_one_organization;

        state.all_cached_issues = all_cached_issues;
        state.issue_we_vote_ids_to_link_to_by_organization_dict = issue_we_vote_ids_to_link_to_by_organization_dict;
        return {
          ...state
        };

      case "issuesLinkedToOrganization":
        //console.log("IssueStore issuesLinkedToOrganization");
        organization_we_vote_id = action.res.organization_we_vote_id;
        issue_list = action.res.issue_list;
        console.log("IssueStore, issuesLinkedToOrganization: ", issue_list);
        var issue_we_vote_ids_linked_to_by_organization_dict = state.issue_we_vote_ids_linked_to_by_organization_dict;
        var linked_issue_list_for_one_organization = [];
        // We accumulate all issue objects in the all_cached_issues variable
        all_cached_issues = state.all_cached_issues;
        issue_list.forEach(issue => {
          all_cached_issues[issue.issue_we_vote_id] = issue;
          linked_issue_list_for_one_organization.push(issue.issue_we_vote_id);
        });
        // Add the "issues linked to orgs" to the master dict, with the organization_we_vote_id as the key
        issue_we_vote_ids_linked_to_by_organization_dict[organization_we_vote_id] = linked_issue_list_for_one_organization;

        state.all_cached_issues = all_cached_issues;
        state.issue_we_vote_ids_linked_to_by_organization_dict = issue_we_vote_ids_linked_to_by_organization_dict;
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

module.exports = new IssueStore(Dispatcher);
