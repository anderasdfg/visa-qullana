const env = process.env.NODE_ENV || 'development'


//insert your API Key & Secret for each environment, keep this file local and never push it to a public repo for security purposes.
const config = {
    development: {
        APIToken: 'https://apitestenv.vnforapps.com/api.security/v1/security',
        APISession: 'https://apitestenv.vnforapps.com/api.ecommerce/v2/ecommerce/token/session/',
        urlJs: 'https://static-content-qas.vnforapps.com/v2/js/checkout.js?qa=true',
        APIEcommerce: 'https://apitestenv.vnforapps.com/api.authorization/v3/authorization/ecommerce/'
    },
    production: {
        APIKey: '',
        APISecret: ''
    }
};

module.exports = config[env]