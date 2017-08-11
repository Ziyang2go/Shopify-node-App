const express = require('express');
const shopifyAPI = require('shopify-node-api');
const bodyParser = require('body-parser');
const app = express();

var shop;
var Shopify;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

const appConfig = {
  shopify_api_key: '16d9a08b07c4c22911ae62de2f92eb80', // Your API key
  shopify_shared_secret: '62ec0e4676e19794c7e855383597e7f7', // Your Shared Secret
  shopify_scope: ['read_products', 'read_orders', 'read_customers'],
  redirect_uri: 'http://localhost:8080/finish_auth',
  nonce: '', // you must provide a randomly selected value unique for each authorization request
};

app.get('/', (req, res) => {
  if (req.query.shop && req.query.hmac) {
    appConfig.shop = req.query.shop.split('.')[0];
    shop = appConfig.shop;
    Shopify = new shopifyAPI(appConfig);
    if (Shopify.is_valid_signature(req.query, true)) {
      var auth_url = Shopify.buildAuthURL();
      console.log(auth_url);
      return res.redirect(auth_url);
    } else {
      console.log('Error .......... not valid from shopify');
    }
  }
  res.sendFile(`${__dirname}/index.html`);
});

app.post('/', (req, res) => {
  appConfig.shop = req.body.store.split('.')[0];
  Shopify = new shopifyAPI(appConfig);
  shop = appConfig.shop;
  var auth_url = Shopify.buildAuthURL();
  res.redirect(auth_url);
});

app.get('/finish_auth', (req, res) => {
  let query_params = req.query;
  if (!shop) return res.send(404);
  Shopify.exchange_temporary_token(query_params, function(err, data) {
    if (err) console.log(err);
    var Shopify2 = new shopifyAPI({
      shop: shop,
      shopify_api_key: '16d9a08b07c4c22911ae62de2f92eb80', // Your API key
      access_token: data.access_token,
    });
    let products, orders, customers;

    Shopify.get('/admin/products.json', function(err, data, headers) {
      if (err) console.log(err);
      res.json(data);
    });
  });
});

app.listen(8080);