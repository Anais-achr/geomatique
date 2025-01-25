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

//map et geojson data

/**
 * créer une couche GeoJson
 */
function createGeoJsonLayer(geojsonData) {
    return L.geoJSON(geojsonData, {
      onEachFeature: (feature, layer) => {
        setTimeout(() => {
          layer.on('click', () => { //affichage des données des gares au clique d'un marker
              affiche_tout(feature);
          });

          hoverMakerName(layer, feature); //hover sur les marker pour le nom des gares
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

/**
 * Initilalise le geoLayer avec les données geojsondata et les ajotue à la map
 */

function setupGeoJsonLayer(geojsonData) {
    geojsonLayer = createGeoJsonLayer(geojsonData);
    geojsonLayer.addTo(map);
}

/**
 * initialise une map
 */
function initializeMap() {
    map = L.map('map', {
      center: [48.4, 2.5],
      zoom: 6
    });
  
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>',
      maxZoom: 20,
    }).addTo(map);
}

/**
 * reinitialise la map avec ses données de base, sans les filtres
 */
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

/**
 * permet au survol d'un marker d'afficher le nom de la gare
 */
function hoverMakerName(layer, feature) {
    layer.bindPopup(feature.properties.libelle)
            .on('mouseover', function (e) {
            this.openPopup();
          })
            .on('mouseout', function (e) {
            this.closePopup();
          });
}

/**
 * dessine un cercle d'une couleur differente sur le marker selectionné poru le mettre en évidence 
 */
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
    map.setView([coordinates[1], coordinates[0]], 10);
}


//recherche d'une gare avec la barre de recherche

/**
 *  initialise la barre de recherche
 * */ 
function setupSearchBar(geojsonData) {
    const inputS = document.getElementById("gareSearch");
    
    //mettre à jour la liste des gare à chaque entrée/supression dans la barre de recherche
    inputS.addEventListener("input", () => {
        updateGareList(geojsonData); 
    });
}
/**
 *  met à jour la liste des gares en fonction du contenue de la barre de recherche
 */
function updateGareList(geojsonData) {
    const inputS = document.getElementById("gareSearch");
    const gareList = document.getElementById("resultGareSearch");
    const valueInput = inputS.value;
    if (valueInput === "") {
        gareList.innerHTML = "";
        gareList.style.display = "none";
        return;
    }

    //utilisation de Set pour eviter les doublons dans la liste
    const gares = [...new Set(geojsonData.features
        .map(feature => feature.properties.libelle)
        .filter(gare => gare.toLowerCase().startsWith(valueInput.toLowerCase())))];


    gareList.style.display = gares.length ? "block" : "none";

    gareList.innerHTML = "";

    //affichage en liste à puce
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

/**
 * affiche les information d'une gare selectionnée de la liste de la barre de recherche
 */
function selectGare(gare, geojsonData) {
    const inputS = document.getElementById("gareSearch");
    const formSearch = document.getElementById("gareForm");
    
    inputS.value = gare;
    
    //on recupere la feature de la gare choisie dans laliste des gares de la barre e recherche puis on l'affiche
    const feature = geojsonData.features.find(f => f.properties.libelle.toLowerCase() === gare.toLowerCase());
    if(feature){
      affiche_tout(feature)
    }
  
    formSearch.addEventListener("submit", () => e => e.preventDefault());
  
    inputS.value = "";
}


//recherche du'ne agre avec les departmeents

/**
 * initialise la liste des departements selects
 */
function setupDepartmentOptions(geojsonData, departmentSelect) {
    const departments = [...new Set(geojsonData.features.map(f => f.properties.departemen))].sort();
    departments.forEach(dept => {
      const option = document.createElement('option');
      option.value = dept;
      option.textContent = dept;
      departmentSelect.appendChild(option);
    });
}

/**
 * gère le changement de départmeent et met à jour la carte avec les données correspondantes
 */
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

/**
 * initialise la selection des departmeents et configure l'évenement de changement
 */
function setupDepartmentSelect(geojsonData) {
    const departmentSelect = document.getElementById('department-select');
    setupDepartmentOptions(geojsonData, departmentSelect);

    departmentSelect.addEventListener('change', (event) => {
      handleDepartmentChange(event.target.value, geojsonData);
    });
}

/**
 * initialise la selection de gare et configure l'évenement de changement
 */
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

/**
 * met à jhour la liste des gare
 */
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


//informations sur es gares
/**
 * recupère les données des gare du fichier 'liste-des-gares.geojson.
 * 
 * Ce fichier contient pour chaque gare des informations comme : le code uic, son nom, adresse, coordonnées geographique (lat, long)...
 *  
 */
async function loadGeojsonData() {
    const geojsonResponse = await fetch("../data/liste-des-gares.geojson");
    return await geojsonResponse.json();
}

/**
 * Affiche les informations d'une gare dans la section "info". L'état d'ouverture et l'adresse de la gare y sont affichés
 */
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
        divAdress.innerHTML += `<span><img src="../img/outil.png" alt=""></span>`;
        divAdress.innerHTML += `<p>${adr}</p>`;
    }
  
}
  


//horaires

/**
 * recupère les horaires des gares.
 *  
 */
async function loadHorairesData() {
    const response = await fetch("../data/horaires-des-gares1.csv");
    const text = await response.text();
  
    const data = parseCSVToObject(text, ";");
  
    return buildHoraires(data);
}

/**
 * Met en forme l'objet des horaires des gares: réunis les horaires par gare
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

/**
 * associe les horaires des gares à leur correspondance dans le GeoJSON.
 *
 * Avec l'objet contenant les horaires des gares, on les attache à leur gare correspondante dans le GeoJSON en créant une nouvelle propriété "horaires".
 */
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
 * affiche les horaires d'une gare sous forme d'un tableau
 */
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



//accessibilité
/**
 * recupère les accessibilités des gares.
 *  
 */
async function loadAccessibilites() {
    const response = await fetch("../data/equipements-accessibilite-en-gares.csv");
    const text = await response.text();

    const data = parseCSVToObject(text, ";");

    return buildAccessibilite(data);
}

/**
 * Met en forme l'objet des accessibilités des gares: réunis les accessibilité par gare
 */
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

/**
 * Ajoute les informations d'accessibilité aux gares du GeoJSON.
 *
 * Associe les données d'accessibilité à chaque gare en utilisant le code UIC.
 */
function attachAccessibiliteToStations(geojsonData, accessibilites) {
    geojsonData.features.forEach(feature => {
        const uic = feature.properties.code_uic;
        const gare = accessibilites[uic];

        if(gare) {
            feature.properties.accessibilites = Object.values(gare);
        }
    })

}

/**
 * Affiche les informations d'accessibilité d'une gare.
 *
 * Génère une liste avec des icônes et des descriptions correspondant aux équipements d'accessibilité
 * disponibles dans la gare sélectionnée.
 */
function afficheAccessibilites(feature) {
    const divAcc = document.getElementById("accessibilite");
    divAcc.innerHTML = '';
  
    if (feature.properties.accessibilites && feature.properties.accessibilites.length > 0) {
        const liste = document.createElement("ul");
  
        feature.properties.accessibilites.forEach(accessibilite => {
            const item = document.createElement("li");
            
            // Ajout d'une icône en fonction de l'accessibilité
            const icon = document.createElement("img");
            icon.alt = accessibilite;
            icon.className = "icon-accessibilite";
  
            // Attribution des icônes selon le type d'accessibilité
            switch (accessibilite) {
                case 'Toilettes':
                    icon.src = '/img/toilettes.jpeg';
                    break;
                case 'Toilettes adaptées aux personnes en fauteuil roulant':
                    icon.src = '/img/toilettes-adaptees.png';
                    break;
                case 'Assistance proposée pour accéder aux quais et monter / descendre du train':
                    icon.src = '/img/assistance.png';
                    break;
                case 'Information sonore en gare et/ou sur les quais':
                    icon.src = '/img/info-sonore.png';
                    break;
                case 'Bande d\'éveil de vigilance sur les quais':
                    icon.src = '/img/bande-vigilance.png';
                    break;
                case 'Présence du personnel':
                    icon.src = '/img/personnel.png';
                    break;
                case 'Écrans d\'information en gare et/ou sur les quais':
                    icon.src = '/img/ecrans-info.jpg';
                    break;
                case 'Boucle à induction magnétique':
                        icon.src = '/img/induction.png';
                        break;
                case 'Fauteuil roulant à disposition':
                        icon.src = '/img/fauteuil_roulant.jpg';
                        break;     
                case 'Accès par ascenseur, rampe ou de plain-pied, depuis l\'entrée':
                        icon.src = '/img/ascenseur.gif';
                        break;
                default:
                    icon.src = './icons/default.png';
                    break;
            }
  
            item.appendChild(icon);
            const text = document.createElement("span");
            text.textContent = accessibilite;
            item.appendChild(text);
  
            liste.appendChild(item);
        });
  
        divAcc.appendChild(liste);
    } else {
        divAcc.innerHTML = `<p>Aucune information d'accessibilité disponible pour cette gare.</p>`;
    }
}


//satisfaction
/**
 * recupère les satisfactions des gares.
 *  
 */
async function loadSatisfaction() {
    const response = await fetch("../data/satisfactions.csv");
    const text = await response.text();

    const data = parseCSVToObject(text, ",");
    return buildSatisfaction(data);
}

/**
 * Met en forme l'objet des satisfactions des gares
 * 
 */
function buildSatisfaction(satisfactionCSV) {
    return satisfactionCSV.reduce((acc, current) => {
        const code_uic = current.CODE_UIC 
        if (!acc[code_uic]) {
            acc[code_uic] = [];
        }
        acc[code_uic].push(current);
        return acc;
    }, {});
}

/**
 * construit un objet par gare contennat les notes de satisfactions, puis l'attache à la gare concernée en rajoutant la propriété "satisfaction"
 */
function attachSatisfactionToStations(geojsonData, satisfaction) {
  geojsonData.features.forEach(feature => {
      const uic = feature.properties.code_uic;
      const gareSatisfaction = satisfaction[uic];

      if (gareSatisfaction && gareSatisfaction.length > 0) {
          const satisfactionData = gareSatisfaction[0]; 
          const obj = {
            satisfaction_global: satisfactionData.satisfaction_global,
            orientation_client: satisfactionData.orientation_client,
            confort_attente: satisfactionData.confort_attente,
            bien_etre_en_gare: satisfactionData.bien_etre_en_gare
              
          };
          feature.properties.satisfaction = Object.entries(obj);
      }
  });
} 

/**
 * Mise en forme de l'affichage des satisfaction dans sa section
 */
function afficherSatisfaction(feature) {
    const divSatisfaction = document.getElementById("satisfaction");
    divSatisfaction.innerHTML = '';
  
    if (feature.properties.satisfaction) {
        const satisfaction = feature.properties.satisfaction;
        satisfaction.forEach(([key, value]) => {
          const div = document.createElement("div");
          const circle = document.createElement("span");
          circle.classList.add("cercleProgression");
          circle.classList.add("circletext");
        
          //remplace tous les "_" par un espace puis met en majucule la première lettre de la chaîne
          div.innerHTML = `<p>${key.replace(/_/g, ' ').replace(/^./, c => c.toUpperCase())}</p>`;
  
          if(value === undefined || value === "" || value === null || value === '-') {
            circle.innerHTML = "?";
            circle.style.background = `rgb(195, 192, 192)`
          } else {
            circle.classList.remove("noteInconnue");
            const pourcentage = (value / 10) * 100;
            
            //choix de la oculeu en fonction de la note
            let color;
            if(value <= 3){
                color = "#FF3B30";
            }else if (value <= 7) {
                color = "#FFCC00";
            } else {
                color = "#4CAF50";
            }
            circle.style.background = `conic-gradient(${color} ${pourcentage}%, #e0e0e0 ${pourcentage}%)`;
            circle.innerText = `${value}`;
          }
          div.appendChild(circle)
          divSatisfaction.appendChild(div);
        })
  
    } else {
        divSatisfaction.innerHTML = `<p>Informations de satisfaction non disponibles.</p>`;
    }
}


//autre affchage
/**
 * Affiche le nom de la gare dans sa div
 */
function afficherNomGare(nomGare){
    const nomGareDiv = document.getElementById("nomGare");

    if(nomGareDiv){
        nomGareDiv.innerHTML = `<h2>${nomGare}</h2>`;
    }
}

/**
 * Affiche le menu présentant les sections : informations, horaires, accessibilityés et satisfaction
 */
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
  
/**
 * Affiche une section spécifique en fonction de sa cible (target)
 *
 * Cette fonction désactive toutes les sections en supprimant la classe "active", 
 * puis active la section correspondante à l'identifiant donné (target) en lui ajoutant la classe "active"
 */
function afficherSection(target) {
    const allSections = document.querySelectorAll(".content-section");
    allSections.forEach(section => section.classList.remove("active"));

    const sectionOk = document.getElementById(target);
    if (sectionOk) {
    sectionOk.classList.add("active");
    }
}

function affiche_tout(feature) {
    drawGareSelected(feature);
    afficherNomGare(feature.properties.libelle);
    afficherMenu();
    afficherHoraires(feature);
    afficheInfo(feature);
    afficheAccessibilites(feature);
    afficherSatisfaction(feature);
}








