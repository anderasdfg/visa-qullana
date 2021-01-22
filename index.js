const config = require('./config.js')
const rp = require('request-promise')

const express = require('express')
const { response } = require('express')
const app = express()

app.use(express.urlencoded({ extended: true }))
app.use(express.static('public'))
app.set('trust proxy', true);

var tokenSeguridad = ''
var monto = 0
var codigoComercio = ''
var responseJSON = ''
var secuenciaPago = ''
var client = ''
var env = 'development'

//se configura el puerto 
app.set('port', process.env.PORT || 5000)

app.get('/', (req, res) => res.send(req.body))

app.get('/infovisa', async(req, res) => {

    var ip = req.connection.remoteAddress;
    var data = req.query.data
    var output = Buffer.from(data, 'base64').toString('ascii')
    var part = output.split("|")
    var environment = part[0];
    env = (environment == 'PRUEBAS') ? 'development' : 'production'

    var visa = {
        user: part[1],
        password: part[2],
        merchantId: part[3],
        purchaseNumber: part[4],
        clientname: part[5],
        clientlastname: part[6],
        currency: part[7],
        amount: part[8],
        email: part[9],
        dni: part[10]
    }
    codigoComercio = visa.merchantId
    client = visa.clientname + ' ' + visa.clientlastname
    var credentials = Buffer.from(visa.user + ':' + visa.password).toString('base64')
    let boton = await getToken(credentials, visa)

    res.send(boton)
})

app.post('/responsevisa/:purchase', async(req, res) => {
    console.log(req.body);
    var success = false
    console.log(req.params.purchase);
    var purchaseNumber = req.params.purchase;
    var content = '';
    var options = {
            method: 'POST',
            uri: config[env].APIEcommerce + codigoComercio,
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
                    purchaseNumber: purchaseNumber,
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
            success = true
            responseJSON = JSON.stringify(response)
        })
        .catch(function(err) {
            success = false
            responseJSON = JSON.stringify(err)
        })
    let transaction = JSON.parse(responseJSON)
    console.log(transaction)
    console.log(transaction.statusCode)
    console.log(success)


    var style = `<style>*{box-sizing:border-box;margin:0;padding:0}html{background-color:#f6f9fc;font-size:100%;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen,Ubuntu,Cantarell,'Open Sans','Helvetica Neue',sans-serif}main{box-sizing:border-box;display:grid;place-items:center;margin:5vh auto 17vh auto;height:60vh}.container{padding:5rem;border-radius:.6rem;border:#2ca2eb .1rem solid}.title{border-radius:.6rem;padding:.6rem;background-color:#2ca2eb;text-align:center;font-weight:700;margin-bottom:2rem;font-size:2rem}P{padding:.3rem;font-weight:400;font-size:1.4rem}.btnBlue{padding:1rem 3rem 1rem 3rem;}.small{padding-top:1rem;text-align:center;font-size:1rem}.colums{column-count:2}.right{text-align:right}.left{text-align:left}.btnBlue{text-decoration:none;align-self:center;text-align:center;background-color:#2ca2eb;border-radius:.6rem;border:0 solid;padding:.6rem;color:#000;cursor:pointer}.btnBlue:hover{background-color:#e1ecf4;color:#2ca2eb}.instruction{margin-bottom:0;padding-bottom:0}</style>`
    if (success) {
        content = `<div class="colums">
                        <div class="right">
                            <p><b>Orden: </b></p>                            
                            <p><b>Tarjeta: </b></p>
                            <p><b>Medio de pago: </b></p>
                            <p><b>Monto (S/.): </b></p>
                            <p><b>Fecha y hora: </b></p>
                            <p><b>Descripción: </b></p>
                        </div>
                        <div class="left">
                            <p>${transaction.order.purchaseNumber}</p>                            
                            <p>${transaction.dataMap.CARD}</p>
                            <p>${transaction.dataMap.BRAND}</p>
                            <p>${transaction.dataMap.AMOUNT} </p>
                            <p>${transaction.dataMap.TRANSACTION_DATE}</p>
                            <p>Aprobado</p>
                        </div>
                    </div>`
        var responseHTML = `<main>
                            <div class="container">
                                <div>
                                    <p class="title">Pago satisfactorio</p>
                                </div>
                                ${content}
                                <div class="small">                                
                                    <a href="${config[env].return}" class="btnBlue" >Finalizar</a>
                                    <p class="small">
                                        <p class="small"><b class="instruction">IMPORTANTE: Presione finalizar para concretar la transacci��n.</b></p> Esta tienda est�� autorizada por Visa para realizar transacciones electrónicas.
                                        </br>Copyright 2020 ? <a target="_blank" href="https://www.lolimsa.com.pe/">LOLIMSA</a></p>
                                </div>
                            </div>
                        </main> ${style}`
    } else {
        if (transaction.statusCode == '403' || (transaction.error.errorCode == '400' && transaction.error.errorMessage == 'MERCHANT_ID does not match') || (transaction.error.errorCode == '400' && transaction.error.errorMessage == 'AMOUNT does not match')) {
            content = `<div class="colums">
                        <div class="right">
                            <p><b>Orden: </b></p>                            
                            <p><b>Descripción: </b></p>                            
                        </div>
                        <div class="left">
                            <p>${transaction.options.body.order.purchaseNumber}</p>                                                        
                            <p>Su transacción no pudo ser realizada. </p>
                        </div>
                    </div>`
        } else {
            content = `<div class="colums">
            <div class="right">
                <p><b>Orden: </b></p>                            
                <p><b>Tarjeta: </b></p>
                <p><b>Medio de pago: </b></p>
                <p><b>Monto (S/.): </b></p>
                <p><b>Descripcion: </b></p>
            </div>
            <div class="left">
                <p>${transaction.options.body.order.purchaseNumber}</p>                            
                <p>${transaction.response.body.data.CARD}</p>
                <p>${transaction.response.body.data.BRAND}</p>
                <p>${transaction.response.body.data.AMOUNT} </p>
                <p>${transaction.response.body.data.ACTION_CODE} - ${transaction.response.body.data.ACTION_DESCRIPTION}</p>
            </div>
        </div>`
        }

        var responseHTML = `<main>
                            <div class="container">
                                <div>
                                    <p class="title">Pago rechazado</p>
                                </div>
                                ${content}
                                <div class="small">
                                <a href="${config[env].return}" class="btnBlue" >Finalizar</a>
                                    <p class="small">
                                        <p class="small"><b class="instruction">IMPORTANTE: Presione finalizar para intentar nuevamente.</b></p> Esta tienda est�� autorizada por Visa para realizar transacciones electrónicas.
                                        </br>Copyright 2020 ? LOLIMSA </p>
                                </div>
                            </div>
                        </main> ${style}`
    }
    var body = success + '|' + JSON.stringify(transaction)
    sendResponse(body)
    res.send(responseHTML)
})


app.post('/qrestatico/:token/:merchantid/:fecha/', async(req, res) => {

    var stoken = req.params.token;
    var smerchantid = req.params.merchantid;
    var sfecha = req.params.fecha

    var options = {
            method: 'POST',
            uri: config[env].qr,
            headers: {
                'Authorization': stoken,
                'Content-Type': 'application/json',
            },
            body: {
                'enabled': true,
                'param': [{
                        'name': 'merchantId',
                        'value': smerchantid
                    },
                    {
                        'name': 'transactionCurrency',
                        'value': '604'
                    }
                ],
                'tagType': 'STATIC',
                'validityDate': sfecha
            },
            json: true,
        }
        //Use request-promise module's .then() method to make request calls.
    await rp(options)
        .then(async function(response) {
            responseJSON = JSON.stringify(response)
        })
        .catch(function(err) {
            responseJSON = JSON.stringify(err)
        })

    res.send(responseJSON)
})

app.listen(app.get('port'), () => console.log(`Visa app listening on port ${app.get('port')}!`))

//funciones

async function getToken(credentials, visa) {
    var boton = ''
    var options = {
            method: 'POST',
            uri: config[env].APIToken,
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
        uri: config[env].APISession + visa.merchantId,
        headers: {
            Authorization: token,
            'Content-Type': 'application/json',
        },
        body: {
            amount: visa.amount,
            antifraud: {
                merchantDefineData: {
                    MDD4: visa.email,
                    MDD32: visa.dni,
                    MDD21: '0',
                    MDD75: 'REGISTRO',
                    MDD77: '1',
                    MDD33: 'DNI'
                }
            }, //luego completar
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
        // console.log('Resultado GetSession: ' + boton)
    return boton
}

function generarBoton(sessionKey, visa) {
    monto = visa.amount
    codigoComercio = visa.merchantId
    secuenciaPago = visa.purchaseNumber
    var result = `
        <main>
        <div class='loader linkid'></div> 
        <p>Espere un momento por favor...</p>       
        <div id='linkid' class='linkid'>        
            <form name='myForm' class="center" id='myForm' action='https://www.visa.qullana.com:8012/visa/responsevisa/${visa.purchaseNumber}' method='post'>
                <script src='${config[env].urlJs}'
                data-sessiontoken='${sessionKey}'
                data-channel='web'
                data-merchantid='${visa.merchantId}'
                data-merchantlogo='https://www.lolimsa.com.pe/wp-content/uploads/2018/09/qullana.png'
                data-formbuttoncolor='#D80000'
                data-purchasenumber='${visa.purchaseNumber}'
                data-amount='${visa.amount}'
                data-expirationminutes='5'
                data-timeouturl = 'https://anderasdfg.github.io/timeout-page/'>
                </script>
            </form>
        </div>
        </main>
        <script>
        submitform();
        
        function submitform()
        {     
          document.getElementById("linkid").style.display = "none";     
          var y = document.getElementsByClassName("start-js-btn modal-opener default");
          var aNode = y[0].click(); 
        }
        </script>
        <style>main{display:grid;place-items:center}.loader{border:16px solid #f3f3f3;border-top:16px solid #3498db;border-radius:50%;width:120px;height:120px;animation:spin 2s linear infinite;margin:30vh auto 0 auto}@keyframes spin{0%{transform:rotate(0)}100%{transform:rotate(360deg)}}</style>`

    return result
}

//async 
function sendResponse(body) {
    var responseJSON = ''
    var options = {
        method: 'POST',
        uri: 'http://200.121.128.122:8010/LOLIMSASER/rest/recepcion',
        headers: {
            'Content-Type': 'application/json',
        },
        body: {
            Request: body
        },
        json: true,
    }

    //await 
    rp(options)
        .then(async function(response) {
            responseJSON = JSON.stringify(response)
        })
        .catch(function(err) {
            success = false
            responseJSON = JSON.stringify(err)
        })
}