const jourSemaine = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

function trieJourSemaine(tab){
    tab.sort((horairesA, horairesB) => {
        const indexA = jourSemaine.indexOf(horairesA.jour);
        const indexB = jourSemaine.indexOf(horairesB.jour);

        return indexA - indexB;
    })

    return tab
}

/* function regrouperHorairesParJour(tab) {
    let horairesParJour = tab.reduce((acc, current) => {
        if (acc[current.jour_de_la_semaine]) {
            acc[current.jour_de_la_semaine].push(current.horaire_en_jour_normal);
        } else {
            acc[current.jour_de_la_semaine] = [current.horaire_en_jour_normal];
        }
        return acc; // Retourne l'accumulateur à chaque itération
    }, {}); // Initialise l'accumulateur comme un objet vide

    return Object.entries(horairesParJour).map(([jour, horaires]) => ({
        jour_de_la_semaine: jour,
        horaires: horaires.join(", "),
    }));
}
 */