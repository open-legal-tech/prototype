"use strict";

/*!
 * Open Decision JavaScript Interpreter v0.1
 * https://open-decision.org/
 *
 * Copyright Finn Schädlich, Open Decision Project
 * Released under the MIT license
 * https://github.com/fbennets/open-decision/blob/master/LICENSE
 *
 * Date: 2020-04-03
 */
window.openDecision = function () {
  "use strict"; // The node of the tree the user is currently seeing

  var currentNode,
      // The decision tree that is being rendered
  tree,
      // Contains the html to display the tree name
  preString,
      // Used to log the nodes shown and answers given by the user, used for history
  log,
      // The div-container in which the tree is rendered in (where the question, buttons etc. is shown)
  selectedDiv,
      // Boolean to determine if the device can vibrate
  supportsVibration,
      // Object  to expose the internal functions
  expose = {}; //version of  the Interpreter

  var COMPATIBLE_VERSIONS = [0.1];

  expose.init = function (path, divId) {
    tree = path;
    selectedDiv = divId;

    try {
      window.navigator.vibrate(1);
      supportsVibration = true;
    } catch (e) {
      supportsVibration = false;
    }

    var compatible = false;

    for (var i = 0; i < COMPATIBLE_VERSIONS.length; i++) {
      if (COMPATIBLE_VERSIONS[i] === tree.header.version) {
        compatible = true;
      }
    }

    if (!compatible) {
      document.getElementById(selectedDiv).innerHTML = "The provided file uses the Open Decision dataformat version ".concat(tree.header.version, ". This library only supports ").concat(COMPATIBLE_VERSIONS, ".");
      throw {
        name: "IncompatibleVersion",
        message: "The provided file uses the Open Decision dataformat version ".concat(tree.header.version, ". This library only supports ").concat(COMPATIBLE_VERSIONS, "."),
        toString: function toString() {
          return this.name + ": " + this.message;
        }
      };
    }

    displayTree();
  }; // Listener for hashchange in the URL if the user clicks the browser's back-button
  // The hash tells us the node name, that is currently displayed


  window.onhashchange = function () {
    if (currentNode != location.hash.replace('#', '') && location.hash.length > 0) {
      if (log.nodes.length > 0) {
        //Go back one step
        currentNode = location.hash.replace('#', '');
        log.nodes.pop();
        delete log.answers[currentNode];
      } else {
        // Else restart
        currentNode = tree.header.start_node;
        log = {
          'nodes': [],
          'answers': {}
        };
      }

      displayNode();
    }
  }; // Check for vars that need to be replaced in displayNode
  //Keep track of all inputs in this one node


  function displayTree() {
    currentNode = tree.header.start_node;
    preString = "<h3>".concat(tree.header.tree_name, "</h3><br>");
    log = {
      'nodes': [],
      'answers': {}
    };
    displayNode();
  }

  ;

  function displayNode() {
    location.hash = currentNode;
    var string = "".concat(preString).concat(tree[currentNode].text, "<br><div id=\"od-input-div\">");
    var inputCounter = {
      'buttonsCount': 0,
      'listCount': 0,
      'numberCount': 0,
      'dateCount': 0,
      'freeTextCount': 0
    };

    for (var j = 0; j < tree[currentNode].inputs.length; j++) {
      if (tree[currentNode].inputs[j].type === 'button') {
        for (var i = 0; i < tree[currentNode].inputs[j].options.length; i++) {
          string += "<button type=\"button\" id=\"answer-button\" class=\"btn btn-primary ml-2 answer-button\" data-index=\"".concat(j, "\" value=\"").concat(i, "\">").concat(tree[currentNode].inputs[j].options[i], "</button>");
        }

        inputCounter['buttonsCount'] = +1;
      } else if (tree[currentNode].inputs[j].type === 'list') {
        string += "<select id=\"list-select\" class=\"od-input list-select\" data-index=\"".concat(j, "\">");

        for (var _i = 0; _i < tree[currentNode].inputs[j].options.length; _i++) {
          string += "<option value=".concat(_i, ">").concat(tree[currentNode].inputs[j].options[_i], "</option>");
        }

        string += '</select>'; //<br><button type="button" class="btn btn-primary ml-2 mt-3" id="submit-list-button">Submit</button>';

        inputCounter['listCount'] = +1;
      } else if (tree[currentNode].inputs[j].type === 'number') {
        string += "<input type=\"number\" id=\"number-input\" class=\"od-input number-input\" data-index=\"".concat(j, "\">"); // string += '<br><button type="button" class="btn btn-primary ml-2 mt-3" id="submit-number-button">Submit</button>';

        inputCounter['numberCount'] = +1;
      } else if (tree[currentNode].inputs[j].type === 'date') {
        string += "<input type=\"number\" id=\"date-input\" class=\"od-input date-input\" data-index=\"".concat(j, "\">"); // string += '<br><button type="button" class="btn btn-primary ml-2 mt-3" id="submit-number-button">Submit</button>';

        inputCounter['dateCount'] = +1;
      } else if (tree[currentNode].inputs[j].type === 'free_text') {
        if (tree[currentNode].inputs[j].validation === 'short_text') {
          string += "<label for=\"".concat(tree[currentNode].inputs[j].id, "\" >").concat(tree[currentNode].inputs[j].label, "<br><input type=\"text\" id=\"").concat(tree[currentNode].inputs[j].id, "\" class=\"free-text short-text od-input\" data-index=\"").concat(j, "\"></label>"); // string += '<br><button type="button" class="btn btn-primary ml-2 mt-3" id="submit-free-text-button">Submit</button>';
        } else if (tree[currentNode].inputs[j].validation === 'long_text') {
          string += "<textarea id=\"".concat(tree[currentNode].inputs[j].id, "\" class=\"free-text long-text  od-input\" data-index=\"").concat(j, "\" rows=\"4\" cols=\"10\"></textarea>"); // string += '<br><button type="button" class="btn btn-primary ml-2 mt-3" id="submit-free-text-button">Submit</button>';
        } else if (tree[currentNode].inputs[j].validation === 'number') {
          string += "<input type=\"number\" id=\"".concat(tree[currentNode].inputs[j].id, "\" class=\"free-text number od-input\" data-index=\"").concat(j, "\">"); // string += '<br><button type="button" class="btn btn-primary ml-2 mt-3" id="submit-free-text-button">Submit</button>';
        }

        inputCounter['freeTextCount'] = +1;
      }
    }

    ;

    if ((tree[currentNode].inputs.length !== 0)&&(tree[currentNode].inputs[0].type !== 'button')){
      string += '<br><button type="button" class="btn btn-primary ml-2 mt-3" id="submit-button">Submit</button>';
    }

    string += '</div><br><button type="button" class="btn btn-primary ml-2 mt-3" id="restart-button">Restart</button><button type="button" class="btn btn-primary ml-2 mt-3" id="back-button">Back</button>';
    document.getElementById(selectedDiv).innerHTML = string;
    document.addEventListener("click", listener);
  }

  ;

  function listener(event) {
    var target = event.target || event.srcElement; //Haptic Feedback on mobile devices

    if (supportsVibration) {
      window.navigator.vibrate(50);
    }

    if (target.id == 'answer-button') {
      var answerId = parseInt(target.value);
      checkAnswer(answerId, 'button');
    } else if (target.id == 'submit-button') {
      var inputs = document.getElementById('od-input-div').querySelectorAll('.od-input');
      var answer = {};
      inputs.forEach(function (i) {
        if (i.classList.contains('list-select')) {
          var inputIndex = parseInt(i.getAttribute("data-index"));
          answer['a'] = tree[currentNode].inputs[inputIndex].options[parseInt(i.value)];
        } else if (i.classList.contains('number-input')) {
          answer['a'] = i.value;
        } else if (i.classList.contains('date-input')) {
          answer['a'] = i.value;
        } else if (i.classList.contains('free-text')) {
          answer[i.id] = i.value;
        }
      });
      checkAnswer(answer);
    } else if (target.id == 'restart-button') {
      currentNode = tree.header.start_node;
      log = {
        'nodes': [],
        'answers': {}
      };
      displayNode();
    } else if (target.id == 'back-button') {
      if (log.nodes.length > 0) {
        delete log.answers[currentNode];
        currentNode = log.nodes.pop();
      } else {
        currentNode = tree.header.start_node;
        log = {
          'nodes': [],
          'answers': {}
        };
      }

      displayNode();
    }
  }

  ;

  function checkAnswer(answer, inputType) {
    log['nodes'].push(currentNode);
    log['answers'][currentNode] = answer;

    if (Object.keys(tree[currentNode].rules).length === 0) {
      if ('default' in tree[currentNode].destination) {
        // If only free text
        currentNode = tree[currentNode].destination['default'];
      } else {
        // If only buttons
        currentNode = tree[currentNode].destination[answer];
      }
    } else {
      // If we have rules
      var rule = jsonLogic.apply(tree[currentNode].rules, answer);
      currentNode = tree[currentNode].destination[rule];
    }

    console.log(log);
    displayNode();
  }

  ; // Initiate with path(s) for trees and div to display everything in, CSS classes later
  // Show question (display as safe html, look for variables) and display answers
  // list: take answers from a list in display selectfield with listener attached
  // date/number: show numberfield or datefield with datepicker attached, attach listener
  // end_node: show restart or save-button
  // Save/download progress function
  // Validate user input and give errors
  //Todo: JS translation

  return expose;
}();