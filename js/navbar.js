document.addEventListener("DOMContentLoaded", function () {
    fetch("../html/navbar.html")
      .then(response => response.text())
      .then(html => {
        document.getElementById("navbar").innerHTML = html;
      })
      .catch(error => console.error("Erreur lors du chargement de la barre de navigation :", error));
  });