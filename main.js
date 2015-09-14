


siteUrl = "http://gfdrr.github.io/dominica-erika", 
Assessments = new L.layerGroup(),
fullImg = null,
thumbnail = null,
selectedCoords = null,
width = $(window).width(),
images = null,
assessment_id = null,
repoUrl = "https://s3.amazonaws.com/dominica-erika/images/";
//bucket = new AWS.S3({params: {Bucket: 'images'}});


var osmLayer = L.tileLayer('http://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', { maxZoom: 20, attribution: 'Data \u00a9 World Bank, GFDRR Labs, Government of Dominica <a href="http://www.openstreetmap.org/copyright"> OpenStreetMap Contributors </a> Tiles \u00a9 HOT' })




//Initiate the map
var map = L.map('map', {
  layers: [osmLayer]
});




var basemaps = {
  "Open Street Map": osmLayer,
},

  overlays = {
    "Assessments": Assessments,
  }



L.control.layers(basemaps, overlays).addTo(map);




/*
    ###### TOOLS #######
*/
//Get the points from the api
map.on('load', function (e) {
  console.log('map loaded');

  requestPoints().then(function (data) {
    console.info('points return', data);
    L.geoJson(data, {

      pointToLayer: function (feature, latlng) {

        console.info('point to layer features', feature);



        var ptMarker = L.marker(latlng);


        if (feature.properties.priority === "LOW") {
          ptMarker = L.circleMarker(latlng, {
            fill: true,
            fillColor: 'green',
            fillOpacity: 0.8,
            stroke: false
          });
        }

        else if (feature.properties.priority === "MEDIUM") {
          ptMarker = L.circleMarker(latlng, {
            fill: true,
            fillColor: 'goldenrod',
            fillOpacity: 0.8,
            stroke: false
          });
        }

        else if (feature.properties.priority === "HIGH") {
          ptMarker = L.circleMarker(latlng, {
            fill: true,
            fillColor: 'red',
            fillOpacity: 0.8,
            stroke: false
          });
        } else {
          ptMarker = L.circleMarker(latlng, {
            fill: true,
            fillColor: 'gray',
            fillOpacity: 0.8,
            stroke: false
          });
        }




        var contentTemplate = [
          '<div class="popupcontent">',
          '<h4>{name}</h4>',
          '<div>',
            '<ul id="imgSlideshow" class="bxslider">',
            '</ul>',
          '</div> Click Section to Expand',  
          '<ul class="collapsible" data-collapsible="accordion">',   
          '<li>',
              '<div class="collapsible-header active"><b>DETAILS</b></div>',
              '<div class="collapsible-body"><table style="font-size:inherit">',
                '<thead>',
                '<tr>',
                   '<th>Cost Estimate</th>', 
                    '<th>Damages</th>',
                    '<th>Urgent Works</th>',
                    '<th>Long Term Works</th>',
                    '<th>Current Use</th>',
                '</tr>',
                '</thead>',
              '<tbody>',
               '<tr>',
               '<td>{costs}</td>', 
               '<td>{damage}</td>',
               '</tr>',
               '</tbody></table>',
           '</div>',
          '</li>',    
          '<li>',
            '<div class="collapsible-header"><b>COMMENTS</b></div>', 
            '<div class="collapsible-body"><div id="comments"></div><div><button class="waves-effect waves-light btn" id="addComment">Add Comment</button></div></div>',
            '</div>',  

          '</li>',

          // '<div><b>UPLOAD IMAGE:</b></div>',
          // '<input name="imagefile[]" type="file" id="takePictureField" accept="image/*" />',
          '</div>'
        ].join('');

        var utilTemplate = {
          name: feature.properties.name,
          priority: feature.properties.priority,
          costs: feature.properties.cost_estimate,
          current_use: feature.properties.current_use,
          damage: feature.properties.damage,
          long_term_works: feature.properties.long_term_works,
          urgent_works: feature.properties.urgent_works
        };   
         
     

        //        // If the display can fit the entire image         
        ptMarker.bindPopup(L.Util.template(contentTemplate, utilTemplate,
          {

          }));


        ptMarker.on('popupopen', function (e) {
            $('.collapsible').collapsible({
      accordion : false // A setting that changes the collapsible behavior to expandable instead of the default accordion style
    });

          var arr = feature.properties.images.split(',');
          $(arr).each(function (index, row) {
            $('#imgSlideshow').append('<li><img class="imgsize" src="' + repoUrl + row + '"></img></li>')

          })

          $('.bxslider').bxSlider();


          $('#addComment').on('click', function () {
            $('#commentmodal').openModal();
            assessment_id = feature.properties.cartodb_id;


          })
         
          // Handle Comments
          callComments(feature.properties.cartodb_id)
        })
        return Assessments.addLayer(ptMarker);

      }
        
             
    });

    Assessments.addTo(map);
    var legend = L.control({ position: 'bottomright' });

    legend.onAdd = function (map) {
      var div = L.DomUtil.create('div', 'info legend');

      div.innerHTML = [
        '<div class="ptLegend"><div><b>PRIORITIES</b></div>',
        
        '<div><div class="circle inlineElements" style="background-color:red"></div><div class="inlineElements">HIGH</div></div>',
        '<div><div class="circle inlineElements" style="background-color:goldenrod"></div><div class="inlineElements">MEDIUM</div></div>',
        '<div><div class="circle inlineElements" style="background-color:green"></div><div class="inlineElements">LOW</div>',
        '<div ><div class="circle inlineElements" style="background-color:gray;"></div><div class="inlineElements">N/A</div></div>',

        '</div>'
      ].join('');

      return div;
    };

    legend.addTo(map);




  });




});

var attribution = L.control({ position: 'bottomleft' });

attribution.onAdd = function(map){
      var div = L.DomUtil.create('div', 'attribution');
       div.innerHTML = '<div><div class="inlineElements"><img src="https://s3.amazonaws.com/dominica-erika/images/gfdrr_logo.png"/></div></div>'





      return div;
    ;


      
}

attribution.addTo(map);


map.setView([15.4, -61.3], 11);



var geocoder = L.Control.geocoder({
  collapsed: false,
  position: 'topleft'
}).addTo(map);

geocoder.markGeocode = function (result) {
  map.fitBounds(result.bbox);
};



$("#save-btn").click(function () {

  addComment();
});



//Clears the map settings post modal close
function resetMap() {
  
}

//Disable the image upload if an image link is entered
$("#imageLink").change(function () {
  $("#takePictureField").prop('disabled', true);
})


//If uploading file 
$("#takePictureField").change(function (url) {
    
  // Read in file
  var file = event.target.files[0];
  processImage(file);

  $("#imageLink").prop('disabled', true);

});

// CONSTRUCTORS AND UTILITY FUNCTIONS


// Image processing function 
var processImage = function (file) {

  if (file.type.match(/image.*/)) {
    // Load the image
    var reader = new FileReader();
    reader.onload = function (readerEvent) {

      var image = new Image();

      image.onload = function (imageEvent) {
        fullImg = resizeImage(image, 600);
        thumbnail = resizeImage(image, 40);
      }
      image.src = readerEvent.target.result;
    }
    reader.readAsDataURL(file);
  } else {
    // !!! NEED TO RETURN ERROR IF THE USER HAS NOT ENTERED AN IMAGE
  }
}


// Image resizing before sending to the api
var resizeImage = function (image, size) {

  var canvas = document.createElement('canvas'),
    max_size = size,
    width = image.width,
    height = image.height;
  if (width > height) {
    if (width > max_size) {
      height *= max_size / width;
      width = max_size;
    }
  } else {
    if (height > max_size) {
      width *= max_size / height;
      height = max_size;
    }
  }
  canvas.width = width;
  canvas.height = height;
  canvas.getContext('2d').drawImage(image, 0, 0, width, height);
  var dataUrl = canvas.toDataURL('image/jpeg'); //creates base64 image string
  var resizedImage = dataURLToBlob(dataUrl);

  return dataUrl;


}

/* Utility function to convert a canvas to a BLOB */
var dataURLToBlob = function (dataURL) {
  var BASE64_MARKER = ';base64,';
  if (dataURL.indexOf(BASE64_MARKER) == -1) {
    var parts = dataURL.split(',');
    var contentType = parts[0].split(':')[1];
    var raw = parts[1];

    return new Blob([raw], { type: contentType });
  }

  var parts = dataURL.split(BASE64_MARKER);
  var contentType = parts[0].split(':')[1];
  var raw = window.atob(parts[1]);
  var rawLength = raw.length;

  var uInt8Array = new Uint8Array(rawLength);

  for (var i = 0; i < rawLength; ++i) {
    uInt8Array[i] = raw.charCodeAt(i);
  }

  return new Blob([uInt8Array], { type: contentType });
}



function requestPoints() {


  var req = $.getJSON('https://gfdrr-innovationlab.cartodb.com/api/v2/sql?format=GeoJSON&q=SELECT * FROM dominica_assessments&api_key=beed66b266b802efe70f3dd1cc0dd857d24c6185');

  return req


};

function callComments(fk) {
  var req = $.getJSON('https://gfdrr-innovationlab.cartodb.com/api/v2/sql?q=SELECT * FROM dominica_comments WHERE foreign_key=' + fk + '&api_key=beed66b266b802efe70f3dd1cc0dd857d24c6185');
  req.then(function (data) {

    $('#comments').html('<div></div>');
    $(data.rows).each(function (index, row) {

      //this wrapped in jQuery will give us the current .letter-q div
      $('#comments').append('<div class="commentcontent"><b>Name:</b> ' + row.commenter + '</br><b>Comment: </b>' + row.comments + '</div>');
    });


  });
  return;
}

function addComment() {

  var userName = $('#commentName').val(),
    userComment = $('#commentField').val(),
    fk = assessment_id.toString();
  
  //INSERT INTO "gfdrr-innovationlab".dominica_comments ("commenter","comments","foreign_key") VALUES ('test','test','12')
  
  $.post('https://gfdrr-innovationlab.cartodb.com/api/v2/sql?q=INSERT INTO dominica_comments ("commenter","comments","foreign_key") VALUES(' + "'" + userName + "'," + "'" + userComment + "'," + "'" + fk + "'" + ')&api_key=beed66b266b802efe70f3dd1cc0dd857d24c6185')
    .done(function () {
    Materialize.toast('Comment added', 2000);
     
  });
  $('#commentmodal').closeModal();
  $('#commentName').val('');
     $('#commentField').val('');
  callComments(assessment_id);

}


