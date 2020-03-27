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


/**
 * App Variables
 */

const app = express();
const port = process.env.PORT || "8000";

app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(bodyParser.json());

/**
 *  App Configuration
 */

// set the view engine to ejs
app.set('view engine', 'ejs');


/**
 * Helper functions
 */

// generate a random integer in a range.
function randomInt(low, high) {
  return Math.floor(Math.random() * (high - low) + low)
}

// convert to string that is exactly 4 chars long
function padToFour(number) {
  // add four zeros to the front, and then take the last four digits
  number = ("0000" + number.toString()).slice(-4);
  return number;
}

// generate a candidate solution to the mastermind game
function generateSolution() {
  var int = randomInt(0, 9999);
  return padToFour(int);
}

// calculate the score of a given guess
// uses the global variable solution to check against.
function calcScore(guess) {

  var scoreP = 0;
  var scoreN = 0;

  // a temporary copy of solution is made so it can be modified
  var solution_tmp = solution;

  // check for correct guess in correct space
  var i = 0;
  for (g of guess) {
    if (solution[i] == g) {
      // ooh its correct!
      scoreP++;
      // replace it with "." or "," to help with next step
      guess = guess.slice(0, i) + "." + guess.slice(i + 1, 4);
      solution_tmp = solution_tmp.slice(0, i) + "," + solution_tmp.slice(i + 1, 4);
      console.log('Right position at ' + i.toString())
    }
    i++;
  }

  // now check for correct guess in wrong space
  var i = 0;
  for (g of guess) {
    if (solution_tmp.includes(g)) {
      scoreN++;
      console.log('Is contained at ' + i.toString())
    }
    i++;
  }

  // return an array of scores
  return [scoreN, scoreP]
}

// reset the game
function reset() {
  solution = generateSolution();
  console.log(solution);
  guesses = [];
  tries_remaining = 10;
  status = "";
}

// define the useful global variables

// instead of using a database, the variable is just stored locally,
// resets everytime the website's reset() is called.
var guesses = [
  //{ guess: "", score: "" },
];
var status = "";
var solution = generateSolution();
var tries_remaining = 10;

/**
 * Routes Definitions
 */


// home (most of the stuff happens here)
app.get("/", (req, res) => {

  res.render(path.join(__dirname + '/index'), {
    guesses: guesses,
    tries: tries_remaining.toString(),
    status: status,
  });

});

// process the guess from the form
app.post('/guess', [
  // sanitize and validate the input
  check('guess').escape().trim().isNumeric().isLength({
    max: 4,
    min: 4
  })
], (req, res) => {

  // if it isnt clean, restate the instructions
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    status = "You must guess a 4 digit number";
    res.redirect("/");
    return;
  }

  // else, score and print the guess
  status = "";
  var guess = padToFour(req.body.guess);

  score = calcScore(guess);
  var scoreN = score[0];
  var scoreP = score[1];

  var scoreString = scoreN.toString() + "N " + scoreP.toString() + "P";


  if (scoreP == 4) {
    status = "You've WON!!"
    tries_remaining = 0;
    console.log('Player won!')
    res.redirect("/");
    return;
  }

  guesses.unshift({
    guess: padToFour(req.body.guess),
    score: scoreString
  })

  tries_remaining--;
  if (tries_remaining == 0) {
    console.log('Player lost');
    status = "Game over! The correct solution was " + solution.toString();
  }


  res.redirect("/");

})


// handle a request for the true solution
app.post('/sol', (req, res) => {
  tries_remaining = 0;

  guesses.unshift({
    guess: solution,
    score: "Solution!"
  });

  status = "You've asked for the solution."
  res.redirect("/");

});

// handle a request for a new game
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
