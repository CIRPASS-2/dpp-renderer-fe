(function (window) {
  window['env'] = window['env'] || {};
  window['env']['backendUrl'] = 'http://localhost:8085';
  window['env']['capabilitiesUrl'] = 'http://localhost:8084';
  window['env']['validatorUrl'] = 'http://localhost:8083';
  window['env']['oidcIssuer'] = 'http://localhost:8180/realms/cirpass-2';
  window['env']['oidcClientId'] = 'web-portal-fe';
  window['env']['oidcHttps'] = false;
  window['env']['rolesClaimName'] = 'realm_access.roles';
  window['env']['rolesMappings'] = 'admin:admin,eo:eo,eu:eu';
})(this);
