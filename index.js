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
const port = 3000

app.get('/', (req, res) => res.send(req.body))

//use userinfo from the form and make a post request to /userinfo
app.post('/infovisa', async(req, res) => {
    //recibimos las variables que envía el form
    var merchantId = req.body.merchantId
    var currency = req.body.currency
    var clientname = req.body.clientname
    var clientlastname = req.body.clientlastname
    var amount = req.body.amount
    var email = req.body.email

    var user = 'integraciones.visanet@necomplus.com'
    var password = 'd5e7nk$M'

    var credentials = Buffer.from(user + ':' + password).toString('base64')
    let boton = await getToken(
        credentials,
        merchantId,
        amount,
        clientname,
        clientlastname,
        email
    )

    res.send(boton)
})

app.post('/responsevisa', async(req, res) => {
    var options = {
            method: 'POST',
            uri: config.APIEcommerce + codigoComercio,
            headers: {
                Authorization: tokenSeguridad,
                'Content-type': 'application/json',
            },
            body: {
                antifraud: null,
                captureType: 'manual',
                channel: 'web',
                countable: true,
                order: {
                    amount: monto,
                    currency: 'PEN',
                    purchaseNumber: '23432',
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

app.listen(port, () => console.log(`Example app listening on port ${port}!`))

//funciones

async function getToken(credentials, merchantId, amount, clientname, clientlastname, email) {
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
            boton = await generarSesion(
                response,
                merchantId,
                amount,
                clientname,
                clientlastname,
                email
            )
        })
        .catch(function(err) {
            // API call failed...
            console.log('API call failed, reason ', err)
        })
    return boton
}

async function generarSesion(token, merchantId, amount, clientname, clientlastname, email) {
    var boton = ''
    var options = {
        method: 'POST',
        uri: config.APISession + merchantId,
        headers: {
            Authorization: token,
            'Content-Type': 'application/json',
        },
        body: {
            amount: amount,
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
                amount,
                merchantId,
                clientname,
                clientlastname,
                email
            )
        })
        .catch(function(err) {
            // API call failed...
            console.log('API call failed, reason ', err)
        })
    console.log('Resultado GetSession: ' + boton)
    return boton
}

function generarBoton(sessionKey, amount, merchantId, clientname, clientlastname, email) {
    monto = amount
    codigoComercio = merchantId

    var result = "<form action='/responsevisa' method='post'>" +
        "<script src='" + config.urlJs + "'" +
        "data-sessiontoken='" + sessionKey + "'" +
        "data-channel='web'" +
        "data-merchantid='" + merchantId + "'" +
        "data-cardholdername='" + clientname + "'" +
        "data-cardholderlastname='" + clientlastname + "'" +
        "data-cardholderemail='" + email + "'" +
        "data-merchantlogo= 'img/comercio.png'" +
        "data-formbuttoncolor='#D80000'" +
        "data-purchasenumber='23432'" +
        "data-amount='" + amount + "'" +
        "data-expirationminutes='5'" +
        "data-timeouturl = 'timeout.html'>" +
        "</script>" +
        "</form>"

    console.log('Resultado GenerarBoton: ' + result)
    return result
}