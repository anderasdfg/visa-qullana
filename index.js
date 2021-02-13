const config = require("./config.js");

const express = require("express");
const { response } = require("express");
const { default: axios } = require("axios");
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("trust proxy", true);

//se configura el puerto
app.set("port", process.env.PORT || 5000);

//variables
var tokenSeguridad = "";
var monto = 0;
var codigoComercio = "";
var responseJSON = "";
var secuenciaPago = "";
var client = "";
var env = "development";

app.get("/infovisa", async(req, res) => {
    var ip = req.connection.remoteAddress;
    var data = req.query.data;
    var output = Buffer.from(data, "base64").toString("ascii");
    var part = output.split("|");
    var environment = part[0];
    env = environment == "PRUEBAS" ? "development" : "production";

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
        dni: part[10],
    };
    console.log(environment + " " + env);
    codigoComercio = visa.merchantId;
    client = visa.clientname + " " + visa.clientlastname;
    var credentials = Buffer.from(visa.user + ":" + visa.password).toString(
        "base64"
    );
    console.log(credentials);
    let boton = await getToken(credentials, visa);

    res.send(boton);
});

app.get("/qr", async(req, res) => {
    var data = req.query.data;
    var output = Buffer.from(data, "base64").toString("ascii");
    var part = output.split("|");
    var environment = part[0];
    env = environment == "PRUEBAS" ? "development" : "production";

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
        dni: part[10],
    };

    codigoComercio = visa.merchantId;
    client = visa.clientname + " " + visa.clientlastname;
    var credentials = Buffer.from(visa.user + ":" + visa.password).toString(
        "base64"
    );
    console.log(credentials);
    let tk = await getTokenSecurity(credentials, visa);
    var qrb64 = await getQR(tk, visa);
    res.send(qrb64);
});

app.post("/responsevisa/:purchase", async(req, res) => {
    var success = false;
    console.log(req.params.purchase);
    var purchaseNumber = req.params.purchase;
    var content = "";
    var tipopago = "";
    const body = {
        antifraud: null,
        captureType: "manual",
        channel: "web",
        countable: true,
        order: {
            amount: monto,
            currency: "PEN",
            purchaseNumber: purchaseNumber,
            tokenId: req.body.transactionToken,
        },
        terminalId: "1",
        terminalUnattended: false,
    };

    await axios
        .post(config[env].APIEcommerce + codigoComercio, body, {
            headers: {
                Authorization: tokenSeguridad,
                "Content-Type": "application/json",
            },
        })
        .then(async(response) => {
            success = true
            responseJSON = JSON.stringify(response)
            tipopago = "satisfactorio"
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
                            <p>${response.data.order.purchaseNumber}</p>                            
                            <p>${response.data.dataMap.CARD}</p>
                            <p>${response.data.dataMap.BRAND}</p>
                            <p>${response.data.dataMap.AMOUNT} </p>
                            <p>${response.data.dataMap.TRANSACTION_DATE}</p>
                            <p>Aprobado</p>
                        </div>
                    </div>`;
        })
        .catch(async(err) => {
            success = false
            responseJSON = JSON.stringify(response)
            tipopago = "rechazado"
            console.log(responseJSON);
            console.log("Ocurrió un error");
            console.log(err);
            // if (err.response.data) {
            //     console.log(err.response.data);
            // }
            //res.send(err);
            content = `            
                            <p class="center">Su transacción no fue procesada.</p> 
                            <p><b>Descripción: </b>${(err.response.data) ?  'Operación denegada. Por favor, intente nuevamente. (Código de error: ' + err.response.data.errorCode + ')' : 'Operación denegada. Intente nuevamente'} </p>  
                        `
                //res.send(content);
        });

    var style = `<style>*{box-sizing:border-box;margin:0;padding:0}html{background-color:#f6f9fc;font-size:100%;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen,Ubuntu,Cantarell,'Open Sans','Helvetica Neue',sans-serif}main{box-sizing:border-box;display:grid;place-items:center;margin:5vh auto 17vh auto;height:60vh}.container{padding:5rem;border-radius:.6rem;border:#2ca2eb .1rem solid}.title{border-radius:.6rem;padding:.6rem;background-color:#2ca2eb;text-align:center;font-weight:700;margin-bottom:2rem;font-size:2rem}P{padding:.3rem;font-weight:400;font-size:1.4rem}.btnBlue{padding:1rem 3rem 1rem 3rem;}.small{padding-top:1rem;text-align:center;font-size:1rem}.colums{column-count:2}.right{text-align:right}.left{text-align:left}.btnBlue{text-decoration:none;align-self:center;text-align:center;background-color:#2ca2eb;border-radius:.6rem;border:0 solid;padding:.6rem;color:#000;cursor:pointer}.btnBlue:hover{background-color:#e1ecf4;color:#2ca2eb}.instruction{margin-bottom:0;padding-bottom:0}.center{padding-top:1rem;text-align:center;}</style>`;

    var responseHTML = `<main>
    <div class="container">
        <div>
            <p class="title">Pago ${tipopago}</p>
        </div>
        ${content}
        <div class="small">                                
            <a href="${config[env].return}" class="btnBlue" >Finalizar</a>
            <p class="small">
                <p class="small"><b class="instruction">IMPORTANTE: Presione finalizar para concretar la transacción.</b></p> Esta tienda está autorizada por Visa para realizar transacciones electrónicas.
                </br>Copyright 2020 <a target="_blank" href="https://www.lolimsa.com.pe/">LOLIMSA</a></p>
        </div>
    </div>
</main> ${style}`
    let transaction = JSON.parse(responseJSON);
    res.send(responseHTML);
    var bodytoSend = success + '|' + JSON.stringify(transaction)
    sendResponse(bodytoSend)
});

//funciones
async function getTokenSecurity(credentials, visa) {
    const body = "";
    var token = "";
    await axios
        .post(config[env].APIToken, body, {
            headers: {
                Authorization: "Basic " + credentials,
                Accept: "*/*",
            },
        })
        .then(async(response) => {
            token = response.data;
            //res.send(responseHTML);
        })
        .catch(async(err) => {
            if (err.response) {
                console.log(err.response.status);
            }
        });
    return token;
}

//funciones
async function getToken(credentials, visa) {
    var boton = "";
    const body = "";
    await axios
        .post(config[env].APIToken, body, {
            headers: {
                Authorization: "Basic " + credentials,
                Accept: "*/*",
            },
        })
        .then(async(response) => {
            tokenSeguridad = response.data;
            console.log(tokenSeguridad);
            boton = await generarSesion(tokenSeguridad, visa);
            //res.send(responseHTML);
        })
        .catch(async(err) => {
            if (err.response) {
                console.log(err.response.status);
                console.log(err.response.statusText);
            }
        });
    return boton;
}

async function generarSesion(token, visa) {
    var boton = "";
    const body = {
        amount: visa.amount,
        antifraud: {
            merchantDefineData: {
                MDD4: visa.email,
                MDD32: visa.dni,
                MDD21: "0",
                MDD75: "REGISTRO",
                MDD77: "1",
                MDD33: "DNI",
            },
        }, //luego completar
        channel: "web",
        recurrenceMaxAmount: null,
    };
    await axios
        .post(config[env].APISession + visa.merchantId, body, {
            headers: {
                Authorization: token,
                "Content-Type": "application/json",
            },
        })
        .then(async(response) => {
            console.log(response.data);
            boton = await generarBoton(response.data.sessionKey, visa);
        })
        .catch(async(err) => {
            console.log(err);
        });
    return boton;
}

function generarBoton(sessionKey, visa) {
    monto = visa.amount;
    codigoComercio = visa.merchantId;
    secuenciaPago = visa.purchaseNumber;
    var result = `
        <main>
        <div class='loader linkid'></div> 
        <p>Espere un momento por favor...</p>       
        <div id='linkid' class='linkid'>        
            <form name='myForm' class="center" id='myForm' action='/responsevisa/${visa.purchaseNumber}' method='post'>
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
        <style>main{display:grid;place-items:center}.loader{border:16px solid #f3f3f3;border-top:16px solid #3498db;border-radius:50%;width:120px;height:120px;animation:spin 2s linear infinite;margin:30vh auto 0 auto}@keyframes spin{0%{transform:rotate(0)}100%{transform:rotate(360deg)}}</style>`;

    return result;
}

function sendResponse(body) {
    var responseJSON = ''
    console.log("Enviando respuesta a LOLIMSASERVICES...");
    var body = {
        Request: body
    }
    axios
        .post('http://200.121.128.122:8010/LOLIMSASER/rest/recepcion', body, {
            headers: {
                'Content-Type': 'application/json',
            },
        })
        .then(async(response) => {
            responseJSON = JSON.stringify(response)
        })
        .catch(async(err) => {
            success = false
            responseJSON = JSON.stringify(err)
        });
    console.log(responseJSON);
}

async function getQR(token, visa) {
    var qr = "";
    var body = {
        "enabled": true,
        "param": [{
                "name": "merchantId",
                "value": visa.merchantId
            },
            {
                "name": "transactionCurrency",
                "value": "604"
            },
            {
                "name": "transactionAmount",
                "value": visa.amount
            },
            {
                "name": "additionalData",
                "value": visa.purchaseNumber
            }
        ],
        "tagType": "DYNAMIC",
        "validityDate": "25122030"
    };
    await axios
        .post(config[env].qr, body, {
            headers: {
                Authorization: token,
                Accept: "*/*",
            },
        })
        .then(async(response) => {
            console.log(response.data);
            if (response.data) {
                // console.log(response.data.tagImg);
                qr = response.data.tagImg;
            }
        })
        .catch(async(err) => {
            if (err.response) {
                console.log(err.response);
            }
        });
    return qr;
}

app.get("/", (req, res) => res.send(req.body));

app.listen(app.get("port"), () =>
    console.log(`Visa app listening on port ${app.get("port")}!`)
);