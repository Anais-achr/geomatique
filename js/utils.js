const jourSemaine = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

/**
 * trie par jour de la semaine
 */
function trieJourSemaine(tab){
    tab.sort((horairesA, horairesB) => {
        const indexA = jourSemaine.indexOf(horairesA.jour);
        const indexB = jourSemaine.indexOf(horairesB.jour);

        return indexA - indexB;
    })

    return tab
}

/**
 * Renvoie vrai si une gare est ouverte en fonciton de ses horaires du jour et de l'heure actuelle
 */
function isGareOpen(horaires) {
    if(!horaires){
        return -1;
    }
    const maintenant = new Date();
    const heureActuelle = maintenant.getUTCHours();
    const minuteActuelle = maintenant.getUTCMinutes();

    const horairesDuJour = horaires[maintenant.getUTCDay()];

    if (!horairesDuJour || horairesDuJour.horaireNormaux.length === 0) {
        return -1;
    }

    const estOuvert = horairesDuJour.horaireNormaux.some(plage => {
        const [debut, fin] = plage.split('-'); 

        const [heureDebut, minuteDebut] = debut.split(':').map(Number); 
        const [heureFin, minuteFin] = fin.split(':').map(Number); 

        const minutesActuelles = heureActuelle * 60 + minuteActuelle;
        const minutesDebut = heureDebut * 60 + minuteDebut;
        const minutesFin = heureFin * 60 + minuteFin;

        if (minutesDebut > minutesFin) {
            return minutesActuelles >= minutesDebut || minutesActuelles <= minutesFin;
        } else {
            return minutesActuelles >= minutesDebut && minutesActuelles <= minutesFin;
        }
    });

    return estOuvert ? true : false;
}

/**
 * convertit une chaîne CSV en un tableau d'objets
 * 
 * cette fonction prend une chaine CSV et un séparateur (le séparateur présentdans la chaine CSV)
 */
function parseCSVToObject(csv, separator) {
    const lignes = csv.split("\n"); 
    const header = lignes[0].split(separator);
    const data = lignes.slice(1).map((ligne) => {
      const valeurs = ligne.split(separator);
      return header.reduce((acc, key, index) => {
        const value = valeurs[index]?.trim();
        
        acc[key.trim()] = value;
        return acc;
      }, {});
    });
    return data;
}

/**
 * met en forme une adresse à partir d'un objet
 */
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
