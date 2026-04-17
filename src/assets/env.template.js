(function (window) {
  window['env'] = window['env'] || {};
  window['env']['production'] = `${PRODUCTION}`;
  window['env']['backendUrl'] = '${BACKEND_URL}';
  window['env']['capabilitiesUrl'] = '${CAPABILITIES_URL}';
  window['env']['validatorUrl'] = '${VALIDATOR_URL}';
  window['env']['oidcIssuer'] = '${OIDC_ISSUER}';
  window['env']['oidcClientId'] = '${OIDC_CLIENT_ID}';
  window['env']['oidcHttps'] = '${OIDC_HTTPS}';
  window['env']['rolesClaimName'] = '${ROLES_CLAIM_NAME}';
  window['env']['rolesMappings'] = '${ROLES_MAPPINGS}';
})(this);
