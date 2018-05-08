"use strict";

(() => {
    window.SmartClosetSearchController = {
        init: () => {
            let goButton = $("#go-button");
            let searchTerm = $("#search-term");
            let infoCard = $(".card");
            let addInfo = "";
            let locationData = "";
            let errorResponse = "Check your spelling.";
            let searchTermData = "";
            let originRE = /(?<=origin)[^\\]*/;
            let birth_placeRE = /(?<=birth_place)[^\\]*/;
            let location;
            let url = "";
            let skipFlag = false;
            let loopCounter = 1;
            let prevSearchTerm;
            let inceptionCounter = 0;

            function codeAddress() {
              let address = location;
              console.log("In codeAddress")
              console.log("ADDRESS:" + address);
              geocoder.geocode( { 'address': address}, function(results, status) {
                if (status == 'OK') {
                  map.setCenter(results[0].geometry.location);
                  var marker = new google.maps.Marker({
                    map: map,
                    position: results[0].geometry.location
                  });
                }
                // else {
                //   alert('Geocode was not successful for the following reason: ' + status);
                // }
              });
            }

            String.prototype.replaceBetween = function(start, end, what) {
              return this.substring(0, start) + what + this.substring(end);
            };

            function createURL() {
              function titleCase() {
                searchTerm = $("#search-term");
                searchTerm = searchTerm.val();
                console.log("current search term: " + searchTerm);
                searchTerm =  searchTerm.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
              }
              titleCase(searchTerm);
              console.log("search term caps: " + searchTerm);

              if (searchTerm.includes(" ") == true) {
                searchTerm = searchTerm.replace(" ", "%20");
              }
              console.log("search term sin space: " + searchTerm);
              url = "https://en.wikipedia.org/w/api.php?action=query&titles=" + searchTerm + "&prop=revisions&rvprop=content&format=json&formatversion=2";
              console.log("original url: " + url);
              return url;

            }

            function redoSearch() {
              skipFlag = true;
              console.log("LOOP COUNTER: " + loopCounter);
              if (loopCounter == 1) {
                addInfo = " (musician)";
                console.log("adding musician");
              } else if (loopCounter == 2) {
                searchTerm = prevSearchTerm;
                addInfo = " (band)";
                console.log("adding band");
              }
              console.log("location data is undefined");
              console.log("old search term is: " + searchTerm);
              searchTerm = searchTerm + addInfo;
              console.log("add info is: " + addInfo);
              console.log("new search term is: " + searchTerm);
              if (searchTerm.includes(" ")) {
                searchTerm = searchTerm.replace(" ", "%20");
                console.log("search term: " + searchTerm);
              }
              url = "https://en.wikipedia.org/w/api.php?action=query&titles=" + searchTerm + "&prop=revisions&rvprop=content&format=json&formatversion=2";
              console.log("redo url: " + url);
            }

            function regexFunction(originData) {
              try {
                  searchTermData = originData.query.pages[0].revisions[0].content;
              }
              catch(err) {
                  infoCard.empty().append(errorResponse);
              }
              searchTermData = JSON.stringify(searchTermData);

              if (searchTermData.includes("birth_place")) {
                console.log("in birth_place loop 1");
                locationData = searchTermData.match(birth_placeRE);
                console.log("Location Data: " + locationData);
                console.log("ADDINFO: " + addInfo);
              } else if (searchTermData.includes("origin")) {
                locationData = searchTermData.match(originRE);
                console.log("in origin loop");
                console.log("after regex: " + locationData);
                console.log("ADDINFO: " + addInfo);
              }
            }

            function cleanup() {
              if (locationData[0].includes("[[")) {
                locationData = locationData[0].split("[[");
                locationData[1] = locationData[1].replace("[[", "");
                locationData[1] = locationData[1].replace("]]", "");
                location = locationData[1];
                console.log("post split1:" + location);
                console.log("skip: " + inceptionCounter);
                if(inceptionCounter != 0){
                  infoCard.empty().append("Origin Location: " + location);
                  codeAddress();
                  finishingTouches();
                }
              } else {
                console.log("pre split:" + locationData);
                locationData = locationData[0].replace(" = ", "");
                location = locationData;
                console.log("post split2:" + locationData);
                if(inceptionCounter != 0){
                  finishingTouches();
                }
              }
            }

            function finishingTouches() {
              console.log("AFTER CLEANUP LOCATION DATA 1:" + location);
              console.log("RESETTING EVERYTING");

              infoCard.empty().append("Origin Location: " + location);
              codeAddress();
              locationData = "";
              location = "";
              loopCounter = 1;
              skipFlag = false;
              console.log("____________________________________________________________");
            }

            goButton.click(() =>
                $.getJSON(createURL(), function(originData1){
                    inceptionCounter = 0;
                    prevSearchTerm = "";
                    initMap();
                    infoCard.show();
                    regexFunction(originData1);
                    // REDOING
                    if (locationData == "") {
                        console.log("IN REDO LOOP!!!!!!");
                        inceptionCounter += 1;
                        prevSearchTerm = searchTerm;
                        redoSearch();
                        console.log("REDO SEARCH DONE, DOPE!");
                    }
                    if (skipFlag == false) {
                      cleanup();
                    } else {
                      console.log("REDO ELSE STATEMENT REACHED");
                      $.getJSON(url, function(originData2){
                        regexFunction(originData2);

                        if (locationData == "") {
                          console.log("second redo search");
                          loopCounter += 1;
                          console.log("Loop Counter: " + loopCounter);
                          redoSearch();
                        }

                        if (loopCounter == 1){
                          cleanup();
                        } else {
                          $.getJSON(url, function(originData3){
                            regexFunction(originData3);
                            if(locationData != "") {
                              cleanup();
                            }else {
                              finishingTouches
                            }
                          })
                        }
                      })
                      console.log("DONE WITH ELSE STATEMENT");
                      skipFlag = false;
                    }
                    // see if this is necessary
                    if (location != undefined) {
                      finishingTouches();
                    }
                }
              ));
        }
    };
})();
