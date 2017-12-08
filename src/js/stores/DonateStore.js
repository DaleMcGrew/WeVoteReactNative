import {ReduceStore} from 'flux/utils';
import Dispatcher from '../dispatcher/Dispatcher';

class DonateStore extends ReduceStore {

  getInitialState () {
    return {
      success: true,
    };
  }

  donation_success () {
    return this.getState().success;
  }

  donation_error () {
    return this.getState().error_message_for_voter || "";
  }

  donation_response_received () {
    return this.getState().donation_response_received;
  }

  donation_cancel_has_completed () {
    this.setState({ donation_cancel_completed: true });
  }

  donation_refund_has_completed () {
    this.setState({ donation_refund_completed: true });
  }

  donation_subscription_has_been_updated () {
    this.setState({ donation_subscription_updated: true });
  }

  reduce (state, action) {

    switch (action.type) {
      case "donationWithStripe":
        state.donation_amount = action.res.donation_amount;
        state.error_message_for_voter = action.res.error_message_for_voter;
        state.monthly_donation = action.res.monthly_donation;
        state.saved_stripe_donation = action.res.saved_stripe_donation;
        state.success = action.res.success;
        state.donation_response_received = true;
        return {
          ...state
        };

      case "error-donateRetrieve":
        console.log("error-donateRetrieve" + action);
        return {
          ...state
        };

      case "donationCancelSubscription":
        console.log("donationCancelSubscription: " + action);
        return {
          subscription_id: action.res.subscription_id,
          donation_cancel_completed: false,
        };

      case "donationRefund":
        console.log("donationRefund: " + action);
        return {
          charge: action.res.charge,
          donation_refund_completed: false,
        };

      default:
        return {
          ...state
        };
    }
  }
}

module.exports = new DonateStore(Dispatcher);
