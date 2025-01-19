const jourSemaine = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

function trieJourSemaine(tab){
    tab.sort((horairesA, horairesB) => {
        const indexA = jourSemaine.indexOf(horairesA.jour);
        const indexB = jourSemaine.indexOf(horairesB.jour);

        return indexA - indexB;
    })

    return tab
}


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