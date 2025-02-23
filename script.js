
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
        option.textContent = `Parcelle ${parcelle.id} - ${parcelle.commune}`;
        select.appendChild(option);
    });

    // Mise à jour des infos quand la sélection change
    select.addEventListener("change", async function() {
        const selectedIds = Array.from(this.selectedOptions).map(option => option.value);
        const selectedParcelles = parcelles.filter(p => selectedIds.includes(p.id));

        // récupérer les parcelles sélectionnées
        document.getElementById("charts-container").innerHTML = "";
        for (const parcelle of selectedParcelles) {
            const meteo = await getMeteo(parcelle.latitude, parcelle.longitude);
            afficherMeteoGraphique(parcelle, meteo);        }
    });

    const selectJours = document.getElementById("jours");
    selectJours.addEventListener("change", async function() {
        const selectedIds = Array.from(select.selectedOptions).map(option => option.value);
        const selectedParcelles = parcelles.filter(p => selectedIds.includes(p.id));

        // récupérer les parcelles sélectionnées
        document.getElementById("charts-container").innerHTML = "";
        for (const parcelle of selectedParcelles) {
            const meteo = await getMeteo(parcelle.latitude, parcelle.longitude);
            afficherMeteoGraphique(parcelle, meteo);        }
    });
}

async function getMeteo(lat, lon) {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,cloud_cover,wind_speed_10m`;

    const response = await fetch(url);
    const data = await response.json();
    console.log("Données météo horaires reçues :", data.hourly); // 🔍 Vérifie la structure reçue
    return data.hourly;
}

function afficherMeteo(parcelle, meteo) {
    const container = document.getElementById("meteo-container");
    
    let tableHTML = `
        <h3>Parcelle ${parcelle.id} - ${parcelle.commune}</h3>
        <table>
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Temp. Max (°C)</th>
                    <th>Couverture nuageuse (%)</th>
                    <th>Vent Max (km/h)</th>
                </tr>
            </thead>
            <tbody>
    `;
    console.log(meteo);
    for (let i = 0; i < 5; i++) {
        tableHTML += `
            <tr>
                <td>${meteo.time[i]}</td>
                <td>${meteo.temperature_2m_max[i]}</td>
                <td>${meteo.cloudcover_mean[i]}</td>
                <td>${meteo.windspeed_10m_max[i]}</td>
            </tr>
        `;
    
    }

    tableHTML += `</tbody></table>`;
    container.innerHTML += tableHTML;
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

chargerCSV();




