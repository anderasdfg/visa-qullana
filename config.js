const config = {
    development: {
        APIToken: 'https://apitestenv.vnforapps.com/api.security/v1/security',
        APISession: 'https://apitestenv.vnforapps.com/api.ecommerce/v2/ecommerce/token/session/',
        urlJs: 'https://static-content-qas.vnforapps.com/v2/js/checkout.js?qa=true',
        APIEcommerce: 'https://apitestenv.vnforapps.com/api.authorization/v3/authorization/ecommerce/',
        return: 'https://www.qullanatest.com/I_QULLANA/servlet/com.iqullana.w_filtro',
        qr: 'https://apitestenv.vnforapps.com/api.qr.manager/v1/qr/ascii'
    },
    production: {
        APIToken: 'https://apiprod.vnforapps.com/api.security/v1/security',
        APISession: 'https://apiprod.vnforapps.com/api.ecommerce/v2/ecommerce/token/session/',
        urlJs: 'https://static-content.vnforapps.com/v2/js/checkout.js',
        APIEcommerce: 'https://apiprod.vnforapps.com/api.authorization/v3/authorization/ecommerce/',
        return: 'https://www.qullana.com/E_LOLCLI/servlet/com.elolcli.w_filtro'
    }
};

module.exports = config