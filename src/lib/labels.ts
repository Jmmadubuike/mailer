const ACTION_LABELS: Record<string, string> = {
  "auth.login": "Signed in",
  "auth.password_reset": "Reset their password",
  "user.password_reset": "Changed a team member's password",
  "campaign.created": "Created a campaign",
  "campaign.updated": "Updated a campaign",
  "campaign.cancelled": "Cancelled a campaign",
  "campaign.duplicated": "Duplicated a campaign",
  "campaign.deleted": "Deleted a campaign",
  "campaign.queued": "Queued a campaign for sending",
  "campaign.dispatch_failed": "A campaign failed to send",
  "campaign.test_sent": "Sent a test email",
  "sending_domain.created": "Added a sending domain",
  "sending_domain.updated": "Updated a sending domain",
  "sending_domain.activated": "Turned a sending domain on",
  "sending_domain.deactivated": "Turned a sending domain off",
  "sending_domain.emergency_stopped": "Emergency-stopped a sending domain",
  "sending_domain.emergency_stop_cleared": "Cleared an emergency stop",
  "sending_domain.verification_triggered": "Requested domain verification",
  "sending_domain.connectivity_test": "Sent a connectivity test email",
  "contacts.imported": "Imported contacts",
  "suppression.removed": "Removed a contact from the suppression list",
  "contact.unsubscribed": "A contact unsubscribed",
};

export function actionLabel(action: string): string {
  return ACTION_LABELS[action] ?? humanizeToken(action);
}

export function humanizeToken(value: string): string {
  return value
    .replace(/[._]+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}
