// On attend que le DOM soit chargé pour éviter les erreurs "null"
document.addEventListener("DOMContentLoaded", () => {

    // Variables de gestion d'état
    let currentStep = 1;
    const totalSteps = 6;
    const progressBar = document.getElementById('progressBar');
    const btnBack = document.getElementById('btnBack');
    let isAnimating = false; // Sécurité pour empêcher le double clic rapide

    // Initialisation
    updateProgress();
    updateUI(); // Important de l'appeler au début aussi

    // Fonction pour passer à l'étape suivante (rendue globale pour le HTML)
    window.nextStep = function () {
        if (currentStep < totalSteps && !isAnimating) {
            isAnimating = true; // Verrouille le clic

            // Petit délai pour laisser l'animation du "clic" se faire (UX)
            setTimeout(() => {
                // Masquer l'étape actuelle
                document.querySelector(`.step[data-step="${currentStep}"]`).classList.remove('active');

                // Incrémenter
                currentStep++;

                // Afficher la suivante
                document.querySelector(`.step[data-step="${currentStep}"]`).classList.add('active');

                updateUI();
                isAnimating = false; // Déverrouille
            }, 300); // 300ms de délai
        }
    };

    // Fonction pour revenir en arrière (rendue globale)
    window.prevStep = function () {
        if (currentStep > 1 && !isAnimating) {
            document.querySelector(`.step[data-step="${currentStep}"]`).classList.remove('active');
            currentStep--;
            document.querySelector(`.step[data-step="${currentStep}"]`).classList.add('active');
            updateUI();
        }
    };

    // Mise à jour de l'interface (Barre de progression + Bouton retour)
    function updateUI() {
        // Barre de progression
        const percentage = ((currentStep - 1) / (totalSteps - 1)) * 100;
        progressBar.style.width = percentage + '%';

        // Bouton retour (Caché si étape 1, sinon visible)
        if (currentStep === 1) {
            btnBack.style.visibility = 'hidden';
        } else {
            btnBack.style.visibility = 'visible';
        }
    }

    // Fonction de mise à jour initiale
    function updateProgress() {
        progressBar.style.width = '0%';
    }

    // Fonction finale de soumission (rendue globale)
    window.submitForm = function () {
        const form = document.getElementById('quizForm');
        const formData = new FormData(form);
        const profilData = {};

        formData.forEach((value, key) => {
            // Si la donnée existe déjà (cas des checkbox multiples comme 'sports')
            if (profilData.hasOwnProperty(key)) {
                // Si ce n'est pas encore un tableau, on le transforme en tableau avec l'ancienne valeur
                if (!Array.isArray(profilData[key])) {
                    profilData[key] = [profilData[key]];
                }
                // On ajoute la nouvelle valeur
                profilData[key].push(value);
            } else {
                // Sinon, on ajoute la donnée normalement
                profilData[key] = value;
            }
        });

        // Simulation effet de chargement
        const btn = document.querySelector('.btn-decathlon');
        const loader = document.getElementById('loader');

        btn.innerText = "GÉNÉRATION EN COURS...";
        btn.style.opacity = "0.7";
        loader.style.display = "inline-block";

        setTimeout(() => {
            console.log("DONNÉES FINALISÉES : ", profilData);

            const debug = document.getElementById('debug');
            debug.style.display = 'block';
            debug.innerText = "Données prêtes pour le niveau 2 :\n" + JSON.stringify(profilData, null, 2);

            btn.innerText = "C'EST PARTI !";
            btn.style.backgroundColor = "#5cb85c";
            btn.style.color = "white";
            loader.style.display = "none";

        }, 1500);
    };
    function showStep(stepIndex) {
        // ... ton code existant qui affiche l'étape ...

        // GESTION DU BOUTON PRÉCÉDENT
        const btnBack = document.getElementById('btnBack');

        if (stepIndex === 1) {
            // Si on est à l'étape 1, on cache le bouton (ou on le rend invisible)
            btnBack.style.visibility = 'hidden';
            // ou btnBack.style.display = 'none';
        } else {
            // Sinon, on l'affiche
            btnBack.style.visibility = 'visible';
            // ou btnBack.style.display = 'flex';
        }
    }
});