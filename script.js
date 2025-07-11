
async function chargerCSV() {
    const response = await fetch("./Parcelles_Communes_Lat_Lon.csv"); // 📌 Remplace par le vrai chemin du fichier CSV
    const data = await response.text();
    const lignes = data.split("\n").slice(1); // Supprime l'en-tête

    const parcelles = lignes.map(ligne => {
        const [id, insee, num_demande, latitude, longitude,commune] = ligne.split(",");
        return { id, commune, latitude, longitude };
    });

    // Remplir la liste déroulante
    const select = document.getElementById("parcelle-select");
    parcelles.forEach(parcelle => {
        const option = document.createElement("option");
        option.value = parcelle.id;
        option.textContent = `${parcelle.id} - ${parcelle.commune}`;
        select.appendChild(option);
    });

    // Mise à jour des infos quand la sélection change
    select.addEventListener("change", async function() {
        const selectedIds = Array.from(this.selectedOptions).map(option => option.value);
        const selectedParcelles = parcelles.filter(p => selectedIds.includes(p.id));

       // Récupérer tous les boutons radio avec le nom 'option'
       var radios = document.getElementsByName('option');           // récupérer les parcelles sélectionnées
        document.getElementById("charts-container").innerHTML = "";
        for (const parcelle of selectedParcelles) {
            if (radios[0].checked) {
                const meteo = await getMeteo(parcelle.latitude, parcelle.longitude);
                afficherMeteoGraphique(parcelle, meteo);
            }
            if (radios[1].checked) {
                afficherMeteoInfoClimat(parcelle);
            }
        }
    });

    const selectJours = document.getElementById("jours");
    selectJours.addEventListener("change", async function() {
        const selectedIds = Array.from(select.selectedOptions).map(option => option.value);
        const selectedParcelles = parcelles.filter(p => selectedIds.includes(p.id));

       // Récupérer tous les boutons radio avec le nom 'option'
        var radios = document.getElementsByName('option');        
        // récupérer les parcelles sélectionnées
        document.getElementById("charts-container").innerHTML = "";
        for (const parcelle of selectedParcelles) {
            if (radios[0].checked) {
                const meteo = await getMeteo(parcelle.latitude, parcelle.longitude);
                afficherMeteoGraphique(parcelle, meteo);
            }
            if (radios[1].checked) {
                afficherMeteoInfoClimat(parcelle);
            }
        }
    });
}

async function getMeteo(lat, lon) {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,cloud_cover,wind_speed_10m`;

    const response = await fetch(url);
    const data = await response.json();
    console.log("Données météo horaires reçues :", data.hourly); // 🔍 Vérifie la structure reçue
    return data.hourly;
}

function afficherMeteoInfoClimat(parcelle) {
    const container = document.getElementById("charts-container");

    // Création d'un élément pour le titre
    const title = document.createElement("h3");
    title.textContent = `Parcelle ${parcelle.id} - ${parcelle.commune}`;
    container.appendChild(title);

    var iframe = document.createElement('iframe');
    console.log("Coordonnées lat : ", parcelle.latitude); // 🔍 Vérifie la structure reçue
    console.log("Coordonnées lon : ", parcelle.longitude); // 🔍 Vérifie la structure reçue
    
    // === Préparation de l'ajout de la ville dans l'adresse url ===
    const data = [parcelle.commune, "0", "0", ""];

    // === Conversion en JSON puis en Base64 ===
    const jsonString = JSON.stringify(data);

    // Pour encoder en Base64 correctement (UTF-8 compatible)
    function utf8ToBase64(str) {
    return btoa(unescape(encodeURIComponent(str)));
    }
    const base64String = utf8ToBase64(jsonString);

    console.log("Paramètre _inc à utiliser :");
    console.log(base64String);

    // Définir les attributs de l'iframe
    iframe.src = "https://www.infoclimat.fr/public-api/mixed/iframeSLIDE?_ll="+ parcelle.latitude +","+ parcelle.longitude + "&_inc=" + base64String + "&_auth=VE4EE1UrUnBRfAA3AHYBKABoU2YAdgkuA38AYwFqXyJUNFI0BWUHZAVpVitUewojUWIAfggzBzoEbwFhAGpUKFQoBGJVP1I5UT4AYQA1ATAALFMsACIJMAN%2FAHgBZF80VClSNwVgB2YFdFY8VGwKIFFgAGQIMwcgBHgBZwBqVDNUNgRlVTVSMlE4AGMAMgEqACxTNQA4CWIDNAA2AThfb1QzUjEFYgdiBTlWNFRhCiBRZABoCD4HNwRmAWAAb1QyVCgEf1VPUkNRIwAiAHIBYAB1Uy4AaglvAzQ%3D&_c=51c32b1539f551ef510c897a52ed177f"; // Fonction pour obtenir l'URL de l'iframe
    iframe.width = '888';
    iframe.height = '336';
    iframe.style.frameborderborder = '0';

    console.log("Iframe src: ", iframe.src); // 🔍 Vérifie la structure reçue


    // Ajouter l'iframe au conteneur
    container.appendChild(iframe);

}

function afficherMeteoGraphique(parcelle, meteo) {
    const container = document.getElementById("charts-container");

    // Création d'un élément pour le titre
    const title = document.createElement("h3");
    title.textContent = `Parcelle ${parcelle.id} - ${parcelle.commune}`;
    container.appendChild(title);

    // Création du <canvas> unique pour chaque parcelle
    const canvas = document.createElement("canvas");
    canvas.id = `chart-${parcelle.id}`;
    container.appendChild(canvas); // Ajoute le canvas au conteneur

    const ctx = canvas.getContext("2d");

    const select = document.getElementById("jours");
            
    // Récupérer la valeur sélectionnée
    const jours = parseInt(select.value);

    const heures = jours * 24;

    // On prend les 24 prochaines heures
    const labels = meteo.time.slice(0, heures);
    const temperatures = meteo.temperature_2m.slice(0, heures);
    const cloudcover = meteo.cloud_cover.slice(0, heures);
    const windspeed = meteo.wind_speed_10m.slice(0, heures);

    new Chart(ctx, {
        type: "line",
        data: {
            labels: labels,
            datasets: [
                {
                    label: "Température (°C)",
                    data: temperatures,
                    borderColor: "red",
                    backgroundColor: "rgba(255, 0, 0, 0.2)",
                    fill: true,
                },
                {
                    label: "Couverture Nuageuse (%)",
                    data: cloudcover,
                    borderColor: "blue",
                    backgroundColor: "rgba(0, 0, 255, 0.2)",
                    fill: true,
                },
                {
                    label: "Vitesse du Vent (km/h)",
                    data: windspeed,
                    borderColor: "green",
                    backgroundColor: "rgba(0, 255, 0, 0.2)",
                    fill: true,
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                x: { title: { display: true, text: "Heures" } },
                y: { title: { display: true, text: "Valeurs" } }
            }
        }
    });
}

// Écouteur d'événement pour la recherche
document.getElementById('search').addEventListener('input', function () {
    const recherche = this.value.toLowerCase(); // Convertir en minuscules pour éviter la casse
    filtrerOptions(recherche);
});

// Fonction pour filtrer les options affichées
function filtrerOptions(recherche) {
    const liste = document.getElementById('resultats');
    const items = liste.getElementsByTagName('li');

    for (let item of items) {
        const texte = item.textContent.toLowerCase();
        item.style.display = texte.includes(recherche) ? "" : "none"; // Affiche ou masque l'élément
    }
}

// Événement sur le bouton "Trier"
document.getElementById('btnTrier').addEventListener('click', function () {
    const critere = document.getElementById('tri').value; // Récupère le critère de tri
    trierEtMettreAJourMenu(critere);
});

// Fonction qui trie les données et met à jour la liste déroulante
function trierEtMettreAJourMenu(critere) {
    // Récupération des options du menu
    let menu = document.getElementById('parcelle-select'); // Sélection du menu déroulant
    let options = Array.from(menu.options); // Récupération des options actuelles

    // Tri des options en fonction du critère sélectionné
    options.sort((a, b) => {
        // Séparer "ID Parcelle - Commune"
        let [idA, communeA] = a.text.split(' - ');
        let [idB, communeB] = b.text.split(' - ');

        idA = parseInt(idA); // Convertir l'ID en nombre
        idB = parseInt(idB);

        // Gérer les valeurs manquantes
        if (!communeA) communeA = "A - Inconnue";
        if (!communeB) communeB = "A - Inconnue";
        idA = parseInt(idA) || 0; // Si ID vide, mettre 0
        idB = parseInt(idB) || 0;

        if (critere === 'commune') {
            return communeA.localeCompare(communeB); // Tri alphabétique par commune
        } else if (critere === 'parcelle') {
            return idA - idB; // Tri numérique par ID de parcelle
        }
        return 0;
    });
    // Mise à jour du menu déroulant avec les options triées
    menu.innerHTML = ""; // On vide le menu actuel

    // Réinsérer les options triées
    options.forEach(option => {
        let newOption = document.createElement("option"); // Création d'un nouvel élément <option>
        newOption.value = option.value; // Assigner la valeur d'origine
        newOption.textContent = option.text; // Assigner le texte d'origine
        menu.appendChild(newOption); // Ajouter à la liste déroulante
    });
}

function filtrerListe() {
    let recherche = document.getElementById("search").value.toLowerCase(); // Récupère la saisie utilisateur
    let liste = document.getElementById("parcelle-select"); // Sélectionne la liste déroulante
    let options = liste.options; // Récupère toutes les options du <select>

    for (let i = 0; i < options.length; i++) {
        let texte = options[i].text.toLowerCase(); // Texte de chaque option en minuscule

        if (texte.includes(recherche)) {
            options[i].style.display = "block"; // Afficher l'option si elle correspond à la recherche
        } else {
            options[i].style.display = "none"; // Masquer sinon
        }
    }
}

chargerCSV();




