/* import { initializeMap } from "./map";
import { loadGeojsonData, loadHorairesData, attachHorairesToStations } from "./data";
import { departementSelect, handleDepartmentChange } from "./filter";
import { afficherHoraires, afficherMenu, afficherSection, afficherNomGare } from "./affichage";

 */
let map, geojsonLayer, geojsonData, gareSelected = null

window.onload = async () => {
  try {
    initializeMap();

    geojsonData = await loadGeojsonData();
    const horaires = await loadHorairesData();
    const accessibilites = await loadAccessibilites(); 
    const satisfaction = await loadSatisfaction();

    attachHorairesToStations(geojsonData, horaires);
    attachAccessibiliteToStations(geojsonData, accessibilites);
    attachSatisfactionToStations(geojsonData, satisfaction);

    setupGeoJsonLayer(geojsonData);
    setupSearchBar(geojsonData);
    setupDepartmentSelect(geojsonData);
    setupStationSelect(geojsonData);

  } catch (error) {
    console.error("Une erreur est survenue :", error);
    alert("Une erreur est survenue : " + error.message);
  }
};


function setupGeoJsonLayer(geojsonData) {
    geojsonLayer = createGeoJsonLayer(geojsonData);
    geojsonLayer.addTo(map);
}


function setupSearchBar(geojsonData) {
    const inputS = document.getElementById("gareSearch");
    

    inputS.addEventListener("input", () => {
        updateGareList(geojsonData); 
    });
}

function updateGareList(geojsonData) {
    const inputS = document.getElementById("gareSearch");
    const gareList = document.getElementById("resultGareSearch");
    const valueInput = inputS.value;
    if (valueInput === "") {
        gareList.innerHTML = "";
        gareList.style.display = "none";
        return;
    }

    const gares = geojsonData.features
        .map(feature => feature.properties.libelle)
        .filter(gare => gare.toLowerCase().includes(valueInput.toLowerCase()));

    gareList.style.display = gares.length ? "block" : "none";

    gareList.innerHTML = "";

    gares.forEach(gare => {
        const newLi = document.createElement("li");
        newLi.textContent = gare;
        newLi.addEventListener("click", () => {
            gareList.style.display = "none";
            selectGare(gare, geojsonData); 
        });
        gareList.appendChild(newLi);
    });
}

function setupDepartmentSelect(geojsonData) {
    const departmentSelect = document.getElementById('department-select');
    setupDepartmentOptions(geojsonData, departmentSelect);

    departmentSelect.addEventListener('change', (event) => {
      handleDepartmentChange(event.target.value, geojsonData);
    });
}

function setupStationSelect(geojsonData) {
    const stationSelect = document.getElementById("station-select");
    stationSelect.addEventListener('change', () => {
        const coordinates = JSON.parse(stationSelect.value);
        if (coordinates) {
            const feature = geojsonData.features.find(f => {
                const featureCoordinates = f.geometry.coordinates;
                return featureCoordinates[0] === coordinates[0] && featureCoordinates[1] === coordinates[1];
            });

            if (feature) {
                affiche_tout(feature);
            }
        }
    });
}

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
    if(gareSelected) {
        map.removeLayer(gareSelected);
    }
    geojsonLayer = createGeoJsonLayer(geojsonData);
    geojsonLayer.addTo(map);
}

function hoverMakerName(layer, feature) {
    layer.bindPopup(feature.properties.libelle)
            .on('mouseover', function (e) {
            this.openPopup();
          })
            .on('mouseout', function (e) {
            this.closePopup();
          });
}


 function createGeoJsonLayer(geojsonData) {
    return L.geoJSON(geojsonData, {
      onEachFeature: (feature, layer) => {
        setTimeout(() => {
          layer.on('click', () => {
              affiche_tout(feature);
          });

          hoverMakerName(layer, feature);
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

function parseCSVToObject(csv) {
    const lignes = csv.split("\n"); 
    const header = lignes[0].split(";");
    const data = lignes.slice(1).map((ligne) => {
      const valeurs = ligne.split(";");
      return header.reduce((acc, key, index) => {
        const value = valeurs[index]?.trim();
  
        acc[key.trim()] = value;
        return acc;
      }, {});
    });

    return data;
}

async function loadHorairesData() {
    const response = await fetch("horaires-des-gares1.csv");
    const text = await response.text();
  
    const data = parseCSVToObject(text);
  
    return buildHoraires(data);
}
/* accessibilité */
function buildAccessibilite(accessibilitesCSV) {
    return accessibilitesCSV.reduce((acc, current)  => {
        const gare = current.UIC;

        if (!acc[gare]) {
            acc[gare] = [];
        }
        acc[gare].push(current.accessibilite);
        return acc;
    }, {})

}

function buildSatisfaction(satisfactionCSV) {
    console.log("Données CSV :", satisfactionCSV); // Debug
    return satisfactionCSV.reduce((acc, current) => {
        const code_uic = current.CODE_UIC;
        acc[code_uic] = {
            satisfactionGlobal: current.satisfactionGlobal
        };
        return acc;
    }, {});
}





async function loadAccessibilites() {
    const response = await fetch("equipements-accessibilite-en-gares.csv");
    const text = await response.text();

    const data = parseCSVToObject(text);

    return buildAccessibilite(data);
}

async function loadSatisfaction() {
    const response = await fetch("out.csv");
    const text = await response.text();

    const data = parseCSVToObject(text);

    return buildSatisfaction(data);
}




Promise.all([
    fetch('geojson_file.geojson').then(res => res.json()),
    fetch('out.csv').then(res => res.text())
]).then(([geojsonData, csvData]) => {
    const satisfactionCSV = parseCSV(csvData); // Fonction pour parser le CSV
    const satisfaction = buildSatisfaction(satisfactionCSV);
    attachSatisfactionToStations(geojsonData, satisfaction);

    // Vérifiez les données finales
    console.log("GeoJSON après ajout de satisfaction :", geojsonData);
});

function attachAccessibiliteToStations(geojsonData, accessibilites) {
    geojsonData.features.forEach(feature => {
        const uic = feature.properties.code_uic;
        const gare = accessibilites[uic];

        if(gare) {
            feature.properties.accessibilites = Object.values(gare);
        }
    })

}

function attachSatisfactionToStations(geojsonData, satisfaction) {
    geojsonData.features.forEach(feature => {
        const uic = String(feature.properties.code_uic).trim();
        console.log(`Recherche satisfaction pour ${uic}`); // Debug
        const gareSatisfaction = satisfaction[uic];

        if (gareSatisfaction) {
            feature.properties.satisfactionGlobal = gareSatisfaction.satisfactionGlobal;
            console.log(`Satisfaction trouvée pour ${uic}:`, gareSatisfaction.satisfactionGlobal);
        } else {
            console.log(`Pas de satisfaction pour ${feature.properties.libelle} (${uic})`);
        }
    });
}



/* gestion horaires */
 function attachHorairesToStations(geojsonData, horaires) {
    geojsonData.features.forEach(feature => {
        const libelle = feature.properties.libelle;
        const gare = horaires[libelle];

        if(gare) {
            const horairesRegroupe = {};
            
            gare.forEach(j => {
                const jour = j.jour_de_la_semaine;

                if(!horairesRegroupe[jour]) {
                    horairesRegroupe[jour] = {
                        jour: jour,
                        horaireNormaux: [],
                        horaireFerie: []
                    }
                }

                if(j.horaire_en_jour_normal) {
                    horairesRegroupe[jour].horaireNormaux
                    .push(j.horaire_en_jour_normal);
                    horairesRegroupe[jour].horaireNormaux
                    .sort()
                }

                if(j.horaire_en_jour_ferie) {
                    horairesRegroupe[jour].horaireFerie
                    .push(j.horaire_en_jour_ferie);
                    horairesRegroupe[jour].horaireFerie
                    .sort();
                }
            })

            feature.properties.horaires = trieJourSemaine(Object.values(horairesRegroupe));
        }
    })
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

function buildSatisfaction(satisfactionCSV) {
    return satisfactionCSV.reduce((acc, current) => {
        const code_uic = String(current.CODE_UIC).trim();    if (!acc[code_uic]) {
        acc[code_uic] = [];
    }
    acc[code_uic].push(current);
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
        ? resetMap()
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


 function setupDepartmentOptions(geojsonData, departmentSelect) {
    const departments = [...new Set(geojsonData.features.map(f => f.properties.departemen))].sort();
    departments.forEach(dept => {
      const option = document.createElement('option');
      option.value = dept;
      option.textContent = dept;
      departmentSelect.appendChild(option);
    });
  }

/* affichage */
 function selectGare(gare, geojsonData) {
    const inputS = document.getElementById("gareSearch");
    const formSearch = document.getElementById("gareForm");
    
    inputS.value = gare;
  
    const feature = geojsonData.features.find(f => f.properties.libelle.toLowerCase() === gare.toLowerCase());
    if(feature){
      affiche_tout(feature)
    }
  
    formSearch.addEventListener("submit", () => e => e.preventDefault());
  
    inputS.value = "";
    
}

async function drawGareSelected(feature) {
    resetMap();
    const coordinates = feature.geometry.coordinates;
    gareSelected = L.circleMarker([coordinates[1], coordinates[0]], {
        color: 'red',        
        fillColor: 'red',    
        fillOpacity: 0.8,    
        radius: 8           
    }).addTo(map);
    hoverMakerName(gareSelected, feature);
    console.log(feature.properties.address)
    map.setView([coordinates[1], coordinates[0]], 10);
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
      allSections.forEach(section => section.classList.remove("active"));
  
      const sectionOk = document.getElementById(target);
      if (sectionOk) {
        sectionOk.classList.add("active");
      }
  }
  
   function afficherHoraires(feature) {
      const divHoraire = document.getElementById("horaires");
      divHoraire.innerHTML = '';
  
      if (feature.properties.horaires) {
          const lignes = Object.entries(feature.properties.horaires);

          const tableau = document.createElement("table");
          tableau.classList.add("horaireTableau");

          const thead = document.createElement("thead");
          thead.innerHTML = `
            <tr>
                <th>Jour</th>
                <th>Horaire normaux</th>
                <th>Horaire Férié</th>
            </tr>
          `;
          tableau.appendChild(thead);
          
          const tbody = document.createElement("tbody");
           
          lignes.forEach(([key, horaire]) => {
            const ligne = document.createElement("tr");

            ligne.innerHTML = `
                <td>${horaire.jour}</td>
                <td>${horaire.horaireNormaux.join(' - ')}</td>
                <td>${horaire.horaireFerie.join(' - ')}</td>
            `;

            tbody.appendChild(ligne);
          })


          tableau.appendChild(tbody);
          divHoraire.appendChild(tableau);
      } else {
          divHoraire.innerHTML = `<p>Horaires non disponibles.</p>`;
      }
  }

  /*function afficherSatisfaction(feature) {
    const divSatisfaction = document.getElementById("satisfaction");
    divSatisfaction.innerHTML = '';

    if (feature.properties.satisfactionGlobal) {
        const satisfaction = feature.properties.satisfactionGlobal;

        divSatisfaction.innerHTML = `
          <table class="satisfactionTableau">
            <thead>
              <tr><th>Satisfaction Globale</th></tr>
            </thead>
            <tbody>
              <tr><td>${satisfaction}</td></tr>
            </tbody>
          </table>
        `;
    } else {
        divSatisfaction.innerHTML = `<p>Informations de satisfaction non disponibles.</p>`;
    }
}*/


function formatAdress(adresse) {
    let adressComplete = '';

    if(adresse.number) {
        adressComplete += adresse.number + ', '
    }

    if(adresse.road) {
        adressComplete += adresse.road + ', '
    }

    if(adresse.county) {
        adressComplete += adresse.county + ', '
    }

    if(adresse.postcode) {
        adressComplete += adresse.postcode + ', '
    }

    if(adresse.country) {
        adressComplete += adresse.country
    }

    if(adressComplete.startsWith(',')) {
        adressComplete = adressComplete.slice(0, -2);
    }

    return adressComplete
}

function afficheInfo(feature) {
    const divStatus = document.getElementById("status");
    divStatus.innerHTML = '';
    let classStatus;
    let cercleStatus;
    let status;

    const horaires = feature?.properties?.horaires;

    switch (isGareOpen(horaires)) {
        case -1:
        case undefined:
            status = 'Ouverture Indeterminée';
            cercleStatus = 'cercleInconnu';
            classStatus = 'inconnuStatus';  
            break;
        case true:
            status = 'Ouvert';
            cercleStatus = 'cercleOuvert';
            classStatus = 'ouvertStatus';  
            break;
        case false:
            status = 'Fermée';
            cercleStatus = 'cercleFerme';
            classStatus = 'fermeeStatus';  
            break;
        default:
            status = 'Ouverture Indeterminée';
            cercleStatus = 'cercleInconnu';
            classStatus = 'inconnuStatus';  
            break;
    }
    divStatus.className = classStatus;
    divStatus.innerHTML += `
        <span id="${cercleStatus}"></span>
        <p>${status}</p>`;


    const divAdress = document.getElementById("adresse");
    divAdress.innerHTML = '';

    if(feature.properties.address){
        const adr = formatAdress(feature.properties.address)
        divAdress.innerHTML += `<span><img src="./outil.png" alt=""></span>`;
        divAdress.innerHTML += `<p>${adr}</p>`;
    }

}

// function afficheAccessibilites(feature) {
//     const divAcc = document.getElementById("accessibilite");
//     divAcc.innerHTML = '';
//     if(feature.properties.accessibilites) {
//         console.log(feature.properties.accessibilites);
//     } else { 
//         console.log("aucune accessibilité connue");
//     }
// }

function afficheAccessibilites(feature) {
    const divAcc = document.getElementById("accessibilite");
    divAcc.innerHTML = '';

    if (feature.properties.accessibilites && feature.properties.accessibilites.length > 0) {
        const titre = document.createElement("h3");
        titre.textContent = "Accessibilités disponibles :";
        divAcc.appendChild(titre);

        const liste = document.createElement("ul");

        feature.properties.accessibilites.forEach(accessibilite => {
            const item = document.createElement("li");
            item.textContent = accessibilite;
            liste.appendChild(item);
        });

        divAcc.appendChild(liste);
    } else {
        divAcc.innerHTML = `<p>Aucune information d'accessibilité disponible pour cette gare.</p>`;
    }
}


function affiche_tout(feature) {
    drawGareSelected(feature);
    afficherNomGare(feature.properties.libelle);
    afficherMenu();
    afficherHoraires(feature);
    afficheAccessibilites(feature);
    afficherSatisfaction(feature);
    afficheInfo(feature);
}



