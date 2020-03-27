// index.js

/**
 * Required External Modules
 */
const express = require("express");
const path = require("path");
var bodyParser = require('body-parser')


const {
  check,
  validationResult
} = require('express-validator');

//const { sanitizeBody } = require('express-validator/filter');


/**
 * App Variables
 */

const app = express();
const port = process.env.PORT || "8000";

app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(bodyParser.json());

// create application/json parser
//var jsonParser = bodyParser.json()

// create application/x-www-form-urlencoded parser
//var urlencodedParser = bodyParser.urlencoded({ extended: false })



/**
 *  App Configuration
 */

// set the view engine to ejs
app.set('view engine', 'ejs');


function randomInt(low, high) {
  return Math.floor(Math.random() * (high - low) + low)
}

function padToFour(number) {
  // add four zeros to the front, and then take the last four digits
  number = ("0000" + number.toString()).slice(-4);
  return number;
}

function generateSolution() {
  var int = randomInt(0, 9999);
  return padToFour(int);
}

function calcScore(guess) {

  var scoreP = 0;
  var scoreN = 0;

  var solution_tmp = solution;

  var i = 0;
  for (g of guess) {
    if (solution[i] == g) {
      scoreP++;
      // replace it with something arbitrary to help with next step
      guess = guess.slice(0, i) + "." + guess.slice(i + 1, 4);
      solution_tmp = solution_tmp.slice(0, i) + "," + solution_tmp.slice(i + 1, 4);
      console.log('Right position at ' + i.toString())
    }
    i++;
  }

  var i = 0;
  for (g of guess) {
    if (solution_tmp.includes(g)) {
      scoreN++;
      console.log('Is contained at ' + i.toString())
    }
    i++;
  }

  return [scoreN, scoreP]
}

function reset() {
  solution = generateSolution();
  console.log(solution);
  guesses = [];
  tries_remaining = 10;
  status = "";
}


/**
 * Routes Definitions
 */


var solution = generateSolution();

// instead of using a database, the variable is just stored locally,
// resets everytime the website is refreshed.
var guesses = [
  //{ guess: "", score: "" },
];
var status = "";

var tries_remaining = 10;

app.get("/", (req, res) => {

  res.render(path.join(__dirname + '/index'), {
    guesses: guesses,
    tries: tries_remaining.toString(),
    status: status,
  });

});

app.post('/guess', [
  // username must be an email
  check('guess').escape().trim().isNumeric().isLength({
    max: 4,
    min: 4
  })
], (req, res) => {

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
      status = "You must guess a 4 digit number";
      res.redirect("/");
      return;
  }
    status = "";
    var guess = padToFour(req.body.guess);

    score = calcScore(guess);
    var scoreN = score[0];
    var scoreP = score[1];

    var scoreString = scoreN.toString() + "N " + scoreP.toString() + "P";

    if (scoreP == 4) {
      scoreString = "YOU'VE WON!!";
    }

    guesses.unshift({
      guess: padToFour(req.body.guess),
      score: scoreString
    })

    tries_remaining--;
    if (tries_remaining == 0) {
      console.log('fin');
    }
    res.redirect("/");

})



app.post('/sol', (req, res) => {
  tries_remaining = 0;

  guesses.unshift({
    guess: solution,
    score: "Solution!"
  });

  res.redirect("/");

});

app.post('/new', (req, res) => {
  reset();
  res.redirect("/");
});


/**
 * Server Activation
 */

app.listen(port, () => {
  console.log(`Listening to requests on http://localhost:${port}`);
  reset();
});

app.use(function(req, res, next) {
  res.status(404).send("Sorry can't find that!")
})
