
var map;
var drawingManager;
var initialArea = null;
var cuttingArea = null;
var cutPolygons = [];

function initializeMap() {
  var mapOptions = {
    center: { lat: -11.445496088549355, lng: -41.62850111985121 }, // -41.62850111985121,-11.445496088549355
    zoom: 17,
    mapTypeId: 'satellite',
  };

  map = new google.maps.Map(document.getElementById('map_canvas'), mapOptions);
  initializeDrawingManager();
}

function initializeDrawingManager() {
  drawingManager = new google.maps.drawing.DrawingManager({
    drawingMode: null,
    drawingControl: false,
    drawingControlOptions: {
      position: google.maps.ControlPosition.TOP_CENTER,
      drawingModes: [google.maps.drawing.OverlayType.POLYGON],
    },
    polygonOptions: {
      editable: true,
      draggable: true,
      fillColor: '#FF0000', 
      fillOpacity: 0.35,
      strokeColor: '#FF0000', 
      strokeOpacity: 0.8,
      strokeWeight: 2,
    },
  });

  drawingManager.setMap(map);

  google.maps.event.addListener(drawingManager, 'overlaycomplete', function (event) {
    if (event.type === google.maps.drawing.OverlayType.POLYGON) {
      if (!initialArea) {
        initialArea = event.overlay;
        cuttingArea = null;
        clearCuttingArea();
        startCut();
      } else if (!cuttingArea) {
        cuttingArea = event.overlay;
        drawingManager.setDrawingMode(null);
      } else {
        cuttingArea = null;
        drawingManager.setDrawingMode(google.maps.drawing.OverlayType.POLYGON);
      }
    }
  });
}

function startDrawing() {
  clearAreas();
  initialArea = null;
  cuttingArea = null;
  cutPolygons = [];
  drawingManager.setDrawingMode(google.maps.drawing.OverlayType.POLYGON);
}

function startCutting() {
  cuttingArea = null;
  drawingManager.setDrawingMode(google.maps.drawing.OverlayType.POLYGON);
}

function startCut() {
  if (cuttingArea && initialArea) {
    var initialCoords = getClosedPolygonCoords(initialArea.getPath().getArray());
    var cuttingCoords = getClosedPolygonCoords(cuttingArea.getPath().getArray());

    var initialTurfPolygon = turf.polygon([initialCoords.map(coord => [coord.lng(), coord.lat()])]);
    var cuttingTurfPolygon = turf.polygon([cuttingCoords.map(coord => [coord.lng(), coord.lat()])]);

    var intersection = turf.intersect(initialTurfPolygon, cuttingTurfPolygon);
    var difference = turf.difference(initialTurfPolygon, cuttingTurfPolygon);

    clearCutPolygons();
    cutPolygons = [];

    if (difference) {
      if (difference.geometry.type === "MultiPolygon") {
        difference.geometry.coordinates.forEach(function (polygonCoords) {
          var polygonLatLng = polygonCoords[0].map(coord => new google.maps.LatLng(coord[1], coord[0]));
          var cutPolygon = new google.maps.Polygon({
            paths: polygonLatLng,
            fillColor: '#FF0000', 
            fillOpacity: 0.35,
            strokeColor: '#FF0000',
            strokeOpacity: 0.8,
            strokeWeight: 2,
            editable: true,
            draggable: true,
          });
          cutPolygon.setMap(map);
          cutPolygons.push(cutPolygon);
        });
      } else if (difference.geometry.type === "Polygon") {
        var polygonLatLng = difference.geometry.coordinates[0].map(coord => new google.maps.LatLng(coord[1], coord[0]));
        var cutPolygon = new google.maps.Polygon({
          paths: polygonLatLng,
          fillColor: '#FF0000', 
          fillOpacity: 0.35,
          strokeColor: '#FF0000',
          strokeOpacity: 0.8,
          strokeWeight: 2,
          editable: true,
          draggable: true,
        });

        clearAreas();
        initialArea = null;
        cuttingArea = null;
        cutPolygons = [];
        drawingManager.setDrawingMode(google.maps.drawing.OverlayType.POLYGON);
        cutPolygon.setMap(map);
        cutPolygons.push(cutPolygon);
      }
    }
  }
}

function getClosedPolygonCoords(coords) {
  var closedCoords = coords.slice(); 
  if (closedCoords.length > 0) {
    var firstCoord = closedCoords[0];
    var lastCoord = closedCoords[closedCoords.length - 1];
    if (firstCoord.lat() !== lastCoord.lat() || firstCoord.lng() !== lastCoord.lng()) {
      closedCoords.push(firstCoord); 
    }
  }
  return closedCoords;
}

function clearAreas() {
  if (initialArea) {
    initialArea.setMap(null);
  }
  if (cuttingArea) {
    cuttingArea.setMap(null);
  }
  clearCutPolygons();
}

function clearCuttingArea() {
  if (cuttingArea) {
    cuttingArea.setMap(null);
  }
}

function clearCutPolygons() {
  cutPolygons.forEach(function (cutPolygon) {
    cutPolygon.setMap(null);
  });
  cutPolygons = [];
}

function clearCuttingAreas() {
  clearCutPolygons();
}

google.maps.event.addDomListener(window, 'load', initializeMap);
