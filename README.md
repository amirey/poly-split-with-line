# Split polygons in Google Maps
A Google Maps JavaScript API v3 library to split an exisiting polygon into two separate polygons.

## Installation
#### Step 1
Add the Google Maps JavaScript API version 3 with the geometry library.
```html
<script type="text/javascript" src="https://maps.googleapis.com/maps/api/js?v=3.exp&libraries=geometry"></script>
```
#### Step 2
Add the polysplitting.js file.
```html
<script type="text/javascript" src="js/polysplitting.min.js"></script>
```
  
## Usage
#### Step 1
Initialize a map with a polygon.
```javascript
var map;
var demoPoly;
var coords = [{lat: 51.4326, lng: -1.8486},{lat: 51.4333, lng: -1.8473},{lat: 51.4330, lng: -1.8458},{lat: 51.4320, lng: -1.8454},{lat: 51.4313, lng: -1.8466},{lat: 51.4316, lng: -1.8482}];

function initMap() {
  map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: 51.4323, lng: -1.8470 },
    zoom: 17,
    mapTypeId: google.maps.MapTypeId.SATELLITE
  });

  demoPoly = new google.maps.Polygon({
    paths: coords,
    strokeColor: "#0000FF",
    strokeOpacity: 0.8,
    strokeWeight: 2,
    fillColor: "#0000FF",
    fillOpacity: 0.25,
    zIndex: 0
  });
  demoPoly.setMap(map);
}
   
initMap();
```
#### Step 2
Call **.initSelection()** method on your polygon and store it in a variable.
```javascript
// pass in 'validate' as a parameter to fire an alert when the selection box intersects itself
var selectionPoly = demoPoly.initSelection('validate');
```

#### Step 3
Call **.split()** method on your polygon and pass in your selectionPoly as a parameter and store it in a variable.
```javascript
// get an array containing the result of the split
// index: 0 = outer polygon
// index: 1 = inner polygon
// returns null if the split fails 
var splitPolys = demoPoly.split(selectionPoly);
```

#### Step 4
Now you can draw your new polygons on the map!
```javascript
if (splitPolys != null) {
  var outerPoly = new google.maps.Polygon({
    paths: splitPolys[0],
    strokeColor: "#0000FF",
    strokeOpacity: 0.8,
    strokeWeight: 2,
    fillColor: "#0000FF",
    fillOpacity: 0.25,
    zIndex: 2
  });
  outerPoly.setMap(map);

  var innerPoly = new google.maps.Polygon({
    paths: splitPolys[1],
    strokeColor: "#FF0000",
    strokeOpacity: 0.8,
    strokeWeight: 2,
    fillColor: "#FF0000",
    fillOpacity: 0.5,
    zIndex: 2
  });
  innerPoly.setMap(map);
}
```

## Known Limitations
##### The .split() method only accepts polygons as a parameter
* The parameter cannot be a self-intersecting polygon.
* The parameter must intersect the other polygon exactly two times.

##### Doesn't account for the curvature of the Earth
* The result of the .split() will be slightly off when called on large polygons(ie. the size of california).

## License
```
The MIT License (MIT)

Copyright (c) 2016 Trent Mentink

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## Author
#### [Trent Mentink](http://www.trentmentink.com)
