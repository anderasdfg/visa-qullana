const config = require('./config')
const rp = require('request-promise')

const express = require('express')
const { response } = require('express')
const app = express()

app.use(express.urlencoded({ extended: true }))
app.use(express.static('public'))

var tokenSeguridad = ''
var monto = 0
var codigoComercio = ''
var responseJSON = ''
var secuenciaPago = ''

//se configura el puerto 
app.set('port', process.env.PORT || 5000)

app.get('/', (req, res) => res.send(req.body))

//use userinfo from the form and make a post request to /userinfo
app.post('/infovisa', async(req, res) => {

    var visa = {
        merchantId: req.body.merchantId,
        currency: req.body.currency,
        clientname: req.body.clientname,
        clientlastname: req.body.clientlastname,
        amount: req.body.amount,
        email: req.body.email,
        purchaseNumber: req.body.purchasenumber,
        user: req.body.user,
        password: req.body.password
    }
    console.log(JSON.stringify(visa))
    var credentials = Buffer.from(visa.user + ':' + visa.password).toString('base64')
    let boton = await getToken(credentials, visa)

    res.send(boton)
})

app.post('/responsevisa', async(req, res) => {
    console.log(req.body.transactionToken)
    console.log(config.APIEcommerce + codigoComercio)
    console.log(tokenSeguridad)
    var options = {
            method: 'POST',
            uri: config.APIEcommerce + codigoComercio,
            headers: {
                'Authorization': tokenSeguridad,
                'Content-Type': 'application/json',
            },
            body: {
                antifraud: null,
                captureType: 'manual',
                channel: 'web',
                countable: true,
                order: {
                    amount: monto,
                    currency: 'PEN',
                    purchaseNumber: secuenciaPago,
                    tokenId: req.body.transactionToken,
                },
                terminalId: '1',
                terminalUnattended: false,
            },
            json: true,
        }
        //Use request-promise module's .then() method to make request calls.
    await rp(options)
        .then(async function(response) {
            responseJSON = JSON.stringify(response)
        })
        .catch(function(err) {
            // API call failed...
            console.log('API call failed, reason ', err)
        })

    res.send(responseJSON)
})

app.listen(app.get('port'), () => console.log(`Visa app listening on port ${app.get('port')}!`))

//funciones

async function getToken(credentials, visa) {
    var boton = ''
    var options = {
            method: 'POST',
            uri: config.APIToken,
            headers: {
                Authorization: 'Basic ' + credentials,
                Accept: '*/*',
            },
            json: true,
        }
        //Use request-promise module's .then() method to make request calls.
    await rp(options)
        .then(async function(response) {
            tokenSeguridad = response
            boton = await generarSesion(tokenSeguridad, visa)
        })
        .catch(function(err) {
            // API call failed...
            console.log('API call failed, reason ', err)
        })
    return boton
}

async function generarSesion(token, visa) {
    var boton = ''
    var options = {
        method: 'POST',
        uri: config.APISession + visa.merchantId,
        headers: {
            Authorization: token,
            'Content-Type': 'application/json',
        },
        body: {
            amount: visa.amount,
            antifraud: null, //luego completar
            channel: 'web',
            recurrenceMaxAmount: null,
        },
        json: true,
    }

    await rp(options)
        .then(async function(response) {
            console.log('Response: ', response)
            boton = await generarBoton(
                response['sessionKey'],
                visa
            )
        })
        .catch(function(err) {
            // API call failed...
            console.log('API call failed, reason ', err)
        })
    console.log('Resultado GetSession: ' + boton)
    return boton
}

function generarBoton(sessionKey, visa) {
    monto = visa.amount
    codigoComercio = visa.merchantId
    secuenciaPago = visa.purchaseNumber
    var result = "<form action='/responsevisa' method='post'>" +
        "<script src='" + config.urlJs + "'" +
        "data-sessiontoken='" + sessionKey + "'" +
        "data-channel='web'" +
        "data-merchantid='" + visa.merchantId + "'" +
        "data-cardholdername='" + visa.clientname + "'" +
        "data-cardholderlastname='" + visa.clientlastname + "'" +
        "data-cardholderemail='" + visa.email + "'" +
        "data-merchantlogo= 'img/comercio.png'" +
        "data-formbuttoncolor='#D80000'" +
        "data-purchasenumber='" + visa.purchaseNumber + "'" +
        "data-amount='" + visa.amount + "'" +
        "data-expirationminutes='5'" +
        "data-timeouturl = 'timeout.html'>" +
        "</script>" +
        "</form>"
    console.log(visa.purchaseNumber)
    console.log('Resultado GenerarBoton: ' + result)
    return result
}