

/*=================================
  =Directory - polysplitting.js
  =================================*/
/*
  REQUIRES: 
  --------------------
  1. Google Maps JavaScript API v3 (with geometry library)
    * https://maps.googleapis.com/maps/api/js?v=3.exp&libraries=geometry
 
  SECTIONS:
  --------------------
  1. Polygon Object
  2. myLineSegment Object
  3. myIntersectionPoint Object
  4. myPointInside Object
  5. Utility Functions
*/ 


/*=================================
  =Polygon Object
  =================================*/
  
  /* polygon - getBounds()
  ---------------------------------*/
  google.maps.MVCObject.prototype.getBounds = function () {
    var bounds = new google.maps.LatLngBounds();
    var path = this.getPath();
    
    // loop through path and extend the bounds with each point
    for (var i = 0, end = path.getLength(); i < end; i++) {
      bounds.extend(path.getAt(i));
    }
    return bounds;
  }


  /* polygon - initSelection(validate)
  ---------------------------------*/
  google.maps.MVCObject.prototype.initSelection = function (validate) {
    var map = this.getMap();
    var bounds = this.getBounds();

    // get each point of the polygon's bounds
    var ne = bounds.getNorthEast();
    var sw = bounds.getSouthWest();
    var nw = new google.maps.LatLng(ne.lat(), sw.lng());
    var se = new google.maps.LatLng(sw.lat(), ne.lng());

	var mid_east = new google.maps.LatLng((ne.lat() + se.lat())/2, ne.lng());
	var mid_west = new google.maps.LatLng((nw.lat() + sw.lat())/2, nw.lng());
	var center = new google.maps.LatLng((nw.lat() + sw.lat())/2, (ne.lng() + sw.lng())/2);

    var coords = [mid_east, mid_west];

	var splittingLine = new google.maps.Polyline({
	  path: coords,
      editable: true,
      draggable: true,
	  geodesic: true,
	  strokeColor: '#FF0000',
	  strokeOpacity: 1.0,
	  strokeWeight: 2
	});

    splittingLine.setMap(map);

    // add event listeners to ensure selection poly does not intersect itself
    if (validate === 'validate') {
      // use of debounce is highly reccomended when attaching to the "set_at" event
      var validatePoly = debounce(function (index) { 
        if (!(splittingLine.validate(index))) { 
          alert('Selection cant intersect itself') 
        } 
      }, 300);

      google.maps.event.addListener(splittingLine.getPath(), "insert_at", validatePoly);
      google.maps.event.addListener(splittingLine.getPath(), "remove_at", validatePoly);
      google.maps.event.addListener(splittingLine.getPath(), "set_at", validatePoly);
    }

    // return the value of the polygon
    return splittingLine;
  }


  /* polygon - getLineSegments(e)
  ---------------------------------*/
  google.maps.MVCObject.prototype.getLineSegments = function (e) {
    if (typeof e != 'number') {
      e = -1;
    }

    // declare an array to hold each line segment
    var lineSegments = [];

    // get the path of the polygon
    var path = this.getPath();

    // get the index of the last point in the path
	var lastPoint = path.getLength() - 1; // For Polygon
    if (this instanceof google.maps.Polyline) {
		lastPoint = path.getLength() - 1; // For Polyline
    }

    // if provided index (e) is within the polygon's path, return only the two line segments sharing that index
    if (e >= 0 && e <= lastPoint) {

      // set start at point before provided index (e)
      var index = (e === 0) ? lastPoint : e -1;

      for (var i = 0, end = 2; i < end; i++) {
        var startCoords = path.getAt(index);
        var startIndex = index;

        // connect the last point with the first point in the path to create the final line segment
        if (this instanceof google.maps.Polygon && index === lastPoint) {
          var endCoords = path.getAt(0);
          var endIndex = 0;
        }
        else {
          var endCoords = path.getAt(index + 1);
          var endIndex = index + 1;
        }

        // if we are at the last point in the path, set index at 0
        if (index === lastPoint) {
          index = 0;
        }
        else {
          index++;
        }

		if (startCoords && endCoords)
			lineSegments.push(new myLineSegment(startCoords, endCoords, startIndex, endIndex));
      }

      return lineSegments;
    }

    // an appropriate index was not provided therefore grab all the line segments
    for (var i = 0, end = path.getLength(); i < end; i++) {
      var startCoords = path.getAt(i);
      var startIndex = i;
      
      // connect the last point with the first point in the path to create the final line segment
      if (this instanceof google.maps.Polygon && i == lastPoint) {
        var endCoords = path.getAt(0);
        var endIndex = 0;
      }
      else {
        var endCoords = path.getAt(i + 1);
        var endIndex = i + 1;
      }

      // create new myLineSegment object and push it into array
	  
	  if (startCoords && endCoords)
		lineSegments.push(new myLineSegment(startCoords, endCoords, startIndex, endIndex));
    }

    return lineSegments;
  }


  /* polygon - validate(index)
  ---------------------------------*/
  google.maps.MVCObject.prototype.validate = function (index) {
    if (typeof index != 'number') {
      index = null;
    }

    // get the line segments of the polygon
    var polySegments = this.getLineSegments();

    // if an index is provided, only get the two segments sharing that index
    // if index is null then get all the line segments of this polygon
    var testSegments = this.getLineSegments(index);

    // loop through each test segment of the polygon
    for (var i = 0, end_i = testSegments.length; i < end_i; i++) {

      // loop through each segment of the polygon
      for (var j = 0, end_j = polySegments.length; j < end_j; j++) {
        
        // return false if there are any intersections
        if (testSegments[i].isIntersecting(polySegments[j])) {
          return false;
        }
      }
    }

    // if it makes it this far there are no intersections
    return true;
  }


  /* polygon - getRotation()
  ---------------------------------*/
  google.maps.MVCObject.prototype.getRotation = function () {
    // get the polygons path
    var path = this.getPath();

    // get the line segments of the polygon
    var lineSegments = this.getLineSegments();
    
    // sum the area of each line segment
    var sumArea = 0;
    
    for (var i = 0, end = lineSegments.length; i < end; i++) {
      sumArea += lineSegments[i].getUnderneathArea();
    }

    // if the area is greater than 0 then its path is rotating clockwise
    var rotation = (sumArea > 0) ? 1 : -1;
    return rotation;
  }


  /* polygon - countPointsInside(test)
  ---------------------------------*/
  google.maps.MVCObject.prototype.countPointsInside = function (test) {
    // if test is not a google maps Polygon object return null
    if (!(test instanceof google.maps.Polygon)) {
      return null;
    }

    // declare a variable to store the count
    var numPointsInside = 0;

    // loop through the test path
    var testPath = test.getPath();
    for (var i = 0, end = testPath.getLength(); i < end; i++) {

      // check if point is inside this polygon
      if (google.maps.geometry.poly.containsLocation(testPath.getAt(i), this)) {
        numPointsInside++;
      }
    }

    return numPointsInside;
  }


  /* polygon - getPointsInside(test)
  ---------------------------------*/
  google.maps.MVCObject.prototype.getPointsInside = function (test) {
    // if test is not a google maps Polygon object return null
    if (!(test instanceof google.maps.MVCObject)) {
      return null;
    }

    // declare an array to hold the points inside this polygon
    var pointsInside = [];

    // loop through the test path
    var testPath = test.getPath();
    for (var i = 0, end = testPath.getLength(); i < end; i++) {

      // check if point is inside this polygon
      if (google.maps.geometry.poly.containsLocation(testPath.getAt(i), this)) {

        // create new myPointInside object and push it into array
        var coords = testPath.getAt(i);
        var pathIndex = i;

        pointsInside.push(new myPointInside(coords, pathIndex));
      }
    }
    return pointsInside;
  }


  /* polygon - containsPoint(test)
  ---------------------------------*/
  google.maps.MVCObject.prototype.containsPoint = function (test) {
    // if test is not a google maps LatLng object return null
    if (!(test instanceof google.maps.LatLng)) {
      return null;
    }

    // check if point is inside this poly
    return google.maps.geometry.poly.containsLocation(test, this);
  }


  /* polygon - countIntersections(test)
  ---------------------------------*/
  google.maps.MVCObject.prototype.countIntersections = function (test) {
    // if test is not a google maps Polygon object return null
    if (!(test instanceof google.maps.MVCObject)) {
      return null;
    }

    // declare variables to count number of intersections
    var numIntersects = 0;

    // get the line segments of both polygons
    var polyLineSegments = this.getLineSegments();
    var testLineSegments = test.getLineSegments();

    // loop through each of this polygon's line segments
    for (var i = 0, end_i = polyLineSegments.length; i < end_i; i++) {

      // loop throuch each of the test polygon's line segments
      for (var j = 0, end_j = testLineSegments.length; j < end_j; j++) {

        // test each segment for an intersection point
        if (polyLineSegments[i].isIntersecting(testLineSegments[j])) {
          numIntersects++;
        }
      }
    }
    return numIntersects;
  }


  /* polygon - getIntersections(test)
  ---------------------------------*/
  google.maps.MVCObject.prototype.getIntersections = function (test) {
    // if test is not a google maps Polygon object return null
    if (!(test instanceof google.maps.MVCObject)) {
      return null;
    }

    // declare an array to hold the intersections points
    var intersectionPoints = [];

    // get the line segments of both polygons
    var polySegments = this.getLineSegments();
    var testSegments = test.getLineSegments();

    // loop through each polySegment
    for (var i = 0, end_i = polySegments.length; i < end_i; i++) {

      // loop through each testSegment
      for (var j = 0, end_j = testSegments.length; j < end_j; j++) {

        // check each segment for an intersection point
        if (polySegments[i].isIntersecting(testSegments[j])) {
          
          // get the intersection point for these lines
          var coords = polySegments[i].getIntersectionPoint(testSegments[j]);

          // get the two intersecting line segments
          var originalLine = polySegments[i];
          var selectionLine = testSegments[j];

          // create new myIntersectionPoint object and push it into array
          intersectionPoints.push(new myIntersectionPoint(coords, originalLine, selectionLine));
        }
      }
    }

    // exit function and return empty array
    if (intersectionPoints.length === 0) {
      return [];
    }

	intersectionPointsSorted = _orderIntersectionPoints(intersectionPoints);
	
	// return a JSON with the indexes of the points
	var originalLineFirstIndex = intersectionPointsSorted[0].originalLine.startIndex;
	var originalLineSecondIndex = intersectionPointsSorted[1].originalLine.startIndex;
	if (originalLineFirstIndex == originalLineSecondIndex) {
		originalLineSecondIndex++;
	}
	return [
		{point: intersectionPointsSorted[0], originalLineIndex: originalLineFirstIndex},
		{point: intersectionPointsSorted[1], originalLineIndex: originalLineSecondIndex}
	];
	
    // return the intersection points ordered by their distance from the start of original path
    return _orderIntersectionPoints(intersectionPoints);


    // private method to order the intersection points
    // first point will be the one closest to the start of the path
    function _orderIntersectionPoints(intersectionPoints) {
      
      // return an array sorted by distance from start of the original polygon's path
      return intersectionPoints.sort(_compare);
      
      function _compare(a, b) {
        // compare each intersection point's original line start index
        if (a.originalLine.startIndex > b.originalLine.startIndex) {
          return 1;
        }
        if (a.originalLine.startIndex < b.originalLine.startIndex) {
          return -1;
        }
        // if the intersection points are on the same line
        if (a.isOnSameLine(b)) {

          // determine the distance between the intersection points and the start of the original line
          var distanceA = google.maps.geometry.spherical.computeDistanceBetween(a.coordinates, a.originalLine.startCoords);
          var distanceB = google.maps.geometry.spherical.computeDistanceBetween(b.coordinates, a.originalLine.startCoords);

          if (distanceA > distanceB) {
            return 1;
          }
          if (distanceA < distanceB) {
            return -1;
          }
        }

        // if it makes it to this point they must be equal
        return 0;
      } // <-- _compare

    } // <-- _orderIntersectionPoints()

  } // <-- getIntersections()


  /* polygon - split(selectionPoly)
  ---------------------------------*/
  google.maps.MVCObject.prototype.split = function (selectionPoly) {
    // if selectionPoly is not a google.maps.Polygon object return null
    //if (!(selectionPoly instanceof google.maps.Polygon)) {
    //  alert('Parameter must be a google.maps.Polygon object.');
    //  return null;
    //}

    // if selectionPoly is self intersecting return null
    if (!(selectionPoly.validate())) {
      alert('Parameter cannot intersect with itself.');
      return null;
    }

    // count the number of intersections between the polygons
    var numIntersects = this.countIntersections(selectionPoly);

    // if there aren't exactly two intersection points return null
    if (numIntersects != 2) {
      alert('You have ' + numIntersects + ' intersections. Polygons must have exactly two intersections.');
      return null;
    }

    // declare arrays which will hold the points for the split polygons
    var outerPoly = [];
    var innerPoly = [];

    // get the paths of both polygons
    var originalPath = this.getPath();
    var selectionPath = selectionPoly.getPath();

    // get the last point in both paths
    var originalLastPoint = originalPath.getLength() - 1;
    var selectionLastPoint = selectionPath.getLength() - 1;

    // check if polygons have same rotation
    var sameRotation = (this.getRotation() === selectionPoly.getRotation());

    // get all the intersection points
    var intPoints = this.getIntersections(selectionPoly);
	var polygonPoints = originalPath.getArray();
	var linePoints = selectionPath.getArray();

	//////////////////
	// Detach the original polygon
	this.setMap(null);

	//////////////////
	// First Polygon
	var firstPolygonArray = [];
	var firstPolygonPriorPoints = polygonPoints.slice(0, intPoints[0].originalLineIndex+1);
	for (var i=0; i<firstPolygonPriorPoints.length; i++) {
		firstPolygonArray.push(firstPolygonPriorPoints[i].toJSON());
	}
	firstPolygonArray.push(intPoints[0].point.coordinates.toJSON());

	var polygonsSplittingLines = linePoints.slice(1, linePoints.length);
	for (var i=0; i<polygonsSplittingLines.length; i++) {
		firstPolygonArray.push(polygonsSplittingLines[i].toJSON());
	}
	firstPolygonArray.push(intPoints[1].point.coordinates.toJSON());

	var firstPolygonPostPoints = polygonPoints.slice(intPoints[1].originalLineIndex+1, polygonPoints.length);
	for (var i=0; i<firstPolygonPostPoints.length; i++) {
		firstPolygonArray.push(firstPolygonPostPoints[i].toJSON());
	}
	firstPolygonArray.push(polygonPoints[0].toJSON());
	
	var firstPolygon = new google.maps.Polygon({
          paths: firstPolygonArray,
          strokeColor: '#0000FF',
          strokeOpacity: 0.8,
          strokeWeight: 2,
          fillColor: '#0000FF',
          fillOpacity: 0.35
        });
    firstPolygon.setMap(map);

	//////////////////
	// Second Polygon
	var secondPolygonArray = [];
	secondPolygonArray.push(intPoints[0].point.coordinates.toJSON());
	var secondPolygonPriorPoints = polygonPoints.slice(intPoints[0].originalLineIndex+1, intPoints[1].originalLineIndex+1);
	for (var i=0; i<secondPolygonPriorPoints.length; i++) {
		secondPolygonArray.push(secondPolygonPriorPoints[i].toJSON());
	}

	secondPolygonArray.push(intPoints[1].point.coordinates.toJSON());
	var polygonsSplittingLines = linePoints.slice(1, linePoints.length-1);
	for (var i=polygonsSplittingLines.length-1; i>=0; i--) {
		secondPolygonArray.push(polygonsSplittingLines[i].toJSON());
	}
	secondPolygonArray.push(intPoints[0].point.coordinates.toJSON());
	
	var secondPolygon = new google.maps.Polygon({
          paths: secondPolygonArray,
          strokeColor: '#00FF00',
          strokeOpacity: 0.8,
          strokeWeight: 2,
          fillColor: '#00FF00',
          fillOpacity: 0.35
        });
    secondPolygon.setMap(map);

    // get all the points inside the original polygon
    var pointsInsideOriginal = this.getPointsInside(selectionPoly);
    var numPointsInsideOriginal = pointsInsideOriginal.length;

    // get all the points inside the selection polygon
    var pointsInsideSelection = selectionPoly.getPointsInside(this);
    var numPointsInsideSelection = pointsInsideSelection.length;

    // push the second intersection point
    outerPoly.push(intPoints[1].coordinates);
    innerPoly.push(intPoints[1].coordinates);

    if (selectionPoly.containsPoint(intPoints[1].originalLine.endCoords)) {
    
      /*====================  innerPoly  ==================== */
            
      // set index at first point after the second intersection point
      var index = intPoints[1].originalLine.endIndex;

      // loop through all the point of the originalPath that are between the two intersection points
      for (var i = 0, end = numPointsInsideSelection; i < end; i++) {

        innerPoly.push(originalPath.getAt(index));

        if (index === originalLastPoint) {
          index = 0;
        }
        else {
          index++;
        }
      }

      // push the first intersection point into the innerPoly
      innerPoly.push(intPoints[0].coordinates);

      // if there are any points inside the original poly
      if (numPointsInsideOriginal > 0) {

        if (sameRotation) {

          /*====================  outerPoly  ==================== */

          // set index at 2nd intersection point's selection line start index
          var index = intPoints[1].selectionLine.startIndex;

          // loop through the points inside in reverse order
          for (var i = 0, end_i = numPointsInsideOriginal; i < end_i; i++) {

            for (var j = 0, end_j = numPointsInsideOriginal; j < end_j; j++) {

              if (pointsInsideOriginal[j].pathIndex === index) {
                outerPoly.push(pointsInsideOriginal[j].coordinates);
              }
            }

            if (index === 0) {
              index = selectionLastPoint;
            }
            else {
              index--;
            }
          }

          /*====================  innerPoly  ==================== */

          // set index at 1st intersection point's selection line end index
          var index = intPoints[0].selectionLine.endIndex;

          // loop through the points inside in forward order
          for (var i = 0, end_i = numPointsInsideOriginal; i < end_i; i++) {

            for (var j = 0, end_j = numPointsInsideOriginal; j < end_j; j++) {

              if (pointsInsideOriginal[j].pathIndex === index) {
                innerPoly.push(pointsInsideOriginal[j].coordinates);
              }
            }

            if (index === selectionLastPoint) {
              index = 0;
            }
            else {
              index++;
            }
          }

        } // <-- if SAME rotation
        
        else {
          
          /*====================  outerPoly  ==================== */

          // set index at 2nd intersection point's selection line end index
          var index = intPoints[1].selectionLine.endIndex;

          // loop through the points inside in forward order
          for (var i = 0, end_i = numPointsInsideOriginal; i < end_i; i++) {

            for (var j = 0, end_j = numPointsInsideOriginal; j < end_j; j++) {

              if (pointsInsideOriginal[j].pathIndex === index) {
                outerPoly.push(pointsInsideOriginal[j].coordinates);
              }
            }

            if (index === selectionLastPoint) {
              index = 0;
            }
            else {
              index++;
            }
          }

          /*====================  innerPoly  ==================== */
          
          // set index at 1st intersection point's selection line start index
          var index = intPoints[0].selectionLine.startIndex;

          // loop through the points inside in forward order
          for (var i = 0, end_i = numPointsInsideOriginal; i < end_i; i++) {

            for (var j = 0, end_j = numPointsInsideOriginal; j < end_j; j++) {

              if (pointsInsideOriginal[j].pathIndex === index) {
                innerPoly.push(pointsInsideOriginal[j].coordinates);
              }
            }

            if (index === 0) {
              index = selectionLastPoint;
            }
            else {
              index--;
            }
          }

        } // <-- if DIFFERENT rotation


      } // <-- if there are points inside the original poly

      /*====================  outerPoly  ==================== */

      // push first intersection point into outerPoly array
      outerPoly.push(intPoints[0].coordinates);

      // set index at 1st intersection point's original line end index
      var index = intPoints[0].originalLine.endIndex;

      // loop through all the point of the originalPath that are between the two intersection points
      for (var i = 0, end = originalPath.getLength() - numPointsInsideSelection; i < end; i++) {

        outerPoly.push(originalPath.getAt(index));

        if (index === originalLastPoint) {
          index = 0;
        }
        else {
          index++;
        }
      }

    } // <-- if 2nd intersection point's original line end point is INSIDE the selection polygon

    else {

      /*====================  outerPoly  ==================== */

      // set index at 2nd intersection point's original line end index
      var index = intPoints[1].originalLine.endIndex

      // loop through all the point of the originalPath that are between the two intersection points
      for (var i = 0, end = originalPath.getLength() - numPointsInsideSelection; i < end; i++) {

        outerPoly.push(originalPath.getAt(index));

        if (index === originalLastPoint) {
          index = 0;
        }
        else {
          index++;
        }
      }

      // push 1st intersection point into outerPoly
      outerPoly.push(intPoints[0].coordinates);

      if (numPointsInsideOriginal > 0) {

        if (sameRotation) {
         
          /*====================  outerPoly  ==================== */          
          
          // set index at 1st intersection point's original line start index
          var index = intPoints[0].selectionLine.startIndex;

          // loop through the points inside in reverse order
          for (var i = 0, end_i = numPointsInsideOriginal; i < end_i; i++) {

            for (var j = 0, end_j = numPointsInsideOriginal; j < end_j; j++) {

              if (pointsInsideOriginal[j].pathIndex === index) {
                outerPoly.push(pointsInsideOriginal[j].coordinates);
              }
            }

            if (index === 0) {
              index = selectionLastPoint;
            }
            else {
              index--;
            }
          }

          /*====================  innerPoly  ==================== */

          // set index at 2nd intersection point's original line end index
          var index = intPoints[1].selectionLine.endIndex;

          // loop through the points inside in forward order
          for (var i = 0, end_i = numPointsInsideOriginal; i < end_i; i++) {

            for (var j = 0, end_j = numPointsInsideOriginal; j < end_j; j++) {

              if (pointsInsideOriginal[j].pathIndex === index) {
                innerPoly.push(pointsInsideOriginal[j].coordinates);
              }
            }

            if (index === selectionLastPoint) {
              index = 0;
            }
            else {
              index++;
            }
          }           

        } // <-- if SAME rotation

        else {
          
          /*====================  outerPoly  ==================== */

          // set index at 1st intersection point's original line end index
          var index = intPoints[0].selectionLine.endIndex;

          // loop through the points inside in forward order
          for (var i = 0, end_i = numPointsInsideOriginal; i < end_i; i++) {

            for (var j = 0, end_j = numPointsInsideOriginal; j < end_j; j++) {

              if (pointsInsideOriginal[j].pathIndex === index) {
                outerPoly.push(pointsInsideOriginal[j].coordinates);
              }
            }

            if (index === selectionLastPoint) {
              index = 0;
            }
            else {
              index++;
            }
          }

          /*====================  innerPoly  ==================== */

          // set index at 2nd intersection point's original line start index
          var index = intPoints[1].selectionLine.startIndex;

          // loop through the points inside in reverse order
          for (var i = 0, end_i = numPointsInsideOriginal; i < end_i; i++) {

            for (var j = 0, end_j = numPointsInsideOriginal; j < end_j; j++) {

              if (pointsInsideOriginal[j].pathIndex === index) {
                innerPoly.push(pointsInsideOriginal[j].coordinates);
              }
            }

            if (index === 0) {
              index = selectionLastPoint;
            }
            else {
              index--;
            }
          }                   

        } // <-- if DIFFERENT rotation


      } // <-- if there are points inside the original poly

      /*====================  innerPoly  ==================== */

      // push 1st intersection point into innerPoly
      innerPoly.push(intPoints[0].coordinates);

      // set index at 1st intersection point's original line end index
      var index = intPoints[0].originalLine.endIndex;

      // loop through all the point of the originalPath that are between the two intersection points
      for (var i = 0, end = numPointsInsideSelection; i < end; i++) {

        innerPoly.push(originalPath.getAt(index));

        if (index === originalLastPoint) {
          index = 0;
        }
        else {
          index++;
        }
      }

    } // <-- if 2nd intersection point's original line end point is OUTSIDE the selection polygon

    return [outerPoly, innerPoly];
  }


/*=================================
  =myLineSegment Object
  =================================*/
  // startCoords/endCoords should be a google.maps.LatLng object
  // startIndex/endIndex should be a number representing its index in the polygon's path
  function myLineSegment(startCoords, endCoords, startIndex, endIndex) {
    this.startCoords = startCoords;   
    this.endCoords = endCoords;
    this.startIndex = startIndex;
    this.endIndex = endIndex;

    this.x1 = startCoords.lng();
    this.y1 = startCoords.lat();
    this.x2 = endCoords.lng();
    this.y2 = endCoords.lat();
  }


  // method to test if lineSegment intersects with another
  // returns boolean
  myLineSegment.prototype.isIntersecting = function(testSegment) {
    // checks if testSegment is a myLineSegment object
    if (!(testSegment instanceof myLineSegment)) {
      return false;
    }

    var p1 = this.startCoords;
    var p2 = this.endCoords;
    var p3 = testSegment.startCoords;
    var p4 = testSegment.endCoords;

    // if the line segments share a point return false
    if (p1 === p3 || p1 === p4 || p2 === p3 || p2 === p4) {
      return false;
    }
    else {
      return (_CCW(p1, p3, p4) != _CCW(p2, p3, p4)) && (_CCW(p1, p2, p3) != _CCW(p1, p2, p4));
    }

    // tests if points rotate counter clockwise
    // returns boolean
    function _CCW(p1, p2, p3) {
      a = p1.lng(); b = p1.lat();
      c = p2.lng(); d = p2.lat();
      e = p3.lng(); f = p3.lat();

      return (f - b) * (c - a) > (d - b) * (e - a);
    }

  } // <-- isIntersecting()


  // method to get the slope of the line segment
  // returns a number or null
  myLineSegment.prototype.getSlope = function() {
    if (this.x1 === this.x2) {
      return null; // slope is undefined on a vertical line
    }
    else if (this.y1 === this.y2) {
      return 0; // slope is zero on a horizontal line
    }
    else {
      return (this.y2 - this.y1) / (this.x2 - this.x1);
    }
  }


  // method to get the y-intercept of the line segment
  // returns a number or null
  myLineSegment.prototype.getYIntercept = function() {
    if (this.getSlope() === null) {
      return null; // y-intercept is undefined on a vertical line
    }
    else if (this.getSlope() === 0) {
      return this.y1; // y-intercept is equal to y1 on a horiztonal line
    }
    else {
      return this.y1 - (this.getSlope() * this.x1);
    }
  } 

  // method to get the area undearth the line segment
  // returns a number
  myLineSegment.prototype.getUnderneathArea = function() {
    return (this.x2 - this.x1) * (this.y2 + this.y1);
  }
  

  // method to get the intersection point of this line segment and another
  // success: returns google maps LatLng object
  // fail: returns null
  myLineSegment.prototype.getIntersectionPoint = function(testSegment) {   
    // returns null if testSegment is not a myLineSegment object
    if (!(testSegment instanceof myLineSegment)) {
      return null;
    }

    // returns null if the lines don't intersect
    if (!(this.isIntersecting(testSegment))) {
      return null;
    }

    // declare variables to hold intersection coords
    var x;
    var y;

    // get the slope and y-intercept for both lines
    var line1_slope = this.getSlope();
    var line1_yInt = this.getYIntercept();
    var line2_slope = testSegment.getSlope();
    var line2_yInt = testSegment.getYIntercept(); 

    // check if both lines have a y-intercept
    if (line1_yInt != null && line2_yInt != null) {
      
      // check if line1 is a horizontal line
      if (line1_slope === 0) {
        x = (line1_yInt - line2_yInt) / line2_slope;
        y = line1_yInt;
      }
      // check if line2 is a horizontal line
      else if (line2_slope === 0) {
        x = (line2_yInt - line1_yInt) / line1_slope;
        y = line2_yInt;
      }
      else {
        x = (line2_yInt - line1_yInt) / (line1_slope - line2_slope);
        y = (line1_slope * x) + line1_yInt;
      }
    }
    else {

      // check if line1 is a vertical line
      if (line1_slope === null) {

        // check if line2 is a horizontal line
        if (line2_slope === 0) {
          x = this.x1;
          y = testSegment.y1;
        }
        else {
          x = this.x1;
          y = (x * line2_slope) + line2_yInt;
        }
      }
      // check if line2 is a vertical line
      else if (line2_slope === null) {

        // check if line1 is a horizontal line
        if (line1_slope === 0) {
          x = testSegment.x1;
          y = this.y1;
        }
        else {
          x = testSegment.x1;
          y = (x * line1_slope) + line1_yInt;
        }
      }
    }

    // return intersection point as a google maps LatLng object
    return new google.maps.LatLng(y, x);
  } // <-- getIntersectionPoint


/*=================================
  =myIntersectionPoint Object
  =================================*/
  // coords should be the value of intersectionPoint() function
  // originalLine/selectionLine should be a myLineSegment object
  function myIntersectionPoint(coords, originalLine, selectionLine) {
    this.coordinates = coords;
    this.originalLine = originalLine;
    this.selectionLine = selectionLine;
  }

  // method to test if intersection point is on the same line as another
  myIntersectionPoint.prototype.isOnSameLine = function (test) {
    // return false if test is not a myIntersectionPoint object
    if (!(test instanceof myIntersectionPoint)) {
      return false;
    }

    return (this.originalLine.startIndex === test.originalLine.startIndex) && (this.originalLine.endIndex === test.originalLine.endIndex)
  }


/*=================================
  =myPointInside Object
  =================================*/
  // coords should be the value of pointsInside() function
  // pathIndex should be a number  
  function myPointInside(coords, pathIndex) {
    this.coordinates = coords;
    this.pathIndex = pathIndex;
  }


/*=================================
  =Utility Functions
  =================================*/
  function debounce(fn, delay) {
    var timer = null;
    return function () {
      var context = this, args = arguments;
      clearTimeout(timer);
      timer = setTimeout(function () {
        fn.apply(context, args);
      }, delay);
    };
  }



