/* import { initializeMap } from "./map";
import { loadGeojsonData, loadHorairesData, attachHorairesToStations } from "./data";
import { departementSelect, handleDepartmentChange } from "./filter";
import { afficherHoraires, afficherMenu, afficherSection, afficherNomGare } from "./affichage";

 */
 let map, geojsonLayer, geojsonData

window.onload = async () => {
  try {
    initializeMap();
    geojsonData = await loadGeojsonData();
    const horaires = await loadHorairesData();
    attachHorairesToStations(geojsonData, horaires);

    geojsonLayer = createGeoJsonLayer(geojsonData);
    geojsonLayer.addTo(map);

    const departmentSelect = document.getElementById('department-select');
    departementSelect(geojsonData, departmentSelect);

    departmentSelect.addEventListener('change', (event) => {
      handleDepartmentChange(event.target.value, geojsonData);
    });

    const stationSelect = document.getElementById("station-select");
    stationSelect.addEventListener('change', () => {
        const coordinates = JSON.parse(stationSelect.value);
        if (coordinates) {
            map.setView([coordinates[1], coordinates[0]], 13);

            const feature = geojsonData.features.find(f => {
                const featureCoordinates = f.geometry.coordinates;
                return featureCoordinates[0] === coordinates[0] && featureCoordinates[1] === coordinates[1];
            });

            if (feature) {
                afficherNomGare(feature.properties.libelle);
                afficherMenu();
                afficherHoraires(feature);
            }
        }
    });

  } catch (error) {
    console.error("Une erreur est survenue :", error);
    alert("Une erreur est survenue : " + error.message);
  }
};


/* map */
 function initializeMap() {
    map = L.map('map', {
      center: [48.4, 2.5],
      zoom: 6
    });
  
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 20
    }).addTo(map);
}

function resetMap() {
    if (geojsonLayer) {
        map.removeLayer(geojsonLayer);
    }

    geojsonLayer = createGeoJsonLayer(geojsonData);
    geojsonLayer.addTo(map);
}



 function createGeoJsonLayer(geojsonData) {
    return L.geoJSON(geojsonData, {
      onEachFeature: (feature, layer) => {
        setTimeout(() => {
          layer.on('click', () => {
              afficherNomGare(feature.properties.libelle);
              afficherMenu();
              afficherHoraires(feature);
          });
        }, 100);
      },
      pointToLayer: (feature, latlng) => {
        return L.circleMarker(latlng, {
          radius: 6,
          fillColor: "#007bff",
          color: "#000",
          weight: 1,
          opacity: 1,
          fillOpacity: 0.8
        });
      }
    });
  }


/* data */
 async function loadGeojsonData() {
    const geojsonResponse = await fetch("liste-des-gares.geojson");
    return await geojsonResponse.json();
}

async function loadHorairesData() {
    const response = await fetch("horaires-des-gares1.csv");
    const text = await response.text();
  
    const lignes = text.split("\n"); 
    const header = lignes[0].split(";");
    const data = lignes.slice(1).map((ligne) => {
      const valeurs = ligne.split(";");
      return header.reduce((acc, key, index) => {
        const value = valeurs[index]?.trim();
  
        acc[key.trim()] = value;
        return acc;
      }, {});
    });
  
    return buildHoraires(data);
}


/* gestion horaires */
 function attachHorairesToStations(geojsonData, horaires) {
    geojsonData.features.forEach(feature => {
      const libelle = feature.properties.libelle;
      const gare = horaires[libelle];
      if (gare) {
        feature.properties.horaires = gare.map(j => ({
          jour: j.jour_de_la_semaine,
          horaireNormaux: j.horaire_en_jour_normal,
          horaireFerie: j.horaire_en_jour_ferie
        }));
      }
    });
}

/**
 * Le fichier CSV des horaires contient pour chaque jour de la semaien un horaire pour la gare, cette fonction regroupe pour chazque gare, ses horaires de la semaine en un seul tableau
 * @param {*} horairesCSV 
 * @returns 
 */

 function buildHoraires(horairesCSV) {
      return horairesCSV.reduce((acc, current) => {
      const gare = current.gare;
      if (!acc[gare]) {
          acc[gare] = [];
      }
      acc[gare].push(current);
      return acc;
      }, {});
}

/* gestion des gares et listes des gares */

 function updateStationList(features) {
    const stationSelect = document.getElementById("station-select");
    stationSelect.innerHTML = ''; 
  
    features.forEach(f => {
      const option = document.createElement('option');
      option.value = JSON.stringify(f.geometry.coordinates);
      option.textContent = f.properties.libelle;
      stationSelect.appendChild(option);
    });
}


/* filtre */
 function handleDepartmentChange(department, geojsonData) {
    if (geojsonLayer) {
      map.removeLayer(geojsonLayer);
    }
  
    const filteredData = {
      type: "FeatureCollection",
      features: department === "all"
        ? geojsonData.features
        : geojsonData.features.filter(f => f.properties.departemen === department)
    };
  
    geojsonLayer = createGeoJsonLayer(filteredData);
    geojsonLayer.addTo(map);
  
    const bounds = geojsonLayer.getBounds();
    if (bounds.isValid()) {
      map.fitBounds(bounds);
    }
  
    updateStationList(filteredData.features);
}


 function departementSelect(geojsonData, departmentSelect) {
    const departments = [...new Set(geojsonData.features.map(f => f.properties.departemen))].sort();
    departments.forEach(dept => {
      const option = document.createElement('option');
      option.value = dept;
      option.textContent = dept;
      departmentSelect.appendChild(option);
    });
  }
  

 function searchGareList(geojsonData){
    
    const inputS = document.getElementById("gareSearch")
    const gareList = document.getElementById("resultGareSearch");

    ["focus", "input", 'change'].forEach(event => inputS.addEventListener(event, resetMap));


    if (inputS === "") {
      gareList.innerHTML = ""; 
      return;
    }
    gareList.style.display = "block";
    const gares = geojsonData.features
        .map(feature => feature.properties.libelle)
        .filter(gare => gare.toLowerCase().includes(inputS.value.toLowerCase()));

    gareList.innerHTML = "";
    gares.forEach(gare => {
  
      const newLi = document.createElement("li");
      newLi.textContent = gare;
      newLi.addEventListener("click", () => {
        gareList.style.display = "none";
        selectgare(gare);
      });
      gareList.appendChild(newLi);
    });
}



/* affichage */
 function selectgare(gare) {
    const inputS = document.getElementById("gareSearch");
    
    inputS.value = gare;
  
    const feature = geojsonData.features.find(f => f.properties.libelle.toLowerCase() === gare.toLowerCase());
    if(feature){
      const coordinates = feature.geometry.coordinates;
      map.setView([coordinates[1], coordinates[0]], 13);
    }
  
    const formSearch = document.getElementById("gareForm");
    formSearch.addEventListener("submit", () => { 
      e => e.preventDefault();
    });
  
    inputS.value = "";
    afficherNomGare(gare);
    afficherMenu();
    afficherHoraires(feature);
  }
  
   function afficherNomGare(nomGare){
      const nomGareDiv = document.getElementById("nomGare");
  
      if(nomGareDiv){
          nomGareDiv.innerHTML = `<h2>${nomGare}</h2>`;
      }
  }
  
   function afficherMenu(){
      const menu = document.getElementById("menu");
      menu.style.display = "block";
  
      const menuLiens = document.querySelectorAll('#menu a');
      menuLiens.forEach(link => {
          link.addEventListener('click', e => {
              e.preventDefault();
              const target = link.getAttribute("data-target");
              afficherSection(target);
          })
      })
  }
  
   function afficherSection(target) {
      const allSections = document.querySelectorAll(".content-section");
      allSections.forEach(section => section.style.display = "none");
  
      const sectionOk = document.getElementById(target);
      if (sectionOk) {
          sectionOk.style.display = "block";
      }
  }
  
   function afficherHoraires(feature) {
      const divHoraire = document.getElementById("horaires");
      divHoraire.innerHTML = '';
  
      if (feature.properties.horaires) {
          const lignes = Object.entries(feature.properties.horaires);
          divHoraire.innerHTML += `<ul>`;
          lignes.forEach(([key, horaires]) => {
              divHoraire.innerHTML += `<li>${horaires.jour} : ${horaires.horaireNormaux}</li>`;
          });
          divHoraire.innerHTML += `</ul>`;
      } else {
          divHoraire.innerHTML = `<p>Horaires non disponibles.</p>`;
      }
  }
  
  



