import Dispatcher from "../dispatcher/Dispatcher";

module.exports = {
  candidateRetrieve: function (we_vote_id) {
    Dispatcher.loadEndpoint("candidateRetrieve", {candidate_we_vote_id: we_vote_id});
  },

  positionListForBallotItem: function (we_vote_id) {
    Dispatcher.loadEndpoint("positionListForBallotItem", { ballot_item_we_vote_id: we_vote_id, kind_of_ballot_item: "CANDIDATE"} );
  }
};
